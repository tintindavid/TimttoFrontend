import React, { useState } from 'react';
import { Badge, Card, ListGroup, Nav, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ESTADOS_FINAL_LABELS, TIPOS_ACTIVIDAD } from '@/constants/actividadExterna';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  TICKET_URGENCY_LABELS,
} from '@/constants/ticket.constants';
import type { ResumenEquipo } from '@/types/busquedaEquipo.types';
import type { EstadoFinal } from '@/types/actividadExterna.types';
import type { TicketStatus, TicketUrgency } from '@/types/ticket.types';
import { formatearFecha } from '../formato';
import type { EnlacesResumen } from '../useEnlacesResumen';

interface Fila {
  id: string;
  titulo: string;
  enlace: string | null;
  detalle: React.ReactNode[];
  estado: { texto: string; variante: string } | null;
}

interface Seccion {
  clave: string;
  titulo: string;
  total: number;
  filas: Fila[];
  vacio: string;
  verTodo: { texto: string; enlace: string } | null;
}

const VARIANTES_REPORTE: Record<string, string> = {
  Cerrado: 'success',
  Procesado: 'primary',
  'En Progreso': 'info',
  Abierto: 'warning',
  Pendiente: 'warning',
  Cancelado: 'secondary',
};

const VARIANTES_ESTADO_FINAL: Record<string, string> = {
  aprobada: 'success',
  aprobada_con_observaciones: 'warning',
  rechazada: 'danger',
};

const VARIANTES_REPUESTO: Record<string, string> = {
  Instalado: 'success',
  Rechazado: 'danger',
  Solicitado: 'warning',
  'En Proceso': 'info',
};

const insignia = (valor: string | null, variantes: Record<string, string>, etiqueta?: string): Fila['estado'] =>
  valor ? { texto: etiqueta ?? valor, variante: variantes[valor] ?? 'secondary' } : null;

const construirSecciones = (resumen: ResumenEquipo, enlaces: EnlacesResumen): Seccion[] => {
  const { mantenimientos, actividadesExternas, tickets, repuestos } = resumen;
  const verTodo = (texto: string, enlace: string | null) => (enlace ? { texto, enlace } : null);
  const secciones: (Seccion & { disponible: boolean })[] = [
    {
      clave: 'mantenimientos',
      titulo: 'Mantenimientos',
      disponible: mantenimientos.disponible,
      total: mantenimientos.total,
      vacio: 'Este equipo aún no tiene reportes de mantenimiento.',
      verTodo: verTodo('Ver historial en la hoja de vida', enlaces.pestanaHojaVida('preventivos')),
      filas: mantenimientos.recientes.map((m) => {
        const enlaceOt = m.ot ? enlaces.ot(m.ot._id) : null;
        const textoOt = m.ot ? `OT ${m.ot.consecutivo ?? ''}`.trim() : '';
        return {
          id: m._id,
          titulo: `Reporte ${m.consecutivo ?? 'sin consecutivo'}`,
          enlace: `/reports/${m._id}/view`,
          detalle: [
            m.tipoMtto,
            formatearFecha(m.fecha),
            enlaceOt ? (
              <Link to={enlaceOt} className="resumen-enlace-secundario">
                {textoOt}
              </Link>
            ) : (
              textoOt
            ),
          ],
          estado: insignia(m.estado, VARIANTES_REPORTE),
        };
      }),
    },
    {
      clave: 'actividades-externas',
      titulo: 'Actividades externas',
      disponible: actividadesExternas.disponible,
      total: actividadesExternas.total,
      vacio: 'Este equipo no tiene actividades externas registradas.',
      verTodo: verTodo('Ver en la hoja de vida', enlaces.actividadesExternas),
      filas: actividadesExternas.recientes.map((a) => {
        const tipo = TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo)?.label ?? a.tipo;
        return {
          id: a._id,
          titulo: [tipo, a.consecutivo].filter(Boolean).join(' '),
          enlace: enlaces.actividadesExternas,
          detalle: [a.proveedor, formatearFecha(a.fecha)],
          estado: insignia(
            a.estadoFinal,
            VARIANTES_ESTADO_FINAL,
            ESTADOS_FINAL_LABELS[a.estadoFinal as EstadoFinal]
          ),
        };
      }),
    },
    {
      clave: 'tickets',
      titulo: 'Tickets',
      disponible: tickets.disponible,
      total: tickets.total,
      vacio: 'Este equipo no tiene tickets.',
      verTodo: null,
      filas: tickets.recientes.map((t) => {
        const urgencia = t.urgency ? TICKET_URGENCY_LABELS[t.urgency as TicketUrgency] ?? t.urgency : '';
        return {
          id: t._id,
          titulo: `Ticket ${t.consecutivo ?? 'sin consecutivo'}`,
          enlace: enlaces.ticket(t._id),
          detalle: [urgencia && `Urgencia: ${urgencia}`, formatearFecha(t.fecha)],
          estado: insignia(t.status, TICKET_STATUS_VARIANTS, TICKET_STATUS_LABELS[t.status as TicketStatus]),
        };
      }),
    },
    {
      clave: 'repuestos',
      titulo: 'Repuestos',
      disponible: repuestos.disponible,
      total: repuestos.total,
      vacio: 'Este equipo no tiene repuestos registrados.',
      verTodo: verTodo('Ver en la hoja de vida', enlaces.pestanaHojaVida('repuestos')),
      filas: repuestos.recientes.map((r) => ({
        id: r._id,
        titulo: r.nombre,
        enlace: null,
        detalle: [r.cantidad != null && `Cantidad: ${r.cantidad}`, formatearFecha(r.fecha)],
        estado: insignia(r.estado, VARIANTES_REPUESTO),
      })),
    },
  ];
  return secciones.filter((s) => s.disponible);
};

