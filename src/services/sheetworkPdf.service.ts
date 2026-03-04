import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SheetWork } from '@/types/reporte.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─────────────────────────────────────────────
// PALETA DE COLORES
// ─────────────────────────────────────────────
const COLORS = {
  primary:    [0,   86,  179] as [number, number, number],
  primaryDark:[0,   60,  130] as [number, number, number],
  accent:     [0,  168,  232] as [number, number, number],
  success:    [34,  139,  34] as [number, number, number],
  warning:    [230, 160,   0] as [number, number, number],
  dark:       [33,   37,  41] as [number, number, number],
  gray:       [108, 117, 125] as [number, number, number],
  lightGray:  [245, 246, 248] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  border:     [220, 220, 225] as [number, number, number],
};

interface TenantData {
  name: string;
  nit: string;
  logoUrl?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
}

// ─────────────────────────────────────────────
// CARGA DE IMAGEN — 3 estrategias (lógica original que funcionaba)
// La Strategy 3 (allorigins proxy) es la que resuelve el CORS de Firebase.
// ─────────────────────────────────────────────
const getImageBase64 = async (url: string): Promise<string> => {
  // Estrategia 1: Fetch directo
  try {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror  = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (_) {
    console.log('Estrategia 1 falló, intentando siguiente...');
  }

  // Estrategia 2: Canvas sin crossOrigin
  // Puede fallar con SecurityError en algunos navegadores → cae a Strategy 3
  try {
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('No canvas context')); return; }
          ctx.drawImage(img, 0, 0);
          // Ambos intentos de toDataURL pueden lanzar SecurityError
          let base64: string;
          try        { base64 = canvas.toDataURL('image/jpeg', 0.95); }
          catch      { base64 = canvas.toDataURL('image/png'); }
          resolve(base64);
        } catch (e) {
          reject(e); // SecurityError → lo captura el try/catch externo
        }
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = url;
    });
  } catch (_) {
    console.log('Estrategia 2 falló (posible CORS/SecurityError), intentando proxy...');
  }

  // Estrategia 3: Proxy CORS público — resuelve Firebase Storage sin configuración extra
  try {
    const proxyUrl  = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response  = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror  = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (_) {
    console.log('Estrategia 3 falló.');
  }

  throw new Error('No se pudo cargar la imagen con ninguna estrategia');
};

// ─────────────────────────────────────────────
// HELPERS DE DISEÑO
// ─────────────────────────────────────────────
const roundedRect = (
  doc: jsPDF,
  x: number, y: number,
  w: number, h: number,
  r: number,
  style: 'F' | 'S' | 'FD' = 'F'
) => doc.roundedRect(x, y, w, h, r, r, style);

