import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

export type DocumentKind = 'invoice' | 'proforma-quote' | 'freelance-makbuz';
export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';
export type TevkifatRate = 'none' | '9/10' | '7/10' | '5/10' | '4/10' | '2/10';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPct: number;
  vatRate: number; // 0, 1, 10, 20
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  partyName: string;
  docNo: string;
  amount: number;
  currency: CurrencyCode;
  status: 'paid' | 'pending' | 'overdue';
}

export interface InvoiceDocumentData {
  kind: DocumentKind;
  accentColor: string;
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  tevkifat: TevkifatRate;
  sender: {
    companyName: string;
    taxOffice: string;
    taxNo: string;
    address: string;
    email: string;
    phone: string;
    iban: string;
    bankName: string;
  };
  client: {
    companyName: string;
    taxOffice: string;
    taxNo: string;
    address: string;
    contactPerson: string;
  };
  items: InvoiceLineItem[];
  notes: string;
  showStampAndSignature: boolean;
  showIbanQr: boolean;
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const DEFAULT_INVOICE_DATA: InvoiceDocumentData = {
  kind: 'invoice',
  accentColor: '#7c3aed',
  invoiceNo: 'CRP202600000148',
  issueDate: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  dueDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }),
  currency: 'TRY',
  tevkifat: 'none',
  sender: {
    companyName: 'Corpus Teknoloji ve Yazılım A.Ş.',
    taxOffice: 'Büyük Mükellefler V.D.',
    taxNo: '294 081 9201',
    address: 'Levent Mah. Büyükdere Cad. No: 199 Şişli / İstanbul',
    email: 'finans@corpus.app',
    phone: '+90 (212) 410 88 90',
    iban: 'TR44 0006 2000 4190 0006 2988 12',
    bankName: 'Garanti BBVA — Kurumsal Levent Şb.',
  },
  client: {
    companyName: 'FinNova Global Finans Teknolojileri A.Ş.',
    taxOffice: 'Maslak Vergi Dairesi',
    taxNo: '718 042 9910',
    address: 'İTÜ Ayazağa Kampüsü Arı 3 Teknokent Sarıyer / İstanbul',
    contactPerson: 'Sn. Mert Soylu (Finans Direktörü)',
  },
  items: [
    {
      id: 'it-1',
      description: 'Kurumsal Mikroservis Bulut Mimarisi & DevOps Dönüşüm Hizmeti',
      quantity: 1,
      unit: 'Proje',
      unitPrice: 85000,
      discountPct: 0,
      vatRate: 20,
    },
    {
      id: 'it-2',
      description: 'Yüksek Trafikli Ön Yüz (React/TypeScript) Performans Optimizasyonu',
      quantity: 40,
      unit: 'Saat',
      unitPrice: 1500,
      discountPct: 10,
      vatRate: 20,
    },
    {
      id: 'it-3',
      description: 'Yıllık Kurumsal SLA 7/24 Siber Güvenlik & Sunucu Bakım Paketi',
      quantity: 12,
      unit: 'Ay',
      unitPrice: 3500,
      discountPct: 0,
      vatRate: 20,
    },
  ],
  notes:
    'Ödemenizi açıklama kısmına Fatura Numarasını (CRP202600000148) yazarak IBAN hesabımıza FAST/EFT yoluyla gerçekleştirebilirsiniz. Sağ alttaki TR Karekod ile mobil bankacılıktan tek tuşla ödeme yapabilirsiniz.',
  showStampAndSignature: true,
  showIbanQr: true,
};

export const INITIAL_LEDGER_ENTRIES: LedgerEntry[] = [
  {
    id: 'ldg-1',
    date: '16.10.2026',
    type: 'income',
    partyName: 'FinNova Global Finans Teknolojileri A.Ş.',
    docNo: 'CRP202600000148',
    amount: 217200,
    currency: 'TRY',
    status: 'pending',
  },
  {
    id: 'ldg-2',
    date: '10.10.2026',
    type: 'income',
    partyName: 'Nova Dijital Danışmanlık Ltd. Şti.',
    docNo: 'CRP202600000147',
    amount: 96000,
    currency: 'TRY',
    status: 'paid',
  },
  {
    id: 'ldg-3',
    date: '05.10.2026',
    type: 'expense',
    partyName: 'AWS Frankfurt Cloud Infrastructure',
    docNo: 'AWS-EU-99412',
    amount: 18400,
    currency: 'TRY',
    status: 'paid',
  },
  {
    id: 'ldg-4',
    date: '01.10.2026',
    type: 'expense',
    partyName: 'Levent Ofis Kira & Aidat Gideri',
    docNo: 'KIRA-2026-10',
    amount: 45000,
    currency: 'TRY',
    status: 'paid',
  },
];

