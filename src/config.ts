// Datos del proceso que NO vienen en el CSV (los da la planta).
export const OBJETIVO = -1.0;

export const PROCESO = {
  titulo: 'Proceso 133',
  detalle: 'Uva · 14 paletas',
};

// Reglas para decidir qué es "incómodo" en los datos. Todas en minutos o °C.
export const REGLAS = {
  arranqueMin: 15, // los primeros minutos el aire y las sondas se acomodan: no se evalúan
  saltoC: 1.0, // cambio entre lecturas seguidas que la pulpa no puede hacer de verdad
  sinSenalMin: 15, // sin lecturas por más de esto = sin señal
  ritmoVentanaMin: 30, // ventana para calcular el ritmo de enfriamiento
  bajandoCxH: -0.5, // ritmo desde el que se considera que "baja"
  huecoMin: 3, // huecos más cortos que esto no cortan las líneas del gráfico
  corteFraccion: 0.5, // corte de red: falta más de la mitad de las sondas…
  corteDuracionMin: 10, // …durante al menos 10 minutos
};
