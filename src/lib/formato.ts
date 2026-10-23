const MENOS = '−'; // signo menos tipográfico, más legible que el guion

export function temp(n: number, decimales = 1): string {
  return (n < 0 ? MENOS : '') + Math.abs(n).toFixed(decimales) + ' °C';
}

export function ritmo(n: number | null): string {
  if (n === null) return '—';
  return (n < 0 ? MENOS : '+') + Math.abs(n).toFixed(1) + ' °C/h';
}

export function hora(inicio: Date, t: number): string {
  const d = new Date(inicio.getTime() + t * 60000);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function tramo(inicio: Date, desde: number, hasta: number): string {
  return desde === hasta ? hora(inicio, desde) : `${hora(inicio, desde)}–${hora(inicio, hasta)}`;
}

export function duracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

export function numeroSonda(nombre: string): string {
  return nombre.replace(/^Sensor\s*/i, '');
}
