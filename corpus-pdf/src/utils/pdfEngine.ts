import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
} from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ---------------------------------------------------------------------------
// Types for the Acrobat-Class PDF Editor
// ---------------------------------------------------------------------------

export type ToolMode =
  | 'select'
  | 'text'
  | 'highlight'
  | 'redact'
  | 'whiteout'
  | 'draw'
  | 'signature'
  | 'stamp'
  | 'image';

export interface Point {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

export interface PdfAnnotation {
  id: string;
  pageId: string; // matches PageConfig.id
  type: 'text' | 'highlight' | 'redact' | 'whiteout' | 'draw' | 'signature' | 'stamp' | 'image';
  // Normalized coordinates (0..1 from top-left of currently rendered page)
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  color: string; // hex e.g. #8b5cf6
  opacity?: number;
  points?: Point[]; // for freehand draw
  strokeWidth?: number;
  imageDataUrl?: string; // for signature / uploaded image
  stampType?: 'ONAYLANDI' | 'GİZLİ' | 'TASLAK' | 'ACİL' | 'İMZALANDI';
}

export interface PageConfig {
  id: string;
  sourcePageIndex: number | null; // null if blank inserted page
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
  thumbnailDataUrl?: string;
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  opacity: number;
  color: string;
  size: number;
}

export interface PdfMetadataSettings {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Convert Text/Stamp/Draw with Turkish characters into a crisp high-DPI transparent PNG
// so pdf-lib never fails on non-WinAnsi characters (ğ, ş, İ, ı, etc.)
async function renderAnnotationOverlayToPng(
  pageWidth: number,
  pageHeight: number,
  annotations: PdfAnnotation[],
  watermark?: WatermarkSettings
): Promise<string | null> {
  if (annotations.length === 0 && (!watermark || !watermark.enabled || !watermark.text.trim())) {
    return null;
  }

  const scale = 2; // 2x Retina sharpness
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(pageWidth * scale);
  canvas.height = Math.round(pageHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);

  // 1. Draw Annotations
  for (const ann of annotations) {
    ctx.save();
    const px = ann.x * pageWidth;
    const py = ann.y * pageHeight;
    const pw = ann.width * pageWidth;
    const ph = ann.height * pageHeight;

    if (ann.type === 'highlight') {
      ctx.globalAlpha = ann.opacity ?? 0.38;
      ctx.fillStyle = ann.color || '#facc15';
      ctx.fillRect(px, py, pw, ph);
    } else if (ann.type === 'redact') {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(px, py, pw, ph);
    } else if (ann.type === 'whiteout') {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, pw, ph);
    } else if (ann.type === 'text' && ann.text) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = ann.color || '#111827';
      const fontSize = ann.fontSize || 16;
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = 'top';
      const lines = ann.text.split('\n');
      lines.forEach((line, idx) => {
        ctx.fillText(line, px, py + idx * (fontSize * 1.25));
      });
    } else if (ann.type === 'stamp') {
      ctx.globalAlpha = 0.92;
      const borderCol = ann.color || '#10b981';
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = `${borderCol}18`;
      const rx = px;
      const ry = py;
      const rw = Math.max(pw, 130);
      const rh = Math.max(ph, 42);
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = borderCol;
      ctx.font = `700 15px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ann.text || ann.stampType || 'ONAYLANDI', rx + rw / 2, ry + rh / 2);
    } else if (ann.type === 'draw' && ann.points && ann.points.length > 1) {
      ctx.globalAlpha = ann.opacity ?? 0.95;
      ctx.strokeStyle = ann.color || '#8b5cf6';
      ctx.lineWidth = ann.strokeWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ann.points.forEach((pt, idx) => {
        const dx = pt.x * pageWidth;
        const dy = pt.y * pageHeight;
        if (idx === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      });
      ctx.stroke();
    } else if ((ann.type === 'signature' || ann.type === 'image') && ann.imageDataUrl) {
      const img = await loadImage(ann.imageDataUrl);
      ctx.drawImage(img, px, py, pw, ph);
    }

    ctx.restore();
  }

  // 2. Draw Watermark if enabled
  if (watermark && watermark.enabled && watermark.text.trim()) {
    ctx.save();
    ctx.translate(pageWidth / 2, pageHeight / 2);
    ctx.rotate((-35 * Math.PI) / 180);
    ctx.globalAlpha = watermark.opacity ?? 0.18;
    ctx.fillStyle = watermark.color || '#8b5cf6';
    const wmSize = watermark.size || 48;
    ctx.font = `700 ${wmSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermark.text, 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Load PDF Document & Render Pages via PDF.js
// ---------------------------------------------------------------------------

export async function loadPdfDocumentPages(pdfBytes: Uint8Array): Promise<{
  pages: PageConfig[];
  metadata: PdfMetadataSettings;
}> {
  const copy = new Uint8Array(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({ data: copy });
  const pdf = await loadingTask.promise;

  const pages: PageConfig[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const thumbViewport = page.getViewport({ scale: 0.35 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(thumbViewport.width);
    canvas.height = Math.round(thumbViewport.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport: thumbViewport, canvas }).promise;
    }

    pages.push({
      id: `page-${i}-${ Math.random().toString(36).slice(2, 7) }`,
      sourcePageIndex: i - 1,
      rotation: 0,
      width: viewport.width,
      height: viewport.height,
      thumbnailDataUrl: canvas.toDataURL('image/jpeg', 0.8),
    });
  }

  let metadata: PdfMetadataSettings = {
    title: '',
    author: '',
    subject: '',
    keywords: '',
  };

  try {
    const pdfLibDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    metadata = {
      title: pdfLibDoc.getTitle() || '',
      author: pdfLibDoc.getAuthor() || '',
      subject: pdfLibDoc.getSubject() || '',
      keywords: pdfLibDoc.getKeywords() || '',
    };
  } catch {
    // ignore metadata extraction errors
  }

  return { pages, metadata };
}

export async function renderSinglePageToCanvas(
  pdfBytes: Uint8Array,
  pageConfig: PageConfig,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<{ width: number; height: number }> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: 595, height: 842 };

  if (pageConfig.sourcePageIndex === null) {
    // Blank inserted page
    const isRotated = pageConfig.rotation % 180 !== 0;
    const w = (isRotated ? pageConfig.height : pageConfig.width) * scale;
    const h = (isRotated ? pageConfig.width : pageConfig.height) * scale;
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height };
  }

  const copy = new Uint8Array(pdfBytes);
  const loadingTask = pdfjsLib.getDocument({ data: copy });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageConfig.sourcePageIndex + 1);
  const totalRotation = (page.rotate + pageConfig.rotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return { width: viewport.width, height: viewport.height };
}

// ---------------------------------------------------------------------------
// Export Edited PDF (with Annotations, Signatures, Rotations, Reordering)
// ---------------------------------------------------------------------------

export async function exportEditedPdf(
  sourcePdfBytes: Uint8Array,
  pages: PageConfig[],
  annotations: PdfAnnotation[],
  watermark: WatermarkSettings,
  metadata: PdfMetadataSettings
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  if (metadata.title) outDoc.setTitle(metadata.title);
  if (metadata.author) outDoc.setAuthor(metadata.author);
  if (metadata.subject) outDoc.setSubject(metadata.subject);
  if (metadata.keywords) {
    outDoc.setKeywords(
      metadata.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    );
  }
  outDoc.setProducer('Corpus PDF Pro Studio (#002)');
  outDoc.setCreator('Corpus Platform');

  for (const pageCfg of pages) {
    let pdfPage;
    if (pageCfg.sourcePageIndex !== null) {
      const [copiedPage] = await outDoc.copyPages(srcDoc, [pageCfg.sourcePageIndex]);
      pdfPage = outDoc.addPage(copiedPage);
    } else {
      pdfPage = outDoc.addPage([pageCfg.width, pageCfg.height]);
    }

    const existingRotation = pdfPage.getRotation().angle;
    const finalRotation = (existingRotation + pageCfg.rotation) % 360;
    pdfPage.setRotation(degrees(finalRotation));

    const { width, height } = pdfPage.getSize();
    const isRotated90 = finalRotation % 180 !== 0;
    const visualWidth = isRotated90 ? height : width;
    const visualHeight = isRotated90 ? width : height;

    const pageAnnotations = annotations.filter((a) => a.pageId === pageCfg.id);
    const overlayDataUrl = await renderAnnotationOverlayToPng(
      visualWidth,
      visualHeight,
      pageAnnotations,
      watermark
    );

    if (overlayDataUrl) {
      const pngImage = await outDoc.embedPng(overlayDataUrl);
      pdfPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pdfPage.getWidth(),
        height: pdfPage.getHeight(),
      });
    }
  }

