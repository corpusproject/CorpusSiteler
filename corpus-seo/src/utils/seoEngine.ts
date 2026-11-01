export type SchemaType = 'SoftwareApplication' | 'Product' | 'Article' | 'Organization';

export interface SeoConfig {
  id: string;
  siteName: string;
  pageUrl: string;
  targetKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogHeadline: string;
  ogSubheadline: string;
  ogBadge: string;
  authorOrBrand: string;
  themeColor: string;
  secondaryColor: string;
  schemaType: SchemaType;
  priceAmount: string;
  priceCurrency: string;
  ratingValue: string;
  ratingCount: string;
  allowAllBots: boolean;
  sitemapUrls: string[];
}

export interface SeoAuditCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export const PRESET_SEO_CONFIGS: Record<string, { name: string; build: () => SeoConfig }> = {
  saas: {
    name: 'SaaS Ürün Lansmanı',
    build: () => ({
      id: 'saas',
      siteName: 'Corpus Cloud Studio',
      pageUrl: 'https://corpus.studio/tr/zero-knowledge-bulut',
      targetKeyword: 'zero-knowledge bulut',
      metaTitle: 'Corpus Cloud — Kurumsal Zero-Knowledge Bulut & Şifreleme Stüdyosu',
      metaDescription:
        'Verilerinizi sunucuya göndermeden tarayıcı içinde uçtan uca şifreleyin. Kurumsal zero-knowledge bulut mimarisi, 4K raporlama ve KVKK uyumlu veri güvenliği.',
      ogHeadline: 'Zero-Knowledge Kurumsal Bulut Stüdyosu',
      ogSubheadline: '%100 Tarayıcı İçi AES-256 Şifreleme • Sıfır Sunucu Maliyeti',
      ogBadge: 'CORPUS CLOUD v3.0',
      authorOrBrand: 'Corpus Teknoloji A.Ş.',
      themeColor: '#7c3aed',
      secondaryColor: '#06b6d4',
      schemaType: 'SoftwareApplication',
      priceAmount: '0.00',
      priceCurrency: 'TRY',
      ratingValue: '4.9',
      ratingCount: '1420',
      allowAllBots: true,
      sitemapUrls: [
        'https://corpus.studio/',
        'https://corpus.studio/tr/zero-knowledge-bulut',
        'https://corpus.studio/tr/fiyatlandirma',
        'https://corpus.studio/tr/dokumantasyon',
      ],
    }),
  },
  ecommerce: {
    name: 'E-Ticaret Ürün Sayfası',
    build: () => ({
      id: 'ecommerce',
      siteName: 'NovaStore Türkiye',
      pageUrl: 'https://novastore.com.tr/urun/pro-kablosuz-kulaklik',
      targetKeyword: 'kablosuz kulaklık',
      metaTitle: 'Nova AirPro ANC Kablosuz Kulaklık — 48 Saat Pil & Kayıpsız Ses',
      metaDescription:
        'Aktif gürültü engelleme (ANC) özellikli Nova AirPro kablosuz kulaklık ile stüdyo kalitesinde ses deneyimi. Aynı gün ücretsiz kargo ve 2 yıl resmi garanti.',
      ogHeadline: 'Nova AirPro ANC Kablosuz Kulaklık',
      ogSubheadline: '48 Saat Pil Ömrü • Aktif Gürültü Engelleme • Ücretsiz Kargo',
      ogBadge: 'YENİ NESİL SES',
      authorOrBrand: 'Nova Elektronik A.Ş.',
      themeColor: '#059669',
      secondaryColor: '#eab308',
      schemaType: 'Product',
      priceAmount: '4299.00',
      priceCurrency: 'TRY',
      ratingValue: '4.8',
      ratingCount: '865',
      allowAllBots: true,
      sitemapUrls: [
        'https://novastore.com.tr/',
        'https://novastore.com.tr/urun/pro-kablosuz-kulaklik',
        'https://novastore.com.tr/kategori/ses-sistemleri',
      ],
    }),
  },
  article: {
    name: 'Teknik Rehber & Blog',
    build: () => ({
      id: 'article',
      siteName: 'Corpus Mühendislik Blogu',
      pageUrl: 'https://corpus.studio/blog/webcrypto-api-rehberi',
      targetKeyword: 'webcrypto api',
      metaTitle: 'WebCrypto API Rehberi: Tarayıcıda AES-256-GCM Şifreleme Nasıl Yapılır?',
      metaDescription:
        'Modern tarayıcılarda harici kütüphane kullanmadan yerel WebCrypto API ile PBKDF2 anahtar türetme ve AES-256-GCM şifreleme adımlarını örnek kodlarla inceleyin.',
      ogHeadline: 'WebCrypto API & AES-256-GCM Mimarisi',
      ogSubheadline: 'Uçtan Uca Tarayıcı İçi Kriptografi Mühendislik Rehberi',
      ogBadge: 'MÜHENDİSLİK REHBERİ',
      authorOrBrand: 'Ahmet Yılmaz — Baş Mimar',
      themeColor: '#2563eb',
      secondaryColor: '#ec4899',
      schemaType: 'Article',
      priceAmount: '0',
      priceCurrency: 'TRY',
      ratingValue: '5.0',
      ratingCount: '310',
      allowAllBots: true,
      sitemapUrls: [
        'https://corpus.studio/blog',
        'https://corpus.studio/blog/webcrypto-api-rehberi',
      ],
    }),
  },
};

