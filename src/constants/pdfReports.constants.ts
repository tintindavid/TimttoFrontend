export const PDF_FILENAME_TOKENS = ['consecutivo', 'serial', 'inventario', 'item', 'fecha'] as const;

export type PdfFilenameToken = (typeof PDF_FILENAME_TOKENS)[number];

export const PDF_FILENAME_DEFAULT_TOKENS: PdfFilenameToken[] = ['consecutivo', 'fecha', 'item'];

/** Human labels rendered on chips. */
export const PDF_FILENAME_TOKEN_LABELS: Record<PdfFilenameToken, string> = {
  consecutivo: 'Consecutivo',
  serial: 'Serial',
  inventario: 'Inventario',
  item: 'Item',
  fecha: 'Fecha',
};
