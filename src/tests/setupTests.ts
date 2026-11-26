import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement layout APIs that ProseMirror (Tiptap) calls on selection changes.
const emptyRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList;
const emptyRect = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) }) as DOMRect;
if (typeof Range !== "undefined") {
  Range.prototype.getClientRects ||= emptyRects;
  Range.prototype.getBoundingClientRect ||= emptyRect;
}
if (typeof Element !== "undefined") {
  Element.prototype.getClientRects ||= emptyRects;
}

// Demo accounts: components read the demo status through React Query; by default tests run as a regular tenant, so
// they do not need a QueryClient for it. DemoBanner.test.tsx unmocks it.
vi.mock('@/hooks/useDemoStatus', () => ({
  DEMO_STATUS_KEY: 'demo-status',
  useDemoStatus: () => ({ isDemo: false, limits: undefined, usage: undefined }),
}));