export const DEFAULT_SEO_CONFIG: SeoConfig = PRESET_SEO_CONFIGS.saas.build();

/** Run real-time On-Page SEO & SERP Compliance Audit */
export function auditSeoConfig(cfg: SeoConfig): {
  score: number;
  checks: SeoAuditCheck[];
} {
  const titleLen = cfg.metaTitle.trim().length;
  const descLen = cfg.metaDescription.trim().length;
  const kw = cfg.targetKeyword.trim().toLowerCase();

  const titleLengthOk = titleLen >= 40 && titleLen <= 68;
  const descLengthOk = descLen >= 110 && descLen <= 168;
  const kwInTitle = kw.length > 1 && cfg.metaTitle.toLowerCase().includes(kw);
  const kwInDesc = kw.length > 1 && cfg.metaDescription.toLowerCase().includes(kw);
  const kwInUrl =
    kw.length > 1 &&
    cfg.pageUrl
      .toLowerCase()
      .includes(kw.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  const isHttps = cfg.pageUrl.startsWith('https://');

  const checks: SeoAuditCheck[] = [
    {
      label: `Meta Başlık Uzunluğu (${titleLen} karakter / İdeal: 40–65)`,
      passed: titleLengthOk,
      detail: titleLengthOk
        ? 'Google SERP sonuçlarında kesilmeden tam görünür.'
        : 'Başlık çok kısa veya 65 karakteri aştığı için Google’da "..." ile kesilebilir.',
    },
    {
      label: `Meta Açıklama Uzunluğu (${descLen} karakter / İdeal: 110–160)`,
      passed: descLengthOk,
      detail: descLengthOk
        ? 'Meta açıklama tıklama oranını (CTR) artıracak ideal uzunlukta.'
        : 'Meta açıklamayı 110 ile 160 karakter arasında tutmanız önerilir.',
    },
    {
      label: `Hedef Anahtar Kelime Başlıkta Geçiyor ("${cfg.targetKeyword}")`,
      passed: kwInTitle,
      detail: kwInTitle
        ? 'Odak anahtar kelime meta başlık içinde yer alıyor.'
        : 'Odak anahtar kelimeyi meta başlığa ekleyin.',
    },
    {
      label: 'Hedef Anahtar Kelime Meta Açıklamada Geçiyor',
      passed: kwInDesc,
      detail: kwInDesc
        ? 'Google arama sonuçlarında anahtar kelime kalın (bold) vurgulanır.'
        : 'Odak anahtar kelimeyi meta açıklama metnine dahil edin.',
    },
    {
      label: 'HTTPS Güvenli Kanonik URL & SEO Dostu Slug',
      passed: isHttps && kwInUrl,
      detail:
        isHttps && kwInUrl
          ? 'URL hem HTTPS protokolünde hem de anahtar kelimeyi içeriyor.'
          : 'URL adresinin https:// ile başladığından ve anahtar kelimeyi içerdiğinden emin olun.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    score: Math.round((passedCount / checks.length) * 100),
    checks,
  };
}

/** Generate complete HTML <head> Meta + OpenGraph + Twitter Card snippet */
export function generateHtmlMetaTags(cfg: SeoConfig): string {
  const esc = (s: string) => s.replace(/"/g, '&quot;');
  return [
    '<!-- Primary SEO Meta Tags -->',
    `<title>${esc(cfg.metaTitle)}</title>`,
    `<meta name="title" content="${esc(cfg.metaTitle)}" />`,
    `<meta name="description" content="${esc(cfg.metaDescription)}" />`,
    `<link rel="canonical" href="${esc(cfg.pageUrl)}" />`,
    `<meta name="robots" content="${cfg.allowAllBots ? 'index, follow' : 'noindex, nofollow'}" />`,
    `<meta name="theme-color" content="${cfg.themeColor}" />`,
    '',
    '<!-- Open Graph / Facebook / LinkedIn / WhatsApp -->',
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${esc(cfg.siteName)}" />`,
    `<meta property="og:url" content="${esc(cfg.pageUrl)}" />`,
    `<meta property="og:title" content="${esc(cfg.metaTitle)}" />`,
    `<meta property="og:description" content="${esc(cfg.metaDescription)}" />`,
    `<meta property="og:image" content="${esc(cfg.pageUrl.replace(/\/$/, ''))}/og-image.png" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '',
    '<!-- X (Twitter) Large Summary Card -->',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:url" content="${esc(cfg.pageUrl)}" />`,
    `<meta name="twitter:title" content="${esc(cfg.metaTitle)}" />`,
    `<meta name="twitter:description" content="${esc(cfg.metaDescription)}" />`,
    `<meta name="twitter:image" content="${esc(cfg.pageUrl.replace(/\/$/, ''))}/og-image.png" />`,
  ].join('\n');
}

/** Generate Schema.org JSON-LD Rich Snippet */
export function generateJsonLdSchema(cfg: SeoConfig): string {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': cfg.schemaType,
    name: cfg.metaTitle,
    description: cfg.metaDescription,
    url: cfg.pageUrl,
  };

  if (cfg.schemaType === 'SoftwareApplication' || cfg.schemaType === 'Product') {
    base.brand = { '@type': 'Brand', name: cfg.authorOrBrand };
    base.offers = {
      '@type': 'Offer',
      price: cfg.priceAmount,
      priceCurrency: cfg.priceCurrency,
      availability: 'https://schema.org/InStock',
    };
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: cfg.ratingValue,
      reviewCount: cfg.ratingCount,
    };
  } else if (cfg.schemaType === 'Article') {
    base.headline = cfg.metaTitle;
    base.author = { '@type': 'Person', name: cfg.authorOrBrand };
    base.publisher = { '@type': 'Organization', name: cfg.siteName };
    base.datePublished = new Date().toISOString().split('T')[0];
  }

  return `<script type="application/ld+json">\n${JSON.stringify(
    base,
    null,
    2
  )}\n</script>`;
}

/** Generate robots.txt & sitemap.xml */
export function generateRobotsAndSitemap(cfg: SeoConfig): string {
  const origin = cfg.pageUrl.split('/').slice(0, 3).join('/');
  const robots = [
    '# robots.txt — Corpus SEO Studio (#019)',
    'User-agent: *',
    cfg.allowAllBots ? 'Allow: /' : 'Disallow: /',
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n');

  const today = new Date().toISOString().split('T')[0];
  const urlEntries = cfg.sitemapUrls
    .map(
      (u) =>
        `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

  return `${robots}\n\n<!-- ==================== sitemap.xml ==================== -->\n${sitemap}`;
}

/** Render 1200x630 OpenGraph Social Share Banner onto HTML5 Canvas */
export function renderOgBannerToCanvas(
  canvas: HTMLCanvasElement,
  cfg: SeoConfig
): void {
  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Dark Studio Background
  ctx.fillStyle = '#09090f';
  ctx.fillRect(0, 0, width, height);

  // Diagonal Mesh Glow
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, `${cfg.themeColor}55`);
  grad.addColorStop(0.55, '#09090f');
  grad.addColorStop(1, `${cfg.secondaryColor}44`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Engineering Grid Dots
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let gx = 36; gx < width; gx += 36) {
    for (let gy = 36; gy < height; gy += 36) {
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }

  // Inner Card Frame
  ctx.fillStyle = 'rgba(18, 18, 26, 0.86)';
  ctx.strokeStyle = cfg.themeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(56, 56, width - 112, height - 112, 28);
  ctx.fill();
  ctx.stroke();

  // Top Accent Strip
  ctx.fillStyle = cfg.themeColor;
  ctx.beginPath();
  ctx.roundRect(96, 108, 250, 40, 20);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px JetBrains Mono, monospace';
  ctx.fillText(`● ${cfg.ogBadge.slice(0, 22)}`, 118, 134);

  // Main OG Headline (Wrapped up to 2 lines)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Inter, system-ui, sans-serif';
  const words = cfg.ogHeadline.split(' ');
  let line1 = '';
  let line2 = '';
  words.forEach((w) => {
    if (ctx.measureText(line1 + w).width < 940) {
      line1 += w + ' ';
    } else {
      line2 += w + ' ';
    }
  });
  ctx.fillText(line1.trim(), 96, 235);
  if (line2.trim()) {
    ctx.fillText(line2.trim(), 96, 300);
  }

  // Subheadline
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 25px Inter, system-ui, sans-serif';
  ctx.fillText(cfg.ogSubheadline.slice(0, 68), 96, line2.trim() ? 360 : 305);

  // Bottom Domain & Star Rating Strip
  ctx.fillStyle = '#181824';
  ctx.beginPath();
  ctx.roundRect(96, 445, width - 192, 92, 18);
  ctx.fill();

  ctx.fillStyle = cfg.secondaryColor;
  ctx.font = 'bold 20px JetBrains Mono, monospace';
  ctx.fillText(cfg.pageUrl.replace(/^https?:\/\//, '').slice(0, 46), 126, 498);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText(`★★★★★ ${cfg.ratingValue}/5.0 (${cfg.ratingCount} Değerlendirme)`, width - 126, 498);
  ctx.textAlign = 'left';
}

export function exportOgBannerPng(canvas: HTMLCanvasElement, siteName: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'og-image'}-1200x630.png`;
  a.click();
}
