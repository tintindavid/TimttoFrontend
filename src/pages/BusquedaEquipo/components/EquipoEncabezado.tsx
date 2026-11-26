import React, { useState } from 'react';
import { Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaFileAlt, FaImage } from 'react-icons/fa';
import type { ResumenEquipo } from '@/types/busquedaEquipo.types';
import { getEstadoOperativoBadgeStyle } from '@/utils/estadoOperativoBadge.util';
import { capitalizar, formatearFecha } from '../formato';
import type { EnlacesResumen } from '../useEnlacesResumen';

interface EquipoEncabezadoProps {
  resumen: ResumenEquipo;
  enlaces: EnlacesResumen;
}

interface Dato {
  etiqueta: string;
  valor: React.ReactNode;
}

const GrupoDatos: React.FC<{ titulo: string; datos: Dato[] }> = ({ titulo, datos }) => {
  const conValor = datos.filter((d) => !!d.valor);
  if (conValor.length === 0) return null;
  return (
    <section>
      <h2 className="resumen-grupo-titulo">{titulo}</h2>
      <dl className="resumen-datos">
        {conValor.map((d) => (
          <div key={d.etiqueta}>
            <dt>{d.etiqueta}</dt>
            <dd>{d.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const Foto: React.FC<{ src: string | null; nombre: string }> = ({ src, nombre }) => {
  const [fallida, setFallida] = useState(false);
  if (!src || fallida) {
    return (
      <div className="resumen-foto resumen-foto-vacia">
        <FaImage size={32} aria-hidden="true" />
        <span className="small">Sin foto</span>
      </div>
    );
  }
  return <img className="resumen-foto" src={src} alt={`Foto de ${nombre}`} onError={() => setFallida(true)} />;
};

/** Identity card of the equipment: photo, operative state, customer, location, maintenance and resume sheet. */
const EquipoEncabezado: React.FC<EquipoEncabezadoProps> = ({ resumen, enlaces }) => {
  const { equipo, cliente, hojaVida } = resumen;
  const nombre = equipo.nombre || 'Equipo sin nombre';
  const marcaModelo = [equipo.marca, equipo.modelo].filter(Boolean).join(' · ');

  return (
    <Card className="tt-card mb-3">
      <Card.Body className="resumen-encabezado">
        <Foto key={equipo.foto ?? ''} src={equipo.foto} nombre={nombre} />

        <div className="resumen-contenido">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="h4 mb-0 text-break">{nombre}</h1>
            {equipo.estadoOperativo && (
              <Badge bg="" style={getEstadoOperativoBadgeStyle(equipo.estadoOperativo)}>
                {equipo.estadoOperativo}
              </Badge>
            )}
          </div>
          {marcaModelo && <p className="text-muted mb-0">{marcaModelo}</p>}

          <div className="resumen-grupos">
            <GrupoDatos
              titulo="Identificación"
              datos={[
                { etiqueta: 'Serie', valor: equipo.serie },
                { etiqueta: 'Inventario', valor: equipo.inventario },
                { etiqueta: 'Registro INVIMA', valor: equipo.invima },
                { etiqueta: 'Riesgo', valor: equipo.riesgo },
                { etiqueta: 'Estado', valor: equipo.estado !== equipo.estadoOperativo && equipo.estado },
              ]}
            />
            <GrupoDatos
              titulo="Ubicación"
              datos={[
                {
                  etiqueta: 'Cliente',
                  valor: enlaces.cliente ? <Link to={enlaces.cliente}>{cliente?.nombre}</Link> : cliente?.nombre,
                },
                { etiqueta: 'Sede', valor: equipo.sede },
                { etiqueta: 'Servicio', valor: equipo.servicio },
                { etiqueta: 'Ubicación', valor: equipo.ubicacion },
              ]}
            />
            <GrupoDatos
              titulo="Mantenimiento"
              datos={[
                { etiqueta: 'Último', valor: formatearFecha(equipo.ultimoMtto, 'Sin registro') },
                { etiqueta: 'Próximo', valor: equipo.proximoMtto ? capitalizar(equipo.proximoMtto) : 'Sin programar' },
                { etiqueta: 'Meses programados', valor: (equipo.mesesMtto ?? []).map(capitalizar).join(', ') },
                {
                  etiqueta: 'Hoja de vida',
                  valor: hojaVida.disponible && (hojaVida.existe ? hojaVida.estado || 'Registrada' : 'Sin hoja de vida'),
                },
              ]}
            />
          </div>

          <div className="resumen-acciones">
            {enlaces.hojaVida && (
              <Link to={enlaces.hojaVida} className="btn btn-primary btn-sm">
                <FaFileAlt className="me-2" aria-hidden="true" />
                Ver hoja de vida
              </Link>
            )}
            {enlaces.cronograma && (
              <Link to={enlaces.cronograma} className="btn btn-outline-primary btn-sm">
                <FaCalendarAlt className="me-2" aria-hidden="true" />
                Ver cronograma
              </Link>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EquipoEncabezado;
