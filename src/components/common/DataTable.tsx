import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T>({ data, columns, actions }: Props<T>) {
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
          {actions && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any) => (
          <tr key={row._id || row.id}>
            {columns.map((c) => (
              <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
            ))}
            {actions && <td>{actions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
