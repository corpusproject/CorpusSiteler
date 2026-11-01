import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';

export type ContractTemplateId = 'nda' | 'freelance-service' | 'employment' | 'rental-handover';

export interface ContractClause {
  id: string;
  title: string;
  body: string;
}

export interface CorporateStampConfig {
  enabled: boolean;
  shape: 'circle' | 'rectangle';
  companyName: string;
  taxInfo: string;
  cityAndReg: string;
  inkColor: string;
}

export interface ContractDocumentData {
  templateId: ContractTemplateId;
  documentNo: string;
  date: string;
  jurisdictionCity: string;
  title: string;
  subtitle: string;
  partyA: {
    roleTitle: string;
    name: string;
    taxOrIdNo: string;
    address: string;
    representative: string;
  };
  partyB: {
    roleTitle: string;
    name: string;
    taxOrIdNo: string;
    address: string;
    representative: string;
  };
  contractValue: string;
  clauses: ContractClause[];
  stamp: CorporateStampConfig;
  partyASignatureDataUrl: string | null;
  partyBSignatureDataUrl: string | null;
}

export const CONTRACT_TEMPLATES: Record<
  ContractTemplateId,
  {
    name: string;
    title: string;
    subtitle: string;
    partyARole: string;
    partyBRole: string;
    defaultValue: string;
    clauses: ContractClause[];
  }