export interface InvoiceTotals {
  grossSubtotal: number;
  totalDiscount: number;
  netTaxableSubtotal: number;
  totalVat: number;
  withheldVat: number; // Tevkifat tutarı
  grandTotalPayable: number;
  amountInTurkishWords: string;
}

function parseTevkifatFactor(rate: TevkifatRate): number {
  if (rate === 'none') return 0;
  const [num, den] = rate.split('/').map(Number);
  return num && den ? num / den : 0;
}

/**
 * Converts a number into official Turkish Invoice Text ("Yalnız: İki Yüz On Yedi Bin İki Yüz Türk Lirası")
 */
export function numberToTurkishWords(amount: number, currency: CurrencyCode): string {
  const birler = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
  const onlar = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
  const basamaklar = ['', 'Bin', 'Milyon', 'Milyar'];

  const threeDigitsToWords = (n: number): string => {
    let s = '';
    const yuz = Math.floor(n / 100);
    const on = Math.floor((n % 100) / 10);
    const bir = n % 10;

    if (yuz > 0) {
      s += (yuz === 1 ? 'Yüz' : `${birler[yuz]} Yüz`) + ' ';
    }
    if (on > 0) {
      s += `${onlar[on]} `;
    }
    if (bir > 0) {
      s += `${birler[bir]} `;
    }
    return s.trim();
  };

  const intPart = Math.floor(Math.abs(amount));
  const kurusPart = Math.round((Math.abs(amount) - intPart) * 100);

  if (intPart === 0) return 'Sıfır';

  let temp = intPart;
  let groupIdx = 0;
  const parts: string[] = [];

  while (temp > 0) {
    const grp = temp % 1000;
    if (grp > 0) {
      let grpText = threeDigitsToWords(grp);
      if (groupIdx === 1 && grp === 1) {
        grpText = 'Bin';
      } else if (basamaklar[groupIdx]) {
        grpText = `${grpText} ${basamaklar[groupIdx]}`;
      }
      parts.unshift(grpText);
    }
    temp = Math.floor(temp / 1000);
    groupIdx++;
  }

  const currencyNames: Record<CurrencyCode, { main: string; sub: string }> = {
    TRY: { main: 'Türk Lirası', sub: 'Kuruş' },
    USD: { main: 'ABD Doları', sub: 'Sent' },
    EUR: { main: 'Euro', sub: 'Sent' },
    GBP: { main: 'İngiliz Sterlini', sub: 'Peni' },
  };

  let result = `Yalnız: ${parts.join(' ')} ${currencyNames[currency].main}`;
  if (kurusPart > 0) {
    result += ` ${threeDigitsToWords(kurusPart)} ${currencyNames[currency].sub}`;
  }
  return result;
}

