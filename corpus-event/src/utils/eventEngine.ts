import * as XLSX from 'xlsx';

export type BadgeRole =
  | 'KEYNOTE_SPEAKER'
  | 'VIP_INVESTOR'
  | 'SPONSOR_EXEC'
  | 'ALL_ACCESS_PRO'
  | 'PRESS_MEDIA';

export type BoothTier = 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'STARTUP_POD';
export type BoothStatus = 'SOLD' | 'RESERVED' | 'AVAILABLE';

export interface ConferenceSession {
  id: string;
  timeSlot: string;
  track: 'Main Stage (Keynote)' | 'Track A: AI & Cloud' | 'Track B: FinTech & SecOps' | 'VIP Executive Lounge';
  title: string;
  speakerName: string;
  speakerTitle: string;
  company: string;
  capacity: number;
  registered: number;
  highlight: boolean;
}

export interface ExpoBooth {
  id: string;
  code: string;
  tier: BoothTier;
  sizeSqm: number;
  priceUsd: number;
  status: BoothStatus;
  sponsorName: string;
  gridX: number; // 0..3
  gridY: number; // 0..2
}

export interface BadgeDesign {
  attendeeName: string;
  attendeeTitle: string;
  companyName: string;
  role: BadgeRole;
  ticketCode: string;
  accessZones: string[];
  accentColor: string;
}

export interface EventProject {
  id: string;
  eventName: string;
  tagline: string;
  venueName: string;
  cityAndDate: string;
  expectedAttendees: number;
  ticketPriceUsd: number;
  paidTicketsCount: number;
  productionCostUsd: number;
  sessions: ConferenceSession[];
  booths: ExpoBooth[];
  badge: BadgeDesign;
}

export const BADGE_ROLE_META: Record<
  BadgeRole,
  { label: string; color: string; bg: string; perks: string }
> = {
  KEYNOTE_SPEAKER: {
    label: 'KEYNOTE SPEAKER',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.2)',
    perks: 'Sahne Arkası + Green Room + VIP Gala + Tüm Salonlar',
  },
  VIP_INVESTOR: {
    label: 'VIP INVESTOR PASS',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.2)',
    perks: 'Yatırımcı Lounge + 1:1 Deal Room + VIP Gala',
  },
  SPONSOR_EXEC: {
    label: 'DIAMOND PARTNER',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.2)',
    perks: 'Expo Sahibi + VIP Lounge + B2B Eşleşme',
  },
  ALL_ACCESS_PRO: {
    label: 'ALL-ACCESS DELEGATE',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.2)',
    perks: 'Ana Sahne + Tüm Paralel Salonlar + Expo Alanı',
  },
  PRESS_MEDIA: {
    label: 'OFFICIAL PRESS / MEDIA',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.2)',
    perks: 'Basın Odası + Röportaj Alanı + Ana Sahne Ön Sıra',
  },
};

export const BOOTH_TIER_META: Record<BoothTier, { color: string; label: string }> = {
  DIAMOND: { color: '#a855f7', label: 'Diamond Ada Stant (36m²)' },
  PLATINUM: { color: '#38bdf8', label: 'Platinum Köşe Stant (24m²)' },
  GOLD: { color: '#f59e0b', label: 'Gold Standart Stant (12m²)' },
  STARTUP_POD: { color: '#10b981', label: 'Startup İnovasyon Kiosku (6m²)' },
};

