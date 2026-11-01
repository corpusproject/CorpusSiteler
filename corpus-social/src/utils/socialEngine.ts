export type SocialPlatformId =
  | 'og-card'
  | 'youtube-4k'
  | 'insta-post'
  | 'story-reel'
  | 'linkedin-cover'
  | 'x-header';

export type SocialLayoutStyle =
  | 'split-mockup'
  | 'center-hero'
  | 'metrics-spotlight'
  | 'terminal-code';

export type PatternOverlay = 'dots' | 'grid' | 'rings' | 'none';

export interface PlatformSpec {
  id: SocialPlatformId;
  name: string;
  width: number;
  height: number;
  ratioLabel: string;
  desc: string;
}

export interface SocialStatItem {
  id: string;
  label: string;
  value: string;
}

export interface SocialBannerProject {
  id: string;
  platformId: SocialPlatformId;
  layoutStyle: SocialLayoutStyle;
  themeId: string;
  pattern: PatternOverlay;
  badgeText: string;
  headline: string;
  highlightWord: string;
  subheadline: string;
  ctaText: string;
  domainUrl: string;
  authorName: string;
  authorRole: string;
  codeSnippet: string;
  showBrowserMockup: boolean;
  showWatermark: boolean;
  stats: SocialStatItem[];
}

export interface SocialTheme {
  id: string;
  name: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  secondary: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
}

export const PLATFORM_SPECS: PlatformSpec[] = [
  {
    id: 'og-card',
    name: 'OpenGraph / LinkedIn / X Kartı',
    width: 1200,
    height: 630,
    ratioLabel: '1.91:1 (1200×630)',
    desc: 'Web siteleri (og:image), LinkedIn ve X bağlantı paylaşımları için evrensel standart.',
  },
  {
    id: 'youtube-4k',
    name: 'YouTube & Lansman Sunumu (Full HD)',
    width: 1920,
    height: 1080,
    ratioLabel: '16:9 (1920×1080)',
    desc: 'YouTube video kapağı, Product Hunt vitrini ve geniş ekran lansman görseli.',
  },
  {
    id: 'insta-post',
    name: 'Instagram & LinkedIn Kare Karusel',
    width: 1080,
    height: 1080,
    ratioLabel: '1:1 (1080×1080)',
    desc: 'Sosyal medya akış gönderileri ve teknik karusel slaytları için kare format.',
  },
  {
    id: 'story-reel',
    name: 'Instagram Story / Reels / Shorts',
    width: 1080,
    height: 1920,
    ratioLabel: '9:16 (1080×1920)',
    desc: 'Mobil tam ekran dikey hikaye ve kısa video kapak tasarımı.',
  },
  {
    id: 'x-header',
    name: 'X (Twitter) Profil Kapak Banner',
    width: 1500,
    height: 500,
    ratioLabel: '3:1 (1500×500)',
    desc: 'Kurumsal ve geliştirici X profilleri için panoramik üst kapak.',
  },
  {
    id: 'linkedin-cover',
    name: 'LinkedIn Kurumsal Kapak Banner',
    width: 1584,
    height: 396,
    ratioLabel: '4:1 (1584×396)',
    desc: 'LinkedIn kişisel ve şirket sayfaları için ultra geniş profesyonel kapak.',
  },
];

export const SOCIAL_THEMES: SocialTheme[] = [
  {
    id: 'aurora-violet',
    name: 'Aurora Violet',
    bgStart: '#09090b',
    bgMid: '#1e1b4b',
    bgEnd: '#0f172a',
    accent: '#a855f7',
    secondary: '#38bdf8',
    cardBg: 'rgba(15, 23, 42, 0.88)',
    cardBorder: 'rgba(168, 85, 247, 0.45)',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
  },
  {
    id: 'cyber-emerald',
    name: 'Cyber Emerald',
    bgStart: '#04120c',
    bgMid: '#062c1e',
    bgEnd: '#090d16',
    accent: '#10b981',
    secondary: '#06b6d4',
    cardBg: 'rgba(6, 28, 20, 0.88)',
    cardBorder: 'rgba(16, 185, 129, 0.45)',
    textPrimary: '#ecfdf5',
    textSecondary: '#94a3b8',
  },
  {
    id: 'sunset-launch',
    name: 'Sunset Product Hunt',
    bgStart: '#18090d',
    bgMid: '#3b0d1e',
    bgEnd: '#111827',
    accent: '#f97316',
    secondary: '#f43f5e',
    cardBg: 'rgba(24, 15, 22, 0.90)',
    cardBorder: 'rgba(249, 115, 22, 0.45)',
    textPrimary: '#fff7ed',
    textSecondary: '#fed7aa',
  },
  {
    id: 'sapphire-cloud',
    name: 'Sapphire Cloud',
    bgStart: '#030712',
    bgMid: '#0c2442',
    bgEnd: '#090d16',
    accent: '#38bdf8',
    secondary: '#6366f1',
    cardBg: 'rgba(15, 23, 42, 0.90)',
    cardBorder: 'rgba(56, 189, 248, 0.45)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
  },
];

