import { useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type InfoCursor = {
  t: number; // minuto donde se dibuja la línea (puede ajustarse a la lectura más cercana)
  titulo: string;
  filas: [string, string][];
  puntos: { temp: number; color: string }[];
  notas?: string[];
};

type Props = {
  ventana: [number, number];
  // Posición vertical de una temperatura: 0 = borde de arriba, 1 = borde de abajo
  escalaY: (temp: number) => number;
  describir: (t: number) => InfoCursor;
  // Clic fija el cursor. En las filas no, porque ahí el clic elige la sonda.
  fijable?: boolean;
  etiqueta: string;
  className?: string;
  children: ReactNode;
};

// Caja del gráfico en coordenadas de la página: el recuadro se dibuja fuera del gráfico y no se corta
type Caja = { left: number; top: number; width: number };
const ANCHO_RECUADRO = 220;

export function CursorGrafico({ ventana: [t0, t1], escalaY, describir, fijable = true, etiqueta, className = '', children }: Props) {
  const [t, setT] = useState<number | null>(null);
  const [fijo, setFijo] = useState(false);
  const [caja, setCaja] = useState<Caja | null>(null);

  const medir = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setCaja({ left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width });
    return r;
  };
  const tiempoDe = (ev: MouseEvent<HTMLDivElement>) => {
    const r = medir(ev.currentTarget);
    const fraccion = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
    return Math.round(t0 + fraccion * (t1 - t0));
  };
  const limitar = (n: number) => Math.min(t1, Math.max(t0, n));

  const mover = (ev: PointerEvent<HTMLDivElement>) => {
    if (!fijo) setT(tiempoDe(ev));
  };
  const salir = (ev: PointerEvent<HTMLDivElement>) => {
    if (!fijo && (ev.pointerType === 'mouse' || !fijable)) setT(null);
  };
  const clic = (ev: MouseEvent<HTMLDivElement>) => {
    if (!fijable) return;
    setT(tiempoDe(ev));
    setFijo(!fijo);
  };
  const teclas = (ev: KeyboardEvent<HTMLDivElement>) => {
    const paso = { ArrowLeft: -1, ArrowRight: 1 }[ev.key];
    if (ev.key === 'Escape') {
      setT(null);
      setFijo(false);
    }
    if (!paso) return;
    ev.preventDefault();
    medir(ev.currentTarget);
    setT((actual) => limitar((actual ?? t1) + paso * (ev.shiftKey ? 10 : 1)));
    setFijo(true);
  };
  const soltar = () => {
    setT(null);
    setFijo(false);
  };

  const info = t === null ? null : describir(t);
  const fraccion = info ? (info.t - t0) / (t1 - t0 || 1) : 0;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div
        className="absolute inset-0 cursor-crosshair touch-pan-y rounded-lg outline-offset-2 focus-visible:outline-3 focus-visible:outline-menta"
        onPointerMove={mover}
        onPointerDown={mover}
        onPointerLeave={salir}
        onClick={clic}
        onKeyDown={fijable ? teclas : undefined}
        onBlur={fijable ? soltar : undefined}
        tabIndex={fijable ? 0 : undefined}
        role={fijable ? 'slider' : undefined}
        aria-label={etiqueta}
        aria-valuemin={fijable ? t0 : undefined}
        aria-valuemax={fijable ? t1 : undefined}
        aria-valuenow={fijable ? (info?.t ?? t1) : undefined}
        aria-valuetext={fijable && info ? [info.titulo, ...info.filas.map((f) => f.join(' '))].join(', ') : undefined}
      >
        {info && (
          <>
            <span className="pointer-events-none absolute inset-y-0 w-px bg-azul/60" style={{ left: `${fraccion * 100}%` }} />
            {info.puntos.map((p, i) => (
              <span
                key={i}
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${fraccion * 100}%`, top: `${escalaY(p.temp) * 100}%`, background: p.color }}
              />
            ))}
          </>
        )}
      </div>

      {info && caja && createPortal(<Recuadro info={info} fijo={fijo} x={caja.left + fraccion * caja.width} y={caja.top} />, document.body)}
    </div>
  );
}

function Recuadro({ info, fijo, x, y }: { info: InfoCursor; fijo: boolean; x: number; y: number }) {
  // A la derecha de la línea, o a la izquierda si no cabe en la pantalla
  const cabeDerecha = x + 12 + ANCHO_RECUADRO < window.scrollX + document.documentElement.clientWidth;
  const left = cabeDerecha ? x + 12 : Math.max(window.scrollX + 4, x - 12 - ANCHO_RECUADRO);
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-50 flex -translate-y-full flex-col gap-0.5 rounded-lg bg-azul px-3 py-2 text-[13px] text-white shadow-lg"
      style={{ left, top: y - 6, width: ANCHO_RECUADRO }}
    >
      <span className="mb-0.5 flex justify-between gap-3 font-semibold">
        {info.titulo}
        {fijo && <span className="text-xs font-semibold text-menta">fijado · Esc</span>}
      </span>
      {info.filas.map(([nombre, valor]) => (
        <span key={nombre} className="flex justify-between gap-4">
          <span className="text-azul-claro">{nombre}</span>
          <span className="font-semibold">{valor}</span>
        </span>
      ))}
      {info.notas?.map((n) => (
        <span key={n} className="mt-0.5 text-xs font-semibold text-menta">
          ⚠ {n}
        </span>
      ))}
    </div>
  );
}
