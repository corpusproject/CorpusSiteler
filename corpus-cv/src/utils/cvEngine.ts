import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';

export type CvTemplateStyle = 'executive-modern' | 'harvard-ats' | 'creative-sidebar';

export interface CvExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface CvEducationItem {
  id: string;
  degree: string;
  school: string;
  period: string;
  gpaOrNotes: string;
}

export interface CvSkillItem {
  id: string;
  name: string;
  category: 'Core' | 'Tech' | 'Soft' | 'Tool';
  level: number; // 1 to 5
}

export interface CvProjectItem {
  id: string;
  name: string;
  techStack: string;
  link: string;
  description: string;
}

export interface CvLanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export interface CvDocumentData {
  template: CvTemplateStyle;
  accentColor: string;
  showQrCode: boolean;
  qrUrl: string;
  photoDataUrl: string | null;
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
    summary: string;
  };
  experiences: CvExperienceItem[];
  educations: CvEducationItem[];
  skills: CvSkillItem[];
  projects: CvProjectItem[];
  languages: CvLanguageItem[];
  certifications: string[];
  coverLetter: {
    recipientName: string;
    recipientRole: string;
    companyName: string;
    companyAddress: string;
    date: string;
    subject: string;
    salutation: string;
    openingParagraph: string;
    bodyParagraph: string;
    closingParagraph: string;
    signOff: string;
  };
}

