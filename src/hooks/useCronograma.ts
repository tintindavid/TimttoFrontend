import { useState, useMemo, useCallback } from 'react';
import { CronogramaFiltros, CronogramaEquipo, CronogramaStats, Mes, MESES, GrupoServicioSede } from '@/types/cronograma.types';
import { EquipoItem } from '@/types/equipoItem.types';

/**
 * Hook personalizado para gestionar la lógica del cronograma de mantenimientos
 */
export const useCronograma = (equipos: EquipoItem[]) => {
  const [filtros, setFiltros] = useState<CronogramaFiltros>({});
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<string[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const equiposPorPagina = 100;

  /**
   * Convierte EquipoItem a CronogramaEquipo para facilitar el trabajo
   */
  const cronogramaEquipos = useMemo<CronogramaEquipo[]>(() => {
    return equipos.map(eq => ({
      _id: eq._id!,
      ItemId: eq.ItemId,
      Marca: eq.Marca,
      Modelo: eq.Modelo,
      Serie: eq.Serie,
      Inventario: eq.Inventario,
      Ubicacion: eq.Ubicacion,
      Estado: eq.Estado,
      EstadoOperativo: eq.EstadoOperativo,
      SedeId: eq.SedeId,
      Servicio: eq.Servicio,
      mesesMtto: eq.mesesMtto as Mes[] | undefined,
      ClienteId: eq.ClienteId, // Mantener ClienteId original (puede ser string o objeto)
      Riesgo: eq.Riesgo,
      Invima: eq.Invima
    }));
  }, [equipos]);

  /**
   * Filtra los equipos según los criterios seleccionados
   */
  const equiposFiltrados = useMemo(() => {
    return cronogramaEquipos.filter(equipo => {
      // Filtro por cliente
      if (filtros.clienteId) {
        const clienteId = typeof equipo.ClienteId === 'object' 
          ? equipo.ClienteId?._id 
          : equipo.ClienteId;
        if (clienteId !== filtros.clienteId) return false;
      }

      // Filtro por sedes (multi-select)
      if (filtros.sedeIds && filtros.sedeIds.length > 0) {
        const sedeId = typeof equipo.SedeId === 'object' 
          ? equipo.SedeId?._id 
          : equipo.SedeId;
        if (!sedeId || !filtros.sedeIds.includes(sedeId)) return false;
      }

      // Filtro por servicios (multi-select)
      if (filtros.servicioIds && filtros.servicioIds.length > 0) {
        const servicioId = typeof equipo.Servicio === 'object' 
          ? equipo.Servicio?._id 
          : equipo.Servicio;
        if (!servicioId || !filtros.servicioIds.includes(servicioId)) return false;
      }

      // Filtro por ubicaciones (multi-select)
      if (filtros.ubicaciones && filtros.ubicaciones.length > 0) {
        if (!equipo.Ubicacion || !filtros.ubicaciones.includes(equipo.Ubicacion)) return false;
      }

      // Filtro por meses (debe tener mantenimiento en TODOS los meses seleccionados)
      if (filtros.meses && filtros.meses.length > 0) {
        if (!equipo.mesesMtto || equipo.mesesMtto.length === 0) return false;
        const tieneTodasLosMeses = filtros.meses.every(mes => 
          equipo.mesesMtto!.includes(mes)
        );
        if (!tieneTodasLosMeses) return false;
      }

      // Filtro por estado
      if (filtros.estado && equipo.Estado !== filtros.estado) return false;

      // Filtro por búsqueda (item, marca, modelo, serie, inventario)
      if (filtros.search) {
        const searchLower = filtros.search.toLowerCase();
        const itemNombre = typeof equipo.ItemId === 'object' 
          ? (equipo.ItemId?.Nombre?.toLowerCase() || '') 
          : '';
        const marca = equipo.Marca?.toLowerCase() || '';
        const modelo = equipo.Modelo?.toLowerCase() || '';
        const serie = equipo.Serie?.toLowerCase() || '';
        const inventario = equipo.Inventario?.toLowerCase() || '';
        
        const coincide = itemNombre.includes(searchLower) ||
          marca.includes(searchLower) ||
          modelo.includes(searchLower) ||
          serie.includes(searchLower) ||
          inventario.includes(searchLower);
        
        if (!coincide) return false;
      }

      return true;
    });
  }, [cronogramaEquipos, filtros]);

  /**
   * Paginación
   */
  const equiposPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * equiposPorPagina;
    return equiposFiltrados.slice(inicio, inicio + equiposPorPagina);
  }, [equiposFiltrados, paginaActual]);

  const totalPaginas = Math.ceil(equiposFiltrados.length / equiposPorPagina);

  /**
   * Agrupar equipos por Servicio / Sede
   */
  const equiposAgrupados = useMemo<GrupoServicioSede[]>(() => {
    const grupos: { [key: string]: GrupoServicioSede } = {};
    
    equiposPaginados.forEach(equipo => {
      const servicioNombre = typeof equipo.Servicio === 'object' 
        ? (equipo.Servicio?.nombre || 'Sin Servicio') 
        : 'Sin Servicio';
      const sedeNombre = typeof equipo.SedeId === 'object' 
        ? (equipo.SedeId?.nombreSede || 'Sin Sede') 
        : 'Sin Sede';
      
      const grupoKey = `${servicioNombre}|${sedeNombre}`;
      
      if (!grupos[grupoKey]) {
        grupos[grupoKey] = {
          servicio: servicioNombre,
          sede: sedeNombre,
          equipos: []
        };
      }
      
      grupos[grupoKey].equipos.push(equipo);
    });
    
    return Object.values(grupos);
  }, [equiposPaginados]);

  /**
   * Estadísticas del cronograma
   */
  const stats = useMemo<CronogramaStats>(() => {
    const equiposPorMes = MESES.reduce((acc, mes) => {
      acc[mes] = equiposFiltrados.filter(eq => 
        eq.mesesMtto?.includes(mes)
      ).length;
      return acc;
    }, {} as Record<Mes, number>);

    return {
      totalEquipos: cronogramaEquipos.length,
      equiposVisibles: equiposFiltrados.length,
      equiposSeleccionados: equiposSeleccionados.length,
      equiposVisiblesSeleccionados: equiposPaginados.filter(eq => 
        equiposSeleccionados.includes(eq._id)
      ).length,
      equiposPorMes
    };
  }, [cronogramaEquipos.length, equiposFiltrados, equiposSeleccionados, equiposPaginados]);

  /**
   * Seleccionar/deseleccionar un equipo
   */
  const toggleEquipo = useCallback((equipoId: string) => {
    setEquiposSeleccionados(prev => 
      prev.includes(equipoId)
        ? prev.filter(id => id !== equipoId)
        : [...prev, equipoId]
    );
  }, []);

  /**
   * Seleccionar/deseleccionar todos los equipos visibles en la página actual
   */
  const toggleTodosVisibles = useCallback(() => {
    const idsVisibles = equiposPaginados.map(eq => eq._id);
    const todosSeleccionados = idsVisibles.every(id => equiposSeleccionados.includes(id));

    if (todosSeleccionados) {
      // Deseleccionar solo los visibles
      setEquiposSeleccionados(prev => 
        prev.filter(id => !idsVisibles.includes(id))
      );
    } else {
      // Seleccionar todos los visibles (sin afectar selecciones previas)
      setEquiposSeleccionados(prev => 
        [...new Set([...prev, ...idsVisibles])]
      );
    }
  }, [equiposPaginados, equiposSeleccionados]);

  /**
   * Limpiar selección
   */
  const limpiarSeleccion = useCallback(() => {
    setEquiposSeleccionados([]);
  }, []);

  /**
   * Actualizar filtros
   */
  const actualizarFiltros = useCallback((nuevosFiltros: Partial<CronogramaFiltros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
    setPaginaActual(1); // Reset a la primera página al filtrar
  }, []);

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = useCallback(() => {
    setFiltros({});
    setPaginaActual(1);
  }, []);

  /**
   * Cambiar página
   */
  const cambiarPagina = useCallback((pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina);
    }
  }, [totalPaginas]);

  /**
   * Verificar si todos los visibles están seleccionados
   */
  const todosVisiblesSeleccionados = useMemo(() => {
    return equiposPaginados.length > 0 && 
      equiposPaginados.every(eq => equiposSeleccionados.includes(eq._id));
  }, [equiposPaginados, equiposSeleccionados]);

  return {
    // Datos
    equiposFiltrados,
    equiposPaginados,
    equiposAgrupados,
    equiposSeleccionados,
    stats,
    
    // Paginación
    paginaActual,
    totalPaginas,
    equiposPorPagina,
    
    // Estados
    filtros,
    todosVisiblesSeleccionados,
    
    // Acciones
    toggleEquipo,
    toggleTodosVisibles,
    limpiarSeleccion,
    actualizarFiltros,
    limpiarFiltros,
    cambiarPagina
  };
};
