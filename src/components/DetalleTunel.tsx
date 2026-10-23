import { OBJETIVO } from '../config';
import * as f from '../lib/formato';
import { crearEscala, lecturaCerca, rutaLinea, segmentos } from '../lib/graficos';
import type { Proceso } from '../lib/tipos';
import { CursorGrafico, type InfoCursor } from './CursorGrafico';
import { NOMBRE_AVISO } from '../lib/textos';
import { ItemLeyenda, Leyenda } from './Chips';
import { AyudaGrafico, CabeceraDetalle, Dato, ListaAvisos, PanelCambiante } from './PanelLateral';

const ANCHO = 300;
const ALTO = 120;

type Props = { proceso: Proceso; onCerrar: () => void; enModal?: boolean };

export function DetalleTunel({ proceso: p, onCerrar, enModal }: Props) {
  // Solo aire: la pulpa ya está en la lista de sondas
  const aire = [...p.ambiente.lecturas, ...p.retorno.lecturas].map((l) => l.temp);
  // Escala vertical: desde un poco bajo el objetivo hasta el aire más caliente, en múltiplos de 10
  const maximo = Math.max(...aire);
  const dominio: [number, number] = [OBJETIVO - 1, Math.ceil(maximo / 10) * 10];
  const e = crearEscala([0, p.fin], dominio, ANCHO, ALTO);
  const marcasTemp: number[] = [];
  for (let v = 0; v <= dominio[1]; v += 10) marcasTemp.push(v);

  // En este detalle solo se muestran los avisos del aire que aportan: la inversión
  const avisosAire = p.avisos.filter((a) => !a.sonda && a.tipo !== 'aireTibio' && a.tipo !== 'corteRed');
  const inversiones = p.avisos.filter((a) => a.tipo === 'inversion');

  const ambiente = p.ambiente.lecturas.map((l) => l.temp);

  // Minuto a minuto, igual que las sondas: el cursor se ajusta a la lectura más cercana
  const describir = (t: number): InfoCursor => {
    const cerca = lecturaCerca(p.ambiente.lecturas, t) ?? lecturaCerca(p.retorno.lecturas, t);
    const tCursor = cerca?.t ?? t;
    const amb = p.ambiente.porMinuto.get(tCursor);
    const ret = p.retorno.porMinuto.get(tCursor);
    const activos = avisosAire.filter((a) => a.desde <= tCursor && tCursor <= a.hasta);
    const valor = (v: number | undefined) => (v === undefined ? 'sin lectura' : f.temp(v));
    return {
      t: tCursor,
      titulo: f.hora(p.inicio, tCursor),
      filas: [
        ['Ambiente', valor(amb)],
        ['Retorno', valor(ret)],
      ],
      puntos: [
        { temp: amb, color: 'var(--color-azul)' },
        { temp: ret, color: 'var(--color-azul-medio)' },
      ].filter((x): x is { temp: number; color: string } => x.temp !== undefined),
      notas: [...new Set(activos.map((a) => NOMBRE_AVISO[a.tipo]))],
    };
  };

  return (
    <PanelCambiante destacado enModal={enModal}>
      <CabeceraDetalle titulo="Aire del túnel · todo el proceso" onCerrar={onCerrar} />

      <div className="grid grid-cols-3 gap-3">
        <Dato titulo="Aire más caliente" valor={f.temp(Math.max(...ambiente))} />
        <Dato titulo="Aire más frío" valor={f.temp(Math.min(...ambiente))} />
        <Dato titulo="Tiempo" valor={f.duracion(p.fin)} />
      </div>

      <div className="flex gap-1.5">
        <div className="relative h-60 w-[30px] shrink-0 text-[11px] text-azul-medio">
          {marcasTemp.map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${(e.y(v) / ALTO) * 100}%` }}>
              {v}°
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <CursorGrafico
            ventana={[0, p.fin]}
            escalaY={(v) => e.y(v) / ALTO}
            describir={describir}
            etiqueta="Aire del túnel, minuto a minuto"
          >
            <svg
              className="block h-60 w-full rounded-lg bg-fondo"
              viewBox={`0 0 ${ANCHO} ${ALTO}`}
              preserveAspectRatio="none"
              role="img"
              aria-label="Aire del túnel durante todo el proceso"
            >
              {marcasTemp.map((v) => (
                <line key={v} x1="0" x2={ANCHO} y1={e.y(v)} y2={e.y(v)} className="stroke-borde" vectorEffect="non-scaling-stroke" />
              ))}
              {inversiones.map((c) => (
                <rect
                  key={c.desde}
                  x={e.x(c.desde)}
                  width={Math.max(2, e.x(c.hasta) - e.x(c.desde))}
                  y="0"
                  height={ALTO}
                  className="fill-menta"
                />
              ))}
              <path
                d={rutaLinea(segmentos(p.retorno.lecturas, 0, p.fin), e)}
                className="fill-none stroke-azul-medio [stroke-dasharray:4_3]"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={rutaLinea(segmentos(p.ambiente.lecturas, 0, p.fin), e)}
                className="fill-none stroke-azul"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="0"
                x2={ANCHO}
                y1={e.y(OBJETIVO)}
                y2={e.y(OBJETIVO)}
                className="stroke-verde [stroke-dasharray:4_4]"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </CursorGrafico>
          <div className="mt-1 flex justify-between text-[11px] text-azul-medio">
            <span>{f.hora(p.inicio, 0)}</span>
            <span>{f.hora(p.inicio, Math.round(p.fin / 3))}</span>
            <span>{f.hora(p.inicio, Math.round((p.fin * 2) / 3))}</span>
            <span>{f.hora(p.inicio, p.fin)}</span>
          </div>
        </div>
      </div>

      <Leyenda>
        <ItemLeyenda muestra="h-0.5 w-4 bg-azul">Ambiente</ItemLeyenda>
        <ItemLeyenda muestra="w-4 border-t-2 border-dashed border-azul-medio">Retorno</ItemLeyenda>
        <ItemLeyenda muestra="h-2.5 w-[3px] bg-menta">Inversión</ItemLeyenda>
      </Leyenda>
      <div className="-mt-3">
        <AyudaGrafico />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-azul-medio">Avisos del túnel</h3>
        <ListaAvisos avisos={avisosAire} inicio={p.inicio} vacio="Sin avisos del aire." />
      </div>
    </PanelCambiante>
  );
}
