import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// 1. Smart QR Payload Types & Builder
// ---------------------------------------------------------------------------

export type QrPresetType =
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'iban'
  | 'whatsapp'
  | 'email'
  | 'text';

export interface QrDesignConfig {
  preset: QrPresetType;
  // Payload fields
  url: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  vcardName: string;
  vcardOrg: string;
  vcardTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardWebsite: string;
  ibanHolder: string;
  ibanNumber: string;
  ibanAmount: string;
  ibanNote: string;
  waPhone: string;
  waMessage: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  rawText: string;
  // Styling fields
  fgColor: string;
  bgColor: string;
  frameText: string;
  frameColor: string;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  logoBadgeText: string;
  customLogoDataUrl: string | null;
}

export const DEFAULT_QR_CONFIG: QrDesignConfig = {
  preset: 'wifi',
  url: 'https://corpus.app',
  wifiSsid: 'Corpus_Studio_5G',
  wifiPassword: 'Corpus2026!Pro',
  wifiEncryption: 'WPA',
  vcardName: 'Kemal Yılmaz',
  vcardOrg: 'Corpus Teknoloji A.Ş.',
  vcardTitle: 'Baş Yazılım Mimarı',
  vcardPhone: '+90 532 555 01 99',
  vcardEmail: 'kemal@corpus.app',
  vcardWebsite: 'https://corpus.app',
  ibanHolder: 'CORPUS TEKNOLOJİ A.Ş.',
  ibanNumber: 'TR42 0006 1005 1978 6457 8413 26',
  ibanAmount: '1250.00',
  ibanNote: 'Fatura Odeme #005',
  waPhone: '905325550199',
  waMessage: 'Merhaba, Corpus ürün kataloğu hakkında bilgi almak istiyorum.',
  emailTo: 'iletisim@corpus.app',
  emailSubject: 'Kurumsal Teklif Talebi',
  emailBody: 'Merhaba, detayları görüşmek isteriz.',
  rawText: 'CORPUS-005-PRO-LICENSE',
  fgColor: '#09090b',
  bgColor: '#ffffff',
  frameText: 'WI-FI OTOMATİK BAĞLAN',
  frameColor: '#8b5cf6',
  errorLevel: 'H',
  logoBadgeText: 'CORPUS',
  customLogoDataUrl: null,
};

export function buildQrPayload(cfg: QrDesignConfig): string {
  switch (cfg.preset) {
    case 'url':
      return cfg.url.trim() || 'https://corpus.app';
    case 'wifi':
      return `WIFI:T:${cfg.wifiEncryption};S:${cfg.wifiSsid};P:${cfg.wifiPassword};;`;
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${cfg.vcardName}`,
        `ORG:${cfg.vcardOrg}`,
        `TITLE:${cfg.vcardTitle}`,
        `TEL;TYPE=CELL:${cfg.vcardPhone}`,
        `EMAIL:${cfg.vcardEmail}`,
        `URL:${cfg.vcardWebsite}`,
        'END:VCARD',
      ].join('\n');
    case 'iban':
      return `IBAN:${cfg.ibanNumber.replace(/\s+/g, '')}\nALICI:${cfg.ibanHolder}\nTUTAR:${cfg.ibanAmount} TL\nACIKLAMA:${cfg.ibanNote}`;
    case 'whatsapp': {
      const cleanPhone = cfg.waPhone.replace(/[^\d]/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(cfg.waMessage)}`;
    }
    case 'email':
      return `mailto:${cfg.emailTo}?subject=${encodeURIComponent(
        cfg.emailSubject
      )}&body=${encodeURIComponent(cfg.emailBody)}`;
    case 'text':
    default:
      return cfg.rawText.trim() || 'CORPUS';
  }
}

