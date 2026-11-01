import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export type QrMode = 'vcard' | 'wifi' | 'url' | 'whatsapp' | 'iban' | 'location';
export type CardLayoutType = 'business-card' | 'stand-vertical' | 'qr-badge';
export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface VCardFields {
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface WifiFields {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface WhatsappFields {
  phone: string;
  message: string;
}

export interface IbanFields {
  holderName: string;
  iban: string;
  bankName: string;
  note: string;
}

export interface LocationFields {
  placeName: string;
  latitude: string;
  longitude: string;
}

export interface QrStudioConfig {
  mode: QrMode;
  layout: CardLayoutType;
  ecc: ErrorCorrection;
  fgColor: string;
  bgColor: string;
  accentColor: string;
  darkCardTheme: boolean;
  centerBadgeText: string;
  showCenterBadge: boolean;
  headline: string;
  subheadline: string;
  footerCallout: string;
  urlValue: string;
  vcard: VCardFields;
  wifi: WifiFields;
  whatsapp: WhatsappFields;
  iban: IbanFields;
  location: LocationFields;
}

export const DEFAULT_QR_CONFIG: QrStudioConfig = {
  mode: 'vcard',
  layout: 'business-card',
  ecc: 'H',
  fgColor: '#0f172a',
  bgColor: '#ffffff',
  accentColor: '#7c3aed',
  darkCardTheme: true,
  centerBadgeText: 'CRP',
  showCenterBadge: true,
  headline: 'Kameranızla Okutun',
  subheadline: 'Rehbere Tek Tıkla Kaydet • Dijital vCard 3.0',
  footerCallout: 'Corpus QR & Digital Card Studio (#017)',
  urlValue: 'https://corpus.studio/menu',
  vcard: {
    fullName: 'Ahmet Yılmaz',
    jobTitle: 'Kurucu Ortak & Baş Mimar',
    company: 'Corpus Teknoloji A.Ş.',
    phone: '+90 532 410 88 90',
    email: 'ahmet@corpustech.com.tr',
    website: 'https://corpustech.com.tr',
    address: 'Maslak Mah. Büyükdere Cad. No:194 Sarıyer / İstanbul',
  },
  wifi: {
    ssid: 'Corpus_Guest_5G',
    password: 'Corpus2026!Fast',
    encryption: 'WPA',
    hidden: false,
  },
  whatsapp: {
    phone: '905324108890',
    message: 'Merhaba, Corpus Kurumsal çözümleri hakkında bilgi almak istiyorum.',
  },
  iban: {
    holderName: 'Corpus Teknoloji ve Yazılım A.Ş.',
    iban: 'TR33 0006 1005 1978 6457 8413 26',
    bankName: 'Garanti BBVA Kurumsal',
    note: 'Hizmet Bedeli Ödemesi',
  },
  location: {
    placeName: 'Corpus Teknoloji Genel Müdürlük (Maslak)',
    latitude: '41.1124',
    longitude: '29.0212',
  },
};

export const COLOR_THEMES = [
  { name: 'Corpus Violet', accent: '#7c3aed', fg: '#1e1b4b' },
  { name: 'Siber Mavi', accent: '#2563eb', fg: '#0f172a' },
  { name: 'Zümrüt Yeşili', accent: '#059669', fg: '#064e3b' },
  { name: 'Kehribar Altın', accent: '#d97706', fg: '#451a03' },
  { name: 'Yakut Kırmızı', accent: '#dc2626', fg: '#450a0a' },
  { name: 'Klasik Siyah', accent: '#3f3f46', fg: '#09090b' },
];

/** Build standardized QR payload string for the active mode */
export function buildQrPayload(config: QrStudioConfig): string {
  switch (config.mode) {
    case 'vcard': {
      const v = config.vcard;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${v.fullName}`,
        `ORG:${v.company}`,
        `TITLE:${v.jobTitle}`,
        `TEL;TYPE=CELL:${v.phone}`,
        `EMAIL:${v.email}`,
        `URL:${v.website}`,
        `ADR;TYPE=WORK:;;${v.address};;;;`,
        'END:VCARD',
      ].join('\n');
    }
    case 'wifi': {
      const w = config.wifi;
      const esc = (s: string) => s.replace(/([\\;,:])/g, '\\$1');
      return `WIFI:T:${w.encryption};S:${esc(w.ssid)};P:${esc(w.password)};H:${
        w.hidden ? 'true' : 'false'
      };;`;
    }
    case 'whatsapp': {
      const cleanPhone = config.whatsapp.phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(config.whatsapp.message);
      return `https://wa.me/${cleanPhone}?text=${text}`;
    }
    case 'iban': {
      const i = config.iban;
      return `IBAN:${i.iban.replace(/\s+/g, '')}\nALICI:${i.holderName}\nBANKA:${i.bankName}\nACIKLAMA:${i.note}`;
    }
    case 'location': {
      const loc = config.location;
      return `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
    }
    case 'url':
    default:
      return config.urlValue.trim() || 'https://corpus.studio';
  }
}

/** Download standalone .vcf vCard file */
export function downloadVcfFile(vcard: VCardFields) {
  const content = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vcard.fullName}`,
    `ORG:${vcard.company}`,
    `TITLE:${vcard.jobTitle}`,
    `TEL;TYPE=CELL:${vcard.phone}`,
    `EMAIL:${vcard.email}`,
    `URL:${vcard.website}`,
    `ADR;TYPE=WORK:;;${vcard.address};;;;`,
    'END:VCARD',
  ].join('\r\n');
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${vcard.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'kartvizit'}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export pure vector SVG QR code */
export async function exportQrToSvg(config: QrStudioConfig): Promise<void> {
  const payload = buildQrPayload(config);
  const svgString = await QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: config.ecc,
    margin: 2,
    color: {
      dark: config.fgColor,
      light: config.bgColor,
    },
  });
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corpus-qr-${config.mode}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Render the complete QR Card / Stand / Badge onto HTML5 Canvas */
export async function renderQrStudioToCanvas(
  canvas: HTMLCanvasElement,
  config: QrStudioConfig
): Promise<void> {
  const payload = buildQrPayload(config);

  // Generate offscreen QR canvas first
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, payload, {
    width: 540,
    margin: 2,
    errorCorrectionLevel: config.ecc,
    color: {
      dark: config.fgColor,
      light: config.bgColor,
    },
  });

  // Draw optional center monogram badge onto qrCanvas
  if (config.showCenterBadge && config.centerBadgeText.trim()) {
    const qctx = qrCanvas.getContext('2d');
    if (qctx) {
      const bSize = 104;
      const bx = (qrCanvas.width - bSize) / 2;
      const by = (qrCanvas.height - bSize) / 2;

      qctx.fillStyle = '#ffffff';
      qctx.beginPath();
      qctx.roundRect(bx - 5, by - 5, bSize + 10, bSize + 10, 22);
      qctx.fill();

      qctx.fillStyle = config.accentColor;
      qctx.beginPath();
      qctx.roundRect(bx, by, bSize, bSize, 18);
      qctx.fill();

      qctx.fillStyle = '#ffffff';
      qctx.font = 'bold 30px JetBrains Mono, monospace';
      qctx.textAlign = 'center';
      qctx.fillText(
        config.centerBadgeText.slice(0, 4).toUpperCase(),
        qrCanvas.width / 2,
        qrCanvas.height / 2 + 11
      );
    }
  }

  // Layout 1: Pure Square QR Badge (1000x1000)
  if (config.layout === 'qr-badge') {
    const size = 1000;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = config.darkCardTheme ? '#09090d' : '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(90, 90, size - 180, size - 180, 42);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrCanvas, 150, 130, 700, 700);

    ctx.fillStyle = config.fgColor;
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.headline, size / 2, 875);
    return;
  }

  // Layout 2: Horizontal Executive Business / vCard / Wi-Fi Card (1400 x 800)
  if (config.layout === 'business-card') {
    const width = 1400;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card Background
    ctx.fillStyle = config.darkCardTheme ? '#0c0c12' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top & Left Accent Bar
    ctx.fillStyle = config.accentColor;
    ctx.fillRect(0, 0, 18, height);
    ctx.fillRect(0, 0, width, 10);

    // Subtle decorative glow circle
    const grad = ctx.createRadialGradient(1100, 400, 40, 1100, 400, 480);
    grad.addColorStop(0, `${config.accentColor}33`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const textPrimary = config.darkCardTheme ? '#f4f4f5' : '#0f172a';
    const textMuted = config.darkCardTheme ? '#a1a1aa' : '#475569';

    // Mode Badge Pill
    ctx.fillStyle = config.accentColor;
    ctx.beginPath();
    ctx.roundRect(72, 68, 260, 38, 19);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.fillText(`● CORPUS ${config.mode.toUpperCase()} KARTI`, 92, 92);

    // Left Side Details depending on mode
    if (config.mode === 'vcard') {
      const v = config.vcard;
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 46px Inter, system-ui, sans-serif';
      ctx.fillText(v.fullName, 72, 185);

      ctx.fillStyle = config.accentColor;
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText(`${v.jobTitle}  •  ${v.company}`, 72, 228);

      const details = [
        `📞  Telefon:  ${v.phone}`,
        `✉️  E-Posta:  ${v.email}`,
        `🌐  Web:      ${v.website}`,
        `📍  Adres:    ${v.address.slice(0, 52)}`,
      ];
      ctx.fillStyle = textPrimary;
      ctx.font = '21px Inter, system-ui, sans-serif';
      details.forEach((line, i) => {
        ctx.fillText(line, 72, 320 + i * 56);
      });
    } else if (config.mode === 'wifi') {
      const w = config.wifi;
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.fillText('Misafir Wi-Fi Kablosuz Ağ', 72, 185);

      ctx.fillStyle = textMuted;
      ctx.font = '22px Inter, system-ui, sans-serif';
      ctx.fillText('Kameranızla QR kodu okutarak şifre yazmadan bağlanın', 72, 230);

      ctx.fillStyle = config.darkCardTheme ? '#161622' : '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(72, 280, 680, 210, 20);
      ctx.fill();

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 16px JetBrains Mono, monospace';
      ctx.fillText('AĞ ADI (SSID)', 104, 330);
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 30px JetBrains Mono, monospace';
      ctx.fillText(w.ssid, 104, 370);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 16px JetBrains Mono, monospace';
      ctx.fillText('AĞ ŞİFRESİ (PASSWORD)', 104, 422);
      ctx.fillStyle = config.accentColor;
      ctx.font = 'bold 28px JetBrains Mono, monospace';
      ctx.fillText(w.password || 'Şifresiz Açık Ağ', 104, 460);
    } else if (config.mode === 'iban') {
      const ib = config.iban;
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 40px Inter, system-ui, sans-serif';
      ctx.fillText(ib.holderName, 72, 185);

      ctx.fillStyle = config.accentColor;
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText(`${ib.bankName}  •  FAST / Havale / EFT`, 72, 230);

      ctx.fillStyle = config.darkCardTheme ? '#161622' : '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(72, 285, 720, 170, 18);
      ctx.fill();

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.fillText('TR IBAN NUMARASI', 100, 330);

      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 25px JetBrains Mono, monospace';
      ctx.fillText(ib.iban, 100, 375);

      ctx.fillStyle = textMuted;
      ctx.font = '18px Inter, system-ui, sans-serif';
      ctx.fillText(`Açıklama: ${ib.note}`, 100, 422);
    } else {
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.fillText(config.headline, 72, 200);

      ctx.fillStyle = textMuted;
      ctx.font = '24px Inter, system-ui, sans-serif';
      ctx.fillText(config.subheadline, 72, 255);

      ctx.fillStyle = config.accentColor;
      ctx.font = 'bold 20px JetBrains Mono, monospace';
      ctx.fillText(payload.slice(0, 56), 72, 340);
    }

    // Bottom Callout
    ctx.fillStyle = textMuted;
    ctx.font = '16px JetBrains Mono, monospace';
    ctx.fillText(config.footerCallout, 72, height - 48);

    // Right QR Container Card
    const qrBoxSize = 470;
    const qrBoxX = width - qrBoxSize - 80;
    const qrBoxY = (height - qrBoxSize) / 2 - 15;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 52, 28);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrCanvas, qrBoxX + 25, qrBoxY + 20, qrBoxSize - 50, qrBoxSize - 50);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.headline, qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 24);
    ctx.textAlign = 'left';
    return;
  }

  // Layout 3: Printable Vertical Table Stand (1000 x 1400)
  const width = 1000;
  const height = 1400;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = config.darkCardTheme ? '#0b0b12' : '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = config.accentColor;
  ctx.fillRect(0, 0, width, 24);

  const textPrimary = config.darkCardTheme ? '#ffffff' : '#0f172a';
  const textMuted = config.darkCardTheme ? '#a1a1aa' : '#475569';

  ctx.textAlign = 'center';
  ctx.fillStyle = config.accentColor;
  ctx.font = 'bold 20px JetBrains Mono, monospace';
  ctx.fillText(`CORPUS ${config.mode.toUpperCase()} STANDI`, width / 2, 110);

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 48px Inter, system-ui, sans-serif';
  ctx.fillText(config.headline, width / 2, 180);

  ctx.fillStyle = textMuted;
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.fillText(config.subheadline, width / 2, 230);

  // Center Giant QR Frame
  const boxSize = 680;
  const bx = (width - boxSize) / 2;
  const by = 290;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = config.accentColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxSize, boxSize, 36);
  ctx.fill();
  ctx.stroke();

  ctx.drawImage(qrCanvas, bx + 40, by + 40, boxSize - 80, boxSize - 80);

  // Info Box Below QR
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  const bottomTitle =
    config.mode === 'wifi'
      ? `Ağ: ${config.wifi.ssid}   |   Şifre: ${config.wifi.password}`
      : config.mode === 'vcard'
      ? `${config.vcard.fullName} — ${config.vcard.company}`
      : config.mode === 'iban'
      ? config.iban.iban
      : config.urlValue;
  ctx.fillText(bottomTitle.slice(0, 48), width / 2, 1075);

  ctx.fillStyle = textMuted;
  ctx.font = '18px JetBrains Mono, monospace';
  ctx.fillText(config.footerCallout, width / 2, 1320);
  ctx.textAlign = 'left';
}

export function exportQrCanvasToPng(canvas: HTMLCanvasElement, mode: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corpus-qr-${mode}-4k.png`;
  a.click();
}

export function exportQrCanvasToPdf(
  canvas: HTMLCanvasElement,
  config: QrStudioConfig
) {
  const isLandscape = config.layout === 'business-card';
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  if (isLandscape) {
    pdf.addImage(imgData, 'JPEG', 18, 25, 260, 148);
  } else {
    pdf.addImage(imgData, 'JPEG', 15, 15, 180, 252);
  }
  pdf.save(`corpus-qr-${config.mode}-baski.pdf`);
}
