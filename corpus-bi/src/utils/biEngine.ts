import * as XLSX from 'xlsx';

export type AggregationFn = 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';
export type ChartStyle = 'bar' | 'line-area' | 'donut' | 'horizontal';

export type DataRow = Record<string, string | number>;

export interface BiDataset {
  id: string;
  title: string;
  subtitle: string;
  currencySymbol: string;
  rows: DataRow[];
}

export interface PivotItem {
  label: string;
  value: number;
  count: number;
  sharePercent: number;
}

export interface MetricStats {
  sum: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
  anomalies: { rowIndex: number; label: string; value: number; zScore: number }[];
}

export const PRESET_BI_DATASETS: Record<string, { name: string; build: () => BiDataset }> = {
  ecommerce: {
    name: 'E-Ticaret & Bölgesel Satışlar',
    build: () => ({
      id: 'ecommerce',
      title: '2026 Q3-Q4 Kurumsal E-Ticaret & Bölgesel Satış Raporu',
      subtitle: 'Kategori, Bölge ve Satış Kanalı Bazında Gelir & Kârlılık Analizi',
      currencySymbol: '₺',
      rows: [
        { Ay: 'Temmuz', Bolge: 'Marmara', Kategori: 'Elektronik', Kanal: 'Mobil Uygulama', Gelir: 485000, Maliyet: 310000, NetKar: 175000, SiparisAdet: 640 },
        { Ay: 'Temmuz', Bolge: 'İç Anadolu', Kategori: 'Ev & Yaşam', Kanal: 'Web Mağaza', Gelir: 265000, Maliyet: 168000, NetKar: 97000, SiparisAdet: 410 },
        { Ay: 'Ağustos', Bolge: 'Ege', Kategori: 'Moda & Tekstil', Kanal: 'Mobil Uygulama', Gelir: 390000, Maliyet: 215000, NetKar: 175000, SiparisAdet: 820 },
        { Ay: 'Ağustos', Bolge: 'Marmara', Kategori: 'Kozmetik', Kanal: 'Pazaryeri', Gelir: 320000, Maliyet: 172000, NetKar: 148000, SiparisAdet: 950 },
        { Ay: 'Eylül', Bolge: 'Akdeniz', Kategori: 'Elektronik', Kanal: 'Web Mağaza', Gelir: 440000, Maliyet: 295000, NetKar: 145000, SiparisAdet: 530 },
        { Ay: 'Eylül', Bolge: 'Marmara', Kategori: 'Elektronik', Kanal: 'Kurumsal B2B', Gelir: 790000, Maliyet: 480000, NetKar: 310000, SiparisAdet: 310 },
        { Ay: 'Ekim', Bolge: 'İç Anadolu', Kategori: 'Moda & Tekstil', Kanal: 'Mobil Uygulama', Gelir: 355000, Maliyet: 195000, NetKar: 160000, SiparisAdet: 740 },
        { Ay: 'Ekim', Bolge: 'Ege', Kategori: 'Ev & Yaşam', Kanal: 'Pazaryeri', Gelir: 295000, Maliyet: 180000, NetKar: 115000, SiparisAdet: 490 },
        { Ay: 'Kasım', Bolge: 'Marmara', Kategori: 'Elektronik', Kanal: 'Mobil Uygulama', Gelir: 960000, Maliyet: 585000, NetKar: 375000, SiparisAdet: 1290 },
        { Ay: 'Kasım', Bolge: 'Karadeniz', Kategori: 'Ev & Yaşam', Kanal: 'Web Mağaza', Gelir: 215000, Maliyet: 132000, NetKar: 83000, SiparisAdet: 340 },
      ],
    }),
  },
  saas: {
    name: 'SaaS B2B MRR & Kohort Analizi',
    build: () => ({
      id: 'saas',
      title: 'Corpus Cloud SaaS B2B MRR & Kurumsal Kohort Analizi',
      subtitle: 'Sektör ve Paket Bazında Aylık Tekrarlayan Gelir (MRR) ve Genişleme',
      currencySymbol: '$',
      rows: [
        { Donem: '2026-06', Sektor: 'FinTech', Paket: 'Enterprise', MRR: 42000, AktifKullanici: 1850, DestekMaliyeti: 4100 },
        { Donem: '2026-07', Sektor: 'E-Ticaret', Paket: 'Growth Pro', MRR: 28500, AktifKullanici: 1420, DestekMaliyeti: 3200 },
        { Donem: '2026-08', Sektor: 'Sağlık Teknolojisi', Paket: 'Enterprise', MRR: 51000, AktifKullanici: 2190, DestekMaliyeti: 4900 },
        { Donem: '2026-09', Sektor: 'Lojistik', Paket: 'Team', MRR: 19400, AktifKullanici: 980, DestekMaliyeti: 2100 },
        { Donem: '2026-10', Sektor: 'FinTech', Paket: 'Enterprise', MRR: 68000, AktifKullanici: 2940, DestekMaliyeti: 5300 },
        { Donem: '2026-10', Sektor: 'Yapay Zeka', Paket: 'Growth Pro', MRR: 37500, AktifKullanici: 1680, DestekMaliyeti: 2900 },
      ],
    }),
  },
  logistics: {
    name: 'Lojistik & Filo Performansı',
    build: () => ({
      id: 'logistics',
      title: 'Tedarik Zinciri, Depo & Filo Operasyon Raporu',
      subtitle: 'Merkez Depolar Arası Sefer Maliyeti ve Teslimat Performansı',
      currencySymbol: '₺',
      rows: [
        { MerkezDepo: 'Gebze Ana Lojistik', Hat: 'Marmara-Avrupa', SeferSayisi: 145, ToplamMaliyet: 410000, ZamanindaTeslimYuzde: 98.4 },
        { MerkezDepo: 'İzmir Ege Transfer', Hat: 'Ege-Akdeniz', SeferSayisi: 112, ToplamMaliyet: 315000, ZamanindaTeslimYuzde: 96.8 },
        { MerkezDepo: 'Ankara Merkez Hub', Hat: 'İç Anadolu', SeferSayisi: 128, ToplamMaliyet: 352000, ZamanindaTeslimYuzde: 97.5 },
        { MerkezDepo: 'Mersin Liman Depo', Hat: 'Güney İhracat', SeferSayisi: 94, ToplamMaliyet: 289000, ZamanindaTeslimYuzde: 95.2 },
        { MerkezDepo: 'Samsun Kuzey Hub', Hat: 'Karadeniz', SeferSayisi: 76, ToplamMaliyet: 214000, ZamanindaTeslimYuzde: 96.1 },
      ],
    }),
  },
};

