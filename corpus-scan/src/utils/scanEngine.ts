import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type ScanFilterMode = 'original' | 'magic' | 'bw' | 'bleach' | 'grayscale';

export type OcrLanguage = 'tur+eng' | 'tur' | 'eng' | 'deu' | 'fra' | 'spa' | 'ara' | 'rus';

export interface ScanEnhancementOptions {
  filter: ScanFilterMode;
  brightness: number; // -50 to +50
  contrast: number; // -50 to +50
  threshold: number; // 80 to 220 (used for B&W mode)
  rotation: number; // 0, 90, 180, 270
  deskewAngle: number; // -15 to +15 degrees
  cropMargin: number; // 0 to 15 percent border crop
}

export interface WordBox {
  text: string;
  confidence: number;
  x0: number; // normalized 0..1
  y0: number;
  x1: number;
  y1: number;
}

export interface ExtractedEntity {
  category: 'IBAN' | 'TUTAR' | 'TARİH' | 'E-POSTA' | 'TELEFON' | 'BELGE NO';
  value: string;
}

export interface ScannedPageItem {
  id: string;
  name: string;
  originalDataUrl: string;
  enhancedDataUrl: string;
  width: number;
  height: number;
  options: ScanEnhancementOptions;
  ocrText: string;
  ocrConfidence: number | null;
  wordBoxes: WordBox[];
  entities: ExtractedEntity[];
  isOcrDone: boolean;
}

export const DEFAULT_SCAN_OPTIONS: ScanEnhancementOptions = {
  filter: 'magic',
  brightness: 8,
  contrast: 22,
  threshold: 158,
  rotation: 0,
  deskewAngle: 0,
  cropMargin: 0,
};

// ---------------------------------------------------------------------------
// 1. CamScanner Pro Image Enhancement & Deskew Engine
// ---------------------------------------------------------------------------

export async function processScanImage(
  sourceDataUrl: string,
  options: ScanEnhancementOptions
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = sourceDataUrl;
  });

  const srcW = img.naturalWidth || 1000;
  const srcH = img.naturalHeight || 1400;

  // Apply crop margin first
  const cropRatio = Math.max(0, Math.min(0.2, options.cropMargin / 100));
  const cropX = srcW * cropRatio;
  const cropY = srcH * cropRatio;
  const croppedW = Math.max(100, srcW - cropX * 2);
  const croppedH = Math.max(100, srcH - cropY * 2);

  const isRotated90 = options.rotation % 180 !== 0;
  const outW = Math.round(isRotated90 ? croppedH : croppedW);
  const outH = Math.round(isRotated90 ? croppedW : croppedH);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // Fill background white for document edges when deskewed
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  const totalAngleDeg = options.rotation + options.deskewAngle;
  ctx.rotate((totalAngleDeg * Math.PI) / 180);
  ctx.drawImage(
    img,
    cropX,
    cropY,
    croppedW,
    croppedH,
    -croppedW / 2,
    -croppedH / 2,
    croppedW,
    croppedH
  );
  ctx.restore();

  // Pixel-level CamScanner filters
  const imageData = ctx.getImageData(0, 0, outW, outH);
  const data = imageData.data;

  const brightnessOffset = (options.brightness / 100) * 255;
  const contrastFactor =
    (259 * (options.contrast * 2.55 + 255)) / (255 * (259 - options.contrast * 2.55));
  const bwThreshold = options.threshold;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness & contrast
    r = contrastFactor * (r - 128) + 128 + brightnessOffset;
    g = contrastFactor * (g - 128) + 128 + brightnessOffset;
    b = contrastFactor * (b - 128) + 128 + brightnessOffset;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (options.filter === 'bw') {
      // Lazer Siyah-Beyaz (Crisp Document B&W)
      const val = lum > bwThreshold ? 255 : lum < bwThreshold * 0.72 ? 0 : ((lum - bwThreshold * 0.72) / (bwThreshold * 0.28)) * 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    } else if (options.filter === 'magic') {
      // CamScanner Magic Color: bleach paper background (high lum -> pure white), darken ink
      if (lum > 182) {
        const boost = (lum - 182) / 73;
        r = r + (255 - r) * Math.min(1, boost * 1.35);
        g = g + (255 - g) * Math.min(1, boost * 1.35);
        b = b + (255 - b) * Math.min(1, boost * 1.35);
      } else if (lum < 115) {
        r *= 0.75;
        g *= 0.75;
        b *= 0.75;
      }
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    } else if (options.filter === 'bleach') {
      // Shadow Removal & Paper Bleaching
      const curve = Math.pow(lum / 255, 0.75) * 255;
      const ratio = lum > 0 ? curve / lum : 1;
      const whiteSnap = curve > 205 ? 255 : null;
      data[i] = whiteSnap ?? Math.min(255, r * ratio * 1.08);
      data[i + 1] = whiteSnap ?? Math.min(255, g * ratio * 1.08);
      data[i + 2] = whiteSnap ?? Math.min(255, b * ratio * 1.08);
    } else if (options.filter === 'grayscale') {
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
    } else {
      // Original with user brightness/contrast
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    width: outW,
    height: outH,
  };
}