export async function renderStyledQrToCanvas(
  canvas: HTMLCanvasElement,
  cfg: QrDesignConfig,
  size = 640
): Promise<void> {
  const payload = buildQrPayload(cfg);
  const hasFrame = cfg.frameText.trim().length > 0;
  const totalW = size;
  const totalH = hasFrame ? Math.round(size * 1.18) : size;

  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Outer Frame Background
  ctx.fillStyle = hasFrame ? cfg.frameColor : cfg.bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, totalW, totalH, 36);
  ctx.fill();

  // Inner QR White Card
  const pad = hasFrame ? Math.round(size * 0.045) : 0;
  const qrBoxSize = size - pad * 2;
  ctx.fillStyle = cfg.bgColor;
  ctx.beginPath();
  ctx.roundRect(pad, pad, qrBoxSize, qrBoxSize, 24);
  ctx.fill();

  // Render QR onto temporary offscreen canvas
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, payload, {
    width: qrBoxSize - 24,
    margin: 2,
    errorCorrectionLevel: cfg.errorLevel,
    color: {
      dark: cfg.fgColor,
      light: cfg.bgColor,
    },
  });

  ctx.drawImage(qrCanvas, pad + 12, pad + 12, qrBoxSize - 24, qrBoxSize - 24);

  // Center Logo or Badge
  if (cfg.customLogoDataUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = cfg.customLogoDataUrl!;
      });
      const logoSize = Math.round(qrBoxSize * 0.21);
      const lx = pad + (qrBoxSize - logoSize) / 2;
      const ly = pad + (qrBoxSize - logoSize) / 2;

      ctx.fillStyle = cfg.bgColor;
      ctx.beginPath();
      ctx.roundRect(lx - 8, ly - 8, logoSize + 16, logoSize + 16, 16);
      ctx.fill();
      ctx.drawImage(img, lx, ly, logoSize, logoSize);
    } catch {
      // ignore
    }
  } else if (cfg.logoBadgeText.trim()) {
    const badgeW = Math.round(qrBoxSize * 0.26);
    const badgeH = Math.round(qrBoxSize * 0.1);
    const bx = pad + (qrBoxSize - badgeW) / 2;
    const by = pad + (qrBoxSize - badgeH) / 2;

    ctx.fillStyle = cfg.bgColor;
    ctx.beginPath();
    ctx.roundRect(bx - 6, by - 6, badgeW + 12, badgeH + 12, 12);
    ctx.fill();

    ctx.fillStyle = cfg.frameColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 9);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(badgeH * 0.44)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.logoBadgeText.slice(0, 8), bx + badgeW / 2, by + badgeH / 2);
  }

  // Bottom Call-to-Action Frame Banner
  if (hasFrame) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(size * 0.052)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.frameText.toUpperCase(), totalW / 2, size + (totalH - size) / 2 - 4);
  }
}

// ---------------------------------------------------------------------------
// 2. Industrial Barcode Engine (EAN-13, Code128, Code39, UPC, ITF-14)
// ---------------------------------------------------------------------------

export type BarcodeFormatType = 'EAN13' | 'CODE128' | 'CODE39' | 'UPC' | 'ITF14';

export interface BarcodeConfig {
  format: BarcodeFormatType;
  value: string;
  title: string;
  priceText: string;
  barWidth: number;
  barHeight: number;
  displayValue: boolean;
  lineColor: string;
  background: string;
}

export function generateValidTurkishEan13(): string {
  // 869 is Turkey GS1 prefix
  let base12 = '869';
  for (let i = 0; i < 9; i++) {
    base12 += Math.floor(Math.random() * 10).toString();
  }
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base12 + checkDigit.toString();
}

export function renderBarcodeCardToCanvas(
  canvas: HTMLCanvasElement,
  cfg: BarcodeConfig
): { valid: boolean; error?: string } {
  const tempCanvas = document.createElement('canvas');
  try {
    JsBarcode(tempCanvas, cfg.value.trim() || '8691234567895', {
      format: cfg.format,
      width: cfg.barWidth,
      height: cfg.barHeight,
      displayValue: cfg.displayValue,
      lineColor: cfg.lineColor,
      background: cfg.background,
      margin: 18,
      font: 'JetBrains Mono',
      fontSize: 18,
    });
  } catch {
    return {
      valid: false,
      error: `Girilen değer ${cfg.format} standardı için geçersiz uzunluk veya karakter içeriyor.`,
    };
  }

  const topExtra = cfg.title.trim() || cfg.priceText.trim() ? 66 : 0;
  canvas.width = Math.max(380, tempCanvas.width + 32);
  canvas.height = tempCanvas.height + topExtra + 24;

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = cfg.background;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
  ctx.fill();

  if (topExtra > 0) {
    ctx.fillStyle = cfg.lineColor;
    ctx.font = '700 18px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(cfg.title.slice(0, 28), 24, 20);

    if (cfg.priceText.trim()) {
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(cfg.priceText, canvas.width - 24, 18);
    }

    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(24, 52, canvas.width - 48, 1.5);
  }

  ctx.drawImage(
    tempCanvas,
    (canvas.width - tempCanvas.width) / 2,
    topExtra + 8
  );

  return { valid: true };
}

// ---------------------------------------------------------------------------
// 3. BarTender / Zebra Label Designer (Retail, Shipping Cargo, Asset Tag)
// ---------------------------------------------------------------------------

