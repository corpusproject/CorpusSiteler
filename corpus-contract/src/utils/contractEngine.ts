import { jsPDF } from 'jspdf';

export type ContractTemplateKey = 'software-service' | 'nda' | 'freelance' | 'kvkk';

export interface ContractParty {
  roleTitle: string;
  companyName: string;
  representative: string;
  taxOfficeAndNo: string;
  address: string;
  email: string;
}

export interface ContractClause {
  id: string;
  number: string;
  title: string;
  body: string;
  category: 'core' | 'financial' | 'ip-privacy' | 'termination' | 'jurisdiction';
  mandatory: boolean;
}

export interface ContractData {
  templateKey: ContractTemplateKey;
  contractNo: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  durationMonths: number;
  jurisdictionCity: string;
  contractValue: number;
  currency: 'TRY' | 'USD' | 'EUR';
  penaltyAmount: number;
  accentColor: string;
  showOfficialStamp: boolean;
  showDigitalVerifyQr: boolean;
  stampTitle: string;
  partyA: ContractParty;
  partyB: ContractParty;
  clauses: ContractClause[];
}

export interface LegalAuditResult {
  score: number;
  checks: {
    label: string;
    passed: boolean;
    hint: string;
  }[];
}

export const CONTRACT_TEMPLATES: Record<
  ContractTemplateKey,
  { name: string; badge: string; build: () => ContractData }
