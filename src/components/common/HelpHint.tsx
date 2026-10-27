import React, { useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';

export type HelpHintPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

interface Props {
  /** Short title: shown as the popover header and used for the accessible label ("Ayuda: <title>"). */
  title: string;
  /** Popover content. */
  children: React.ReactNode;
  placement?: HelpHintPlacement;
  className?: string;
}

/**
 * Small round "(!)" button that opens a contextual help popover.
 * Opens on click / Enter / Space (so it works on touch and keyboard); closes on Escape, outside click or toggling again.
 * The popover is rendered in `document.body`, so it is never clipped by tables, cards or modals.
 */
const HelpHint: React.FC<Props> = ({ title, children, placement = 'auto', className = '' }) => {
  const [show, setShow] = useState(false);

  const popover = (
    <Popover id={`help-hint-${title.replace(/\W+/g, '-').toLowerCase()}`} className="help-hint-popover">
      <Popover.Header as="h3" className="fs-6">
        {title}
      </Popover.Header>
      <Popover.Body className="small">{children}</Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      rootClose
      show={show}
      onToggle={setShow}
      placement={placement}
      overlay={popover}
    >
      <button
        type="button"
        className={`btn btn-link p-0 border-0 align-baseline text-secondary lh-1 ${className}`.trim()}
        aria-label={`Ayuda: ${title}`}
        aria-expanded={show}
        aria-haspopup="dialog"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setShow(false);
        }}
      >
        <FaInfoCircle size={15} aria-hidden="true" />
      </button>
    </OverlayTrigger>
  );
};

export default HelpHint;
