import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// ---------------------------------------------------------------------------
// 1. IMAGES TO PDF (JPG / PNG / WebP / GIF -> Multi-page PDF)
// ---------------------------------------------------------------------------

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ImageToPdfOptions {
  pageSize: 'a4' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'large';
}

export async function fileToImageItem(file: File): Promise<ImageItem> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const dims = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = dataUrl;
  });

  return {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    file,
    name: file.name,
    dataUrl,
    width: dims.width,
    height: dims.height,
  };
}

async function normalizeImageToPngBytes(dataUrl: string): Promise<Uint8Array> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 800;
  canvas.height = img.naturalHeight || 600;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }
  const pngUrl = canvas.toDataURL('image/png');
  const base64 = pngUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function convertImagesToPdf(
  items: ImageItem[],
  options: ImageToPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setCreator('Corpus PDF Studio (#002)');

  const marginMap = { none: 0, small: 24, large: 52 };
  const margin = marginMap[options.margin];

  for (const item of items) {
    const pngBytes = await normalizeImageToPngBytes(item.dataUrl);
    const embedded = await pdfDoc.embedPng(pngBytes);

    let pageW = embedded.width;
    let pageH = embedded.height;

    if (options.pageSize === 'a4') {
      pageW = options.orientation === 'portrait' ? 595.28 : 841.89;
      pageH = options.orientation === 'portrait' ? 841.89 : 595.28;
    } else if (options.pageSize === 'letter') {
      pageW = options.orientation === 'portrait' ? 612 : 792;
      pageH = options.orientation === 'portrait' ? 792 : 612;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const availW = Math.max(50, pageW - margin * 2);
    const availH = Math.max(50, pageH - margin * 2);

    const scale = Math.min(availW / embedded.width, availH / embedded.height);
    const drawW = options.pageSize === 'fit' ? embedded.width : embedded.width * scale;
    const drawH = options.pageSize === 'fit' ? embedded.height : embedded.height * scale;

    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    page.drawImage(embedded, {
      x,
      y,
      width: drawW,
      height: drawH,
    });
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// 2. WORD (.DOCX / .DOC / .TXT) TO PDF
// ---------------------------------------------------------------------------

export interface ParsedWordDoc {
  fileName: string;
  html: string;
  blocks: Array<{
    type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'table-row';
    text: string;
  }>;
  wordCount: number;
}

export async function parseWordFile(file: File): Promise<ParsedWordDoc> {
  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let html = '';
  let rawText = '';

  if (ext === 'docx') {
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });
      html = htmlResult.value;
      rawText = textResult.value;
    } catch {
      rawText = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      html = `<p>${rawText}</p>`;
    }
  } else {
    // Fallback for legacy .doc / .txt / .rtf / .md
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    // Clean binary control chars if legacy .doc
    rawText = decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s{4,}/g, '\n\n').trim();
    html = rawText
      .split(/\n+/)
      .map((line) => `<p>${line}</p>`)
      .join('');
  }

  // Parse HTML into structured blocks for crisp pagination
  const parser = new DOMParser();
  const dom = parser.parseFromString(html || `<p>${rawText}</p>`, 'text/html');
  const blocks: ParsedWordDoc['blocks'] = [];

  const walk = (node: Element) => {
    const tag = node.tagName.toLowerCase();
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p' || tag === 'li') {
      const txt = (node.textContent || '').trim();
      if (txt) {
        blocks.push({ type: tag as 'h1' | 'h2' | 'h3' | 'p' | 'li', text: txt });
      }
      return;
    }
    if (tag === 'tr') {
      const cells = Array.from(node.querySelectorAll('th, td')).map((c) =>
        (c.textContent || '').trim()
      );
      if (cells.some(Boolean)) {
        blocks.push({ type: 'table-row', text: cells.join('   |   ') });
      }
      return;
    }
    Array.from(node.children).forEach(walk);
  };

  Array.from(dom.body.children).forEach(walk);

  if (blocks.length === 0 && rawText.trim()) {
    rawText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => blocks.push({ type: 'p', text: line }));
  }

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  return {
    fileName: file.name,
    html: html || `<p>${rawText}</p>`,
    blocks,
    wordCount,
  };
}

