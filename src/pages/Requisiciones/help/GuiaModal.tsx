import React from 'react';
import { Button, ListGroup, Modal } from 'react-bootstrap';
import { HelpContent } from './ReqHelp';
import { GUIA_CONCEPTOS, GUIA_PASOS, getHelp, type HelpId } from './requisicionHelp';

interface Props {
  show: boolean;
  onHide: () => void;
}

const Section: React.FC<{ id: HelpId }> = ({ id }) => (
  <ListGroup.Item>
    <h3 className="h6 mb-1">{getHelp(id).title}</h3>
    <HelpContent id={id} />
  </ListGroup.Item>
);

/** End-to-end explanation of the module, built from the same help catalog as the "(!)" hints. */
const GuiaModal: React.FC<Props> = ({ show, onHide }) => (
  <Modal show={show} onHide={onHide} centered size="lg" scrollable aria-labelledby="guia-modulo-title">
    <Modal.Header closeButton>
      <Modal.Title id="guia-modulo-title">Guía del módulo de requisiciones</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>
        Una requisición es una solicitud interna de compra que pasa por niveles de aprobación según su monto. Este es el recorrido completo:
      </p>
      <ListGroup variant="flush" className="mb-3">
        {GUIA_PASOS.map((id) => (
          <Section key={id} id={id} />
        ))}
      </ListGroup>
      <h2 className="h6 text-uppercase text-muted">Conceptos clave</h2>
      <ListGroup variant="flush">
        {GUIA_CONCEPTOS.map((id) => (
          <Section key={id} id={id} />
        ))}
      </ListGroup>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-secondary" onClick={onHide}>
        Cerrar
      </Button>
    </Modal.Footer>
  </Modal>
);

export default GuiaModal;
