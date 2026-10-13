import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OtrasEspecificacionesSection from './OtrasEspecificacionesSection';

const items = [
  { _id: '1', nombre: 'Memoria RAM', valor: '16 GB' },
  { _id: '2', nombre: 'Almacenamiento', valor: '512 GB SSD' },
  { _id: '3', nombre: 'Procesador', valor: 'i7' },
  { _id: '4', nombre: 'Pantalla', valor: '15"' },
  { _id: '5', nombre: 'Sistema', valor: 'Windows 11' },
];

const noop = vi.fn();

describe('OtrasEspecificacionesSection', () => {
  it('view mode: label/value fields in a 4-column grid, not a table', () => {
    const { container } = render(
      <OtrasEspecificacionesSection isEditing={false} items={[]} viewItems={items} onAdd={noop} onRemove={noop} onChange={noop} />
    );
    expect(container.querySelector('table')).toBeNull();
    expect(screen.getByText('Memoria RAM:').tagName).toBe('LABEL');
    expect(screen.getByText('16 GB')).toHaveClass('field-value');
    const cols = container.querySelectorAll('.col-md-3');
    expect(cols).toHaveLength(items.length);
  });

  it('renders nothing in view mode when there are no items', () => {
    const { container } = render(
      <OtrasEspecificacionesSection isEditing={false} items={[]} viewItems={[]} onAdd={noop} onRemove={noop} onChange={noop} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('edit mode: compact name/value pairs without a table, with add/remove/change handlers', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <OtrasEspecificacionesSection isEditing items={items.slice(0, 2)} viewItems={[]} onAdd={onAdd} onRemove={onRemove} onChange={onChange} />
    );
    expect(container.querySelector('table')).toBeNull();
    fireEvent.change(screen.getByLabelText('Valor de la especificación 1'), { target: { value: '32 GB' } });
    expect(onChange).toHaveBeenCalledWith(0, 'valor', '32 GB');
    fireEvent.click(screen.getByLabelText('Eliminar especificación 2'));
    expect(onRemove).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: /Agregar Especificación/ }));
    expect(onAdd).toHaveBeenCalled();
  });
});
