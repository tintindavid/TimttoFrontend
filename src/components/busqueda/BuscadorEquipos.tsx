import React, { useEffect, useState } from 'react';
import { Badge, Button, Form, Spinner } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useDebounce } from '@/hooks/useDebounce';
import { MAX_CARACTERES_BUSQUEDA, esTerminoValido, useBuscarEquipos } from '@/hooks/useBusquedaEquipos';
import type { EquipoEncontrado } from '@/types/busquedaEquipo.types';
import { getEstadoOperativoBadgeStyle } from '@/utils/estadoOperativoBadge.util';

export const DEBOUNCE_BUSQUEDA_MS = 300;

const ID_LISTA = 'buscador-equipos-resultados';
const idOpcion = (indice: number) => `${ID_LISTA}-${indice}`;
const AYUDA = 'Escribe al menos 2 caracteres: serie, inventario, modelo, marca o registro INVIMA.';

interface BuscadorEquiposProps {
  /** `desplegable`: results float under the input (navbar). `completo`: results fill the full-screen modal. */
  variante: 'desplegable' | 'completo';
  onSeleccionar: (equipoId: string) => void;
  onCerrar?: () => void;
}

const Resultado: React.FC<{ equipo: EquipoEncontrado }> = ({ equipo }) => {
  const { campo, valor } = equipo.coincidencia;
  const datos = [
    { clave: 'marca', texto: equipo.marca },
    { clave: 'modelo', texto: equipo.modelo },
    { clave: 'serie', texto: equipo.serie && `Serie ${equipo.serie}` },
    { clave: 'inventario', texto: equipo.inventario && `Inv. ${equipo.inventario}` },
    // The INVIMA record is only shown when it is the reason the equipment is listed.
    { clave: 'invima', texto: campo === 'invima' ? `INVIMA ${valor}` : '' },
  ].filter((d) => !!d.texto);
  const lugar = [equipo.cliente?.nombre, equipo.sede, equipo.servicio].filter(Boolean).join(' · ');

  return (
    <>
      <span className="d-flex justify-content-between align-items-start gap-2">
        <span className="fw-semibold text-truncate">{equipo.nombre || 'Equipo sin nombre'}</span>
        {equipo.estadoOperativo && (
          <Badge bg="" className="flex-shrink-0" style={getEstadoOperativoBadgeStyle(equipo.estadoOperativo)}>
            {equipo.estadoOperativo}
          </Badge>
        )}
      </span>
      <span className="d-block small text-break">
        {datos.map((d, i) => (
          <React.Fragment key={d.clave}>
            {i > 0 && ' · '}
            {d.clave === campo ? <mark className="px-0">{d.texto}</mark> : d.texto}
          </React.Fragment>
        ))}
      </span>
      {lugar && <span className="d-block small text-muted text-truncate">{lugar}</span>}
    </>
  );
};

/** Search box with its result list: arrows move, Enter opens, Escape closes. Shared by desktop and mobile. */
const BuscadorEquipos: React.FC<BuscadorEquiposProps> = ({ variante, onSeleccionar, onCerrar }) => {
  const esCompleto = variante === 'completo';
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  const termino = texto.trim();
  const terminoDiferido = useDebounce(termino, DEBOUNCE_BUSQUEDA_MS);
  const { data, isFetching, isError, refetch } = useBuscarEquipos(terminoDiferido);

  const valido = esTerminoValido(termino);
  // Results of a previous term are never shown (nor selectable) while the new one is still pending.
  const alDia = valido && termino === terminoDiferido;
  const resultados = alDia && !isError ? data ?? [] : [];
  const buscando = valido && (!alDia || (isFetching && (!data || isError)));
  const mostrarPanel = esCompleto || (abierto && termino.length > 0);

  useEffect(() => setActivo(0), [terminoDiferido]);

  useEffect(() => {
    if (mostrarPanel) document.getElementById(idOpcion(activo))?.scrollIntoView?.({ block: 'nearest' });
  }, [activo, mostrarPanel]);

  const seleccionar = (equipo: EquipoEncontrado) => {
    setTexto('');
    setAbierto(false);
    onSeleccionar(equipo._id);
  };

  const alPresionar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setAbierto(true);
      if (resultados.length === 0) return;
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      setActivo((i) => (i + paso + resultados.length) % resultados.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (mostrarPanel && resultados[activo]) seleccionar(resultados[activo]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (esCompleto) onCerrar?.();
      else if (abierto && termino) setAbierto(false);
      else setTexto('');
    }
  };

  const renderEstado = () => {
    if (!valido) return <p className="buscador-estado text-muted">{AYUDA}</p>;
    if (buscando) {
      return (
        <p className="buscador-estado text-muted" role="status">
          <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
          Buscando...
        </p>
      );
    }
    if (isError) {
      return (
        <div className="buscador-estado" role="alert">
          <span className="text-danger">No se pudo completar la búsqueda.</span>
          <Button variant="link" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      );
    }
    if (resultados.length === 0) {
      return (
        <p className="buscador-estado text-muted" role="status">
          No se encontraron equipos para “{termino}”.
        </p>
      );
    }
    return null;
  };

  return (
    <div
      className={`buscador buscador-${variante}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <div className="buscador-campo">
        <FaSearch className="buscador-lupa" aria-hidden="true" />
        <Form.Control
          type="search"
          role="combobox"
          aria-label="Buscar equipo"
          aria-autocomplete="list"
          aria-expanded={mostrarPanel && resultados.length > 0}
          aria-controls={ID_LISTA}
          aria-activedescendant={mostrarPanel && resultados[activo] ? idOpcion(activo) : undefined}
          placeholder="Buscar equipo por serie, inventario, modelo..."
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={MAX_CARACTERES_BUSQUEDA}
          autoFocus={esCompleto}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alPresionar}
        />
      </div>
      {mostrarPanel && (
        // preventDefault keeps the focus in the input, so a click inside the panel does not close it first.
        <div className="buscador-panel" onMouseDown={(e) => e.preventDefault()}>
          {renderEstado()}
          <ul id={ID_LISTA} role="listbox" aria-label="Equipos encontrados" className="list-unstyled mb-0">
            {resultados.map((equipo, i) => (
              <li
                key={equipo._id}
                id={idOpcion(i)}
                role="option"
                aria-selected={i === activo}
                className={`buscador-opcion ${i === activo ? 'activa' : ''}`.trim()}
                onMouseMove={() => setActivo(i)}
                onClick={() => seleccionar(equipo)}
              >
                <Resultado equipo={equipo} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BuscadorEquipos;
