import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, Image } from 'react-bootstrap';
import { FaEdit, FaSave, FaTimes, FaBuilding, FaUpload } from 'react-icons/fa';
import { useTenant, useUpdateTenant } from '@/hooks/useTenants';
import { UpdateTenantDto } from '@/types/tenant.types';

const MyTenantPage: React.FC = () => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const { data: tenantData, isLoading, error } = useTenant(tenantId);
  const updateMutation = useUpdateTenant();

  console.log('Loaded tenant data:', tenantData);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateTenantDto>({
    name: '',
  } as any);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');

  useEffect(() => {
    if (tenantData?.data) {
      const d = tenantData.data as any;
      setFormData({
        name: d.name || '',
        email: d.email || d.email || '',
        telefono: d.telefono || '',
        slug: d.slug || '',
        direccion: d.direccion || '',
        ciudad: d.ciudad || '',
        departamento: d.departamento || '',
        pais: d.pais || '',
        nit: d.nit || '',
        website: d.website || '',
        logoUrl: d.logoUrl || '',
        status: d.status || 'active',
        plan: d.plan || 'free',
        ownerId: d.ownerId || ''
      } as any);

      if (d.logoUrl) setLogoPreview(d.logoUrl);
    }
  }, [tenantData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;
    const valid = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!valid.includes(file.type)) {
      setFileError('Solo PNG o JPG permitidos');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('El archivo no debe superar 5MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload: any = formData as any;
      if (logoFile) {
        const fd = new FormData();
        // append editable fields
        fd.append('name', (formData as any).name || '');
        fd.append('direccion', (formData as any).direccion || '');
        fd.append('email', (formData as any).email || '');
        fd.append('ciudad', (formData as any).ciudad || '');
        fd.append('telefono', (formData as any).telefono || '');
        fd.append('departamento', (formData as any).departamento || '');
        fd.append('pais', (formData as any).pais || '');
        fd.append('nit', (formData as any).nit || '');
        fd.append('website', (formData as any).website || '');
        fd.append('status', (formData as any).status || 'active');
        // do not append tenantId or plan (immutable)
        fd.append('logoUrl', logoFile, logoFile.name);
        payload = fd;
      }

      console.log('Updating tenant, payload is FormData?', payload);
      await updateMutation.mutateAsync({ id: tenantId, payload });
      setIsEditing(false);
      alert('Información del tenant actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar tenant:', error);
      alert('Error al actualizar la información');
    }
  };

  const handleCancel = () => {
    if (tenantData?.data) {
      setFormData({
        name: tenantData.data.name || '',
        email: tenantData.data.email || '',
        telefono: tenantData.data.telefono || '',
        slug: tenantData.data.slug || ''
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Error al cargar la información del tenant. Por favor, inténtalo de nuevo.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="tt-card">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaBuilding size={24} className="me-2" />
            <h5 className="mb-0">Mi Organización</h5>
          </div>
          {!isEditing ? (
            <Button 
              variant="light" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <FaEdit className="me-1" />
              Editar
            </Button>
          ) : null}
        </Card.Header>

        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Información General */}
            <div className="mb-4">
              <h6 className="text-primary mb-3 border-bottom pb-2">Información General</h6>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre de la Organización *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      placeholder="Ej: Hospital General"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Slug / Identificador</Form.Label>
                    <Form.Control
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="hospital-general"
                    />
                    <Form.Text className="text-muted">
                      Identificador único para URLs y referencias
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Detalles Administrativos y Logo */}
            <div className="mb-4">
              <h6 className="text-primary mb-3 border-bottom pb-2">Detalles Administrativos</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dirección</Form.Label>
                    <Form.Control
                      type="text"
                      name="direccion"
                      value={(formData as any).direccion || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ciudad</Form.Label>
                    <Form.Control
                      type="text"
                      name="ciudad"
                      value={(formData as any).ciudad || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Departamento</Form.Label>
                    <Form.Control
                      type="text"
                      name="departamento"
                      value={(formData as any).departamento || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>País</Form.Label>
                    <Form.Control
                      type="text"
                      name="pais"
                      value={(formData as any).pais || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>NIT</Form.Label>
                    <Form.Control
                      type="text"
                      name="nit"
                      value={(formData as any).nit || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="text"
                      name="website"
                      value={(formData as any).website || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Plan (no editable)</Form.Label>
                    <Form.Control
                      type="text"
                      name="plan"
                      value={(formData as any).plan || ''}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Logo del Tenant</Form.Label>
                    <div className="border rounded p-3 bg-light">
                      {logoPreview ? (
                        <div className="text-center mb-2 position-relative">
                          <Image src={logoPreview} alt="Logo" thumbnail style={{ maxHeight: 150 }} />
                        </div>
                      ) : (
                        <div className="text-muted mb-2">No hay logo cargado</div>
                      )}

                      <Form.Control
                        id="tenantLogo"
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        disabled={!isEditing}
                        className="mb-2"
                      />
                      <Form.Text className="text-muted d-block"><FaUpload className="me-1" />PNG/JPG, máx 5MB</Form.Text>
                      {fileError && <Alert variant="danger" className="mt-2">{fileError}</Alert>}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Información de Contacto */}
            <div className="mb-4">
              <h6 className="text-primary mb-3 border-bottom pb-2">Información de Contacto</h6>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email de Contacto</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="contacto@hospital.com"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="+57 300 123 4567"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Información del Sistema */}
            {tenantData?.data && (
              <div className="mb-4">
                <h6 className="text-primary mb-3 border-bottom pb-2">Información del Sistema</h6>
                
                <Row>
                  <Col md={4}>
                    <div className="mb-3">
                      <small className="text-muted d-block">ID del Tenant</small>
                      <div className="fw-semibold">
                        <code>{tenantData.data._id || tenantData.data.id}</code>
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className="mb-3">
                      <small className="text-muted d-block">Estado</small>
                      <div>
                        {tenantData.data.active ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-danger">Inactivo</span>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div className="mb-3">
                      <small className="text-muted d-block">Fecha de Creación</small>
                      <div>
                        {tenantData.data.createdAt 
                          ? new Date(tenantData.data.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Botones de Acción */}
            {isEditing && (
              <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <Button 
                  variant="secondary" 
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  <FaTimes className="me-1" />
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MyTenantPage;