export const EVENT_PRESETS: Record<string, EventProject> = {
  'corpus-ai-summit-2026': {
    id: 'corpus-ai-summit-2026',
    eventName: 'CORPUS GLOBAL AI & CLOUD ARCHITECTURE SUMMIT 2026',
    tagline: 'Avrasya’nın En Büyük Üretken Yapay Zeka, Siber Güvenlik ve Bulut Mühendisliği Zirvesi',
    venueName: 'Haliç Kongre Merkezi & Oditoryumu',
    cityAndDate: 'İstanbul, Türkiye  •  24–25 Kasım 2026',
    expectedAttendees: 3200,
    ticketPriceUsd: 450,
    paidTicketsCount: 2450,
    productionCostUsd: 480000,
    sessions: [
      {
        id: 's1',
        timeSlot: '09:30 - 10:30',
        track: 'Main Stage (Keynote)',
        title: 'Açılış Keynote: 2027 Otonom Ajan Mimarileri & Sıfır-Sunucu Bulut Devrimi',
        speakerName: 'Dr. Kaan Demir',
        speakerTitle: 'Chief AI Architect',
        company: 'Corpus Cloud Global',
        capacity: 1500,
        registered: 1480,
        highlight: true,
      },
      {
        id: 's2',
        timeSlot: '10:45 - 11:45',
        track: 'Track A: AI & Cloud',
        title: 'Kurumsal RAG Sistemlerinde Halüsinasyonu %0.1 Altına İndiren Hibrit Arama',
        speakerName: 'Selin Yılmaz',
        speakerTitle: 'VP of AI Engineering',
        company: 'Qdrant & Corpus Labs',
        capacity: 600,
        registered: 590,
        highlight: true,
      },
      {
        id: 's3',
        timeSlot: '12:00 - 13:00',
        track: 'Track B: FinTech & SecOps',
        title: '100.000 TPS Gerçek Zamanlı Ödeme Ağlarında Milisaniye Fraud Tespiti',
        speakerName: 'Emre Vural',
        speakerTitle: 'Principal Systems Engineer',
        company: 'NovaPay FinTech',
        capacity: 500,
        registered: 465,
        highlight: false,
      },
      {
        id: 's4',
        timeSlot: '14:00 - 15:00',
        track: 'Main Stage (Keynote)',
        title: 'CISO Paneli: Kuantum Sonrası Kriptografi (PQC) ve Zero-Trust Ağlar',
        speakerName: 'Alperen Gökçe',
        speakerTitle: 'Global Head of SecOps',
        company: 'CyberShield EMEA',
        capacity: 1500,
        registered: 1390,
        highlight: true,
      },
      {
        id: 's5',
        timeSlot: '15:30 - 16:30',
        track: 'VIP Executive Lounge',
        title: 'Kapalı Oturum: Seri A & B Derin Teknoloji (DeepTech) Yatırım Kriterleri',
        speakerName: 'Derya Soylu',
        speakerTitle: 'Managing Partner',
        company: 'Bosphorus Venture Capital',
        capacity: 120,
        registered: 120,
        highlight: false,
      },
      {
        id: 's6',
        timeSlot: '16:45 - 17:45',
        track: 'Track A: AI & Cloud',
        title: 'WebGPU ve WebAssembly ile Tarayıcı İçi Yerel LLM Çıkarım Motorları',
        speakerName: 'Mert Korkmaz',
        speakerTitle: 'Staff Runtime Engineer',
        company: 'EdgeCompute IO',
        capacity: 600,
        registered: 540,
        highlight: false,
      },
    ],
    booths: [
      {
        id: 'b1',
        code: 'A-01',
        tier: 'DIAMOND',
        sizeSqm: 36,
        priceUsd: 65000,
        status: 'SOLD',
        sponsorName: 'Amazon Web Services (AWS)',
        gridX: 0,
        gridY: 0,
      },
      {
        id: 'b2',
        code: 'A-02',
        tier: 'DIAMOND',
        sizeSqm: 36,
        priceUsd: 65000,
        status: 'SOLD',
        sponsorName: 'NVIDIA Enterprise AI',
        gridX: 1,
        gridY: 0,
      },
      {
        id: 'b3',
        code: 'B-01',
        tier: 'PLATINUM',
        sizeSqm: 24,
        priceUsd: 38000,
        status: 'SOLD',
        sponsorName: 'Cloudflare Zero-Trust',
        gridX: 2,
        gridY: 0,
      },
      {
        id: 'b4',
        code: 'B-02',
        tier: 'PLATINUM',
        sizeSqm: 24,
        priceUsd: 38000,
        status: 'RESERVED',
        sponsorName: 'Stripe FinTech Europe',
        gridX: 3,
        gridY: 0,
      },
      {
        id: 'b5',
        code: 'C-01',
        tier: 'GOLD',
        sizeSqm: 12,
        priceUsd: 18000,
        status: 'SOLD',
        sponsorName: 'Turkcell Bulut Veri Merkezi',
        gridX: 0,
        gridY: 1,
      },
      {
        id: 'b6',
        code: 'C-02',
        tier: 'GOLD',
        sizeSqm: 12,
        priceUsd: 18000,
        status: 'SOLD',
        sponsorName: 'Datadog Observability',
        gridX: 1,
        gridY: 1,
      },
      {
        id: 'b7',
        code: 'C-03',
        tier: 'GOLD',
        sizeSqm: 12,
        priceUsd: 18000,
        status: 'AVAILABLE',
        sponsorName: 'Müsait Stant Alanı',
        gridX: 2,
        gridY: 1,
      },
      {
        id: 'b8',
        code: 'S-01',
        tier: 'STARTUP_POD',
        sizeSqm: 6,
        priceUsd: 6500,
        status: 'SOLD',
        sponsorName: 'NovaLedger AI',
        gridX: 3,
        gridY: 1,
      },
    ],
    badge: {
      attendeeName: 'DR. KAAN DEMİR',
      attendeeTitle: 'Principal AI & Cloud Architect',
      companyName: 'CORPUS ENTERPRISE HOLDING',
      role: 'KEYNOTE_SPEAKER',
      ticketCode: 'CRP-2026-VIP-8841',
      accessZones: ['MAIN STAGE', 'BACKSTAGE', 'VIP LOUNGE', 'SPEAKER DINNER'],
      accentColor: '#f43f5e',
    },
  },
};