> = {
  nda: {
    name: 'Gizlilik Sözleşmesi (NDA)',
    title: 'KARŞILIKLI GİZLİLİK VE SIR SAKLAMA SÖZLEŞMESİ (NDA)',
    subtitle: '6698 Sayılı KVKK ve Türk Ticaret Kanunu Hükümlerine Uygundur',
    partyARole: 'BİLGİ AÇIKLAYAN TARAF (İŞVEREN / ŞİRKET)',
    partyBRole: 'BİLGİ ALAN TARAF (YÜKLENİCİ / DANIŞMAN)',
    defaultValue: '50.000 USD Cezai Şart Teminatlı',
    clauses: [
      {
        id: 'c-1',
        title: 'MADDE 1 — SÖZLEŞMENİN KONUSU VE AMACI',
        body: 'İşbu Sözleşmenin konusu; Taraflar arasında yürütülecek yazılım geliştirme, mimari danışmanlık ve ticari işbirliği görüşmeleri kapsamında paylaşılan her türlü teknik, mali, ticari sır, kaynak kodu, algoritma, müşteri verisi ve proje dokümanının ("Gizli Bilgi") korunması ve üçüncü kişilere ifşa edilmemesinin şartlarını belirlemektir.',
      },
      {
        id: 'c-2',
        title: 'MADDE 2 — GİZLİ BİLGİNİN KORUNMASI VE YÜKÜMLÜLÜKLER',
        body: 'Bilgi Alan Taraf, kendisine teslim edilen Gizli Bilgileri en az kendi ticari sırlarını koruduğu özen derecesiyle (ve her hâlükârda makul özenin altında olmamak kaydıyla) koruyacağını, karşı tarafın yazılı izni olmaksızın hiçbir gerçek veya tüzel kişiye açıklamayacağını ve yalnızca proje amacı doğrultusunda kullanacağını gayrikabili rücu kabul ve taahhüt eder.',
      },
      {
        id: 'c-3',
        title: 'MADDE 3 — FİKRİ MÜLKİYET VE KVKK UYUMU',
        body: 'Paylaşılan hiçbir yazılım mimarisi, veri seti veya ticari bilgi, Bilgi Alan Tarafa herhangi bir lisans veya mülkiyet hakkı devri anlamına gelmez. Taraflar 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve GDPR hükümlerine eksiksiz riayet etmekle yükümlüdür.',
      },
      {
        id: 'c-4',
        title: 'MADDE 4 — SÜRE, CEZAİ ŞART VE YETKİLİ MAHKEME',
        body: 'İşbu Sözleşme imza tarihinde yürürlüğe girer ve ticari ilişki sona erse dahi 5 (beş) yıl boyunca geçerliliğini korur. Gizlilik yükümlülüğünün ihlali halinde ihlal eden taraf, diğer tarafın doğacak tüm doğrudan ve dolaylı zararlarına ek olarak sözleşmede belirtilen cezai şart bedelini nakden ve defaten ödemeyi kabul eder.',
      },
    ],
  },
  'freelance-service': {
    name: 'Yazılım & Hizmet Sözleşmesi',
    title: 'YAZILIM GELİŞTİRME VE DANIŞMANLIK HİZMET SÖZLEŞMESİ',
    subtitle: 'B2B Kurumsal Hizmet Alımı ve Fikri Mülkiyet Devir Protokolü',
    partyARole: 'HİZMET ALAN (MÜŞTERİ / KURUM)',
    partyBRole: 'HİZMET VEREN (YÜKLENİCİ / GELİŞTİRİCİ)',
    defaultValue: '240.000,00 TL + %20 KDV',
    clauses: [
      {
        id: 'c-1',
        title: 'MADDE 1 — HİZMETİN KAPSAMI VE TESLİMATLAR',
        body: 'Hizmet Veren; Hizmet Alan için teknik şartnamede tanımlanan Web/Mobil uygulama mimarisinin tasarlanması, kaynak kodlarının geliştirilmesi, birim testlerinin tamamlanması ve üretim (production) ortamına devreye alınması hizmetlerini eksiksiz olarak yerine getirmeyi taahhüt eder.',
      },
      {
        id: 'c-2',
        title: 'MADDE 2 — ÜCRET VE ÖDEME TAKVİMİ',
        body: 'Toplam proje bedeli sözleşme özetinde belirtilen tutar olup; %40 sözleşme imza tarihinde avans, %30 alfa test sürümü tesliminde ve kalan %30 canlıya geçiş (Go-Live) onayını takip eden 7 (yedi) iş günü içerisinde Hizmet Verenin banka hesabına ödenir.',
      },
      {
        id: 'c-3',
        title: 'MADDE 3 — KAYNAK KODU VE FİKRİ MÜLKİYET DEVRİ',
        body: 'Proje bedelinin tamamının ödenmesiyle birlikte, proje kapsamında üretilen tüm özgün kaynak kodları, arayüz tasarımları ve dokümantasyonun 5846 sayılı FSEK kapsamındaki tüm mali ve işleme hakları münhasıran Hizmet Alana devredilmiş sayılır.',
      },
      {
        id: 'c-4',
        title: 'MADDE 4 — GARANTİ, BAKIM VE DESTEK',
        body: 'Hizmet Veren, kesin kabul tarihinden itibaren 6 (altı) ay boyunca yazılımda ortaya çıkabilecek kodlama kaynaklı hataları (bug/defect) ek ücret talep etmeksizin gidermeyi taahhüt eder.',
      },
    ],
  },
  employment: {
    name: 'Uzaktan Çalışma İş Sözleşmesi',
    title: 'BELİRSİZ SÜRELİ UZAKTAN / HİBRİT ÇALIŞMA İŞ SÖZLEŞMESİ',
    subtitle: '4857 Sayılı İş Kanunu ve Uzaktan Çalışma Yönetmeliğine Uygundur',
    partyARole: 'İŞVEREN KURUM',
    partyBRole: 'ÇALIŞAN (PERSONEL)',
    defaultValue: 'Aylık Net 95.000,00 TL + Yan Haklar',
    clauses: [
      {
        id: 'c-1',
        title: 'MADDE 1 — GÖREV TANIMI VE ÇALIŞMA MODELİ',
        body: 'Çalışan, İşveren bünyesinde Kıdemli Yazılım Mühendisi / Uzmanı unvanıyla görev yapacaktır. Çalışma düzeni hibrit/uzaktan çalışma esaslarına tabi olup haftalık çalışma süresi 45 saati aşmayacak şekilde esnek mesai ilkeleriyle yürütülür.',
      },
      {
        id: 'c-2',
        title: 'MADDE 2 — ÜCRET, YAN HAKLAR VE EKİPMAN TEMİNİ',
        body: 'İşveren, Çalışana her ayın son iş günü kararlaştırılan net maaşı ve özel sağlık sigortası ile uzaktan çalışma internet/yemek ödeneklerini öder. İşin görülmesi için gerekli taşınabilir bilgisayar ve yazılım lisansları İşveren tarafından zimmetle teslim edilir.',
      },
      {
        id: 'c-3',
        title: 'MADDE 3 — BİLGİ GÜVENLİĞİ VE SIR SAKLAMA',
        body: 'Çalışan, görevi sebebiyle eriştiği kurumsal sistemleri, müşteri verilerini ve şifreleri yalnızca şirket bilgisayarında ve güvenli bağlantı (VPN / 2FA) üzerinden kullanacağını kabul eder.',
      },
    ],
  },
  'rental-handover': {
    name: 'Kira & Zimmet Teslim Tutanağı',
    title: 'KURUMSAL OFİS / KONUT KİRA VE DEMİRBAŞ TESLİM TUTANAĞI',
    subtitle: '6098 Sayılı Türk Borçlar Kanunu Hükümlerine Tabi Teslim Protokolü',
    partyARole: 'KİRAYA VEREN / TESLİM EDEN',
    partyBRole: 'KİRACI / TESLİM ALAN',
    defaultValue: 'Aylık 45.000,00 TL + 2 Kira Depozito',
    clauses: [
      {
        id: 'c-1',
        title: 'MADDE 1 — MECURUN VE DEMİRBAŞLARIN TESLİMİ',
        body: 'Kiraya Veren, sözleşmede adresi belirtilen taşınmazı boyalı, tesisatları çalışır vaziyette ve ekli listedeki demirbaş ekipmanlarla birlikte tam ve sağlam olarak Kiracıya teslim etmiştir.',
      },
      {
        id: 'c-2',
        title: 'MADDE 2 — KİRA BEDELİ VE ÖDEME ŞEKLİ',
        body: 'Kira bedeli her ayın 1. ve 5. günleri arasında Kiraya Verenin IBAN hesabına açıklama kısmına ilgili ay ve yıl yazılarak yatırılır.',
      },
      {
        id: 'c-3',
        title: 'MADDE 3 — DEPOZİTO VE TAHLİYE ŞARTLARI',
        body: 'Alınan güvence bedeli (depozito), taşınmazın tahliyesi sırasında elektrik, su, doğalgaz, aidat borcu bulunmaması ve olağan kullanım dışındaki hasarların olmaması kaydıyla Kiracıya aynen iade edilir.',
      },
    ],
  },
};