> = {
  'software-service': {
    name: 'Yazılım & Danışmanlık Hizmet Sözleşmesi',
    badge: 'TBK & FSEK',
    build: () => ({
      templateKey: 'software-service',
      contractNo: 'CRP-SZL-2026/084',
      title: 'YAZILIM GELİŞTİRME, BAKIM VE DANIŞMANLIK HİZMET SÖZLEŞMESİ',
      subtitle: '6098 Sayılı Türk Borçlar Kanunu ve 5846 Sayılı FSEK Hükümlerine Uygundur',
      effectiveDate: '2026-10-17',
      durationMonths: 12,
      jurisdictionCity: 'İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri',
      contractValue: 240000,
      currency: 'TRY',
      penaltyAmount: 100000,
      accentColor: '#7c3aed',
      showOfficialStamp: true,
      showDigitalVerifyQr: true,
      stampTitle: 'CORPUS HUKUK & UYUM ONAYLI',
      partyA: {
        roleTitle: 'HİZMET VEREN (YÜKLENİCİ)',
        companyName: 'Corpus Teknoloji ve Yazılım A.Ş.',
        representative: 'Ahmet Yılmaz (Yönetim Kurulu Bşk.)',
        taxOfficeAndNo: 'Maslak V.D. / 2940581920',
        address: 'Maslak Mah. Büyükdere Cad. No: 194 Sarıyer / İstanbul',
        email: 'hukuk@corpustech.com.tr',
      },
      partyB: {
        roleTitle: 'HİZMET ALAN (MÜŞTERİ / İŞVEREN)',
        companyName: 'Anadolu Lojistik ve Perakende Tic. A.Ş.',
        representative: 'Selin Kaya (Genel Müdür)',
        taxOfficeAndNo: 'Kozyatağı V.D. / 1094827563',
        address: 'Kozyatağı Mah. Değirmen Sok. No: 18 Kadıköy / İstanbul',
        email: 'sozlesme@anadolulojistik.com.tr',
      },
      clauses: [
        {
          id: 'c1',
          number: 'MADDE 1',
          title: 'SÖZLEŞMENİN KONUSU VE KAPSAMI',
          body: 'İşbu sözleşmenin konusu; YÜKLENİCİ tarafından MÜŞTERİ ihtiyaçları doğrultusunda bulut tabanlı kurumsal yazılım modüllerinin geliştirilmesi, test edilmesi, devreye alınması ve sözleşme süresince teknik bakım/destek hizmetlerinin sunulması ile tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.',
          category: 'core',
          mandatory: true,
        },
        {
          id: 'c2',
          number: 'MADDE 2',
          title: 'MALİ HÜKÜMLER, BEDEL VE ÖDEME PLANI',
          body: 'Toplam hizmet bedeli KDV hariç {{CONTRACT_VALUE}} olup, fatura kesim tarihinden itibaren en geç 10 (on) iş günü içinde YÜKLENİCİ banka hesabına ödenir. Vadesinde ödenmeyen faturalara aylık %4,5 ticari temerrüt faizi uygulanır.',
          category: 'financial',
          mandatory: true,
        },
        {
          id: 'c3',
          number: 'MADDE 3',
          title: 'FİKRİ VE SINAİ MÜLKİYET HAKLARI (FSEK)',
          body: 'Sözleşme kapsamında MÜŞTERİ’ye özel geliştirilen kaynak kodları, arayüz tasarımları ve dokümantasyonun 5846 sayılı FSEK kapsamındaki işleme, çoğaltma, yayma ve temsil hakları, sözleşme bedelinin eksiksiz ödenmesi şartıyla MÜŞTERİ’ye devredilir.',
          category: 'ip-privacy',
          mandatory: true,
        },
        {
          id: 'c4',
          number: 'MADDE 4',
          title: 'GİZLİLİK, KVKK VE CEZAİ ŞART',
          body: 'Taraflar, işbu sözleşme nedeniyle öğrendikleri ticari sırları, kaynak kodlarını ve 6698 sayılı KVKK kapsamındaki kişisel verileri üçüncü kişilerle paylaşamaz. Bu yükümlülüğün ihlali halinde ihlal eden taraf {{PENALTY_VALUE}} tutarında cezai şartı nakden ve defaten ödemeyi kabul eder.',
          category: 'ip-privacy',
          mandatory: true,
        },
        {
          id: 'c5',
          number: 'MADDE 5',
          title: 'SÜRE, FESİH VE MÜCBİR SEBEP',
          body: 'İşbu sözleşme {{EFFECTIVE_DATE}} tarihinde yürürlüğe girer ve {{DURATION_MONTHS}} ay süreyle geçerlidir. Taraflardan biri 30 (otuz) gün önceden yazılı bildirimde bulunarak haklı sebeple sözleşmeyi feshedebilir.',
          category: 'termination',
          mandatory: false,
        },
        {
          id: 'c6',
          number: 'MADDE 6',
          title: 'DELİL SÖZLEŞMESİ VE YETKİLİ MAHKEME',
          body: 'Taraflar arasındaki uyuşmazlıklarda tarafların ticari defterleri ve kurumsal e-posta kayıtları HMK m. 193 uyarınca kesin delil teşkil eder. Uyuşmazlıkların çözümünde {{JURISDICTION}} yetkilidir.',
          category: 'jurisdiction',
          mandatory: true,
        },
      ],
    }),
  },

  nda: {
    name: 'Karşılıklı Gizlilik Sözleşmesi (NDA)',
    badge: 'Gizlilik / NDA',
    build: () => ({
      templateKey: 'nda',
      contractNo: 'CRP-NDA-2026/112',
      title: 'KARŞILIKLI GİZLİLİK, SIR SAKLAMA VE REKABET YASAĞI SÖZLEŞMESİ (NDA)',
      subtitle: 'Ticari Sırların, Kaynak Kodların ve Müşteri Verilerinin Korunması Protokolü',
      effectiveDate: '2026-10-17',
      durationMonths: 36,
      jurisdictionCity: 'İstanbul (Çağlayan) Ticaret Mahkemeleri ve İcra Daireleri',
      contractValue: 0,
      currency: 'USD',
      penaltyAmount: 25000,
      accentColor: '#059669',
      showOfficialStamp: true,
      showDigitalVerifyQr: true,
      stampTitle: 'GİZLİ / CONFIDENTIAL NDA',
      partyA: {
        roleTitle: 'BİRİNCİ TARAF (AÇIKLAYAN / ALAN)',
        companyName: 'Corpus Teknoloji ve Yazılım A.Ş.',
        representative: 'Ahmet Yılmaz (Yönetim Kurulu Bşk.)',
        taxOfficeAndNo: 'Maslak V.D. / 2940581920',
        address: 'Maslak Mah. Büyükdere Cad. No: 194 Sarıyer / İstanbul',
        email: 'hukuk@corpustech.com.tr',
      },
      partyB: {
        roleTitle: 'İKİNCİ TARAF (AÇIKLAYAN / ALAN)',
        companyName: 'Global Ventures Yatırım Holding A.Ş.',
        representative: 'Murat Demir (Yatırım Direktörü)',
        taxOfficeAndNo: 'Beşiktaş V.D. / 8392017465',
        address: 'Levent Mah. Cömert Sok. No: 4 Beşiktaş / İstanbul',
        email: 'legal@globalventures.com.tr',
      },
      clauses: [
        {
          id: 'n1',
          number: 'MADDE 1',
          title: 'GİZLİ BİLGİNİN TANIMI',
          body: 'Taraflar arasında yazılı, sözlü, dijital veya görsel olarak paylaşılan tüm yazılım mimarileri, kaynak kodlar, algoritmalar, finansal tablolar, fiyatlandırma stratejileri, müşteri listeleri ve iş planları "Gizli Bilgi" olarak kabul edilir.',
          category: 'ip-privacy',
          mandatory: true,
        },
        {
          id: 'n2',
          number: 'MADDE 2',
          title: 'GİZLİ BİLGİNİN KORUNMASI VE KULLANIM SINIRI',
          body: 'Taraflar, edindikleri Gizli Bilgileri yalnızca ortak proje değerlendirmesi amacıyla kullanmayı, kendi çalışanları dışında hiçbir üçüncü kişi veya kuruma açıklamamayı ve en üst düzey güvenlik önlemleriyle korumayı taahhüt eder.',
          category: 'ip-privacy',
          mandatory: true,
        },
        {
          id: 'n3',
          number: 'MADDE 3',
          title: 'AYARTmama VE REKABET YASAĞI',
          body: 'Taraflar, sözleşme süresince ve sözleşmenin bitiminden itibaren 2 (iki) yıl boyunca diğer tarafın kilit mühendis veya yöneticilerine doğrudan iş teklifinde bulunamaz.',
          category: 'core',
          mandatory: false,
        },
        {
          id: 'n4',
          number: 'MADDE 4',
          title: 'CEZAİ ŞART VE TAZMİNAT',
          body: 'İşbu sözleşmedeki gizlilik yükümlülüklerinin ihlali halinde, ihlal eden taraf herhangi bir ihtara veya hükme gerek kalmaksızın {{PENALTY_VALUE}} tutarında cezai şartı ve ayrıca doğacak tüm doğrudan/dolaylı zararları ödemeyi kabul eder.',
          category: 'financial',
          mandatory: true,
        },
        {
          id: 'n5',
          number: 'MADDE 5',
          title: 'SÜRE VE YETKİLİ MAHKEME',
          body: 'İşbu sözleşme {{EFFECTIVE_DATE}} tarihinde imzalanmış olup {{DURATION_MONTHS}} ay süreyle yürürlükte kalacaktır. Uyuşmazlıklarda {{JURISDICTION}} yetkilidir.',
          category: 'jurisdiction',
          mandatory: true,
        },
      ],
    }),
  },

  freelance: {
    name: 'Freelance / Bağımsız Yüklenici Sözleşmesi',
    badge: 'Proje Bazlı',
    build: () => ({
      templateKey: 'freelance',
      contractNo: 'CRP-FRL-2026/039',
      title: 'BAĞIMSIZ YÜKLENİCİ (FREELANCE) TASARIM VE GELİŞTİRME SÖZLEŞMESİ',
      subtitle: 'Teslimat Kilometre Taşları (Milestone), Revizyon Sınırı ve Telif Devri',
      effectiveDate: '2026-10-17',
      durationMonths: 3,
      jurisdictionCity: 'Ankara Mahkemeleri ve İcra Daireleri',
      contractValue: 85000,
      currency: 'TRY',
      penaltyAmount: 30000,
      accentColor: '#2563eb',
      showOfficialStamp: true,
      showDigitalVerifyQr: true,
      stampTitle: 'PROJE KABUL & TELİF ONAYLI',
      partyA: {
        roleTitle: 'BAĞIMSIZ YÜKLENİCİ (TASARIMCI / GELİŞTİRİCİ)',
        companyName: 'Deniz Arslan — Dijital Ürün Stüdyosu',
        representative: 'Deniz Arslan',
        taxOfficeAndNo: 'Çankaya V.D. / 49281736450',
        address: 'Tunalı Hilmi Cad. No: 88 Çankaya / Ankara',
        email: 'deniz@arslanstudio.design',
      },
      partyB: {
        roleTitle: 'İŞVEREN (MÜŞTERİ)',
        companyName: 'Nova FinTech Ödeme Sistemleri A.Ş.',
        representative: 'Kerem Soylu (Ürün Direktörü)',
        taxOfficeAndNo: 'Büyük mükellefler V.D. / 7182930451',
        address: 'Esentepe Mah. Büyükdere Cad. No: 120 Şişli / İstanbul',
        email: 'product@novafintech.io',
      },
      clauses: [
        {
          id: 'fl1',
          number: 'MADDE 1',
          title: 'TESLİMATLAR VE REVİZYON HAKKI',
          body: 'YÜKLENİCİ, kararlaştırılan UI/UX tasarım ekranlarını ve ön yüz bileşenlerini teslim takvimine uygun olarak sunar. Proje bedeline toplam 3 (üç) tur kapsamlı revizyon dahildir; ek talepler saatlik ücret üzerinden ayrıca faturalandırılır.',
          category: 'core',
          mandatory: true,
        },
        {
          id: 'fl2',
          number: 'MADDE 2',
          title: 'PROJE BEDELİ VE ÖN ÖDEME (KAPORA)',
          body: 'Toplam proje bedeli {{CONTRACT_VALUE}} olup %50’si sözleşme imzasında avans olarak, kalan %50’si ise nihai dosya tesliminde ödenir.',
          category: 'financial',
          mandatory: true,
        },
        {
          id: 'fl3',
          number: 'MADDE 3',
          title: 'TELİF DEVİR ŞARTI VE PORTFOLYO HAKKI',
          body: 'Proje bedelinin tamamı ödenene kadar tüm tasarım ve kodların mülkiyeti YÜKLENİCİ’ye aittir. Ödeme tamamlandığında kullanım ve işleme hakları İŞVEREN’e geçer. YÜKLENİCİ çalışmayı kendi portfolyosunda referans olarak sergileyebilir.',
          category: 'ip-privacy',
          mandatory: true,
        },
        {
          id: 'fl4',
          number: 'MADDE 4',
          title: 'YETKİLİ MAHKEME VE YÜRÜRLÜK',
          body: 'İşbu sözleşme {{EFFECTIVE_DATE}} tarihinde yürürlüğe girmiş olup uyuşmazlıklarda {{JURISDICTION}} yetkilidir.',
          category: 'jurisdiction',
          mandatory: true,
        },
      ],
    }),
  },

  kvkk: {
    name: 'KVKK Veri İşleme & Aydınlatma Protokolü',
    badge: '6698 KVKK',
    build: () => ({
      templateKey: 'kvkk',
      contractNo: 'CRP-KVK-2026/019',
      title: '6698 SAYILI KVKK KAPSAMINDA VERİ AKTARIM VE İŞLEME PROTOKOLÜ',
      subtitle: 'Veri Sorumlusu ve Veri İşleyen Arasındaki Teknik & İdari Tedbirler Sözleşmesi',
      effectiveDate: '2026-10-17',
      durationMonths: 24,
      jurisdictionCity: 'İstanbul Anadolu Mahkemeleri ve İcra Daireleri',
      contractValue: 0,
      currency: 'TRY',
      penaltyAmount: 150000,
      accentColor: '#d97706',
      showOfficialStamp: true,
      showDigitalVerifyQr: true,
      stampTitle: '6698 KVKK VERİ GÜVENLİĞİ ONAYLI',
      partyA: {
        roleTitle: 'VERİ SORUMLUSU',
        companyName: 'Medikal Plus Sağlık Hizmetleri A.Ş.',
        representative: 'Dr. Elif Aydın (KVKK İrtibat Kişisi)',
        taxOfficeAndNo: 'Kadıköy V.D. / 5182940372',
        address: 'Fenerbahçe Mah. Bağdat Cad. No: 112 Kadıköy / İstanbul',
        email: 'kvkk@medikalplus.com.tr',
      },
      partyB: {
        roleTitle: 'VERİ İŞLEYEN (BULUT / YAZILIM SAĞLAYICI)',
        companyName: 'Corpus Teknoloji ve Yazılım A.Ş.',
        representative: 'Ahmet Yılmaz (Bilgi Güvenliği Yöneticisi)',
        taxOfficeAndNo: 'Maslak V.D. / 2940581920',
        address: 'Maslak Mah. Büyükdere Cad. No: 194 Sarıyer / İstanbul',
        email: 'dpo@corpustech.com.tr',
      },
      clauses: [
        {
          id: 'k1',
          number: 'MADDE 1',
          title: 'KİŞİSEL VERİLERİN İŞLENME AMACI VE SINIRI',
          body: 'VERİ İŞLEYEN, kendisine aktarılan kişisel verileri yalnızca VERİ SORUMLUSU’nun yazılı talimatları doğrultusunda ve 6698 sayılı Kanun’un 4., 5. ve 6. maddelerine uygun olarak işleyeceğini kabul ve taahhüt eder.',
          category: 'ip-privacy',
          mandatory: true,
        },
        {
          id: 'k2',
          number: 'MADDE 2',
          title: 'TEKNİK VE İDARİ GÜVENLİK TEDBİRLERİ (MADDE 12)',
          body: 'VERİ İŞLEYEN; uçtan uca şifreleme (AES-256), erişim loglama, rol bazlı yetkilendirme ve sızma testi dahil olmak üzere Kişisel Verileri Koruma Kurulu rehberlerinde belirtilen tüm teknik tedbirleri almakla yükümlüdür.',
          category: 'core',
          mandatory: true,
        },
        {
          id: 'k3',
          number: 'MADDE 3',
          title: 'VERİ İHLALİ BİLDİRİMİ VE CEZAİ ŞART',
          body: 'Olası bir veri sızıntısı halinde VERİ İŞLEYEN durumu en geç 24 (yirmidört) saat içinde VERİ SORUMLUSU’na bildirir. Ağır kusur veya ihlal durumunda {{PENALTY_VALUE}} cezai şart uygulanır.',
          category: 'financial',
          mandatory: true,
        },
        {
          id: 'k4',
          number: 'MADDE 4',
          title: 'VERİLERİN İMHASI VE YETKİLİ MAHKEME',
          body: 'Sözleşme sona erdiğinde VERİ İŞLEYEN elindeki tüm kişisel verileri geri döndürülemez biçimde siler veya anonim hale getirir. Uyuşmazlıklarda {{JURISDICTION}} yetkilidir.',
          category: 'jurisdiction',
          mandatory: true,
        },
      ],
    }),
  },
};

