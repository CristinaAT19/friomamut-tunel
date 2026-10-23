import { OBJETIVO } from '../config';
import { avisosParaSonda } from '../lib/analisis';
import * as f from '../lib/formato';
import { COLOR_ESTADO } from '../lib/textos';
import type { Proceso, ResumenSonda } from '../lib/tipos';
import { AvisoInfo } from './Chips';
import { GraficoSonda } from './GraficoSonda';

// Escala de la barra: de −2 a +3 °C, el objetivo queda al 20 %
const BARRA_MIN = -2;
const BARRA_MAX = 3;
const porcentaje = (temp: number) => ((temp - BARRA_MIN) / (BARRA_MAX - BARRA_MIN)) * 100;

type Props = {
  proceso: Proceso;
  ventana: [number, number];
  dominio: [number, number];
  elegida: string | null;
  onElegir: (nombre: string) => void;
};

export function ListaSondas({ proceso, ventana, dominio, elegida, onElegir }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-borde bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-borde px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="font-titulo text-[22px] font-bold sm:text-2xl">Sondas de pulpa</h2>
        <span className="text-[13px] text-azul-medio">De la más caliente a la más fría</span>
      </div>
      <div className="px-4 pt-3 pb-1 sm:px-6">
        <AvisoInfo>
          <span className="lg:hidden">Toca una sonda para ver su detalle.</span>
          <span className="hidden lg:inline">
            Pasa el cursor por la curva para ver cada minuto. Haz clic en una sonda para ver su detalle al costado.
          </span>
        </AvisoInfo>
      </div>
      <div>
        {proceso.sondas.map((s) => (
          <FilaSonda
            key={s.nombre}
            sonda={s}
            proceso={proceso}
            ventana={ventana}
            dominio={dominio}
            elegida={s.nombre === elegida}
            onClick={() => onElegir(s.nombre)}
          />
        ))}
      </div>
    </section>
  );
}

type FilaProps = {
  sonda: ResumenSonda;
  proceso: Proceso;
  ventana: [number, number];
  dominio: [number, number];
  elegida: boolean;
  onClick: () => void;
};

function FilaSonda({ sonda: s, proceso, ventana, dominio, elegida, onClick }: FilaProps) {
  const color = COLOR_ESTADO[s.estado];
  const inicioBarra = porcentaje(OBJETIVO);
  const anchoBarra = Math.min(100 - inicioBarra, Math.max(0, porcentaje(s.temp) - inicioBarra));
  const n = s.avisos.length;
  const chipAvisos = n > 0 && (
    <span className="rounded-full border border-[#c8492a] px-2 py-px text-xs font-semibold text-rojo">
      {n === 1 ? '1 aviso' : `${n} avisos`}
    </span>
  );
  const barra = (
    <span className="relative block h-2 rounded-full bg-gris sm:h-2.5">
      <span
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${inicioBarra}%`, width: `${anchoBarra}%`, background: color }}
      />
      <span className="absolute -inset-y-1 w-0.5 bg-verde" style={{ left: `${inicioBarra}%` }} />
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={elegida}
      className={`w-full cursor-pointer border-b border-gris px-4 py-3 text-left sm:px-5 lg:px-6 ${
        elegida ? 'bg-menta-elegida shadow-[inset_4px_0_0_var(--color-verde)]' : 'bg-white hover:bg-fondo'
      }`}
    >
      {/* Celular: nombre y temperatura arriba, barra al medio, faltan y ritmo abajo. Sin gráfico chico: está en el modal */}
      <span className="flex flex-col gap-2 sm:hidden">
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold">{s.nombre}</span>
          {chipAvisos}
          <span className="ml-auto font-titulo text-[26px] leading-none font-bold">{f.temp(s.temp)}</span>
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0 text-azul-medio">
            <path
              d="M7 4l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {barra}
        <span className="flex justify-between text-[13px] text-azul-medio">
          <span>
            faltan <strong className="font-semibold text-azul">{f.temp(s.falta)}</strong>
          </span>
          <span>
            ritmo <strong className="font-semibold text-azul">{f.ritmo(s.ritmo)}</strong>
          </span>
        </span>
      </span>

      {/* Tablet y computador: todo en una línea */}
      <span className="hidden min-h-10 items-center gap-4 sm:flex">
        <span className="flex w-[104px] shrink-0 flex-col items-start gap-1.5 lg:w-[140px]">
          <span className="text-base font-semibold">{s.nombre}</span>
          {chipAvisos}
        </span>

        <span className="flex w-[92px] shrink-0 flex-col lg:w-[100px]">
          <span className="font-titulo text-[26px] leading-tight font-bold lg:text-3xl">{f.temp(s.temp)}</span>
          <span className="text-[13px] text-azul-medio">faltan {f.temp(s.falta)}</span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          {barra}
          <span className="relative flex justify-between text-[11px] text-azul-medio">
            <span>{BARRA_MIN}</span>
            <span className="absolute -translate-x-1/2 font-semibold text-verde" style={{ left: `${inicioBarra}%` }}>
              {f.temp(OBJETIVO)}
            </span>
            <span>+{BARRA_MAX} °C</span>
          </span>
        </span>

        <span className="w-[104px] shrink-0 lg:w-[120px]">
          <GraficoSonda
            lecturas={s.lecturas}
            ventana={ventana}
            dominio={dominio}
            color={color}
            alto={36}
            etiqueta={`Temperatura de ${s.nombre} durante todo el proceso`}
            inicio={proceso.inicio}
            ambiente={proceso.ambiente.lecturas}
            avisos={avisosParaSonda(proceso, s)}
            fijable={false}
          />
        </span>

        <span className="flex w-[80px] shrink-0 flex-col items-end lg:w-[90px] lg:items-start">
          <span className="text-[15px] font-semibold lg:text-[17px]">{f.ritmo(s.ritmo)}</span>
          <span className="text-xs text-azul-medio lg:text-[13px]">ritmo · 30 min</span>
        </span>
      </span>
    </button>
  );
}
