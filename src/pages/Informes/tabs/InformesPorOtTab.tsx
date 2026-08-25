import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import Select, { SingleValue } from 'react-select';
import { toast } from 'react-toastify';

import { useAuth } from '@/context/AuthContext';
import { useCustomers } from '@/hooks/useCustomers';
import { informeService } from '@/services/informe.service';
import { SelectOtsModal } from '../components/SelectOtsModal';
import { InformePorOtPreview } from '../components/InformePorOtPreview';
import { SignatureRequiredModal } from '../components/SignatureRequiredModal';
import { InformePorOtPayload } from '@/types/informe.types';
import { Customer } from '@/types/customer.types';

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
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [selectedOtIds, setSelectedOtIds] = useState<string[]>([]);
  const [observacionGeneral, setObservacionGeneral] = useState('');

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

  const searchEnabled = debouncedSearch.length >= 3;
  const { data: customersData, isLoading: loadingCustomers } = useCustomers(
    searchEnabled ? { search: debouncedSearch, limit: 20 } : undefined,
  );

  const customerOptions: CustomerOption[] =
    searchEnabled && customersData?.data ? customersData.data.map(toOption) : [];

  const initialSelectedSet = useMemo(() => new Set(selectedOtIds), [selectedOtIds]);

  const handleCustomerChange = (opt: SingleValue<CustomerOption>) => {
    setSelectedCustomer(opt ?? null);
    setSelectedOtIds([]);
    setPayload(null);
    setError(null);
    if (opt) setShowOtsModal(true);
  };

  const handleConfirmOts = (ids: string[]) => {
    setSelectedOtIds(ids);
    setShowOtsModal(false);
    setPayload(null);
    setError(null);
  };

  const canGenerate = !!selectedCustomer && selectedOtIds.length > 0;

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
      const result = await informeService.generateByOt({
        clienteId: selectedCustomer!.value,
        otIds: selectedOtIds,
        observacionGeneral,
      });
      setPayload(result.data);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al generar el informe';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, selectedOtIds, observacionGeneral]);

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    withSignatureGate(doGenerate);
  }, [canGenerate, withSignatureGate, doGenerate]);

  const doDownloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      await informeService.downloadPdfByOt({
        clienteId: selectedCustomer!.value,
        otIds: selectedOtIds,
        observacionGeneral,
      });
      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      const msg = err?.message || 'Error al descargar el PDF';
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }, [selectedCustomer, selectedOtIds, observacionGeneral]);

  const handleDownloadPdf = useCallback(() => {
    if (!canGenerate) return;
    withSignatureGate(doDownloadPdf);
  }, [canGenerate, withSignatureGate, doDownloadPdf]);

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
            Seleccione un cliente y las OTs a incluir para generar el informe consolidado de cumplimiento.
          </p>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
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
                Observación General
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Escriba aquí observaciones generales (opcional)..."
                value={observacionGeneral}
                onChange={(e) => setObservacionGeneral(e.target.value)}
                maxLength={2000}
                aria-label="Observación general del informe"
                disabled={loading}
              />
            </Col>

            <Col xs={12} className="d-flex gap-2">
              <Button variant="primary" onClick={handleGenerate} disabled={!canGenerate || loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generando...
                  </>
                ) : (
                  'Generar Informe'
                )}
              </Button>
              <Button variant="danger" onClick={handleDownloadPdf} disabled={!canGenerate || downloading || loading}>
                {downloading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Descargando...
                  </>
                ) : (
                  'Descargar PDF'
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

      {payload && !loading && (
        <div ref={previewRef}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: '#1a2332' }}>Vista Previa del Informe</h5>
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
          </div>
          <InformePorOtPreview payload={payload} />
        </div>
      )}

      <SelectOtsModal
        show={showOtsModal}
        onHide={() => setShowOtsModal(false)}
        initialSelected={initialSelectedSet}
        clienteId={selectedCustomer?.value || ''}
        onConfirm={handleConfirmOts}
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
