import * as XLSX from 'xlsx';

export interface Shareholder {
  id: string;
  name: string;
  role: string;
  preRoundPercent: number;
  color: string;
}

export interface PitchProject {
  id: string;
  companyName: string;
  tagline: string;
  roundName: string; // e.g., "Series A", "Seed Round"
  preMoneyValuationM: number; // in Million USD
  investmentAskM: number; // in Million USD
  esopPoolPercent: number;
  currentArrM: number;
  yoyGrowthPercent: number;
  monthlyBurnK: number; // in Thousand USD
  tamBillion: number;
  samBillion: number;
  somMillion: number;
  shareholders: Shareholder[];
  useOfFunds: { label: string; percent: number; color: string }[];
  projectionsArrM: number[]; // 5 Years ARR in $M
}

export const PITCH_PRESETS: Record<string, PitchProject> = {
  'series-a-ai-saas': {
    id: 'series-a-ai-saas',
    companyName: 'Corpus Cloud AI Inc.',
    tagline: 'Kurumsal Veri Güvenliği Odaklı Otonom Mühendislik & İş Zekası Platformu',
    roundName: 'SERİ A YATIRIM TURU',
    preMoneyValuationM: 32,
    investmentAskM: 8,
    esopPoolPercent: 10,
    currentArrM: 3.4,
    yoyGrowthPercent: 215,
    monthlyBurnK: 185,
    tamBillion: 84,
    samBillion: 14.5,
    somMillion: 420,
    shareholders: [
      { id: 'sh1', name: 'Kurucu Ortaklar (CEO & CTO)', role: 'Founders', preRoundPercent: 68, color: '#8b5cf6' },
      { id: 'sh2', name: 'Tohum Yatırımcılar (Seed VC)', role: 'Early VC', preRoundPercent: 22, color: '#06b6d4' },
      { id: 'sh3', name: 'Mevcut Çalışan Opsiyon Havuzu', role: 'ESOP', preRoundPercent: 10, color: '#10b981' },
    ],
    useOfFunds: [
      { label: 'Ar-Ge & Çok Modlu AI Mühendisliği', percent: 45, color: '#8b5cf6' },
      { label: 'Global Kurumsal Satış (AB & ABD GTM)', percent: 35, color: '#06b6d4' },
      { label: 'SOC2 / ISO Güvenlik & Bulut Altyapısı', percent: 20, color: '#10b981' },
    ],
    projectionsArrM: [3.4, 8.2, 18.5, 36.0, 68.0],
  },
  'seed-fintech-infra': {
    id: 'seed-fintech-infra',
    companyName: 'NovaLedger Protocol',
    tagline: 'Sınır Ötesi B2B Anlık Mutabakat & Hazine Yönetim Altyapısı',
    roundName: 'TOHUM (SEED) YATIRIM TURU',
    preMoneyValuationM: 12,
    investmentAskM: 3,
    esopPoolPercent: 8,
    currentArrM: 0.95,
    yoyGrowthPercent: 310,
    monthlyBurnK: 95,
    tamBillion: 120,
    samBillion: 19,
    somMillion: 650,
    shareholders: [
      { id: 'sh1', name: 'Kurucu Ekip (3 Ortak)', role: 'Founders', preRoundPercent: 82, color: '#10b981' },
      { id: 'sh2', name: 'Melek Yatırımcılar (Pre-Seed)', role: 'Angels', preRoundPercent: 18, color: '#f59e0b' },
    ],
    useOfFunds: [
      { label: 'Çekirdek Ödeme Motoru & Lisanslar', percent: 50, color: '#10b981' },
      { label: 'B2B Banka & ERP Entegrasyonları', percent: 30, color: '#38bdf8' },
      { label: 'Uyumluluk & Hukuk (EMI Lisanslama)', percent: 20, color: '#f59e0b' },
    ],
    projectionsArrM: [0.95, 3.1, 7.8, 16.4, 34.0],
  },
};

