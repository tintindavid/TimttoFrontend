import React, { useState } from 'react';
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Table,
  Badge,
  Dropdown,
  Form
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useProtocols, useDeleteProtocol } from '@/hooks/useProtocols';
import { ProtocolMtto } from '@/types/protocol.types';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';

const ProtocolsPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolMtto | null>(null);

  const { data, isLoading, error } = useProtocols({
    page,
    limit: 10,
    search: searchTerm
  });

  const deleteMutation = useDeleteProtocol();

  const handleDelete = async () => {
    if (!selectedProtocol?._id) return;

    try {
      await deleteMutation.mutateAsync(selectedProtocol._id);
      setShowDeleteModal(false);
      setSelectedProtocol(null);
    } catch (err) {
      console.error('Error al eliminar protocolo:', err);
    }
  };

  const openDeleteModal = (protocol: ProtocolMtto) => {
    setSelectedProtocol(protocol);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Error al cargar protocolos. Intenta nuevamente.
      </Alert>
    );
  }

  const protocols = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <Container>
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Protocolos de Mantenimiento</h1>
          <p className="text-muted">
            Gestión de protocolos de mantenimiento
          </p>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/protocols/new')}
          >
            + Crear Protocolo
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Buscar protocolos por nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </Col>
        <Col md={6} className="d-flex justify-content-end align-items-center">
          <Badge bg="info" className="fs-6">
            {protocols.length} protocolo{protocols.length !== 1 ? 's' : ''}
          </Badge>
        </Col>
      </Row>

      <Card className="tt-card">
        <Card.Body className="p-0">
          {protocols.length === 0 ? (
            <div className="text-center py-5">
              <Alert variant="info" className="mx-4">
                <h5>No hay protocolos disponibles</h5>
                <p className="mb-3">
                  Crea tu primer protocolo para comenzar.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/protocols/new')}
                >
                  Crear Protocolo
                </Button>
              </Alert>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Actividades</th>
                      <th>Creado</th>
                      <th className="text-center" style={{ width: 120 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocols.map((protocol) => (
                      <tr key={protocol._id}>
                        <td>
                          <strong>{protocol.nombre}</strong>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: 220 }}>
                            {protocol.Descripcion ?? (
                              <span className="text-muted fst-italic">
                                Sin descripción
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">
                            {protocol.actividadesMtto?.length ?? 0}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {protocol.createdAt
                              ? new Date(protocol.createdAt).toLocaleDateString('es-ES')
                              : 'N/A'}
                          </small>
                        </td>
                        <td style={{ position: 'relative' }}>
                          <Dropdown align="end">
                            <Dropdown.Toggle
                              variant="outline-secondary"
                              size="sm"
                            >
                              Acciones
                            </Dropdown.Toggle>

                            <Dropdown.Menu
                              renderOnMount
                              popperConfig={{
                                strategy: 'fixed'
                              }}
                            >
                              <Dropdown.Item
                                onClick={() => navigate(`/protocols/${protocol._id}`)}
                              >
                                Ver detalle
                              </Dropdown.Item>

                              <Dropdown.Item
                                onClick={() => navigate(`/protocols/${protocol._id}/edit`)}
                              >
                                Editar
                              </Dropdown.Item>

                              <Dropdown.Divider />

                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => openDeleteModal(protocol)}
                              >
                                Eliminar
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center p-3 border-top">
                  <Pagination
                    page={page}
                    pages={totalPages}
                    onChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <ConfirmModal
        show={showDeleteModal}
        title="Confirmar eliminación"
        body={`¿Eliminar el protocolo "${selectedProtocol?.nombre}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedProtocol(null);
        }}
      />
    </Container>
  );
};

export default ProtocolsPage;

