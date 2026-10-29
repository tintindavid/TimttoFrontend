import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());
vi.mock('./api', () => ({ api: { post, get: vi.fn() } }));

import { requisicionService } from './requisicion.service';
import { repuestoService } from './repuesto.service';

describe('reception services', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { success: true, data: { ok: true } } });
  });

  it('registrarRecepcion sends multipart: scalars, items as JSON and one `evidencias` part per file', async () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    await requisicionService.registrarRecepcion('r1', {
      fecha: '2026-10-20',
      documento: 'REM-1',
      observacion: 'ok',
      items: [{ lineaId: 'l1', cantidadRecibida: 2 }],
      evidencias: [file],
    });
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/requisiciones/r1/recepciones');
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect(form.get('fecha')).toBe('2026-10-20');
    expect(form.get('documento')).toBe('REM-1');
    expect(form.get('observacion')).toBe('ok');
    expect(JSON.parse(form.get('items') as string)).toEqual([{ lineaId: 'l1', cantidadRecibida: 2 }]);
    expect(form.getAll('evidencias')).toHaveLength(1);
  });

  it('omits empty optional fields', async () => {
    await requisicionService.registrarRecepcion('r1', { items: [{ lineaId: 'l1', cantidadRecibida: 1 }] });
    const form = post.mock.calls[0][1] as FormData;
    expect(form.has('fecha')).toBe(false);
    expect(form.has('documento')).toBe(false);
    expect(form.getAll('evidencias')).toHaveLength(0);
  });

  it('confirmarEntrega and cerrarLinea post to the contract endpoints', async () => {
    await requisicionService.confirmarEntrega('r1', 'rc1', { items: [{ lineaId: 'l1', resultado: 'Recibido' }] });
    expect(post).toHaveBeenLastCalledWith('/requisiciones/r1/recepciones/rc1/confirmar', { items: [{ lineaId: 'l1', resultado: 'Recibido' }] });
    await requisicionService.cerrarLinea('r1', 'l1', { motivo: 'Sin stock' });
    expect(post).toHaveBeenLastCalledWith('/requisiciones/r1/lineas/l1/cerrar', { motivo: 'Sin stock' });
  });

  it('createRequisicionFromSolicitudes posts to /repuestos/requisicion and createOt forwards the omission', async () => {
    await repuestoService.createRequisicionFromSolicitudes({ repuestoIds: ['a'], tipoRequisicionId: 't', areaId: 'ar' });
    expect(post).toHaveBeenLastCalledWith('/repuestos/requisicion', { repuestoIds: ['a'], tipoRequisicionId: 't', areaId: 'ar' });
    await repuestoService.createOtFromSolicitudes(['a'], {
      responsableUserIds: ['u'],
      fechaInicio: 'x',
      fechaFin: 'y',
      omitirRequisicion: true,
      motivoOmision: 'Urgencia',
    });
    expect(post.mock.calls[1][0]).toBe('/repuestos/ot-from-solicitudes');
    expect(post.mock.calls[1][1]).toMatchObject({ repuestoIds: ['a'], omitirRequisicion: true, motivoOmision: 'Urgencia' });
  });
});