export function calculateEventFinancials(project: EventProject) {
  const ticketRevenue = project.paidTicketsCount * project.ticketPriceUsd;
  const sponsorRevenue = project.booths
    .filter((b) => b.status === 'SOLD' || b.status === 'RESERVED')
    .reduce((acc, b) => acc + b.priceUsd, 0);

  const totalRevenue = ticketRevenue + sponsorRevenue;
  const netProfit = totalRevenue - project.productionCostUsd;
  const roiPercent =
    project.productionCostUsd > 0
      ? Math.round((netProfit / project.productionCostUsd) * 100)
      : 0;

  const soldBooths = project.booths.filter((b) => b.status === 'SOLD').length;
  const totalSqm = project.booths.reduce((a, b) => a + b.sizeSqm, 0);

  return {
    ticketRevenue,
    sponsorRevenue,
    totalRevenue,
    netProfit,
    roiPercent,
    soldBooths,
    totalBooths: project.booths.length,
    totalSqm,
  };
}

function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawDeterministicQrMatrix(
  ctx: CanvasRenderingContext2D,
  seedText: string,
  x: number,
  y: number,
  size: number,
  fgColor: string
) {
  const cells = 15;
  const cellSize = size / cells;
  ctx.fillStyle = '#ffffff';
  drawRoundedBox(ctx, x - 6, y - 6, size + 12, size + 12, 8);
  ctx.fill();

  ctx.fillStyle = fgColor;
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r: number, c: number) =>
    (r < 4 && c < 4) || (r < 4 && c >= cells - 4) || (r >= cells - 4 && c < 4);

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) {
        const inOuter =
          r === 0 ||
          r === 3 ||
          c === 0 ||
          c === 3 ||
          r === cells - 1 ||
          r === cells - 4 ||
          c === cells - 1 ||
          c === cells - 4;
        const inCenter =
          (r >= 1 && r <= 2 && c >= 1 && c <= 2) ||
          (r >= 1 && r <= 2 && c >= cells - 3 && c <= cells - 2) ||
          (r >= cells - 3 && r <= cells - 2 && c >= 1 && c <= 2);
        if (inOuter || inCenter) {
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      } else {
        const bit = ((hash >>> ((r * cells + c) % 28)) ^ (r * 17 + c * 31)) & 1;
        if (bit === 1) {
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize - 0.8, cellSize - 0.8);
        }
      }
    }
  }
}

