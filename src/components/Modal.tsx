import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  etiqueta: string;
  onCerrar: () => void;
  children: ReactNode;
};

// Celular: sube desde abajo (al alcance del pulgar). Tablet: centrado.
export function Modal({ etiqueta, onCerrar, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  // Se guarda la función en un ref: así el efecto corre solo al abrir y cerrar, no en cada render
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });

  useEffect(() => {
    // La página de atrás no se desplaza mientras el modal está abierto
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const anteriorFoco = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const teclas = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') cerrar.current();
    };
    window.addEventListener('keydown', teclas);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', teclas);
      anteriorFoco?.focus(); // el foco vuelve a la fila que abrió el modal
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-40">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default bg-azul/55" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-y-auto rounded-t-[20px] bg-white px-4 pt-2 pb-6 shadow-[0_-8px_24px_rgba(10,30,100,0.18)] outline-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90vh] sm:w-[min(560px,calc(100vw-48px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px] sm:p-6"
      >
        <span className="mb-2 h-[5px] w-10 shrink-0 self-center rounded-full bg-borde sm:hidden" aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
