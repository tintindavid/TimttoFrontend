import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useReasignarAprobadores } from '@/hooks/useRequisiciones';
import { useUsers } from '@/hooks/useUsers';
import type { NivelAprobacion, Requisicion } from '@/types/requisicion.types';
import type { User } from '@/types/user.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { refId, userRefName } from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';

interface UserOption {
  value: string;
  label: string;
}

interface Props {
  show: boolean;
  requisicion: Requisicion;
  /** Levels that can still be reassigned (Pendiente). */
  niveles: NivelAprobacion[];
  onHide: () => void;
}

const USERS_LIMIT = 50;

const userLabel = (u: User) => u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

/** Lets a `requisiciones:manage-all` user replace the approvers of a pending level. */
const ReasignarModal: React.FC<Props> = ({ show, requisicion, niveles, onHide }) => {
  const mutation = useReasignarAprobadores();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const { data: usersResponse } = useUsers({ page: 1, limit: USERS_LIMIT, ...(debouncedSearch ? { search: debouncedSearch } : {}) });
  const [nivelOrden, setNivelOrden] = useState<number>(niveles[0]?.orden ?? 1);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The parent may re-render with a new niveles identity (background refetch): keep the latest in a ref so the
  // selection is reset only when the modal opens, never because of a prop identity change.
  const nivelesRef = useRef(niveles);
  nivelesRef.current = niveles;

  const nivel = niveles.find((n) => n.orden === nivelOrden);
  const currentUserId = currentUser?._id;

  useEffect(() => {
    if (!show) return;
    setError(null);
    setSearch('');
    const first = nivelesRef.current[0];
    setNivelOrden(first?.orden ?? 1);
    setSelected((first?.aprobadorIds ?? []).map((a) => refId(a)).filter((id) => id !== currentUserId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const users = (usersResponse?.data ?? []) as User[];
  const total = usersResponse?.pagination?.total ?? users.length;

  // Labels of every user seen so far, so selected users stay visible when a new search replaces the results.
  const seenLabels = useRef(new Map<string, string>());

  const options: UserOption[] = useMemo(() => {
    const known = new Map<string, string>();
    users.forEach((u) => {
      if (u._id) {
        known.set(u._id, userLabel(u));
        seenLabels.current.set(u._id, userLabel(u));
      }
    });
    selected.forEach((id) => {
      if (!known.has(id) && seenLabels.current.has(id)) known.set(id, seenLabels.current.get(id) as string);
    });
    // Keep the labels of the already selected / current approvers even if they are outside the loaded page.
    (nivel?.aprobadorIds ?? []).forEach((a) => {
      const id = refId(a);
      if (id && !known.has(id)) known.set(id, userRefName(a));
    });
    // Separation of duties: the acting user cannot assign himself.
    if (currentUserId) known.delete(currentUserId);
    return Array.from(known.entries()).map(([value, label]) => ({ value, label }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersResponse, nivel, currentUserId, selected]);

  const changeNivel = (orden: number) => {
    setNivelOrden(orden);
    const n = niveles.find((x) => x.orden === orden);
    setSelected((n?.aprobadorIds ?? []).map((a) => refId(a)).filter((id) => id !== currentUserId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected.length === 0 || mutation.isLoading) return;
    setError(null);
    try {
      await mutation.mutateAsync({ id: requisicion._id, data: { nivelOrden, aprobadorIds: selected } });
      toast.success('Aprobadores reasignados.');
      onHide();
    } catch (err) {
      setError(getRequisicionErrorMessage(err, 'No fue posible reasignar los aprobadores.'));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            Reasignar aprobadores
            <ReqHelp id="accion.reasignar" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="reasignar-nivel">
            <Form.Label>Nivel *</Form.Label>
            <ReqHelp id="modal.nivel" />
            <Form.Select value={nivelOrden} onChange={(e) => changeNivel(Number(e.target.value))}>
              {niveles.map((n) => (
                <option key={n.orden} value={n.orden}>
                  Nivel {n.orden}
                  {n.nombre ? ` · ${n.nombre}` : ''}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="reasignar-usuarios">
            <Form.Label>Aprobadores *</Form.Label>
            <ReqHelp id="modal.aprobadores" />
            <Select<UserOption, true>
              inputId="reasignar-usuarios"
              isMulti
              classNamePrefix="react-select"
              placeholder="Seleccionar usuarios..."
              noOptionsMessage={() => 'Sin usuarios'}
              options={options}
              filterOption={null}
              onInputChange={(value, meta) => {
                if (meta.action === 'input-change') setSearch(value);
              }}
              value={options.filter((o) => selected.includes(o.value))}
              onChange={(values) => setSelected(values.map((v) => v.value))}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 1060 }) }}
            />
            {total > users.length && (
              <Form.Text className="text-muted d-block" data-testid="reasignar-users-limit">
                Mostrando {users.length} de {total} usuarios. Escribe para buscar por nombre o correo.
              </Form.Text>
            )}
            {selected.length === 0 && <Form.Text className="text-danger">Selecciona al menos un aprobador.</Form.Text>}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onHide} disabled={mutation.isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={selected.length === 0 || mutation.isLoading}>
            {mutation.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            Reasignar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReasignarModal;