export const DEFAULT_CV_DATA: CvDocumentData = {
  template: 'executive-modern',
  accentColor: '#7c3aed',
  showQrCode: true,
  qrUrl: 'https://linkedin.com/in/kaan-demir-architect',
  photoDataUrl: null,
  personal: {
    fullName: 'Kaan Demir',
    title: 'Senior Full-Stack & Cloud Solutions Architect',
    email: 'kaan.demir@corpus.app',
    phone: '+90 532 410 88 92',
    location: 'İstanbul, Türkiye (Hybrid / Remote)',
    website: 'kaandemir.dev',
    linkedin: 'linkedin.com/in/kaan-demir',
    github: 'github.com/kaandemir',
    summary:
      '8+ yıl yüksek trafikli finansal teknoloji ve SaaS platformları geliştirme deneyimine sahip Kıdemli Yazılım Mimarı. Mikroservis dönüşümü, dağıtık bulut mimarileri (AWS/Kubernetes) ve modern TypeScript/React ekosistemlerinde uzman. Sistem gecikmelerini %45 azaltan ve yıllık bulut maliyetlerinde $120K tasarruf sağlayan ölçeklenebilir mimarilere liderlik etti.',
  },
  experiences: [
    {
      id: 'exp-1',
      role: 'Lead Software Architect',
      company: 'FinNova Teknoloji A.Ş.',
      location: 'İstanbul, TR',
      period: 'Oca 2022 – Günümüz',
      bullets: [
        'Günlük 4.2 milyon işlemi yöneten çekirdek ödeme ağ geçidini monolitik yapıdan Go, Node.js ve Kafka tabanlı mikroservis mimarisine taşıyarak sistem erişilebilirliğini %99.98 seviyesine çıkardı.',
        'React 19, TypeScript ve Edge önbellekleme mimarisiyle kurumsal müşteri panelini yeniden tasarlayarak sayfa yüklenme süresini (LCP) 2.8 saniyeden 0.7 saniyeye (%75 iyileşme) düşürdü.',
        '14 kişilik mühendislik ekibine teknik liderlik yaptı; otomatik CI/CD (GitHub Actions + ArgoCD) süreçleriyle haftalık canlıya geçiş süresini %60 kısalttı.',
      ],
    },
    {
      id: 'exp-2',
      role: 'Senior Full-Stack Engineer',
      company: 'CloudScale Europe GmbH',
      location: 'Berlin, DE (Remote)',
      period: 'Haz 2019 – Ara 2021',
      bullets: [
        'Avrupa genelinde 850+ kurumsal müşterinin kullandığı gerçek zamanlı veri analitiği platformunu TypeScript, Next.js, PostgreSQL ve Redis kullanarak geliştirdi.',
        'Çok kiracılı (multi-tenant) veritabanı sorgu optimizasyonlarıyla rapor oluşturma hızını 4 kat artırdı ve AWS RDS sunucu maliyetlerini %32 düşürdü.',
        'WebRTC ve WebSockets tabanlı uçtan uca şifreli kurumsal işbirliği modülünü sıfırdan tasarlayıp canlıya aldı.',
      ],
    },
    {
      id: 'exp-3',
      role: 'Software Engineer',
      company: 'Piksel Dijital Çözümler',
      location: 'Ankara, TR',
      period: 'Tem 2017 – May 2019',
      bullets: [
        'E-ticaret ve lojistik müşterileri için yüksek performanslı RESTful ve GraphQL API servisleri geliştirdi; 15+ kurumsal projeyi zamanında teslim etti.',
        'Birim ve entegrasyon test kapsamını (Jest & Cypress) %25 seviyesinden %88 seviyesine çıkararak canlı ortam hatalarını %50 azalttı.',
      ],
    },
  ],
  educations: [
    {
      id: 'edu-1',
      degree: 'Bilgisayar Mühendisliği Lisans (B.Sc.)',
      school: 'Orta Doğu Teknik Üniversitesi (ODTÜ)',
      period: '2013 – 2017',
      gpaOrNotes: 'Onur Derecesi (GPA: 3.58 / 4.00) • Dağıtık Sistemler & Yapay Zeka Seçmeli Paketi',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'TypeScript / JavaScript', category: 'Tech', level: 5 },
    { id: 'sk-2', name: 'React / Next.js', category: 'Tech', level: 5 },
    { id: 'sk-3', name: 'Node.js / Go', category: 'Tech', level: 5 },
    { id: 'sk-4', name: 'AWS & Kubernetes', category: 'Tool', level: 4 },
    { id: 'sk-5', name: 'PostgreSQL / Redis / Kafka', category: 'Tech', level: 5 },
    { id: 'sk-6', name: 'System Architecture & Microservices', category: 'Core', level: 5 },
    { id: 'sk-7', name: 'CI/CD, Docker & Terraform', category: 'Tool', level: 4 },
    { id: 'sk-8', name: 'Engineering Leadership & Agile', category: 'Soft', level: 5 },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Corpus Local-First Suite',
      techStack: 'React, TypeScript, WebAssembly, WebRTC, WebAudio DSP',
      link: 'github.com/kaandemir/corpus-suite',
      description: 'Tarayıcı içinde sunucusuz çalışan 100 araçlık gizlilik odaklı üretkenlik platformu (12K+ GitHub yıldızı).',
    },
    {
      id: 'proj-2',
      name: 'PulseGuard APM',
      techStack: 'Go, ClickHouse, OpenTelemetry, Tailwind',
      link: 'pulseguard.io',
      description: 'Mikroservis mimarileri için düşük gecikmeli açık kaynaklı gerçek zamanlı izleme ve anomali tespit motoru.',
    },
  ],
  languages: [
    { id: 'lang-1', language: 'Türkçe', proficiency: 'Anadil (Native)' },
    { id: 'lang-2', language: 'İngilizce', proficiency: 'İleri Profesyonel (C1 - IELTS 8.0)' },
    { id: 'lang-3', language: 'Almanca', proficiency: 'Orta Seviye (B1)' },
  ],
  certifications: [
    'AWS Certified Solutions Architect – Professional (2024)',
    'Certified Kubernetes Administrator (CKA - Linux Foundation)',
    'Professional Scrum Master (PSM I)',
  ],
  coverLetter: {
    recipientName: 'İşe Alım Yöneticisi ve Mühendislik Liderliği',
    recipientRole: 'Talent Acquisition & VP of Engineering',
    companyName: 'Global Tech Innovations Inc.',
    companyAddress: 'Levent, Büyükdere Cad. No: 199, İstanbul',
    date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }),
    subject: 'Senior Software Architect Pozisyonu Başvurusu — Kaan Demir',
    salutation: 'Sayın İşe Alım Komitesi,',
    openingParagraph:
      'Şirketinizin yüksek ölçekli bulut platformları ve yeni nesil finansal ürünler geliştirme vizyonunu yakından takip ediyorum. 8 yılı aşkın süredir yüksek trafikli dağıtık sistemler, mikroservis mimarileri ve modern ön yüz teknolojileri (React/TypeScript) alanında edindiğim teknik liderlik deneyimiyle ekibinize doğrudan değer katabileceğime inanıyorum.',
    bodyParagraph:
      'Mevcut görevimde FinNova Teknoloji bünyesinde günlük 4.2 milyon işlemi yöneten çekirdek mimarinin dönüşümüne liderlik ederek sistem erişilebilirliğini %99.98 seviyesine taşıdım ve ön yüz performansında %75 iyileşme sağladım. Daha önce CloudScale Europe GmbH ekibinde çok kiracılı SaaS veri platformlarının ölçeklenmesinde üstlendiğim sorumluluklar, hem teknik derinlik hem de ürün odaklı mühendislik kültürü açısından aradığınız profille güçlü bir uyum göstermektedir.',
    closingParagraph:
      'Mühendislik ekibinizin hedeflerine nasıl katkıda bulunabileceğimi ve mimari vizyonumu detaylıca paylaşmak üzere uygun göreceğiniz bir zamanda görüşmekten memnuniyet duyarım. Zaman ayırdığınız ve başvurumu değerlendirdiğiniz için teşekkür ederim.',
    signOff: 'Saygılarımla,',
  },
};

export interface AtsAnalysisResult {
  score: number;
  metricsCount: number;
  bulletCount: number;
  wordCount: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  checks: {
    label: string;
    passed: boolean;
    tip: string;
  }[];
}

