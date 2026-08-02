import React from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCopy } from 'react-icons/fa';
import { clientAccessTokenService } from '@/services/clientAccessToken.service';

interface CopyLinkButtonProps {
  token: string;
  className?: string;
}

/**
 * Copies `{origin}/portal/{token}` to the clipboard and shows a confirmation
 * toast, per "Admin copies the public link" scenario.
 */
const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({ token, className }) => {
  const handleCopy = async (): Promise<void> => {
    const url = clientAccessTokenService.buildPublicUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('No fue posible copiar el link.');
    }
  };

  return (
    <Button
      size="sm"
      variant="outline-secondary"
      className={className}
      onClick={handleCopy}
      title="Copiar link público"
      aria-label="Copiar link público"
    >
      <FaCopy />
    </Button>
  );
};

export default CopyLinkButton;
