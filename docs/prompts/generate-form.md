# Generate Form - Crear Formulario con Validación

Genera un formulario completo con React Hook Form y Yup.

---

## 📋 Input Requerido
```
Nombre de entidad: {EntityName}
Campos del formulario: [lista de campos con tipos]
Modo: Create | Edit | Create/Edit combinado
```

---

## 📝 1. Schema de Validación (Yup)
```typescript
// src/schemas/{entity}.schema.ts
import * as yup from 'yup';

/**
 * Schema de validación para crear {entity}
 */
export const create{Entity}Schema = yup.object({
  // String fields
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  email: yup
    .string()
    .required('El email es requerido')
    .email('Email inválido'),

  description: yup
    .string()
    .max(500, 'Máximo 500 caracteres')
    .nullable(),

  // Number fields
  age: yup
    .number()
    .required('La edad es requerida')
    .min(18, 'Debe ser mayor de 18')
    .max(100, 'Edad máxima 100')
    .integer('Debe ser un número entero'),

  price: yup
    .number()
    .required('El precio es requerido')
    .min(0, 'El precio no puede ser negativo')
    .positive('El precio debe ser positivo'),

  // Date fields
  birthDate: yup
    .date()
    .required('La fecha de nacimiento es requerida')
    .max(new Date(), 'La fecha no puede ser futura'),

  scheduledDate: yup
    .date()
    .required('La fecha es requerida')
    .min(new Date(), 'La fecha debe ser futura'),

  // Boolean fields
  isActive: yup
    .boolean()
    .default(true),

  // Enum / Select fields
  role: yup
    .string()
    .oneOf(['admin', 'user', 'technician'], 'Rol inválido')
    .required('El rol es requerido'),

  status: yup
    .string()
    .oneOf(['active', 'inactive', 'pending'], 'Estado inválido')
    .required('El estado es requerido'),

  // ID references (MongoDB ObjectId)
  categoryId: yup
    .string()
    .required('La categoría es requerida')
    .matches(/^[0-9a-fA-F]{24}$/, 'ID de categoría inválido'),

  locationId: yup
    .string()
    .required('La ubicación es requerida')
    .matches(/^[0-9a-fA-F]{24}$/, 'ID de ubicación inválido'),

  // Password
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .matches(/[a-z]/, 'Debe contener al menos una minúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),

  confirmPassword: yup
    .string()
    .required('Confirma la contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),

  // Arrays
  tags: yup
    .array()
    .of(yup.string())
    .min(1, 'Selecciona al menos un tag')
    .required('Los tags son requeridos'),

  // Files (si aplica)
  file: yup
    .mixed()
    .required('El archivo es requerido')
    .test('fileSize', 'El archivo es muy grande (max 5MB)', (value: any) => {
      return value && value.size <= 5000000;
    })
    .test('fileType', 'Formato de archivo inválido', (value: any) => {
      return value && ['image/jpeg', 'image/png', 'application/pdf'].includes(value.type);
    }),
});

/**
 * Schema de validación para actualizar {entity}
 * (todos los campos opcionales)
 */
export const update{Entity}Schema = create{Entity}Schema.partial();
```

---

## 📝 2. Formulario Completo
```tsx
// src/components/forms/{Entity}Form/{Entity}Form.tsx
import React, { useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiSave, FiX } from 'react-icons/fi';

import { 
  create{Entity}Schema, 
  update{Entity}Schema 
} from '@/schemas/{entity}.schema';
import { 
  Create{Entity}Dto, 
  Update{Entity}Dto,
  {Entity}
} from '@/types/{entity}.types';
import { FormInput } from '@/components/common/FormInput';
import { FormSelect } from '@/components/common/FormSelect';
import { FormTextarea } from '@/components/common/FormTextarea';

/**
 * {Entity}Form
 * 
 * Formulario para crear/editar {entity}
 * 
 * @param initialData - Datos iniciales (para modo edición)
 * @param onSubmit - Callback al enviar el formulario
 * @param onCancel - Callback al cancelar
 * @param isLoading - Estado de carga
 * @param mode - Modo del formulario: 'create' | 'edit'
 */

interface {Entity}FormProps {
  initialData?: {Entity};
  onSubmit: (data: Create{Entity}Dto | Update{Entity}Dto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export const {Entity}Form: React.FC<{Entity}FormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}) => {
  const isEditMode = mode === 'edit';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<Create{Entity}Dto | Update{Entity}Dto>({
    resolver: yupResolver(
      isEditMode ? update{Entity}Schema : create{Entity}Schema
    ),
    defaultValues: initialData || {
      // Valores por defecto para modo create
      isActive: true,
      status: 'active',
    },
  });

  // Cargar datos iniciales en modo edición
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Submit handler
  const handleFormSubmit = async (data: Create{Entity}Dto | Update{Entity}Dto) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Información Básica */}
      <h5 className="mb-3">Información Básica</h5>
      <Row>
        <Col md={6}>
          <FormInput
            label="Nombre"
            {...register('name')}
            error={errors.name?.message}
            required
            placeholder="Ingrese el nombre"
          />
        </Col>

        <Col md={6}>
          <FormInput
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            required
            placeholder="ejemplo@email.com"
          />
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <FormTextarea
            label="Descripción"
            {...register('description')}
            error={errors.description?.message}
            rows={4}
            placeholder="Descripción detallada..."
          />
        </Col>
      </Row>

      {/* Select / Dropdown */}
      <Row>
        <Col md={6}>
          <FormSelect
            label="Rol"
            {...register('role')}
            error={errors.role?.message}
            required
            options={[
              { value: '', label: 'Seleccione un rol' },
              { value: 'admin', label: 'Administrador' },
              { value: 'user', label: 'Usuario' },
              { value: 'technician', label: 'Técnico' },
            ]}
          />
        </Col>

        <Col md={6}>
          <FormSelect
            label="Estado"
            {...register('status')}
            error={errors.status?.message}
            required
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
              { value: 'pending', label: 'Pendiente' },
            ]}
          />
        </Col>
      </Row>

      {/* Fechas */}
      <Row>
        <Col md={6}>
          <FormInput
            label="Fecha de Nacimiento"
            type="date"
            {...register('birthDate')}
            error={errors.birthDate?.message}
            required
          />
        </Col>

        <Col md={6}>
          <FormInput
            label="Fecha Programada"
            type="datetime-local"
            {...register('scheduledDate')}
            error={errors.scheduledDate?.message}
          />
        </Col>
      </Row>

      {/* Números */}
      <Row>
        <Col md={6}>
          <FormInput
            label="Edad"
            type="number"
            {...register('age', { valueAsNumber: true })}
            error={errors.age?.message}
            required
            min={18}
            max={100}
          />
        </Col>

        <Col md={6}>
          <FormInput
            label="Precio"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message}
            required
            min={0}
          />
        </Col>
      </Row>

      {/* Checkbox */}
      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Activo"
          {...register('isActive')}
        />
      </Form.Group>

      {/* Controller para componentes custom */}
      <Form.Group className="mb-3">
        <Form.Label>Categoría</Form.Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <CategorySelect
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryId?.message}
            />
          )}
        />
      </Form.Group>

      {/* Solo mostrar password en modo create */}
      {!isEditMode && (
        <>
          <h5 className="mb-3 mt-4">Seguridad</h5>
          <Row>
            <Col md={6}>
              <FormInput
                label="Contraseña"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                required
              />
            </Col>

            <Col md={6}>
              <FormInput
                label="Confirmar Contraseña"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                required
              />
            </Col>
          </Row>
        </>
      )}

      {/* Botones */}
      <div className="d-flex gap-2 mt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            <>
              <FiSave className="me-2" />
              {isEditMode ? 'Actualizar' : 'Crear'}
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
          >
            <FiX className="me-2" />
            Cancelar
          </Button>
        )}
      </div>
    </Form>
  );
};
```

