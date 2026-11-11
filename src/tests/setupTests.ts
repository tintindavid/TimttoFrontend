import '@testing-library/jest-dom';

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
