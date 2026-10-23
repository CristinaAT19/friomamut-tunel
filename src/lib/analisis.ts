import { OBJETIVO, REGLAS } from '../config';
import { leerCsv } from './csv';
import { temp } from './formato';
import type { Aviso, Estado, Lectura, Proceso, ResumenSonda, Sonda } from './tipos';

// Junta minutos sueltos en tramos: [600, 601, 603] con tolerancia 2 -> [[600, 603]]
function agruparTramos(minutos: number[], tolerancia: number): [number, number][] {
  const tramos: [number, number][] = [];
  for (const t of minutos) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && t - ultimo[1] <= tolerancia) ultimo[1] = t;
    else tramos.push([t, t]);
  }
  return tramos;
}

// °C por hora en la ventana reciente, sin contar los saltos (no son enfriamiento real)
function calcularRitmo(lecturas: Lectura[]): number | null {
  const ultima = lecturas[lecturas.length - 1];
  const ventana = lecturas.filter((l) => l.t >= ultima.t - REGLAS.ritmoVentanaMin);
  const minutos = ultima.t - ventana[0].t;
  if (minutos < 10) return null;
  let cambio = 0;
  for (let i = 1; i < ventana.length; i++) {
    const delta = ventana[i].temp - ventana[i - 1].temp;
    if (Math.abs(delta) < REGLAS.saltoC) cambio += delta;
  }
  return (cambio / minutos) * 60;
}

// Inversión: el aire que vuelve queda igual o más frío que el que entra
function minutosDeInversion(ambiente: Sonda, retorno: Sonda): number[] {
  return ambiente.lecturas
    .map((l) => l.t)
    .filter((t) => {
      const ret = retorno.porMinuto.get(t);
      return t >= REGLAS.arranqueMin && ret !== undefined && ret <= ambiente.porMinuto.get(t)!;
    });
}

// El aire tarda un par de minutos en volver a la normalidad después de invertirse
function cercaDeInversion(inversion: number[], t: number): boolean {
  return inversion.some((i) => Math.abs(i - t) <= 2);
}

function avisosDelTunel(pulpa: Sonda[], ambiente: Sonda, inversion: number[], fin: number): Aviso[] {
  const avisos: Aviso[] = [];

  for (const [desde, hasta] of agruparTramos(inversion, 2)) {
    avisos.push({ tipo: 'inversion', desde, hasta, dato: 'Retorno bajo Ambiente' });
  }

  const aireTibio = ambiente.lecturas.filter((l) => l.temp > OBJETIVO);
  for (const [desde, hasta] of agruparTramos(aireTibio.map((l) => l.t), 15)) {
    const max = Math.max(...aireTibio.filter((l) => l.t >= desde && l.t <= hasta).map((l) => l.temp));
    avisos.push({ tipo: 'aireTibio', desde, hasta, dato: `Entra hasta ${temp(max)}` });
  }

  // Corte de red: minutos en que falta más de la mitad de las sondas de pulpa
  const minutosCorte: number[] = [];
  for (let t = 0; t <= fin; t++) {
    const presentes = pulpa.filter((s) => s.porMinuto.has(t)).length;
    if (presentes < pulpa.length * REGLAS.corteFraccion) minutosCorte.push(t);
  }
  for (const [desde, hasta] of agruparTramos(minutosCorte, 1)) {
    if (hasta - desde + 1 < REGLAS.corteDuracionMin) continue;
    avisos.push({ tipo: 'corteRed', desde, hasta, dato: `${pulpa.length} sondas sin datos` });
  }
  return avisos;
}

// Pulpa más fría que el aire que entra (fuera de una inversión): la sonda está fallando
function avisosPulpaFria(s: Sonda, ambiente: Sonda, inversion: number[]): Aviso[] {
  const frias = s.lecturas.filter((l) => {
    const amb = ambiente.porMinuto.get(l.t);
    return l.t >= REGLAS.arranqueMin && amb !== undefined && l.temp < amb;
  });
  return agruparTramos(frias.map((l) => l.t), 2).map(([desde, hasta]) => {
    const l = frias.find((f) => f.t === desde)!;
    const amb = ambiente.porMinuto.get(desde)!;
    // Se avisa igual, pero se marca: durante una inversión Ambiente mide aire que ya pasó por la fruta
    return {
      tipo: 'pulpaFria',
      desde,
      hasta,
      sonda: s.nombre,
      dato: `${s.nombre} · ${temp(l.temp)} vs ${temp(amb)}`,
      duranteInversion: cercaDeInversion(inversion, desde),
    };
  });
}

function resumirSonda(s: Sonda, ambiente: Sonda, inversion: number[], fin: number): ResumenSonda {
  const ultima = s.lecturas[s.lecturas.length - 1];
  const sinSenal = fin - ultima.t > REGLAS.sinSenalMin;
  // Sin señal no hay ritmo actual: calcularlo con datos viejos engañaría
  const ritmo = sinSenal ? null : calcularRitmo(s.lecturas);

  let estado: Estado = 'estancado';
  if (sinSenal) estado = 'sinSenal';
  else if (ultima.temp <= OBJETIVO) estado = 'llego';
  else if (ritmo !== null && ritmo <= REGLAS.bajandoCxH) estado = 'bajando';

  const falta = Math.max(0, ultima.temp - OBJETIVO);
  const avisos = avisosPulpaFria(s, ambiente, inversion);
  if (sinSenal) avisos.push({ tipo: 'sinSenal', desde: ultima.t, hasta: fin, sonda: s.nombre, dato: s.nombre });
  avisos.sort((a, b) => b.desde - a.desde);

  return {
    nombre: s.nombre,
    temp: ultima.temp,
    tUltima: ultima.t,
    falta,
    ritmo,
    minutosParaLlegar: estado === 'bajando' && ritmo ? Math.round((falta / -ritmo) * 60) : null,
    estado,
    avisos,
    lecturas: s.lecturas,
  };
}

// Avisos que importan al mirar una sonda: los propios y los del túnel que cambian la lectura.
// "Aire sobre −1.0 °C" dura casi todo el proceso: nombrarlo en cada minuto sería ruido.
export function avisosParaSonda(p: Proceso, s: ResumenSonda): Aviso[] {
  return [...s.avisos, ...p.avisos.filter((a) => !a.sonda && a.tipo !== 'aireTibio')];
}

export function analizar(texto: string): Proceso {
  const { inicio, sondas, totalLecturas } = leerCsv(texto);
  const ambiente = sondas.find((s) => s.nombre.toLowerCase() === 'ambiente');
  const retorno = sondas.find((s) => s.nombre.toLowerCase() === 'retorno');
  const pulpa = sondas.filter((s) => s.tipo === 'pulpa');
  if (!ambiente || !retorno) throw new Error('Faltan las sondas de aire "Ambiente" y "Retorno".');
  if (pulpa.length === 0) throw new Error('El archivo no tiene sondas de pulpa.');

  const fin = Math.max(...sondas.map((s) => s.lecturas[s.lecturas.length - 1].t));
  const inversion = minutosDeInversion(ambiente, retorno);
  const resumen = pulpa
    .map((s) => resumirSonda(s, ambiente, inversion, fin))
    .sort((a, b) => b.temp - a.temp);

  const avisos = [...avisosDelTunel(pulpa, ambiente, inversion, fin), ...resumen.flatMap((s) => s.avisos)];
  avisos.sort((a, b) => b.desde - a.desde);

  return { inicio, fin, totalLecturas, sondas: resumen, ambiente, retorno, pulpa, avisos };
}
