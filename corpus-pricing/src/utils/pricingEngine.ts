import * as XLSX from 'xlsx';

export type CurrencyCode = 'TRY' | 'USD' | 'EUR';
export type ComplexityLevel = 'standard' | 'complex' | 'critical';
export type RoleId =
  | 'architect'
  | 'fullstack'
  | 'designer'
  | 'devsecops'
  | 'qa'
  | 'pm';

export interface RoleRate {
  id: RoleId;
  title: string;
  hourlyRate: number;
  color: string;
}

export interface ScopeItem {
  id: string;
  phase: string;
  title: string;
  deliverable: string;
  roleId: RoleId;
  baseHours: number;
  complexity: ComplexityLevel;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  badge: string;
  monthlyPrice: number;
  setupFee: number;
  slaText: string;
  features: string[];
  highlighted?: boolean;
}

export interface ProposalProject {
  id: string;
  proposalNo: string;
  title: string;
  clientName: string;
  preparedBy: string;
  validUntil: string;
  currency: CurrencyCode;
  contingencyPercent: number; // Risk buffer %
  discountPercent: number;
  taxPercent: number; // KDV %
  sprintWeeks: number;
  monthlyRetainer: number;
  themeId: string;
  roles: RoleRate[];
  items: ScopeItem[];
  tiers: PricingTier[];
}

export interface ComputedScopeRow extends ScopeItem {
  roleTitle: string;
  roleColor: string;
  hourlyRate: number;
  multiplier: number;
  effectiveHours: number;
  lineTotal: number;
}