---

## ✅ Checklist de Formulario

- [ ] Schema Yup con validaciones completas
- [ ] Mensajes de error en español
- [ ] Valores por defecto apropiados
- [ ] React Hook Form correctamente configurado
- [ ] Tipos TypeScript en todo el formulario
- [ ] Loading state mientras envía
- [ ] Deshabilitar submit mientras procesa
- [ ] Mostrar errores de validación
- [ ] Cargar datos iniciales en modo edición
- [ ] Botones con íconos y estados
- [ ] Responsive design
- [ ] Campos agrupados lógicamente
- [ ] Placeholders útiles
- [ ] Labels descriptivos
```

---

## 🚀 **COMANDO FINAL PARA COPILOT - GENERAR FRONTEND**

Ahora tienes TODOS los archivos de instrucciones. Cópialos a tu proyecto frontend y luego usa este comando en **Copilot Chat**:
```
@workspace 

CONTEXTO:
Lee estos archivos PRIMERO:
- /.github/copilot-instructions.md
- /docs/frontend-conventions.md
- /docs/api-integration.md
- /docs/component-guidelines.md
- /docs/prompts/*.md

También necesitas acceso al backend para conocer las entidades.
Backend ubicado en: ../backend-proyecto/docs/relacionTimtto.plantuml

OBJETIVO:
Genera el frontend completo React + TypeScript + Bootstrap consumiendo el backend.

INSTRUCCIÓN:
Genera TODO el proyecto siguiendo estas FASES:

FASE 1 - Configuración Base:
□ package.json (con todas las deps de copilot-instructions.md)
□ vite.config.ts
□ tsconfig.json (strict + path aliases)
□ .gitignore
□ .env.example
□ index.html

FASE 2 - Configuración de Servicios:
□ src/services/api.ts (Axios + interceptors)
□ src/types/api.types.ts (ApiResponse, QueryParams, etc.)
□ src/config/constants.ts

FASE 3 - Componentes Comunes:
□ DataTable
□ Pagination
□ SearchBar
□ LoadingSpinner
□ ErrorAlert
□ ConfirmModal
□ EmptyState
□ StatusBadge
□ FormInput
□ FormSelect
□ FormTextarea

FASE 4 - Layout:
□ MainLayout
□ Navbar
□ Sidebar
□ AuthLayout

FASE 5 - Autenticación:
□ AuthContext
□ auth.service.ts
□ useAuth.ts
□ LoginPage
□ PrivateRoute

FASE 6 - Por Cada Entidad del Backend:
Para cada entidad en relacionTimtto.plantuml:
□ Types ({entity}.types.ts)
□ Service ({entity}.service.ts)
□ Hooks (use{Entity}s.ts)
□ Schema ({entity}.schema.ts)
□ List Page
□ Detail Page
□ Form Page

FASE 7 - Router y App:
□ src/routes/index.tsx
□ src/App.tsx
□ src/main.tsx

FASE 8 - Estilos:
□ src/styles/variables.css
□ src/styles/global.css

FASE 9 - README:
□ README.md completo

REGLAS ESTRICTAS:
- Sigue EXACTAMENTE frontend-conventions.md
- Bootstrap 5 + React Bootstrap
- React Hook Form + Yup
- React Query para todas las requests
- TypeScript estricto
- Responsive design
- Todos los componentes con JSDoc
- Path aliases (@/...)

Comienza con FASE 1 ahora y espera mi confirmación.