import React from 'react';
import HelpHint, { type HelpHintPlacement } from '@/components/common/HelpHint';
import { ESTADO_HELP_IDS, getHelp, type HelpId } from './requisicionHelp';

interface Props {
  id: HelpId;
  placement?: HelpHintPlacement;
  className?: string;
}

/** Body of a catalog entry: what it does, how it relates to the rest, and an optional tip. */
export const HelpContent: React.FC<{ id: HelpId }> = ({ id }) => {
  const entry = getHelp(id);
  return (
    <>
      <p className="mb-1">{entry.body}</p>
      {id === 'estados.leyenda' && (
        <dl className="mb-1">
          {ESTADO_HELP_IDS.map((estadoId) => {
            const estado = getHelp(estadoId);
            return (
              <React.Fragment key={estadoId}>
                <dt>{estado.title}</dt>
                <dd className="mb-1">{estado.body}</dd>
              </React.Fragment>
            );
          })}
        </dl>
      )}
      {entry.relation && (
        <p className="mb-1">
          <strong>Cómo se relaciona: </strong>
          {entry.relation}
        </p>
      )}
      {entry.tip && (
        <p className="mb-0 text-muted">
          <strong>Consejo: </strong>
          {entry.tip}
        </p>
      )}
    </>
  );
};

/** "(!)" hint of the Requisiciones module, fed from the single help catalog. */
const ReqHelp: React.FC<Props> = ({ id, placement, className = 'ms-1' }) => (
  <HelpHint title={getHelp(id).title} placement={placement} className={className}>
    <HelpContent id={id} />
  </HelpHint>
);

export default ReqHelp;