export const DEFAULT_BI_DATASET: BiDataset = PRESET_BI_DATASETS.ecommerce.build();

/** Inspect columns into categorical dimensions and numeric metrics */
export function inspectColumns(rows: DataRow[]): {
  dimensions: string[];
  metrics: string[];
} {
  if (!rows.length) return { dimensions: [], metrics: [] };
  const keys = Object.keys(rows[0]);
  const dimensions: string[] = [];
  const metrics: string[] = [];

  for (const key of keys) {
    const numericCount = rows.filter(
      (r) => typeof r[key] === 'number' || (!isNaN(Number(r[key])) && r[key] !== '')
    ).length;
    if (numericCount >= Math.ceil(rows.length * 0.7)) {
      metrics.push(key);
    } else {
      dimensions.push(key);
    }
  }

  if (dimensions.length === 0 && keys.length > 0) dimensions.push(keys[0]);
  if (metrics.length === 0 && keys.length > 1) metrics.push(keys[keys.length - 1]);

  return { dimensions, metrics };
}

/** Compute Pivot Table grouping by dimension and aggregating metric */
export function computePivot(
  rows: DataRow[],
  dimensionKey: string,
  metricKey: string,
  fn: AggregationFn
): PivotItem[] {
  const groups = new Map<string, number[]>();

  for (const r of rows) {
    const label = String(r[dimensionKey] ?? 'Diğer');
    const rawVal = Number(r[metricKey]);
    const val = isNaN(rawVal) ? 0 : rawVal;
    const arr = groups.get(label) || [];
    arr.push(val);
    groups.set(label, arr);
  }

  const rawItems: { label: string; value: number; count: number }[] = [];
  for (const [label, vals] of groups.entries()) {
    const sum = vals.reduce((a, b) => a + b, 0);
    let value = sum;
    if (fn === 'AVG') value = vals.length ? sum / vals.length : 0;
    else if (fn === 'COUNT') value = vals.length;
    else if (fn === 'MAX') value = Math.max(...vals);
    else if (fn === 'MIN') value = Math.min(...vals);

    rawItems.push({
      label,
      value: Math.round(value * 100) / 100,
      count: vals.length,
    });
  }

  rawItems.sort((a, b) => b.value - a.value);
  const total = rawItems.reduce((acc, item) => acc + Math.max(0, item.value), 0) || 1;

  return rawItems.map((it) => ({
    ...it,
    sharePercent: Math.round((Math.max(0, it.value) / total) * 1000) / 10,
  }));
}

