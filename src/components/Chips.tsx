import type { ReactNode } from 'react';
import { NOMBRE_AVISO } from '../lib/textos';
import type { TipoAviso } from '../lib/tipos';

const COLOR_CHIP: Record<TipoAviso, string> = {
  pulpaFria: 'bg-rojo-claro text-rojo',
  sinSenal: 'bg-rojo-claro text-rojo',
  inversion: 'bg-menta-claro text-verde',
  aireTibio: 'bg-naranja-claro text-naranja',
  corteRed: 'bg-gris text-azul-medio',
};

export function ChipAviso({ tipo }: { tipo: TipoAviso }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_CHIP[tipo]}`}>
      {NOMBRE_AVISO[tipo]}
    </span>
  );
}

export function AvisoInfo({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="flex items-center gap-2.5 rounded-[10px] bg-menta-claro px-3.5 py-2.5 text-sm">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 text-verde">
        <circle cx="9" cy="9" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 8v4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="5.6" r="0.9" fill="currentColor" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function BotonCerrar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cerrar detalle"
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-gris hover:bg-borde"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// Leyenda de los gráficos: una muestra de color + su significado
export function Leyenda({ children }: { children: ReactNode }) {
  return <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-azul-medio">{children}</ul>;
}

export function ItemLeyenda({ muestra, children }: { muestra: string; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={`inline-block ${muestra}`} />
      {children}
    </li>
  );
}
