import { describe, it, expect } from 'vitest';
import { nameShort } from './nameShort';

describe('nameShort', () => {
  it('formats first-name initial + last name', () => {
    expect(nameShort({ firstName: 'Martin', lastName: 'Duran' })).toBe('M. Duran');
  });

  it('uses only the first word of a compound last name', () => {
    expect(nameShort({ firstName: 'Martin', lastName: 'Duran Martinez' })).toBe('M. Duran');
  });

  it('falls back to the email local-part when firstName is missing', () => {
    expect(nameShort({ email: 'jdoe@timtto.com' })).toBe('jdoe');
  });

  it('falls back to the email local-part when lastName is missing but keeps initial-only when there is a firstName without email fallback needed', () => {
    expect(nameShort({ firstName: 'Martin' })).toBe('M.');
  });

  it('returns "?" when nothing usable is provided', () => {
    expect(nameShort({})).toBe('?');
    expect(nameShort(null)).toBe('?');
    expect(nameShort(undefined)).toBe('?');
  });

  it('trims whitespace-only firstName/lastName before falling back', () => {
    expect(nameShort({ firstName: '  ', lastName: '  ', email: 'ana@timtto.com' })).toBe('ana');
  });
});