export const DEFAULT_CONTRACT_DATA: ContractData =
  CONTRACT_TEMPLATES['software-service'].build();

export function formatCurrencyValue(amount: number, currency: 'TRY' | 'USD' | 'EUR'): string {
  const symbols: Record<'TRY' | 'USD' | 'EUR', string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
  };
  return `${symbols[currency]}${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} (${currency})`;
}

/** Interpolate placeholders like {{CONTRACT_VALUE}} inside clause text */
export function resolveClauseVariables(body: string, data: ContractData): string {
  return body
    .replace(/\{\{CONTRACT_VALUE\}\}/g, formatCurrencyValue(data.contractValue, data.currency))
    .replace(/\{\{PENALTY_VALUE\}\}/g, formatCurrencyValue(data.penaltyAmount, data.currency))
    .replace(/\{\{EFFECTIVE_DATE\}\}/g, data.effectiveDate)
    .replace(/\{\{DURATION_MONTHS\}\}/g, String(data.durationMonths))
    .replace(/\{\{JURISDICTION\}\}/g, data.jurisdictionCity);
}

/** Run automated Legal Risk & Compliance Audit on the contract */
export function auditContractProtection(data: ContractData): LegalAuditResult {
  const hasIpOrPrivacy = data.clauses.some((c) => c.category === 'ip-privacy');
  const hasFinancialOrPenalty =
    data.clauses.some((c) => c.category === 'financial') || data.penaltyAmount > 0;
  const hasJurisdiction =
    data.clauses.some((c) => c.category === 'jurisdiction') &&
    data.jurisdictionCity.trim().length > 3;
  const hasPartyTaxInfo =
    data.partyA.taxOfficeAndNo.trim().length > 4 &&
    data.partyB.taxOfficeAndNo.trim().length > 4;
  const hasEnoughClauses = data.clauses.length >= 4;

  const checks = [
    {
      label: 'Taraf Vergi / VKN & Temsilci Bilgileri Tamamlandı',
      passed: hasPartyTaxInfo,
      hint: 'Her iki tarafın Vergi Dairesi ve VKN/TCKN bilgisi resmi geçerlilik için gereklidir.',
    },
    {
      label: 'Fikri Mülkiyet (FSEK) / Gizlilik (KVKK) Koruma Maddesi Mevcut',
      passed: hasIpOrPrivacy,
      hint: 'Telif devri veya gizlilik maddesi sözleşmede yer alıyor.',
    },
    {
      label: 'Cezai Şart & Mali Temerrüt Güvencesi Tanımlı',
      passed: hasFinancialOrPenalty,
      hint: 'İhlal durumunda caydırıcı cezai şart tutarı tanımlanmış.',
    },
    {
      label: 'HMK m.193 Delil Sözleşmesi & Yetkili Mahkeme Belirtilmiş',
      passed: hasJurisdiction,
      hint: 'Uyuşmazlık halinde yetkili mahkeme ve icra daireleri açıkça yazılmış.',
    },
    {
      label: 'Kapsamlı Madde Yapısı (En Az 4 Ana Hukuki Madde)',
      passed: hasEnoughClauses,
      hint: 'Sözleşme maddeleri yeterli detay seviyesinde.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  return { score, checks };
}

/** Wrap text lines inside a given pixel width on HTML5 Canvas */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
}

/** Render official A4 Legal Contract onto high-resolution HTML5 Canvas */
export function renderContractToA4Canvas(
  canvas: HTMLCanvasElement,
  data: ContractData
): void {
  const width = 1240;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clean White Official Paper Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Frame Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Top Accent Header Bar
  ctx.fillStyle = data.accentColor;
  ctx.fillRect(48, 48, width - 96, 14);

  // Contract Metadata Top Row
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 17px JetBrains Mono, monospace';
  ctx.fillText(`BELGE NO: ${data.contractNo}`, 84, 102);

  ctx.textAlign = 'right';
  ctx.fillText(
    `YÜRÜRLÜK TARİHİ: ${data.effectiveDate}  |  SÜRE: ${data.durationMonths} AY`,
    width - 84,
    102
  );
  ctx.textAlign = 'left';

  // Main Contract Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.title, width / 2, 152);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px Inter, system-ui, sans-serif';
  ctx.fillText(data.subtitle, width / 2, 182);
  ctx.textAlign = 'left';

  // Divider Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 204);
  ctx.lineTo(width - 84, 204);
  ctx.stroke();

  // Two-Column Parties Box
  const boxY = 224;
  const boxW = (width - 196) / 2;
  const boxH = 185;

  [
    { party: data.partyA, x: 84 },
    { party: data.partyB, x: 84 + boxW + 28 },
  ].forEach(({ party, x }) => {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = data.accentColor;
    ctx.font = 'bold 15px Inter, system-ui, sans-serif';
    ctx.fillText(party.roleTitle, x + 18, boxY + 30);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillText(party.companyName, x + 18, boxY + 58);

    ctx.fillStyle = '#334155';
    ctx.font = '15px Inter, system-ui, sans-serif';
    ctx.fillText(`Yetkili Temsilci: ${party.representative}`, x + 18, boxY + 86);
    ctx.fillText(`Vergi D. / No: ${party.taxOfficeAndNo}`, x + 18, boxY + 112);
    ctx.fillText(`E-Posta: ${party.email}`, x + 18, boxY + 138);

    ctx.fillStyle = '#64748b';
    ctx.font = '13.5px Inter, system-ui, sans-serif';
    ctx.fillText(party.address.slice(0, 62), x + 18, boxY + 164);
  });

  // Financial & Summary Strip
  const stripY = 428;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(84, stripY, width - 168, 46);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText(
    `SÖZLEŞME BEDELİ: ${
      data.contractValue > 0
        ? formatCurrencyValue(data.contractValue, data.currency)
        : 'Bedelsiz / Karşılıklı Taahhüt'
    }    •    CEZAİ ŞART: ${formatCurrencyValue(
      data.penaltyAmount,
      data.currency
    )}    •    YETKİLİ MERCİ: ${data.jurisdictionCity}`,
    102,
    stripY + 29
  );

  // Clauses Section
  let curY = 510;
  for (const clause of data.clauses) {
    if (curY > 1360) break;

    ctx.fillStyle = data.accentColor;
    ctx.font = 'bold 17px Inter, system-ui, sans-serif';
    ctx.fillText(`${clause.number} — ${clause.title}`, 84, curY);
    curY += 26;

    ctx.fillStyle = '#1e293b';
    ctx.font = '15.5px Inter, system-ui, sans-serif';
    const resolvedText = resolveClauseVariables(clause.body, data);
    curY = wrapCanvasText(ctx, resolvedText, 84, curY, width - 168, 24);
    curY += 18;
  }

  // Bottom Signature & Stamp Section
  const sigY = 1435;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(84, sigY - 22);
  ctx.lineTo(width - 84, sigY - 22);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 14px Inter, system-ui, sans-serif';
  ctx.fillText(
    `İşbu sözleşme ${data.clauses.length} (${data.clauses.length}) maddeden ibaret olup, taraflarca okunarak ${data.effectiveDate} tarihinde 2 (iki) asıl nüsha olarak imza altına alınmıştır.`,
    84,
    sigY + 4
  );

  // Party A & Party B Signature Boxes
  [
    { party: data.partyA, x: 84 },
    { party: data.partyB, x: width - 84 - 420 },
  ].forEach(({ party, x }) => {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, sigY + 28, 420, 185);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Inter, system-ui, sans-serif';
    ctx.fillText(party.roleTitle, x + 20, sigY + 56);

    ctx.fillStyle = '#334155';
    ctx.font = '15px Inter, system-ui, sans-serif';
    ctx.fillText(party.companyName, x + 20, sigY + 82);
    ctx.fillText(`Yetkili: ${party.representative}`, x + 20, sigY + 106);

    // Stylized Wet Signature Curve
    ctx.save();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + 40, sigY + 165);
    ctx.bezierCurveTo(x + 95, sigY + 120, x + 150, sigY + 190, x + 220, sigY + 140);
    ctx.bezierCurveTo(x + 250, sigY + 125, x + 270, sigY + 170, x + 320, sigY + 152);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Kaşe / Islak veya Nitelikli Elektronik İmza', x + 20, sigY + 196);
  });

  // Official Circular Stamp in the Center
  if (data.showOfficialStamp) {
    const cx = width / 2;
    const cy = sigY + 120;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.14);

    ctx.strokeStyle = data.accentColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 64, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = data.accentColor;
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.stampTitle.slice(0, 26), 0, -14);
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.fillText(data.contractNo, 0, 8);
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('SHA-256 DOĞRULANDI', 0, 28);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  // Bottom Digital Hash Footer
  if (data.showDigitalVerifyQr) {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText(
      `DİJİTAL BÜTÜNLÜK İZİ (SHA-256): e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  •  Corpus Contract Studio #013`,
      84,
      height - 66
    );
  }
}