export function analyzeAtsScore(cv: CvDocumentData, jobDescription: string): AtsAnalysisResult {
  const allBullets = cv.experiences.flatMap((e) => e.bullets);
  const fullText = [
    cv.personal.fullName,
    cv.personal.title,
    cv.personal.summary,
    ...cv.experiences.map((e) => `${e.role} ${e.company} ${e.bullets.join(' ')}`),
    ...cv.educations.map((ed) => `${ed.degree} ${ed.school} ${ed.gpaOrNotes}`),
    ...cv.skills.map((s) => s.name),
    ...cv.projects.map((p) => `${p.name} ${p.techStack} ${p.description}`),
    ...cv.certifications,
  ].join(' ');

  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Count measurable impact metrics (%, $, numbers +x, etc.)
  const metricMatches = fullText.match(/(\d+%|\$\d+|\d+x|\d+\+|\d+\.\d+)/gi) || [];
  const metricsCount = metricMatches.length;

  const hasContactComplete = Boolean(
    cv.personal.email.includes('@') &&
      cv.personal.phone.trim().length >= 7 &&
      (cv.personal.linkedin.trim() || cv.personal.github.trim() || cv.personal.website.trim())
  );
  const hasGoodSummary = cv.personal.summary.trim().length >= 120 && cv.personal.summary.trim().length <= 500;
  const hasSufficientBullets = allBullets.length >= 5;
  const hasQuantifiedImpact = metricsCount >= 3;
  const hasSkillsAndCerts = cv.skills.length >= 6 && cv.educations.length >= 1;

  // Keyword matching against job description if provided
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  if (jobDescription.trim().length > 15) {
    const stopWords = new Set([
      've', 'ile', 'için', 'bir', 'bu', 'olan', 'olarak', 'veya', 'gibi', 'daha', 'çok', 'en', 'de', 'da',
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'you', 'are', 'our',
      'work', 'team', 'experience', 'role', 'years', 'looking', 'strong', 'skills', 'ability', 'knowledge',
    ]);

    const jdTokens = Array.from(
      new Set(
        jobDescription
          .toLowerCase()
          .replace(/[^\p{L}\p{N}.+#-]/gu, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !stopWords.has(w) && !/^\d+$/.test(w))
      )
    ).slice(0, 30);

    const cvLower = fullText.toLowerCase();
    for (const kw of jdTokens) {
      if (cvLower.includes(kw)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }
  }

  const checks = [
    {
      label: 'İletişim & Profesyonel Link Doğrulaması',
      passed: hasContactComplete,
      tip: 'E-posta, telefon ve LinkedIn/GitHub bağlantılarınızın eksiksiz olması ATS ayrıştırıcıları için kritiktir.',
    },
    {
      label: 'Ölçülebilir Başarı Metrikleri (%, $, Rakamsal Etki)',
      passed: hasQuantifiedImpact,
      tip: `CV'nizde ${metricsCount} adet sayısal etki metriği bulundu (Önerilen: en az 3+ somut yüzde veya rakam).`,
    },
    {
      label: 'Yönetici Özeti Uzunluk Dengesi (120–500 Karakter)',
      passed: hasGoodSummary,
      tip: 'Özet alanı işe alım uzmanının ilk 6 saniyede ana uzmanlığınızı anlamasını sağlar.',
    },
    {
      label: 'Eylem Odaklı Deneyim Maddeleri (5+ Madde)',
      passed: hasSufficientBullets,
      tip: `Deneyim bölümünde toplam ${allBullets.length} başarı maddesi yer alıyor.`,
    },
    {
      label: 'Teknik Yetenek & Eğitim Bütünlüğü',
      passed: hasSkillsAndCerts,
      tip: `${cv.skills.length} yetenek ve ${cv.educations.length} eğitim kaydı ATS anahtar kelime indeksine eklendi.`,
    },
  ];

  let score = 30;
  if (hasContactComplete) score += 14;
  if (hasGoodSummary) score += 14;
  if (hasSufficientBullets) score += 14;
  if (hasQuantifiedImpact) score += 16;
  if (hasSkillsAndCerts) score += 12;

  if (jobDescription.trim().length > 15 && matchedKeywords.length + missingKeywords.length > 0) {
    const matchRatio = matchedKeywords.length / (matchedKeywords.length + missingKeywords.length);
    score = Math.round(score * 0.7 + matchRatio * 100 * 0.3);
  }

  return {
    score: Math.min(100, Math.max(20, score)),
    metricsCount,
    bulletCount: allBullets.length,
    wordCount,
    matchedKeywords: matchedKeywords.slice(0, 18),
    missingKeywords: missingKeywords.slice(0, 12),
    checks,
  };
}

// Helper for multi-line wrapped text on HTML5 Canvas
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
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
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
 * Renders the CV onto a high-DPI A4 Canvas (1588 x 2246 px = 2x Retina A4)
 */
export async function renderCvToA4Canvas(
  canvas: HTMLCanvasElement,
  cv: CvDocumentData
): Promise<void> {
  const W = 1588;
  const H = 2246;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // White paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const accent = cv.accentColor || '#7c3aed';

  // Pre-generate QR code if enabled
  let qrImg: HTMLImageElement | null = null;
  if (cv.showQrCode && cv.qrUrl.trim()) {
    try {
      const qrDataUrl = await QRCode.toDataURL(cv.qrUrl.trim(), {
        width: 220,
        margin: 1,
        color: {
          dark: cv.template === 'creative-sidebar' ? '#0f172a' : '#18181b',
          light: '#ffffff',
        },
      });
      qrImg = await loadImageElement(qrDataUrl);
    } catch {
      qrImg = null;
    }
  }

  let photoImg: HTMLImageElement | null = null;
  if (cv.photoDataUrl) {
    photoImg = await loadImageElement(cv.photoDataUrl);
  }

  if (cv.template === 'creative-sidebar') {
    await renderSidebarTemplate(ctx, W, H, cv, accent, photoImg, qrImg);
  } else if (cv.template === 'harvard-ats') {
    await renderHarvardAtsTemplate(ctx, W, H, cv, accent, photoImg, qrImg);
  } else {
    await renderExecutiveModernTemplate(ctx, W, H, cv, accent, photoImg, qrImg);
  }
}

async function renderExecutiveModernTemplate(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cv: CvDocumentData,
  accent: string,
  photoImg: HTMLImageElement | null,
  qrImg: HTMLImageElement | null
) {
  const marginX = 96;
  let y = 88;

  // Top Accent Bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 16);

  // Photo + QR right margin reservations
  let headerRightOffset = 0;
  if (qrImg) {
    ctx.drawImage(qrImg, W - marginX - 130, 68, 130, 130);
    ctx.fillStyle = '#71717a';
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PORTFOLYO / IN', W - marginX - 65, 218);
    ctx.textAlign = 'left';
    headerRightOffset += 160;
  }

  if (photoImg) {
    const px = W - marginX - headerRightOffset - 136;
    const py = 68;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px + 68, py + 68, 68, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(photoImg, px, py, 136, 136);
    ctx.restore();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px + 68, py + 68, 68, 0, Math.PI * 2);
    ctx.stroke();
    headerRightOffset += 166;
  }

  const headerMaxW = W - marginX * 2 - headerRightOffset;

  // Full Name
  ctx.fillStyle = '#09090b';
  ctx.font = '800 56px "Inter", sans-serif';
  ctx.fillText(cv.personal.fullName || 'Ad Soyad', marginX, y + 40);
  y += 66;

  // Job Title
  ctx.fillStyle = accent;
  ctx.font = '700 28px "Inter", sans-serif';
  ctx.fillText(cv.personal.title || 'Unvan / Pozisyon', marginX, y + 20);
  y += 46;

  // Contact Info Line
  const contacts = [
    cv.personal.email,
    cv.personal.phone,
    cv.personal.location,
    cv.personal.linkedin,
    cv.personal.github,
    cv.personal.website,
  ].filter((c) => c && c.trim().length > 0);

  ctx.fillStyle = '#52525b';
  ctx.font = '500 20px "Inter", sans-serif';
  y = drawWrappedText(ctx, contacts.join('   •   '), marginX, y + 12, headerMaxW, 30);

  y = Math.max(y + 18, photoImg || qrImg ? 245 : y + 18);

  // Divider
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(W - marginX, y);
  ctx.stroke();
  y += 38;

  // Summary Section
  if (cv.personal.summary.trim()) {
    ctx.fillStyle = accent;
    ctx.font = '800 21px "Inter", sans-serif';
    ctx.fillText('PROFESYONEL ÖZET', marginX, y);
    y += 32;

    ctx.fillStyle = '#27272a';
    ctx.font = '400 21px "Inter", sans-serif';
    y = drawWrappedText(ctx, cv.personal.summary, marginX, y, W - marginX * 2, 32);
    y += 22;
  }

  // Two-column body: Left (Main Experience & Projects 66%) | Right (Skills, Education, Certs, Languages 30%)
  const leftW = 910;
  const rightX = marginX + leftW + 58;
  const rightW = W - rightX - marginX;

  let leftY = y;
  let rightY = y;

  // LEFT COLUMN: Experience
  ctx.fillStyle = accent;
  ctx.font = '800 22px "Inter", sans-serif';
  ctx.fillText('İŞ DENEYİMİ & BAŞARILAR', marginX, leftY);
  leftY += 14;
  ctx.fillStyle = accent;
  ctx.fillRect(marginX, leftY, 64, 4);
  leftY += 32;

  for (const exp of cv.experiences) {
    if (leftY > H - 140) break;

    ctx.fillStyle = '#09090b';
    ctx.font = '700 25px "Inter", sans-serif';
    ctx.fillText(exp.role, marginX, leftY);

    ctx.fillStyle = accent;
    ctx.font = '600 19px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(exp.period, marginX + leftW, leftY);
    ctx.textAlign = 'left';
    leftY += 28;

    ctx.fillStyle = '#52525b';
    ctx.font = '600 21px "Inter", sans-serif';
    ctx.fillText(`${exp.company}  —  ${exp.location}`, marginX, leftY);
    leftY += 30;

    ctx.fillStyle = '#27272a';
    ctx.font = '400 20px "Inter", sans-serif';
    for (const b of exp.bullets) {
      if (!b.trim()) continue;
      ctx.fillStyle = accent;
      ctx.fillText('•', marginX + 4, leftY);
      ctx.fillStyle = '#27272a';
      leftY = drawWrappedText(ctx, b, marginX + 26, leftY, leftW - 26, 29);
      leftY += 6;
    }
    leftY += 20;
  }

  // LEFT COLUMN: Projects
  if (cv.projects.length > 0 && leftY < H - 180) {
    leftY += 8;
    ctx.fillStyle = accent;
    ctx.font = '800 22px "Inter", sans-serif';
    ctx.fillText('ÖNE ÇIKAN PROJELER & AÇIK KAYNAK', marginX, leftY);
    leftY += 14;
    ctx.fillRect(marginX, leftY, 64, 4);
    leftY += 32;

    for (const proj of cv.projects) {
      if (leftY > H - 100) break;
      ctx.fillStyle = '#09090b';
      ctx.font = '700 22px "Inter", sans-serif';
      ctx.fillText(proj.name, marginX, leftY);

      if (proj.link) {
        ctx.fillStyle = accent;
        ctx.font = '500 18px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(proj.link, marginX + leftW, leftY);
        ctx.textAlign = 'left';
      }
      leftY += 26;

      ctx.fillStyle = '#52525b';
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillText(proj.techStack, marginX, leftY);
      leftY += 26;

      ctx.fillStyle = '#27272a';
      ctx.font = '400 19px "Inter", sans-serif';
      leftY = drawWrappedText(ctx, proj.description, marginX, leftY, leftW, 27);
      leftY += 18;
    }
  }

  // RIGHT COLUMN: Skills
  ctx.fillStyle = accent;
  ctx.font = '800 22px "Inter", sans-serif';
  ctx.fillText('YETKİNLİKLER & TEKNOLOJİ', rightX, rightY);
  rightY += 14;
  ctx.fillRect(rightX, rightY, 54, 4);
  rightY += 32;

  for (const sk of cv.skills) {
    ctx.fillStyle = '#18181b';
    ctx.font = '600 20px "Inter", sans-serif';
    ctx.fillText(sk.name, rightX, rightY);
    rightY += 12;

    // Progress bar
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(rightX, rightY, rightW, 10);
    ctx.fillStyle = accent;
    ctx.fillRect(rightX, rightY, (rightW * Math.min(5, Math.max(1, sk.level))) / 5, 10);
    rightY += 30;
  }

  // RIGHT COLUMN: Education
  rightY += 16;
  ctx.fillStyle = accent;
  ctx.font = '800 22px "Inter", sans-serif';
  ctx.fillText('EĞİTİM BİLGİLERİ', rightX, rightY);
  rightY += 14;
  ctx.fillRect(rightX, rightY, 54, 4);
  rightY += 32;

  for (const edu of cv.educations) {
    ctx.fillStyle = '#09090b';
    ctx.font = '700 21px "Inter", sans-serif';
    rightY = drawWrappedText(ctx, edu.degree, rightX, rightY, rightW, 28);

    ctx.fillStyle = '#3f3f46';
    ctx.font = '600 19px "Inter", sans-serif';
    rightY = drawWrappedText(ctx, edu.school, rightX, rightY + 2, rightW, 26);

    ctx.fillStyle = accent;
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText(edu.period, rightX, rightY + 4);
    rightY += 30;

    if (edu.gpaOrNotes) {
      ctx.fillStyle = '#52525b';
      ctx.font = '400 18px "Inter", sans-serif';
      rightY = drawWrappedText(ctx, edu.gpaOrNotes, rightX, rightY, rightW, 25);
    }
    rightY += 18;
  }

  // RIGHT COLUMN: Certifications
  if (cv.certifications.length > 0) {
    rightY += 10;
    ctx.fillStyle = accent;
    ctx.font = '800 22px "Inter", sans-serif';
    ctx.fillText('SERTİFİKALAR', rightX, rightY);
    rightY += 14;
    ctx.fillRect(rightX, rightY, 54, 4);
    rightY += 30;

    ctx.fillStyle = '#27272a';
    ctx.font = '500 19px "Inter", sans-serif';
    for (const cert of cv.certifications) {
      if (!cert.trim()) continue;
      rightY = drawWrappedText(ctx, `• ${cert}`, rightX, rightY, rightW, 26);
      rightY += 8;
    }
  }

  // RIGHT COLUMN: Languages
  if (cv.languages.length > 0) {
    rightY += 16;
    ctx.fillStyle = accent;
    ctx.font = '800 22px "Inter", sans-serif';
    ctx.fillText('YABANCI DİLLER', rightX, rightY);
    rightY += 14;
    ctx.fillRect(rightX, rightY, 54, 4);
    rightY += 30;

    for (const lang of cv.languages) {
      ctx.fillStyle = '#09090b';
      ctx.font = '700 19px "Inter", sans-serif';
      ctx.fillText(lang.language, rightX, rightY);
      ctx.fillStyle = '#52525b';
      ctx.font = '400 18px "Inter", sans-serif';
      ctx.fillText(` — ${lang.proficiency}`, rightX + ctx.measureText(lang.language).width + 8, rightY);
      rightY += 30;
    }
  }
}

async function renderHarvardAtsTemplate(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cv: CvDocumentData,
  accent: string,
  _photoImg: HTMLImageElement | null,
  qrImg: HTMLImageElement | null
) {
  const marginX = 110;
  const contentW = W - marginX * 2;
  let y = 96;

  if (qrImg) {
    ctx.drawImage(qrImg, W - marginX - 110, 68, 110, 110);
  }

  // Centered Classic Harvard Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#09090b';
  ctx.font = '800 50px "Inter", serif';
  ctx.fillText((cv.personal.fullName || 'AD SOYAD').toUpperCase(), W / 2, y + 28);
  y += 62;

  ctx.fillStyle = accent;
  ctx.font = '700 24px "Inter", sans-serif';
  ctx.fillText(cv.personal.title, W / 2, y);
  y += 34;

  const contacts = [
    cv.personal.location,
    cv.personal.phone,
    cv.personal.email,
    cv.personal.linkedin,
    cv.personal.github,
  ].filter(Boolean);
  ctx.fillStyle = '#3f3f46';
  ctx.font = '500 19px "Inter", sans-serif';
  ctx.fillText(contacts.join('  |  '), W / 2, y);
  ctx.textAlign = 'left';
  y += 28;

  const drawSectionHeader = (title: string) => {
    y += 14;
    ctx.fillStyle = '#09090b';
    ctx.font = '800 22px "Inter", sans-serif';
    ctx.fillText(title.toUpperCase(), marginX, y);
    y += 10;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(W - marginX, y);
    ctx.stroke();
    y += 30;
  };

  if (cv.personal.summary.trim()) {
    drawSectionHeader('EXECUTIVE SUMMARY');
    ctx.fillStyle = '#18181b';
    ctx.font = '400 20px "Inter", sans-serif';
    y = drawWrappedText(ctx, cv.personal.summary, marginX, y, contentW, 30);
    y += 10;
  }

  drawSectionHeader('PROFESSIONAL EXPERIENCE');
  for (const exp of cv.experiences) {
    if (y > H - 150) break;
    ctx.fillStyle = '#09090b';
    ctx.font = '700 23px "Inter", sans-serif';
    ctx.fillText(`${exp.company} — ${exp.role}`, marginX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#3f3f46';
    ctx.font = '600 19px "Inter", sans-serif';
    ctx.fillText(`${exp.location} | ${exp.period}`, W - marginX, y);
    ctx.textAlign = 'left';
    y += 30;

    ctx.fillStyle = '#18181b';
    ctx.font = '400 20px "Inter", sans-serif';
    for (const b of exp.bullets) {
      if (!b.trim()) continue;
      ctx.fillText('•', marginX + 6, y);
      y = drawWrappedText(ctx, b, marginX + 28, y, contentW - 28, 28);
      y += 5;
    }
    y += 16;
  }

  drawSectionHeader('EDUCATION & CERTIFICATIONS');
  for (const edu of cv.educations) {
    ctx.fillStyle = '#09090b';
    ctx.font = '700 21px "Inter", sans-serif';
    ctx.fillText(`${edu.school} — ${edu.degree}`, marginX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#3f3f46';
    ctx.font = '600 19px "Inter", sans-serif';
    ctx.fillText(edu.period, W - marginX, y);
    ctx.textAlign = 'left';
    y += 28;

    if (edu.gpaOrNotes) {
      ctx.fillStyle = '#3f3f46';
      ctx.font = '400 19px "Inter", sans-serif';
      y = drawWrappedText(ctx, edu.gpaOrNotes, marginX, y, contentW, 26);
    }
    y += 10;
  }

  if (cv.certifications.length > 0) {
    ctx.fillStyle = '#18181b';
    ctx.font = '600 19px "Inter", sans-serif';
    y = drawWrappedText(ctx, `Sertifikalar: ${cv.certifications.join('  •  ')}`, marginX, y + 6, contentW, 27);
    y += 10;
  }

  drawSectionHeader('TECHNICAL SKILLS, PROJECTS & LANGUAGES');
  const skillNames = cv.skills.map((s) => s.name).join(', ');
  ctx.fillStyle = '#09090b';
  ctx.font = '600 20px "Inter", sans-serif';
  y = drawWrappedText(ctx, `Yetkinlikler: ${skillNames}`, marginX, y, contentW, 28);
  y += 10;

  for (const proj of cv.projects) {
    ctx.fillStyle = '#18181b';
    ctx.font = '500 19px "Inter", sans-serif';
    y = drawWrappedText(
      ctx,
      `• ${proj.name} (${proj.techStack}): ${proj.description}`,
      marginX,
      y,
      contentW,
      27
    );
    y += 6;
  }

  if (cv.languages.length > 0) {
    const langStr = cv.languages.map((l) => `${l.language} (${l.proficiency})`).join('  •  ');
    ctx.fillStyle = '#09090b';
    ctx.font = '600 19px "Inter", sans-serif';
    drawWrappedText(ctx, `Yabancı Diller: ${langStr}`, marginX, y + 10, contentW, 27);
  }
}

async function renderSidebarTemplate(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cv: CvDocumentData,
  accent: string,
  photoImg: HTMLImageElement | null,
  qrImg: HTMLImageElement | null
) {
  const sideW = 510;

  // Dark slate left sidebar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, sideW, H);

  // Accent vertical stripe
  ctx.fillStyle = accent;
  ctx.fillRect(sideW, 0, 8, H);

  let sideY = 86;
  const sidePad = 56;
  const sideInnerW = sideW - sidePad * 2;

  if (photoImg) {
    const r = 82;
    const cx = sideW / 2;
    const cy = sideY + r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(photoImg, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    sideY += r * 2 + 44;
  }

  // Contact in sidebar
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 21px "Inter", sans-serif';
  ctx.fillText('İLETİŞİM & PROFİL', sidePad, sideY);
  sideY += 12;
  ctx.fillStyle = accent;
  ctx.fillRect(sidePad, sideY, 48, 4);
  sideY += 30;

  const sideContacts = [
    cv.personal.email,
    cv.personal.phone,
    cv.personal.location,
    cv.personal.linkedin,
    cv.personal.github,
    cv.personal.website,
  ].filter(Boolean);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '400 18px "Inter", sans-serif';
  for (const item of sideContacts) {
    sideY = drawWrappedText(ctx, item, sidePad, sideY, sideInnerW, 25);
    sideY += 10;
  }

  // Skills in sidebar
  sideY += 24;
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 21px "Inter", sans-serif';
  ctx.fillText('TEKNİK YETENEKLER', sidePad, sideY);
  sideY += 12;
  ctx.fillStyle = accent;
  ctx.fillRect(sidePad, sideY, 48, 4);
  sideY += 30;

  for (const sk of cv.skills) {
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText(sk.name, sidePad, sideY);
    sideY += 10;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sidePad, sideY, sideInnerW, 8);
    ctx.fillStyle = accent;
    ctx.fillRect(sidePad, sideY, (sideInnerW * sk.level) / 5, 8);
    sideY += 28;
  }

  // Languages in sidebar
  if (cv.languages.length > 0) {
    sideY += 20;
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 21px "Inter", sans-serif';
    ctx.fillText('YABANCI DİLLER', sidePad, sideY);
    sideY += 12;
    ctx.fillStyle = accent;
    ctx.fillRect(sidePad, sideY, 48, 4);
    sideY += 30;

    for (const l of cv.languages) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillText(l.language, sidePad, sideY);
      sideY += 22;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 17px "Inter", sans-serif';
      ctx.fillText(l.proficiency, sidePad, sideY);
      sideY += 28;
    }
  }

  if (qrImg && sideY < H - 220) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sidePad, H - 210, 134, 134);
    ctx.drawImage(qrImg, sidePad + 7, H - 203, 120, 120);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillText('Dijital Portfolyo QR', sidePad + 150, H - 140);
  }

  // Right Main Column
  const mainX = sideW + 72;
  const mainW = W - mainX - 72;
  let mainY = 104;

  ctx.fillStyle = '#09090b';
  ctx.font = '800 54px "Inter", sans-serif';
  ctx.fillText(cv.personal.fullName, mainX, mainY);
  mainY += 46;

  ctx.fillStyle = accent;
  ctx.font = '700 26px "Inter", sans-serif';
  ctx.fillText(cv.personal.title, mainX, mainY);
  mainY += 44;

  if (cv.personal.summary.trim()) {
    ctx.fillStyle = '#334155';
    ctx.font = '400 20px "Inter", sans-serif';
    mainY = drawWrappedText(ctx, cv.personal.summary, mainX, mainY, mainW, 30);
    mainY += 32;
  }

  // Experience
  ctx.fillStyle = '#09090b';
  ctx.font = '800 23px "Inter", sans-serif';
  ctx.fillText('PROFESYONEL DENEYİM', mainX, mainY);
  mainY += 12;
  ctx.fillStyle = accent;
  ctx.fillRect(mainX, mainY, 70, 4);
  mainY += 34;

  for (const exp of cv.experiences) {
    if (mainY > H - 160) break;
    ctx.fillStyle = '#09090b';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillText(exp.role, mainX, mainY);

    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.font = '600 19px "Inter", sans-serif';
    ctx.fillText(exp.period, mainX + mainW, mainY);
    ctx.textAlign = 'left';
    mainY += 28;

    ctx.fillStyle = '#475569';
    ctx.font = '600 20px "Inter", sans-serif';
    ctx.fillText(`${exp.company} • ${exp.location}`, mainX, mainY);
    mainY += 30;

    ctx.fillStyle = '#1e293b';
    ctx.font = '400 19px "Inter", sans-serif';
    for (const b of exp.bullets) {
      if (!b.trim()) continue;
      ctx.fillStyle = accent;
      ctx.fillText('▸', mainX, mainY);
      ctx.fillStyle = '#1e293b';
      mainY = drawWrappedText(ctx, b, mainX + 24, mainY, mainW - 24, 28);
      mainY += 6;
    }
    mainY += 20;
  }

  // Education & Projects in Main Column
  if (mainY < H - 220) {
    mainY += 10;
    ctx.fillStyle = '#09090b';
    ctx.font = '800 23px "Inter", sans-serif';
    ctx.fillText('EĞİTİM & ÖNE ÇIKAN PROJELER', mainX, mainY);
    mainY += 12;
    ctx.fillStyle = accent;
    ctx.fillRect(mainX, mainY, 70, 4);
    mainY += 32;

    for (const edu of cv.educations) {
      ctx.fillStyle = '#09090b';
      ctx.font = '700 21px "Inter", sans-serif';
      ctx.fillText(`${edu.degree} — ${edu.school}`, mainX, mainY);
      ctx.textAlign = 'right';
      ctx.fillStyle = accent;
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillText(edu.period, mainX + mainW, mainY);
      ctx.textAlign = 'left';
      mainY += 28;
      if (edu.gpaOrNotes) {
        ctx.fillStyle = '#475569';
        ctx.font = '400 18px "Inter", sans-serif';
        mainY = drawWrappedText(ctx, edu.gpaOrNotes, mainX, mainY, mainW, 25);
      }
      mainY += 14;
    }

    for (const proj of cv.projects) {
      if (mainY > H - 90) break;
      ctx.fillStyle = '#09090b';
      ctx.font = '700 20px "Inter", sans-serif';
      ctx.fillText(`${proj.name} (${proj.techStack})`, mainX, mainY);
      mainY += 26;
      ctx.fillStyle = '#334155';
      ctx.font = '400 18px "Inter", sans-serif';
      mainY = drawWrappedText(ctx, proj.description, mainX, mainY, mainW, 26);
      mainY += 12;
    }
  }
}

/**
 * Renders the Cover Letter (Ön Yazı) onto a matching high-DPI A4 Canvas
 */
export async function renderCoverLetterToA4Canvas(
  canvas: HTMLCanvasElement,
  cv: CvDocumentData
): Promise<void> {
  const W = 1588;
  const H = 2246;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const accent = cv.accentColor || '#7c3aed';
  const marginX = 128;
  const contentW = W - marginX * 2;
  let y = 100;

  // Top Accent Header Bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 18);

  // Applicant Header
  ctx.fillStyle = '#09090b';
  ctx.font = '800 52px "Inter", sans-serif';
  ctx.fillText(cv.personal.fullName, marginX, y + 36);
  y += 66;

  ctx.fillStyle = accent;
  ctx.font = '700 26px "Inter", sans-serif';
  ctx.fillText(cv.personal.title, marginX, y + 16);
  y += 46;

  const contacts = [
    cv.personal.email,
    cv.personal.phone,
    cv.personal.location,
    cv.personal.linkedin,
  ].filter(Boolean);
  ctx.fillStyle = '#52525b';
  ctx.font = '500 20px "Inter", sans-serif';
  ctx.fillText(contacts.join('   •   '), marginX, y + 10);
  y += 44;

  // Divider
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(W - marginX, y);
  ctx.stroke();
  y += 64;

  // Date
  ctx.fillStyle = '#52525b';
  ctx.font = '600 21px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.date, marginX, y);
  y += 52;

  // Recipient Block
  ctx.fillStyle = '#09090b';
  ctx.font = '700 23px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.recipientName, marginX, y);
  y += 32;

  ctx.fillStyle = '#3f3f46';
  ctx.font = '600 21px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.recipientRole, marginX, y);
  y += 30;

  ctx.fillStyle = accent;
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.companyName, marginX, y);
  y += 30;

  ctx.fillStyle = '#52525b';
  ctx.font = '400 20px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.companyAddress, marginX, y);
  y += 64;

  // Subject Box
  ctx.fillStyle = '#f4f4f5';
  ctx.fillRect(marginX, y - 30, contentW, 52);
  ctx.fillStyle = accent;
  ctx.fillRect(marginX, y - 30, 8, 52);

  ctx.fillStyle = '#09090b';
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.fillText(`KONU: ${cv.coverLetter.subject}`, marginX + 24, y + 4);
  y += 72;

  // Salutation
  ctx.fillStyle = '#09090b';
  ctx.font = '700 23px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.salutation, marginX, y);
  y += 46;

  // Body Paragraphs
  ctx.fillStyle = '#27272a';
  ctx.font = '400 22px "Inter", sans-serif';
  y = drawWrappedText(ctx, cv.coverLetter.openingParagraph, marginX, y, contentW, 36);
  y += 34;

  y = drawWrappedText(ctx, cv.coverLetter.bodyParagraph, marginX, y, contentW, 36);
  y += 34;

  y = drawWrappedText(ctx, cv.coverLetter.closingParagraph, marginX, y, contentW, 36);
  y += 64;

  // Sign-off
  ctx.fillStyle = '#52525b';
  ctx.font = '500 22px "Inter", sans-serif';
  ctx.fillText(cv.coverLetter.signOff, marginX, y);
  y += 44;

  ctx.fillStyle = '#09090b';
  ctx.font = '800 28px "Inter", sans-serif';
  ctx.fillText(cv.personal.fullName, marginX, y);
  y += 32;

  ctx.fillStyle = accent;
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.fillText(cv.personal.title, marginX, y);
}

