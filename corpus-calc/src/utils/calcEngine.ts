import * as XLSX from 'xlsx';

export type CalcMode = 'loan' | 'saas-roi' | 'compound';

export interface LoanParams {
  principal: number;
  monthlyRatePercent: number;
  termMonths: number;
  taxPercent: number; // KKDF + BSMV (0 for housing, ~15% for consumer, ~5% for commercial)
}

export interface SaasParams {
  arpu: number;
  cac: number;
  monthlyChurnPercent: number;
  grossMarginPercent: number;
  initialCustomers: number;
  monthlyNewCustomers: number;
}

export interface CompoundParams {
  initialCapital: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  annualInflationPercent: number;
  years: number;
}

export interface CalcConfig {
  mode: CalcMode;
  reportTitle: string;
  currency: 'TRY' | 'USD' | 'EUR';
  loan: LoanParams;
  saas: SaasParams;
  compound: CompoundParams;
}

export interface ScheduleRow {
  period: number;
  label: string;
  col1: number;
  col2: number;
  col3: number;
  balance: number;
}

export const DEFAULT_CALC_CONFIG: CalcConfig = {
  mode: 'loan',
  reportTitle: 'Kurumsal Kredi, SaaS ROI & Yatırım Simülasyon Raporu',
  currency: 'TRY',
  loan: {
    principal: 2500000,
    monthlyRatePercent: 3.29,
    termMonths: 24,
    taxPercent: 5,
  },
  saas: {
    arpu: 1850,
    cac: 6400,
    monthlyChurnPercent: 3.2,
    grossMarginPercent: 82,
    initialCustomers: 180,
    monthlyNewCustomers: 45,
  },
  compound: {
    initialCapital: 500000,
    monthlyContribution: 25000,
    annualReturnPercent: 42,
    annualInflationPercent: 28,
    years: 10,
  },
};

export function currencySymbol(c: 'TRY' | 'USD' | 'EUR'): string {
  return c === 'TRY' ? '₺' : c === 'USD' ? '$' : '€';
}

export function fmtMoney(val: number, c: 'TRY' | 'USD' | 'EUR'): string {
  return `${currencySymbol(c)}${Math.round(val).toLocaleString('tr-TR')}`;
}

/** 1. Loan Amortization Schedule & KPIs */
export function computeLoanSimulation(p: LoanParams) {
  const effectiveRate =
    (p.monthlyRatePercent / 100) * (1 + p.taxPercent / 100);
  const n = Math.max(1, p.termMonths);

  let monthlyPayment = p.principal / n;
  if (effectiveRate > 0) {
    const pow = Math.pow(1 + effectiveRate, n);
    monthlyPayment = (p.principal * (effectiveRate * pow)) / (pow - 1);
  }

  let remaining = p.principal;
  const rows: ScheduleRow[] = [];
  let totalInterestAndTax = 0;

  for (let m = 1; m <= n; m++) {
    const interestAndTax = remaining * effectiveRate;
    const principalPart = Math.min(remaining, monthlyPayment - interestAndTax);
    remaining = Math.max(0, remaining - principalPart);
    totalInterestAndTax += interestAndTax;

    rows.push({
      period: m,
      label: `${m}. Ay`,
      col1: Math.round(monthlyPayment),
      col2: Math.round(principalPart),
      col3: Math.round(interestAndTax),
      balance: Math.round(remaining),
    });
  }

  const totalPayable = monthlyPayment * n;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayable: Math.round(totalPayable),
    totalInterestAndTax: Math.round(totalInterestAndTax),
    interestSharePercent: Math.round((totalInterestAndTax / totalPayable) * 1000) / 10,
    rows,
  };
}

