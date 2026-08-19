import { describe, it, expect } from 'vitest';
import { normalizeSerial, serialHasDigit } from './serial';
import fixtures from './__fixtures__/serial-normalize.fixtures.json';

describe('normalizeSerial', () => {
  fixtures.normalize.forEach(({ in: input, out }) => {
    it(`normalizes ${JSON.stringify(input)} to ${JSON.stringify(out)}`, () => {
      expect(normalizeSerial(input)).toBe(out);
    });
  });
});

describe('serialHasDigit', () => {
  fixtures.hasDigit.forEach(({ in: input, expected }) => {
    it(`returns ${expected} for ${JSON.stringify(input)}`, () => {
      expect(serialHasDigit(input)).toBe(expected);
    });
  });
});
