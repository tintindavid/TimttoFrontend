import React from 'react';
import { Pagination } from 'react-bootstrap';

interface Props {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}

const AppPagination: React.FC<Props> = ({ page, pages, onChange }) => {
  if (!pages || pages <= 1) return null;

  const items = [];
  for (let i = 1; i <= pages; i++) {
    items.push(
      <Pagination.Item key={i} active={i === page} onClick={() => onChange(i)}>{i}</Pagination.Item>
    );
  }

  return (
    <Pagination>{items}</Pagination>
  );
};

export default AppPagination;
