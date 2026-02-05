import React from 'react';
import { Alert } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorAlertProps {
  title?: string;
  message: string;
  variant?: 'danger' | 'warning';
  dismissible?: boolean;
  onClose?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  title = 'Error',
  message, 
  variant = 'danger',
  dismissible = false,
  onClose
}) => {
  return (
    <Alert variant={variant} dismissible={dismissible} onClose={onClose}>
      <Alert.Heading className="h6">
        <FaExclamationTriangle className="me-2" />
        {title}
      </Alert.Heading>
      {message}
    </Alert>
  );
};

export default ErrorAlert;