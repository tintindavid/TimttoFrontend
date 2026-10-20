import React, { useState } from 'react';
import CrearActividadExternaModal from '@/components/hvEquipo/CrearActividadExternaModal';
import ReporteExternoModal from '@/components/hvEquipo/ReporteExternoModal';
import { avisarServicioGuardado } from '@/components/hvEquipo/ServicioExternoControles';
import { useGuardarActividadExterna } from '@/hooks/useGuardarActividadExterna';
import { fechaInicialDeCelda } from '@/utils/cronogramaCargaRapida';
import type { CronogramaEquipo, EstadoMesActividad, FilaActividad, Mes } from '@/types/cronograma.types';
import type { CreateActividadDto } from '@/types/actividadExterna.types';

/** The cell of the schedule the user clicked: which equipment, which row (MP or an external chain) and which month. */
export interface CeldaCarga {
  equipo: CronogramaEquipo;
  fila: FilaActividad;
  mes: Mes;
  /** State of the cell when it was clicked: a due cell opens the form, a done one opens the read-only summary. */
  estado: EstadoMesActividad;
}

interface Props {
  celda: CeldaCarga;
  /** Year shown in the schedule. */
  anio: number;
  onClose: () => void;
}

/**
 * External activity of a chain: the form of the equipment record with the type locked and the provider and frequency
 * of the chain; it always continues that chain (no "which chain?" step), so it saves as its successor.
 */
const CargaExterna: React.FC<Props> = ({ celda, anio, onClose }) => {
  const { equipo, fila, mes } = celda;
  const cadena = fila.cadena!;
  const { guardar } = useGuardarActividadExterna(equipo._id);
  const [guardando, setGuardando] = useState(false);

  const handleNext = async (dto: CreateActividadDto, file?: File) => {
    if (guardando) return; // a double click must not register the activity twice
    setGuardando(true);
    const ok = await guardar(dto, cadena.cadenaId, file, { alGuardar: onClose });
    if (!ok) setGuardando(false); // the alert already told the user; the form stays open to retry
  };

  return (
    <CrearActividadExternaModal
      show
      tipoFijo
      estadoActual={equipo.EstadoOperativo}
      initial={{
        tipo: cadena.tipo,
        tipoCustom: cadena.tipoCustom ?? undefined,
        proveedor: cadena.proveedor ?? undefined,
        proveedorId: cadena.proveedorId ?? undefined,
        frecuencia: { esUnica: false, meses: cadena.frecuenciaMeses ?? 12 },
        fecha: fechaInicialDeCelda(mes, anio),
      }}
      onClose={onClose}
      onNext={handleNext}
    />
  );
};

/** Preventive row: the external preventive service form of the equipment record, starting in the month of the cell. */
const CargaPreventivo: React.FC<Props> = ({ celda, anio, onClose }) => {
  const { equipo, mes } = celda;
  return (
    <ReporteExternoModal
      show
      tipoMtto="Preventivo"
      equipoId={equipo._id}
      estadoActual={equipo.EstadoOperativo}
      mesesMtto={equipo.mesesMtto?.map((m) => m.toLowerCase())}
      mesesRealizados={equipo.mesesRealizados}
      fechaInicial={fechaInicialDeCelda(mes, anio)}
      onClose={onClose}
      onSaved={(warnings) => {
        onClose();
        avisarServicioGuardado(warnings);
      }}
    />
  );
};

/**
 * Quick load from a due cell of the schedule (change: cronograma-carga-rapida). It reuses the forms of the equipment
 * record. It is mounted only while it is open, so every cell starts with a fresh form.
 */
const CargaRapidaCelda: React.FC<Props> = (props) =>
  props.celda.fila.tipo === 'externa' && props.celda.fila.cadena
    ? <CargaExterna key={props.celda.fila.key + props.celda.mes} {...props} />
    : <CargaPreventivo key={props.celda.fila.key + props.celda.mes} {...props} />;

export default CargaRapidaCelda;