export async function convertWordToPdf(parsed: ParsedWordDoc): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(parsed.fileName.replace(/\.[^.]+$/, '') + '.pdf');
  pdfDoc.setCreator('Corpus PDF Studio (#002)');

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const scale = 2; // High-DPI Retina canvas
  const marginX = 52;
  const marginTop = 58;
  const marginBottom = 58;
  const contentWidth = pageWidth - marginX * 2;

  const createPageCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pageWidth * scale);
    canvas.height = Math.round(pageHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);
    return { canvas, ctx };
  };

  const pagesCanvases: HTMLCanvasElement[] = [];
  let current = createPageCanvas();
  pagesCanvases.push(current.canvas);
  let cursorY = marginTop;

  const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxW && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [''];
  };

  for (const block of parsed.blocks) {
    let fontSize = 11;
    let fontWeight = '400';
    let lineHeight = 17.5;
    let spaceAfter = 10;
    let indent = 0;
    let color = '#18181b';

    if (block.type === 'h1') {
      fontSize = 20;
      fontWeight = '700';
      lineHeight = 28;
      spaceAfter = 14;
      color = '#09090b';
    } else if (block.type === 'h2') {
      fontSize = 15.5;
      fontWeight = '700';
      lineHeight = 23;
      spaceAfter = 11;
      color = '#111827';
    } else if (block.type === 'h3') {
      fontSize = 13;
      fontWeight = '600';
      lineHeight = 20;
      spaceAfter = 8;
      color = '#1f2937';
    } else if (block.type === 'li') {
      indent = 18;
      spaceAfter = 6;
    } else if (block.type === 'table-row') {
      fontSize = 10;
      fontWeight = '500';
      lineHeight = 16;
      spaceAfter = 6;
      color = '#27272a';
    }

    current.ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
    const prefix = block.type === 'li' ? '•  ' : '';
    const lines = wrapLines(current.ctx, prefix + block.text, contentWidth - indent);

    for (const line of lines) {
      if (cursorY + lineHeight > pageHeight - marginBottom) {
        current = createPageCanvas();
        pagesCanvases.push(current.canvas);
        cursorY = marginTop;
        current.ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
      }

      if (block.type === 'table-row') {
        current.ctx.fillStyle = '#f4f4f5';
        current.ctx.fillRect(marginX, cursorY - 2, contentWidth, lineHeight + 2);
      }

      current.ctx.fillStyle = color;
      current.ctx.textBaseline = 'top';
      current.ctx.fillText(line, marginX + indent, cursorY);
      cursorY += lineHeight;
    }

    cursorY += spaceAfter;
  }

  // Add subtle page numbers at bottom
  pagesCanvases.forEach((canvas, idx) => {
    const ctx = canvas.getContext('2d')!;
    ctx.font = '400 9px Inter, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${parsed.fileName}  •  Sayfa ${idx + 1} / ${pagesCanvases.length}`,
      pageWidth / 2,
      pageHeight - 28
    );
  });

  for (const canvas of pagesCanvases) {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const jpg = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(jpg, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// 3. POWERPOINT (.PPTX / .PPT) TO PDF
// ---------------------------------------------------------------------------

export interface ParsedSlide {
  slideNumber: number;
  title: string;
  bullets: string[];
  images: string[]; // data URLs extracted from ppt/media
}

export type SlideTheme = 'corpus-dark' | 'clean-light' | 'executive-violet';

export async function parsePowerPointFile(file: File): Promise<ParsedSlide[]> {
  const buffer = await file.arrayBuffer();
  const slides: ParsedSlide[] = [];

  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
        return numA - numB;
      });

    // Preload media files as data URLs
    const mediaMap: Record<string, string> = {};
    const mediaKeys = Object.keys(zip.files).filter((k) =>
      /^ppt\/media\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(k)
    );
    for (const mKey of mediaKeys) {
      const base64 = await zip.files[mKey].async('base64');
      const ext = mKey.split('.').pop()?.toLowerCase() || 'png';
      const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const shortName = mKey.split('/').pop() || mKey;
      mediaMap[shortName] = `data:${mime};base64,${base64}`;
    }

    const parser = new DOMParser();

    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const xmlText = await zip.files[slidePath].async('string');
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      // Extract paragraphs (<a:p>) and text runs (<a:t>)
      const paragraphs = Array.from(xmlDoc.getElementsByTagName('a:p'));
      const textLines: string[] = [];

      for (const p of paragraphs) {
        const runs = Array.from(p.getElementsByTagName('a:t'));
        const line = runs
          .map((r) => r.textContent || '')
          .join('')
          .trim();
        if (line) textLines.push(line);
      }

      // Check slide relationships for images
      const slideFileName = slidePath.split('/').pop() || '';
      const relPath = `ppt/slides/_rels/${slideFileName}.rels`;
      const slideImages: string[] = [];
      if (zip.files[relPath]) {
        const relXml = await zip.files[relPath].async('string');
        const matches = Array.from(relXml.matchAll(/Target="\.\.\/media\/([^"]+)"/gi));
        for (const m of matches) {
          const mediaName = m[1];
          if (mediaMap[mediaName]) {
            slideImages.push(mediaMap[mediaName]);
          }
        }
      }

      const title = textLines[0] || `Slayt ${i + 1}`;
      const bullets = textLines.slice(1);

      slides.push({
        slideNumber: i + 1,
        title,
        bullets,
        images: slideImages,
      });
    }
  } catch {
    // Fallback for binary/legacy .ppt
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const cleaned = decoded
      .replace(/[\x00-\x1F]/g, '\n')
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3 && /[a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/.test(s));

    const chunkSize = 6;
    for (let i = 0; i < Math.max(1, Math.min(20, Math.ceil(cleaned.length / chunkSize))); i++) {
      const slice = cleaned.slice(i * chunkSize, (i + 1) * chunkSize);
      slides.push({
        slideNumber: i + 1,
        title: slice[0] || `${file.name} — Slayt ${i + 1}`,
        bullets: slice.slice(1),
        images: [],
      });
    }
  }

  if (slides.length === 0) {
    slides.push({
      slideNumber: 1,
      title: file.name.replace(/\.[^.]+$/, ''),
      bullets: ['Sunum içeriği başarıyla yüklendi.'],
      images: [],
    });
  }

  return slides;
}

