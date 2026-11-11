import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import Select, { SingleValue } from 'react-select';
import { toast } from 'react-toastify';

import { useAuth } from '@/context/AuthContext';
import { useCustomers } from '@/hooks/useCustomers';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { informeService } from '@/services/informe.service';
import { SelectOtsModal } from '../components/SelectOtsModal';
import { InformePorOtPreview } from '../components/InformePorOtPreview';
import { RichTextEditor } from '../components/RichTextEditor';
import { SelectFotosModal } from '../components/SelectFotosModal';
import { SignatureRequiredModal } from '../components/SignatureRequiredModal';
import { EvidenciaCandidata, InformePorOtPayload, MAX_INFORME_FOTOS, MAX_OBSERVACIONES_HTML } from '@/types/informe.types';
import { Customer } from '@/types/customer.types';
import { sanitizeObservacionesForPreview } from '../utils/sanitizeObservaciones';

interface CustomerOption {
  value: string;
  label: string;
}

function toOption(c: Customer): CustomerOption {
  return { value: c._id!, label: c.Razonsocial + (c.Ciudad ? ` — ${c.Ciudad}` : '') };
}

/**
 * "Informe por OT" tab (informe-por-ot spec) — cliente searchable → modal
 * with the client's OTs (checkboxable, editable afterwards) → preview with
 * KPIs, Sede→Servicio sections, consolidated repuestos, observations.
 * Gated on the requesting user having a stored signature
 * (informes-firma-autor).
 */