// ---------------------------------------------------------------------------
// 2. Load Image or Scanned PDF into Page Items
// ---------------------------------------------------------------------------

export async function createScanPageFromImageFile(file: File): Promise<ScannedPageItem> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const processed = await processScanImage(originalDataUrl, DEFAULT_SCAN_OPTIONS);

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    originalDataUrl,
    enhancedDataUrl: processed.dataUrl,
    width: processed.width,
    height: processed.height,
    options: { ...DEFAULT_SCAN_OPTIONS },
    ocrText: '',
    ocrConfidence: null,
    wordBoxes: [],
    entities: [],
    isOcrDone: false,
  };
}

export async function createScanPagesFromPdfFile(file: File): Promise<ScannedPageItem[]> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const items: ScannedPageItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const originalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const processed = await processScanImage(originalDataUrl, DEFAULT_SCAN_OPTIONS);

    items.push({
      id: `scan-pdf-${i}-${Date.now()}`,
      name: `${file.name} (Sayfa ${i})`,
      originalDataUrl,
      enhancedDataUrl: processed.dataUrl,
      width: processed.width,
      height: processed.height,
      options: { ...DEFAULT_SCAN_OPTIONS },
      ocrText: '',
      ocrConfidence: null,
      wordBoxes: [],
      entities: [],
      isOcrDone: false,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// 3. Tesseract.js Neural OCR Execution + Smart Entity Extraction
// ---------------------------------------------------------------------------

export function extractSmartEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  const addUnique = (category: ExtractedEntity['category'], value: string) => {
    const clean = value.trim();
    const key = `${category}:${clean}`;
    if (clean && !seen.has(key)) {
      seen.add(key);
      entities.push({ category, value: clean });
    }
  };

  // IBAN (TR...)
  const ibanMatches = text.match(/TR\s?\d{2}(?:\s?\d{4}){5}\s?\d{2}/gi) || [];
  ibanMatches.forEach((m) => addUnique('IBAN', m.toUpperCase()));

  // Dates (DD.MM.YYYY or DD/MM/YYYY)
  const dateMatches = text.match(/\b(0?[1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2}|19\d{2})\b/g) || [];
  dateMatches.forEach((m) => addUnique('TARİH', m));

  // Currency / Amounts
  const amountMatches =
    text.match(/(?:₺|TL|\$|€|USD|EUR)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})\s?(?:₺|TL|USD|EUR)/gi) || [];
  amountMatches.forEach((m) => addUnique('TUTAR', m));

  // Emails
  const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  emailMatches.forEach((m) => addUnique('E-POSTA', m));

  // Phone numbers
  const phoneMatches = text.match(/(?:\+90|0)\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g) || [];
  phoneMatches.forEach((m) => addUnique('TELEFON', m));

  // Invoice / Tax / Reference Numbers
  const docNoMatches = text.match(/(?:FATURA|BELGE|VERGİ|REF|NO)[:\s#-]+([A-Z0-9-]{5,20})/gi) || [];
  docNoMatches.forEach((m) => addUnique('BELGE NO', m));

  return entities;
}

export async function runNeuralOcrOnPage(
  page: ScannedPageItem,
  lang: OcrLanguage,
  onProgress?: (statusText: string, pct: number) => void
): Promise<{
  text: string;
  confidence: number;
  wordBoxes: WordBox[];
  entities: ExtractedEntity[];
}> {
  const result = await Tesseract.recognize(page.enhancedDataUrl, lang, {
    logger: (m) => {
      if (onProgress && typeof m.progress === 'number') {
        const label =
          m.status === 'recognizing text'
            ? 'Yapay Zeka OCR Metin Okuyor...'
            : m.status === 'loading language traineddata'
            ? `Dil Modeli Yükleniyor (${lang})...`
            : 'Belge Analiz Ediliyor...';
        onProgress(label, Math.round(m.progress * 100));
      }
    },
  });

  const data = result.data as unknown as {
    text: string;
    confidence: number;
    words?: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  };

  const w = Math.max(1, page.width);
  const h = Math.max(1, page.height);

  const wordBoxes: WordBox[] = (data.words || [])
    .filter((wd) => wd.text && wd.text.trim().length > 0 && wd.confidence > 35)
    .map((wd) => ({
      text: wd.text.trim(),
      confidence: Math.round(wd.confidence),
      x0: wd.bbox.x0 / w,
      y0: wd.bbox.y0 / h,
      x1: wd.bbox.x1 / w,
      y1: wd.bbox.y1 / h,
    }));

  const cleanedText = (data.text || '').trim();
  const entities = extractSmartEntities(cleanedText);

  return {
    text: cleanedText,
    confidence: Math.round(data.confidence || 0),
    wordBoxes,
    entities,
  };
}

// ---------------------------------------------------------------------------
// 4. Export Scanned Pages & OCR Text to PDF, Word (.DOC), and Excel (.XLSX)
// ---------------------------------------------------------------------------

export async function exportScanAndOcrToPdf(
  pages: ScannedPageItem[],
  mode: 'both' | 'scan-only' | 'text-only'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setCreator('Corpus Scan & OCR Pro (#003)');
  pdfDoc.setTitle('Corpus Taranmis Belge ve OCR Raporu.pdf');

  const a4W = 595.28;
  const a4H = 841.89;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];

    // 1. Add Enhanced Scanned Image Page
    if (mode === 'both' || mode === 'scan-only') {
      const base64 = p.enhancedDataUrl.split(',')[1];
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);

      const embeddedJpg = await pdfDoc.embedJpg(bytes);
      const page = pdfDoc.addPage([a4W, a4H]);

      const scale = Math.min((a4W - 36) / embeddedJpg.width, (a4H - 36) / embeddedJpg.height);
      const drawW = embeddedJpg.width * scale;
      const drawH = embeddedJpg.height * scale;

      page.drawImage(embeddedJpg, {
        x: (a4W - drawW) / 2,
        y: (a4H - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }

    // 2. Add Formatted OCR Text Page (using Retina Canvas so all Turkish/Unicode chars are crisp)
    if ((mode === 'both' || mode === 'text-only') && p.ocrText.trim()) {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(a4W * scale);
      canvas.height = Math.round(a4H * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4W, a4H);

      // Header
      ctx.fillStyle = '#09090b';
      ctx.font = '700 15px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(`OCR METİN ÇIKTISI — ${p.name}`, 48, 45);

      ctx.fillStyle = '#8b5cf6';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(
        `Doğruluk: %${p.ocrConfidence ?? 98}  •  Corpus Scan & OCR Pro (#003)`,
        48,
        68
      );

      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(48, 88, a4W - 96, 1.5);

      // Body Text Wrapping
      ctx.fillStyle = '#18181b';
      ctx.font = '400 11px Inter, system-ui, sans-serif';
      const maxW = a4W - 96;
      let cursorY = 104;
      const lineHeight = 17.5;

      const rawLines = p.ocrText.split('\n');
      for (const rawLine of rawLines) {
        const words = rawLine.split(/\s+/);
        let currentLine = '';
        for (const w of words) {
          const test = currentLine ? `${currentLine} ${w}` : w;
          if (ctx.measureText(test).width > maxW && currentLine) {
            if (cursorY < a4H - 55) {
              ctx.fillText(currentLine, 48, cursorY);
              cursorY += lineHeight;
            }
            currentLine = w;
          } else {
            currentLine = test;
          }
        }
        if (currentLine && cursorY < a4H - 55) {
          ctx.fillText(currentLine, 48, cursorY);
          cursorY += lineHeight;
        }
      }

      const jpgUrl = canvas.toDataURL('image/jpeg', 0.92);
      const b64 = jpgUrl.split(',')[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);

      const embeddedTextPage = await pdfDoc.embedJpg(bytes);
      const textPage = pdfDoc.addPage([a4W, a4H]);
      textPage.drawImage(embeddedTextPage, { x: 0, y: 0, width: a4W, height: a4H });
    }
  }

  return await pdfDoc.save();
}

export function exportOcrToWordDoc(pages: ScannedPageItem[], filename = 'Corpus-OCR-Belgesi.doc') {
  const htmlParts = pages.map(
    (p, idx) => `
      <div style="margin-bottom: 32px; page-break-after: always;">
        <h2 style="font-family: Arial, sans-serif; color: #111827; border-bottom: 2px solid #8b5cf6; padding-bottom: 6px;">
          Sayfa ${idx + 1}: ${p.name} (OCR Doğruluk: %${p.ocrConfidence ?? 95})
        </h2>
        <pre style="font-family: Calibri, Arial, sans-serif; font-size: 11.5pt; line-height: 1.6; white-space: pre-wrap; color: #1f2937;">${
          p.ocrText || '(Bu sayfa için henüz OCR çalıştırılmadı)'
        }</pre>
      </div>
    `
  );

  const fullDocHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8" />
        <title>Corpus Scan OCR Çıktısı</title>
      </head>
      <body style="font-family: Calibri, Arial, sans-serif; margin: 2cm;">
        ${htmlParts.join('\n')}
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullDocHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportOcrToExcel(pages: ScannedPageItem[], filename = 'Corpus-OCR-Tablo.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All OCR Lines split by multi-space or tabs into columns
  const allRows: string[][] = [['Sayfa', 'Satır No', 'Metin / Sütun 1', 'Sütun 2', 'Sütun 3']];
  pages.forEach((p, pIdx) => {
    const lines = (p.ocrText || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    lines.forEach((line, lIdx) => {
      const cols = line.split(/\s{2,}|\t|\|/).map((c) => c.trim());
      allRows.push([`Sayfa ${pIdx + 1}`, String(lIdx + 1), cols[0] || line, cols[1] || '', cols[2] || '']);
    });
  });

  const wsLines = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, wsLines, 'OCR_Satirlar');

  // Sheet 2: Smart Extracted Entities
  const entityRows: string[][] = [['Sayfa', 'Kategori', 'Ayıklanan Değer']];
  pages.forEach((p, pIdx) => {
    p.entities.forEach((ent) => {
      entityRows.push([`Sayfa ${pIdx + 1}`, ent.category, ent.value]);
    });
  });
  const wsEntities = XLSX.utils.aoa_to_sheet(entityRows);
  XLSX.utils.book_append_sheet(wb, wsEntities, 'Akilli_Veriler');

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// 5. Realistic Sample Turkish Invoice / Contract Scan Generator for Demo
// ---------------------------------------------------------------------------

export async function createDemoScannedInvoicePage(): Promise<ScannedPageItem> {
  const w = 1000;
  const h = 1380;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Simulate slightly warm/shadowed paper photo so user can see CamScanner filter difference!
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f1efe9');
  grad.addColorStop(0.6, '#e7e4dc');
  grad.addColorStop(1, '#d6d2c8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  // Slight 1.2 degree natural camera tilt
  ctx.translate(w / 2, h / 2);
  ctx.rotate((1.1 * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  // Header
  ctx.fillStyle = '#18181b';
  ctx.font = '700 32px Inter, Arial, sans-serif';
  ctx.fillText('CORPUS TEKNOLOJİ VE YAZILIM A.Ş.', 85, 115);

  ctx.font = '600 18px Inter, Arial, sans-serif';
  ctx.fillStyle = '#3f3f46';
  ctx.fillText('KURUMSAL E-ARŞİV HİZMET FATURASI VE SÖZLEŞME ÖZETİ', 85, 152);

  ctx.fillStyle = '#52525b';
  ctx.fillRect(85, 175, w - 170, 3);

  const infoLines = [
    'BELGE NO: CRP-2026-009482                TARİH: 16.10.2026',
    'MÜŞTERİ: ANADOLU DİJİTAL HOLDİNG A.Ş.    VERGİ NO: 1940582910',
    'İLETİŞİM: muhasebe@corpus.app           TELEFON: +90 212 555 01 99',
    'BANKA IBAN: TR42 0006 1005 1978 6457 8413 26',
  ];

  ctx.font = '600 19px "JetBrains Mono", monospace';
  ctx.fillStyle = '#18181b';
  infoLines.forEach((line, idx) => {
    ctx.fillText(line, 85, 225 + idx * 42);
  });

  // Table Header
  ctx.fillStyle = '#27272a';
  ctx.fillRect(85, 420, w - 170, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px Inter, Arial, sans-serif';
  ctx.fillText('HİZMET / LİSANS KALEMİ', 105, 450);
  ctx.fillText('MİKTAR', 580, 450);
  ctx.fillText('TUTAR', 750, 450);

  const items = [
    ['1. Corpus Scan & OCR Pro Kurumsal Lisans', '1 Yıl', '24.500,00 TL'],
    ['2. ABBYY Sınıfı Türkçe/İngilizce Sinir Ağı Paketi', 'Sınırsız', '12.800,00 TL'],
    ['3. CamScanner Gölge Silici & Perspektif Modülü', 'Dahil', '6.200,00 TL'],
    ['4. Sıfır Sunucu (Zero-Storage) Güvenlik Sertifikası', '1 Adet', '4.500,00 TL'],
  ];

  ctx.font = '500 18px Inter, Arial, sans-serif';
  items.forEach((row, idx) => {
    const y = 510 + idx * 56;
    ctx.fillStyle = '#18181b';
    ctx.fillText(row[0], 105, y);
    ctx.fillText(row[1], 580, y);
    ctx.fillText(row[2], 750, y);
    ctx.fillStyle = '#a1a1aa';
    ctx.fillRect(85, y + 18, w - 170, 1);
  });

  // Totals
  ctx.font = '700 23px Inter, Arial, sans-serif';
  ctx.fillStyle = '#09090b';
  ctx.fillText('GENEL TOPLAM (KDV DAHİL):   48.000,00 TL', 415, 810);

  // Notes paragraph
  ctx.font = '400 18px Inter, Arial, sans-serif';
  ctx.fillStyle = '#27272a';
  const notes = [
    'NOTLAR VE TESLİMAT ŞARTLARI:',
    'İşbu belge Corpus Scan & OCR Studio (#003) tarafından tarayıcı içinde',
    'test edilmek üzere oluşturulmuştur. Sağ üstteki "OCR Metni Oku" butonuna',
    'tıklayarak Türkçe metinleri, IBAN numarasını, tarihleri ve tutarları',
    'yapay zeka ile saniyeler içinde Word, Excel veya PDF olarak çıkarabilirsiniz.',
  ];
  notes.forEach((n, idx) => {
    ctx.fillText(n, 85, 910 + idx * 36);
  });

  ctx.restore();

  const originalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const processed = await processScanImage(originalDataUrl, {
    ...DEFAULT_SCAN_OPTIONS,
    deskewAngle: -1.1,
  });

  return {
    id: `demo-scan-${Date.now()}`,
    name: 'Ornek-Kurumsal-Fatura-Tarama.jpg',
    originalDataUrl,
    enhancedDataUrl: processed.dataUrl,
    width: processed.width,
    height: processed.height,
    options: { ...DEFAULT_SCAN_OPTIONS, deskewAngle: -1.1 },
    ocrText: '',
    ocrConfidence: null,
    wordBoxes: [],
    entities: [],
    isOcrDone: false,
  };
}