export const SOCIAL_PRESETS: Record<string, SocialBannerProject> = {
  'saas-launch-og': {
    id: 'saas-launch-og',
    platformId: 'og-card',
    layoutStyle: 'split-mockup',
    themeId: 'aurora-violet',
    pattern: 'grid',
    badgeText: '🚀 YENİ SÜRÜM v4.0 YAYINDA',
    headline: 'Sıfır Sunucu Mimarisiyle 10 Kat Hızlı Kurumsal SaaS Stüdyosu',
    highlightWord: '10 Kat Hızlı',
    subheadline:
      'Verilerinizi hiçbir bulut sunucusuna göndermeden, tamamen tarayıcı içinde WebAssembly ve 4K Canvas gücüyle işleyin.',
    ctaText: 'Ücretsiz Stüdyoyu Başlat →',
    domainUrl: 'corpus.suite/enterprise',
    authorName: 'Corpus Engineering',
    authorRole: 'Zero-Server Cloud Architecture',
    codeSnippet: `const engine = await CorpusStudio.init({
  mode: 'zero-server-wasm',
  encryption: 'AES-256-GCM',
  renderTarget: '4K-UltraHD'
});`,
    showBrowserMockup: true,
    showWatermark: true,
    stats: [
      { id: 'st1', label: 'İSTEMCİ HIZI', value: '< 12ms' },
      { id: 'st2', label: 'SUNUCU MALİYETİ', value: '$0 / Ay' },
      { id: 'st3', label: 'VERİ GİZLİLİĞİ', value: '%100 Yerel' },
    ],
  },
  'fintech-case-study': {
    id: 'fintech-case-study',
    platformId: 'youtube-4k',
    layoutStyle: 'metrics-spotlight',
    themeId: 'cyber-emerald',
    pattern: 'rings',
    badgeText: '📈 MÜHENDİSLİK VAKA ANALİZİ',
    headline: 'Saniyede 100.000 Ödeme İşlemini Sıfır Kesintiyle Nasıl Ölçekledik?',
    highlightWord: '100.000 Ödeme',
    subheadline:
      'Çift kayıtlı muhasebe defteri, Rust tabanlı mikroservisler ve gerçek zamanlı anomali tespiti mimarimiz.',
    ctaText: 'Mimari Raporu Oku →',
    domainUrl: 'tech.novapay.io/architecture',
    authorName: 'Kaan Demir',
    authorRole: 'Principal Systems Architect',
    codeSnippet: `SELECT account_id, SUM(credit - debit) AS balance
FROM ledger_entries
WHERE tx_status = 'SETTLED'
GROUP BY account_id;`,
    showBrowserMockup: true,
    showWatermark: true,
    stats: [
      { id: 'st1', label: 'PEAK THROUGHPUT', value: '104.200 TPS' },
      { id: 'st2', label: 'P99 GECİKME', value: '8.4 ms' },
      { id: 'st3', label: 'YILLIK UPTIME', value: '%99.999' },
    ],
  },
  'ai-developer-post': {
    id: 'ai-developer-post',
    platformId: 'insta-post',
    layoutStyle: 'terminal-code',
    themeId: 'sunset-launch',
    pattern: 'dots',
    badgeText: '🧠 YAPAY ZEKA & RAG REHBERİ',
    headline: 'Kurumsal Dokümanlarda %99 Doğrulukla Hibrit Vektör Arama',
    highlightWord: '%99 Doğrulukla',
    subheadline:
      'Dense Embeddings + BM25 Reranker kombinasyonu ile LLM halüsinasyonlarını tamamen sıfırlayın.',
    ctaText: 'GitHub Deposunu İncele',
    domainUrl: 'github.com/corpus-ai/rag-engine',
    authorName: 'Selin Yılmaz',
    authorRole: 'Lead AI Researcher',
    codeSnippet: `const results = await vectorStore.hybridSearch({
  query: "KVKK Madde 12 Veri Güvenliği",
  alpha: 0.75,
  rerankTopK: 15
});`,
    showBrowserMockup: true,
    showWatermark: true,
    stats: [
      { id: 'st1', label: 'DOĞRULUK ARTIŞI', value: '+%38.4' },
      { id: 'st2', label: 'SORGU SÜRESİ', value: '42 ms' },
      { id: 'st3', label: 'KAYNAK ATIFI', value: 'Tam Doğrulama' },
    ],
  },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export function renderSocialCanvas(
  canvas: HTMLCanvasElement,
  project: SocialBannerProject
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const spec =
    PLATFORM_SPECS.find((p) => p.id === project.platformId) || PLATFORM_SPECS[0];
  const theme =
    SOCIAL_THEMES.find((t) => t.id === project.themeId) || SOCIAL_THEMES[0];

  const W = spec.width;
  const H = spec.height;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  // Scale factor relative to 1200 width baseline
  const s = Math.min(W, H * 1.6) / 1000;

  // 1. Multi-stop Atmospheric Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(0.55, theme.bgMid);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Ambient Radial Glows
  const glow1 = ctx.createRadialGradient(
    W * 0.2,
    H * 0.2,
    10,
    W * 0.2,
    H * 0.2,
    W * 0.55
  );
  glow1.addColorStop(0, theme.accent + '35');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(
    W * 0.85,
    H * 0.8,
    10,
    W * 0.85,
    H * 0.8,
    W * 0.5
  );
  glow2.addColorStop(0, theme.secondary + '30');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // 2. Pattern Overlay
  ctx.save();
  if (project.pattern === 'grid') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.lineWidth = 1;
    const step = Math.round(48 * s);
    for (let x = 0; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (project.pattern === 'dots') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const step = Math.round(36 * s);
    for (let x = step; x < W; x += step) {
      for (let y = step; y < H; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (project.pattern === 'rings') {
    ctx.strokeStyle = theme.accent + '18';
    ctx.lineWidth = 1.5;
    for (let r = 120; r < W; r += 140) {
      ctx.beginPath();
      ctx.arc(W * 0.78, H * 0.5, r * s, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Outer Frame Border
  const pad = Math.round(42 * s);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 24 * s);
  ctx.stroke();

  const isWideSplit = W >= H * 1.35 && project.layoutStyle === 'split-mockup';
  const contentLeft = pad + Math.round(42 * s);
  const contentTop = pad + Math.round(44 * s);
  const textColWidth = isWideSplit ? (W - pad * 2) * 0.52 : W - (pad + 42 * s) * 2;

  // 3. Top Pill Badge
  ctx.font = `bold ${Math.round(14 * s)}px Inter, sans-serif`;
  const badgeW = Math.min(
    textColWidth,
    ctx.measureText(project.badgeText).width + 36 * s
  );
  const badgeH = Math.round(34 * s);

  ctx.fillStyle = theme.accent + '24';
  ctx.strokeStyle = theme.accent + '75';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, contentLeft, contentTop, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.textPrimary;
  ctx.fillText(
    project.badgeText,
    contentLeft + 18 * s,
    contentTop + Math.round(22 * s)
  );

  // 4. Main Headline
  const headlineFontPx =
    H > W
      ? Math.round(52 * s)
      : W > H * 2.5
      ? Math.round(34 * s)
      : Math.round(44 * s);
  ctx.font = `800 ${headlineFontPx}px Inter, sans-serif`;
  ctx.fillStyle = theme.textPrimary;

  const afterHeadlineY = wrapCanvasText(
    ctx,
    project.headline,
    contentLeft,
    contentTop + badgeH + headlineFontPx + 16 * s,
    textColWidth,
    headlineFontPx * 1.2,
    W > H * 2.5 ? 2 : 3
  );

  // 5. Subheadline
  const subFontPx = Math.round(18 * s);
  ctx.font = `500 ${subFontPx}px Inter, sans-serif`;
  ctx.fillStyle = theme.textSecondary;

  const afterSubY = wrapCanvasText(
    ctx,
    project.subheadline,
    contentLeft,
    afterHeadlineY + 8 * s,
    textColWidth,
    subFontPx * 1.45,
    W > H * 2.5 ? 2 : 3
  );

  // 6. KPI Stat Cards Row
  const statCardW = Math.floor((textColWidth - 24 * s) / 3);
  const statCardH = Math.round(74 * s);
  const statY = afterSubY + Math.round(14 * s);

  if (statY + statCardH < H - pad - 80 * s) {
    project.stats.slice(0, 3).forEach((st, idx) => {
      const sx = contentLeft + idx * (statCardW + 12 * s);
      ctx.fillStyle = theme.cardBg;
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1.2;
      drawRoundedRect(ctx, sx, statY, statCardW, statCardH, 12 * s);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.textSecondary;
      ctx.font = `bold ${Math.round(10.5 * s)}px Inter, sans-serif`;
      ctx.fillText(st.label, sx + 14 * s, statY + 24 * s);

      ctx.fillStyle = idx === 0 ? theme.accent : theme.secondary;
      ctx.font = `800 ${Math.round(21 * s)}px Inter, sans-serif`;
      ctx.fillText(st.value, sx + 14 * s, statY + 54 * s);
    });
  }

  // 7. Right Side 3D Code / Mockup Window (when wide or vertical bottom)
  if (project.showBrowserMockup && isWideSplit) {
    const mockX = contentLeft + textColWidth + 32 * s;
    const mockW = W - mockX - pad - 36 * s;
    const mockH = H - pad * 2 - 88 * s;
    const mockY = contentTop;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 35 * s;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.94)';
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, mockX, mockY, mockW, mockH, 18 * s);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Traffic Lights Bar
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(mockX + 24 * s, mockY + 24 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(mockX + 44 * s, mockY + 24 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(mockX + 64 * s, mockY + 24 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.textSecondary;
    ctx.font = `500 ${Math.round(12 * s)}px monospace`;
    ctx.fillText(project.domainUrl, mockX + 92 * s, mockY + 28 * s);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(mockX, mockY + 46 * s);
    ctx.lineTo(mockX + mockW, mockY + 46 * s);
    ctx.stroke();

    // Code Snippet Lines
    const codeLines = project.codeSnippet.split('\n');
    ctx.font = `600 ${Math.round(14 * s)}px monospace`;
    codeLines.slice(0, 8).forEach((ln, idx) => {
      ctx.fillStyle = idx === 0 ? theme.accent : '#e2e8f0';
      ctx.fillText(
        ln.slice(0, 44),
        mockX + 24 * s,
        mockY + 84 * s + idx * 28 * s
      );
    });

    // Bottom CTA inside Mockup
    const btnH = Math.round(44 * s);
    const btnY = mockY + mockH - btnH - 22 * s;
    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, mockX + 24 * s, btnY, mockW - 48 * s, btnH, 10 * s);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(14.5 * s)}px Inter, sans-serif`;
    ctx.fillText(project.ctaText, mockX + 44 * s, btnY + 28 * s);

    ctx.restore();
  }

  // 8. Bottom Author & Domain Bar
  const footerY = H - pad - Math.round(28 * s);
  ctx.fillStyle = theme.textPrimary;
  ctx.font = `bold ${Math.round(15 * s)}px Inter, sans-serif`;
  ctx.fillText(
    `${project.authorName}  •  ${project.authorRole}`,
    contentLeft,
    footerY
  );

  if (project.showWatermark) {
    ctx.fillStyle = theme.secondary;
    ctx.font = `bold ${Math.round(14 * s)}px monospace`;
    const urlW = ctx.measureText(project.domainUrl).width;
    ctx.fillText(
      project.domainUrl,
      W - pad - 42 * s - urlW,
      footerY
    );
  }
}

export function generateOpenGraphMetaTags(project: SocialBannerProject): string {
  const spec =
    PLATFORM_SPECS.find((p) => p.id === project.platformId) || PLATFORM_SPECS[0];
  const fullImageUrl = `https://${project.domainUrl.replace(/^https?:\/\//, '')}/og-banner.png`;

  return `<!-- Primary Meta Tags -->
<title>${project.headline}</title>
<meta name="title" content="${project.headline}" />
<meta name="description" content="${project.subheadline}" />

<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://${project.domainUrl}" />
<meta property="og:title" content="${project.headline}" />
<meta property="og:description" content="${project.subheadline}" />
<meta property="og:image" content="${fullImageUrl}" />
<meta property="og:image:width" content="${spec.width}" />
<meta property="og:image:height" content="${spec.height}" />

<!-- X (Twitter) Card -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:title" content="${project.headline}" />
<meta property="twitter:description" content="${project.subheadline}" />
<meta property="twitter:image" content="${fullImageUrl}" />`;
}
