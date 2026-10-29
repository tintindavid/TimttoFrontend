import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RepuestoBloqueoRequisicion, { bloqueoRequisicionReason } from './RepuestoBloqueoRequisicion';
import RepuestoRequisicionBadge from './RepuestoRequisicionBadge';
import {
  canHacerRequisicion,
  isBlockedByRequisicion,
  isDisponible,
  isLinkedToRequisicion,
} from '@/utils/repuestoRequisicion';

const linked = (disponibilidad: string) => ({
  EstadoSolicitud: 'Solicitado',
  requisicion: { requisicionId: 'q1', consecutivo: 'REQ-2026-0005', disponibilidad },
});

describe('repuestoRequisicion helpers', () => {
  it('only unlinked Solicitado requests can start a requisition', () => {
    expect(canHacerRequisicion({ EstadoSolicitud: 'Solicitado' })).toBe(true);
    expect(canHacerRequisicion({})).toBe(true);
    expect(canHacerRequisicion({ EstadoSolicitud: 'Instalado' })).toBe(false);
    expect(canHacerRequisicion(linked('En_Requisicion') as never)).toBe(false);
  });

  it('blocks install / edit / delete while linked and not Disponible', () => {
    expect(isBlockedByRequisicion(linked('En_Abastecimiento') as never)).toBe(true);
    expect(isBlockedByRequisicion(linked('En_Disputa') as never)).toBe(true);
    expect(isBlockedByRequisicion(linked('Disponible') as never)).toBe(false);
    expect(isBlockedByRequisicion({ EstadoSolicitud: 'Solicitado' })).toBe(false);
    expect(isDisponible(linked('Disponible') as never)).toBe(true);
    expect(isLinkedToRequisicion({ EstadoSolicitud: 'Solicitado', requisicion: null })).toBe(false);
  });
});

describe('RepuestoRequisicionBadge', () => {
  it('shows the consecutivo link and the colored availability', () => {
    render(
      <MemoryRouter>
        <RepuestoRequisicionBadge repuesto={linked('En_Aprobacion') as never} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'REQ-2026-0005' })).toHaveAttribute('href', '/requisiciones/q1');
    expect(screen.getByText('En aprobación')).toHaveClass('bg-warning');
  });

  it('renders the placeholder without a requisition', () => {
    render(
      <MemoryRouter>
        <RepuestoRequisicionBadge repuesto={{ EstadoSolicitud: 'Solicitado' }} />
      </MemoryRouter>
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('RepuestoBloqueoRequisicion', () => {
  it('explains why the actions are disabled and links to the requisition', () => {
    render(
      <MemoryRouter>
        <RepuestoBloqueoRequisicion repuesto={linked('En_Abastecimiento') as never} />
      </MemoryRouter>
    );
    expect(screen.getByRole('note')).toHaveTextContent('En la requisición REQ-2026-0005 (en abastecimiento): no se puede instalar, editar ni eliminar hasta que esté disponible.');
    expect(screen.getByRole('link', { name: 'Ver requisición' })).toHaveAttribute('href', '/requisiciones/q1');
    expect(screen.getByRole('button', { name: 'Ayuda: Solicitud en requisición' })).toBeInTheDocument();
  });

  it('renders nothing for an unlinked request', () => {
    const { container } = render(
      <MemoryRouter>
        <RepuestoBloqueoRequisicion repuesto={{ EstadoSolicitud: 'Solicitado' }} />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
    expect(bloqueoRequisicionReason(linked('En_Disputa') as never)).toContain('(en disputa)');
  });
});