/** 2. SaaS Unit Economics (LTV, CAC, Payback, 12-Month MRR Cohort Projection) */
export function computeSaasSimulation(s: SaasParams) {
  const churnRate = Math.max(0.005, s.monthlyChurnPercent / 100);
  const margin = s.grossMarginPercent / 100;
  const grossMonthlyPerCustomer = s.arpu * margin;
  const ltv = grossMonthlyPerCustomer / churnRate;
  const ltvCacRatio = s.cac > 0 ? Math.round((ltv / s.cac) * 100) / 100 : 0;
  const paybackMonths =
    grossMonthlyPerCustomer > 0
      ? Math.round((s.cac / grossMonthlyPerCustomer) * 10) / 10
      : 0;

  let activeCustomers = s.initialCustomers;
  const rows: ScheduleRow[] = [];

  for (let m = 1; m <= 12; m++) {
    const churned = Math.round(activeCustomers * churnRate);
    activeCustomers = activeCustomers - churned + s.monthlyNewCustomers;
    const mrr = activeCustomers * s.arpu;
    const grossProfit = mrr * margin;
    const acqCost = s.monthlyNewCustomers * s.cac;
    const netContribution = grossProfit - acqCost;

    rows.push({
      period: m,
      label: `${m}. Ay`,
      col1: activeCustomers,
      col2: Math.round(mrr),
      col3: Math.round(acqCost),
      balance: Math.round(netContribution),
    });
  }

  const endMrr = rows[rows.length - 1]?.col2 || 0;
  const endArr = endMrr * 12;

  return {
    ltv: Math.round(ltv),
    ltvCacRatio,
    paybackMonths,
    endMrr,
    endArr,
    rows,
  };
}

/** 3. Compound Investment & Inflation-Adjusted Real Return */
export function computeCompoundSimulation(c: CompoundParams) {
  const rMonthly = c.annualReturnPercent / 100 / 12;
  const infAnnual = c.annualInflationPercent / 100;

  let nominalBalance = c.initialCapital;
  let totalContributed = c.initialCapital;
  const rows: ScheduleRow[] = [];

  for (let y = 1; y <= Math.max(1, c.years); y++) {
    for (let m = 1; m <= 12; m++) {
      nominalBalance = nominalBalance * (1 + rMonthly) + c.monthlyContribution;
      totalContributed += c.monthlyContribution;
    }
    const pureGain = nominalBalance - totalContributed;
    const realPurchasingPower = nominalBalance / Math.pow(1 + infAnnual, y);

    rows.push({
      period: y,
      label: `${y}. Yıl`,
      col1: Math.round(totalContributed),
      col2: Math.round(pureGain),
      col3: Math.round(nominalBalance),
      balance: Math.round(realPurchasingPower),
    });
  }

  const last = rows[rows.length - 1];
  return {
    totalContributed: last?.col1 || 0,
    totalGain: last?.col2 || 0,
    finalNominal: last?.col3 || 0,
    finalRealPower: last?.balance || 0,
    rows,
  };
}