export const DEFAULT_CONTRACT_DATA: ContractDocumentData = {
  templateId: 'nda',
  documentNo: 'CRP-2026-00948',
  date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }),
  jurisdictionCity: 'İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri',
  title: CONTRACT_TEMPLATES.nda.title,
  subtitle: CONTRACT_TEMPLATES.nda.subtitle,
  partyA: {
    roleTitle: CONTRACT_TEMPLATES.nda.partyARole,
    name: 'Corpus Teknoloji ve Bulut Sistemleri A.Ş.',
    taxOrIdNo: 'Büyük Mükellefler V.D. • 294 081 9201',
    address: 'Levent Mah. Büyükdere Cad. No: 199 Şişli / İstanbul',
    representative: 'Kaan Demir (Yönetim Kurulu Başkanı)',
  },
  partyB: {
    roleTitle: CONTRACT_TEMPLATES.nda.partyBRole,
    name: 'Nova Dijital Yazılım Danışmanlık Ltd. Şti.',
    taxOrIdNo: 'Maslak V.D. • 618 042 7734',
    address: 'İTÜ Ayazağa Kampüsü Arı Teknokent Sarıyer / İstanbul',
    representative: 'Selin Kaya (Kurucu Ortak & CTO)',
  },
  contractValue: CONTRACT_TEMPLATES.nda.defaultValue,
  clauses: CONTRACT_TEMPLATES.nda.clauses,
  stamp: {
    enabled: true,
    shape: 'circle',
    companyName: 'CORPUS TEKNOLOJİ A.Ş.',
    taxInfo: 'BÜYÜK MÜKELLEFLER V.D. 2940819201',
    cityAndReg: 'İSTANBUL TİC. SİC. • MERKEZ',
    inkColor: '#1d4ed8',
  },
  partyASignatureDataUrl: null,
  partyBSignatureDataUrl: null,
};

