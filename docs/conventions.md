**Conventions**

- Convención de nombres:
  - Rutas base: `/api/v1/{resource}`; los archivos de rutas están en `src/routes`.
  - Modelos: `PascalCase` export (p. ej. `User`, `Tenant`) y colecciones explícitas en `collection`.
  - DTOs: `createX.dto.js`, `updateX.dto.js`, `queryX.dto.js` en `src/dtos`.

- Formato de fechas: JavaScript `Date` (ISO 8601 cuando se envía por JSON). Los esquemas Mongoose usan `timestamps: true`.

- Paginación estándar:
  - Query params: `?page=1&limit=10&sortBy=createdAt&order=desc&search=...`
  - Respuesta incluye `pagination` con: `page`, `limit`, `total`, `pages`, `hasNext`, `hasPrev`.

- Filtros comunes:
  - Búsqueda por `search` aplicada en servicios cuando corresponde (generalmente usa expresiones regulares `i`).
  - Los `pre(/^find/)` de los modelos filtran por `isDeleted:false` por defecto.

- Formato estándar de respuesta API:
  - Éxito:
    {
      "success": true,
      "message": "...",
      "data": { ... },
      "pagination": { ... } // opcional
    }
  - Error:
    {
      "success": false,
      "message": "...",
      "error": { "code": "...", "details": {...} }
    }

- Manejo de errores:
  - Se utiliza `ApiError` para errores controlados con `statusCode`, `code` y `details`.
  - Middleware global `errorHandler` transforma `ApiError` a `errorResponse` y devuelve el `statusCode`.

- Seguridad / headers:
  - `Helmet` y `cors` configurado en `src/app.js`.
  - Sanitización de inputs con `express-mongo-sanitize`.

Notas y dudas abiertas
- Algunas colecciones exponen muchos campos con nombres en mezcla de idioma/estilo (p. ej. `Report`, `Informe`, `Usuario`) — frontend debe consultar el modelo exacto en `src/models` para el campo concreto.


# Frontend Conventions - Mantenimiento Biomédico

Este documento define las convenciones estrictas para el desarrollo del frontend React + TypeScript.

---

## 🎨 Estructura de Componentes

### Anatomía de un Componente
```tsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import './UserCard.css';

// 2. Props Interface
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  variant?: 'default' | 'compact';
}

// 3. Component
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  variant = 'default'
}) => {
  // 3a. Hooks
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 3b. Effects
  useEffect(() => {
    // ...
  }, [user]);

  // 3c. Handlers
  const handleEdit = () => {
    if (onEdit) onEdit(user._id);
  };

  // 3d. Render
  return (
    <div className={`user-card user-card--${variant}`}>
      {/* JSX */}
    </div>
  );
};

// 4. Export default (opcional, si es la exportación principal)
export default UserCard;
```

### Reglas de Componentes
- ✅ Un componente por archivo
- ✅ Nombrar archivo igual que componente: `UserCard.tsx`
- ✅ Props con interface definida
- ✅ Props opcionales con valores por defecto
- ✅ Destructuring de props
- ✅ Hooks al inicio del componente
- ✅ Handlers antes del return
- ✅ JSDoc para componentes complejos

---

## 📁 Organización de Carpetas

### `/components/common/`
Componentes reutilizables en toda la app:
```
components/common/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.css
│   └── index.ts
├── Input/
├── DataTable/
├── Pagination/
├── SearchBar/
├── LoadingSpinner/
├── ErrorAlert/
└── ConfirmModal/
```

### `/components/layout/`
Componentes de estructura:
```
components/layout/
├── Navbar/
│   ├── Navbar.tsx
│   └── Navbar.module.css
├── Sidebar/
├── Footer/
├── MainLayout/
└── AuthLayout/
```

### `/components/forms/`
Componentes de formularios específicos:
```
components/forms/
├── UserForm/
├── EquipmentForm/
├── MaintenanceOrderForm/
└── LoginForm/
```

