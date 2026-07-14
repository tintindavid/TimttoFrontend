import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import {
  FaArrowDown,
  FaArrowUp,
  FaFilePdf,
  FaInfoCircle,
  FaMagic,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import RichTextEditor from '@/components/common/RichTextEditor';

export interface GuiaRapidaSection {
  _id?: string;
  titulo: string;
  contenidoHtml: string;
  orden: number;
}

interface Props {
  value: GuiaRapidaSection[];
  onChange: (next: GuiaRapidaSection[]) => void;
  disabled?: boolean;
  equipoLabel: {
    item?: string;
    marca?: string;
    modelo?: string;
    serie?: string;
  };
  /**
   * When true, the tab is in read-only mode: renders the guide as a printable
   * document instead of the editor. The parent (HV page) flips this from its
   * own edit/view toggle so both the HV form and the guide save with the
   * same button.
   */
  readOnly?: boolean;
}

/**
 * Suggested template — mirrors sections recommended for medical device quick
 * reference guides by IEC 60601-1-6 (usability) and ISO/IEC 82304-1 (health
 * software instructions). Users can add / delete / rename freely; this is a
 * scaffold, not a schema.
 */
const TEMPLATE: GuiaRapidaSection[] = [
  { titulo: 'Descripción y uso previsto', contenidoHtml: '<p>Descripción breve del equipo y su propósito clínico.</p>', orden: 0 },
  { titulo: 'Puesta en marcha', contenidoHtml: '<p>Pasos para energizar y preparar el equipo.</p>', orden: 1 },
  { titulo: 'Operación básica', contenidoHtml: '<p>Instrucciones para el uso rutinario, controles principales.</p>', orden: 2 },
  { titulo: 'Precauciones y advertencias', contenidoHtml: '<p><strong>Precauciones clínicas.</strong> Contraindicaciones importantes.</p>', orden: 3 },
  { titulo: 'Limpieza y desinfección', contenidoHtml: '<p>Procedimiento entre pacientes, insumos permitidos.</p>', orden: 4 },
  { titulo: 'Alarmas comunes y solución', contenidoHtml: '<p>Alarmas frecuentes y cómo resolverlas.</p>', orden: 5 },
  { titulo: 'Contacto de soporte', contenidoHtml: '<p>Teléfonos y correos para asistencia técnica.</p>', orden: 6 },
];

/**
 * Very small HTML sanitizer for display in the PDF: keeps a whitelist of tags
 * and strips everything else (attributes included). The rich-text editor
 * itself only emits these tags, so under normal use nothing is stripped —
 * this is defense against payloads pasted before the editor's plain-text paste
 * hook or against tampered content coming back from the DB.
 */
function stripToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return doc.body.textContent || '';
}

