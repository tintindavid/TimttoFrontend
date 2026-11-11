import React, { useEffect } from 'react';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export interface RichTextEditorProps {
  /** Initial HTML (the editor is uncontrolled after mount). */
  value: string;
  onChange: (html: string) => void;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}

const EMPTY_HTML = '<p></p>';

/**
 * Limited rich text editor (bold/italic/underline, h1-h3, lists, hard break).
 * Everything else in StarterKit is disabled; the backend sanitizes anyway.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  maxLength = 20000,
  disabled = false,
  placeholder = 'Escriba aquí observaciones adicionales (opcional)...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
      }),
    ],
    content: value,
    editable: !disabled,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'form-control rich-text-editor-content',
        'aria-label': 'Observaciones adicionales del informe',
        role: 'textbox',
        'aria-multiline': 'true',
        'data-placeholder': placeholder,
        style: 'min-height: 140px; max-height: 320px; overflow-y: auto;',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML();
      onChange(html === EMPTY_HTML ? '' : html);
    },
  });

  useEffect(() => {
    // emitUpdate=false: toggling editability must not look like a content change to the parent.
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  const length = editor ? editor.getHTML().length : 0;
  const tooLong = length > maxLength;

  const btn = (label: string, aria: string, active: boolean, run: () => void) => (
    <Button
      type="button"
      size="sm"
      variant={active ? 'secondary' : 'outline-secondary'}
      aria-label={aria}
      aria-pressed={active}
      disabled={disabled || !editor}
      onClick={run}
    >
      {label}
    </Button>
  );

  return (
    <div>
      <ButtonGroup className="mb-2 flex-wrap" role="toolbar" aria-label="Formato de texto">
        {btn('N', 'Negrita', !!editor?.isActive('bold'), () => editor?.chain().focus().toggleBold().run())}
        {btn('K', 'Cursiva', !!editor?.isActive('italic'), () => editor?.chain().focus().toggleItalic().run())}
        {btn('S', 'Subrayado', !!editor?.isActive('underline'), () => editor?.chain().focus().toggleUnderline().run())}
        {btn('H1', 'Título 1', !!editor?.isActive('heading', { level: 1 }), () => editor?.chain().focus().toggleHeading({ level: 1 }).run())}
        {btn('H2', 'Título 2', !!editor?.isActive('heading', { level: 2 }), () => editor?.chain().focus().toggleHeading({ level: 2 }).run())}
        {btn('H3', 'Título 3', !!editor?.isActive('heading', { level: 3 }), () => editor?.chain().focus().toggleHeading({ level: 3 }).run())}
        {btn('• Lista', 'Lista con viñetas', !!editor?.isActive('bulletList'), () => editor?.chain().focus().toggleBulletList().run())}
        {btn('1. Lista', 'Lista numerada', !!editor?.isActive('orderedList'), () => editor?.chain().focus().toggleOrderedList().run())}
        {btn('Salto', 'Salto de línea', false, () => editor?.chain().focus().setHardBreak().run())}
      </ButtonGroup>
      <EditorContent editor={editor} />
      <div className="d-flex justify-content-between mt-1">
        <Form.Text muted>
          Solo se conserva negrita, cursiva, subrayado, títulos y listas; los estilos pegados desde otras fuentes se descartan.
        </Form.Text>
        <Form.Text className={tooLong ? 'text-danger fw-semibold' : 'text-muted'} data-testid="char-counter" role="status">
          {length} / {maxLength}
        </Form.Text>
      </div>
    </div>
  );
};

export default RichTextEditor;
