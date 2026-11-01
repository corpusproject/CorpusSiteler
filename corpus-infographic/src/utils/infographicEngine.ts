export type InfographicLayout = 'battlecard' | 'timeline' | 'process-steps';

export interface ComparisonRow {
  id: string;
  feature: string;
  category: string;
  ourValue: string;
  compAValue: string;
  compBValue: string;
  ourScore: number; // 1..10
}

export interface TimelineNode {
  id: string;
  period: string;
  title: string;
  metricBadge: string;
  description: string;
  color: string;
}

export interface ProcessStep {
  id: string;
  stepNo: string;
  title: string;
  latencyOrSla: string;
  detail: string;
  color: string;
}

export interface InfographicProject {
  id: string;
  title: string;
  subtitle: string;
  brandName: string;
  compAName: string;
  compBName: string;
  layout: InfographicLayout;
  themeId: string;
  rows: ComparisonRow[];
  timeline: TimelineNode[];
  steps: ProcessStep[];
  bottomCallout: string;
}

export const INFO_THEMES = [
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    bgStart: '#09090b',
    bgEnd: '#18181b',
    accent: '#f59e0b',
    secondary: '#10b981',
    cardBg: 'rgba(24, 24, 27, 0.94)',
    border: 'rgba(63, 63, 70, 0.85)',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    bgStart: '#070514',
    bgEnd: '#1e1b4b',
    accent: '#a855f7',
    secondary: '#38bdf8',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    bgStart: '#04120c',
    bgEnd: '#06281c',
    accent: '#10b981',
    secondary: '#06b6d4',
    cardBg: 'rgba(6, 28, 20, 0.94)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
];