export function calculateInvoiceTotals(doc: InvoiceDocumentData): InvoiceTotals {
  let grossSubtotal = 0;
  let totalDiscount = 0;
  let netTaxableSubtotal = 0;
  let totalVat = 0;

  for (const item of doc.items) {
    const lineGross = item.quantity * item.unitPrice;
    const lineDiscount = lineGross * (Math.min(100, Math.max(0, item.discountPct)) / 100);
    const lineNet = lineGross - lineDiscount;
    const lineVat = lineNet * (item.vatRate / 100);

    grossSubtotal += lineGross;
    totalDiscount += lineDiscount;
    netTaxableSubtotal += lineNet;
    totalVat += lineVat;
  }

  const tevkifatFactor = parseTevkifatFactor(doc.tevkifat);
  const withheldVat = totalVat * tevkifatFactor;
  const grandTotalPayable = netTaxableSubtotal + (totalVat - withheldVat);

  return {
    grossSubtotal,
    totalDiscount,
    netTaxableSubtotal,
    totalVat,
    withheldVat,
    grandTotalPayable,
    amountInTurkishWords: numberToTurkishWords(grandTotalPayable, doc.currency),
  };
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const sym = CURRENCY_SYMBOLS[currency] || '₺';
  return `${sym}${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  if (!text) return y;
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

async function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Renders the Official A4 Invoice / Proforma Quote onto a 2x Retina A4 Canvas (1588 x 2246 px)
 */
export async function renderInvoiceToA4Canvas(
  canvas: HTMLCanvasElement,
  doc: InvoiceDocumentData
): Promise<void> {
  const W = 1588;
  const H = 2246;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const accent = doc.accentColor || '#7c3aed';
  const totals = calculateInvoiceTotals(doc);
  const marginX = 96;
  const contentW = W - marginX * 2;

  // Top Accent Header Bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 20);

  let y = 96;

  // Left: Sender Company Branding
  ctx.fillStyle = '#09090b';
  ctx.font = '800 38px "Inter", sans-serif';
  ctx.fillText(doc.sender.companyName, marginX, y);

  // Right: Document Badge (E-ARŞİV FATURA / PROFORMA TEKLİF)
  const docTitle =
    doc.kind === 'invoice'
      ? 'E-ARŞİV / TİCARİ FATURA'
      : doc.kind === 'proforma-quote'
      ? 'PROFORMA FİYAT TEKLİFİ'
      : 'SERBEST MESLEK MAKBUZU';

  ctx.textAlign = 'right';
  ctx.fillStyle = accent;
  ctx.font = '800 32px "Inter", sans-serif';
  ctx.fillText(docTitle, W - marginX, y);
  ctx.textAlign = 'left';
  y += 42;

  // Sender Info (Left) & Invoice Meta (Right)
  ctx.fillStyle = '#52525b';
  ctx.font = '500 18px "Inter", sans-serif';
  ctx.fillText(doc.sender.address, marginX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#09090b';
  ctx.font = '700 19px "JetBrains Mono", monospace';
  ctx.fillText(`BELGE NO: ${doc.invoiceNo}`, W - marginX, y);
  ctx.textAlign = 'left';
  y += 28;

  ctx.fillStyle = '#52525b';
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.fillText(`${doc.sender.taxOffice} • VKN: ${doc.sender.taxNo}`, marginX, y);

  ctx.textAlign = 'right';
  ctx.fillText(`Düzenleme Tarihi: ${doc.issueDate}`, W - marginX, y);
  ctx.textAlign = 'left';
  y += 28;

  ctx.fillText(`${doc.sender.email}  •  ${doc.sender.phone}`, marginX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = accent;
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.fillText(`Son Ödeme / Geçerlilik: ${doc.dueDate}`, W - marginX, y);
  ctx.textAlign = 'left';
  y += 42;

  // Divider
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(W - marginX, y);
  ctx.stroke();
  y += 34;

  // Client Box & Bank IBAN Box (2 Columns)
  const boxW = (contentW - 32) / 2;
  const boxH = 190;

  // Left: Sayın / Müşteri Bilgileri
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(marginX, y, boxW, boxH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(marginX, y, boxW, boxH);

  ctx.fillStyle = accent;
  ctx.font = '800 17px "Inter", sans-serif';
  ctx.fillText('SAYIN / MÜŞTERİ (ALICI CARİ BİLGİLERİ)', marginX + 20, y + 32);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.fillText(doc.client.companyName, marginX + 20, y + 66);

  ctx.fillStyle = '#475569';
  ctx.font = '600 17px "Inter", sans-serif';
  ctx.fillText(`${doc.client.taxOffice} — VKN/TCKN: ${doc.client.taxNo}`, marginX + 20, y + 98);
  drawWrappedText(ctx, doc.client.address, marginX + 20, y + 128, boxW - 40, 24);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`İlgili Kişi: ${doc.client.contactPerson}`, marginX + 20, y + 174);

  // Right: Banka & IBAN Ödeme Bilgileri
  const rightBoxX = marginX + boxW + 32;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(rightBoxX, y, boxW, boxH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(rightBoxX, y, boxW, boxH);

  ctx.fillStyle = accent;
  ctx.font = '800 17px "Inter", sans-serif';
  ctx.fillText('BANKA & FAST / IBAN ÖDEME BİLGİLERİ', rightBoxX + 20, y + 32);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 20px "Inter", sans-serif';
  ctx.fillText(doc.sender.bankName, rightBoxX + 20, y + 66);

  ctx.fillStyle = accent;
  ctx.font = '700 21px "JetBrains Mono", monospace';
  ctx.fillText(doc.sender.iban, rightBoxX + 20, y + 104);

  ctx.fillStyle = '#475569';
  ctx.font = '500 17px "Inter", sans-serif';
  ctx.fillText(`Alıcı Unvan: ${doc.sender.companyName}`, rightBoxX + 20, y + 140);
  ctx.fillText(
    `Para Birimi: ${doc.currency} (${CURRENCY_SYMBOLS[doc.currency]})   •   Tevkifat: ${
      doc.tevkifat === 'none' ? 'Yok' : doc.tevkifat
    }`,
    rightBoxX + 20,
    y + 172
  );

  y += boxH + 42;

  // Line Items Table Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(marginX, y, contentW, 52);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 17px "Inter", sans-serif';
  ctx.fillText('#', marginX + 18, y + 32);
  ctx.fillText('HİZMET / ÜRÜN AÇIKLAMASI', marginX + 64, y + 32);
  ctx.fillText('MİKTAR', marginX + 740, y + 32);
  ctx.fillText('BİRİM FİYAT', marginX + 880, y + 32);
  ctx.fillText('İSK.%', marginX + 1060, y + 32);
  ctx.fillText('KDV%', marginX + 1155, y + 32);
  ctx.textAlign = 'right';
  ctx.fillText('TOPLAM (NET)', W - marginX - 20, y + 32);
  ctx.textAlign = 'left';

  y += 52;

  // Table Rows
  doc.items.forEach((item, index) => {
    const rowH = 64;
    ctx.fillStyle = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(marginX, y, contentW, rowH);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginX, y, contentW, rowH);

    const lineGross = item.quantity * item.unitPrice;
    const lineNet = lineGross * (1 - item.discountPct / 100);

    ctx.fillStyle = '#52525b';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText(String(index + 1), marginX + 18, y + 38);

    ctx.fillStyle = '#09090b';
    ctx.font = '600 19px "Inter", sans-serif';
    ctx.fillText(item.description.slice(0, 56), marginX + 64, y + 38);

    ctx.fillStyle = '#3f3f46';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText(`${item.quantity} ${item.unit}`, marginX + 740, y + 38);
    ctx.fillText(formatMoney(item.unitPrice, doc.currency), marginX + 880, y + 38);
    ctx.fillText(`%${item.discountPct}`, marginX + 1060, y + 38);
    ctx.fillText(`%${item.vatRate}`, marginX + 1155, y + 38);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#09090b';
    ctx.font = '700 19px "JetBrains Mono", monospace';
    ctx.fillText(formatMoney(lineNet, doc.currency), W - marginX - 20, y + 38);
    ctx.textAlign = 'left';

    y += rowH;
  });

  y += 32;

  // Totals Summary Block (Right) & Amount In Words + Notes (Left)
  const totalsW = 540;
  const totalsX = W - marginX - totalsW;
  let totalsY = y;

  const drawTotalRow = (label: string, val: string, isBold = false, highlight = false) => {
    if (highlight) {
      ctx.fillStyle = accent;
      ctx.fillRect(totalsX, totalsY - 28, totalsW, 54);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 23px "Inter", sans-serif';
      ctx.fillText(label, totalsX + 20, totalsY + 6);
      ctx.textAlign = 'right';
      ctx.font = '800 25px "JetBrains Mono", monospace';
      ctx.fillText(val, W - marginX - 20, totalsY + 6);
      ctx.textAlign = 'left';
      totalsY += 60;
    } else {
      ctx.fillStyle = isBold ? '#09090b' : '#52525b';
      ctx.font = `${isBold ? '700' : '600'} 19px "Inter", sans-serif`;
      ctx.fillText(label, totalsX + 16, totalsY);
      ctx.textAlign = 'right';
      ctx.font = `${isBold ? '700' : '600'} 20px "JetBrains Mono", monospace`;
      ctx.fillText(val, W - marginX - 16, totalsY);
      ctx.textAlign = 'left';
      totalsY += 38;
    }
  };

  drawTotalRow('Ara Toplam (Brüt):', formatMoney(totals.grossSubtotal, doc.currency));
  if (totals.totalDiscount > 0) {
    drawTotalRow('Toplam İskonto (-):', `-${formatMoney(totals.totalDiscount, doc.currency)}`);
  }
  drawTotalRow('KDV Matrahı (Net):', formatMoney(totals.netTaxableSubtotal, doc.currency), true);
  drawTotalRow('Hesaplanan KDV Toplamı:', formatMoney(totals.totalVat, doc.currency));
  if (totals.withheldVat > 0) {
    drawTotalRow(
      `KDV Tevkifatı (${doc.tevkifat}) (-):`,
      `-${formatMoney(totals.withheldVat, doc.currency)}`
    );
  }
  totalsY += 12;
  drawTotalRow(
    'ÖDENECEK GENEL TOPLAM:',
    formatMoney(totals.grandTotalPayable, doc.currency),
    true,
    true
  );

  // Left side: Official Turkish Words ("Yalnız: ...") & Notes
  const leftNotesW = contentW - totalsW - 48;
  ctx.fillStyle = '#f4f4f5';
  ctx.fillRect(marginX, y - 16, leftNotesW, 64);
  ctx.fillStyle = accent;
  ctx.fillRect(marginX, y - 16, 6, 64);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 18px "Inter", sans-serif';
  drawWrappedText(ctx, totals.amountInTurkishWords, marginX + 20, y + 14, leftNotesW - 32, 24);

  if (doc.notes.trim()) {
    ctx.fillStyle = '#52525b';
    ctx.font = '700 17px "Inter", sans-serif';
    ctx.fillText('ÖDEME VE FATURA NOTLARI:', marginX, y + 84);
    ctx.font = '400 17px "Inter", sans-serif';
    drawWrappedText(ctx, doc.notes, marginX, y + 112, leftNotesW, 26);
  }

  // Bottom Footer: IBAN QR Code + Corporate Stamp & Wet Signature
  const footerY = H - 330;

  if (doc.showIbanQr && doc.sender.iban.trim()) {
    try {
      const qrData = `IBAN:${doc.sender.iban.replace(/\s+/g, '')}|ALICI:${doc.sender.companyName}|TUTAR:${totals.grandTotalPayable.toFixed(2)} ${doc.currency}|NO:${doc.invoiceNo}`;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 170,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      const qrImg = await loadImageElement(qrUrl);
      if (qrImg) {
        ctx.drawImage(qrImg, marginX, footerY, 170, 170);
        ctx.fillStyle = '#09090b';
        ctx.font = '700 17px "Inter", sans-serif';
        ctx.fillText('FAST / IBAN HIZLI ÖDEME QR', marginX + 190, footerY + 46);
        ctx.fillStyle = '#52525b';
        ctx.font = '400 16px "Inter", sans-serif';
        drawWrappedText(
          ctx,
          'Mobil bankacılık uygulamanızdan karekodu okutarak IBAN ve tutar bilgilerini hatasız doldurabilirsiniz.',
          marginX + 190,
          footerY + 76,
          440,
          24
        );
      }
    } catch {
      // ignore qr error
    }
  }

  if (doc.showStampAndSignature) {
    const stampX = W - marginX - 380;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(stampX, footerY - 10, 380, 200);

    ctx.fillStyle = '#09090b';
    ctx.font = '800 17px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YETKİLİ KAŞE & İMZA ONAYI', stampX + 190, footerY + 22);
    ctx.fillStyle = accent;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillText(doc.sender.companyName.slice(0, 32), stampX + 190, footerY + 50);

    // Circular Stamp ring
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(stampX + 110, footerY + 118, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.fillText('RESMİ MÜHÜR', stampX + 110, footerY + 122);

    // Fountain Pen Signature Flourish
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(stampX + 185, footerY + 135);
    ctx.quadraticCurveTo(stampX + 250, footerY + 75, stampX + 335, footerY + 115);
    ctx.quadraticCurveTo(stampX + 275, footerY + 155, stampX + 220, footerY + 142);
    ctx.stroke();
    ctx.textAlign = 'left';
  }
}

/**
 * Exports the A4 Invoice Canvas to a crisp 300 DPI A4 PDF via pdf-lib
 */
export async function exportInvoiceCanvasToPdf(
  canvas: HTMLCanvasElement,
  doc: InvoiceDocumentData
): Promise<void> {
  const pngUrl = canvas.toDataURL('image/png', 1.0);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const pngImg = await pdfDoc.embedPng(pngUrl);

  page.drawImage(pngImg, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.invoiceNo.toLowerCase()}-fatura.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports the Invoice & Ledger to an editable Microsoft Excel (.xlsx) Workbook
 */
export function exportInvoiceAndLedgerToExcel(
  doc: InvoiceDocumentData,
  ledger: LedgerEntry[]
): void {
  const totals = calculateInvoiceTotals(doc);
  const wb = XLSX.utils.book_new();

  const invoiceRows = [
    ['BELGE TÜRÜ', doc.kind.toUpperCase(), 'BELGE NO', doc.invoiceNo],
    ['DÜZENLEME TARİHİ', doc.issueDate, 'VADE TARİHİ', doc.dueDate],
    ['SATICI FİRMA', doc.sender.companyName, 'ALICI FİRMA', doc.client.companyName],
    ['SATICI VKN', doc.sender.taxNo, 'ALICI VKN', doc.client.taxNo],
    ['IBAN', doc.sender.iban, 'PARA BİRİMİ', doc.currency],
    [],
    ['#', 'Hizmet / Ürün Açıklaması', 'Miktar', 'Birim', 'Birim Fiyat', 'İskonto %', 'KDV %', 'Net Satır Toplamı'],
    ...doc.items.map((it, idx) => [
      idx + 1,
      it.description,
      it.quantity,
      it.unit,
      it.unitPrice,
      it.discountPct,
      it.vatRate,
      it.quantity * it.unitPrice * (1 - it.discountPct / 100),
    ]),
    [],
    ['', '', '', '', '', '', 'Ara Toplam (Brüt)', totals.grossSubtotal],
    ['', '', '', '', '', '', 'Toplam İskonto (-)', totals.totalDiscount],
    ['', '', '', '', '', '', 'KDV Matrahı (Net)', totals.netTaxableSubtotal],
    ['', '', '', '', '', '', 'Hesaplanan KDV', totals.totalVat],
    ['', '', '', '', '', '', `KDV Tevkifatı (${doc.tevkifat})`, totals.withheldVat],
    ['', '', '', '', '', '', 'ÖDENECEK GENEL TOPLAM', totals.grandTotalPayable],
    ['', '', '', '', '', '', 'Yazı İle', totals.amountInTurkishWords],
  ];

  const wsInvoice = XLSX.utils.aoa_to_sheet(invoiceRows);
  XLSX.utils.book_append_sheet(wb, wsInvoice, 'Fatura_Detay');

  const ledgerRows = [
    ['Tarih', 'İşlem Türü', 'Cari / Firma Adı', 'Belge No', 'Tutar', 'Para Birimi', 'Durum'],
    ...ledger.map((l) => [
      l.date,
      l.type === 'income' ? 'GELİR (Tahsilat)' : 'GİDER (Ödeme)',
      l.partyName,
      l.docNo,
      l.amount,
      l.currency,
      l.status === 'paid' ? 'Ödendi' : l.status === 'pending' ? 'Bekliyor' : 'Gecikmiş',
    ]),
  ];
  const wsLedger = XLSX.utils.aoa_to_sheet(ledgerRows);
  XLSX.utils.book_append_sheet(wb, wsLedger, 'Cari_Gelir_Gider');

  XLSX.writeFile(wb, `${doc.invoiceNo.toLowerCase()}-finans-paketi.xlsx`);
}