### `/pages/`
Páginas completas de la aplicación:
```
pages/
├── Home/
│   └── HomePage.tsx
├── Auth/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── Users/
│   ├── UsersPage.tsx           (lista)
│   ├── UserDetailPage.tsx      (detalle)
│   └── UserFormPage.tsx        (crear/editar)
├── Equipment/
│   ├── EquipmentPage.tsx
│   ├── EquipmentDetailPage.tsx
│   └── EquipmentFormPage.tsx
└── NotFound/
    └── NotFoundPage.tsx
```

---

## 🎯 Páginas Estándar por Entidad

Cada entidad del backend debe tener estas páginas:

### 1. **List Page** (UsersPage.tsx)
Funcionalidades obligatorias:
- ✅ Tabla con datos
- ✅ Paginación
- ✅ Búsqueda
- ✅ Filtros (por estado, categoría, etc.)
- ✅ Sort por columnas
- ✅ Botón "Crear Nuevo"
- ✅ Acciones por fila: Ver, Editar, Eliminar
- ✅ Loading state
- ✅ Empty state
- ✅ Error state

Estructura:
```tsx
export const UsersPage: React.FC = () => {
  // Query params para filtros
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  // Fetch data con React Query
  const { data, isLoading, error } = useUsers({ page, search });

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams({ page: '1', search: value });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: String(newPage) });
  };

  return (
    <Container>
      <Row className="mb-3">
        <Col><h1>Usuarios</h1></Col>
        <Col className="text-end">
          <Button onClick={() => navigate('/users/new')}>Crear Usuario</Button>
        </Col>
      </Row>
      
      <SearchBar value={search} onSearch={handleSearch} />
      
      {isLoading && <LoadingSpinner />}
      {error && <ErrorAlert message={error.message} />}
      
      {data && (
        <>
          <DataTable data={data.data} columns={columns} />
          <Pagination {...data.pagination} onPageChange={handlePageChange} />
        </>
      )}
    </Container>
  );
};
```

### 2. **Detail Page** (UserDetailPage.tsx)
Funcionalidades:
- ✅ Mostrar todos los datos del item
- ✅ Botones: Editar, Eliminar, Volver
- ✅ Loading state
- ✅ Not found state
- ✅ Secciones organizadas

### 3. **Form Page** (UserFormPage.tsx)
Funcionalidades:
- ✅ React Hook Form
- ✅ Validación con Yup
- ✅ Modo Crear / Editar (mismo componente)
- ✅ Cargar datos si es edición
- ✅ Mostrar errores del backend
- ✅ Disable submit mientras guarda
- ✅ Redirect después de guardar

Estructura:
```tsx
export const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Fetch data si es edición
  const { data: user } = useUser(id || '', { enabled: isEditMode });

  // Mutation para crear/actualizar
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  // Form con React Hook Form
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(userSchema),
  });

  // Cargar datos en el form si es edición
  useEffect(() => {
    if (user) reset(user);
  }, [user, reset]);

  // Submit handler
  const onSubmit = async (data: any) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: id!, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      toast.success(`Usuario ${isEditMode ? 'actualizado' : 'creado'} exitosamente`);
      navigate('/users');
    } catch (error) {
      toast.error('Error al guardar usuario');
    }
  };

  return (
    <Container>
      <h1>{isEditMode ? 'Editar Usuario' : 'Crear Usuario'}</h1>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Campos del formulario */}
      </Form>
    </Container>
  );
};
```

---

## 🔄 Manejo de Estado

