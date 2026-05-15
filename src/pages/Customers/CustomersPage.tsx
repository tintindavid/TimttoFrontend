import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import DataTable from '@/components/common/DataTable';
import AppPagination from '@/components/common/Pagination';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customerService } from '@/services/customer.service';

const CustomersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, error } = useCustomers({ page, limit: 10 });
  const deleteMutation = useDeleteCustomer();
  const navigate = useNavigate();

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await customerService.exportCSV();
      toast.success('Clientes exportados correctamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al exportar clientes');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmar eliminar cliente?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { key: 'Razonsocial', label: 'Razón Social' },
    { key: 'Nit', label: 'NIT' },
    { key: 'Email', label: 'Email' },
    { key: 'Ciudad', label: 'Ciudad' },
  ];

  return (
    <Container fluid="md" className="py-3">
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="mb-0">Clientes</h1>
          <p className="text-muted mb-0">Gestionar clientes y terceros</p>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting
              ? <><Spinner animation="border" size="sm" className="me-1" />Exportando...</>
              : <><i className="bi bi-download me-1" />Exportar CSV</>}
          </Button>
          <Button variant="primary" onClick={() => navigate('/customers/new')}>
            <i className="bi bi-plus-lg me-1" /> Crear Cliente
          </Button>
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {Boolean(error) && (
        <Alert variant="danger">Error cargando clientes.</Alert>
      )}

      {data && (
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body>
            <DataTable
              data={data.data}
              columns={columns}
              actions={(row: any) => (
                <>
                  <Button size="sm" variant="link" onClick={() => navigate(`/customers/${row._id}`)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="link" onClick={() => navigate(`/customers/${row._id}/edit`)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>
                    Eliminar
                  </Button>
                </>
              )}
            />
            {data.pagination && (
              <div className="d-flex justify-content-center mt-3">
                <AppPagination
                  page={data.pagination.page}
                  pages={data.pagination.pages}
                  onChange={setPage}
                />
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default CustomersPage;