export interface ProposalSummary {
  rows: ComputedScopeRow[];
  activeRows: ComputedScopeRow[];
  totalBaseHours: number;
  totalEffectiveHours: number;
  totalPersonDays: number;
  estimatedWeeks: number;
  baseSubtotal: number;
  contingencyAmount: number;
  grossBeforeDiscount: number;
  discountAmount: number;
  netSubtotal: number;
  taxAmount: number;
  grandTotal: number;
  annualTcoWithRetainer: number;
  milestones: { name: string; percent: number; amount: number }[];
  roleBreakdown: { roleId: RoleId; title: string; color: string; hours: number; cost: number }[];
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

export const COMPLEXITY_META: Record<
  ComplexityLevel,
  { label: string; multiplier: number; badgeColor: string }
> = {
  standard: { label: '1.0x Standart', multiplier: 1.0, badgeColor: '#10b981' },
  complex: { label: '1.25x Karmaşık', multiplier: 1.25, badgeColor: '#f59e0b' },
  critical: { label: '1.5x Kritik Ar-Ge', multiplier: 1.5, badgeColor: '#f43f5e' },
};

export const PROPOSAL_THEMES = [
  {
    id: 'executive-obsidian',
    name: 'Executive Obsidian',
    bgStart: '#09090b',
    bgEnd: '#111827',
    accent: '#f59e0b',
    secondary: '#38bdf8',
    cardBg: 'rgba(24, 24, 27, 0.94)',
    border: 'rgba(63, 63, 70, 0.8)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
  },
  {
    id: 'sapphire-enterprise',
    name: 'Sapphire Enterprise',
    bgStart: '#040d1f',
    bgEnd: '#0f172a',
    accent: '#38bdf8',
    secondary: '#8b5cf6',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(56, 189, 248, 0.35)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
  },
  {
    id: 'emerald-venture',
    name: 'Emerald Venture',
    bgStart: '#04130e',
    bgEnd: '#062419',
    accent: '#10b981',
    secondary: '#f59e0b',
    cardBg: 'rgba(6, 28, 20, 0.94)',
    border: 'rgba(16, 185, 129, 0.35)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
  },
];

export const DEFAULT_ROLES_TRY: RoleRate[] = [
  { id: 'architect', title: 'Baş Mimar / AI Lead', hourlyRate: 3200, color: '#f59e0b' },
  { id: 'fullstack', title: 'Kıdemli Full-Stack Mühendis', hourlyRate: 2400, color: '#38bdf8' },
  { id: 'designer', title: 'Lead UI/UX Ürün Tasarımcısı', hourlyRate: 2000, color: '#ec4899' },
  { id: 'devsecops', title: 'Cloud & DevSecOps Uzmanı', hourlyRate: 2600, color: '#10b981' },
  { id: 'qa', title: 'QA & Otomasyon Mühendisi', hourlyRate: 1750, color: '#8b5cf6' },
  { id: 'pm', title: 'Teknik Proje Yöneticisi (PM)', hourlyRate: 2100, color: '#f43f5e' },
];

export const PROPOSAL_PRESETS: Record<string, ProposalProject> = {
  'enterprise-ai-rag': {
    id: 'enterprise-ai-rag',
    proposalNo: 'PRP-2026-0842',
    title: 'Kurumsal Özel LLM, RAG Bilgi Bankası & Otonom Ajan Platformu',
    clientName: 'Anadolu Global Holding A.Ş.',
    preparedBy: 'Corpus Enterprise Solutions',
    validUntil: '2026-11-30',
    currency: 'TRY',
    contingencyPercent: 12,
    discountPercent: 8,
    taxPercent: 20,
    sprintWeeks: 10,
    monthlyRetainer: 65000,
    themeId: 'executive-obsidian',
    roles: JSON.parse(JSON.stringify(DEFAULT_ROLES_TRY)),
    items: [
      {
        id: 's1',
        phase: 'Faz 1: Mimari & Veri Hazırlığı',
        title: 'Kurumsal Veri Hattı & Doküman OCR/Chunking Motoru',
        deliverable: 'PDF/Word/ERP bağlayıcıları + Qdrant Vektör Kümesi',
        roleId: 'architect',
        baseHours: 64,
        complexity: 'complex',
        included: true,
      },
      {
        id: 's2',
        phase: 'Faz 1: Mimari & Veri Hazırlığı',
        title: 'Rol Bazlı Erişim (RBAC) & SSO (Azure AD / Okta) Güvenliği',
        deliverable: 'KVKK uyumlu maskeleme ve departman yetki matrisi',
        roleId: 'devsecops',
        baseHours: 48,
        complexity: 'critical',
        included: true,
      },
      {
        id: 's3',
        phase: 'Faz 2: Çekirdek AI & Ajan Orkestrasyonu',
        title: 'Hibrit RAG Arama & Kaynak Atıflı Yanıt Motoru',
        deliverable: 'Halüsinasyon önleyici doğrulama katmanı ve kaynak linkleme',
        roleId: 'architect',
        baseHours: 80,
        complexity: 'critical',
        included: true,
      },
      {
        id: 's4',
        phase: 'Faz 2: Çekirdek AI & Ajan Orkestrasyonu',
        title: 'Yönetici Kokpiti & Çoklu Sohbet Stüdyosu Önyüzü',
        deliverable: 'React + TypeScript Kurumsal Web & Mobil Uyumlu Arayüz',
        roleId: 'fullstack',
        baseHours: 96,
        complexity: 'standard',
        included: true,
      },
      {
        id: 's5',
        phase: 'Faz 3: Tasarım, Test & Canlıya Geçiş',
        title: 'Kurumsal Tasarım Sistemi & Etkileşimli Prototip',
        deliverable: 'Figma Design System + Kullanılabilirlik Testleri',
        roleId: 'designer',
        baseHours: 45,
        complexity: 'standard',
        included: true,
      },
      {
        id: 's6',
        phase: 'Faz 3: Tasarım, Test & Canlıya Geçiş',
        title: 'Yük Testi, Red-Team AI Güvenlik Denetimi & Eğitim',
        deliverable: 'Prompt Injection test raporu + Yönetici eğitimi',
        roleId: 'qa',
        baseHours: 40,
        complexity: 'complex',
        included: true,
      },
    ],
    tiers: [
      {
        id: 'starter',
        name: 'Departman Paketi',
        badge: 'HIZLI BAŞLANGIÇ',
        monthlyPrice: 45000,
        setupFee: 320000,
        slaText: 'Mesai Saatleri (9x5) • 4 Saat Yanıt SLA',
        features: [
          '100.000 Doküman Vektör İndeksi',
          'Standart Web Arayüzü & PDF Yükleme',
          'Aylık 50.000 AI Sorgu Kotası',
        ],
      },
      {
        id: 'pro',
        name: 'Kurumsal Mimari (Önerilen)',
        badge: 'EN ÇOK TERCİH EDİLEN',
        monthlyPrice: 65000,
        setupFee: 680000,
        slaText: '7/24 Kritik Destek • 30 Dakika Yanıt SLA',
        highlighted: true,
        features: [
          'Sınırsız Doküman + ERP/CRM Canlı Bağlantı',
          'SSO / SAML 2.0 & KVKK Veri Maskeleme',
          'Özel GPU Kümesi veya On-Premise Kurulum',
        ],
      },
      {
        id: 'enterprise',
        name: 'Global Holding Dedicated',
        badge: 'TAM İZOLASYON',
        monthlyPrice: 115000,
        setupFee: 1150000,
        slaText: '7/24 Özel Mühendis Ataması • %99.99 SLA',
        features: [
          'Air-Gapped (İnternetsiz) Yerel LLM Kurulumu',
          'Çoklu Şirket (Multi-Tenant) Holding Yönetimi',
          'Özel Eğitilmiş (Fine-Tuned) Sektörel Model',
        ],
      },
    ],
  },
  'fintech-superapp': {
    id: 'fintech-superapp',
    proposalNo: 'PRP-2026-0915',
    title: 'FinTech Dijital Cüzdan, Sanal POS & Açık Bankacılık Platformu',
    clientName: 'NovaPay Elektronik Para A.Ş.',
    preparedBy: 'Corpus FinTech Engineering',
    validUntil: '2026-12-15',
    currency: 'USD',
    contingencyPercent: 15,
    discountPercent: 5,
    taxPercent: 20,
    sprintWeeks: 14,
    monthlyRetainer: 4200,
    themeId: 'sapphire-enterprise',
    roles: [
      { id: 'architect', title: 'FinTech Baş Mimarı', hourlyRate: 110, color: '#38bdf8' },
      { id: 'fullstack', title: 'Kıdemli Backend / Mobil Mühendis', hourlyRate: 85, color: '#8b5cf6' },
      { id: 'designer', title: 'FinTech UX Tasarımcısı', hourlyRate: 70, color: '#ec4899' },
      { id: 'devsecops', title: 'PCI-DSS & CloudSec Uzmanı', hourlyRate: 95, color: '#10b981' },
      { id: 'qa', title: 'Otomasyon & Güvenlik Test Uzmanı', hourlyRate: 65, color: '#f59e0b' },
      { id: 'pm', title: 'Teknik Ürün Yöneticisi', hourlyRate: 75, color: '#f43f5e' },
    ],
    items: [
      {
        id: 'f1',
        phase: 'Faz 1: Çekirdek Muhasebe & PCI-DSS',
        title: 'Çift Kayıtlı (Double-Entry) Yüksek Hızlı Bakiye Motoru',
        deliverable: 'Atomik işlem garantili PostgreSQL + Redis kilit mimarisi',
        roleId: 'architect',
        baseHours: 90,
        complexity: 'critical',
        included: true,
      },
      {
        id: 'f2',
        phase: 'Faz 1: Çekirdek Muhasebe & PCI-DSS',
        title: 'Çoklu Banka Sanal POS & Akıllı Yönlendirme (Smart Routing)',
        deliverable: '6 Banka entegrasyonu + otomatik failover geçişi',
        roleId: 'fullstack',
        baseHours: 110,
        complexity: 'complex',
        included: true,
      },
      {
        id: 'f3',
        phase: 'Faz 2: Mobil Cüzdan & KYC',
        title: 'iOS / Android Biyometrik Cüzdan & NFC QR Ödeme',
        deliverable: 'React Native / Flutter 60fps Cüzdan Uygulaması',
        roleId: 'fullstack',
        baseHours: 120,
        complexity: 'standard',
        included: true,
      },
      {
        id: 'f4',
        phase: 'Faz 2: Mobil Cüzdan & KYC',
        title: 'Canlılık Kontrolleri & NFC Kimlik Doğrulama (Video KYC)',
        deliverable: 'MASAK uyumlu uzaktan müşteri edinimi modülü',
        roleId: 'devsecops',
        baseHours: 64,
        complexity: 'complex',
        included: true,
      },
    ],
    tiers: [
      {
        id: 'core',
        name: 'Core Cüzdan MVP',
        badge: 'LİSANS BAŞVURU PAKETİ',
        monthlyPrice: 2800,
        setupFee: 28000,
        slaText: '99.9% Uptime • 2 Saat SLA',
        features: ['Bakiye & P2P Para Transferi', 'Tek Banka Sanal POS', 'Temel Backoffice'],
      },
      {
        id: 'growth',
        name: 'Tam Kapsamlı EMI Paketi',
        badge: 'ÖNERİLEN PAKET',
        monthlyPrice: 4200,
        setupFee: 46000,
        slaText: '99.95% Uptime • 7/24 Nöbetçi SRE',
        highlighted: true,
        features: [
          'Çoklu POS Smart Routing & Fraud Motoru',
          'NFC + Biyometrik Video KYC',
          'PCI-DSS Level 1 Hazır Altyapı',
        ],
      },
      {
        id: 'bank',
        name: 'Dijital Banka & BaaS',
        badge: 'KURUMSAL LİSANS',
        monthlyPrice: 8500,
        setupFee: 84000,
        slaText: '99.99% Aktif-Aktif Multi-Region',
        features: [
          'Açık Kaynak Kod Teslimi (Full IP Rights)',
          'Kart Basım (Issuer) & ATM Entegrasyonu',
          'Yerinde Düzenleyici Denetim Desteği',
        ],
      },
    ],
  },
};

export function calculateProposalSummary(project: ProposalProject): ProposalSummary {
  const roleMap = new Map<RoleId, RoleRate>();
  project.roles.forEach((r) => roleMap.set(r.id, r));

  const rows: ComputedScopeRow[] = project.items.map((item) => {
    const role = roleMap.get(item.roleId) || project.roles[0];
    const mult = COMPLEXITY_META[item.complexity].multiplier;
    const effectiveHours = Math.round(item.baseHours * mult * 10) / 10;
    const lineTotal = item.included ? Math.round(effectiveHours * role.hourlyRate) : 0;

    return {
      ...item,
      roleTitle: role.title,
      roleColor: role.color,
      hourlyRate: role.hourlyRate,
      multiplier: mult,
      effectiveHours,
      lineTotal,
    };
  });

  const activeRows = rows.filter((r) => r.included);
  const totalBaseHours = activeRows.reduce((acc, r) => acc + r.baseHours, 0);
  const totalEffectiveHours = Math.round(
    activeRows.reduce((acc, r) => acc + r.effectiveHours, 0)
  );
  const totalPersonDays = Math.round((totalEffectiveHours / 8) * 10) / 10;
  const estimatedWeeks = Math.max(2, project.sprintWeeks);

  const baseSubtotal = activeRows.reduce((acc, r) => acc + r.lineTotal, 0);
  const contingencyAmount = Math.round(baseSubtotal * (project.contingencyPercent / 100));
  const grossBeforeDiscount = baseSubtotal + contingencyAmount;
  const discountAmount = Math.round(grossBeforeDiscount * (project.discountPercent / 100));
  const netSubtotal = grossBeforeDiscount - discountAmount;
  const taxAmount = Math.round(netSubtotal * (project.taxPercent / 100));
  const grandTotal = netSubtotal + taxAmount;
  const annualTcoWithRetainer = netSubtotal + project.monthlyRetainer * 12;

  const milestones = [
    {
      name: '1. Sözleşme İmzası & Mimari Başlangıç (%30)',
      percent: 30,
      amount: Math.round(grandTotal * 0.3),
    },
    {
      name: '2. Çekirdek Modüller & Alfa Ortam Teslimi (%40)',
      percent: 40,
      amount: Math.round(grandTotal * 0.4),
    },
    {
      name: '3. UAT Kabul, Güvenlik Testi & Canlıya Geçiş (%30)',
      percent: 30,
      amount: grandTotal - Math.round(grandTotal * 0.3) - Math.round(grandTotal * 0.4),
    },
  ];

  const roleBreakdown = project.roles.map((role) => {
    const matching = activeRows.filter((r) => r.roleId === role.id);
    const hours = Math.round(matching.reduce((acc, m) => acc + m.effectiveHours, 0));
    const cost = matching.reduce((acc, m) => acc + m.lineTotal, 0);
    return {
      roleId: role.id,
      title: role.title,
      color: role.color,
      hours,
      cost,
    };
  });

  return {
    rows,
    activeRows,
    totalBaseHours,
    totalEffectiveHours,
    totalPersonDays,
    estimatedWeeks,
    baseSubtotal,
    contingencyAmount,
    grossBeforeDiscount,
    discountAmount,
    netSubtotal,
    taxAmount,
    grandTotal,
    annualTcoWithRetainer,
    milestones,
    roleBreakdown,
  };
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const sym = CURRENCY_SYMBOLS[currency];
  return `${sym}${Math.round(amount).toLocaleString('tr-TR')}`;
}

function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderProposalCanvas(
  canvas: HTMLCanvasElement,
  project: ProposalProject,
  summary: ProposalSummary
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const theme =
    PROPOSAL_THEMES.find((t) => t.id === project.themeId) || PROPOSAL_THEMES[0];

  // 1. Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.bgStart);
  bg.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 2. Top Executive Banner
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 44, 32, W - 88, 96, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  drawRoundedBox(ctx, 64, 52, 6, 56, 3);
  ctx.fill();

  ctx.fillStyle = theme.textPrimary;
  ctx.font = 'bold 23px Inter, sans-serif';
  ctx.fillText(project.title.slice(0, 68), 86, 72);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `MÜŞTERİ: ${project.clientName}  •  TEKLİF NO: ${project.proposalNo}  •  GEÇERLİLİK: ${project.validUntil}  •  HAZIRLAYAN: ${project.preparedBy}`,
    86,
    102
  );