export type LabelTemplateType = 'retail-price' | 'shipping-cargo' | 'asset-tag';

export interface LabelDesignState {
  template: LabelTemplateType;
  productName: string;
  skuCode: string;
  barcodeValue: string;
  oldPrice: string;
  newPrice: string;
  qrUrl: string;
  senderName: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  cargoTrackingNo: string;
  assetDepartment: string;
  assetSerial: string;
}

export const DEFAULT_LABEL_STATE: LabelDesignState = {
  template: 'retail-price',
  productName: 'Corpus Pro Kablosuz Mekanik Klavye TR-Q',
  skuCode: 'SKU-CRP-8842',
  barcodeValue: '8690142589632',
  oldPrice: '3.499,00 TL',
  newPrice: '2.799,00 TL',
  qrUrl: 'https://corpus.app/urun/8842',
  senderName: 'CORPUS LOJİSTİK MERKEZ DEPO — İSTANBUL',
  receiverName: 'Ahmet Demir • Teknopark A.Ş.',
  receiverAddress: 'Maslak Mah. Büyükdere Cad. No: 194 Sarıyer / İSTANBUL',
  receiverPhone: '+90 532 444 00 11',
  cargoTrackingNo: 'CRP994820184TR',
  assetDepartment: 'AR-GE & BULUT ALTYAPI',
  assetSerial: 'SN-2026-X99401',
};

export async function renderIndustrialLabelToCanvas(
  canvas: HTMLCanvasElement,
  state: LabelDesignState
): Promise<void> {
  if (state.template === 'shipping-cargo') {
    // 100x150mm Thermal Shipping Label (800 x 1160 px)
    const w = 800;
    const h = 1120;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Top Header
    ctx.fillStyle = '#09090b';
    ctx.fillRect(16, 16, w - 32, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('CORPUS EXPRESS KARGO', 42, 62);

    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('STANDART / 1 DESİ', w - 42, 62);
    ctx.textAlign = 'left';

    // Sender Box
    ctx.fillStyle = '#18181b';
    ctx.font = '700 16px Inter, sans-serif';
    ctx.fillText('GÖNDERİCİ (SENDER):', 42, 145);
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillText(state.senderName, 42, 175);

    ctx.fillRect(16, 210, w - 32, 4);

    // Receiver Box
    ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText('ALICI (DELIVER TO):', 42, 250);
    ctx.font = '700 32px Inter, sans-serif';
    ctx.fillText(state.receiverName, 42, 292);

    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText(state.receiverAddress.slice(0, 46), 42, 340);
    if (state.receiverAddress.length > 46) {
      ctx.fillText(state.receiverAddress.slice(46), 42, 372);
    }

    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(`TEL: ${state.receiverPhone}`, 42, 425);

    ctx.fillRect(16, 465, w - 32, 4);

    // Barcode Section
    const bcCanvas = document.createElement('canvas');
    try {
      JsBarcode(bcCanvas, state.cargoTrackingNo || 'CRP994820184TR', {
        format: 'CODE128',
        width: 3.4,
        height: 135,
        displayValue: true,
        fontSize: 24,
        font: 'JetBrains Mono',
        margin: 10,
      });
      ctx.drawImage(bcCanvas, (w - bcCanvas.width) / 2, 500);
    } catch {
      // ignore
    }

    ctx.fillRect(16, 730, w - 32, 4);

    // Bottom QR + Routing Box
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, state.qrUrl || state.cargoTrackingNo, {
      width: 240,
      margin: 1,
    });
    ctx.drawImage(qrCanvas, 50, 775, 240, 240);

    ctx.fillStyle = '#09090b';
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillText('TAKİP & TESLİMAT ONAYI', 330, 825);
    ctx.font = '500 19px Inter, sans-serif';
    ctx.fillText('Kurye teslimatında sağdaki karekodu', 330, 868);
    ctx.fillText('el terminaline okutunuz.', 330, 898);

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3;
    ctx.strokeRect(330, 935, 410, 68);
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(`REF: ${state.skuCode}`, 355, 970);
    return;
  }

  // Retail Price Shelf Label OR Corporate Asset Tag (800 x 480 px)
  const w = 800;
  const h = 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  // Top Header Strip
  ctx.fillStyle = state.template === 'retail-price' ? '#09090b' : '#4c1d95';
  ctx.fillRect(12, 12, w - 24, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    state.template === 'retail-price'
      ? `ÜRÜN RAF ETİKETİ  •  ${state.skuCode}`
      : `KURUMSAL DEMİRBAŞ ENVANTER KARTI  •  ${state.assetDepartment}`,
    34,
    46
  );

  // Product / Asset Title
  ctx.fillStyle = '#09090b';
  ctx.font = '700 29px Inter, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(state.productName.slice(0, 38), 34, 104);

  if (state.template === 'retail-price') {
    // Old Price & Big New Price Box
    ctx.fillStyle = '#71717a';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(`ESKİ FİYAT: ${state.oldPrice}`, 34, 158);

    ctx.fillStyle = '#09090b';
    ctx.fillRect(34, 195, 430, 96);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 46px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.newPrice, 56, 244);

    ctx.fillStyle = '#52525b';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText('KDV DAHİLDİR • YERLİ ÜRETİM / GARANTİLİ', 34, 312);
  } else {
    ctx.fillStyle = '#27272a';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillText(`SERİ NO: ${state.assetSerial}`, 34, 165);
    ctx.fillText(`ENVANTER KODU: ${state.skuCode}`, 34, 208);
    ctx.fillText('BU CİHAZ CORPUS GÜVENLİK KAYITLARINDADIR.', 34, 260);
  }

  // Bottom Left Barcode
  const bcCanvas = document.createElement('canvas');
  try {
    JsBarcode(bcCanvas, state.barcodeValue || '8690142589632', {
      format: 'CODE128',
      width: 2.3,
      height: 68,
      displayValue: true,
      fontSize: 16,
      font: 'JetBrains Mono',
      margin: 4,
    });
    ctx.drawImage(bcCanvas, 34, 336);
  } catch {
    // ignore
  }

  // Right Side QR Code
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, state.qrUrl || state.barcodeValue, {
    width: 225,
    margin: 1,
  });
  ctx.drawImage(qrCanvas, w - 265, 165, 225, 225);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ÜRÜN / DETAY QR', w - 152, 410);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// 4. Batch Excel / CSV Catalog -> A4 Multi-Label Sheet PDF Generator
