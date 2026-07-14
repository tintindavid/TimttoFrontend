import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { Reporte } from '@/types/reporte.types';
import { FaPlay, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import ReportSearchBar, { matchesReportSearch } from './ReportSearchBar';

interface ReportsListProps {
  reportes: Reporte[];
  onReporteSelect: (reporte: Reporte) => void;
  /** Reserved for future filter chips (marca/modelo/estado). Search input is always on. */
  showFilters?: boolean;
}

const ReportsList: React.FC<ReportsListProps> = ({ reportes, onReporteSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReportes = useMemo(
    () => reportes.filter((reporte) => matchesReportSearch(reporte, searchTerm)),
    [reportes, searchTerm],
  );

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return <FaClock className="text-info" />;
      case 'Procesado': return <FaPlay className="text-warning" />;
      case 'Cerrado': return <FaCheck className="text-success" />;
      case 'Cancelado': return <FaTimes className="text-danger" />;
      default: return <FaClock className="text-secondary" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'info';
      case 'Procesado': return 'warning';
      case 'Cerrado': return 'success';
      case 'Cancelado': return 'danger';
      default: return 'secondary';
    }
  };

  const totalCount = reportes.length;
  const shownCount = filteredReportes.length;

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-2">
        <div>
          <h5 className="mb-0">
            📋 Reportes de Equipos ({shownCount}{shownCount !== totalCount ? ` de ${totalCount}` : ''})
          </h5>
          <small className="text-muted">
            {reportes.filter((r) => r.procesado).length} procesados •{' '}
            {reportes.filter((r) => !r.procesado).length} pendientes
          </small>
        </div>
        <div style={{ minWidth: '260px', maxWidth: '480px', width: '100%' }}>
          <ReportSearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {totalCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No hay reportes asociados a esta OT</p>
          </div>
        ) : filteredReportes.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              Ningún reporte coincide con "{searchTerm.trim()}". Limpia el filtro para volver a ver todos.
            </p>
          </div>
        ) : (
          <div
            className="table-responsive"
            style={{ maxHeight: '75vh', overflowY: 'auto' }}
          >
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Reporte</th>
                  <th>Equipo</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportes.map((reporte) => (
                  <tr key={reporte._id}>
                    <td>{reporte.consecutivo}</td>
                    <td>
                      <div>
                        <div className="fw-bold">{reporte.equipoSnapshot.ItemText}</div>
                        <small className="text-muted">
                          {reporte.equipoSnapshot.Marca} • {reporte.equipoSnapshot.Modelo} • S/N: {reporte.equipoSnapshot.Serie || 'N/A'}
                        </small>
                        {reporte.equipoSnapshot.Inventario && (
                          <div>
                            <small className="text-muted">Inv: {reporte.equipoSnapshot.Inventario}</small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="small">
                          <strong>Sede:</strong> {reporte.equipoSnapshot.Sede || 'No especificada'}
                        </div>
                        <div className="small">
                          <strong>Servicio:</strong> {reporte.equipoSnapshot.Servicio || 'No especificado'} • {reporte.equipoSnapshot.Ubicacion || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {getEstadoIcon(reporte.estado)}
                        <Badge bg={getEstadoColor(reporte.estado)} className="ms-2">
                          {reporte.estado.replace('_', ' ')}
                        </Badge>
                        {reporte.fechaProcesado && (
                          <small className="text-muted ms-2">
                            {new Date(reporte.fechaProcesado).toLocaleDateString('es-ES')}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant={reporte.procesado ? 'outline-primary' : 'primary'}
                        onClick={() => onReporteSelect(reporte)}
                        disabled={reporte.estado === 'Cancelado'}
                      >
                        {reporte.estado === 'Procesado' || reporte.estado === 'Cerrado' || reporte.estado === 'Cancelado' ? (
                          <>
                            <FaCheck className="me-1" />
                            Ver Detalle
                          </>
                        ) : (
                          <>
                            <FaPlay className="me-1" />
                            Trabajar
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReportsList;
