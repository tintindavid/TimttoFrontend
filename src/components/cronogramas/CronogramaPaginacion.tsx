import React from 'react';
import { Pagination } from 'react-bootstrap';

interface CronogramaPaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
  equiposPorPagina: number;
  totalEquipos: number;
}

/**
 * Componente de paginación para el cronograma
 */
export const CronogramaPaginacion: React.FC<CronogramaPaginacionProps> = ({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  equiposPorPagina,
  totalEquipos
}) => {
  if (totalPaginas <= 1) return null;

  const inicio = (paginaActual - 1) * equiposPorPagina + 1;
  const fin = Math.min(paginaActual * equiposPorPagina, totalEquipos);

  // Generar páginas a mostrar
  const generarPaginas = () => {
    const paginas: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    const maxPaginasVisibles = 7;
    
    if (totalPaginas <= maxPaginasVisibles) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Siempre mostrar primera página
      paginas.push(1);
      
      // Determinar rango alrededor de la página actual
      let rangoInicio = Math.max(2, paginaActual - 1);
      let rangoFin = Math.min(totalPaginas - 1, paginaActual + 1);
      
      // Ajustar para mantener consistencia
      if (paginaActual <= 3) {
        rangoFin = Math.min(5, totalPaginas - 1);
      } else if (paginaActual >= totalPaginas - 2) {
        rangoInicio = Math.max(totalPaginas - 4, 2);
      }
      
      // Agregar ellipsis inicio si es necesario
      if (rangoInicio > 2) {
        paginas.push('ellipsis-start');
      }
      
      // Agregar páginas del rango
      for (let i = rangoInicio; i <= rangoFin; i++) {
        paginas.push(i);
      }
      
      // Agregar ellipsis fin si es necesario
      if (rangoFin < totalPaginas - 1) {
        paginas.push('ellipsis-end');
      }
      
      // Siempre mostrar última página
      paginas.push(totalPaginas);
    }
    
    return paginas;
  };

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">
        Mostrando <strong>{inicio}</strong> a <strong>{fin}</strong> de <strong>{totalEquipos}</strong> equipos
      </div>
      
      <Pagination className="mb-0">
        <Pagination.First 
          onClick={() => onCambiarPagina(1)}
          disabled={paginaActual === 1}
        />
        <Pagination.Prev 
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        />
        
        {generarPaginas().map((pagina, index) => {
          if (pagina === 'ellipsis-start' || pagina === 'ellipsis-end') {
            return <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />;
          }
          
          return (
            <Pagination.Item
              key={pagina}
              active={pagina === paginaActual}
              onClick={() => onCambiarPagina(pagina as number)}
            >
              {pagina}
            </Pagination.Item>
          );
        })}
        
        <Pagination.Next 
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        />
        <Pagination.Last 
          onClick={() => onCambiarPagina(totalPaginas)}
          disabled={paginaActual === totalPaginas}
        />
      </Pagination>
    </div>
  );
};