### Estado del Servidor (React Query)
```tsx
// GET - Lista con paginación
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['users', { page, search }],
  queryFn: () => userService.getAll({ page, search }),
  keepPreviousData: true, // Mantener datos anteriores mientras carga
});

// GET - Un item
const { data: user } = useQuery({
  queryKey: ['users', id],
  queryFn: () => userService.getById(id),
  enabled: !!id, // Solo ejecutar si hay id
});

// POST - Crear
const createMutation = useMutation({
  mutationFn: userService.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['users']); // Refrescar lista
    toast.success('Usuario creado');
  },
  onError: (error) => {
    toast.error('Error al crear usuario');
  },
});

// PUT - Actualizar
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: any }) => 
    userService.update(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries(['users']);
    toast.success('Usuario actualizado');
  },
});

// DELETE - Eliminar
const deleteMutation = useMutation({
  mutationFn: userService.delete,
  onSuccess: () => {
    queryClient.invalidateQueries(['users']);
    toast.success('Usuario eliminado');
  },
});
```

### Estado Global (Context)
Solo para:
- Autenticación
- Tema (light/dark)
- Configuración global
```tsx
// src/context/AuthContext.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Estado Local (useState)
Para estado temporal del componente:
```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

---

## 📝 Formularios con React Hook Form

### Schema de Validación (Yup)
```tsx
// src/schemas/user.schema.ts
import * as yup from 'yup';

export const userSchema = yup.object({
  name: yup.string()
    .required('El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  email: yup.string()
    .required('El email es requerido')
    .email('Email inválido'),
  
  password: yup.string()
    .required('La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una mayúscula'),
  
  role: yup.string()
    .oneOf(['admin', 'technician', 'user'], 'Rol inválido')
    .required('El rol es requerido'),
});
```

### Formulario Completo
```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { userSchema } from '@/schemas/user.schema';

export const UserForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
    },
  });

  const onSubmit = async (data: any) => {
    // Guardar datos
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          {...register('name')}
          isInvalid={!!errors.name}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          {...register('email')}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar'}
      </Button>
    </Form>
  );
};
```

---

## 🎨 Estilos con Bootstrap

### Uso de React Bootstrap
```tsx
import { 
  Container, Row, Col, 
  Button, Form, Table, 
  Card, Modal, Alert,
  Spinner, Badge
} from 'react-bootstrap';

// Componente
<Container>
  <Row>
    <Col md={8}>
      <Card>
        <Card.Header>Título</Card.Header>
        <Card.Body>Contenido</Card.Body>
      </Card>
    </Col>
    <Col md={4}>
      <Alert variant="info">Información</Alert>
    </Col>
  </Row>
</Container>
```

### Clases de Bootstrap
```tsx
// Spacing
<div className="m-3 p-4">             // margin y padding
<div className="mt-3 mb-4 px-2">      // margin-top, margin-bottom, padding-x

// Display
<div className="d-flex justify-content-between align-items-center">
<div className="d-none d-md-block">   // Hidden en mobile, visible en desktop

// Grid
<Row className="g-3">                 // Gap entre columnas
<Col xs={12} md={6} lg={4}>          // Responsive columns

// Text
<p className="text-center text-muted fs-5">
<h1 className="fw-bold text-primary">

// Colors
<Button variant="primary">
<Button variant="success">
<Alert variant="danger">
<Badge bg="warning">
```

### CSS Modules (cuando sea necesario)
```css
/* UserCard.module.css */
.card {
  border-radius: 8px;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.cardTitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--bs-primary);
}
```
```tsx
// UserCard.tsx
import styles from './UserCard.module.css';

<Card className={styles.card}>
  <Card.Title className={styles.cardTitle}>
    {user.name}
  </Card.Title>
</Card>
```

---

## 🔐 Rutas y Navegación

### Configuración de Rutas
```tsx
// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PrivateRoute } from '@/components/PrivateRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <PrivateRoute><MainLayout /></PrivateRoute>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      { path: 'users/new', element: <UserFormPage /> },
      { path: 'users/:id/edit', element: <UserFormPage /> },
      // ... más rutas
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
```

### PrivateRoute Component
```tsx
// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const PrivateRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
```

