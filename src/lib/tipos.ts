// t = minutos desde el inicio del proceso
export type Lectura = { t: number; temp: number };

export type Sonda = {
  nombre: string;
  tipo: 'pulpa' | 'aire';
  lecturas: Lectura[];
  porMinuto: Map<number, number>;
};

export type TipoAviso = 'pulpaFria' | 'sinSenal' | 'inversion' | 'aireTibio' | 'corteRed';

export type Aviso = {
  tipo: TipoAviso;
  desde: number;
  hasta: number;
  dato: string;
  sonda?: string; // vacío = aviso del túnel (aire o red)
  duranteInversion?: boolean; // ocurrió mientras el aire estaba invertido
};

export type Estado = 'llego' | 'bajando' | 'estancado' | 'sinSenal';

export type ResumenSonda = {
  nombre: string;
  temp: number; // última lectura
  tUltima: number;
  falta: number; // °C que le faltan para el objetivo (0 si ya llegó)
  ritmo: number | null; // °C por hora en la ventana reciente
  minutosParaLlegar: number | null;
  estado: Estado;
  avisos: Aviso[];
  lecturas: Lectura[];
};

export type Proceso = {
  inicio: Date;
  fin: number; // último minuto con datos
  totalLecturas: number;
  sondas: ResumenSonda[]; // pulpa, de la más caliente a la más fría
  ambiente: Sonda;
  retorno: Sonda;
  pulpa: Sonda[];
  avisos: Aviso[]; // todos, del más nuevo al más viejo
};
