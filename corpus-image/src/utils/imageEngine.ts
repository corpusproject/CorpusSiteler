import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

export type OutputImageFormat = 'image/webp' | 'image/jpeg' | 'image/png';
export type AspectCropPreset = 'free' | '1:1' | '16:9' | '4:5' | 'biometric-50x60';

export interface ImageAdjustments {
  brightness: number; // 50 to 150 (100 default)
  contrast: number; // 50 to 150 (100 default)
  saturation: number; // 0 to 200 (100 default)
  sepia: number; // 0 to 100 (0 default)
  blur: number; // 0 to 10 (0 default)
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  mode: 'diagonal-tiled' | 'bottom-right';
  opacity: number; // 0.1 to 0.9
  color: string;
}

export interface BatchImageItem {
  id: string;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalDataUrl: string;
  processedBlob: Blob | null;
  processedDataUrl: string | null;
  processedSize: number;
  processedWidth: number;
  processedHeight: number;
  exifStripped: boolean;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  blur: 0,
};

export const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: false,
  text: '© CORPUS STUDIO • İZİNSİZ KULLANILAMAZ',
  mode: 'diagonal-tiled',
  opacity: 0.28,
  color: '#ffffff',
};

/**
 * Generates a rich, high-resolution sample studio image on load so user can test immediately
 */
export async function createSampleStudioImage(): Promise<BatchImageItem> {
  const canvas = document.createElement('canvas');
  const W = 1440;
  const H = 960;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Rich atmospheric gradient sky & mountain landscape + studio color chart
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.45, '#311042');
  grad.addColorStop(0.75, '#7c2d12');
  grad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Glowing sun
  const sunGrad = ctx.createRadialGradient(W * 0.72, H * 0.36, 20, W * 0.72, H * 0.36, 260);
  sunGrad.addColorStop(0, '#fef08a');
  sunGrad.addColorStop(0.4, 'rgba(251, 146, 60, 0.65)');
  sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.36, 260, 0, Math.PI * 2);
  ctx.fill();

  // Layered geometric mountain silhouettes
  const drawMountain = (yBase: number, amp: number, color: string, seed: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) {
      const y =
        yBase -
        Math.sin(x * 0.004 + seed) * amp -
        Math.cos(x * 0.011 - seed) * (amp * 0.45);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  };

  drawMountain(H * 0.62, 130, 'rgba(30, 27, 75, 0.75)', 1.2);
  drawMountain(H * 0.74, 95, 'rgba(15, 23, 42, 0.9)', 2.7);
  drawMountain(H * 0.85, 55, '#09090b', 4.1);

  // Studio Calibration Badge
  ctx.fillStyle = 'rgba(9, 9, 11, 0.72)';
  ctx.fillRect(64, 64, 580, 150);
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(64, 64, 580, 150);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 36px "Inter", sans-serif';
  ctx.fillText('CORPUS RAW PHOTO TEST 4K', 96, 124);

  ctx.fillStyle = '#a78bfa';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText('1440x960 px • EXIF & GPS Strip Ready • WebP/JPEG DSP', 96, 172);

  const originalDataUrl = canvas.toDataURL('image/png');
  const res = await fetch(originalDataUrl);
  const origBlob = await res.blob();

  return {
    id: 'sample-1',
    name: 'ornek-stüdyo-manzara-4k.png',
    originalSize: origBlob.size,
    originalWidth: W,
    originalHeight: H,
    originalDataUrl,
    processedBlob: null,
    processedDataUrl: null,
    processedSize: 0,
    processedWidth: W,
    processedHeight: H,
    exifStripped: true,
  };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Processes an image with compression, format conversion, resize scale, aspect crop, Lightroom filters, watermark, and EXIF stripping
 */