/** Export Active Simulation Schedule to Excel (.xlsx) */
export function exportSimulationToExcel(cfg: CalcConfig) {
  const wb = XLSX.utils.book_new();

  if (cfg.mode === 'loan') {
    const sim = computeLoanSimulation(cfg.loan);
    const data = sim.rows.map((r) => ({
      Dönem: r.label,
      'Aylık Taksit': r.col1,
      'Anapara Ödemesi': r.col2,
      'Faiz + Vergi': r.col3,
      'Kalan Anapara Borcu': r.balance,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data),
      'Kredi_Itfa_Tablosu'
    );
  } else if (cfg.mode === 'saas-roi') {
    const sim = computeSaasSimulation(cfg.saas);
    const data = sim.rows.map((r) => ({
      Ay: r.label,
      'Aktif Müşteri': r.col1,
      'Aylık Gelir (MRR)': r.col2,
      'Edinme Maliyeti (CAC Toplam)': r.col3,
      'Net Katkı Payı': r.balance,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data),
      'SaaS_MRR_Projeksiyonu'
    );
  } else {
    const sim = computeCompoundSimulation(cfg.compound);
    const data = sim.rows.map((r) => ({
      Yıl: r.label,
      'Yatırılan Toplam Anapara': r.col1,
      'Bileşik Faiz Kazancı': r.col2,
      'Nominal Portföy Değeri': r.col3,
      'Enflasyondan Arındırılmış Reel Değer': r.balance,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data),
      'Bilesik_Yatirim_Tablosu'
    );
  }

  XLSX.writeFile(wb, `corpus-finans-simulasyon-${cfg.mode}.xlsx`);
}

/** Render 4K Executive Financial Simulation Report onto HTML5 Canvas */
export function renderSimulationToCanvas(
  canvas: HTMLCanvasElement,
  cfg: CalcConfig
): void {
  const width = 1440;
  const height = 880;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#09090d';
  ctx.fillRect(0, 0, width, height);

  // Header Banner
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, width, 84);
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(0, 82, width, 2);

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.fillText(cfg.reportTitle, 36, 38);

  const modeLabels: Record<CalcMode, string> = {
    loan: 'Ticari & Bireysel Kredi İtfa (Amortisman) Analizi',
    'saas-roi': 'SaaS Birim Ekonomisi (LTV / CAC / MRR Projeksiyonu)',
    compound: 'Bileşik Getiri & Enflasyondan Arındırılmış Reel Portföy Analizi',
  };

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(
    `${modeLabels[cfg.mode]}   •   Para Birimi: ${cfg.currency}   •   Corpus Calc Studio (#021)`,
    36,
    64
  );

  // Compute KPIs & Rows based on mode
  let kpis: { title: string; val: string; sub: string; color: string }[] = [];
  let rows: ScheduleRow[] = [];
  let chartTitle = '';

  if (cfg.mode === 'loan') {
    const sim = computeLoanSimulation(cfg.loan);
    rows = sim.rows;
    chartTitle = 'Aylık Kalan Anapara Borcu & Faiz İtfa Eğrisi';
    kpis = [
      {
        title: 'AYLIK TAKSİT TUTARI',
        val: fmtMoney(sim.monthlyPayment, cfg.currency),
        sub: `${cfg.loan.termMonths} Ay Sabit Taksit`,
        color: '#8b5cf6',
      },
      {
        title: 'TOPLAM GERİ ÖDEME',
        val: fmtMoney(sim.totalPayable, cfg.currency),
        sub: `Anapara: ${fmtMoney(cfg.loan.principal, cfg.currency)}`,
        color: '#06b6d4',
      },
      {
        title: 'TOPLAM FAİZ & VERGİ YÜKÜ',
        val: fmtMoney(sim.totalInterestAndTax, cfg.currency),
        sub: `Toplamın %${sim.interestSharePercent}’i`,
        color: '#f59e0b',
      },
      {
        title: 'AYLIK AKDİ FAİZ ORANI',
        val: `%${cfg.loan.monthlyRatePercent}`,
        sub: `Vergi Ekli: %${cfg.loan.taxPercent}`,
        color: '#10b981',
      },
    ];
  } else if (cfg.mode === 'saas-roi') {
    const sim = computeSaasSimulation(cfg.saas);
    rows = sim.rows;
    chartTitle = '12 Aylık MRR (Tekrarlayan Gelir) Büyüme Projeksiyonu';
    kpis = [
      {
        title: 'MÜŞTERİ YAŞAM BOYU DEĞERİ (LTV)',
        val: fmtMoney(sim.ltv, cfg.currency),
        sub: `ARPU: ${fmtMoney(cfg.saas.arpu, cfg.currency)}`,
        color: '#8b5cf6',
      },
      {
        title: 'LTV / CAC VERİMLİLİK ORANI',
        val: `${sim.ltvCacRatio}x`,
        sub: sim.ltvCacRatio >= 3 ? 'Sağlıklı (>3.0x Hedefi)' : 'CAC Optimize Edilmeli',
        color: '#10b981',
      },
      {
        title: 'CAC GERİ DÖNÜŞ SÜRESİ',
        val: `${sim.paybackMonths} Ay`,
        sub: `CAC: ${fmtMoney(cfg.saas.cac, cfg.currency)}`,
        color: '#06b6d4',
      },
      {
        title: '12. AY SONU YILLIK GELİR (ARR)',
        val: fmtMoney(sim.endArr, cfg.currency),
        sub: `12. Ay MRR: ${fmtMoney(sim.endMrr, cfg.currency)}`,
        color: '#f59e0b',
      },
    ];
  } else {
    const sim = computeCompoundSimulation(cfg.compound);
    rows = sim.rows;
    chartTitle = 'Yıllara Göre Nominal Portföy vs Enflasyondan Arındırılmış Reel Değer';
    kpis = [
      {
        title: `${cfg.compound.years}. YIL NOMİNAL PORTFÖY`,
        val: fmtMoney(sim.finalNominal, cfg.currency),
        sub: `Yıllık %${cfg.compound.annualReturnPercent} Bileşik`,
        color: '#8b5cf6',
      },
      {
        title: 'REEL ALIM GÜCÜ (ENFLASYON SONRASI)',
        val: fmtMoney(sim.finalRealPower, cfg.currency),
        sub: `Enflasyon: %${cfg.compound.annualInflationPercent}/yıl`,
        color: '#10b981',
      },
      {
        title: 'NET BİLEŞİK FAİZ KAZANCI',
        val: fmtMoney(sim.totalGain, cfg.currency),
        sub: 'Sermaye Üzeri Net Getiri',
        color: '#06b6d4',
      },
      {
        title: 'TOPLAM YATIRILAN ANAPARA',
        val: fmtMoney(sim.totalContributed, cfg.currency),
        sub: `Aylık +${fmtMoney(cfg.compound.monthlyContribution, cfg.currency)}`,
        color: '#f59e0b',
      },
    ];
  }

  // Draw 4 KPI Cards
  const cardW = (width - 72 - 48) / 4;
  const cardH = 118;
  const cardY = 108;

  kpis.forEach((k, idx) => {
    const cx = 36 + idx * (cardW + 16);
    ctx.fillStyle = '#13131c';
    ctx.strokeStyle = '#272732';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = k.color;
    ctx.fillRect(cx, cardY, cardW, 4);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(k.title, cx + 18, cardY + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 23px JetBrains Mono, monospace';
    ctx.fillText(k.val, cx + 18, cardY + 66);

    ctx.fillStyle = k.color;
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText(k.sub, cx + 18, cardY + 94);
  });

  // Left Chart Box (820px) + Right Schedule Table Box
  const mainY = 250;
  const mainH = 594;
  const leftW = 820;

  ctx.fillStyle = '#13131c';
  ctx.strokeStyle = '#272732';
  ctx.beginPath();
  ctx.roundRect(36, mainY, leftW, mainH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText(chartTitle, 60, mainY + 36);

  const sampleRows = rows.slice(0, 12);
  const maxVal = Math.max(
    1,
    ...sampleRows.map((r) =>
      cfg.mode === 'loan' ? r.balance + r.col2 : cfg.mode === 'saas-roi' ? r.col2 : r.col3
    )
  );

  const plotX = 68;
  const plotY = mainY + 74;
  const plotW = leftW - 64;
  const plotH = mainH - 135;
  const stepW = plotW / Math.max(1, sampleRows.length);

  sampleRows.forEach((r, i) => {
    const val =
      cfg.mode === 'loan' ? r.balance : cfg.mode === 'saas-roi' ? r.col2 : r.col3;
    const bw = Math.min(46, stepW * 0.62);
    const bx = plotX + i * stepW + (stepW - bw) / 2;
    const bh = Math.max(6, (val / maxVal) * (plotH - 24));
    const by = plotY + plotH - bh;

    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, '#8b5cf6');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(r.label, bx + bw / 2, plotY + plotH + 22);
    ctx.textAlign = 'left';
  });

  // Right Schedule Box
  const rightX = 36 + leftW + 20;
  const rightW = width - rightX - 36;

  ctx.fillStyle = '#13131c';
  ctx.strokeStyle = '#272732';
  ctx.beginPath();
  ctx.roundRect(rightX, mainY, rightW, mainH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('Dönemsel Projeksiyon & İtfa Özeti', rightX + 22, mainY + 36);

  let ry = mainY + 76;
  sampleRows.slice(0, 11).forEach((r, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#181824' : '#13131c';
    ctx.fillRect(rightX + 16, ry - 20, rightW - 32, 38);

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText(r.label, rightX + 28, ry + 4);

    const middleText =
      cfg.mode === 'loan'
        ? `Taksit: ${fmtMoney(r.col1, cfg.currency)}`
        : cfg.mode === 'saas-roi'
        ? `${r.col1} Müşteri`
        : `Anapara: ${fmtMoney(r.col1, cfg.currency)}`;
    ctx.fillStyle = '#d4d4d8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(middleText, rightX + 105, ry + 4);

    const endText =
      cfg.mode === 'loan'
        ? `Kalan: ${fmtMoney(r.balance, cfg.currency)}`
        : cfg.mode === 'saas-roi'
        ? `MRR: ${fmtMoney(r.col2, cfg.currency)}`
        : `Reel: ${fmtMoney(r.balance, cfg.currency)}`;
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(endText, rightX + rightW - 26, ry + 4);
    ctx.textAlign = 'left';

    ry += 44;
  });
}

export function exportSimCanvasPng(canvas: HTMLCanvasElement, mode: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corpus-simulasyon-${mode}-4k.png`;
  a.click();
}
