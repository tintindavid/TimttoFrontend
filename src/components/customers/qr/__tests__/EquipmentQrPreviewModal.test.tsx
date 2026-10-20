import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EquipmentQrPreviewModal from '../EquipmentQrPreviewModal';
import type { EquipmentQr } from '@/types/equipmentQr.types';

const qr = { _id: 'q1', equipoId: 'e1', qrImageDataUri: 'data:image/png;base64,AAAA' } as unknown as EquipmentQr;

describe('EquipmentQrPreviewModal sticker layout', () => {
  it('shows the client name, the inventory and www.timtto.com (no fixed Mantenimiento / Información lines)', () => {
    render(
      <EquipmentQrPreviewModal show onHide={() => {}} clienteNombre="Hospital San Rafael" items={[{ qr, inventario: 'INV-77' }]} />,
    );
    expect(screen.getByTestId('sticker-cliente')).toHaveTextContent('Hospital San Rafael');
    expect(screen.getByTestId('sticker-inventario')).toHaveTextContent('INV-77');
    expect(screen.getByTestId('sticker-marca')).toHaveTextContent('www.timtto.com');
    expect(screen.queryByText('Mantenimiento')).toBeNull();
    expect(screen.queryByText('Información')).toBeNull();
  });

  it('falls back to a dash without client or inventory', () => {
    render(<EquipmentQrPreviewModal show onHide={() => {}} items={[{ qr, inventario: null }]} />);
    expect(screen.getByTestId('sticker-cliente')).toHaveTextContent('—');
    expect(screen.getByTestId('sticker-inventario')).toHaveTextContent('—');
  });

  it('repeats the layout for every sticker of a bulk export', () => {
    const qr2 = { ...qr, _id: 'q2' } as EquipmentQr;
    render(
      <EquipmentQrPreviewModal
        show
        onHide={() => {}}
        clienteNombre="Clínica Norte"
        items={[{ qr, inventario: 'A' }, { qr: qr2, inventario: 'B' }]}
      />,
    );
    expect(screen.getAllByTestId('sticker-marca')).toHaveLength(2);
    expect(screen.getAllByTestId('sticker-cliente')[1]).toHaveTextContent('Clínica Norte');
  });
});
