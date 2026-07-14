import React, { useCallback, useEffect, useRef } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FaBold, FaItalic, FaListUl, FaListOl, FaHeading, FaUndo, FaRedo } from 'react-icons/fa';

interface RichTextEditorProps {
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  ariaLabel?: string;
}

/**
 * Minimal rich-text editor built on `contentEditable` + `document.execCommand`.
 * Chosen over TipTap/Quill to keep the bundle lean — Guía Rápida only needs
 * bold / italic / lists / headings / undo, and the deprecated `execCommand`
 * is still fully supported by every browser we target.
 *
 * The editor writes back sanitized-ish HTML on every input; consumers should
 * still pass it through DOMPurify (or similar) before rendering elsewhere.
 * We keep the toolbar disabled when the editor is disabled so accidental
 * clicks don't focus a read-only area.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí…',
  disabled = false,
  minHeight = 160,
  ariaLabel,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // Track the last value we emitted. Start as a sentinel (`null`) so the
  // first effect run always populates the DOM — otherwise the initial value
  // would be treated as "already synced" and the editor would render empty
  // even though `value` had content (common when this component remounts,
  // e.g. when the parent flips read-only → editable).
  const lastEmittedRef = useRef<string | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastEmittedRef.current) {
      el.innerHTML = value || '';
      lastEmittedRef.current = value || '';
    }
  }, [value]);

  const runCommand = useCallback(
    (command: string, arg?: string) => {
      if (disabled) return;
      editorRef.current?.focus();
      // execCommand is deprecated but still the pragmatic way to keep this
      // editor tiny; every evergreen browser supports it.
      document.execCommand(command, false, arg);
      const html = editorRef.current?.innerHTML || '';
      lastEmittedRef.current = html;
      onChange(html);
    },
    [disabled, onChange],
  );

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    lastEmittedRef.current = html;
    onChange(html);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    // Force plain-text paste so users don't drop huge Word / Docs markup blobs.
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={`border rounded ${disabled ? 'bg-light' : ''}`}>
      <div className="border-bottom p-1 d-flex flex-wrap gap-1 bg-light">
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => runCommand('bold')} disabled={disabled} title="Negrita (Ctrl+B)">
            <FaBold />
          </Button>
          <Button variant="outline-secondary" onClick={() => runCommand('italic')} disabled={disabled} title="Cursiva (Ctrl+I)">
            <FaItalic />
          </Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => runCommand('formatBlock', 'H4')} disabled={disabled} title="Subtítulo">
            <FaHeading />
          </Button>
          <Button variant="outline-secondary" onClick={() => runCommand('formatBlock', 'P')} disabled={disabled} title="Párrafo">
            P
          </Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => runCommand('insertUnorderedList')} disabled={disabled} title="Lista con viñetas">
            <FaListUl />
          </Button>
          <Button variant="outline-secondary" onClick={() => runCommand('insertOrderedList')} disabled={disabled} title="Lista numerada">
            <FaListOl />
          </Button>
        </ButtonGroup>
        <ButtonGroup size="sm" className="ms-auto">
          <Button variant="outline-secondary" onClick={() => runCommand('undo')} disabled={disabled} title="Deshacer">
            <FaUndo />
          </Button>
          <Button variant="outline-secondary" onClick={() => runCommand('redo')} disabled={disabled} title="Rehacer">
            <FaRedo />
          </Button>
        </ButtonGroup>
      </div>
      <div
        ref={editorRef}
        className="p-3"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        aria-label={ariaLabel}
        role="textbox"
        aria-multiline
        style={{
          minHeight,
          outline: 'none',
          whiteSpace: 'pre-wrap',
        }}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #adb5bd;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
