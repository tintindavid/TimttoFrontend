import React, { useEffect, useState } from 'react';
import { Alert, Badge, Collapse, Button, Card } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMonitorProps {
  show?: boolean;
  onToggle?: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  show = false, 
  onToggle 
}) => {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState({
    activeQueries: 0,
    cachedQueries: 0,
    failedQueries: 0,
    fetchingQueries: 0
  });

  useEffect(() => {
    if (!show) return;

    const updateMetrics = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      setMetrics({
        activeQueries: queries.filter(q => !q.isStale()).length,
        cachedQueries: queries.length,
        failedQueries: queries.filter(q => q.state.status === 'error').length,
        fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [show, queryClient]);

  const clearCache = () => {
    queryClient.clear();
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  if (!show) {
    return (
      <div className="position-fixed bottom-0 end-0 m-3">
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={onToggle}
          title="Mostrar monitor de rendimiento"
        >
          📊
        </Button>
      </div>
    );
  }

  return (
    <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050, width: '300px' }}>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <small className="fw-bold">Performance Monitor</small>
          <Button variant="link" size="sm" onClick={onToggle}>
            ✕
          </Button>
        </Card.Header>
        <Card.Body>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Badge bg="primary">
              Activas: {metrics.activeQueries}
            </Badge>
            <Badge bg="secondary">
              Cache: {metrics.cachedQueries}
            </Badge>
            <Badge bg={metrics.fetchingQueries > 5 ? 'warning' : 'info'}>
              Cargando: {metrics.fetchingQueries}
            </Badge>
            <Badge bg={metrics.failedQueries > 0 ? 'danger' : 'success'}>
              Errores: {metrics.failedQueries}
            </Badge>
          </div>

          {metrics.fetchingQueries > 10 && (
            <Alert variant="warning" className="py-2">
              <small>
                ⚠️ Demasiadas queries simultáneas ({metrics.fetchingQueries})
              </small>
            </Alert>
          )}

          {metrics.failedQueries > 3 && (
            <Alert variant="danger" className="py-2">
              <small>
                🚨 Múltiples errores detectados ({metrics.failedQueries})
              </small>
            </Alert>
          )}

          <div className="d-flex gap-2">
            <Button 
              variant="outline-warning" 
              size="sm" 
              onClick={invalidateAll}
              title="Invalidar todas las queries"
            >
              🔄 Refresh
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={clearCache}
              title="Limpiar cache completo"
            >
              🗑️ Clear
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;