export const INFOGRAPHIC_PRESETS: Record<string, InfographicProject> = {
  'saas-battlecard': {
    id: 'saas-battlecard',
    title: 'Kurumsal Mimari Karşılaştırması: Corpus Suite vs. Geleneksel Bulut SaaS',
    subtitle: 'Performans, Veri Gizliliği, Toplam Sahip Olma Maliyeti (TCO) ve Güvenlik Kriterleri',
    brandName: 'CORPUS SUITE PRO',
    compAName: 'Geleneksel Bulut SaaS',
    compBName: 'Legacy On-Premise Yazılım',
    layout: 'battlecard',
    themeId: 'cyber-violet',
    rows: [
      {
        id: 'r1',
        feature: 'Veri İşleme & Gizlilik Mimarisi',
        category: 'GÜVENLİK',
        ourValue: '✓ %100 İstemci Taraflı (Zero-Server WebAssembly)',
        compAValue: '✕ Müşteri verisi 3. parti buluta yüklenir',
        compBValue: '◐ Yerel sunucu kurulumu ve bakım gerektirir',
        ourScore: 10,
      },
      {
        id: 'r2',
        feature: 'Ortalama Yanıt & Render Gecikmesi (Latency)',
        category: 'PERFORMANS',
        ourValue: '✓ < 12ms (Tarayıcı GPU / 4K Canvas)',
        compAValue: '✕ 450ms – 2.4sn API Ağ Gecikmesi',
        compBValue: '◐ 120ms – 600ms Yerel Ağ Gecikmesi',
        ourScore: 10,
      },
      {
        id: 'r3',
        feature: 'Aylık Sunucu & Kullanıcı Başı Lisans Maliyeti',
        category: 'MALİYET (TCO)',
        ourValue: '✓ $0 Bulut Faturası / Sınırsız Kullanıcı',
        compAValue: '✕ $49/Ay/Kullanıcı + Aşım Ücretleri',
        compBValue: '✕ Yıllık $45.000+ Donanım & DBA Maliyeti',
        ourScore: 10,
      },
      {
        id: 'r4',
        feature: 'KVKK Madde 9 & GDPR Yurt Dışı Aktarım Riski',
        category: 'UYUMLULUK',
        ourValue: '✓ Sıfır Risk (Veri Cihazdan Hiç Çıkmaz)',
        compAValue: '✕ SCC Sözleşmesi ve Açık Rıza Zorunluluğu',
        compBValue: '✓ Yurt İçi Barındırma',
        ourScore: 10,
      },
      {
        id: 'r5',
        feature: 'Çevrimdışı (Air-Gapped / Offline) Çalışabilme',
        category: 'SÜREKLİLİK',
        ourValue: '✓ %100 Offline Masaüstü (.BAT / PWA) Desteği',
        compAValue: '✕ İnternet kesildiğinde tamamen durur',
        compBValue: '✓ Yerel Intranet üzerinden çalışır',
        ourScore: 9,
      },
      {
        id: 'r6',
        feature: '4K Ultra HD Rapor, SVG & Excel (.XLSX) Çıktısı',
        category: 'DIŞA AKTARIM',
        ourValue: '✓ Tek Tıkla Filigransız 4K PNG + XLSX + SVG',
        compAValue: '◐ Sadece üst pakette / düşük çözünürlük',
        compBValue: '✕ Eski tip statik CSV çıktısı',
        ourScore: 10,
      },
    ],
    timeline: [
      {
        id: 't1',
        period: '2024 Q1',
        title: 'Çekirdek WebAssembly Motoru Ar-Ge Başlangıcı',
        metricBadge: 'v1.0 Çekirdek',
        description: 'Tarayıcı içinde sıfır sunucuyla kriptografi ve PDF işleme motoru geliştirildi.',
        color: '#8b5cf6',
      },
      {
        id: 't2',
        period: '2024 Q4',
        title: 'İlk 10 Kurumsal SaaS Aracının Lansmanı',
        metricBadge: '25.000+ Kullanıcı',
        description: 'Transfer, PDF, Scan, Audio ve Vault stüdyoları kurumsal kullanıma açıldı.',
        color: '#06b6d4',
      },
      {
        id: 't3',
        period: '2025 Q2',
        title: '4K HTML5 Canvas & Excel Raporlama Standardı',
        metricBadge: '60 FPS Render',
        description: 'Tüm araçlara 1920×1080 yönetici sunum çıktısı ve çok sayfalı XLSX desteği eklendi.',
        color: '#10b981',
      },
      {
        id: 't4',
        period: '2025 Q4',
        title: 'FinTech, Siber Güvenlik & Hukuk Modülleri',
        metricBadge: 'SOC2 & KVKK',
        description: 'ISO 27001 Risk Matrisi, VERBİS Veri Envanteri ve Cap Table simülatörleri devreye alındı.',
        color: '#f59e0b',
      },
      {
        id: 't5',
        period: '2026 Q3',
        title: '35+ Tam Entegre Corpus PRO Ekosistemi',
        metricBadge: '%99.99 Memnuniyet',
        description: 'Mühendislik, finans, tasarım ve operasyon için tek çatı altında dev kurumsal paket.',
        color: '#ec4899',
      },
      {
        id: 't6',
        period: '2027 Hedefi',
        title: '100 Otonom İstemci-Taraflı Kurumsal Stüdyo',
        metricBadge: 'Global Liderlik',
        description: 'WebGPU destekli yerel LLM ajanlarıyla tam otonom iş istasyonu.',
        color: '#f43f5e',
      },
    ],
    steps: [
      {
        id: 'p1',
        stepNo: 'ADIM 01',
        title: 'Yerel Veri Yükleme & Şema Algılama',
        latencyOrSla: '0.8 ms • RAM İçi',
        detail: 'Dosyalarınız veya iş verileriniz ağa çıkmadan doğrudan tarayıcı belleğinde (ArrayBuffer) ayrıştırılır.',
        color: '#8b5cf6',
      },
      {
        id: 'p2',
        stepNo: 'ADIM 02',
        title: 'Kriptografik & Matematiksel Hesaplama Motoru',
        latencyOrSla: '3.2 ms • WebCrypto',
        detail: 'NPV/IRR, LCS Diff, VERBİS analizi veya 5×5 siber risk algoritmaları sıfır gecikmeyle çalıştırılır.',
        color: '#06b6d4',
      },
      {
        id: 'p3',
        stepNo: 'ADIM 03',
        title: 'Canlı 4K (1920×1080) Vektör & Canvas Sentezi',
        latencyOrSla: '6.5 ms • 60 FPS GPU',
        detail: 'Tüm grafikler, tablolar ve KPI kartları sunum kalitesinde yüksek çözünürlüklü tuvale çizilir.',
        color: '#10b981',
      },
      {
        id: 'p4',
        stepNo: 'ADIM 04',
        title: 'Çoklu Formatta Anında Kurumsal Dışa Aktarım',
        latencyOrSla: 'Anında İndirme',
        detail: '4K PNG, Vektörel SVG, Çok Sayfalı Excel (.XLSX), SQL/Prisma veya Markdown olarak cihazınıza kaydedilir.',
        color: '#f59e0b',
      },
    ],
    bottomCallout:
      'SONUÇ: Corpus Suite PRO mimarisi, geleneksel bulut SaaS çözümlerine kıyasla yıllık %88 maliyet tasarrufu ve %100 veri mahremiyeti sağlar.',
  },
};

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

