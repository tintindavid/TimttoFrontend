import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Col, Row, Spinner } from 'react-bootstrap';
import { useGetTablero } from '@/hooks/useRequisicionReportes';
import {
  TABLERO_PERSONAL_LABELS,
  TABLERO_TENANT_LABELS,
  type TableroContador,
} from '@/types/requisicionReportes.types';
import { enlaceToPath } from '@/utils/requisicionReportes.utils';

interface CardProps {
  label: string;
  contador: TableroContador;
}

/** A counter card. With an `enlace` it is a real button that opens the matching list; otherwise it is informative. */
const TableroCard: React.FC<CardProps> = ({ label, contador }) => {
  const navigate = useNavigate();
  const body = (
    <>
      <div className="display-6 fw-semibold" data-testid="tablero-count">
        {contador.count}
      </div>
      <div className="text-muted small">{label}</div>
    </>
  );

  if (!contador.enlace) {
    return (
      <Card className="tt-card h-100" data-testid="tablero-card">
        <Card.Body>{body}</Card.Body>
      </Card>
    );
  }

  const path = enlaceToPath(contador.enlace);
  return (
    <Card className="tt-card h-100" data-testid="tablero-card">
      <Card.Body
        as="button"
        type="button"
        className="btn btn-link text-start text-decoration-none text-body w-100 h-100"
        aria-label={`${label}: ${contador.count}. Ver listado`}
        onClick={() => navigate(path)}
      >
        {body}
      </Card.Body>
    </Card>
  );
};

const TableroTab: React.FC = () => {
  const { data, isLoading, isError } = useGetTablero();
  const tablero = data?.data;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" variant="primary" aria-label="Cargando tablero" />
      </div>
    );
  }
  if (isError || !tablero) return <Alert variant="danger">No fue posible cargar el tablero.</Alert>;

  return (
    <>
      <section aria-labelledby="tablero-personal">
        <h2 id="tablero-personal" className="h5 mb-3">
          Mis pendientes
        </h2>
        <Row className="g-3 mb-4">
          {TABLERO_PERSONAL_LABELS.map(({ key, label }) =>
            tablero.personal[key] ? (
              <Col key={key} xs={6} md={4} lg={3} xl={2}>
                <TableroCard label={label} contador={tablero.personal[key]} />
              </Col>
            ) : null
          )}
        </Row>
      </section>

      {tablero.tenant && (
        <section aria-labelledby="tablero-tenant">
          <h2 id="tablero-tenant" className="h5 mb-3">
            Toda la organización
          </h2>
          <Row className="g-3">
            {TABLERO_TENANT_LABELS.map(({ key, label }) =>
              tablero.tenant?.[key] ? (
                <Col key={key} xs={6} md={4} lg={3} xl={2}>
                  <TableroCard label={label} contador={tablero.tenant[key]} />
                </Col>
              ) : null
            )}
          </Row>
        </section>
      )}
    </>
  );
};

export default TableroTab;
