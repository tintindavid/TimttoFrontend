/** Saves a blob (e.g. a generated PDF) as a file through a temporary link, then frees the object URL. */
export function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

/** Blob.text() with a FileReader fallback for environments that lack it (older browsers, jsdom). */
function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/**
 * A failed `responseType: 'blob'` request carries the JSON error envelope as a Blob. Decodes it in place so
 * `response.data.error.code` is readable by the usual error helpers, then rethrows the same error.
 */
export async function rethrowDecodingBlobError(err: unknown): Promise<never> {
  const response = (err as { response?: { data?: unknown } })?.response;
  if (response?.data instanceof Blob) {
    try {
      response.data = JSON.parse(await readBlobText(response.data));
    } catch {
      response.data = undefined;
    }
  }
  throw err;
}