  return await outDoc.save();
}

// ---------------------------------------------------------------------------
// Generate Sample Interactive Demo PDF
// ---------------------------------------------------------------------------

export async function createSampleWelcomePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  doc.setTitle('Corpus PDF Studio - Demo Sozlesme ve Rapor.pdf');
  doc.setAuthor('Corpus Platform #002');
  doc.setSubject('Acrobat-Class Interactive PDF Editor Demo');

  // Page 1: Executive Document
  const page1 = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: rgb(0.06, 0.06, 0.08),
  });

  page1.drawRectangle({
    x: 45,
    y: height - 78,
    width: 38,
    height: 38,
    color: rgb(0.545, 0.36, 0.965),
  });

  page1.drawText('CORPUS PDF STUDIO PRO', {
    x: 98,
    y: height - 56,
    size: 20,
    font: fontBold,
    color: rgb(0.98, 0.98, 0.99),
  });

  page1.drawText('SITE #002 • ZERO-STORAGE ACROBAT EDITOR & OFFICE SUITE', {
    x: 98,
    y: height - 74,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.65, 0.65, 0.72),
  });

  // Document Body
  page1.drawText('1. EXECUTIVE SUMMARY & SERVICE AGREEMENT', {
    x: 45,
    y: height - 155,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.14),
  });

  const paragraphs = [
    'Welcome to Corpus PDF Studio (#002). This sample multi-page PDF document was generated',
    '100% locally inside your browser memory so you can immediately test all professional',
    'Acrobat-grade editing capabilities without uploading any sensitive files to a server.',
    '',
    'Try out the interactive tools in the top toolbar:',
    '  • Text Tool (Metin Ekle): Click anywhere on the page to insert custom headings or notes.',
    '  • Highlight & Redact (Vurgula / Karart / Beyazlat): Mask confidential numbers or highlight text.',
    '  • Signature Pad (Imza Ekle): Draw or type your official signature and place it in the box below.',
    '  • Official Stamps (Damga & Filigran): Stamp APPROVED / CONFIDENTIAL or add a page watermark.',
    '  • Page Organizer: Rotate, duplicate, insert blank pages, reorder, or delete pages in the sidebar.',
  ];

  paragraphs.forEach((line, index) => {
    page1.drawText(line, {
      x: 45,
      y: height - 185 - index * 20,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.22, 0.22, 0.26),
    });
  });

  // Financial Table Mockup
  const tableTop = height - 425;
  page1.drawText('2. QUARTERLY INFRASTRUCTURE & LICENSE BREAKDOWN', {
    x: 45,
    y: tableTop + 20,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.14),
  });

  page1.drawRectangle({
    x: 45,
    y: tableTop - 25,
    width: width - 90,
    height: 28,
    color: rgb(0.93, 0.92, 0.98),
  });

  page1.drawText('MODULE / FEATURE', { x: 58, y: tableTop - 15, size: 9.5, font: fontBold, color: rgb(0.2, 0.15, 0.4) });
  page1.drawText('ARCHITECTURE', { x: 265, y: tableTop - 15, size: 9.5, font: fontBold, color: rgb(0.2, 0.15, 0.4) });
  page1.drawText('COST', { x: 465, y: tableTop - 15, size: 9.5, font: fontBold, color: rgb(0.2, 0.15, 0.4) });

  const rows = [
    ['Acrobat-Class Canvas Editor', 'Local WebAssembly / PDF-Lib', 'FREE ($0.00)'],
    ['Word (.doc / .docx) to PDF', 'Mammoth AST + HiDPI Paginator', 'FREE ($0.00)'],
    ['PowerPoint (.ppt / .pptx) to PDF', 'JSZip XML Slide Renderer', 'FREE ($0.00)'],
    ['Excel (.xlsx / .csv) to PDF', 'SheetJS Grid Engine', 'FREE ($0.00)'],
    ['Batch Images (JPG/PNG/WebP) to PDF', 'Zero-Upload Native Stream', 'FREE ($0.00)'],
  ];

  rows.forEach((r, idx) => {
    const ry = tableTop - 53 - idx * 28;
    page1.drawRectangle({
      x: 45,
      y: ry,
      width: width - 90,
      height: 28,
      color: idx % 2 === 0 ? rgb(0.985, 0.985, 0.99) : rgb(0.955, 0.955, 0.97),
    });
    page1.drawText(r[0], { x: 58, y: ry + 9, size: 9.5, font: fontRegular, color: rgb(0.15, 0.15, 0.2) });
    page1.drawText(r[1], { x: 265, y: ry + 9, size: 9.5, font: fontRegular, color: rgb(0.35, 0.35, 0.42) });
    page1.drawText(r[2], { x: 465, y: ry + 9, size: 9.5, font: fontBold, color: rgb(0.06, 0.58, 0.4) });
  });

  // Signature Box Area
  const sigY = 120;
  page1.drawRectangle({
    x: 45,
    y: sigY,
    width: 235,
    height: 95,
    borderColor: rgb(0.55, 0.36, 0.96),
    borderWidth: 1.2,
    color: rgb(0.99, 0.985, 1),
  });
  page1.drawText('AUTHORIZED SIGNATURE (CLICK IMZA EKLE)', {
    x: 58,
    y: sigY + 75,
    size: 8.5,
    font: fontBold,
    color: rgb(0.45, 0.28, 0.85),
  });
  page1.drawText('Place your digital signature or stamp here', {
    x: 58,
    y: sigY + 14,
    size: 8,
    font: fontRegular,
    color: rgb(0.55, 0.55, 0.62),
  });

  // Stamp Box Area
  page1.drawRectangle({
    x: 315,
    y: sigY,
    width: 235,
    height: 95,
    borderColor: rgb(0.75, 0.75, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99),
  });
  page1.drawText('OFFICIAL APPROVAL STAMP AREA', {
    x: 328,
    y: sigY + 75,
    size: 8.5,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.36),
  });
  page1.drawText('Date: 16 / 10 / 2026 • Ref: CORPUS-002', {
    x: 328,
    y: sigY + 14,
    size: 8,
    font: fontRegular,
    color: rgb(0.55, 0.55, 0.62),
  });

  // Page 2: Technical Appendix
  const page2 = doc.addPage([595.28, 841.89]);
  page2.drawText('APPENDIX A — SECURITY & REDACTION TEST PAGE', {
    x: 45,
    y: height - 70,
    size: 15,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });
  page2.drawText(
    'Use the Redact (Karart) or Whiteout (Silgi) tool to mask the confidential credentials below:',
    {
      x: 45,
      y: height - 100,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.35),
    }
  );

  page2.drawRectangle({
    x: 45,
    y: height - 210,
    width: width - 90,
    height: 90,
    color: rgb(0.96, 0.96, 0.98),
    borderColor: rgb(0.82, 0.82, 0.86),
    borderWidth: 1,
  });

  page2.drawText('CONFIDENTIAL API KEY:   crps_live_98f72a41b88c0192e441009a', {
    x: 65,
    y: height - 150,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.2),
  });
  page2.drawText('IBAN ACCOUNT NUMBER:    TR42 0006 1005 1978 6457 8413 26', {
    x: 65,
    y: height - 175,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.2),
  });
  page2.drawText('INTERNAL ACCESS PIN:    8492-0194-CORPUS', {
    x: 65,
    y: height - 200,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.2),
  });

  return await doc.save();
}
