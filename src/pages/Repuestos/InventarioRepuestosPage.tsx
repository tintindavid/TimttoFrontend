import React from 'react';
import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  useCreateInventarioRepuesto,
  useDeleteInventarioRepuesto,
  useInventarioList,
  useUpdateInventarioRepuesto,
} from '@/hooks/useInventarioRepuestos';
import { InventarioRepuesto } from '@/types/inventarioRepuesto.types';

const hasInventarioPlan = () => {
  const value = (localStorage.getItem('tenantPlan') || '').toLowerCase();
  return value.includes('inventario');
};

const InventarioRepuestosPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [stockBajo, setStockBajo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventarioRepuesto | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    referencia: '',
    descripcion: '',
    stockActual: 0,
    stockMinimo: 0,
    unidad: 'unidades',
    precio: 0,
  });

  const listQuery = useInventarioList({ page: 1, limit: 100, search, stockBajo });
  const createMutation = useCreateInventarioRepuesto();
  const updateMutation = useUpdateInventarioRepuesto();
  const deleteMutation = useDeleteInventarioRepuesto();

  const items = listQuery.data?.data || [];
  const filteredItems = useMemo(() => items, [items]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      nombre: '',
      referencia: '',
      descripcion: '',
      stockActual: 0,
      stockMinimo: 0,
      unidad: 'unidades',
      precio: 0,
    });
    setShowModal(true);
  };

  const openEdit = (item: InventarioRepuesto) => {
    setEditing(item);
    setFormData({
      nombre: item.nombre || '',
      referencia: item.referencia || '',
      descripcion: item.descripcion || '',
      stockActual: item.stockActual || 0,
      stockMinimo: item.stockMinimo || 0,
      unidad: item.unidad || 'unidades',
      precio: item.precio || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.nombre.trim()) {
        toast.error('El nombre es obligatorio');
        return;
      }

      if (editing?._id) {
        await updateMutation.mutateAsync({ id: editing._id, data: formData });
        toast.success('Ítem de inventario actualizado');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Ítem de inventario creado');
      }
      setShowModal(false);
    } catch (error: any) {
      toast.error(error?.message || 'Error guardando ítem de inventario');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('¿Desea eliminar este ítem del inventario?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Ítem eliminado');
    } catch (error: any) {
      toast.error(error?.message || 'Error eliminando ítem');
    }
  };

  if (!hasInventarioPlan()) {
    return (
      <Container>
        <Alert variant="warning" className="mt-3">
          Tu plan actual no incluye la funcionalidad de inventario de repuestos.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="h4 mb-0">Inventario de repuestos</h1>
        </Col>
        <Col xs="auto">
          <Button onClick={openCreate}>Crear ítem</Button>
        </Col>
      </Row>

      <Row className="mb-3 g-2">
        <Col md={8}>
          <Form.Control
            placeholder="Buscar por nombre o referencia"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={4} className="d-flex align-items-center">
          <Form.Check
            type="checkbox"
            label="Mostrar solo stock bajo"
            checked={stockBajo}
            onChange={(e) => setStockBajo(e.target.checked)}
          />
        </Col>
      </Row>

      <Card className="tt-card">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Referencia</th>
                <th>Descripción</th>
                <th>Stock</th>
                <th>Stock mínimo</th>
                <th>Unidad</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: InventarioRepuesto) => {
                const isLow = (item.stockActual || 0) < (item.stockMinimo || 0);
                return (
                  <tr key={item._id} className={isLow ? 'table-warning' : ''}>
                    <td>{item.nombre}</td>
                    <td>{item.referencia || '-'}</td>
                    <td>{item.descripcion || '-'}</td>
                    <td>{item.stockActual}</td>
                    <td>{item.stockMinimo || 0}</td>
                    <td>{item.unidad || '-'}</td>
                    <td>{item.precio || 0}</td>
                    <td>{isLow ? <Badge bg="warning" text="dark">Stock bajo</Badge> : <Badge bg="success">OK</Badge>}</td>
                    <td className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => openEdit(item)}>Editar</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item._id)}>Eliminar</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Editar ítem' : 'Crear ítem'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={formData.nombre} onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Referencia</Form.Label>
            <Form.Control value={formData.referencia} onChange={(e) => setFormData((p) => ({ ...p, referencia: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={2} value={formData.descripcion} onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))} />
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-2">
                <Form.Label>Stock actual</Form.Label>
                <Form.Control type="number" min={0} value={formData.stockActual} onChange={(e) => setFormData((p) => ({ ...p, stockActual: Number(e.target.value) }))} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-2">
                <Form.Label>Stock mínimo</Form.Label>
                <Form.Control type="number" min={0} value={formData.stockMinimo} onChange={(e) => setFormData((p) => ({ ...p, stockMinimo: Number(e.target.value) }))} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group className="mb-2">
                <Form.Label>Unidad</Form.Label>
                <Form.Select value={formData.unidad} onChange={(e) => setFormData((p) => ({ ...p, unidad: e.target.value }))}>
                  <option value="unidades">unidades</option>
                  <option value="metros">metros</option>
                  <option value="pares">pares</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-2">
                <Form.Label>Precio</Form.Label>
                <Form.Control type="number" min={0} value={formData.precio} onChange={(e) => setFormData((p) => ({ ...p, precio: Number(e.target.value) }))} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InventarioRepuestosPage;