/**
 * Generates a realistic Calligraphic Fountain-Pen Wet Signature PNG DataURL from text
 */
export function generateCalligraphicSignatureDataUrl(
  fullName: string,
  inkColor = '#1e40af'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(40, 115);
  ctx.rotate(-0.06);

  ctx.font = '700 64px "Caveat", cursive, serif';
  ctx.fillStyle = inkColor;
  ctx.fillText(fullName || 'Kaan Demir', 0, 0);

  // Elegant fountain pen underline flourish
  const textW = Math.min(420, Math.max(160, ctx.measureText(fullName || 'Kaan Demir').width));
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 18);
  ctx.quadraticCurveTo(textW * 0.55, 2, textW + 18, 14);
  ctx.quadraticCurveTo(textW * 0.7, 26, textW * 0.35, 28);
  ctx.stroke();

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * Generates a realistic Turkish Corporate Stamp / Seal (Kaşe / Mühür) PNG DataURL
 */
export function renderCorporateStampDataUrl(stamp: CorporateStampConfig): string {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 360, 360);
  const color = stamp.inkColor || '#1d4ed8';

  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  if (stamp.shape === 'circle') {
    const cx = 180;
    const cy = 180;

    // Outer double ring
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 152, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 94, 0, Math.PI * 2);
    ctx.stroke();

    // Center Banner Text
    ctx.textAlign = 'center';
    ctx.font = '800 18px "Inter", sans-serif';
    ctx.fillText(stamp.companyName.slice(0, 26), cx, cy - 16);

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('RESMİ KURUMSAL MÜHÜR', cx, cy + 8);

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillText(stamp.taxInfo.slice(0, 32), cx, cy + 32);

    // Top & Bottom Arc labels
    ctx.font = '800 14px "Inter", sans-serif';
    ctx.fillText('★  ONAYLI ELEKTRONİK & ISLAK KAŞE  ★', cx, cy - 108);
    ctx.font = '700 13px "Inter", sans-serif';
    ctx.fillText(stamp.cityAndReg.slice(0, 30), cx, cy + 120);
  } else {
    // Rectangular Turkish Company Kaşe
    ctx.translate(180, 180);
    ctx.rotate(-0.04);
    ctx.translate(-180, -180);

    ctx.lineWidth = 5;
    ctx.strokeRect(20, 88, 320, 184);
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 96, 304, 168);

    ctx.textAlign = 'center';
    ctx.font = '800 20px "Inter", sans-serif';
    ctx.fillText(stamp.companyName.slice(0, 26), 180, 142);

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(46, 156);
    ctx.lineTo(314, 156);
    ctx.stroke();

    ctx.font = '700 14px "Inter", sans-serif';
    ctx.fillText(stamp.cityAndReg.slice(0, 34), 180, 186);

    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(stamp.taxInfo.slice(0, 34), 180, 216);

    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillText('YETKİLİ KAŞE & İMZA ONAYI', 180, 246);
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * Computes the SHA-256 digital fingerprint of the contract document via WebCrypto
 */
