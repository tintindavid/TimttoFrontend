import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Form, Button, Row, Col, Image, Alert } from 'react-bootstrap';
import { FaUpload, FaTimes } from 'react-icons/fa';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';

const CustomerFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: customerData } = useCustomer(id || '');
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const [formData, setFormData] = useState({
    Razonsocial: '',
    Ciudad: '',
    Departamento: '',
    Email: '',
    Nit: '',
    Direccion: '',
    Logo: '',
    TelContacto: '',
    UserContacto: ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');

  console.log('logoFile:', logoFile);
  console.log('formData:', formData);
  // Inicializar datos cuando llegue la respuesta del backend
  useEffect(() => {
    if (isEdit && customerData?.data) {
      setFormData({
        Razonsocial: customerData.data.Razonsocial || '',
        Ciudad: customerData.data.Ciudad || '',
        Departamento: customerData.data.Departamento || '',
        Email: customerData.data.Email || '',
        Nit: customerData.data.Nit?.toString() || '',
        Direccion: customerData.data.Direccion || '',
        Logo: customerData.data.Logo || '',
        TelContacto: customerData.data.TelContacto || '',
        UserContacto: customerData.data.UserContacto || ''
      });
      
      // Si hay logo existente, mostrar preview
      if (customerData.data.Logo) {
        setLogoPreview(customerData.data.Logo);
      }
    }
  }, [customerData, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    
    if (!file) {
      setLogoFile(null);
      setLogoPreview('');
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Solo se permiten archivos PNG o JPG');
      setLogoFile(null);
      setLogoPreview('');
      e.target.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileError('El archivo no debe superar los 5MB');
      setLogoFile(null);
      setLogoPreview('');
      e.target.value = '';
      return;
    }

    console.log('🔄 Archivo seleccionado:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    setLogoFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFileError('');
    // Limpiar el input file
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear FormData para enviar archivo
    const formDataToSend = new FormData();
    
    // Agregar todos los campos del formulario
    formDataToSend.append('Razonsocial', formData.Razonsocial);
    formDataToSend.append('Ciudad', formData.Ciudad);
    formDataToSend.append('Departamento', formData.Departamento);
    formDataToSend.append('Email', formData.Email);
    if (formData.Nit) formDataToSend.append('Nit', formData.Nit);
    if (formData.Direccion) formDataToSend.append('Direccion', formData.Direccion);
    if (formData.TelContacto) formDataToSend.append('TelContacto', formData.TelContacto);
    if (formData.UserContacto) formDataToSend.append('UserContacto', formData.UserContacto);
    
    // Agregar archivo de logo si existe
    if (logoFile) {
      formDataToSend.append('logo', logoFile, logoFile.name);
      console.log('✅ Logo file agregado al FormData:', {
        name: logoFile.name,
        type: logoFile.type,
        size: logoFile.size
      });
    } else {
      console.log('⚠️ No hay archivo de logo para agregar');
    }

    console.log('📦 FormData preparado para enviar. Campos:', {
      Razonsocial: formData.Razonsocial,
      Email: formData.Email,
      logoFile: logoFile ? `${logoFile.name} (${logoFile.size} bytes)` : 'No file'
    });

    console.log('Enviando datos al servidor...', formDataToSend);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: formDataToSend });
      } else {
        await createMutation.mutateAsync(formDataToSend);
      }
      navigate('/customers');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (isEdit && !customerData) return <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>;

  return (
    <Container>
      <Card className="tt-card">
        <Card.Body>
          <Card.Title>{isEdit ? 'Editar Cliente' : 'Crear Cliente'}</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Razón social</Form.Label>
              <Form.Control 
                name="Razonsocial" 
                value={formData.Razonsocial} 
                onChange={handleInputChange} 
                required 
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>NIT</Form.Label>
                  <Form.Control 
                    name="Nit" 
                    type="number" 
                    value={formData.Nit} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Control 
                    name="Ciudad" 
                    value={formData.Ciudad} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Departamento</Form.Label>
                  <Form.Control 
                    name="Departamento" 
                    value={formData.Departamento} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    name="Email" 
                    type="email" 
                    value={formData.Email} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono contacto</Form.Label>
                  <Form.Control 
                    name="TelContacto" 
                    value={formData.TelContacto} 
                    onChange={handleInputChange} 
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Persona contacto</Form.Label>
                  <Form.Control 
                    name="UserContacto" 
                    value={formData.UserContacto} 
                    onChange={handleInputChange} 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control 
                    name="Direccion" 
                    value={formData.Direccion} 
                    onChange={handleInputChange} 
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Logo del Cliente</Form.Label>
              <div className="border rounded p-3 bg-light">
                {/* Preview del logo */}
                {logoPreview && (
                  <div className="mb-3 text-center position-relative">
                    <Image 
                      src={logoPreview} 
                      alt="Logo preview" 
                      thumbnail 
                      style={{ maxWidth: '200px', maxHeight: '200px' }}
                    />
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-2"
                      onClick={handleRemoveLogo}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                )}

                {/* Input de archivo */}
                <Form.Control 
                  id="logoInput"
                  type="file" 
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="mb-2"
                />
                
                <Form.Text className="text-muted d-block">
                  <FaUpload className="me-1" />
                  Formatos permitidos: PNG, JPG. Tamaño máximo: 5MB
                </Form.Text>

                {/* Mensaje de error */}
                {fileError && (
                  <Alert variant="danger" className="mt-2 mb-0">
                    {fileError}
                  </Alert>
                )}
              </div>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button variant="primary" type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerFormPage;
