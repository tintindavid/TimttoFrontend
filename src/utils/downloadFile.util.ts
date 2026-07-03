/**
 * downloadCsv — triggers a file download for a protected CSV endpoint.
 *
 * Uses native fetch so we can attach Authorization + x-tenant-id headers
 * (axios interceptors don't apply to Blob downloads).
 * Converts the response to a Blob, creates a temporary <a> link, clicks it,
 * then revokes the object URL to free memory.
 *
 * Throws on network errors so callers can show a toast.
 */
export async function downloadCsv(url: string, filename: string): Promise<void> {
  const token = localStorage.getItem('token');
  const viewAsTenantId = sessionStorage.getItem('viewAsTenantId');
  const ownTenantId = localStorage.getItem('tenantId');
  const effectiveTenantId = viewAsTenantId || ownTenantId || '';

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (effectiveTenantId) {
    headers['x-tenant-id'] = effectiveTenantId;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
