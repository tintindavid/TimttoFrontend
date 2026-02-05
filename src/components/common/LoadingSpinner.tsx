import React from 'react';
import { Spinner } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: 'sm' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size, message }) => (
  <div className="d-flex flex-column justify-content-center align-items-center my-3">
    <Spinner animation="border" variant="primary" size={size === 'sm' ? 'sm' : undefined} />
    {message && <div className="mt-2 text-muted">{message}</div>}
  </div>
);

export default LoadingSpinner;
