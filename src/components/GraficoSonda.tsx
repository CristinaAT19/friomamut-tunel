import { OBJETIVO } from '../config';
import * as f from '../lib/formato';
import { crearEscala, lecturaCerca, rutaLinea, segmentos } from '../lib/graficos';
import { NOMBRE_AVISO } from '../lib/textos';
import type { Aviso, Lectura } from '../lib/tipos';
import { CursorGrafico, type InfoCursor } from './CursorGrafico';

type Props = {
  lecturas: Lectura[];
  ventana: [number, number]; // minutos desde/hasta
  dominio: [number, number]; // °C min/max, compartido entre sondas para poder compararlas
  color: string;
  alto: number;
  etiqueta: string;
  // Para el cursor: hora real, aire que entra y avisos que se nombran en cada minuto
  inicio: Date;
  ambiente: Lectura[];
  avisos: Aviso[];
  fijable?: boolean;
  className?: string;
};

const ANCHO = 160; // unidades internas del viewBox: el SVG se estira al ancho disponible
const ALTO = 40;

export function GraficoSonda({
  lecturas,
  ventana,
  dominio,
  color,
  alto,
  etiqueta,
  inicio,
  ambiente,
  avisos,
  fijable,
  className = '',
}: Props) {
  const e = crearEscala(ventana, dominio, ANCHO, ALTO);
  const yObjetivo = e.y(OBJETIVO);
  const inversiones = avisos.filter((a) => a.tipo === 'inversion');

  const describir = (t: number): InfoCursor => {
    const pulpa = lecturaCerca(lecturas, t);
    const tCursor = pulpa?.t ?? t;
    const aire = lecturaCerca(ambiente, tCursor);
    // Solo los avisos que incluyen este minuto exacto
    const activos = avisos.filter((a) => a.desde <= tCursor && tCursor <= a.hasta);
    return {
      t: tCursor,
      titulo: f.hora(inicio, tCursor),
      filas: [
        ['Pulpa', pulpa ? f.temp(pulpa.temp) : 'sin lectura'],
        ...(pulpa ? [['Faltan', f.temp(Math.max(0, pulpa.temp - OBJETIVO))] as [string, string]] : []),
        ['Aire entra', aire ? f.temp(aire.temp) : '—'],
      ],
      puntos: pulpa ? [{ temp: pulpa.temp, color }] : [],
      notas: [...new Set(activos.map((a) => NOMBRE_AVISO[a.tipo]))],
    };
  };

  return (
    <CursorGrafico
      ventana={ventana}
      escalaY={(temp) => e.y(temp) / ALTO}
      describir={describir}
      fijable={fijable}
      etiqueta={etiqueta}
      className={className}
    >
      <svg
        className="block w-full overflow-visible"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        style={{ height: alto }}
        role="img"
        aria-label={etiqueta}
      >
        {/* Marca de la inversión de aire, igual que en el gráfico del túnel */}
        {inversiones.map((a) => (
          <rect
            key={a.desde}
            x={e.x(a.desde)}
            width={Math.max(1, e.x(a.hasta) - e.x(a.desde))}
            y="0"
            height={ALTO}
            className="fill-menta"
          />
        ))}
        <line
          x1="0"
          x2={ANCHO}
          y1={yObjetivo}
          y2={yObjetivo}
          className="stroke-verde [stroke-dasharray:4_4]"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={rutaLinea(segmentos(lecturas, ventana[0], ventana[1]), e)}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </CursorGrafico>
  );
}
