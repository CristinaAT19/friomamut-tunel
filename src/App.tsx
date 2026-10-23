import { useCallback, useState } from 'react';
import { OBJETIVO, PROCESO } from './config';
import csv from './data/proceso-133.csv?raw';
import { analizar } from './lib/analisis';
import { useMediaQuery } from './lib/useMediaQuery';
import * as f from './lib/formato';
import { AvisoInfo } from './components/Chips';
import { DetalleTunel } from './components/DetalleTunel';
import { ListaSondas } from './components/ListaSondas';
import { Modal } from './components/Modal';
import { DetalleSonda, Historial, PanelAire } from './components/PanelLateral';

// Lo que se ve en el costado: nada (historial), el túnel o una sonda
type Seleccion = { tipo: 'tunel' } | { tipo: 'sonda'; nombre: string } | null;

const p = analizar(csv);

// Ventana y escala compartidas por los gráficos de sondas: todo el rango del CSV, de la primera a la última lectura
const ventana: [number, number] = [0, p.fin];
const temps = p.pulpa.flatMap((s) => s.lecturas.map((l) => l.temp));
const dominio: [number, number] = [Math.min(OBJETIVO - 1, ...temps), Math.max(OBJETIVO + 1, ...temps)];

export default function App() {
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  // Computador: el detalle va en el panel del costado. Tablet y celular: en un modal.
  const escritorio = useMediaQuery('(min-width: 1024px)');
  const cerrar = useCallback(() => setSeleccion(null), []);

  const listas = p.sondas.filter((s) => s.estado === 'llego').length;
  const todasListas = listas === p.sondas.length;
  const sondaElegida = seleccion?.tipo === 'sonda' ? p.sondas.find((s) => s.nombre === seleccion.nombre) : undefined;
  const tunelAbierto = seleccion?.tipo === 'tunel';

  const elegirSonda = (nombre: string) => setSeleccion(sondaElegida?.nombre === nombre ? null : { tipo: 'sonda', nombre });
  const alternarTunel = () => setSeleccion(tunelAbierto ? null : { tipo: 'tunel' });

  const detalle = (enModal: boolean) =>
    tunelAbierto ? (
      <DetalleTunel proceso={p} onCerrar={cerrar} enModal={enModal} />
    ) : sondaElegida ? (
      <DetalleSonda sonda={sondaElegida} proceso={p} ventana={ventana} dominio={dominio} onCerrar={cerrar} enModal={enModal} />
    ) : null;
  const panelAire = <PanelAire proceso={p} abierto={tunelAbierto} onClick={alternarTunel} />;

  return (
    <div className="min-h-screen">
      <header className="bg-azul text-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3.5 sm:gap-y-4 sm:px-6 sm:py-4.5">
          <div className="font-titulo text-xl font-bold">Friomamut</div>
          <div className="flex basis-full flex-wrap gap-x-5 gap-y-1 text-[13px] text-azul-claro sm:basis-auto sm:text-sm">
            <strong className="font-semibold text-white">{PROCESO.titulo}</strong>
            {PROCESO.detalle && <span>{PROCESO.detalle}</span>}
            <span>
              Inicio {f.hora(p.inicio, 0)} · {f.duracion(p.fin)} en túnel
            </span>
          </div>
          <span className="flex items-center gap-2 text-[13px] text-azul-claro sm:ml-auto sm:text-sm">
            <span className="size-2 rounded-full bg-menta" aria-hidden="true" />
            Última lectura <strong className="text-white">{f.hora(p.inicio, p.fin)}</strong>
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1360px] flex-wrap items-start gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
        <main className="flex min-w-0 grow-[999] basis-[640px] flex-col gap-4 sm:gap-6">
          {/* En tablet el veredicto y el aire van lado a lado; en celular el aire queda justo debajo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <section className="flex flex-col gap-3 rounded-2xl border border-borde bg-white p-5 sm:gap-4 sm:p-7">
              <span className="text-xs font-semibold tracking-[0.12em] text-verde uppercase">
                Objetivo de pulpa · {f.temp(OBJETIVO)}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <h1
                  className={`font-titulo text-[44px] leading-none font-bold sm:text-[56px] ${todasListas ? 'text-verde' : 'text-rojo'}`}
                >
                  {todasListas ? 'Listo' : 'No listo'}
                </h1>
                <p className="text-[17px] font-medium sm:text-[22px]">
                  {listas} de {p.sondas.length} sondas llegaron a {f.temp(OBJETIVO)}
                </p>
              </div>
            </section>
            {!escritorio && panelAire}
          </div>

          <ListaSondas
            proceso={p}
            ventana={ventana}
            dominio={dominio}
            elegida={sondaElegida?.nombre ?? null}
            onElegir={elegirSonda}
          />

          {!escritorio && <Historial proceso={p} />}
        </main>

        {escritorio && (
          <aside aria-label="Aire y avisos" className="flex min-w-0 grow basis-[460px] flex-col gap-4">
            {panelAire}
            <AvisoInfo>
              Haz clic en <strong>Aire del túnel</strong> para ver el detalle de todo el proceso.
            </AvisoInfo>
            {/* Un solo espacio que cambia: así nada de lo de arriba se mueve */}
            {detalle(false) ?? <Historial proceso={p} />}
          </aside>
        )}
      </div>

      {!escritorio && seleccion && (
        <Modal
          etiqueta={tunelAbierto ? 'Detalle del aire del túnel' : `Detalle de ${sondaElegida?.nombre ?? 'la sonda'}`}
          onCerrar={cerrar}
        >
          {detalle(true)}
        </Modal>
      )}
    </div>
  );
}