const GuiaRapidaTab: React.FC<Props> = ({ value, onChange, disabled = false, equipoLabel, readOnly = false }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Purely controlled component now. Parent owns the state; we just emit
  // structural / text updates so the parent can save them together with the
  // rest of the HV form when the user clicks its "Guardar" button.
  const orderedSections = useMemo(
    () => [...value].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [value],
  );
  const nextOrden = orderedSections.length > 0 ? Math.max(...orderedSections.map((s) => s.orden ?? 0)) + 1 : 0;
  const canEdit = !readOnly && !disabled;

  const addSection = () => {
    onChange([
      ...orderedSections,
      { titulo: 'Nueva sección', contenidoHtml: '', orden: nextOrden },
    ]);
  };

  const removeSection = (index: number) => {
    if (!window.confirm('¿Eliminar esta sección de la guía rápida?')) return;
    onChange(orderedSections.filter((_, i) => i !== index).map((s, i) => ({ ...s, orden: i })));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedSections.length) return;
    const next = [...orderedSections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, orden: i })));
  };

  const updateSection = (index: number, patch: Partial<GuiaRapidaSection>) => {
    onChange(orderedSections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  };

  const loadTemplate = () => {
    if (orderedSections.length > 0 && !window.confirm('Esto reemplaza las secciones actuales por la plantilla sugerida. ¿Continuar?')) {
      return;
    }
    onChange(TEMPLATE.map((s) => ({ ...s })));
  };

  /**
   * Renders the guía to a printable PDF. Since jsPDF cannot render arbitrary
   * HTML with structured styles reliably, we walk the DOM and emit blocks:
   *   - <p> → paragraph (respects <strong> and <em> via a naive markdown-ish
   *     conversion into font style changes).
   *   - <h4> → subtitle (bold, larger).
   *   - <ul>/<ol> → bullets/numbers.
   * Anything unknown falls back to plain text so the PDF never crashes.
   */
  const generatePdf = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const marginX = 18;
      const marginTop = 20;
      let cursorY = marginTop;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pageWidth - marginX * 2;
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ensureSpace = (needed: number) => {
        if (cursorY + needed > pageHeight - 18) {
          pdf.addPage();
          cursorY = marginTop;
        }
      };

      // ── Cabecera
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Guía Rápida de Uso', marginX, cursorY);
      cursorY += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const equipoLine = [equipoLabel.item, equipoLabel.marca, equipoLabel.modelo]
        .filter((v) => v && String(v).trim().length > 0)
        .join(' · ');
      if (equipoLine) {
        pdf.text(equipoLine, marginX, cursorY);
        cursorY += 6;
      }
      if (equipoLabel.serie) {
        pdf.setTextColor(90);
        pdf.text(`Serie: ${equipoLabel.serie}`, marginX, cursorY);
        pdf.setTextColor(0);
        cursorY += 6;
      }

      pdf.setDrawColor(180);
      pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 6;

      // ── Cuerpo — cada sección en un recuadro estilizado
      for (const section of orderedSections) {
        ensureSpace(20);
        // Título de sección
        pdf.setFillColor(240, 240, 240);
        pdf.rect(marginX, cursorY, usableWidth, 8, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.titulo, marginX + 2, cursorY + 5.5);
        cursorY += 10;

        // Contenido — se renderiza como bloques a partir del HTML.
        const container = document.createElement('div');
        container.innerHTML = section.contenidoHtml || '';
        renderNodesToPdf(pdf, container.childNodes, {
          marginX,
          usableWidth,
          ensureSpace,
          getCursorY: () => cursorY,
          setCursorY: (y: number) => { cursorY = y; },
        });
        cursorY += 4;
      }

      // ── Pie de página
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(140);
        pdf.text(
          `Guía Rápida · ${equipoLine || 'Equipo médico'} · Página ${i} de ${totalPages}`,
          marginX,
          pageHeight - 8,
        );
        pdf.setTextColor(0);
      }

      const filename = `guia-rapida-${(equipoLabel.serie || equipoLabel.modelo || 'equipo').replace(/\s+/g, '-')}.pdf`;
      pdf.save(filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">Guía Rápida de Uso</h5>
            <OverlayTrigger placement="right" overlay={<Tooltip id="gr-info-tt">Cómo estructurar la guía</Tooltip>}>
              <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => setShowInfo(true)}>
                <FaInfoCircle size={22} />
              </Button>
            </OverlayTrigger>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {canEdit && (
              <Button variant="outline-primary" size="sm" onClick={loadTemplate}>
                <FaMagic className="me-1" />
                Cargar plantilla
              </Button>
            )}
            <Button variant="outline-danger" size="sm" onClick={generatePdf} disabled={downloading || orderedSections.length === 0}>
              {downloading ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Generando…</> : <><FaFilePdf className="me-1" /> Descargar PDF</>}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {orderedSections.length === 0 && (
            <Alert variant="info">
              {canEdit
                ? <>La guía rápida aún no tiene secciones. Usa <strong>Cargar plantilla</strong> para partir de una estructura recomendada (IEC 60601-1-6 / ISO 82304-1) o agrega secciones manualmente.</>
                : <>La guía rápida aún no tiene contenido. Entra al modo <strong>Editar</strong> de la HV para agregar secciones.</>}
            </Alert>
          )}

          {readOnly && orderedSections.length > 0 && (
            <Alert variant="secondary" className="small mb-3">
              Vista previa de la guía. Para modificarla, activa <strong>Editar</strong> en el tab Hoja de Vida y guarda al finalizar.
            </Alert>
          )}

          {orderedSections.map((section, index) => (
            <Card key={section._id || `section-${index}`} className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  {canEdit ? (
                    <Form.Control
                      value={section.titulo}
                      onChange={(e) => updateSection(index, { titulo: e.target.value })}
                      placeholder="Título de la sección"
                      maxLength={200}
                      style={{ maxWidth: '480px' }}
                    />
                  ) : (
                    <h6 className="mb-0">{section.titulo || 'Sección sin título'}</h6>
                  )}
                </div>
                {canEdit && (
                  <div className="d-flex gap-1">
                    <Button variant="outline-secondary" size="sm" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Subir">
                      <FaArrowUp />
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => moveSection(index, 1)} disabled={index === orderedSections.length - 1} aria-label="Bajar">
                      <FaArrowDown />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => removeSection(index)} aria-label="Eliminar sección">
                      <FaTrash />
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                {canEdit ? (
                  <RichTextEditor
                    value={section.contenidoHtml}
                    onChange={(html) => updateSection(index, { contenidoHtml: html })}
                    ariaLabel={`Contenido de ${section.titulo}`}
                    placeholder="Escribe el contenido de esta sección…"
                  />
                ) : (
                  <div
                    className="guia-rapida-viewer"
                    // Content is sanitized upstream (rich editor emits a small
                    // whitelist of tags). Rendering as HTML preserves the
                    // formatting the user typed.
                    dangerouslySetInnerHTML={{ __html: section.contenidoHtml || '<em class="text-muted">Sin contenido.</em>' }}
                  />
                )}
              </Card.Body>
            </Card>
          ))}

          {canEdit && (
            <div className="d-flex justify-content-between align-items-center">
              <Button variant="outline-primary" size="sm" onClick={addSection}>
                <FaPlus className="me-1" /> Agregar sección
              </Button>
              <small className="text-muted">
                Los cambios se guardan cuando presionas <strong>Guardar</strong> en la HV.
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showInfo} onHide={() => setShowInfo(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaInfoCircle className="me-2 text-primary" />
            Guía Rápida — recomendaciones normativas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            La <strong>Guía Rápida</strong> es un resumen de uso para el operador clínico. Debe estar disponible
            junto al equipo y ser comprensible sin abrir el manual completo del fabricante.
          </p>
          <h6>Referencias normativas</h6>
          <ul>
            <li><strong>IEC 60601-1-6 (Usabilidad de electromédicos):</strong> exige guías de uso claras que reduzcan riesgos por uso indebido.</li>
            <li><strong>ISO/IEC 82304-1:</strong> instrucciones de uso modulares para software y dispositivos.</li>
            <li><strong>Tecnovigilancia INVIMA (Colombia):</strong> las guías rápidas facilitan trazabilidad de incidentes y capacitación.</li>
            <li><strong>ISO 13485:</strong> documentación de dispositivos como parte del sistema de gestión de calidad.</li>
          </ul>
          <h6>Secciones recomendadas</h6>
          <p>Se sugieren, como mínimo:</p>
          <ol>
            <li>Descripción y uso previsto.</li>
            <li>Puesta en marcha.</li>
            <li>Operación básica y controles principales.</li>
            <li>Precauciones, advertencias y contraindicaciones.</li>
            <li>Limpieza y desinfección entre pacientes.</li>
            <li>Alarmas comunes y su resolución rápida.</li>
            <li>Contacto de soporte técnico.</li>
          </ol>
          <p className="small text-muted">
            La plantilla precargada cubre estas secciones; el usuario puede adaptarlas al equipo específico.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowInfo(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF rendering helpers
// ─────────────────────────────────────────────────────────────────────────────

interface PdfCursor {
  marginX: number;
  usableWidth: number;
  ensureSpace: (needed: number) => void;
  getCursorY: () => number;
  setCursorY: (y: number) => void;
}

function renderNodesToPdf(pdf: jsPDF, nodes: NodeListOf<ChildNode>, cursor: PdfCursor) {
  nodes.forEach((node) => renderNodeToPdf(pdf, node, cursor));
}

function renderNodeToPdf(pdf: jsPDF, node: ChildNode, cursor: PdfCursor) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent || '').trim();
    if (text) writeParagraph(pdf, text, cursor, 'normal');
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'p':
    case 'div':
      writeParagraph(pdf, elementToInlineString(el), cursor, 'normal');
      break;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
      writeParagraph(pdf, elementToInlineString(el), cursor, 'bold', 12);
      break;
    case 'ul':
      Array.from(el.children).forEach((li) => {
        writeParagraph(pdf, `•  ${elementToInlineString(li as HTMLElement)}`, cursor, 'normal', 10, 4);
      });
      break;
    case 'ol':
      Array.from(el.children).forEach((li, index) => {
        writeParagraph(pdf, `${index + 1}.  ${elementToInlineString(li as HTMLElement)}`, cursor, 'normal', 10, 4);
      });
      break;
    case 'br':
      cursor.setCursorY(cursor.getCursorY() + 4);
      break;
    default:
      // Fallback: render as plain text so nothing gets silently dropped.
      writeParagraph(pdf, elementToInlineString(el), cursor, 'normal');
  }
}

/**
 * Reduces an element's children to a plain string with `**` around bold text
 * and `_` around italic text, which the paragraph writer then interprets. This
 * is a pragmatic shortcut so the PDF can show mixed styles without doing a
 * proper inline layout engine.
 */
function elementToInlineString(el: HTMLElement): string {
  let out = '';
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent || '';
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const inner = elementToInlineString(child as HTMLElement);
    const tag = (child as HTMLElement).tagName.toLowerCase();
    if (tag === 'strong' || tag === 'b') out += `**${inner}**`;
    else if (tag === 'em' || tag === 'i') out += `_${inner}_`;
    else out += inner;
  });
  return out;
}

