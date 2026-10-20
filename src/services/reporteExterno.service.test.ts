import { describe, it, expect, vi, beforeEach } from 'vitest';

const post = vi.fn();
const del = vi.fn();
vi.mock('./api', () => ({ api: { post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) } }));

import { reporteExternoService, ESTADOS_OPERATIVOS, WARNING_MES_FUERA_DE_CRONOGRAMA } from './reporteExterno.service';

beforeEach(() => {
  post.mockReset();
  del.mockReset();
  post.mockResolvedValue({ data: { success: true, data: { _id: 'r1' }, warnings: [] } });
  del.mockResolvedValue({ data: { success: true } });
});

describe('reporteExternoService.create', () => {
  it('posts a multipart body to the equipment endpoint', async () => {
    await reporteExternoService.create('eq1', {
      tipoMtto: 'Preventivo', fecha: '2026-03-12', estadoOperativo: 'Operativo', proveedorId: 'p1',
      consecutivoDocumento: 'C-1', observacion: 'ok',
    });
    expect(post.mock.calls[0][0]).toBe('/equipos/eq1/reportes-externos');
    const fd = post.mock.calls[0][1] as FormData;
    expect(fd.get('tipoMtto')).toBe('Preventivo');
    expect(fd.get('fecha')).toBe('2026-03-12');
    expect(fd.get('proveedorId')).toBe('p1');
    expect(fd.get('consecutivoDocumento')).toBe('C-1');
  });

  it('skips empty values and never sends a consecutive', async () => {
    await reporteExternoService.create('eq1', {
      tipoMtto: 'Correctivo', fecha: '2026-03-12', estadoOperativo: 'Operativo', proveedor: 'Taller',
      consecutivoDocumento: '', observacion: undefined, enlace: '',
    });
    const fd = post.mock.calls[0][1] as FormData;
    expect(fd.has('consecutivoDocumento')).toBe(false);
    expect(fd.has('observacion')).toBe(false);
    expect(fd.has('enlace')).toBe(false);
    expect(fd.has('consecutivo')).toBe(false);
    expect(fd.has('verificationParam')).toBe(false);
  });

  it('sends the verification rows as JSON and omits an empty list', async () => {
    const rows = [{ magnitud: 'Presion', unidad: 'mmHg', valorReferencia: 120, valorMedido: 118.5, patron: 'Fluke' }];
    await reporteExternoService.create('eq1', { tipoMtto: 'Preventivo', fecha: '2026-03-12', estadoOperativo: 'Operativo', proveedor: 'T', verificationParam: rows });
    expect(JSON.parse((post.mock.calls[0][1] as FormData).get('verificationParam') as string)).toEqual(rows);
    await reporteExternoService.create('eq1', { tipoMtto: 'Preventivo', fecha: '2026-03-12', estadoOperativo: 'Operativo', proveedor: 'T', verificationParam: [] });
    expect((post.mock.calls[1][1] as FormData).has('verificationParam')).toBe(false);
  });

  it('attaches the document under the field the backend expects', async () => {
    const file = new File(['%PDF'], 'cert.pdf', { type: 'application/pdf' });
    await reporteExternoService.create('eq1', { tipoMtto: 'Preventivo', fecha: '2026-03-12', estadoOperativo: 'Operativo', proveedor: 'T' }, file);
    expect((post.mock.calls[0][1] as FormData).get('documento')).toBeInstanceOf(File);
  });

  it('returns the response body with the warnings', async () => {
    post.mockResolvedValue({ data: { success: true, data: { _id: 'r9' }, warnings: [WARNING_MES_FUERA_DE_CRONOGRAMA] } });
    const res = await reporteExternoService.create('eq1', { tipoMtto: 'Preventivo', fecha: '2026-03-12', estadoOperativo: 'Operativo', proveedor: 'T' });
    expect(res.warnings).toEqual(['MES_FUERA_DE_CRONOGRAMA']);
    expect(res.data._id).toBe('r9');
  });
});

describe('reporteExternoService.remove', () => {
  it('deletes by equipment and report id', async () => {
    await reporteExternoService.remove('eq1', 'r1');
    expect(del).toHaveBeenCalledWith('/equipos/eq1/reportes-externos/r1');
  });
});

describe('operative states', () => {
  it('are the shared enum', () => {
    expect(ESTADOS_OPERATIVOS).toEqual(['Operativo', 'Fuera de Servicio', 'En Mantenimiento', 'Espera de Repuestos', 'En Reparacion']);
  });
});