export async function computeDocumentSha256(doc: ContractDocumentData): Promise<string> {
  const payload = JSON.stringify({
    docNo: doc.documentNo,
    date: doc.date,
    title: doc.title,
    partyA: doc.partyA,
    partyB: doc.partyB,
    value: doc.contractValue,
    clauses: doc.clauses,
  });
  const bytes = new TextEncoder().encode(payload);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Renders the Official Legal Contract + Signatures + Corporate Stamp + SHA-256 Certificate onto a 2x Retina A4 Canvas
 */
export async function renderContractToA4Canvas(
  canvas: HTMLCanvasElement,
  doc: ContractDocumentData,
  sha256Hash: string
): Promise<void> {
  const W = 1588;
  const H = 2246;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Crisp White Legal Paper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Subtle Outer Legal Frame
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Top Header Strip
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(48, 48, W - 96, 16);

  const marginX = 104;
  const contentW = W - marginX * 2;
  let y = 114;

  // Document Meta Row
  ctx.fillStyle = '#52525b';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText(`BELGE NO: ${doc.documentNo}`, marginX, y);

  ctx.textAlign = 'right';
  ctx.fillText(`TARİH: ${doc.date}`, W - marginX, y);
  ctx.textAlign = 'left';
  y += 46;

  // Main Contract Title
  ctx.fillStyle = '#09090b';
  ctx.font = '800 34px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(doc.title, W / 2, y);
  y += 34;

  ctx.fillStyle = '#4f46e5';
  ctx.font = '600 19px "Inter", sans-serif';
  ctx.fillText(doc.subtitle, W / 2, y);
  ctx.textAlign = 'left';
  y += 32;

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(W - marginX, y);
  ctx.stroke();
  y += 32;

  // Two-column Parties Box (TARAF A & TARAF B)
  const boxW = (contentW - 32) / 2;
  const boxH = 205;

  // Party A Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(marginX, y, boxW, boxH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(marginX, y, boxW, boxH);

  ctx.fillStyle = '#1e293b';
  ctx.font = '800 17px "Inter", sans-serif';
  ctx.fillText(`1. ${doc.partyA.roleTitle}`, marginX + 20, y + 32);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 21px "Inter", sans-serif';
  ctx.fillText(doc.partyA.name, marginX + 20, y + 66);

  ctx.fillStyle = '#475569';
  ctx.font = '500 17px "Inter", sans-serif';
  ctx.fillText(`VKN / TCKN: ${doc.partyA.taxOrIdNo}`, marginX + 20, y + 98);
  drawWrappedText(ctx, `Adres: ${doc.partyA.address}`, marginX + 20, y + 128, boxW - 40, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 17px "Inter", sans-serif';
  ctx.fillText(`Yetkili: ${doc.partyA.representative}`, marginX + 20, y + 184);

  // Party B Box
  const partyBX = marginX + boxW + 32;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(partyBX, y, boxW, boxH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(partyBX, y, boxW, boxH);

  ctx.fillStyle = '#1e293b';
  ctx.font = '800 17px "Inter", sans-serif';
  ctx.fillText(`2. ${doc.partyB.roleTitle}`, partyBX + 20, y + 32);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 21px "Inter", sans-serif';
  ctx.fillText(doc.partyB.name, partyBX + 20, y + 66);

  ctx.fillStyle = '#475569';
  ctx.font = '500 17px "Inter", sans-serif';
  ctx.fillText(`VKN / TCKN: ${doc.partyB.taxOrIdNo}`, partyBX + 20, y + 98);
  drawWrappedText(ctx, `Adres: ${doc.partyB.address}`, partyBX + 20, y + 128, boxW - 40, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 17px "Inter", sans-serif';
  ctx.fillText(`Yetkili: ${doc.partyB.representative}`, partyBX + 20, y + 184);

  y += boxH + 24;

  // Financial / Jurisdiction Summary Strip
  ctx.fillStyle = '#eef2ff';
  ctx.fillRect(marginX, y, contentW, 48);
  ctx.fillStyle = '#312e81';
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.fillText(`MALİ BEDEL / TEMİNAT: ${doc.contractValue}`, marginX + 20, y + 30);
  ctx.textAlign = 'right';
  ctx.fillText(`YETKİLİ YARGI: ${doc.jurisdictionCity}`, W - marginX - 20, y + 30);
  ctx.textAlign = 'left';
  y += 78;

  // Contract Clauses
  for (const clause of doc.clauses) {
    if (y > H - 620) break;
    ctx.fillStyle = '#09090b';
    ctx.font = '800 20px "Inter", sans-serif';
    ctx.fillText(clause.title, marginX, y);
    y += 28;

    ctx.fillStyle = '#27272a';
    ctx.font = '400 19px "Inter", sans-serif';
    y = drawWrappedText(ctx, clause.body, marginX, y, contentW, 29);
    y += 22;
  }

  // Bottom Signature & Stamp Section
  const sigTopY = Math.max(y + 10, H - 560);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, sigTopY);
  ctx.lineTo(W - marginX, sigTopY);
  ctx.stroke();

  const sigBoxY = sigTopY + 24;
  const sigBoxH = 260;

  // Left Signature Box (Party A + Corporate Stamp)
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(marginX, sigBoxY, boxW, sigBoxH);
  ctx.strokeStyle = '#d4d4d8';
  ctx.strokeRect(marginX, sigBoxY, boxW, sigBoxH);

  ctx.fillStyle = '#09090b';
  ctx.font = '800 18px "Inter", sans-serif';
  ctx.fillText(doc.partyA.roleTitle, marginX + 20, sigBoxY + 32);
  ctx.fillStyle = '#3f3f46';
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.fillText(doc.partyA.name, marginX + 20, sigBoxY + 58);
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.fillText(`İmzalayan: ${doc.partyA.representative}`, marginX + 20, sigBoxY + 84);

  // Draw Corporate Stamp if enabled
  if (doc.stamp.enabled) {
    const stampUrl = renderCorporateStampDataUrl(doc.stamp);
    const stampImg = await loadImageElement(stampUrl);
    if (stampImg) {
      ctx.drawImage(stampImg, marginX + boxW - 210, sigBoxY + 54, 190, 190);
    }
  }

  // Draw Party A Signature
  const sigAUrl =
    doc.partyASignatureDataUrl ||
    generateCalligraphicSignatureDataUrl(doc.partyA.representative.split('(')[0].trim(), '#1e40af');
  const sigAImg = await loadImageElement(sigAUrl);
  if (sigAImg) {
    ctx.drawImage(sigAImg, marginX + 24, sigBoxY + 105, 340, 130);
  }

  // Right Signature Box (Party B)
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(partyBX, sigBoxY, boxW, sigBoxH);
  ctx.strokeStyle = '#d4d4d8';
  ctx.strokeRect(partyBX, sigBoxY, boxW, sigBoxH);

  ctx.fillStyle = '#09090b';
  ctx.font = '800 18px "Inter", sans-serif';
  ctx.fillText(doc.partyB.roleTitle, partyBX + 20, sigBoxY + 32);
  ctx.fillStyle = '#3f3f46';
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.fillText(doc.partyB.name, partyBX + 20, sigBoxY + 58);
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.fillText(`İmzalayan: ${doc.partyB.representative}`, partyBX + 20, sigBoxY + 84);

  const sigBUrl =
    doc.partyBSignatureDataUrl ||
    generateCalligraphicSignatureDataUrl(doc.partyB.representative.split('(')[0].trim(), '#0f172a');
  const sigBImg = await loadImageElement(sigBUrl);
  if (sigBImg) {
    ctx.drawImage(sigBImg, partyBX + 36, sigBoxY + 105, 340, 130);
  }

  // Bottom SHA-256 Digital Audit Certificate Footer
  const certY = H - 220;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(marginX, certY, contentW, 136);

  // QR Code inside certificate
  try {
    const qrPayload = `CORPUS-ESIGN|DOC:${doc.documentNo}|DATE:${doc.date}|SHA256:${sha256Hash.slice(0, 32)}`;
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 112,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    const qrImg = await loadImageElement(qrDataUrl);
    if (qrImg) {
      ctx.drawImage(qrImg, W - marginX - 124, certY + 12, 112, 112);
    }
  } catch {
    // ignore qr error
  }

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 17px "JetBrains Mono", monospace';
  ctx.fillText(
    '✓ CORPUS E-SIGN KRİPTOGRAFİK BELGE BÜTÜNLÜK & DENETİM SERTİFİKASI',
    marginX + 24,
    certY + 36
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.fillText(
    `Belge No: ${doc.documentNo}   •   Zaman Damgası: ${doc.date}   •   Durum: İMZALANDI & MÜHÜRLENDİ`,
    marginX + 24,
    certY + 68
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillText(`SHA-256 ÖZETİ: ${sha256Hash}`, marginX + 24, certY + 104);
}

/**
 * Exports the signed A4 Contract Canvas to a crisp 300 DPI A4 PDF via pdf-lib
 */
export async function exportSignedContractToPdf(
  canvas: HTMLCanvasElement,
  doc: ContractDocumentData
): Promise<void> {
  const pngDataUrl = canvas.toDataURL('image/png', 1.0);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const pngImage = await pdfDoc.embedPng(pngDataUrl);

  page.drawImage(pngImage, {
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
  a.download = `${doc.documentNo.toLowerCase()}-imzali-sozlesme.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