/** Calculate comprehensive statistics and Z-score anomalies for a metric column */
export function calculateMetricStats(
  rows: DataRow[],
  metricKey: string,
  dimensionKey: string
): MetricStats {
  const values = rows
    .map((r) => Number(r[metricKey]))
    .filter((v) => !isNaN(v));

  if (!values.length) {
    return { sum: 0, avg: 0, min: 0, max: 0, median: 0, stdDev: 0, anomalies: [] };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: MetricStats['anomalies'] = [];
  if (stdDev > 0) {
    rows.forEach((r, idx) => {
      const val = Number(r[metricKey]);
      if (isNaN(val)) return;
      const z = (val - avg) / stdDev;
      if (Math.abs(z) >= 1.45) {
        anomalies.push({
          rowIndex: idx + 1,
          label: String(r[dimensionKey] ?? `Satır #${idx + 1}`),
          value: val,
          zScore: Math.round(z * 100) / 100,
        });
      }
    });
  }

  return {
    sum: Math.round(sum * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    min,
    max,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    anomalies,
  };
}

/** Parse uploaded CSV, XLSX, or JSON file into DataRow[] */
export async function parseUploadedDataFile(file: File): Promise<DataRow[]> {
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<DataRow>(firstSheet, { defval: '' });
  return rows;
}

/** Export raw data + pivot summary into a multi-sheet .xlsx workbook */
export function exportBiReportToExcel(
  dataset: BiDataset,
  pivot: PivotItem[],
  dimensionKey: string,
  metricKey: string,
  fn: AggregationFn
) {
  const wb = XLSX.utils.book_new();

  const pivotRows = pivot.map((p) => ({
    [dimensionKey]: p.label,
    [`${fn} (${metricKey})`]: p.value,
    'Kayıt Sayısı': p.count,
    'Pay (%)': `%${p.sharePercent}`,
  }));

  const wsPivot = XLSX.utils.json_to_sheet(pivotRows);
  const wsRaw = XLSX.utils.json_to_sheet(dataset.rows);

  XLSX.utils.book_append_sheet(wb, wsPivot, 'Pivot_Ozet_Rapor');
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Ham_Veri_Tablosu');

  XLSX.writeFile(
    wb,
    `${dataset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'corpus-bi'}-rapor.xlsx`
  );
}

const CHART_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#ef4444',
  '#84cc16',
];

/** Render 4K Executive BI Report Dashboard onto HTML5 Canvas */
export function renderBiDashboardToCanvas(
  canvas: HTMLCanvasElement,
  dataset: BiDataset,
  pivot: PivotItem[],
  stats: MetricStats,
  dimensionKey: string,
  metricKey: string,
  fn: AggregationFn,
  chartStyle: ChartStyle
): void {
  const width = 1400;
  const height = 880;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Dark Executive Background
  ctx.fillStyle = '#09090d';
  ctx.fillRect(0, 0, width, height);

  // Top Header Strip
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, width, 84);
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(0, 82, width, 2);

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.fillText(dataset.title, 36, 38);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(
    `${dataset.subtitle}   •   Gruplama: ${dimensionKey} → ${fn}(${metricKey})`,
    36,
    64
  );

  // 4 Executive KPI Cards
  const kpis = [
    {
      label: `TOPLAM (${metricKey})`,
      val: `${dataset.currencySymbol}${stats.sum.toLocaleString('tr-TR')}`,
      sub: `${dataset.rows.length} Toplam Satır`,
      color: '#8b5cf6',
    },
    {
      label: `ORTALAMA (${metricKey})`,
      val: `${dataset.currencySymbol}${stats.avg.toLocaleString('tr-TR')}`,
      sub: `Medyan: ${stats.median.toLocaleString('tr-TR')}`,
      color: '#06b6d4',
    },
    {
      label: 'MAKSİMUM DEĞER',
      val: `${dataset.currencySymbol}${stats.max.toLocaleString('tr-TR')}`,
      sub: `Min: ${stats.min.toLocaleString('tr-TR')}`,
      color: '#10b981',
    },
    {
      label: 'STANDART SAPMA & UÇ DEĞER',
      val: `±${stats.stdDev.toLocaleString('tr-TR')}`,
      sub: `${stats.anomalies.length} İstatistiksel Sapma`,
      color: '#f59e0b',
    },
  ];

  const cardW = (width - 72 - 48) / 4;
  const cardH = 118;
  const cardY = 110;

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
    ctx.fillText(k.label.toUpperCase(), cx + 18, cardY + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px JetBrains Mono, monospace';
    ctx.fillText(k.val, cx + 18, cardY + 68);

    ctx.fillStyle = k.color;
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText(k.sub, cx + 18, cardY + 96);
  });

  // Left Main Chart Card (840px wide)
  const mainX = 36;
  const mainY = 252;
  const mainW = 840;
  const mainH = 584;

  ctx.fillStyle = '#13131c';
  ctx.strokeStyle = '#272732';
  ctx.beginPath();
  ctx.roundRect(mainX, mainY, mainW, mainH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText(
    `${dimensionKey} Bazında ${fn}(${metricKey}) Dağılım Grafiği`,
    mainX + 24,
    mainY + 36
  );

  const items = pivot.slice(0, 8);
  const maxVal = Math.max(1, ...items.map((i) => i.value));

  const plotX = mainX + 48;
  const plotY = mainY + 72;
  const plotW = mainW - 96;
  const plotH = mainH - 135;

  if (chartStyle === 'bar' || chartStyle === 'line-area') {
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const gy = plotY + (plotH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(plotX, gy);
      ctx.lineTo(plotX + plotW, gy);
      ctx.stroke();
    }

    const stepW = plotW / Math.max(1, items.length);

    if (chartStyle === 'bar') {
      items.forEach((it, i) => {
        const bw = Math.min(72, stepW * 0.62);
        const bx = plotX + i * stepW + (stepW - bw) / 2;
        const bh = (it.value / maxVal) * (plotH - 24);
        const by = plotY + plotH - bh;
        const col = CHART_COLORS[i % CHART_COLORS.length];

        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, [8, 8, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(it.value.toLocaleString('tr-TR'), bx + bw / 2, by - 8);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(it.label.slice(0, 14), bx + bw / 2, plotY + plotH + 24);
        ctx.textAlign = 'left';
      });
    } else {
      // Line-Area chart
      const pts = items.map((it, i) => ({
        x: plotX + i * stepW + stepW / 2,
        y: plotY + plotH - (it.value / maxVal) * (plotH - 28),
        it,
      }));

      if (pts.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, plotY + plotH);
        pts.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, plotY + plotH);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
        areaGrad.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
        areaGrad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
        ctx.fillStyle = areaGrad;
        ctx.fill();

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();

        pts.forEach((p) => {
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f4f4f5';
          ctx.font = 'bold 12px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.it.value.toLocaleString('tr-TR'), p.x, p.y - 12);

          ctx.fillStyle = '#a1a1aa';
          ctx.font = '12px Inter, sans-serif';
          ctx.fillText(p.it.label.slice(0, 14), p.x, plotY + plotH + 24);
        });
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }
  } else if (chartStyle === 'horizontal') {
    const rowH = plotH / Math.max(1, items.length);
    items.forEach((it, i) => {
      const ry = plotY + i * rowH;
      const bw = (it.value / maxVal) * (plotW - 180);
      const col = CHART_COLORS[i % CHART_COLORS.length];

      ctx.fillStyle = '#d4d4d8';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(it.label.slice(0, 18), plotX, ry + 22);

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(plotX + 150, ry + 6, Math.max(8, bw), 24, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(
        `${it.value.toLocaleString('tr-TR')} (%${it.sharePercent})`,
        plotX + 160 + bw,
        ry + 23
      );
    });
  } else {
    // Donut chart
    const cx = mainX + mainW * 0.36;
    const cy = mainY + mainH * 0.54;
    const radius = 165;
    let startAngle = -Math.PI / 2;
    const total = items.reduce((acc, x) => acc + Math.max(0, x.value), 0) || 1;

    items.forEach((it, i) => {
      const slice = (Math.max(0, it.value) / total) * Math.PI * 2;
      const col = CHART_COLORS[i % CHART_COLORS.length];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fill();
      startAngle += slice;

      // Legend on right
      const lx = mainX + mainW * 0.66;
      const ly = plotY + 24 + i * 42;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(lx, ly, 16, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#f4f4f5';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(`${it.label} (%${it.sharePercent})`, lx + 26, ly + 13);
    });

    // Inner hole
    ctx.fillStyle = '#13131c';
    ctx.beginPath();
    ctx.arc(cx, cy, 92, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${items.length} Grup`, cx, cy + 6);
    ctx.textAlign = 'left';
  }

  // Right Pivot Table Summary Card
  const rightX = mainX + mainW + 20;
  const rightW = width - rightX - 36;

  ctx.fillStyle = '#13131c';
  ctx.strokeStyle = '#272732';
  ctx.beginPath();
  ctx.roundRect(rightX, mainY, rightW, mainH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('Pivot Özet Tablosu & Paylar', rightX + 22, mainY + 36);

  let py = mainY + 76;
  pivot.slice(0, 10).forEach((p, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#181824' : '#13131c';
    ctx.fillRect(rightX + 16, py - 20, rightW - 32, 38);

    ctx.fillStyle = CHART_COLORS[idx % CHART_COLORS.length];
    ctx.beginPath();
    ctx.arc(rightX + 30, py - 1, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText(p.label.slice(0, 22), rightX + 44, py + 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `${dataset.currencySymbol}${p.value.toLocaleString('tr-TR')} (%${p.sharePercent})`,
      rightX + rightW - 26,
      py + 4
    );
    ctx.textAlign = 'left';
    py += 44;
  });
}

export function exportBiDashboardPng(canvas: HTMLCanvasElement, title: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'corpus-bi'}-4k-dashboard.png`;
  a.click();
}