function writeParagraph(
  pdf: jsPDF,
  raw: string,
  cursor: PdfCursor,
  weight: 'normal' | 'bold',
  fontSize = 10,
  indent = 0,
) {
  if (!raw.trim()) return;
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', weight);

  // Split into tokens so bold/italic markers become style changes. Very
  // shallow — good enough for a printed quick reference.
  const tokens = tokenizeInline(raw);
  const lineHeight = fontSize * 0.45;
  const startX = cursor.marginX + indent;
  const maxWidth = cursor.usableWidth - indent;
  let x = startX;
  let y = cursor.getCursorY();

  for (const token of tokens) {
    pdf.setFont('helvetica', token.style);
    const words = token.text.split(/(\s+)/);
    for (const word of words) {
      if (word === '') continue;
      const wordWidth = pdf.getTextWidth(word);
      if (x + wordWidth > cursor.marginX + cursor.usableWidth && word.trim() !== '') {
        y += lineHeight + 1.5;
        cursor.ensureSpace(lineHeight + 3);
        y = Math.max(y, cursor.getCursorY());
        x = startX;
      }
      pdf.text(word, x, y);
      x += wordWidth;
      if (word.length > maxWidth) {
        // Extremely long unbreakable strings — force a wrap.
        y += lineHeight + 1.5;
        x = startX;
      }
    }
  }

  y += lineHeight + 3;
  cursor.setCursorY(y);
  cursor.ensureSpace(lineHeight);
}

interface InlineToken { text: string; style: 'normal' | 'bold' | 'italic'; }

function tokenizeInline(raw: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  let current = '';
  let style: InlineToken['style'] = 'normal';
  const push = () => {
    if (current) tokens.push({ text: current, style });
    current = '';
  };
  while (i < raw.length) {
    if (raw.startsWith('**', i)) {
      push();
      style = style === 'bold' ? 'normal' : 'bold';
      i += 2;
      continue;
    }
    if (raw[i] === '_') {
      push();
      style = style === 'italic' ? 'normal' : 'italic';
      i += 1;
      continue;
    }
    current += raw[i];
    i += 1;
  }
  push();
  return tokens;
}

export default GuiaRapidaTab;