// ---------------------------------------------------------------------------

export interface BatchLabelRow {
  id: string;
  name: string;
  sku: string;
  price: string;
  barcode: string;
  qrLink: string;
}

export function getSampleBatchCatalog(): BatchLabelRow[] {
  return [
    { id: '1', name: 'Corpus Mekanik Klavye Pro', sku: 'CRP-101', price: '2.799 TL', barcode: '8690100200301', qrLink: 'https://corpus.app/p/101' },
    { id: '2', name: 'Corpus 4K Stüdyo Webcam', sku: 'CRP-102', price: '3.450 TL', barcode: '8690100200302', qrLink: 'https://corpus.app/p/102' },
    { id: '3', name: 'Corpus Gürültü Önleyici Kulaklık', sku: 'CRP-103', price: '4.199 TL', barcode: '8690100200303', qrLink: 'https://corpus.app/p/103' },
    { id: '4', name: 'Corpus USB-C 10Gbps Hub', sku: 'CRP-104', price: '1.150 TL', barcode: '8690100200304', qrLink: 'https://corpus.app/p/104' },
    { id: '5', name: 'Corpus NVMe 2TB Şifreli SSD', sku: 'CRP-105', price: '5.890 TL', barcode: '8690100200305', qrLink: 'https://corpus.app/p/105' },
    { id: '6', name: 'Corpus Ergonomik Dikey Mouse', sku: 'CRP-106', price: '1.690 TL', barcode: '8690100200306', qrLink: 'https://corpus.app/p/106' },
    { id: '7', name: 'Corpus Kondenser Stüdyo Mikrofon', sku: 'CRP-107', price: '3.290 TL', barcode: '8690100200307', qrLink: 'https://corpus.app/p/107' },
    { id: '8', name: 'Corpus Akıllı Masa Lambası LED', sku: 'CRP-108', price: '1.490 TL', barcode: '8690100200308', qrLink: 'https://corpus.app/p/108' },
    { id: '9', name: 'Corpus Alüminyum Laptop Standı', sku: 'CRP-109', price: '980 TL', barcode: '8690100200309', qrLink: 'https://corpus.app/p/109' },
    { id: '10', name: 'Corpus 140W GaN Hızlı Şarj', sku: 'CRP-110', price: '2.100 TL', barcode: '8690100200310', qrLink: 'https://corpus.app/p/110' },
    { id: '11', name: 'Corpus ThunderBolt 4 Kablo 2m', sku: 'CRP-111', price: '790 TL', barcode: '8690100200311', qrLink: 'https://corpus.app/p/111' },
    { id: '12', name: 'Corpus RFID Korumalı Kartlık', sku: 'CRP-112', price: '650 TL', barcode: '8690100200312', qrLink: 'https://corpus.app/p/112' },
  ];
}

