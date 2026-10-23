import type { ReactNode } from 'react';
import { avisosParaSonda } from '../lib/analisis';
import * as f from '../lib/formato';
import type { Aviso, Proceso, ResumenSonda, Sonda } from '../lib/tipos';
import { BotonCerrar, ChipAviso, ItemLeyenda, Leyenda } from './Chips';
import { GraficoSonda } from './GraficoSonda';

const ultima = (s: Sonda) => s.lecturas[s.lecturas.length - 1].temp;

export function PanelAire({ proceso, abierto, onClick }: { proceso: Proceso; abierto: boolean; onClick: () => void }) {
  const ambiente = ultima(proceso.ambiente);
  const retorno = ultima(proceso.retorno);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={abierto}
      className={`flex w-full cursor-pointer flex-col gap-3 rounded-2xl bg-azul p-4 text-left text-white sm:gap-3.5 sm:p-5 ${
        abierto ? 'ring-3 ring-menta' : ''
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-[0.12em] text-menta uppercase">Aire del túnel</span>
        <span className="text-[13px] font-semibold text-menta">{abierto ? 'Ocultar detalle' : 'Ver detalle →'}</span>
      </span>
      <span className="grid grid-cols-2 gap-4">
        <DatoAire nombre="Ambiente · entra" valor={f.temp(ambiente)} />
        <DatoAire nombre="Retorno · sale" valor={f.temp(retorno)} />
      </span>
    </button>
  );
}

function DatoAire({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[13px] text-azul-claro">{nombre}</span>
      <span className="font-titulo text-[26px] font-bold sm:text-[34px]">{valor}</span>
    </span>
  );
}

type PanelProps = { destacado?: boolean; enModal?: boolean; children: ReactNode };

// El historial y los detalles ocupan el mismo lugar y la misma altura mínima: así no hay saltos.
// Dentro de un modal (celular y tablet) el modal ya pone el fondo y el margen.
export function PanelCambiante({ destacado = false, enModal = false, children }: PanelProps) {
  if (enModal) return <section className="flex flex-col gap-3.5">{children}</section>;
  return (
    <section
      className={`flex min-h-[560px] flex-col gap-3.5 rounded-2xl bg-white p-5 ${
        destacado ? 'border-2 border-verde' : 'border border-borde'
      }`}
    >
      {children}
    </section>
  );
}

export function CabeceraDetalle({ titulo, onCerrar }: { titulo: string; onCerrar: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold tracking-[0.12em] text-verde uppercase">Detalle</span>
        <h2 className="font-titulo text-[22px] font-bold sm:text-[26px]">{titulo}</h2>
      </div>
      <BotonCerrar onClick={onCerrar} />
    </div>
  );
}

export function ListaAvisos({ avisos, inicio, vacio }: { avisos: Aviso[]; inicio: Date; vacio: string }) {
  if (avisos.length === 0) return <p className="text-[13px] text-azul-medio">{vacio}</p>;
  return (
    <ul className="flex flex-col">
      {avisos.map((a, i) => (
        <li key={i} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-gris py-2 text-sm">
          <span className="min-w-[92px] font-semibold">{f.tramo(inicio, a.desde, a.hasta)}</span>
          <ChipAviso tipo={a.tipo} />
          {a.duranteInversion && <ChipAviso tipo="inversion" />}
          <span className="text-[13px] text-azul-medio">{a.dato}</span>
        </li>
      ))}
    </ul>
  );
}

export function Historial({ proceso }: { proceso: Proceso }) {
  return (
    <PanelCambiante>
      <h2 className="font-titulo text-xl font-bold">Historial</h2>
      <ListaAvisos avisos={proceso.avisos} inicio={proceso.inicio} vacio="Sin avisos en este proceso." />
    </PanelCambiante>
  );
}

type DetalleSondaProps = {
  sonda: ResumenSonda;
  proceso: Proceso;
  ventana: [number, number];
  dominio: [number, number];
  onCerrar: () => void;
  enModal?: boolean;
};

export function DetalleSonda({ sonda: s, proceso, ventana, dominio, onCerrar, enModal }: DetalleSondaProps) {
  return (
    <PanelCambiante destacado enModal={enModal}>
      <CabeceraDetalle titulo={s.nombre} onCerrar={onCerrar} />
      <div className="grid grid-cols-3 gap-3">
        <Dato titulo="Ahora" valor={f.temp(s.temp)} />
        <Dato titulo="Faltan" valor={f.temp(s.falta)} />
        <Dato titulo="Ritmo" valor={f.ritmo(s.ritmo)} />
      </div>
      {s.minutosParaLlegar !== null && (
        <Nota>Al ritmo actual llega en ≈ {f.duracion(s.minutosParaLlegar)}.</Nota>
      )}
      {s.estado === 'sinSenal' && (
        <Nota>Sin lecturas desde las {f.hora(proceso.inicio, s.tUltima)}: no se puede saber si llegó.</Nota>
      )}
      <div>
        <GraficoSonda
          lecturas={s.lecturas}
          ventana={ventana}
          dominio={dominio}
          color="var(--color-azul)"
          alto={180}
          etiqueta={`Temperatura de ${s.nombre} durante todo el proceso`}
          inicio={proceso.inicio}
          ambiente={proceso.ambiente.lecturas}
          avisos={avisosParaSonda(proceso, s)}
          className="rounded-lg bg-fondo"
        />
        <div className="mt-1 flex justify-between text-[11px] text-azul-medio">
          <span>{f.hora(proceso.inicio, ventana[0])}</span>
          <span>{f.hora(proceso.inicio, ventana[1])}</span>
        </div>
        <div className="mt-2.5">
          <Leyenda>
            <ItemLeyenda muestra="h-0.5 w-4 bg-azul">Pulpa</ItemLeyenda>
            <ItemLeyenda muestra="h-2.5 w-[3px] bg-menta">Inversión de aire</ItemLeyenda>
          </Leyenda>
        </div>
        <AyudaGrafico />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-azul-medio">Avisos de esta sonda</h3>
        <ListaAvisos
          avisos={s.avisos}
          inicio={proceso.inicio}
          vacio={`Sin avisos hasta las ${f.hora(proceso.inicio, proceso.fin)}.`}
        />
      </div>
    </PanelCambiante>
  );
}

// Con mouse: pasar el cursor. En pantalla táctil (celular y tablet): tocar o arrastrar
export function AyudaGrafico() {
  return (
    <p className="mt-1.5 text-xs text-azul-medio">
      <span className="lg:hidden">Toca o arrastra sobre el gráfico para ver cada minuto.</span>
      <span className="hidden lg:inline">Cursor o dedo encima: valores del minuto · clic: fijar · ← →: mover</span>
    </p>
  );
}

function Nota({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-fondo px-3 py-2 text-sm">{children}</p>;
}

export function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] text-azul-medio">{titulo}</span>
      <span className="font-titulo text-xl font-bold sm:text-2xl">{valor}</span>
    </div>
  );
}
