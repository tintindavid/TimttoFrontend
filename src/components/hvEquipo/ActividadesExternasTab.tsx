import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import {
  useActividadesExternasPorEquipo,
  useCadenasVigentesPorTipo,
  useCreateActividadExterna,
  useRemoveActividadExterna,
  useCerrarCadena,
} from '@/hooks/useActividadesExternas';
import ActividadesExternasList from './ActividadesExternasList';
import CrearActividadExternaModal from './CrearActividadExternaModal';
import ContinuidadCadenaModal from './ContinuidadCadenaModal';
import type { CadenaActividad, CreateActividadDto } from '@/types/actividadExterna.types';
import { ERROR_CODE_MESSAGES } from '@/constants/actividadExterna';

interface Props {
  equipoId: string;
  clienteId: string;
}

type Step = 'closed' | 'paso1' | 'checking' | 'paso2';

const errorText = (err: unknown): string => {
  const e = err as { response?: { data?: { code?: string } }; message?: string };
  const code = e?.response?.data?.code;
  return (code && ERROR_CODE_MESSAGES[code]) || e?.message || 'Error desconocido';
};

const ActividadesExternasTab: React.FC<Props> = ({ equipoId }) => {
  const { data, isLoading, isError } = useActividadesExternasPorEquipo(equipoId);
  const createMut = useCreateActividadExterna(equipoId);
  const removeMut = useRemoveActividadExterna(equipoId);
  const cerrarMut = useCerrarCadena(equipoId);

  const [step, setStep] = useState<Step>('closed');
  const [paso1Data, setPaso1Data] = useState<CreateActividadDto | null>(null);
  const [paso1File, setPaso1File] = useState<File | undefined>(undefined);
  // State (not derived) so the array identity stays stable across renders.
  const [candidatas, setCandidatas] = useState<CadenaActividad[]>([]);

  // Disabled query; refetched manually once the observer holds the paso 1 tipo.
  const vigentes = useCadenasVigentesPorTipo(equipoId, paso1Data?.tipo ?? '', paso1Data?.tipoCustom);
  const { refetch } = vigentes;

  const reset = () => {
    setStep('closed');
    setPaso1Data(null);
    setPaso1File(undefined);
    setCandidatas([]);
  };

  const persist = useCallback(
    async (dto: CreateActividadDto, cadenaIdSucesion?: string, file?: File) => {
      try {
        await createMut.mutateAsync({ dto: { ...dto, cadenaIdSucesion }, file });
        reset();
        await Swal.fire({
          icon: 'success',
          title: 'Actividad guardada',
          text: cadenaIdSucesion
            ? 'Cadena actualizada: anterior cerrada, nueva vigente.'
            : 'Nueva cadena creada.',
        });
      } catch (err) {
        await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: errorText(err) });
        setStep('paso1'); // allow retry from paso 1
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createMut.mutateAsync],
  );

  const handlePaso1Next = (dto: CreateActividadDto, file?: File) => {
    if (createMut.isLoading || step === 'checking') return;
    setPaso1Data(dto);
    setPaso1File(file);
    if (dto.frecuencia.esUnica) {
      void persist(dto, undefined, file);
      return;
    }
    setStep('checking');
  };

  useEffect(() => {
    if (step !== 'checking' || !paso1Data) return;
    let cancelled = false;
    (async () => {
      let sucedibles: CadenaActividad[] = [];
      try {
        const result = await refetch();
        const all = result?.data?.data ?? [];
        sucedibles = all.filter((c) => !c.esUnica && c.estado === 'vigente');
      } catch {
        sucedibles = []; // fallback: treat as no candidates
      }
      if (cancelled) return;
      if (sucedibles.length > 0) {
        setCandidatas(sucedibles);
        setStep('paso2');
      } else {
        await persist(paso1Data, undefined, paso1File);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleCerrarCadena = async (id: string) => {
    const res = await Swal.fire({
      title: 'Cerrar cadena',
      text: 'Indica el motivo del cierre.',
      input: 'textarea',
      showCancelButton: true,
      confirmButtonText: 'Cerrar cadena',
      cancelButtonText: 'Cancelar',
      inputValidator: (v: string) => (!v || !v.trim() ? 'El motivo es obligatorio' : null),
    });
    if (!res.isConfirmed || !res.value) return;
    try {
      await cerrarMut.mutateAsync({ cadenaId: id, motivo: String(res.value).trim() });
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'No se pudo cerrar', text: errorText(err) });
    }
  };

  const handleRemove = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Eliminar actividad vigente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!res.isConfirmed) return;
    try {
      await removeMut.mutateAsync(id);
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: errorText(err) });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Actividades externas</h5>
        <Button variant="primary" onClick={() => setStep('paso1')}>
          + Agregar actividad
        </Button>
      </div>
      {isLoading && <Spinner animation="border" size="sm" role="status" aria-label="Cargando actividades" />}
      {isError && <Alert variant="danger">No se pudieron cargar las actividades externas.</Alert>}
      {!isLoading && !isError && (
        <ActividadesExternasList
          grupos={data?.data ?? []}
          onCerrarCadena={handleCerrarCadena}
          onRemoveActividad={handleRemove}
        />
      )}
      <CrearActividadExternaModal
        show={step === 'paso1' || step === 'checking'}
        initial={paso1Data ?? undefined}
        onClose={reset}
        onNext={handlePaso1Next}
      />
      {paso1Data && (
        <ContinuidadCadenaModal
          show={step === 'paso2'}
          cadenasCandidatas={candidatas}
          datosPaso1={paso1Data}
          onBack={() => setStep('paso1')}
          onConfirm={(cadenaIdSucesion) => persist(paso1Data, cadenaIdSucesion, paso1File)}
        />
      )}
    </>
  );
};

export default ActividadesExternasTab;
