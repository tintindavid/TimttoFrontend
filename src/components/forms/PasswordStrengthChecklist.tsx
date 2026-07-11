import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Props {
  password: string;
}

const RULES = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Al menos una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Al menos un número', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Al menos un carácter especial (. * # _ / +)', test: (p: string) => /[.*#_/+]/.test(p) },
];

const PasswordStrengthChecklist: React.FC<Props> = ({ password }) => (
  <ul className="list-unstyled mb-0 mt-1" style={{ fontSize: '0.8rem' }}>
    {RULES.map(({ label, test }) => {
      const ok = password.length > 0 && test(password);
      return (
        <li key={label} className={ok ? 'text-success' : 'text-muted'}>
          {ok ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
          {label}
        </li>
      );
    })}
  </ul>
);

export default PasswordStrengthChecklist;
