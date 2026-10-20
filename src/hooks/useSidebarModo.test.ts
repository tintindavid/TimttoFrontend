import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarModo, CLAVE_MODO_SIDEBAR } from './useSidebarModo';

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('useSidebarModo', () => {
  it('starts fixed and closed by default', () => {
    const { result } = renderHook(() => useSidebarModo());
    expect(result.current.modo).toBe('fijo');
    expect(result.current.compacto).toBe(false);
    expect(result.current.abierto).toBe(false);
  });

  it('restores the compact mode that was saved', () => {
    window.localStorage.setItem(CLAVE_MODO_SIDEBAR, 'compacto');
    const { result } = renderHook(() => useSidebarModo());
    expect(result.current.compacto).toBe(true);
  });

  it('an unknown stored value reads as fixed', () => {
    window.localStorage.setItem(CLAVE_MODO_SIDEBAR, 'enorme');
    const { result } = renderHook(() => useSidebarModo());
    expect(result.current.modo).toBe('fijo');
  });

  it('toggling switches the mode and remembers it, back and forth', () => {
    const { result } = renderHook(() => useSidebarModo());
    act(() => result.current.alternar());
    expect(result.current.modo).toBe('compacto');
    expect(window.localStorage.getItem(CLAVE_MODO_SIDEBAR)).toBe('compacto');
    act(() => result.current.alternar());
    expect(result.current.modo).toBe('fijo');
    expect(window.localStorage.getItem(CLAVE_MODO_SIDEBAR)).toBe('fijo');
  });

  it('the panel only counts as open in compact mode, opens and closes', () => {
    const { result } = renderHook(() => useSidebarModo());
    act(() => result.current.abrir());
    expect(result.current.abierto).toBe(false); // fixed mode: nothing floats
    act(() => result.current.alternar());
    expect(result.current.compacto).toBe(true);
    act(() => result.current.abrir());
    expect(result.current.abierto).toBe(true);
    act(() => result.current.cerrar());
    expect(result.current.abierto).toBe(false);
  });

  it('switching the mode closes the panel', () => {
    window.localStorage.setItem(CLAVE_MODO_SIDEBAR, 'compacto');
    const { result } = renderHook(() => useSidebarModo());
    act(() => result.current.abrir());
    expect(result.current.abierto).toBe(true);
    act(() => result.current.alternar());
    act(() => result.current.alternar());
    expect(result.current.compacto).toBe(true);
    expect(result.current.abierto).toBe(false);
  });

  it('works when the storage throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const { result } = renderHook(() => useSidebarModo());
    expect(result.current.modo).toBe('fijo');
  });

  it('works when the storage throws on write: the mode still switches for the session', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const { result } = renderHook(() => useSidebarModo());
    act(() => result.current.alternar());
    expect(result.current.modo).toBe('compacto');
  });
});
