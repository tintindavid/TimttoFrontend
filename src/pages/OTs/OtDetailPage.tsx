import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOT } from '@/hooks/useOTs';
import { Container, Button } from 'react-bootstrap';

const OtDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useOT(id || '');

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div className="text-danger">Error al cargar</div>;
  if (!data?.data) return <div>No encontrado</div>;

  const ot = data.data;

  return (
    <Container>
      <h1>Detalle OT</h1>
      <div><strong>Consecutivo:</strong> {ot.Consecutivo}</div>
      <div><strong>Cliente:</strong> {ot.ClienteId?.Razonsocial}</div>
      <div><strong>Estado:</strong> {ot.EstadoOt}</div>

      <div className="mt-3">
        <Button onClick={() => navigate(-1)}>Volver</Button>
        <Button className="ms-2" onClick={() => navigate(`/ots/${ot._id}/edit`)}>Editar</Button>
      </div>
    </Container>
  );
};

export default OtDetailPage;
