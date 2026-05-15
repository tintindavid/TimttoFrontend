import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form } from 'react-bootstrap';
import Select, { SingleValue } from 'react-select';
import { toast } from 'react-toastify';

import { useCustomers } from '@/hooks/useCustomers';
import { informeService } from '@/services/informe.service';
import { MonthRangeSelect } from './components/MonthRangeSelect';
import { InformePreview } from './components/InformePreview';
import { MonthCode, InformePayload } from '@/types/informe.types';
import { Customer } from '@/types/customer.types';

interface CustomerOption {
  value: string;
  label: string;
}

function toOption(c: Customer): CustomerOption {
  return { value: c._id!, label: c.Razonsocial + (c.Ciudad ? ` — ${c.Ciudad}` : '') };
}

export const InformesPage: React.FC = () => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [mesDesde, setMesDesde] = useState<MonthCode | ''>('');
  const [mesHasta, setMesHasta] = useState<MonthCode | ''>('');
  const [observacionGeneral, setObservacionGeneral] = useState('');

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [payload, setPayload] = useState<InformePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Debounce customer search
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

  const canGenerate = !!selectedCustomer && !!mesDesde && !!mesHasta;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setPayload(null);
    try {
      const result = await informeService.generate({
        clienteId: selectedCustomer!.value,
        mesDesde: mesDesde as MonthCode,
        mesHasta: mesHasta as MonthCode,
        observacionGeneral,
      });
      setPayload(result.data);
      // Scroll to preview
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al generar el informe';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [canGenerate, selectedCustomer, mesDesde, mesHasta, observacionGeneral]);

  const handleDownloadPdf = useCallback(async () => {
    if (!canGenerate) return;
    setDownloading(true);
    try {
      await informeService.downloadPdf({
        clienteId: selectedCustomer!.value,
        mesDesde: mesDesde as MonthCode,
        mesHasta: mesHasta as MonthCode,
        observacionGeneral,
      });
      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      const msg = err?.message || 'Error al descargar el PDF';
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }, [canGenerate, selectedCustomer, mesDesde, mesHasta, observacionGeneral]);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold mb-1" style={{ color: '#1a2332' }}>Informe de Mantenimiento</h2>
          <p className="text-muted mb-0">
            Seleccione un cliente y el rango de meses para generar el informe consolidado.
          </p>
        </Col>
      </Row>

      {/* ── Filters Card ── */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            {/* Customer search */}
            <Col xs={12} md={5}>
              <Form.Label className="fw-semibold text-muted small text-uppercase">Cliente</Form.Label>
              <Select<CustomerOption>
                options={customerOptions}
                value={selectedCustomer}
                onChange={(opt: SingleValue<CustomerOption>) => {
                  setSelectedCustomer(opt ?? null);
                  setPayload(null);
                  setError(null);
                }}
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

            {/* Month range */}
            <Col xs={12} md={5}>
              <MonthRangeSelect
                mesDesde={mesDesde}
                mesHasta={mesHasta}
                onMesDesdeChange={(m) => { setMesDesde(m); setPayload(null); setError(null); }}
                onMesHastaChange={(m) => { setMesHasta(m); setPayload(null); setError(null); }}
                disabled={loading}
              />
            </Col>

            {/* Observación general */}
            <Col xs={12}>
              <Form.Label className="fw-semibold text-muted small text-uppercase">
                Observación General
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Escriba aquí observaciones generales del periodo (opcional)..."
                value={observacionGeneral}
                onChange={(e) => setObservacionGeneral(e.target.value)}
                maxLength={2000}
                aria-label="Observación general del informe"
                disabled={loading}
              />
            </Col>

            {/* Actions */}
            <Col xs={12} md={2} className="d-flex flex-column justify-content-end gap-2">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className="w-100"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generando...
                  </>
                ) : (
                  'Generar Vista Previa'
                )}
              </Button>

              <Button
                variant="danger"
                onClick={handleDownloadPdf}
                disabled={!canGenerate || downloading || loading}
                className="w-100"
              >
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

      {/* ── Error ── */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Generando informe, por favor espere…</p>
        </div>
      )}

      {/* ── Preview ── */}
      {payload && !loading && (
        <div ref={previewRef}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: '#1a2332' }}>Vista Previa del Informe</h5>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
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
          <InformePreview payload={payload} />
        </div>
      )}
    </Container>
  );
};

export default InformesPage;
