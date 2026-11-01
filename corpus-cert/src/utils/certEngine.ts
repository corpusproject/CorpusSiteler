import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export type CertTemplateKey =
  | 'academy-diploma'
  | 'cyber-security'
  | 'executive-award'
  | 'workshop-attendance';

export interface CertConfig {
  templateKey: CertTemplateKey;
  institutionName: string;
  institutionSub: string;
  headerTitle: string;
  preRecipientText: string;
  recipientName: string;
  batchRecipients: string[];
  programTitle: string;
  achievementDescription: string;
  issueDate: string;
  durationHours: string;
  serialPrefix: string;
  verifyBaseUrl: string;
  signer1Name: string;
  signer1Role: string;
  signer2Name: string;
  signer2Role: string;
  sealTitle: string;
  sealSub: string;
  darkPrestigeTheme: boolean;
  primaryGold: string;
  accentBorder: string;
  showQrVerification: boolean;
  showGoldRibbonSeal: boolean;
}

export const CERT_TEMPLATES: Record<
  CertTemplateKey,
  { name: string; build: () => CertConfig }
> = {
  'academy-diploma': {
    name: 'Yazılım & Akademi Uzmanlık Diploması',
    build: () => ({
      templateKey: 'academy-diploma',
      institutionName: 'CORPUS TEKNOLOJİ AKADEMİSİ',
      institutionSub: 'ULUSLARARASI YAZILIM MÜHENDİSLİĞİ VE BULUT ENSTİTÜSÜ',
      headerTitle: 'ÜSTÜN BAŞARI VE UZMANLIK SERTİFİKASI',
      preRecipientText: 'İşbu resmi yeterlilik belgesi, tüm sınav ve projeleri başarıyla tamamlayan',
      recipientName: 'Zeynep Karahan',
      batchRecipients: [
        'Zeynep Karahan',
        'Ahmet Yılmaz',
        'Deniz Arslan',
        'Kerem Soylu',
        'Elif Aydın',
      ],
      programTitle: 'Kurumsal Bulut Mimarisi, DevSecOps & Dağıtık Sistemler Uzmanlığı',
      achievementDescription:
        'Toplam 180 saatlik ileri seviye laboratuvar eğitimini, bitirme projesini ve güvenlik denetimlerini %98 başarı ortalamasıyla tamamlayarak bu unvanı almaya hak kazanmıştır.',
      issueDate: '2026-10-17',
      durationHours: '180 Saat (AKTS: 12 Kredi)',
      serialPrefix: 'CRP-2026-840',
      verifyBaseUrl: 'https://verify.corpus.studio/cert/',
      signer1Name: 'Prof. Dr. Selim Erdem',
      signer1Role: 'Akademik Kurul Başkanı',
      signer2Name: 'Ahmet Yılmaz',
      signer2Role: 'Corpus Teknoloji Yönetim Kurulu Bşk.',
      sealTitle: 'ONAYLI AKADEMİ MÜHRÜ',
      sealSub: 'ISO 29993 AKREDİTE',
      darkPrestigeTheme: false,
      primaryGold: '#b45309',
      accentBorder: '#1e3a8a',
      showQrVerification: true,
      showGoldRibbonSeal: true,
    }),
  },
  'cyber-security': {
    name: 'Siber Güvenlik & Kriptografi Sertifikası',
    build: () => ({
      templateKey: 'cyber-security',
      institutionName: 'CORPUS CYBER DEFENSE LABS',
      institutionSub: 'ZERO-KNOWLEDGE SECURITY & CRYPTOGRAPHY BOARD',
      headerTitle: 'CERTIFIED ZERO-KNOWLEDGE ARCHITECT',
      preRecipientText: 'Siber güvenlik ve kriptografik mimari sınavlarını başarıyla geçen',
      recipientName: 'Murat Demir',
      batchRecipients: ['Murat Demir', 'Selin Kaya', 'Caner Özkan'],
      programTitle: 'Offensive Security, WebCrypto AES-256 & PenTest Masterclass',
      achievementDescription:
        'Uygulamalı sızma testi, kriptografik anahtar yönetimi ve sıfır-güven (Zero-Trust) ağ mimarisi senaryolarını eksiksiz tamamlamıştır.',
      issueDate: '2026-10-17',
      durationHours: '120 Saat Uygulamalı Lab',
      serialPrefix: 'SEC-2026-910',
      verifyBaseUrl: 'https://verify.corpus.studio/sec/',
      signer1Name: 'Dr. Emre Kılıç',
      signer1Role: 'Baş Kriptografi Uzmanı',
      signer2Name: 'Ahmet Yılmaz',
      signer2Role: 'Güvenlik Kurulu Direktörü',
      sealTitle: 'CYBER DEFENSE SEAL',
      sealSub: 'SHA-256 VERIFIED',
      darkPrestigeTheme: true,
      primaryGold: '#f59e0b',
      accentBorder: '#7c3aed',
      showQrVerification: true,
      showGoldRibbonSeal: true,
    }),
  },
  'executive-award': {
    name: 'Yılın Liderlik & Başarı Beratı',
    build: () => ({
      templateKey: 'executive-award',
      institutionName: 'CORPUS GLOBAL ENTERPRISE AWARDS',
      institutionSub: 'YILLIK İNOVASYON VE LİDERLİK ÖDÜLLERİ KOMİTESİ',
      headerTitle: 'ÜSTÜN LİDERLİK VE İNOVASYON BERATI',
      preRecipientText: '2026 yılı kurumsal dönüşüm ve mühendislik vizyonuna katkılarından dolayı',
      recipientName: 'Elif Aydın',
      batchRecipients: ['Elif Aydın', 'Burak Şahin'],
      programTitle: 'Yılın Dijital Dönüşüm ve Teknoloji Lideri Ödülü',
      achievementDescription:
        'Kurumsal yazılım ekosisteminin modernizasyonu ve yüksek erişilebilirlik standartlarının oluşturulmasındaki olağanüstü liderliği nedeniyle takdim edilmiştir.',
      issueDate: '2026-10-17',
      durationHours: '2026 Onur Ödülü',
      serialPrefix: 'AWD-2026-100',
      verifyBaseUrl: 'https://verify.corpus.studio/award/',
      signer1Name: 'Hakan Çelik',
      signer1Role: 'Jüri Heyeti Başkanı',
      signer2Name: 'Ahmet Yılmaz',
      signer2Role: 'Corpus Grup İcra Kurulu Bşk.',
      sealTitle: 'EXECUTIVE EXCELLENCE',
      sealSub: '2026 HONORS',
      darkPrestigeTheme: true,
      primaryGold: '#eab308',
      accentBorder: '#059669',
      showQrVerification: true,
      showGoldRibbonSeal: true,
    }),
  },
  'workshop-attendance': {
    name: 'Zirve & Eğitim Katılım Belgesi',
    build: () => ({
      templateKey: 'workshop-attendance',
      institutionName: 'CORPUS DEVELOPER SUMMIT 2026',
      institutionSub: 'İSTANBUL ULUSLARARASI YAZILIM VE YAPAY ZEKA ZİRVESİ',
      headerTitle: 'RESMİ KATILIM VE TAMAMLAMA BELGESİ',
      preRecipientText: 'Düzenlenen uluslararası teknoloji zirvesi ve atölye oturumlarına katılan',
      recipientName: 'Deniz Arslan',
      batchRecipients: ['Deniz Arslan', 'Merve Koç', 'Oğuzhan Yıldız'],
      programTitle: 'Üretken Yapay Zeka, LLM Ajanları ve Modern Web Mimarileri Zirvesi',
      achievementDescription:
        'Zirve kapsamındaki tüm teknik oturumlara ve uygulamalı kodlama atölyelerine aktif katılım sağlamıştır.',
      issueDate: '2026-10-17',
      durationHours: '24 Saat Zirve Programı',
      serialPrefix: 'SUM-2026-500',
      verifyBaseUrl: 'https://verify.corpus.studio/summit/',
      signer1Name: 'Selin Kaya',
      signer1Role: 'Zirve Koordinatörü',
      signer2Name: 'Ahmet Yılmaz',
      signer2Role: 'Topluluk Direktörü',
      sealTitle: 'SUMMIT 2026 OFFICIAL',
      sealSub: 'VERIFIED BADGE',
      darkPrestigeTheme: false,
      primaryGold: '#d97706',
      accentBorder: '#0284c7',
      showQrVerification: true,
      showGoldRibbonSeal: true,
    }),
  },
};

