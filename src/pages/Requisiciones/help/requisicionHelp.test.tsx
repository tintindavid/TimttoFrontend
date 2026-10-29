import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { REQUISICION_ESTADOS } from '@/types/requisicion.types';
import { EVENT_META } from '@/utils/requisicion.utils';
import GuiaModal from './GuiaModal';
import ReqHelp from './ReqHelp';
import {
  ESTADO_HELP_IDS,
  GUIA_CONCEPTOS,
  GUIA_PASOS,
  REQUISICION_HELP,
  eventHelpId,
  getHelp,
} from './requisicionHelp';

// Raw source of every page / component of the module (tests excluded), to check the ids they use.
const sources = import.meta.glob(
  [
    '../**/*.tsx',
    '!../**/*.test.tsx',
    '../../Repuestos/**/*.tsx',
    '!../../Repuestos/**/*.test.tsx',
    '../../../components/repuestos/*.tsx',
    '!../../../components/repuestos/*.test.tsx',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

const usedIds = (): Set<string> => {
  const ids = new Set<string>();
  Object.entries(sources).forEach(([file, code]) => {
    if (file.includes('/help/')) return;
    // `<ReqHelp id="x" />` and `helpId="x"`, plus every quoted id inside an expression (`id={cond ? 'a' : 'b'}`).
    const attr = /(?:\bid|\bhelpId)=(?:"([^"]+)"|\{([^}]+)\})/g;
    let match: RegExpExecArray | null;
    while ((match = attr.exec(code))) {
      if (match[1]) ids.add(match[1]);
      else (match[2].match(/'([^']+)'/g) ?? []).forEach((q) => ids.add(q.slice(1, -1)));
    }
  });
  return ids;
};

describe('requisicion help catalog', () => {
  it('has a title and a body for every entry, with concise Spanish text', () => {
    Object.entries(REQUISICION_HELP).forEach(([id, entry]) => {
      expect(entry.title.trim(), id).not.toBe('');
      expect(entry.body.trim(), id).not.toBe('');
      // Concise: body + relation stay within a short paragraph.
      expect(entry.body.length + (entry.relation?.length ?? 0), id).toBeLessThan(560);
    });
  });

  it('every id used by the pages exists in the catalog', () => {
    const used = Array.from(usedIds()).filter((id) => /^[a-z]+\.[A-Za-z_.${}]+$/.test(id) && !id.includes('$'));
    expect(used.length).toBeGreaterThan(40);
    used.forEach((id) => expect(Object.keys(REQUISICION_HELP), `missing help id ${id}`).toContain(id));
  });

  it('has an entry for every requisicion estado', () => {
    REQUISICION_ESTADOS.forEach((estado) => expect(REQUISICION_HELP).toHaveProperty(`estado.${estado}`));
    expect(ESTADO_HELP_IDS).toHaveLength(REQUISICION_ESTADOS.length);
  });

  it('has an entry for every timeline event', () => {
    Object.keys(EVENT_META).forEach((tipo) => expect(eventHelpId(tipo), tipo).toBeDefined());
    expect(eventHelpId('NO_EXISTE')).toBeUndefined();
  });

  it('has an entry for every action of the detail page', () => {
    ['enviar', 'editar', 'eliminar', 'aprobar', 'rechazar', 'retirar', 'reabrir', 'cancelar', 'reasignar'].forEach((action) =>
      expect(REQUISICION_HELP).toHaveProperty(`accion.${action}`)
    );
  });

  it('uses every entry somewhere (page, estado legend, timeline or guide)', () => {
    const used = usedIds();
    const covered = new Set<string>([...used, ...ESTADO_HELP_IDS, ...GUIA_PASOS, ...GUIA_CONCEPTOS, ...Object.keys(EVENT_META).map((t) => `evento.${t}`)]);
    const unused = Object.keys(REQUISICION_HELP).filter((id) => !covered.has(id));
    expect(unused).toEqual([]);
  });
});

describe('ReqHelp', () => {
  it('renders the hint labelled with the catalog title and shows body and relation', async () => {
    const user = userEvent.setup();
    render(<ReqHelp id="regla.montoHasta" />);
    await user.click(screen.getByRole('button', { name: `Ayuda: ${getHelp('regla.montoHasta').title}` }));
    expect(await screen.findByText(getHelp('regla.montoHasta').body)).toBeInTheDocument();
    expect(screen.getByText(/Cómo se relaciona/)).toBeInTheDocument();
  });

  it('the states legend lists every estado with its meaning', async () => {
    const user = userEvent.setup();
    render(<ReqHelp id="estados.leyenda" />);
    await user.click(screen.getByRole('button', { name: 'Ayuda: Estados de una requisición' }));
    await screen.findByText(getHelp('estados.leyenda').body);
    ESTADO_HELP_IDS.forEach((id) => {
      expect(screen.getByText(getHelp(id).title, { selector: 'dt' })).toBeInTheDocument();
      expect(screen.getByText(getHelp(id).body)).toBeInTheDocument();
    });
  });
});

describe('GuiaModal', () => {
  it('shows the end-to-end flow and the key concepts built from the catalog', () => {
    render(<GuiaModal show onHide={() => undefined} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    [...GUIA_PASOS, ...GUIA_CONCEPTOS].forEach((id) => {
      expect(screen.getByRole('heading', { name: getHelp(id).title })).toBeInTheDocument();
      expect(screen.getByText(getHelp(id).body)).toBeInTheDocument();
    });
  });

  it('calls onHide when closed', async () => {
    const user = userEvent.setup();
    let hidden = 0;
    render(<GuiaModal show onHide={() => (hidden += 1)} />);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(hidden).toBeGreaterThan(0);
  });
});
