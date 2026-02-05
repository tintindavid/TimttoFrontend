# Generate Component - Crear Componente Reutilizable

Genera un componente React reutilizable siguiendo las mejores prácticas.

---

## 📋 Input Requerido
```
Nombre del componente: {ComponentName}
Tipo: common | layout | form
Descripción: {breve descripción de funcionalidad}
```

---

## 📦 Estructura Base
```tsx
// src/components/{tipo}/{ComponentName}/{ComponentName}.tsx
import React from 'react';
import { ComponentPropsType } from './types'; // si es complejo
import styles from './{ComponentName}.module.css'; // si necesita estilos custom

/**
 * {ComponentName}
 * 
 * {Descripción detallada del componente}
 * 
 * @example
 * ```tsx
 * <{ComponentName}
 *   prop1="value"
 *   prop2={value}
 * />
 * ```
 */

// 1. Props Interface
interface {ComponentName}Props {
  // Props requeridas
  requiredProp: string;
  
  // Props opcionales con valores por defecto
  optionalProp?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  
  // Callbacks
  onClick?: () => void;
  onChange?: (value: string) => void;
  
  // Children si aplica
  children?: React.ReactNode;
  
  // Estilos custom
  className?: string;
  style?: React.CSSProperties;
}

// 2. Component
export const {ComponentName}: React.FC<{ComponentName}Props> = ({
  requiredProp,
  optionalProp,
  variant = 'primary',
  size = 'md',
  onClick,
  onChange,
  children,
  className = '',
  style,
}) => {
  // 2a. State (si es necesario)
  const [localState, setLocalState] = React.useState<any>(null);

  // 2b. Effects (si es necesario)
  React.useEffect(() => {
    // Side effects
  }, [/* dependencies */]);

  // 2c. Handlers
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // 2d. Render helpers (si la lógica es compleja)
  const renderContent = () => {
    // ...
  };

  // 2e. Clases CSS
  const componentClasses = [
    styles.component,
    styles[`component--${variant}`],
    styles[`component--${size}`],
    className,
  ].filter(Boolean).join(' ');

  // 3. Return
  return (
    <div className={componentClasses} style={style}>
      {children}
    </div>
  );
};

// 4. Display Name (para debugging)
{ComponentName}.displayName = '{ComponentName}';

// 5. Export
export default {ComponentName};
```

---

## 📦 Ejemplo Completo: DataTable Component
```tsx
// src/components/common/DataTable/DataTable.tsx
import React from 'react';
import { Table, Button, ButtonGroup } from 'react-bootstrap';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { LoadingSpinner } from '../LoadingSpinner';
import { EmptyState } from '../EmptyState';

/**
 * DataTable - Tabla de datos reutilizable
 * 
 * Componente para mostrar datos tabulares con funcionalidades de:
 * - Renderizado personalizado de columnas
 * - Ordenamiento (opcional)
 * - Acciones por fila
 * - Click en filas
 * - Estados: loading, empty
 * 
 * @example
 * ```tsx
 * const columns: Column<User>[] = [
 *   { key: 'name', label: 'Nombre', sortable: true },
 *   { key: 'email', label: 'Email' },
 *   { 
 *     key: 'role', 
 *     label: 'Rol',
 *     render: (user) => <Badge>{user.role}</Badge>
 *   }
 * ];
 * 
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   onRowClick={(user) => navigate(`/users/${user._id}`)}
 *   actions={(user) => (
 *     <Button onClick={() => handleEdit(user._id)}>Editar</Button>
 *   )}
 * />
 * ```
 */

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onSort?: (key: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  responsive?: boolean;
}

export function DataTable<T extends { _id: string }>({
  data,
  columns,
  onRowClick,
  actions,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon,
  onSort,
  sortBy,
  sortOrder,
  striped = true,
  bordered = true,
  hover = true,
  responsive = true,
}: DataTableProps<T>) {
  
  // Handler para ordenamiento
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) return null;
    return sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner variant="inline" />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title="Sin datos"
        message={emptyMessage}
      />
    );
  }

  // Table
  const TableComponent = (
    <Table striped={striped} bordered={bordered} hover={hover}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={String(column.key)}
              style={{ 
                width: column.width,
                textAlign: column.align || 'left',
                cursor: column.sortable ? 'pointer' : 'default'
              }}
              onClick={() => column.sortable && handleSort(String(column.key))}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span>{column.label}</span>
                {column.sortable && renderSortIcon(String(column.key))}
              </div>
            </th>
          ))}
          {actions && <th style={{ width: '120px' }}>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={item._id}
            onClick={() => onRowClick && onRowClick(item)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((column) => (
              <td
                key={String(column.key)}
                style={{ textAlign: column.align || 'left' }}
              >
                {column.render
                  ? column.render(item)
                  : String(item[column.key as keyof T] ?? '')}
              </td>
            ))}
            {actions && (
              <td onClick={(e) => e.stopPropagation()}>
                {actions(item)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return responsive ? (
    <div className="table-responsive">
      {TableComponent}
    </div>
  ) : (
    TableComponent
  );
}

DataTable.displayName = 'DataTable';
```

---

## 📦 Archivo Index (Barrel Export)
```tsx
// src/components/common/DataTable/index.ts
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
```

---

## 📦 CSS Module (si es necesario)
```css
/* src/components/common/DataTable/DataTable.module.css */
.table {
  width: 100%;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortIcon {
  margin-left: 0.5rem;
  font-size: 0.875rem;
}
```

---

## ✅ Checklist de Componente

Antes de considerar el componente completo:

- [ ] Props interface con JSDoc
- [ ] Valores por defecto para props opcionales
- [ ] TypeScript estricto (no `any`)
- [ ] Documentación con ejemplo de uso
- [ ] Loading state (si hace requests)
- [ ] Error state (si hace requests)
- [ ] Empty state (si muestra listas)
- [ ] Accesibilidad (aria-labels, roles)
- [ ] Responsive design
- [ ] Event handlers con nombres claros (handle*)
- [ ] Display name para debugging
- [ ] Export en index.ts
- [ ] Probado en al menos 2 contextos