const drawSectionHeader = (
  doc: jsPDF,
  text: string,
  x: number, y: number,
  width: number
): number => {
  doc.setFillColor(...COLORS.accent);
  doc.rect(x, y - 1, 3, 8, 'F');
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(x + 3, y - 1, width - 3, 8, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(x, y + 7, width, 0.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(text, x + 7, y + 5);
  doc.setTextColor(0, 0, 0);
  return y + 11;
};

// ─────────────────────────────────────────────
// SERVICIO
// ─────────────────────────────────────────────
export const sheetworkPdfService = {

  generatePDF: async (sheetwork: SheetWork, tenantData?: TenantData) => {
    const doc        = new jsPDF('p', 'mm', 'a4');
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginL    = 15;
    const marginR    = 15;
    const contentW   = pageWidth - marginL - marginR;

    // Cargar logo como base64 (3 estrategias, la 3 resuelve CORS de Firebase)
    let logoBase64: string | null = null;
    if (tenantData?.logoUrl) {
      try {
        logoBase64 = await getImageBase64(tenantData.logoUrl);
        console.log('✅ Logo cargado correctamente');
      } catch (e) {
        console.warn('⚠️ Logo no disponible, PDF se generará sin él.', e);
      }
    }

    // ──────────────────────────────────────────
    // CABECERA
    // ──────────────────────────────────────────
    const addHeader = (): number => {
      // Banda superior
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageWidth, 2, 'F');

      const yPos = 7;

      // Logo (base64 → addImage sin XHR interno)
      if (logoBase64) {
        try {
          const fmt = logoBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(logoBase64, fmt, marginL, yPos, 32, 16);
        } catch (e) {
          console.error('Error al insertar logo:', e);
        }
      }

      // Nombre / NIT / título (centro)
      const cx = pageWidth / 2;
      if (tenantData) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(...COLORS.primaryDark);
        doc.text(tenantData.name || '', cx, yPos + 6, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.gray);
        doc.text(`NIT: ${tenantData.nit || ''}`, cx, yPos + 11, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.primary);
        doc.text('HOJA DE TRABAJO', cx, yPos + 17, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...COLORS.primaryDark);
        doc.text('HOJA DE TRABAJO', cx, yPos + 10, { align: 'center' });
      }

      // Caja info (derecha)
      const boxW = 52;
      const boxX = pageWidth - marginR - boxW;
      const boxH = 22;

      doc.setFillColor(...COLORS.lightGray);
      doc.setDrawColor(...COLORS.border);
      roundedRect(doc, boxX, yPos, boxW, boxH, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(`N°: ${sheetwork.numeroHoja}`, boxX + boxW / 2, yPos + 5.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.dark);
      doc.text(
        `Fecha: ${format(new Date(sheetwork.createdAt), 'dd/MM/yyyy', { locale: es })}`,
        boxX + boxW / 2, yPos + 11, { align: 'center' }
      );

      const esFirmada = !!sheetwork.firmaFile;
      doc.setFillColor(...(esFirmada ? COLORS.success : COLORS.warning));
      roundedRect(doc, boxX + 4, yPos + 14, boxW - 8, 6, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      doc.text(esFirmada ? 'Firmada' : 'Pendiente', boxX + boxW / 2, yPos + 18.2, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      // Línea doble separadora
      const lineY = 31;
      doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.8);
      doc.line(marginL, lineY, pageWidth - marginR, lineY);
      doc.setDrawColor(...COLORS.accent);  doc.setLineWidth(0.3);
      doc.line(marginL, lineY + 1.2, pageWidth - marginR, lineY + 1.2);
      doc.setLineWidth(0.2); doc.setDrawColor(...COLORS.border);

      return lineY + 7;
    };

    // ──────────────────────────────────────────
    // PIE DE PÁGINA
    // ──────────────────────────────────────────
    const addFooter = (pageNumber: number, totalPages: number) => {
      const fy = pageHeight - 14;

      doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.3);
      doc.line(marginL, fy - 3, pageWidth - marginR, fy - 3);

      doc.setFillColor(...COLORS.primary);
      doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray);

      if (tenantData) {
        const addr = [tenantData.direccion, tenantData.ciudad, tenantData.departamento]
          .filter(Boolean).join(', ');
        if (addr) doc.text(addr, marginL, fy + 1);

        const contact = [
          tenantData.telefono && `Tel: ${tenantData.telefono}`,
          tenantData.email    && `Email: ${tenantData.email}`,
        ].filter(Boolean).join(' | ');
        if (contact) doc.text(contact as string, marginL, fy + 5.5);
      } else {
        doc.text(
          `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
          marginL, fy + 2
        );
      }

      doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primary);
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginR, fy + 3, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    };

    // ──────────────────────────────────────────
    // CONTENIDO
    // ──────────────────────────────────────────
    let currentY = addHeader();

    // ── INFORMACIÓN DEL CLIENTE ───────────────
    if (sheetwork.clienteId) {
      currentY = drawSectionHeader(doc, 'INFORMACIÓN DEL CLIENTE', marginL, currentY, contentW);
      currentY += 2;

      const c      = sheetwork.clienteId as any;
      const colW   = contentW / 3;
      const pad    = 3;
      const lh     = 6;
      const hasEmail = !!c.Email;
      const cardH  = hasEmail ? 36 : 28;

      doc.setFillColor(...COLORS.white); doc.setDrawColor(...COLORS.border);
      roundedRect(doc, marginL, currentY, contentW, cardH, 2, 'FD');

      // Fila 1
      const r1y = currentY + 5;
      [
        { label: 'Razón Social', value: c.Razonsocial || 'N/A' },
        { label: 'NIT',          value: c.Nit         || 'N/A' },
        { label: 'Ciudad',       value: c.Ciudad       || 'N/A' },
      ].forEach(({ label, value }, i) => {
        const x = marginL + i * colW + pad;
        doc.setFont('helvetica', 'bold');   doc.setFontSize(7); doc.setTextColor(...COLORS.gray);
        doc.text(label.toUpperCase(), x, r1y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...COLORS.dark);
        doc.text(String(value), x, r1y + lh - 1);
      });

      // Divisor
      const r2y = r1y + lh + 4;
      doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.2);
      doc.line(marginL + 2, r2y - 2, marginL + contentW - 2, r2y - 2);

      // Fila 2
      [
        { label: 'Dirección',    value: c.Direccion    || 'N/A' },
        { label: 'Departamento', value: c.Departamento || 'N/A' },
        { label: 'Teléfono',     value: c.TelContacto  || 'N/A' },
      ].forEach(({ label, value }, i) => {
        const x = marginL + i * colW + pad;
        doc.setFont('helvetica', 'bold');   doc.setFontSize(7); doc.setTextColor(...COLORS.gray);
        doc.text(label.toUpperCase(), x, r2y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...COLORS.dark);
        doc.text(String(value), x, r2y + lh - 1);
      });

      // Fila 3: Email
      if (hasEmail) {
        const r3y = r2y + lh + 4;
        doc.setDrawColor(...COLORS.border);
        doc.line(marginL + 2, r3y - 2, marginL + contentW - 2, r3y - 2);
        doc.setFont('helvetica', 'bold');   doc.setFontSize(7); doc.setTextColor(...COLORS.gray);
        doc.text('EMAIL', marginL + pad, r3y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...COLORS.dark);
        doc.text(String(c.Email), marginL + pad, r3y + lh - 1);
      }

      doc.setTextColor(0, 0, 0);
      currentY += cardH + 7;
    }

    // ── EQUIPOS PROCESADOS ────────────────────
    if (currentY > pageHeight - 80) { doc.addPage(); currentY = addHeader(); }

    currentY = drawSectionHeader(
      doc, `EQUIPOS PROCESADOS (${sheetwork.reports?.length || 0})`,
      marginL, currentY, contentW
    );
    currentY += 2;

    if (sheetwork.reports && sheetwork.reports.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Equipo', 'Marca', 'Modelo', 'Serie', 'Sede', 'Servicio']],
        body: sheetwork.reports.map((r, i) => [
          (i + 1).toString(),
          r.equipoSnapshot?.ItemText || 'N/A',
          r.equipoSnapshot?.Marca    || 'N/A',
          r.equipoSnapshot?.Modelo   || 'N/A',
          r.equipoSnapshot?.Serie    || 'N/A',
          r.equipoSnapshot?.Sede     || 'N/A',
          r.equipoSnapshot?.Servicio || 'N/A',
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.primary, textColor: COLORS.white,
          fontSize: 8.5, fontStyle: 'bold', halign: 'center', cellPadding: 3,
        },
        alternateRowStyles: { fillColor: COLORS.lightGray },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
        columnStyles: {
          0: { cellWidth: 8,  halign: 'center' },
          1: { cellWidth: 42 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => { if (data.pageNumber > 1) addHeader(); },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFillColor(...COLORS.lightGray);
      roundedRect(doc, marginL, currentY, contentW, 12, 2, 'F');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...COLORS.gray);
      doc.text('Sin equipos registrados', pageWidth / 2, currentY + 7.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      currentY += 18;
    }

    // ── OBSERVACIONES ─────────────────────────
    if (sheetwork.observaciones) {
      if (currentY > pageHeight - 55) { doc.addPage(); currentY = addHeader(); }

      currentY = drawSectionHeader(doc, 'OBSERVACIONES', marginL, currentY, contentW);
      currentY += 2;

      const lines = doc.splitTextToSize(sheetwork.observaciones, contentW - 8);
      const obsH  = lines.length * 5 + 8;

      doc.setFillColor(...COLORS.white); doc.setDrawColor(...COLORS.border);
      roundedRect(doc, marginL, currentY, contentW, obsH, 2, 'FD');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...COLORS.dark);
      doc.text(lines, marginL + 4, currentY + 6);
      doc.setTextColor(0, 0, 0);
      currentY += obsH + 8;
    }

    // ── FIRMAS ────────────────────────────────
    if (sheetwork.firmaFile || sheetwork.firmaResponsableFile) {
      if (currentY > pageHeight - 70) { doc.addPage(); currentY = addHeader(); }

      currentY = drawSectionHeader(doc, 'FIRMAS', marginL, currentY, contentW);
      currentY += 4;

      const fw = 80, fh = 42, gap = 12;

      [
        {
          data:   sheetwork.firmaResponsableFile,
          nombre: sheetwork.fullNameResponsable || sheetwork.fullName || 'N/A',
          cargo:  sheetwork.cargoResponsable    || 'Responsable',
        },
        {
          data:   sheetwork.firmaFile,
          nombre: sheetwork.personaRecibe       || 'N/A',
          cargo:  sheetwork.cargoRecibe         || 'Recibe',
        },
      ]
        .filter((f) => !!f.data)
        .forEach((firma, i) => {
          const x = marginL + i * (fw + gap);

          doc.setFillColor(...COLORS.white); doc.setDrawColor(...COLORS.border);
          roundedRect(doc, x, currentY, fw, fh, 3, 'FD');

          doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.4);
          doc.line(x + 6, currentY + fh - 14, x + fw - 6, currentY + fh - 14);

          if (firma.data) {
            try {
              doc.addImage(firma.data, 'PNG', x + 8, currentY + 3, fw - 16, fh - 22);
            } catch (e) {
              console.error('Error al insertar firma:', e);
            }
          }

          doc.setFont('helvetica', 'bold');   doc.setFontSize(8.5); doc.setTextColor(...COLORS.dark);
          doc.text(String(firma.nombre), x + fw / 2, currentY + fh - 9, { align: 'center' });
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...COLORS.gray);
          doc.text(String(firma.cargo),  x + fw / 2, currentY + fh - 4, { align: 'center' });
        });

      doc.setTextColor(0, 0, 0);
      currentY += fh + 10;
    }

    // ── PIE EN TODAS LAS PÁGINAS ──────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    return doc;
  },

  downloadPDF: async (sheetwork: SheetWork, tenantData?: TenantData) => {
    const doc = await sheetworkPdfService.generatePDF(sheetwork, tenantData);
    doc.save(`HojaTrabajo_${sheetwork.numeroHoja}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  },

  openPDF: async (sheetwork: SheetWork, tenantData?: TenantData) => {
    const doc = await sheetworkPdfService.generatePDF(sheetwork, tenantData);
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  },
};

export default sheetworkPdfService;
