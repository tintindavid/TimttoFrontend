import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastMock = vi.hoisted(() => ({ info: vi.fn(), warning: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

import { formatRequisicionesDefaults, notifyRequisicionesDefaults } from './requisicionDefaultsToast';

describe('notifyRequisicionesDefaults', () => {
  beforeEach(() => {
    toastMock.info.mockClear();
    toastMock.warning.mockClear();
  });

  it('does nothing when seeding was not attempted', () => {
    notifyRequisicionesDefaults(undefined);
    expect(toastMock.info).not.toHaveBeenCalled();
    expect(toastMock.warning).not.toHaveBeenCalled();
  });

  it('summarizes what was created', () => {
    notifyRequisicionesDefaults({ tipos: 8, areas: 7, regla: 1, presupuesto: 1 });
    expect(toastMock.info).toHaveBeenCalledWith(expect.stringContaining('Se crearon 8 tipos, 7 áreas, 1 regla, 1 presupuesto'));
  });

  it('stays silent when everything already existed', () => {
    expect(formatRequisicionesDefaults({ tipos: 0, areas: 0, regla: 0, presupuesto: 0 })).toBeNull();
    notifyRequisicionesDefaults({ tipos: 0, areas: 0, regla: 0, presupuesto: 0 });
    expect(toastMock.info).not.toHaveBeenCalled();
  });

  it('tells the superadmin to run the seed script when seeding failed', () => {
    notifyRequisicionesDefaults({ error: true });
    expect(toastMock.warning).toHaveBeenCalledWith(expect.stringContaining('npm run seed:requisiciones-defaults -- --tenant=<id>'));
  });
});