  // Grand Total Pill in Header
  ctx.fillStyle = theme.accent + '22';
  ctx.strokeStyle = theme.accent;
  drawRoundedBox(ctx, W - 410, 46, 344, 68, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.textSecondary;
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('GENEL TOPLAM (KDV DAHİL ANAHTAR TESLİM)', W - 392, 68);

  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 26px Inter, sans-serif';
  ctx.fillText(formatMoney(summary.grandTotal, project.currency), W - 392, 100);

  // 3. KPI Cards Row (4 Cards)
  const kpis = [
    {
      label: 'TOPLAM MÜHENDİSLİK EFORU',
      val: `${summary.totalEffectiveHours} Saat (${summary.totalPersonDays} Adam/Gün)`,
      sub: `${summary.activeRows.length} Aktif İş Paketi`,
      color: theme.secondary,
    },
    {
      label: 'NET PROJE YATIRIM BEDELİ',
      val: formatMoney(summary.netSubtotal, project.currency),
      sub: `%${project.discountPercent} Kurumsal İndirim Uygulandı`,
      color: '#10b981',
    },
    {
      label: 'RİSK TAMPONU & KDV (%' + project.taxPercent + ')',
      val: `${formatMoney(summary.contingencyAmount, project.currency)} / ${formatMoney(summary.taxAmount, project.currency)}`,
      sub: `%${project.contingencyPercent} Beklenmeyen Efor Payı`,
      color: '#a78bfa',
    },
    {
      label: 'TESLİM SÜRESİ & AYLIK SLA BAKIM',
      val: `${summary.estimatedWeeks} Hafta  •  ${formatMoney(project.monthlyRetainer, project.currency)}/Ay`,
      sub: 'Çevik (Agile) 2 Haftalık Sprint Teslimatı',
      color: theme.accent,
    },
  ];

  kpis.forEach((k, idx) => {
    const kx = 44 + idx * 462;
    const ky = 148;
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.border;
    drawRoundedBox(ctx, kx, ky, 444, 104, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = k.color;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(k.label, kx + 20, ky + 30);

    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 21px Inter, sans-serif';
    ctx.fillText(k.val, kx + 20, ky + 62);

    ctx.fillStyle = theme.textSecondary;
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText(k.sub, kx + 20, ky + 86);
  });

  // 4. Left Panel: WBS Scope & Deliverable Matrix
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  drawRoundedBox(ctx, 44, 272, 1140, 520, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.secondary;
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('1. İŞ KIRILIM YAPISI (WBS) & TESLİMAT KAPSAM TABLOSU', 70, 308);

  // Table Headers
  ctx.fillStyle = theme.textSecondary;
  ctx.font = 'bold 11.5px Inter, sans-serif';
  ctx.fillText('FAZ & MODÜL ADI', 70, 338);
  ctx.fillText('SORUMLU ROL', 610, 338);
  ctx.fillText('NET EFOR', 860, 338);
  ctx.fillText('SATIR TUTARI', 1015, 338);

  summary.activeRows.slice(0, 7).forEach((row, idx) => {
    const ry = 354 + idx * 60;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.65)';
    drawRoundedBox(ctx, 66, ry, 1096, 50, 8);
    ctx.fill();

    ctx.fillStyle = row.roleColor;
    drawRoundedBox(ctx, 74, ry + 10, 4, 30, 2);
    ctx.fill();

    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(row.title.slice(0, 48), 88, ry + 22);

    ctx.fillStyle = theme.textSecondary;
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(`${row.phase}  —  ${row.deliverable.slice(0, 50)}`, 88, ry + 40);

    ctx.fillStyle = row.roleColor;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(row.roleTitle.slice(0, 24), 610, ry + 30);

    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${row.effectiveHours} Saat (${row.multiplier}x)`, 860, ry + 30);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(formatMoney(row.lineTotal, project.currency), 1015, ry + 30);
  });

  // 5. Right Panel: Role Effort Distribution & Payment Schedule
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  drawRoundedBox(ctx, 1206, 272, 670, 520, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('2. MÜHENDİSLİK ROL DAĞILIMI & ÖDEME TAKVİMİ', 1234, 308);

  const activeRoles = summary.roleBreakdown.filter((r) => r.hours > 0);
  const maxCost = Math.max(1, ...activeRoles.map((r) => r.cost));

  activeRoles.slice(0, 5).forEach((r, idx) => {
    const ry = 338 + idx * 46;
    ctx.fillStyle = theme.textPrimary;
    ctx.font = '600 12.5px Inter, sans-serif';
    ctx.fillText(`${r.title} (${r.hours}s)`, 1234, ry + 14);

    ctx.fillStyle = theme.textSecondary;
    ctx.font = 'bold 12.5px monospace';
    ctx.fillText(formatMoney(r.cost, project.currency), 1740, ry + 14);

    // Bar
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    drawRoundedBox(ctx, 1234, ry + 22, 610, 10, 5);
    ctx.fill();

    const barW = Math.max(16, (r.cost / maxCost) * 610);
    ctx.fillStyle = r.color;
    drawRoundedBox(ctx, 1234, ry + 22, barW, 10, 5);
    ctx.fill();
  });

  // Milestones inside Right Panel
  ctx.fillStyle = theme.secondary;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('Hakediş & Ödeme Kilometre Taşları:', 1234, 595);

  summary.milestones.forEach((m, i) => {
    const my = 612 + i * 52;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.7)';
    drawRoundedBox(ctx, 1234, my, 614, 42, 8);
    ctx.fill();

    ctx.fillStyle = theme.textPrimary;
    ctx.font = '500 12.5px Inter, sans-serif';
    ctx.fillText(m.name, 1250, my + 26);

    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(formatMoney(m.amount, project.currency), 1715, my + 26);
  });

  // 6. Bottom Row: 3 SaaS / Licensing Tier Comparison Cards
  project.tiers.slice(0, 3).forEach((tier, idx) => {
    const tx = 44 + idx * 620;
    const ty = 812;
    const tw = 592;
    const th = 216;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = tier.highlighted ? theme.accent : theme.border;
    ctx.lineWidth = tier.highlighted ? 2.5 : 1.5;
    drawRoundedBox(ctx, tx, ty, tw, th, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = tier.highlighted ? theme.accent : theme.secondary;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(tier.badge, tx + 24, ty + 30);

    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(tier.name, tx + 24, ty + 56);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      `Kurulum: ${formatMoney(tier.setupFee, project.currency)}  +  ${formatMoney(
        tier.monthlyPrice,
        project.currency
      )}/Ay`,
      tx + 24,
      ty + 86
    );

    ctx.fillStyle = theme.textSecondary;
    ctx.font = '500 11.5px Inter, sans-serif';
    ctx.fillText(`SLA: ${tier.slaText}`, tx + 24, ty + 110);

    tier.features.slice(0, 3).forEach((feat, fi) => {
      ctx.fillStyle = theme.textPrimary;
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillText(`✓  ${feat.slice(0, 62)}`, tx + 24, ty + 138 + fi * 24);
    });
  });

  // Footer
  ctx.fillStyle = theme.textSecondary;
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    `CORPUS PRICING, PROPOSAL & SCOPE ESTIMATOR (#024 PRO)  •  YILLIK TCO (12 AY BAKIM DAHİL): ${formatMoney(
      summary.annualTcoWithRetainer,
      project.currency
    )}`,
    44,
    H - 18
  );
}

export function exportProposalExcel(project: ProposalProject, summary: ProposalSummary) {
  const wb = XLSX.utils.book_new();

  const wbsData = summary.rows.map((r, i) => ({
    Sıra: i + 1,
    Durum: r.included ? 'Dahil' : 'Opsiyonel',
    Faz: r.phase,
    'İş Paketi / Modül': r.title,
    Teslimat: r.deliverable,
    'Sorumlu Rol': r.roleTitle,
    'Saat Ücreti': r.hourlyRate,
    'Baz Saat': r.baseHours,
    'Karmaşıklık Çarpanı': r.multiplier,
    'Net Saat': r.effectiveHours,
    'Satır Tutarı': r.lineTotal,
  }));

  const summaryData = [
    { Kalem: 'Teklif Numarası', Değer: project.proposalNo },
    { Kalem: 'Müşteri Kurum', Değer: project.clientName },
    { Kalem: 'Proje Başlığı', Değer: project.title },
    { Kalem: 'Toplam Net Efor (Saat)', Değer: summary.totalEffectiveHours },
    { Kalem: 'Toplam Adam/Gün', Değer: summary.totalPersonDays },
    { Kalem: 'Baz Maliyet Ara Toplamı', Değer: summary.baseSubtotal },
    { Kalem: `Risk Tamponu (%${project.contingencyPercent})`, Değer: summary.contingencyAmount },
    { Kalem: `Kurumsal İndirim (%${project.discountPercent})`, Değer: -summary.discountAmount },
    { Kalem: 'Net Proje Bedeli (KDV Hariç)', Değer: summary.netSubtotal },
    { Kalem: `KDV (%${project.taxPercent})`, Değer: summary.taxAmount },
    { Kalem: 'GENEL TOPLAM (KDV Dahil)', Değer: summary.grandTotal },
    { Kalem: 'Aylık SLA & Bakım Bedeli', Değer: project.monthlyRetainer },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsWbs = XLSX.utils.json_to_sheet(wbsData);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Yönetici Özeti');
  XLSX.utils.book_append_sheet(wb, wsWbs, 'WBS Efor ve Maliyet');

  XLSX.writeFile(wb, `${project.proposalNo}-Corpus-Teklif.xlsx`);
}
