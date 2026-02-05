import { QueryClient } from '@tanstack/react-query';

// Configuración optimizada global para React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por defecto más agresivo para reducir requests
      staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
      cacheTime: 15 * 60 * 1000, // 15 minutos - mantener en cache
      
      // Reducir refetching automático para prevenir 429 errors
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      
      // Retry más conservador
      retry: (failureCount, error: any) => {
        // No retry para errores 4xx (cliente) pero sí para 5xx (servidor)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      
      // Network mode para mejor manejo offline
      networkMode: 'online',
      
      // Evitar requests en paralelo excesivos
      suspense: false,
    },
    mutations: {
      // Retry para mutations críticas
      retry: (failureCount, error: any) => {
        // No retry para errores de validación o autenticación
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
    }
  },
});

// Configuraciones específicas por tipo de dato
export const dataQueryOptions = {
  // Para datos que cambian raramente (sedes, servicios)
  static: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  
  // Para datos que cambian frecuentemente (órdenes de trabajo)
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  
  // Para datos en tiempo real (notificaciones, estados)
  realTime: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000, // 1 minuto
  },
};

// Utility para limpiar cache específico
export const invalidateQueries = {
  // Invalidar todas las queries de un cliente
  customer: (customerId: string) => {
    queryClient.invalidateQueries({ 
      predicate: query => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes(customerId)
        )
    });
  },
  
  // Invalidar por tipo de entidad
  sedes: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  servicios: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  equipos: () => queryClient.invalidateQueries({ queryKey: ['equipo-items'] }),
  ots: () => queryClient.invalidateQueries({ queryKey: ['ots'] }),
  
  // Limpiar todo el cache
  all: () => queryClient.clear(),
};

// Error handler global
export const globalErrorHandler = (error: any) => {
  console.error('React Query Error:', error);
  
  // Manejar errores 429 específicamente
  if (error?.response?.status === 429) {
    console.warn('Too many requests - backing off...');
    
    // Opcional: mostrar toast notification al usuario
    // toast.warning('Demasiadas solicitudes, por favor espera un momento');
  }
  
  // Manejar errores de autenticación
  if (error?.response?.status === 401) {
    // Limpiar tokens y redirect a login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

// Configurar error boundary global
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    onError: globalErrorHandler,
  },
  mutations: {
    ...queryClient.getDefaultOptions().mutations,
    onError: globalErrorHandler,
  },
});