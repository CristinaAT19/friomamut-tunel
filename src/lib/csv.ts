import type { Sonda } from './tipos';

export type CsvLeido = { inicio: Date; sondas: Sonda[]; totalLecturas: number };

const COLUMNAS = ['fecha_hora', 'sonda', 'tipo', 'temperatura_c'];

// "2026-10-07 01:20" -> Date en hora local
function leerFecha(texto: string): Date | null {
  const m = texto.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  const [, a, mes, d, h, mi] = m.map(Number);
  return new Date(a, mes - 1, d, h, mi);
}

// Lanza un Error si el CSV del proyecto no tiene el formato esperado.
export function leerCsv(texto: string): CsvLeido {
  const lineas = texto.trim().split(/\r?\n/);
  const cabecera = lineas[0]?.split(',').map((c) => c.trim().toLowerCase());
  if (!cabecera || COLUMNAS.some((c, i) => cabecera[i] !== c)) {
    throw new Error(`El archivo debe tener las columnas: ${COLUMNAS.join(', ')}.`);
  }

  const filas: { fecha: Date; sonda: string; tipo: string; temp: number }[] = [];
  for (const linea of lineas.slice(1)) {
    if (!linea.trim()) continue;
    const [f, sonda, tipo, valor] = linea.split(',');
    const fecha = leerFecha(f ?? '');
    const temp = Number(valor);
    // Las filas rotas se saltan: no se inventa nada
    if (!fecha || !sonda || Number.isNaN(temp)) continue;
    filas.push({ fecha, sonda: sonda.trim(), tipo: (tipo ?? '').trim(), temp });
  }
  if (filas.length === 0) throw new Error('El archivo no tiene lecturas válidas.');

  const inicio = new Date(Math.min(...filas.map((f) => f.fecha.getTime())));
  const porNombre = new Map<string, Sonda>();
  for (const f of filas) {
    let s = porNombre.get(f.sonda);
    if (!s) {
      s = { nombre: f.sonda, tipo: f.tipo === 'aire' ? 'aire' : 'pulpa', lecturas: [], porMinuto: new Map() };
      porNombre.set(f.sonda, s);
    }
    const t = Math.round((f.fecha.getTime() - inicio.getTime()) / 60000);
    s.lecturas.push({ t, temp: f.temp });
    s.porMinuto.set(t, f.temp);
  }
  for (const s of porNombre.values()) s.lecturas.sort((a, b) => a.t - b.t);

  return { inicio, sondas: [...porNombre.values()], totalLecturas: filas.length };
}