export function calculatePitchMetrics(project: PitchProject) {
  const postMoneyM = project.preMoneyValuationM + project.investmentAskM;
  const newInvestorDilution =
    postMoneyM > 0 ? (project.investmentAskM / postMoneyM) * 100 : 0;
  const retentionFactor = (100 - newInvestorDilution) / 100;

  const capTable = project.shareholders.map((s) => ({
    ...s,
    postRoundPercent: Math.round(s.preRoundPercent * retentionFactor * 100) / 100,
    valuePostRoundM:
      Math.round(((s.preRoundPercent * retentionFactor) / 100) * postMoneyM * 100) / 100,
  }));

  capTable.push({
    id: 'new-investor',
    name: `${project.roundName} Yeni Yatırımcı Payı`,
    role: 'Lead Investor',
    preRoundPercent: 0,
    postRoundPercent: Math.round(newInvestorDilution * 100) / 100,
    valuePostRoundM: project.investmentAskM,
    color: '#f43f5e',
  });

  const runwayMonths =
    project.monthlyBurnK > 0
      ? Math.round((project.investmentAskM * 1000) / project.monthlyBurnK)
      : 36;

  const arrMultiple =
    project.currentArrM > 0
      ? Math.round((project.preMoneyValuationM / project.currentArrM) * 10) / 10
      : 0;

  return {
    postMoneyM,
    newInvestorDilution: Math.round(newInvestorDilution * 100) / 100,
    runwayMonths,
    arrMultiple,
    capTable,
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
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderPitchCanvas(canvas: HTMLCanvasElement, project: PitchProject) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const m = calculatePitchMetrics(project);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header Banner
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.85)';
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 44, 30, W - 88, 94, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8b5cf6';
  drawRoundedBox(ctx, 64, 48, 6, 58, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 25px Inter, sans-serif';
  ctx.fillText(`${project.companyName}  —  ${project.roundName}`, 86, 72);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillText(project.tagline, 86, 100);

  // Valuation Pill
  ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
  ctx.strokeStyle = '#8b5cf6';
  drawRoundedBox(ctx, W - 440, 44, 372, 66, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('POST-MONEY DEĞERLEME & YATIRIM TALEBİ', W - 420, 66);

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`$${m.postMoneyM}M  (Ask: $${project.investmentAskM}M)`, W - 420, 96);

  // 4 Top KPI Cards
  const kpis = [
    {
      l: 'MEVCUT YILLIK GELİR (ARR)',
      v: `$${project.currentArrM}M ARR`,
      s: `YoY Büyüme: +%${project.yoyGrowthPercent}`,
      c: '#10b981',
    },
    {
      l: 'PRE-MONEY DEĞERLEME ÇARPANI',
      v: `$${project.preMoneyValuationM}M (${m.arrMultiple}x ARR)`,
      s: `Yatırımcı Hissesi: %${m.newInvestorDilution}`,
      c: '#38bdf8',
    },
    {
      l: 'NAKİT PİST SÜRESİ (RUNWAY)',
      v: `${m.runwayMonths} Ay Pist`,
      s: `Aylık Net Burn: $${project.monthlyBurnK}K`,
      c: '#f59e0b',
    },
    {
      l: 'HEDEF PAZAR (TAM / SAM / SOM)',
      v: `$${project.tamBillion}B / $${project.samBillion}B`,
      s: `3 Yıllık SOM Hedefi: $${project.somMillion}M`,
      c: '#ec4899',
    },
  ];

  kpis.forEach((k, idx) => {
    const kx = 44 + idx * 462;
    ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
    drawRoundedBox(ctx, kx, 144, 444, 108, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = k.c;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(k.l, kx + 20, 174);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 23px Inter, sans-serif';
    ctx.fillText(k.v, kx + 20, 208);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12.5px Inter, sans-serif';
    ctx.fillText(k.s, kx + 20, 234);
  });

  // Left Panel: Cap Table Pre vs Post Round
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 44, 272, 900, 460, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('1. ORTAKLIK YAPISI (CAP TABLE) & SEYRELME (DILUTION) MATRİSİ', 72, 308);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11.5px Inter, sans-serif';
  ctx.fillText('PAYDAŞ / YATIRIMCI GRUBU', 72, 342);
  ctx.fillText('TUR ÖNCESİ (%)', 480, 342);
  ctx.fillText('TUR SONRASI (%)', 630, 342);
  ctx.fillText('HİSSE DEĞERİ ($M)', 780, 342);

  m.capTable.forEach((row, idx) => {
    const ry = 360 + idx * 72;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
    drawRoundedBox(ctx, 68, ry, 852, 58, 10);
    ctx.fill();

    ctx.fillStyle = row.color;
    drawRoundedBox(ctx, 78, ry + 12, 5, 34, 2.5);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(row.name, 94, ry + 34);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`%${row.preRoundPercent.toFixed(1)}`, 495, ry + 34);

    ctx.fillStyle = row.color;
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`%${row.postRoundPercent.toFixed(2)}`, 645, ry + 34);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`$${row.valuePostRoundM.toFixed(2)}M`, 795, ry + 34);
  });

  // Right Panel: 5-Year ARR Growth Chart
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 968, 272, 908, 460, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('2. 5 YILLIK ARR GELİR PROJEKSİYONU ($ MİLYON)', 996, 308);

  const maxArr = Math.max(10, ...project.projectionsArrM);
  project.projectionsArrM.forEach((val, idx) => {
    const bx = 1040 + idx * 160;
    const maxBarH = 310;
    const barH = Math.max(24, (val / maxArr) * maxBarH);
    const by = 665 - barH;

    const grad = ctx.createLinearGradient(0, by, 0, 665);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad;
    drawRoundedBox(ctx, bx, by, 96, barH, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`$${val}M`, bx + 16, by - 12);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`Yıl ${2026 + idx}`, bx + 22, 695);
  });

  // Bottom Panel: Use of Funds Breakdown
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 44, 752, W - 88, 268, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(
    `3. YATIRIM FONU KULLANIM DAĞILIMI ($${project.investmentAskM}M USE OF FUNDS)`,
    72,
    788
  );

  project.useOfFunds.forEach((u, idx) => {
    const ux = 72 + idx * 600;
    const uy = 815;
    const amountM = ((u.percent / 100) * project.investmentAskM).toFixed(2);

    ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
    ctx.strokeStyle = u.color;
    drawRoundedBox(ctx, ux, uy, 565, 175, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = u.color;
    ctx.font = 'bold 34px monospace';
    ctx.fillText(`%${u.percent}  ($${amountM}M)`, ux + 24, uy + 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(u.label, ux + 24, uy + 108);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillText('18 Aylık Büyüme & Ölçekleme Bütçe Tahsisi', ux + 24, uy + 138);
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS PITCH, CAP TABLE & INVESTOR DECK STUDIO (#029 PRO)  •  VENTURE CAPITAL TEAR SHEET',
    44,
    H - 18
  );
}

export function exportPitchExcel(project: PitchProject) {
  const m = calculatePitchMetrics(project);
  const wb = XLSX.utils.book_new();
  const wsCap = XLSX.utils.json_to_sheet(
    m.capTable.map((c) => ({
      Paydaş: c.name,
      Rol: c.role,
      'Tur Öncesi (%)': c.preRoundPercent,
      'Tur Sonrası (%)': c.postRoundPercent,
      'Post-Money Değer ($M)': c.valuePostRoundM,
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsCap, 'Cap Table');
  XLSX.writeFile(wb, `${project.id}-CapTable-Pitch.xlsx`);
}