export const DEFAULT_CERT_CONFIG: CertConfig =
  CERT_TEMPLATES['academy-diploma'].build();

/** Wrap centered paragraph lines on canvas */
function drawCenteredWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), centerX, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), centerX, y);
    y += lineHeight;
  }
  return y;
}

/** Render A4 Landscape Certificate (1600 x 1131 px) for a specific recipient & index */
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  cfg: CertConfig,
  recipientOverride?: string,
  serialIndex = 1
): Promise<void> {
  const width = 1600;
  const height = 1131;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const recipient = recipientOverride || cfg.recipientName || 'Katılımcı Adı';
  const serialCode = `${cfg.serialPrefix}${String(serialIndex).padStart(2, '0')}`;

  // 1. Background Surface
  ctx.fillStyle = cfg.darkPrestigeTheme ? '#0b0b12' : '#fffdf9';
  ctx.fillRect(0, 0, width, height);

  // Subtle Radial Center Glow
  const rad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    60,
    width / 2,
    height / 2,
    780
  );
  rad.addColorStop(
    0,
    cfg.darkPrestigeTheme ? 'rgba(124,58,237,0.12)' : 'rgba(245,158,11,0.07)'
  );
  rad.addColorStop(1, 'transparent');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ornate Double Guilloche-Style Frame Borders
  ctx.strokeStyle = cfg.accentBorder;
  ctx.lineWidth = 10;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.strokeStyle = cfg.primaryGold;
  ctx.lineWidth = 3;
  ctx.strokeRect(62, 62, width - 124, height - 124);

  // Corner Ornaments
  const corners = [
    [62, 62],
    [width - 62, 62],
    [62, height - 62],
    [width - 62, height - 62],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = cfg.primaryGold;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  const textPrimary = cfg.darkPrestigeTheme ? '#f8fafc' : '#0f172a';
  const textMuted = cfg.darkPrestigeTheme ? '#94a3b8' : '#475569';

  // 3. Top Serial & Credit Metadata
  ctx.fillStyle = textMuted;
  ctx.font = 'bold 15px JetBrains Mono, monospace';
  ctx.fillText(`BELGE NO: ${serialCode}`, 96, 112);

  ctx.textAlign = 'right';
  ctx.fillText(`TARİH: ${cfg.issueDate}  |  KAPSAM: ${cfg.durationHours}`, width - 96, 112);

  // 4. Institution Header
  ctx.textAlign = 'center';
  ctx.fillStyle = cfg.accentBorder;
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.fillText(cfg.institutionName, width / 2, 168);

  ctx.fillStyle = textMuted;
  ctx.font = '600 14px JetBrains Mono, monospace';
  ctx.fillText(cfg.institutionSub, width / 2, 196);

  // Main Certificate Banner Title
  ctx.fillStyle = cfg.primaryGold;
  ctx.font = 'bold 44px Inter, system-ui, sans-serif';
  ctx.fillText(cfg.headerTitle, width / 2, 272);

  // Decorative Gold Divider Line
  ctx.strokeStyle = cfg.primaryGold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 280, 298);
  ctx.lineTo(width / 2 + 280, 298);
  ctx.stroke();

  // Pre-recipient text
  ctx.fillStyle = textMuted;
  ctx.font = 'italic 20px Inter, system-ui, sans-serif';
  ctx.fillText(cfg.preRecipientText, width / 2, 352);

  // 5. Recipient Name (Grand Highlight)
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(recipient, width / 2, 442);

  // Underline beneath Recipient Name
  const nameW = Math.max(420, ctx.measureText(recipient).width + 80);
  ctx.strokeStyle = cfg.accentBorder;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameW / 2, 466);
  ctx.lineTo(width / 2 + nameW / 2, 466);
  ctx.stroke();

  // 6. Program Title & Achievement Paragraph
  ctx.fillStyle = cfg.accentBorder;
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillText(cfg.programTitle, width / 2, 532);

  ctx.fillStyle = textPrimary;
  ctx.font = '20px Inter, system-ui, sans-serif';
  drawCenteredWrappedText(
    ctx,
    cfg.achievementDescription,
    width / 2,
    584,
    1140,
    32
  );

  // 7. Bottom Section: Left Signer, Center Gold Foil Seal, Right Signer, and QR Code
  const sigY = 850;

  // Signer 1 (Left)
  const s1X = 290;
  ctx.save();
  ctx.strokeStyle = cfg.accentBorder;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s1X - 90, sigY - 25);
  ctx.bezierCurveTo(s1X - 40, sigY - 75, s1X + 20, sigY + 10, s1X + 95, sigY - 45);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = textMuted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s1X - 140, sigY);
  ctx.lineTo(s1X + 140, sigY);
  ctx.stroke();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText(cfg.signer1Name, s1X, sigY + 32);
  ctx.fillStyle = textMuted;
  ctx.font = '15px Inter, sans-serif';
  ctx.fillText(cfg.signer1Role, s1X, sigY + 56);

  // Signer 2 (Right)
  const s2X = width - 430;
  ctx.save();
  ctx.strokeStyle = cfg.accentBorder;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s2X - 85, sigY - 20);
  ctx.bezierCurveTo(s2X - 20, sigY - 70, s2X + 35, sigY + 5, s2X + 100, sigY - 50);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = textMuted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s2X - 140, sigY);
  ctx.lineTo(s2X + 140, sigY);
  ctx.stroke();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText(cfg.signer2Name, s2X, sigY + 32);
  ctx.fillStyle = textMuted;
  ctx.font = '15px Inter, sans-serif';
  ctx.fillText(cfg.signer2Role, s2X, sigY + 56);

  // Center Gold Foil Rosette Ribbon Seal
  if (cfg.showGoldRibbonSeal) {
    const sealX = width / 2 - 70;
    const sealY = sigY - 10;

    // Hanging Ribbons
    ctx.fillStyle = cfg.accentBorder;
    ctx.beginPath();
    ctx.moveTo(sealX - 28, sealY + 55);
    ctx.lineTo(sealX - 52, sealY + 155);
    ctx.lineTo(sealX - 22, sealY + 138);
    ctx.lineTo(sealX - 4, sealY + 162);
    ctx.lineTo(sealX - 4, sealY + 55);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sealX + 28, sealY + 55);
    ctx.lineTo(sealX + 52, sealY + 155);
    ctx.lineTo(sealX + 22, sealY + 138);
    ctx.lineTo(sealX + 4, sealY + 162);
    ctx.lineTo(sealX + 4, sealY + 55);
    ctx.fill();

    // Serrated Gold Foil Starburst Circle
    ctx.save();
    ctx.translate(sealX, sealY);
    const spikes = 28;
    const outerR = 88;
    const innerR = 78;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = cfg.primaryGold;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 64, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText(cfg.sealTitle.slice(0, 22), 0, -10);
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('★ ★ ★', 0, 12);
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(cfg.sealSub.slice(0, 20), 0, 32);
    ctx.restore();
  }

  // Far Right Verification QR Code Box
  if (cfg.showQrVerification) {
    const qrCanvas = document.createElement('canvas');
    const verifyUrl = `${cfg.verifyBaseUrl}${serialCode}?name=${encodeURIComponent(
      recipient
    )}`;
    await QRCode.toCanvas(qrCanvas, verifyUrl, {
      width: 148,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qx = width - 245;
    const qy = sigY - 95;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = cfg.primaryGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qx - 8, qy - 8, 164, 188, 12);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrCanvas, qx, qy, 148, 148);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(serialCode, qx + 74, qy + 168);
  }

  ctx.textAlign = 'left';
}

export function exportSingleCertPng(canvas: HTMLCanvasElement, recipient: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sertifika-${recipient.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  a.click();
}

/** Export Single or Entire Batch of Recipients into a Multi-Page A4 Landscape PDF */
export async function exportCertificatesToPdf(
  canvas: HTMLCanvasElement,
  cfg: CertConfig,
  batchMode: boolean
): Promise<void> {
  const list =
    batchMode && cfg.batchRecipients.length > 0
      ? cfg.batchRecipients
      : [cfg.recipientName];

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < list.length; i++) {
    if (i > 0) pdf.addPage('a4', 'landscape');
    await renderCertificateToCanvas(canvas, cfg, list[i], i + 1);
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
  }

  // Restore preview to current active recipient
  await renderCertificateToCanvas(canvas, cfg, cfg.recipientName, 1);

  const suffix = batchMode ? `toplu-${list.length}-kisi` : cfg.recipientName;
  pdf.save(
    `corpus-sertifika-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
  );
}