export function renderEventMasterCanvas(
  canvas: HTMLCanvasElement,
  project: EventProject
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const fin = calculateEventFinancials(project);
  const roleMeta = BADGE_ROLE_META[project.badge.role];

  // 1. Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(0.5, '#131129');
  bg.addColorStop(1, '#090d16');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Top Summit Banner
  ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.45)';
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 40, 28, W - 80, 94, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8b5cf6';
  drawRoundedBox(ctx, 60, 46, 6, 58, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 23px Inter, sans-serif';
  ctx.fillText(project.eventName, 82, 68);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `MEKAN: ${project.venueName}  •  TARİH: ${project.cityAndDate}  •  KATILIMCI: ${project.expectedAttendees.toLocaleString('tr-TR')} Kişi`,
    82,
    96
  );

  // Summit Revenue & ROI Pill
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.strokeStyle = '#10b981';
  drawRoundedBox(ctx, W - 450, 42, 386, 66, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10.5px Inter, sans-serif';
  ctx.fillText('TOPLAM ZİRVE GELİRİ & NET SPONSORLUK ROI', W - 432, 64);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(
    `$${fin.totalRevenue.toLocaleString('en-US')} (+%${fin.roiPercent} ROI)`,
    W - 432,
    94
  );

  // 3. Left Panel: Multi-Track Conference Schedule (720px wide)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
  drawRoundedBox(ctx, 40, 140, 760, 888, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('1. ÇOK SALONLU KONFERANS AKIŞI (MULTI-TRACK AGENDA)', 68, 176);

  project.sessions.slice(0, 6).forEach((sess, idx) => {
    const sy = 200 + idx * 132;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.strokeStyle = sess.highlight
      ? 'rgba(168, 85, 247, 0.65)'
      : 'rgba(63, 63, 70, 0.7)';
    drawRoundedBox(ctx, 64, sy, 712, 118, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${sess.timeSlot}  •  [${sess.track}]`, 84, sy + 26);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(sess.title.slice(0, 62), 84, sy + 52);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 12.5px Inter, sans-serif';
    ctx.fillText(
      `🎙️ ${sess.speakerName} — ${sess.speakerTitle} @ ${sess.company}`,
      84,
      sy + 78
    );

    const fillRatio = Math.min(100, Math.round((sess.registered / sess.capacity) * 100));
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(
      `Kapasite: ${sess.registered}/${sess.capacity} (%${fillRatio} Dolu)`,
      84,
      sy + 102
    );
  });

  // 4. Center Panel: Interactive Expo Floorplan & Booth Matrix (600px wide)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
  drawRoundedBox(ctx, 820, 140, 600, 888, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(
    `2. FUAR & SPONSOR STANT YERLEŞİM PLANI (${fin.totalSqm} m²)`,
    846,
    176
  );

  // Stage Blueprint Header inside Floorplan
  ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
  ctx.strokeStyle = '#8b5cf6';
  drawRoundedBox(ctx, 846, 200, 548, 62, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('🎭 ANA ODİTORYUM SAHNESİ & DEV LED EKRAN GİRİŞİ', 930, 236);

  // Booth Grid Cards
  project.booths.slice(0, 8).forEach((booth, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 846 + col * 280;
    const by = 282 + row * 145;
    const tierMeta = BOOTH_TIER_META[booth.tier];

    ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
    ctx.strokeStyle =
      booth.status === 'AVAILABLE' ? '#475569' : tierMeta.color;
    ctx.lineWidth = 2;
    drawRoundedBox(ctx, bx, by, 266, 128, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = tierMeta.color;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `[${booth.code}] ${booth.tier} (${booth.sizeSqm}m²)`,
      bx + 16,
      by + 26
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(booth.sponsorName.slice(0, 26), bx + 16, by + 56);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`$${booth.priceUsd.toLocaleString('en-US')}`, bx + 16, by + 84);

    ctx.fillStyle =
      booth.status === 'SOLD'
        ? '#10b981'
        : booth.status === 'RESERVED'
        ? '#f59e0b'
        : '#94a3b8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`DURUM: ${booth.status}`, bx + 16, by + 108);
  });

  // Financial Breakdown Box under Floorplan
  ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 846, 872, 548, 132, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText(
    `Bilet Geliri: $${fin.ticketRevenue.toLocaleString('en-US')}   |   Sponsorluk Geliri: $${fin.sponsorRevenue.toLocaleString('en-US')}`,
    868,
    908
  );
  ctx.fillText(
    `Prodüksiyon & Mekan Maliyeti: -$${project.productionCostUsd.toLocaleString('en-US')}`,
    868,
    938
  );
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 17px monospace';
  ctx.fillText(
    `NET ZİRVE KÂRI (EBITDA): $${fin.netProfit.toLocaleString('en-US')}`,
    868,
    976
  );

  // 5. Right Panel: High-Security VIP Conference Badge Preview (440px wide)
  const badgeX = 1440;
  const badgeY = 140;
  const badgeW = 440;
  const badgeH = 888;

  ctx.save();
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = roleMeta.color;
  ctx.lineWidth = 3;
  drawRoundedBox(ctx, badgeX, badgeY, badgeW, badgeH, 28);
  ctx.fill();
  ctx.stroke();

  // Lanyard Slot Cutout at Top
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#3f3f46';
  drawRoundedBox(ctx, badgeX + badgeW / 2 - 55, badgeY + 22, 110, 20, 10);
  ctx.fill();
  ctx.stroke();

  // Badge Header Gradient Band
  const bandGrad = ctx.createLinearGradient(
    badgeX,
    badgeY + 60,
    badgeX + badgeW,
    badgeY + 180
  );
  bandGrad.addColorStop(0, roleMeta.color);
  bandGrad.addColorStop(1, '#4f46e5');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(badgeX + 4, badgeY + 62, badgeW - 8, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('OFFICIAL SUMMIT CREDENTIAL', badgeX + 32, badgeY + 98);
  ctx.font = '800 20px Inter, sans-serif';
  ctx.fillText(project.eventName.slice(0, 28), badgeX + 32, badgeY + 130);
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(project.cityAndDate, badgeX + 32, badgeY + 154);

  // Attendee Name & Company
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px Inter, sans-serif';
  ctx.fillText(project.badge.attendeeName.slice(0, 20), badgeX + 32, badgeY + 245);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText(project.badge.attendeeTitle.slice(0, 32), badgeX + 32, badgeY + 280);

  ctx.fillStyle = roleMeta.color;
  ctx.font = 'bold 17px Inter, sans-serif';
  ctx.fillText(project.badge.companyName.slice(0, 28), badgeX + 32, badgeY + 312);

  // Access Zone Pills
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('YETKİLİ ERİŞİM BÖLGELERİ (ACCESS ZONES):', badgeX + 32, badgeY + 362);

  project.badge.accessZones.slice(0, 4).forEach((z, zi) => {
    const col = zi % 2;
    const row = Math.floor(zi / 2);
    const zx = badgeX + 32 + col * 192;
    const zy = badgeY + 378 + row * 44;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = roleMeta.color + '88';
    drawRoundedBox(ctx, zx, zy, 180, 34, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(`✓ ${z}`, zx + 12, zy + 22);
  });

  // QR Verification Box
  drawDeterministicQrMatrix(
    ctx,
    `${project.badge.ticketCode}-${project.badge.attendeeName}`,
    badgeX + badgeW / 2 - 85,
    badgeY + 495,
    170,
    '#09090b'
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(
    `PASS ID: ${project.badge.ticketCode}`,
    badgeX + badgeW / 2 - 88,
    badgeY + 700
  );

  // Bottom Role Banner on Badge
  ctx.fillStyle = roleMeta.color;
  drawRoundedBox(ctx, badgeX + 24, badgeY + badgeH - 110, badgeW - 48, 82, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px Inter, sans-serif';
  ctx.fillText(roleMeta.label, badgeX + 58, badgeY + badgeH - 58);

  ctx.restore();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS EVENT, CONFERENCE BADGE & FLOORPLAN STUDIO (#032 PRO)  •  4K SUMMIT & EXPO SUITE',
    44,
    H - 16
  );
}

export function exportEventExcel(project: EventProject) {
  const wb = XLSX.utils.book_new();
  const sessRows = project.sessions.map((s) => ({
    Saat: s.timeSlot,
    Salon: s.track,
    'Oturum Başlığı': s.title,
    Konuşmacı: s.speakerName,
    Unvan: s.speakerTitle,
    Şirket: s.company,
    Kapasite: s.capacity,
    Kayıtlı: s.registered,
  }));

  const boothRows = project.booths.map((b) => ({
    'Stant Kodu': b.code,
    Kademe: b.tier,
    'Alan (m²)': b.sizeSqm,
    'Fiyat ($)': b.priceUsd,
    Durum: b.status,
    'Sponsor Kurum': b.sponsorName,
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessRows), 'Konferans Ajandası');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(boothRows), 'Fuar Stant Planı');
  XLSX.writeFile(wb, `${project.id}-Zirve-Plani.xlsx`);
}
