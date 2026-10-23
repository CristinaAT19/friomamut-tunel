import type { Estado, TipoAviso } from './tipos';

export const NOMBRE_AVISO: Record<TipoAviso, string> = {
  pulpaFria: 'Pulpa más fría que el aire',
  sinSenal: 'Sin señal',
  inversion: 'Aire invertido',
  aireTibio: 'Aire sobre −1.0 °C',
  corteRed: 'Corte de red',
};

export const COLOR_ESTADO: Record<Estado, string> = {
  llego: '#1D7A68',
  bajando: '#1D7A68',
  estancado: '#D98A2B',
  sinSenal: '#C8492A',
};