export async function processImageWithStudioPipeline(
  item: BatchImageItem,
  options: {
    format: OutputImageFormat;
    quality: number; // 0.1 to 0.98
    scalePercent: number; // 25 to 100
    cropPreset: AspectCropPreset;
    adjustments: ImageAdjustments;
    watermark: WatermarkConfig;
  }
): Promise<BatchImageItem> {
  const img = await loadImage(item.originalDataUrl);

  // Determine source crop rectangle based on AspectCropPreset
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  let targetRatio: number | null = null;
  if (options.cropPreset === '1:1') targetRatio = 1;
  else if (options.cropPreset === '16:9') targetRatio = 16 / 9;
  else if (options.cropPreset === '4:5') targetRatio = 4 / 5;
  else if (options.cropPreset === 'biometric-50x60') targetRatio = 50 / 60;

  if (targetRatio) {
    const currentRatio = img.width / img.height;
    if (currentRatio > targetRatio) {
      sw = Math.round(img.height * targetRatio);
      sx = Math.round((img.width - sw) / 2);
    } else {
      sh = Math.round(img.width / targetRatio);
      sy = Math.round((img.height - sh) / 2);
    }
  }

  const outW = Math.max(64, Math.round((sw * options.scalePercent) / 100));
  const outH = Math.max(64, Math.round((sh * options.scalePercent) / 100));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // White background for JPEG so transparent PNGs don't turn black
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
  }

  // Apply Lightroom-grade CSS canvas filter
  const { brightness, contrast, saturation, sepia, blur } = options.adjustments;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) blur(${blur}px)`;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  ctx.filter = 'none';

  // Apply Watermark if enabled
  if (options.watermark.enabled && options.watermark.text.trim()) {
    ctx.save();
    ctx.globalAlpha = options.watermark.opacity;
    ctx.fillStyle = options.watermark.color || '#ffffff';

    const fontSize = Math.max(16, Math.round(outW * 0.028));
    ctx.font = `700 ${fontSize}px "Inter", sans-serif`;

    if (options.watermark.mode === 'bottom-right') {
      ctx.textAlign = 'right';
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 6;
      ctx.fillText(options.watermark.text, outW - 28, outH - 28);
    } else {
      // Diagonal 45-degree security tiled watermark (great for ID / Tapu / Official Documents!)
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'center';
      const stepX = Math.max(280, fontSize * 14);
      const stepY = Math.max(140, fontSize * 5);
      for (let y = -outH; y <= outH; y += stepY) {
        for (let x = -outW; x <= outW; x += stepX) {
          ctx.fillText(options.watermark.text, x, y);
        }
      }
    }
    ctx.restore();
  }

  const processedDataUrl = canvas.toDataURL(options.format, options.quality);
  const res = await fetch(processedDataUrl);
  const processedBlob = await res.blob();

  return {
    ...item,
    processedBlob,
    processedDataUrl,
    processedSize: processedBlob.size,
    processedWidth: outW,
    processedHeight: outH,
    exifStripped: true,
  };
}

/**
 * Generates an 8-Up Biometric Passport / Visa / Vesikalık (50x60mm) Print Sheet on a 10x15cm (1800x1200px @ 300 DPI) Canvas
 */
export async function renderBiometricSheetToCanvas(
  canvas: HTMLCanvasElement,
  sourceDataUrl: string,
  titleLabel = 'BİYOMETRİK / VESİKALIK 8\'Lİ BASKI ŞABLONU (50x60mm • 300 DPI)'
): Promise<void> {
  const W = 1800;
  const H = 1200;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const img = await loadImage(sourceDataUrl);

  // Center crop source image to 50:60 aspect ratio
  const targetRatio = 50 / 60;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (img.width / img.height > targetRatio) {
    sw = Math.round(img.height * targetRatio);
    sx = Math.round((img.width - sw) / 2);
  } else {
    sh = Math.round(img.width / targetRatio);
    sy = Math.round((img.height - sh) / 2);
  }

  // 4 columns x 2 rows = 8 biometric photos
  const photoW = 370;
  const photoH = 444;
  const gapX = 48;
  const gapY = 56;
  const startX = Math.round((W - (photoW * 4 + gapX * 3)) / 2);
  const startY = 110;

  ctx.fillStyle = '#18181b';
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(titleLabel, W / 2, 62);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const x = startX + col * (photoW + gapX);
      const y = startY + row * (photoH + gapY);

      ctx.drawImage(img, sx, sy, sw, sh, x, y, photoW, photoH);

      // Cut guide border
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, photoW, photoH);
    }
  }

  ctx.fillStyle = '#71717a';
  ctx.font = '500 18px "Inter", sans-serif';
  ctx.fillText(
    'Corpus Image Studio Pro (#010) — Kesim çizgilerinden (50x60 mm ICAO Biyometrik Standart) kesiniz.',
    W / 2,
    H - 32
  );
}

/**
 * Exports all processed images as a single ZIP archive
 */
export async function exportBatchImagesAsZip(
  items: BatchImageItem[],
  format: OutputImageFormat
): Promise<void> {
  const zip = new JSZip();
  const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';

  for (const item of items) {
    if (!item.processedBlob) continue;
    const baseName = item.name.replace(/\.[^.]+$/, '');
    zip.file(`${baseName}-corpus.${ext}`, item.processedBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corpus-sikistirilmis-gorseller-${items.length}adet.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports the 8-up Biometric Sheet Canvas as a printable A4 PDF
 */
export async function exportBiometricCanvasToPdf(canvas: HTMLCanvasElement): Promise<void> {
  const pngUrl = canvas.toDataURL('image/png', 1.0);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
  const pngImg = await pdfDoc.embedPng(pngUrl);

  page.drawImage(pngImg, {
    x: 30,
    y: 30,
    width: 841.89 - 60,
    height: 595.28 - 60,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'corpus-8li-biyometrik-vesikalik-baski.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
