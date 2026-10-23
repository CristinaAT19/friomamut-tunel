import { REGLAS } from '../config';
import type { Lectura } from './tipos';

export type Escala = { x: (t: number) => number; y: (temp: number) => number };

export function crearEscala(
  [t0, t1]: [number, number],
  [min, max]: [number, number],
  ancho: number,
  alto: number,
): Escala {
  return {
    x: (t) => ((t - t0) / (t1 - t0 || 1)) * ancho,
    y: (temp) => ((max - temp) / (max - min || 1)) * alto,
  };
}

// Corta la serie donde hay huecos largos: así el gráfico no "inventa" la línea
export function segmentos(lecturas: Lectura[], desde: number, hasta: number): Lectura[][] {
  const partes: Lectura[][] = [];
  let actual: Lectura[] = [];
  for (const l of lecturas) {
    if (l.t < desde || l.t > hasta) continue;
    const anterior = actual[actual.length - 1];
    if (anterior && l.t - anterior.t > REGLAS.huecoMin) {
      partes.push(actual);
      actual = [];
    }
    actual.push(l);
  }
  if (actual.length) partes.push(actual);
  return partes;
}

// Primera lectura con l.t >= t (búsqueda binaria: las lecturas vienen ordenadas)
function indiceDesde(lecturas: Lectura[], t: number): number {
  let lo = 0;
  let hi = lecturas.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lecturas[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Lectura más cercana a t, si está a menos de un hueco corto. No se inventan valores en los huecos largos.
export function lecturaCerca(lecturas: Lectura[], t: number, tolerancia = REGLAS.huecoMin): Lectura | undefined {
  const i = indiceDesde(lecturas, t);
  const candidatas = [lecturas[i - 1], lecturas[i]].filter((l): l is Lectura => l !== undefined);
  const mejor = candidatas.sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];
  return mejor && Math.abs(mejor.t - t) <= tolerancia ? mejor : undefined;
}

export function rutaLinea(partes: Lectura[][], e: Escala): string {
  return partes
    .map((p) => p.map((l, i) => `${i === 0 ? 'M' : 'L'}${e.x(l.t).toFixed(1)},${e.y(l.temp).toFixed(1)}`).join(' '))
    .join(' ');
}