export function renderInfographicCanvas(
  canvas: HTMLCanvasElement,
  project: InfographicProject
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
    INFO_THEMES.find((t) => t.id === project.themeId) || INFO_THEMES[0];

  // 1. Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.bgStart);
  bg.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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

  // 2. Top Header Banner
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 44, 28, W - 88, 96, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  drawRoundedBox(ctx, 64, 48, 6, 56, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText(project.title.slice(0, 74), 86, 70);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillText(project.subtitle, 86, 98);

  // 3. Layout-Specific Rendering
  if (project.layout === 'battlecard') {
    // Column Header Cards
    const tableX = 44;
    const tableY = 144;
    const tableW = W - 88;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.border;
    drawRoundedBox(ctx, tableX, tableY, tableW, 74, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('KARŞILAŞTIRMA KRİTERİ & KATEGORİ', 74, tableY + 44);

    // Highlighted Our Brand Column Header
    ctx.fillStyle = theme.accent + '28';
    ctx.strokeStyle = theme.accent;
    drawRoundedBox(ctx, 600, tableY + 10, 440, 54, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(`🏆 ${project.brandName}`, 624, tableY + 43);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(project.compAName, 1075, tableY + 43);
    ctx.fillText(project.compBName, 1485, tableY + 43);

    // Rows
    project.rows.slice(0, 6).forEach((row, idx) => {
      const ry = 232 + idx * 114;
      ctx.fillStyle = theme.cardBg;
      ctx.strokeStyle = theme.border;
      drawRoundedBox(ctx, tableX, ry, tableW, 100, 14);
      ctx.fill();
      ctx.stroke();

      // Category pill
      ctx.fillStyle = theme.secondary + '22';
      drawRoundedBox(ctx, 72, ry + 18, 120, 22, 6);
      ctx.fill();
      ctx.fillStyle = theme.secondary;
      ctx.font = 'bold 10.5px monospace';
      ctx.fillText(row.category, 82, ry + 33);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(row.feature.slice(0, 38), 72, ry + 66);

      // Our Value Highlight Box
      ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.strokeStyle = '#10b981';
      drawRoundedBox(ctx, 600, ry + 14, 440, 72, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(row.ourValue.slice(0, 42), 620, ry + 55);

      // Competitor A
      ctx.fillStyle = '#f87171';
      ctx.font = '500 13.5px Inter, sans-serif';
      ctx.fillText(row.compAValue.slice(0, 36), 1075, ry + 55);

      // Competitor B
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13.5px Inter, sans-serif';
      ctx.fillText(row.compBValue.slice(0, 36), 1485, ry + 55);
    });
  } else if (project.layout === 'timeline') {
    // Central Horizontal Spine
    const spineY = 520;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, spineY);
    ctx.lineTo(W - 100, spineY);
    ctx.stroke();

    project.timeline.slice(0, 6).forEach((node, idx) => {
      const isTop = idx % 2 === 0;
      const cx = 190 + idx * 305;
      const cardW = 280;
      const cardH = 250;
      const cardX = cx - cardW / 2;
      const cardY = isTop ? spineY - cardH - 55 : spineY + 55;

      // Connector stem
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, spineY);
      ctx.lineTo(cx, isTop ? cardY + cardH : cardY);
      ctx.stroke();

      // Node circle on spine
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, spineY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Card
      ctx.fillStyle = theme.cardBg;
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      drawRoundedBox(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = node.color;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${node.period}  •  ${node.metricBadge}`, cardX + 20, cardY + 34);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(node.title.slice(0, 26), cardX + 20, cardY + 68);
      if (node.title.length > 26) {
        ctx.fillText(node.title.slice(26, 52), cardX + 20, cardY + 90);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 12.5px Inter, sans-serif';
      ctx.fillText(node.description.slice(0, 32), cardX + 20, cardY + 135);
      ctx.fillText(node.description.slice(32, 64), cardX + 20, cardY + 158);
      ctx.fillText(node.description.slice(64, 96), cardX + 20, cardY + 181);
    });
  } else {
    // 4-Step Process Architecture Cards
    project.steps.slice(0, 4).forEach((st, idx) => {
      const sx = 44 + idx * 462;
      const sy = 170;
      const sw = 438;
      const sh = 720;

      ctx.fillStyle = theme.cardBg;
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 2;
      drawRoundedBox(ctx, sx, sy, sw, sh, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = st.color + '24';
      drawRoundedBox(ctx, sx + 28, sy + 28, 130, 38, 10);
      ctx.fill();

      ctx.fillStyle = st.color;
      ctx.font = 'bold 15px monospace';
      ctx.fillText(st.stepNo, sx + 48, sy + 52);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 22px Inter, sans-serif';
      ctx.fillText(st.title.slice(0, 24), sx + 28, sy + 115);
      if (st.title.length > 24) {
        ctx.fillText(st.title.slice(24, 48), sx + 28, sy + 145);
      }

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`⚡ ${st.latencyOrSla}`, sx + 28, sy + 200);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 14.5px Inter, sans-serif';
      const chunks = [
        st.detail.slice(0, 38),
        st.detail.slice(38, 76),
        st.detail.slice(76, 114),
        st.detail.slice(114, 152),
      ];
      chunks.forEach((c, ci) => {
        if (c) ctx.fillText(c, sx + 28, sy + 260 + ci * 30);
      });
    });
  }

  // Bottom Callout Banner
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 44, 932, W - 88, 92, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText(`💡 ${project.bottomCallout}`, 76, 984);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS INFOGRAPHIC, TIMELINE & COMPARISON CARD STUDIO (#033 PRO)  •  4K EXECUTIVE DECK',
    44,
    H - 18
  );
}