export const InformesPorOtTab: React.FC = () => {
  const { user } = useAuth();
  const { can, organizationCustomerId } = useTenantCapabilities();
  const managesCustomers = can('managesCustomers');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [selectedOtIds, setSelectedOtIds] = useState<string[]>([]);
  const [observacionesHtml, setObservacionesHtml] = useState('');
  const [fotos, setFotos] = useState<EvidenciaCandidata[]>([]);
  const [showFotosModal, setShowFotosModal] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);

  const [showOtsModal, setShowOtsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [payload, setPayload] = useState<InformePorOtPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Debounce customer search (same pattern as InformesPorMesTab).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(customerSearch), 350);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // "Mantenimiento propio": there is no client selector; the report is always about the organization customer.
  useEffect(() => {
    if (!managesCustomers && organizationCustomerId) {
      setSelectedCustomer({ value: organizationCustomerId, label: 'Mi organización' });
    }
  }, [managesCustomers, organizationCustomerId]);

  const searchEnabled = debouncedSearch.length >= 3 && managesCustomers;
  const { data: customersData, isLoading: loadingCustomers } = useCustomers(
    searchEnabled ? { search: debouncedSearch, limit: 20 } : undefined,
    { enabled: managesCustomers },
  );

  const customerOptions: CustomerOption[] =
    searchEnabled && customersData?.data ? customersData.data.map(toOption) : [];

  const initialSelectedSet = useMemo(() => new Set(selectedOtIds), [selectedOtIds]);

  const handleCustomerChange = (opt: SingleValue<CustomerOption>) => {
    setSelectedCustomer(opt ?? null);
    setSelectedOtIds([]);
    setFotos([]);
    setPayload(null);
    setError(null);
    if (opt) setShowOtsModal(true);
  };

  const handleConfirmOts = (ids: string[]) => {
    setSelectedOtIds(ids);
    setFotos([]);
    setShowOtsModal(false);
    setPayload(null);
    setError(null);
  };

  const canGenerate = !!selectedCustomer && selectedOtIds.length > 0;
  const htmlTooLong = observacionesHtml.length > MAX_OBSERVACIONES_HTML;

  const handleObservacionesChange = useCallback((html: string) => {
    setObservacionesHtml(html);
  }, []);

  // Live preview: the generated payload is overlaid with the current rich text and photo
  // selection, so editing the notes or removing a photo updates it without regenerating.
  const livePayload = useMemo<InformePorOtPayload | null>(() => {
    if (!payload) return null;
    const chosen = new Set(fotos.map((f) => f.evidenciaId));
    return {
      ...payload,
      observacionesAdicionalesHtml: sanitizeObservacionesForPreview(observacionesHtml),
      fotos: (payload.fotos ?? []).filter((f) => chosen.has(f.evidenciaId)),
    };
  }, [payload, observacionesHtml, fotos]);

  const buildRequest = useCallback(
    () => ({
      clienteId: selectedCustomer!.value,
      otIds: selectedOtIds,
      ...(observacionesHtml ? { observacionesAdicionalesHtml: observacionesHtml } : {}),
      ...(fotos.length > 0 ? { fotoIds: fotos.map((f) => f.evidenciaId) } : {}),
    }),
    [selectedCustomer, selectedOtIds, observacionesHtml, fotos],
  );

  const withSignatureGate = useCallback(
    (action: () => void) => {
      if (user?.fileFirma) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setShowSignatureModal(true);
    },
    [user],
  );

  const doGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPayload(null);
    try {
      const result = await informeService.generateByOt(buildRequest());
      setPayload(result.data);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al generar el informe';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [buildRequest]);

  const handleGenerate = useCallback(() => {
    if (!canGenerate || htmlTooLong) return;
    withSignatureGate(doGenerate);
  }, [canGenerate, htmlTooLong, withSignatureGate, doGenerate]);

  const doDownloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      await informeService.downloadPdfByOt(buildRequest());
      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      const msg = err?.message || 'Error al descargar el PDF';
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }, [buildRequest]);

  const handleDownloadPdf = useCallback(() => {
    if (!canGenerate || htmlTooLong) return;
    withSignatureGate(doDownloadPdf);
  }, [canGenerate, htmlTooLong, withSignatureGate, doDownloadPdf]);

  const doDownloadXlsx = useCallback(async () => {
    setDownloadingXlsx(true);
    try {
      // The Excel ignores photos and observations; the backend DTO rejects extra fields.
      await informeService.downloadXlsxByOt({ clienteId: selectedCustomer!.value, otIds: selectedOtIds });
      toast.success('Excel descargado exitosamente');
    } catch (err: any) {
      toast.error(err?.message || 'Error al descargar el Excel');
    } finally {
      setDownloadingXlsx(false);
    }
  }, [selectedCustomer, selectedOtIds]);

  const handleDownloadXlsx = useCallback(() => {
    if (!canGenerate) return;
    withSignatureGate(doDownloadXlsx);
  }, [canGenerate, withSignatureGate, doDownloadXlsx]);

  const handleSignatureSaved = useCallback(() => {
    setShowSignatureModal(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  const handleSignatureCancelled = useCallback(() => {
    pendingActionRef.current = null;
    setShowSignatureModal(false);
  }, []);

  return (
    <div className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold mb-1" style={{ color: '#1a2332' }}>Informe por OT</h2>
          <p className="text-muted mb-0">
            {managesCustomers ? 'Seleccione un cliente y las OTs' : 'Seleccione las OTs'} a incluir para generar el informe consolidado de cumplimiento. Puede añadir observaciones con formato, hasta 10 fotos de evidencia y descargar el listado de equipos en Excel.
          </p>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            {managesCustomers && (
            <Col xs={12} md={5}>
              <Form.Label className="fw-semibold text-muted small text-uppercase">Cliente</Form.Label>
              <Select<CustomerOption>
                options={customerOptions}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                onInputChange={(val) => setCustomerSearch(val)}
                inputValue={customerSearch}
                isLoading={loadingCustomers && searchEnabled}
                placeholder="Busque por nombre de cliente (mín. 3 caracteres)..."
                noOptionsMessage={() =>
                  customerSearch.length < 3
                    ? 'Ingrese al menos 3 caracteres para buscar'
                    : 'No se encontraron clientes'
                }
                isClearable
                filterOption={null}
                aria-label="Seleccione cliente"
              />
            </Col>
            )}

            <Col xs={12} md={7} className="d-flex align-items-end">
              {selectedCustomer && (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Badge bg={selectedOtIds.length > 0 ? 'primary' : 'secondary'}>
                    {selectedOtIds.length} OTs seleccionadas
                  </Badge>
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowOtsModal(true)}>
                    {selectedOtIds.length > 0 ? 'Editar selección' : 'Seleccionar OTs'}
                  </Button>
                </div>
              )}
            </Col>

            <Col xs={12}>
              <Form.Label className="fw-semibold text-muted small text-uppercase">
                Observaciones adicionales
              </Form.Label>
              <RichTextEditor
                value={observacionesHtml}
                onChange={handleObservacionesChange}
                maxLength={MAX_OBSERVACIONES_HTML}
                disabled={loading}
              />
            </Col>

            <Col xs={12}>
              <Form.Label className="fw-semibold text-muted small text-uppercase d-block">
                Evidencia fotográfica
              </Form.Label>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                <Badge bg={fotos.length > 0 ? 'primary' : 'secondary'}>
                  {fotos.length} de {MAX_INFORME_FOTOS} fotos
                </Badge>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowFotosModal(true)}
                  disabled={!canGenerate || loading}
                >
                  {fotos.length > 0 ? 'Editar fotos' : 'Seleccionar fotos'}
                </Button>
              </div>
              {fotos.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {fotos.map((f) => (
                    <div key={f.evidenciaId} className="position-relative">
                      <img
                        src={f.url}
                        alt={f.nombre || 'Foto elegida'}
                        style={{ width: 64, height: 64, objectFit: 'cover' }}
                        className="rounded border"
                      />
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 p-0 lh-1"
                        style={{ width: 18, height: 18, fontSize: 11 }}
                        aria-label={`Quitar foto ${f.nombre || f.evidenciaId}`}
                        onClick={() => {
                          setFotos((prev) => prev.filter((p) => p.evidenciaId !== f.evidenciaId));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Col>

            <Col xs={12} className="d-flex gap-2">
              <Button variant="primary" onClick={handleGenerate} disabled={!canGenerate || loading || htmlTooLong}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generando...
                  </>
                ) : (
                  'Generar Informe'
                )}
              </Button>
              <Button variant="danger" onClick={handleDownloadPdf} disabled={!canGenerate || downloading || loading || htmlTooLong}>
                {downloading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Descargando...
                  </>
                ) : (
                  'Descargar PDF'
                )}
              </Button>
              <Button
                variant="success"
                onClick={handleDownloadXlsx}
                disabled={!canGenerate || downloadingXlsx || loading}
              >
                {downloadingXlsx ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Descargando...
                  </>
                ) : (
                  'Descargar Excel'
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Generando informe, por favor espere…</p>
        </div>
      )}

      {livePayload && !loading && (
        <div ref={previewRef}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: '#1a2332' }}>Vista Previa del Informe</h5>
            <div className="d-flex gap-2">
              <Button variant="outline-danger" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
                {downloading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Descargando…
                  </>
                ) : (
                  'Descargar PDF'
                )}
              </Button>
              <Button variant="outline-success" size="sm" onClick={handleDownloadXlsx} disabled={downloadingXlsx}>
                {downloadingXlsx ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Descargando…
                  </>
                ) : (
                  'Descargar Excel'
                )}
              </Button>
            </div>
          </div>
          <InformePorOtPreview payload={livePayload} />
        </div>
      )}

      <SelectOtsModal
        show={showOtsModal}
        onHide={() => setShowOtsModal(false)}
        initialSelected={initialSelectedSet}
        clienteId={selectedCustomer?.value || ''}
        onConfirm={handleConfirmOts}
      />

      <SelectFotosModal
        show={showFotosModal}
        onHide={() => setShowFotosModal(false)}
        clienteId={selectedCustomer?.value || ''}
        otIds={selectedOtIds}
        initialSelected={fotos}
        onConfirm={(sel) => {
          setFotos(sel);
          setShowFotosModal(false);
          // Added photos need the server to resolve them; a pure subset can be filtered live.
          const generated = new Set((payload?.fotos ?? []).map((f) => f.evidenciaId));
          if (!sel.every((f) => generated.has(f.evidenciaId))) setPayload(null);
        }}
      />

      <SignatureRequiredModal
        show={showSignatureModal}
        onHide={handleSignatureCancelled}
        onSaved={handleSignatureSaved}
      />
    </div>
  );
};

export default InformesPorOtTab;