/** Export the rendered A4 Contract Canvas directly to an A4 PDF file */
export async function exportContractCanvasToPdf(
  canvas: HTMLCanvasElement,
  data: ContractData
): Promise<void> {
  renderContractToA4Canvas(canvas, data);
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  const fileName = `${data.contractNo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sozlesme.pdf`;
  pdf.save(fileName);
}

/** Export the contract as an editable Microsoft Word (.doc) file */
export function exportContractToWordDoc(data: ContractData): void {
  const clausesHtml = data.clauses
    .map(
      (c) =>
        `<h3 style="color:#1e293b;font-family:Arial,sans-serif;margin-top:16px;">${c.number} - ${c.title}</h3>
         <p style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#334155;">${resolveClauseVariables(
           c.body,
           data
         )}</p>`
    )
    .join('\n');

  const html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset="utf-8"><title>${data.title}</title></head>
  <body style="font-family:Arial,sans-serif;padding:24px;">
    <p style="font-size:10pt;color:#475569;"><strong>Belge No:</strong> ${data.contractNo} | <strong>Yürürlük Tarihi:</strong> ${data.effectiveDate}</p>
    <h1 style="font-size:16pt;text-align:center;color:#0f172a;">${data.title}</h1>
    <p style="text-align:center;color:#64748b;font-size:10pt;">${data.subtitle}</p>
    <hr/>
    <h3>TARAFLAR</h3>
    <p><strong>1. ${data.partyA.roleTitle}:</strong> ${data.partyA.companyName} (Yetkili: ${data.partyA.representative}, Vergi No: ${data.partyA.taxOfficeAndNo}, Adres: ${data.partyA.address})</p>
    <p><strong>2. ${data.partyB.roleTitle}:</strong> ${data.partyB.companyName} (Yetkili: ${data.partyB.representative}, Vergi No: ${data.partyB.taxOfficeAndNo}, Adres: ${data.partyB.address})</p>
    <hr/>
    ${clausesHtml}
    <hr/>
    <p><strong>${data.partyA.roleTitle} İMZA:</strong> ___________________________</p>
    <p><strong>${data.partyB.roleTitle} İMZA:</strong> ___________________________</p>
  </body></html>`;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.contractNo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