export async function convertSlidesToPdf(
  slides: ParsedSlide[],
  theme: SlideTheme = 'corpus-dark',
  deckTitle = 'Presentation'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${deckTitle}.pdf`);
  pdfDoc.setCreator('Corpus PDF Studio (#002)');

  const slideW = 960; // 16:9 widescreen
  const slideH = 540;
  const scale = 2;

  for (const slide of slides) {
    const canvas = document.createElement('canvas');
    canvas.width = slideW * scale;
    canvas.height = slideH * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // Background by theme
    if (theme === 'corpus-dark') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, slideW, slideH);
      const grad = ctx.createRadialGradient(slideW * 0.8, 60, 20, slideW * 0.8, 60, 420);
      grad.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
      grad.addColorStop(1, 'rgba(9, 9, 11, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, slideW, slideH);
      // Top accent bar
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(0, 0, slideW, 6);
    } else if (theme === 'executive-violet') {
      const grad = ctx.createLinearGradient(0, 0, slideW, slideH);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, slideW, slideH);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, slideW, 6);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slideW, slideH);
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(0, 0, slideW, 6);
    }

    const isDark = theme !== 'clean-light';
    const titleColor = isDark ? '#fafafa' : '#09090b';
    const bodyColor = isDark ? '#d4d4d8' : '#27272a';
    const mutedColor = isDark ? '#71717a' : '#71717a';

    // Slide Number Pill
    ctx.fillStyle = isDark ? '#18181b' : '#f4f4f5';
    ctx.beginPath();
    ctx.roundRect(60, 42, 92, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SLAYT #${String(slide.slideNumber).padStart(2, '0')}`, 72, 55);

    // Slide Title
    ctx.fillStyle = titleColor;
    ctx.font = '700 30px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';
    const hasImage = slide.images.length > 0;
    const textMaxW = hasImage ? slideW * 0.54 : slideW - 120;

    // Wrap Title
    const titleWords = slide.title.split(/\s+/);
    let tLine = '';
    let cursorY = 88;
    for (const w of titleWords) {
      const test = tLine ? `${tLine} ${w}` : w;
      if (ctx.measureText(test).width > textMaxW && tLine) {
        ctx.fillText(tLine, 60, cursorY);
        cursorY += 38;
        tLine = w;
      } else {
        tLine = test;
      }
    }
    if (tLine) {
      ctx.fillText(tLine, 60, cursorY);
      cursorY += 50;
    }

    // Divider line
    ctx.fillStyle = isDark ? '#27272a' : '#e4e4e7';
    ctx.fillRect(60, cursorY - 12, textMaxW, 1.5);
    cursorY += 10;

    // Bullets
    ctx.font = '400 17px Inter, system-ui, sans-serif';
    for (const bullet of slide.bullets.slice(0, 9)) {
      if (cursorY > slideH - 70) break;
      // Bullet dot
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(68, cursorY + 10, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bodyColor;
      const words = bullet.split(/\s+/);
      let bLine = '';
      for (const w of words) {
        const test = bLine ? `${bLine} ${w}` : w;
        if (ctx.measureText(test).width > textMaxW - 28 && bLine) {
          ctx.fillText(bLine, 84, cursorY);
          cursorY += 25;
          bLine = w;
        } else {
          bLine = test;
        }
      }
      if (bLine) {
        ctx.fillText(bLine, 84, cursorY);
        cursorY += 30;
      }
    }

    // Draw first embedded image on the right side if available
    if (hasImage) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = slide.images[0];
        });
        const boxX = slideW * 0.6;
        const boxY = 90;
        const boxW = slideW * 0.34;
        const boxH = slideH - 150;
        const sc = Math.min(boxW / (img.naturalWidth || 400), boxH / (img.naturalHeight || 300));
        const dw = (img.naturalWidth || 400) * sc;
        const dh = (img.naturalHeight || 300) * sc;
        ctx.drawImage(img, boxX + (boxW - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
      } catch {
        // ignore broken slide media
      }
    }

    // Footer
    ctx.fillStyle = mutedColor;
    ctx.font = '400 11px "JetBrains Mono", monospace';
    ctx.fillText(`${deckTitle}  •  Corpus PDF Studio`, 60, slideH - 32);

    const jpgUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = jpgUrl.split(',')[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const embedded = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([slideW, slideH]);
    page.drawImage(embedded, { x: 0, y: 0, width: slideW, height: slideH });
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// 4. EXCEL / SPREADSHEET (.XLSX / .XLS / .CSV) TO PDF
// ---------------------------------------------------------------------------

export interface ParsedSheet {
  name: string;
  rows: string[][];
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  return workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: '',
    });
    const cleanedRows = rawRows
      .map((r) => (Array.isArray(r) ? r.map((cell) => String(cell ?? '')) : []))
      .filter((r) => r.some((c) => c.trim() !== ''));
    return {
      name: sheetName,
      rows: cleanedRows,
    };
  });
}

