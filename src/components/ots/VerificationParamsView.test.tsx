import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import VerificationParamsView from './VerificationParamsView';
import type { VerificationParam } from '@/types/reporte.types';

afterEach(() => cleanup());

const noMeasurement: VerificationParam[] = [
  { magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: null, patron: 'Fluke' },
];

const withMeasurement: VerificationParam[] = [
  { magnitud: 'Voltaje', unidad: 'V', valorReferencia: 12, valorMedido: 12.6, patron: 'Fluke 87V' },
  { magnitud: 'Presión', unidad: 'PSI', valorReferencia: 120, valorMedido: 119, patron: 'Gauge' },
];

describe('VerificationParamsView', () => {
  test('renders nothing when the array is empty', () => {
    const { container } = render(<VerificationParamsView value={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when no row has a valorMedido', () => {
    const { container } = render(<VerificationParamsView value={noMeasurement} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders the table when at least one row has a valorMedido', () => {
    const { container, getByText } = render(<VerificationParamsView value={withMeasurement} />);
    expect(container.querySelector('table')).not.toBeNull();
    expect(getByText('Magnitud')).toBeInTheDocument();
    expect(getByText('Voltaje')).toBeInTheDocument();
    expect(getByText('Presión')).toBeInTheDocument();
    expect(getByText('Fluke 87V')).toBeInTheDocument();
  });
});