### Navegación Programática
```tsx
import { useNavigate, useSearchParams } from 'react-router-dom';

const navigate = useNavigate();

// Navegar a otra página
navigate('/users');
navigate(`/users/${id}`);
navigate('/users', { replace: true }); // Sin agregar al history

// Navegar atrás
navigate(-1);

// Con query params
const [searchParams, setSearchParams] = useSearchParams();
setSearchParams({ page: '2', search: 'juan' });
```

---

## 🚨 Manejo de Errores

### Toast Notifications
```tsx
import { toast } from 'react-toastify';

// Success
toast.success('Usuario creado exitosamente');

// Error
toast.error('Error al crear usuario');

// Warning
toast.warning('Operación cancelada');

// Info
toast.info('Procesando solicitud...');

// Custom
toast.error('Email ya registrado', {
  position: 'top-right',
  autoClose: 5000,
});
```

### Error Boundary
```tsx
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="text-center mt-5">
          <h1>Algo salió mal</h1>
          <p>Por favor recarga la página</p>
          <Button onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}
```

### Mapeo de Errores del Backend
```tsx
// src/utils/errorMessages.ts
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  INVALID_TOKEN: 'Sesión expirada. Por favor inicia sesión nuevamente',
  TOKEN_EXPIRED: 'Tu sesión ha expirado',
  
  // Validation
  VALIDATION_ERROR: 'Hay errores en el formulario',
  EMAIL_ALREADY_EXISTS: 'Este email ya está registrado',
  
  // Resources
  NOT_FOUND: 'No se encontró el recurso solicitado',
  
  // Default
  INTERNAL_ERROR: 'Error del servidor. Intenta nuevamente',
};

export const getErrorMessage = (code?: string): string => {
  return ERROR_MESSAGES[code || ''] || 'Ha ocurrido un error inesperado';
};
```

---

## 📊 DataTable Component

Componente reutilizable para tablas:
```tsx
// src/components/common/DataTable/DataTable.tsx
interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
}

export function DataTable<T extends { _id: string }>({
  data,
  columns,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
          {actions && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item._id} onClick={() => onRowClick?.(item)}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render 
                  ? col.render(item)
                  : String(item[col.key as keyof T])}
              </td>
            ))}
            {actions && <td>{actions(item)}</td>}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

### Uso del DataTable
```tsx
const columns: Column<User>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { 
    key: 'role', 
    label: 'Rol',
    render: (user) => <Badge bg="primary">{user.role}</Badge>
  },
  {
    key: 'createdAt',
    label: 'Fecha Creación',
    render: (user) => format(new Date(user.createdAt), 'dd/MM/yyyy'),
  },
];

<DataTable
  data={users}
  columns={columns}
  onRowClick={(user) => navigate(`/users/${user._id}`)}
  actions={(user) => (
    <>
      <Button size="sm" onClick={() => navigate(`/users/${user._id}/edit`)}>
        Editar
      </Button>
      <Button size="sm" variant="danger" onClick={() => handleDelete(user._id)}>
        Eliminar
      </Button>
    </>
  )}
/>
```

---

## 🔍 SearchBar Component
```tsx
// src/components/common/SearchBar/SearchBar.tsx
import { useState, useEffect } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounce?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onSearch,
  placeholder = 'Buscar...',
  debounce = 500,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(localValue);
    }, debounce);

    return () => clearTimeout(handler);
  }, [localValue, debounce, onSearch]);

  return (
    <InputGroup className="mb-3">
      <InputGroup.Text>
        <FiSearch />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </InputGroup>
  );
};
```

---

## ✅ Checklist de Implementación

Antes de considerar una página/componente completo:

- [ ] TypeScript estricto sin `any`
- [ ] Props con interfaces definidas
- [ ] Responsive design (mobile-first)
- [ ] Loading states
- [ ] Error handling
- [ ] Success/Error messages (toast)
- [ ] Validación de formularios
- [ ] Accesibilidad (labels, aria-labels)
- [ ] Comentarios JSDoc en funciones complejas
- [ ] Nombres descriptivos de variables
- [ ] Imports organizados
