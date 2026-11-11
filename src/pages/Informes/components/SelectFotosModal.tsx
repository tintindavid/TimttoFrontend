import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';

import { useInformeEvidencias } from '@/hooks/useInformeEvidencias';
import { EvidenciaCandidata, MAX_INFORME_FOTOS } from '@/types/informe.types';

export interface SelectFotosModalProps {
  show: boolean;
  onHide: () => void;
  clienteId: string;
  otIds: string[];
  /** Photos already chosen (kept when the modal is reopened). */
  initialSelected: EvidenciaCandidata[];
  onConfirm: (fotos: EvidenciaCandidata[]) => void;
}

/**
 * Photo picker for the by-OT informe: paged grid ("Ver más"), filter by
 * report, text search, "n de 10" counter and a hard cap at 10 photos.
 */
export const SelectFotosModal: React.FC<SelectFotosModalProps> = ({
  show,
  onHide,
  clienteId,
  otIds,
  initialSelected,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<EvidenciaCandidata[]>([]);
  const [reporteId, setReporteId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (show) {
      setSelected([...initialSelected]);
      setReporteId('');
      setSearchInput('');
      setSearch('');
    }
    // Only re-sync when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useInformeEvidencias({
    clienteId,
    otIds,
    reporteId,
    search,
    enabled: show,
  });

  const items: EvidenciaCandidata[] = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  // Prefer the server-provided list of all reports in scope; fall back to the reports seen in loaded items.
  const [fallbackReportes, setFallbackReportes] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (!show) setFallbackReportes(new Map());
  }, [show]);
  useEffect(() => {
    if (!items.length) return;
    setFallbackReportes((prev) => {
      const next = new Map(prev);
      items.forEach((i) => next.set(i.reporteId, i.reporteConsecutivo));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const reportesOptions: [string, string][] = useMemo(() => {
    const fromServer = data?.pages.find((p) => p.reportes && p.reportes.length > 0)?.reportes;
    if (fromServer) return fromServer.map((r) => [r.reporteId, r.consecutivo] as [string, string]);
    return [...fallbackReportes.entries()];
  }, [data, fallbackReportes]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.evidenciaId)), [selected]);
  const atCap = selected.length >= MAX_INFORME_FOTOS;

  const toggle = (foto: EvidenciaCandidata) => {
    setSelected((prev) => {
      if (prev.some((p) => p.evidenciaId === foto.evidenciaId)) {
        return prev.filter((p) => p.evidenciaId !== foto.evidenciaId);
      }
      if (prev.length >= MAX_INFORME_FOTOS) return prev;
      return [...prev, foto];
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable aria-labelledby="select-fotos-title">
      <Modal.Header closeButton>
        <Modal.Title id="select-fotos-title">
          Seleccionar fotos{' '}
          <Badge bg={atCap ? 'warning' : 'primary'} text={atCap ? 'dark' : undefined} data-testid="fotos-counter">
            {selected.length} de {MAX_INFORME_FOTOS}
          </Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-2 mb-3">
          <Col md={5}>
            <Form.Select aria-label="Filtrar por reporte" value={reporteId} onChange={(e) => setReporteId(e.target.value)}>
              <option value="">Todos los reportes</option>
              {reportesOptions.map(([id, consecutivo]) => (
                <option key={id} value={id}>
                  {consecutivo}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={7}>
            <Form.Control
              type="search"
              placeholder="Buscar por equipo o consecutivo..."
              aria-label="Buscar fotos"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Col>
        </Row>

        {atCap && (
          <Alert variant="info" className="py-2">
            Alcanzó el máximo de {MAX_INFORME_FOTOS} fotos. Quite alguna para elegir otra.
          </Alert>
        )}

        {selected.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Fotos elegidas">
            {selected.map((f) => (
              <div key={f.evidenciaId} className="position-relative">
                <img
                  src={f.url}
                  alt={f.nombre || 'Foto elegida'}
                  style={{ width: 56, height: 56, objectFit: 'cover' }}
                  className="rounded border"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 p-0 lh-1"
                  style={{ width: 18, height: 18, fontSize: 11 }}
                  aria-label={`Quitar foto ${f.nombre || f.evidenciaId}`}
                  onClick={() => toggle(f)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <Spinner animation="border" role="status" aria-label="Cargando fotos" />
          </div>
        )}
        {isError && <Alert variant="danger">No se pudieron cargar las fotos. Intente de nuevo.</Alert>}
        {!isLoading && !isError && items.length === 0 && (
          <p className="text-muted text-center fst-italic py-4">No hay fotos disponibles para esta selección.</p>
        )}

        <Row className="g-3">
          {items.map((f) => {
            const checked = selectedIds.has(f.evidenciaId);
            const blocked = atCap && !checked;
            return (
              <Col xs={6} md={4} lg={3} key={f.evidenciaId}>
                <div className={`border rounded p-1 h-100 ${checked ? 'border-primary border-2' : ''} ${blocked ? 'opacity-50' : ''}`}>
                  <img
                    src={f.url}
                    alt={f.nombre || 'Evidencia'}
                    loading="lazy"
                    className="w-100 rounded"
                    style={{ height: 120, objectFit: 'cover' }}
                  />
                  <Form.Check
                    type="checkbox"
                    id={`foto-${f.evidenciaId}`}
                    className="mt-1"
                    checked={checked}
                    disabled={blocked}
                    onChange={() => toggle(f)}
                    aria-label={`Seleccionar foto ${f.nombre || f.evidenciaId}`}
                    label={
                      <span className="small">
                        {f.reporteConsecutivo} · {f.equipoNombre}
                      </span>
                    }
                  />
                </div>
              </Col>
            );
          })}
        </Row>

        {hasNextPage && (
          <div className="text-center mt-3">
            <Button variant="outline-primary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Cargando...' : 'Ver más'}
            </Button>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={() => onConfirm(selected)}>
          Confirmar ({selected.length})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectFotosModal;