export async function parseBatchExcelFile(file: File): Promise<BatchLabelRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

  const items: BatchLabelRow[] = [];
  const startRow =
    rawRows.length > 1 && /urun|ad|name|sku|fiyat|price/i.test(String(rawRows[0]?.[0] || ''))
      ? 1
      : 0;

  for (let i = startRow; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || r.every((c) => !String(c).trim())) continue;
    items.push({
      id: `row-${i}`,
      name: String(r[0] || `Ürün #${i}`),
      sku: String(r[1] || `SKU-${100 + i}`),
      price: String(r[2] || '990 TL'),
      barcode: String(r[3] || `8690100200${String(i).padStart(3, '0')}`),
      qrLink: String(r[4] || `https://corpus.app/p/${100 + i}`),
    });
  }

  return items;
}

export async function exportBatchCatalogToA4Pdf(rows: BatchLabelRow[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Corpus Toplu A4 Etiket Baski Sayfasi.pdf');
  pdfDoc.setCreator('Corpus Label & QR Studio Pro (#005)');

  const a4W = 595.28;
  const a4H = 841.89;
  const scale = 2; // High-DPI Retina canvas

  const cols = 3;
  const rowsPerCol = 4;
  const labelsPerPage = cols * rowsPerCol; // 12 labels per A4 sheet
  const totalPages = Math.max(1, Math.ceil(rows.length / labelsPerPage));

  for (let p = 0; p < totalPages; p++) {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = Math.round(a4W * scale);
    pageCanvas.height = Math.round(a4H * scale);
    const ctx = pageCanvas.getContext('2d')!;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, a4W, a4H);

    const marginX = 24;
    const marginY = 28;
    const gapX = 10;
    const gapY = 10;
    const cellW = (a4W - marginX * 2 - gapX * (cols - 1)) / cols;
    const cellH = (a4H - marginY * 2 - gapY * (rowsPerCol - 1)) / rowsPerCol;

    const slice = rows.slice(p * labelsPerPage, (p + 1) * labelsPerPage);

    for (let idx = 0; idx < slice.length; idx++) {
      const item = slice[idx];
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = marginX + c * (cellW + gapX);
      const y = marginY + r * (cellH + gapY);

      // Dashed cut border
      ctx.save();
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, cellW, cellH);
      ctx.restore();

      // Top dark SKU bar
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x + 4, y + 4, cellW - 8, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.sku, x + 10, y + 15);

      // Product Name
      ctx.fillStyle = '#09090b';
      ctx.font = '700 11px Inter, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(item.name.slice(0, 24), x + 8, y + 34);

      // Price
      ctx.fillStyle = '#09090b';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillText(item.price, x + 8, y + 54);

      // Barcode
      const bc = document.createElement('canvas');
      try {
        JsBarcode(bc, item.barcode, {
          format: 'CODE128',
          width: 1.4,
          height: 36,
          displayValue: true,
          fontSize: 11,
          margin: 2,
        });
        ctx.drawImage(bc, x + 6, y + cellH - 64, Math.min(cellW - 68, 110), 54);
      } catch {
        // ignore
      }

      // Mini QR Code
      const qr = document.createElement('canvas');
      await QRCode.toCanvas(qr, item.qrLink || item.barcode, {
        width: 56,
        margin: 1,
      });
      ctx.drawImage(qr, x + cellW - 60, y + cellH - 62, 52, 52);
    }

    const jpgUrl = pageCanvas.toDataURL('image/jpeg', 0.94);
    const base64 = jpgUrl.split(',')[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const embedded = await pdfDoc.embedJpg(bytes);
    const pdfPage = pdfDoc.addPage([a4W, a4H]);
    pdfPage.drawImage(embedded, { x: 0, y: 0, width: a4W, height: a4H });
  }

  return await pdfDoc.save();
}

export async function canvasToPdfBytes(
  canvas: HTMLCanvasElement,
  pageW = 595.28,
  pageH = 841.89
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64 = jpgUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const embedded = await pdfDoc.embedJpg(bytes);
  const page = pdfDoc.addPage([pageW, pageH]);
  const scale = Math.min((pageW - 48) / embedded.width, (pageH - 48) / embedded.height);
  const dw = embedded.width * scale;
  const dh = embedded.height * scale;

  page.drawImage(embedded, {
    x: (pageW - dw) / 2,
    y: (pageH - dh) / 2,
    width: dw,
    height: dh,
  });

  return await pdfDoc.save();
}