/**
 * Exports any rendered A4 Canvas to a crisp, print-ready A4 PDF via pdf-lib
 */
export async function exportCanvasToA4Pdf(
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<void> {
  const pngDataUrl = canvas.toDataURL('image/png', 1.0);
  const pdfDoc = await PDFDocument.create();
  // Standard A4 dimensions in PDF points: 595.28 x 841.89
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
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports the CV & Cover Letter as an editable Microsoft Word (.doc) document
 */
export function exportCvToWordDoc(cv: CvDocumentData): void {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>${cv.personal.fullName} - CV</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #18181b; line-height: 1.5; margin: 32px; }
        h1 { font-size: 26pt; margin-bottom: 2px; color: #09090b; }
        h2 { font-size: 13pt; color: ${cv.accentColor}; border-bottom: 2px solid ${cv.accentColor}; padding-bottom: 4px; margin-top: 18px; text-transform: uppercase; }
        .subtitle { font-size: 13pt; font-weight: bold; color: ${cv.accentColor}; margin-bottom: 8px; }
        .contact { font-size: 10pt; color: #52525b; margin-bottom: 16px; }
        .exp-title { font-weight: bold; font-size: 11.5pt; }
        .exp-meta { color: #52525b; font-size: 10pt; margin-bottom: 4px; }
        ul { margin-top: 4px; margin-bottom: 12px; }
        li { font-size: 10.5pt; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <h1>${cv.personal.fullName}</h1>
      <div class="subtitle">${cv.personal.title}</div>
      <div class="contact">${[cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.linkedin, cv.personal.github].filter(Boolean).join(' • ')}</div>

      <h2>Profesyonel Özet</h2>
      <p>${cv.personal.summary}</p>

      <h2>İş Deneyimi</h2>
      ${cv.experiences
        .map(
          (e) => `
        <div>
          <div class="exp-title">${e.role} — ${e.company}</div>
          <div class="exp-meta">${e.location} | ${e.period}</div>
          <ul>${e.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
        </div>
      `
        )
        .join('')}

      <h2>Eğitim Bilgileri</h2>
      ${cv.educations
        .map(
          (ed) => `
        <p><strong>${ed.degree}</strong> — ${ed.school} (${ed.period})<br/>${ed.gpaOrNotes}</p>
      `
        )
        .join('')}

      <h2>Teknik Yetenekler & Sertifikalar</h2>
      <p><strong>Yetenekler:</strong> ${cv.skills.map((s) => s.name).join(', ')}</p>
      <p><strong>Sertifikalar:</strong> ${cv.certifications.join(' • ')}</p>
      <p><strong>Yabancı Diller:</strong> ${cv.languages.map((l) => `${l.language} (${l.proficiency})`).join(', ')}</p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cv.personal.fullName.toLowerCase().replace(/\s+/g, '-')}-cv.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