export async function convertSpreadsheetToPdf(
  sheet: ParsedSheet,
  fileName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${fileName} - ${sheet.name}.pdf`);
  pdfDoc.setCreator('Corpus PDF Studio (#002)');

  const pageW = 841.89; // Landscape A4 for wide tables
  const pageH = 595.28;
  const scale = 2;
  const marginX = 36;
  const marginY = 42;

  const rows = sheet.rows.length > 0 ? sheet.rows : [['Boş Tablo']];
  const maxCols = Math.min(
    12,
    Math.max(1, ...rows.slice(0, 50).map((r) => r.length))
  );
  const tableW = pageW - marginX * 2;
  const colW = tableW / maxCols;
  const rowH = 24;
  const rowsPerPage = Math.floor((pageH - marginY * 2 - 48) / rowH);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  for (let p = 0; p < totalPages; p++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pageW * scale);
    canvas.height = Math.round(pageH * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageW, pageH);

    // Header
    ctx.fillStyle = '#09090b';
    ctx.font = '700 15px Inter, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`${fileName} — Sayfa: ${sheet.name}`, marginX, marginY);

    ctx.fillStyle = '#71717a';
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillText(
      `Sayfa ${p + 1} / ${totalPages} • Toplam ${rows.length} Satır`,
      pageW - marginX - 180,
      marginY + 3
    );

    const startIdx = p * rowsPerPage;
    const pageRows = rows.slice(startIdx, startIdx + rowsPerPage);

    pageRows.forEach((row, rIdx) => {
      const isHeader = p === 0 && rIdx === 0;
      const y = marginY + 34 + rIdx * rowH;

      ctx.fillStyle = isHeader
        ? '#18181b'
        : rIdx % 2 === 0
        ? '#f8fafc'
        : '#ffffff';
      ctx.fillRect(marginX, y, tableW, rowH);

      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(marginX, y, tableW, rowH);

      for (let c = 0; c < maxCols; c++) {
        const cellText = String(row[c] ?? '').trim();
        const cx = marginX + c * colW;

        ctx.save();
        ctx.beginPath();
        ctx.rect(cx + 4, y + 2, colW - 8, rowH - 4);
        ctx.clip();

        ctx.fillStyle = isHeader ? '#fafafa' : '#18181b';
        ctx.font = isHeader
          ? '600 10px Inter, sans-serif'
          : '400 9.5px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(cellText, cx + 6, y + rowH / 2);
        ctx.restore();
      }
    });

    const jpgUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = jpgUrl.split(',')[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const embedded = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(embedded, { x: 0, y: 0, width: pageW, height: pageH });
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// 5. MERGE PDFs, SPLIT PDF, AND PDF TO IMAGES (.ZIP)
// ---------------------------------------------------------------------------

export async function mergeMultiplePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  mergedPdf.setCreator('Corpus PDF Studio (#002)');

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((p) => mergedPdf.addPage(p));
  }

  return await mergedPdf.save();
}

export async function extractPdfPageRange(
  file: File,
  rangeInput: string
): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();

  const indices = new Set<number>();
  const parts = rangeInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(total, parseInt(endStr, 10));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= total) {
        indices.add(num - 1);
      }
    }
  }

  const finalIndices = indices.size > 0 ? Array.from(indices) : [0];
  const outDoc = await PDFDocument.create();
  const copied = await outDoc.copyPages(srcDoc, finalIndices);
  copied.forEach((p) => outDoc.addPage(p));
  return await outDoc.save();
}

export async function renderPdfToImagesZip(
  file: File,
  format: 'png' | 'jpeg' = 'png'
): Promise<{ zipBlob: Blob; previews: string[] }> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const zip = new JSZip();
  const previews: string[] = [];
  const baseName = file.name.replace(/\.pdf$/i, '');

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, 0.92);
    previews.push(dataUrl);

    const base64 = dataUrl.split(',')[1];
    const ext = format === 'png' ? 'png' : 'jpg';
    zip.file(`${baseName}-sayfa-${String(i).padStart(2, '0')}.${ext}`, base64, {
      base64: true,
    });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zipBlob, previews };
}
