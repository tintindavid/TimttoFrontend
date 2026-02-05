import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Image } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaIdCard, FaEdit, FaSignature, FaUserTag } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@/hooks/useUsers';
import EditProfileModal from './EditProfileModal';
import SignatureModal from './SignatureModal';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
    const getUserIdFromToken = (token: string): string | null => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id || payload.sub;
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    };

    const { token } = useAuth();
    const userId =  (token ? getUserIdFromToken(token) : null);
    const { data: userData, isLoading, error, refetch } = useUser(userId || '');

    const [showEditModal, setShowEditModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    // Usar datos actualizados del servidor si están disponibles, sino del contexto
    const user = userData?.data || null;

    console.log('Usuario cargado:', user);
  
  // Si no hay token, no está autenticado
  if (!token) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          No hay usuario autenticado. Por favor, inicia sesión.
        </Alert>
      </Container>
    );
  }

  // Si está cargando y no hay usuario todavía
  if (isLoading && !user) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando perfil...</p>
      </Container>
    );
  }

  // Verificación final para TypeScript
  if (!user) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando información del usuario...</p>
      </Container>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'technician':
        return 'primary';
      case 'user':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'technician':
        return 'Técnico';
      case 'user':
        return 'Usuario';
      default:
        return role;
    }
  };

  return (
    <Container className="profile-page mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="page-title">
            <FaUser className="me-2" />
            Mi Perfil
          </h2>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4">
          <Card className="profile-card shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="profile-photo-container mb-3">
                {user.photo ? (
                  <Image
                    src={user.photo}
                    roundedCircle
                    className="profile-photo"
                    alt={user.fullName || user.email}
                  />
                ) : (
                  <div className="profile-photo-placeholder">
                    <FaUser size={60} />
                  </div>
                )}
              </div>

              <h4 className="mb-1">{user.fullName || `${user.firstName} ${user.lastName}`}</h4>
              <p className="text-muted mb-2">@{user.username || user.email.split('@')[0]}</p>
              
              <Badge bg={getRoleBadgeVariant(user.role)} className="mb-3">
                {getRoleLabel(user.role)}
              </Badge>

              <div className="d-grid gap-2 mt-4">
                <Button 
                  variant="primary" 
                  onClick={() => setShowEditModal(true)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaEdit className="me-2" />
                  Editar Perfil
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowSignatureModal(true)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaSignature className="me-2" />
                  {user.fileFirma ? 'Actualizar Firma' : 'Agregar Firma'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="profile-details shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Información Personal</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaUser className="me-2 text-primary" />
                      Nombre
                    </div>
                    <div className="info-value">{user.firstName || 'No especificado'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaUser className="me-2 text-primary" />
                      Apellido
                    </div>
                    <div className="info-value">{user.lastName || 'No especificado'}</div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaUserTag className="me-2 text-primary" />
                      Usuario
                    </div>
                    <div className="info-value">{user.username || 'No especificado'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaEnvelope className="me-2 text-primary" />
                      Email
                    </div>
                    <div className="info-value">{user.email}</div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaPhone className="me-2 text-primary" />
                      Teléfono
                    </div>
                    <div className="info-value">{user.phone || 'No especificado'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaCity className="me-2 text-primary" />
                      Ciudad
                    </div>
                    <div className="info-value">{user.city || 'No especificado'}</div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaIdCard className="me-2 text-primary" />
                      Registro INVIMA
                    </div>
                    <div className="info-value">{user.registroInvima || 'No especificado'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-item">
                    <div className="info-label">
                      <FaSignature className="me-2 text-primary" />
                      Firma Digital
                    </div>
                    <div className="info-value">
                      {user.fileFirma ? (
                        <Badge bg="success">Configurada</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">No configurada</Badge>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {user.fileFirma && (
            <Card className="signature-preview shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">Vista Previa de Firma</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <div className="signature-image-container">
                  <img 
                    src={user.fileFirma} 
                    alt="Firma digital" 
                    className="signature-preview-image"
                  />
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modales */}
      <EditProfileModal 
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        user={user}
        onSuccess={() => {
          refetch();
          setShowEditModal(false);
        }}
      />

      <SignatureModal 
        show={showSignatureModal}
        onHide={() => setShowSignatureModal(false)}
        userId={user._id || ''}
        currentSignature={user.fileFirma}
        onSuccess={() => {
          refetch();
          setShowSignatureModal(false);
        }}
      />
    </Container>
  );
};

export default ProfilePage;
