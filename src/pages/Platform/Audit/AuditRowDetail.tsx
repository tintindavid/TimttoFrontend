import React, { useState } from 'react';
import { Collapse, Button } from 'react-bootstrap';
import type { PlatformAuditLog } from '@/types';

interface Props {
  log: PlatformAuditLog;
}

/**
 * Expandable row detail that shows before/after snapshots as formatted JSON.
 * MVP: plain <pre> blocks — no diff-viewer library dependency.
 */
const AuditRowDetail: React.FC<Props> = ({ log }) => {
  const [open, setOpen] = useState(false);
  const hasDiff = log.before !== undefined || log.after !== undefined;

  if (!hasDiff) return null;

  const formatJson = (value: unknown): string => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`audit-detail-${log._id}`}
        className="p-0 text-decoration-none"
      >
        {open ? 'Ocultar detalle' : 'Ver detalle'}
      </Button>

      <Collapse in={open}>
        <div id={`audit-detail-${log._id}`}>
          <div className="mt-2 d-flex gap-3 flex-wrap">
            {log.before !== undefined && (
              <div style={{ flex: '1 1 300px' }}>
                <small className="fw-semibold text-muted d-block mb-1">Antes</small>
                <pre
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    maxHeight: 240,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  aria-label="Estado anterior"
                >
                  {formatJson(log.before)}
                </pre>
              </div>
            )}
            {log.after !== undefined && (
              <div style={{ flex: '1 1 300px' }}>
                <small className="fw-semibold text-muted d-block mb-1">Después</small>
                <pre
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    maxHeight: 240,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  aria-label="Estado posterior"
                >
                  {formatJson(log.after)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </Collapse>
    </>
  );
};

export default AuditRowDetail;