const ListaSeccion: React.FC<{ seccion: Seccion }> = ({ seccion }) => {
  if (seccion.filas.length === 0) {
    return <p className="text-muted text-center py-4 px-3 mb-0">{seccion.vacio}</p>;
  }
  const hayMas = seccion.total > seccion.filas.length;
  return (
    <>
      <ListGroup variant="flush">
        {seccion.filas.map((fila) => (
          <ListGroup.Item key={fila.id} className="d-flex justify-content-between align-items-start gap-3 py-3">
            <div className="resumen-fila">
              {fila.enlace ? (
                <Link to={fila.enlace} className="fw-semibold">
                  {fila.titulo}
                </Link>
              ) : (
                <span className="fw-semibold">{fila.titulo}</span>
              )}
              <div className="small text-muted">
                {fila.detalle.filter(Boolean).map((parte, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && ' · '}
                    {parte}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {fila.estado && (
              <Badge
                bg={fila.estado.variante}
                text={['warning', 'info'].includes(fila.estado.variante) ? 'dark' : undefined}
                className="flex-shrink-0"
              >
                {fila.estado.texto}
              </Badge>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
      {(hayMas || seccion.verTodo) && (
        <Card.Footer className="d-flex flex-wrap justify-content-between gap-2 small">
          <span className="text-muted">
            {hayMas && `Mostrando los ${seccion.filas.length} más recientes de ${seccion.total}`}
          </span>
          {seccion.verTodo && <Link to={seccion.verTodo.enlace}>{seccion.verTodo.texto}</Link>}
        </Card.Footer>
      )}
    </>
  );
};

/** One tab per section the tenant and the user may see, each with its total count. */
const SeccionesEquipo: React.FC<{ resumen: ResumenEquipo; enlaces: EnlacesResumen }> = ({ resumen, enlaces }) => {
  const secciones = construirSecciones(resumen, enlaces);
  const [elegida, setElegida] = useState('');
  if (secciones.length === 0) return null;
  const activa = secciones.some((s) => s.clave === elegida) ? elegida : secciones[0].clave;

  return (
    <Card className="tt-card">
      <Tab.Container
        id="resumen-equipo"
        activeKey={activa}
        onSelect={(k) => setElegida(k ?? '')}
        mountOnEnter
        unmountOnExit
        transition={false}
      >
        <Card.Header className="pb-0">
          <Nav variant="tabs" className="resumen-pestanas">
            {secciones.map((s) => (
              <Nav.Item key={s.clave}>
                <Nav.Link as="button" type="button" eventKey={s.clave}>
                  {s.titulo}
                  <Badge bg={s.clave === activa ? 'primary' : 'secondary'} pill className="ms-2">
                    {s.total}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Card.Header>
        <Tab.Content>
          {secciones.map((s) => (
            <Tab.Pane key={s.clave} eventKey={s.clave}>
              <ListaSeccion seccion={s} />
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </Card>
  );
};

export default SeccionesEquipo;
