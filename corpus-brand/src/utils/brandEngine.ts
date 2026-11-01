export interface BrandPalette {
  id: string;
  brandName: string;
  tagline: string;
  fontHeading: string;
  fontBody: string;
  primary: string;
  secondary: string;
  accent: string;
  surfaceDark: string;
  textLight: string;
}

export interface ShadeStop {
  step: number;
  hex: string;
}

export interface ContrastAudit {
  pairName: string;
  fg: string;
  bg: string;
  ratio: number;
  aaNormal: boolean;
  aaaNormal: boolean;
  badge: 'AAA Kusursuz' | 'AA Uyumlu' | 'Düşük Kontrast';
}

export const PRESET_BRAND_SYSTEMS: Record<string, { name: string; build: () => BrandPalette }> = {
  'corpus-violet': {
    name: 'Corpus Hyper Violet',
    build: () => ({
      id: 'corpus-violet',
      brandName: 'CORPUS STUDIO',
      tagline: 'Zero-Knowledge Enterprise Design System v3.0',
      fontHeading: 'Inter Bold',
      fontBody: 'JetBrains Mono',
      primary: '#7c3aed',
      secondary: '#06b6d4',
      accent: '#10b981',
      surfaceDark: '#0b0b12',
      textLight: '#f8fafc',
    }),
  },
  'fintech-indigo': {
    name: 'FinTech Kurumsal İndigo',
    build: () => ({
      id: 'fintech-indigo',
      brandName: 'NOVAPAY GLOBAL',
      tagline: 'Next-Gen Banking & Treasury Identity',
      fontHeading: 'Plus Jakarta Sans',
      fontBody: 'Inter',
      primary: '#2563eb',
      secondary: '#4f46e5',
      accent: '#f59e0b',
      surfaceDark: '#090d16',
      textLight: '#f1f5f9',
    }),
  },
  'emerald-bio': {
    name: 'Zümrüt Sürdürülebilirlik',
    build: () => ({
      id: 'emerald-bio',
      brandName: 'VERDE ENERJİ A.Ş.',
      tagline: 'CleanTech & Carbon Neutral Brand Guidelines',
      fontHeading: 'Space Grotesk',
      fontBody: 'Inter',
      primary: '#059669',
      secondary: '#0d9488',
      accent: '#eab308',
      surfaceDark: '#07120e',
      textLight: '#ecfdf5',
    }),
  },
  'crimson-luxury': {
    name: 'Yakut & Kehribar Lüks',
    build: () => ({
      id: 'crimson-luxury',
      brandName: 'ATELIER VANGUARD',
      tagline: 'Executive Editorial & Luxury Retail System',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      primary: '#e11d48',
      secondary: '#d97706',
      accent: '#8b5cf6',
      surfaceDark: '#12090d',
      textLight: '#fff1f2',
    }),
  },
};

export const DEFAULT_BRAND_PALETTE: BrandPalette =
  PRESET_BRAND_SYSTEMS['corpus-violet'].build();

/** Parse #RRGGBB into [r, g, b] (0..255) */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  if (isNaN(num)) return [124, 58, 237];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Generate 50..900 shade scale from a base hex color */
export function generateShadeScale(baseHex: string): ShadeStop[] {
  const [r, g, b] = hexToRgb(baseHex);
  const steps: { step: number; mixWhite?: number; mixBlack?: number }[] = [
    { step: 50, mixWhite: 0.88 },
    { step: 100, mixWhite: 0.76 },
    { step: 200, mixWhite: 0.58 },
    { step: 300, mixWhite: 0.38 },
    { step: 400, mixWhite: 0.18 },
    { step: 500 },
    { step: 600, mixBlack: 0.16 },
    { step: 700, mixBlack: 0.32 },
    { step: 800, mixBlack: 0.48 },
    { step: 900, mixBlack: 0.64 },
  ];

  return steps.map((s) => {
    if (s.mixWhite) {
      const k = s.mixWhite;
      return {
        step: s.step,
        hex: rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k),
      };
    }
    if (s.mixBlack) {
      const k = 1 - s.mixBlack;
      return {
        step: s.step,
        hex: rgbToHex(r * k, g * k, b * k),
      };
    }
    return { step: 500, hex: baseHex };
  });
}

/** Compute WCAG 2.1 relative luminance and contrast ratio */
function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 100) / 100;
}

export function auditBrandContrast(palette: BrandPalette): ContrastAudit[] {
  const pairs = [
    {
      pairName: 'Ana Metin / Koyu Zemin',
      fg: palette.textLight,
      bg: palette.surfaceDark,
    },
    {
      pairName: 'Beyaz Metin / Ana Marka Butonu',
      fg: '#ffffff',
      bg: palette.primary,
    },
    {
      pairName: 'İkincil Vurgu / Koyu Zemin',
      fg: palette.secondary,
      bg: palette.surfaceDark,
    },
    {
      pairName: 'Onay Vurgusu / Koyu Zemin',
      fg: palette.accent,
      bg: palette.surfaceDark,
    },
  ];

  return pairs.map((p) => {
    const ratio = getContrastRatio(p.fg, p.bg);
    const aaNormal = ratio >= 4.5;
    const aaaNormal = ratio >= 7.0;
    const badge = aaaNormal
      ? 'AAA Kusursuz'
      : aaNormal
      ? 'AA Uyumlu'
      : 'Düşük Kontrast';
    return { ...p, ratio, aaNormal, aaaNormal, badge };
  });
}

/** Generate CSS Variables, Tailwind v4 @theme, or Figma Tokens JSON */
export function generateDesignTokensCode(
  palette: BrandPalette,
  format: 'css' | 'tailwind' | 'figma'
): string {
  const primaryShades = generateShadeScale(palette.primary);

  if (format === 'css') {
    const shadeVars = primaryShades
      .map((s) => `  --brand-primary-${s.step}: ${s.hex};`)
      .join('\n');
    return `:root {\n  --brand-primary: ${palette.primary};\n  --brand-secondary: ${palette.secondary};\n  --brand-accent: ${palette.accent};\n  --brand-surface-dark: ${palette.surfaceDark};\n  --brand-text-light: ${palette.textLight};\n${shadeVars}\n}`;
  }

  if (format === 'tailwind') {
    const shadeLines = primaryShades
      .map((s) => `  --color-primary-${s.step}: ${s.hex};`)
      .join('\n');
    return `@import "tailwindcss";\n\n@theme {\n  --color-primary: ${palette.primary};\n  --color-secondary: ${palette.secondary};\n  --color-accent: ${palette.accent};\n  --color-surface: ${palette.surfaceDark};\n${shadeLines}\n}`;
  }

  // Figma Tokens JSON
  const tokenObj = {
    brand: {
      name: palette.brandName,
      colors: {
        primary: { value: palette.primary, type: 'color' },
        secondary: { value: palette.secondary, type: 'color' },
        accent: { value: palette.accent, type: 'color' },
        surfaceDark: { value: palette.surfaceDark, type: 'color' },
        textLight: { value: palette.textLight, type: 'color' },
      },
      primaryScale: Object.fromEntries(
        primaryShades.map((s) => [s.step, { value: s.hex, type: 'color' }])
      ),
    },
  };
  return JSON.stringify(tokenObj, null, 2);
}

/** Render 4K Brand Identity Book & Live UI Kit Preview onto HTML5 Canvas */
export function renderBrandBookToCanvas(
  canvas: HTMLCanvasElement,
  palette: BrandPalette
): void {
  const width = 1440;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = palette.surfaceDark;
  ctx.fillRect(0, 0, width, height);

  // Top Header Strip
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, width, 92);
  ctx.fillStyle = palette.primary;
  ctx.fillRect(0, 88, width, 4);

  ctx.fillStyle = palette.textLight;
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.fillText(`${palette.brandName} — KURUMSAL MARKA KİMLİĞİ & RENK KİTABI`, 40, 42);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(
    `${palette.tagline}   •   Tipografi: ${palette.fontHeading} / ${palette.fontBody}   •   Corpus Brand Studio (#018)`,
    40,
    68
  );

  // Section 1: 5 Core Brand Color Swatches
  const swatches = [
    { name: 'Primary Brand', hex: palette.primary },
    { name: 'Secondary Glow', hex: palette.secondary },
    { name: 'Accent Action', hex: palette.accent },
    { name: 'Surface Dark', hex: palette.surfaceDark },
    { name: 'Light Foreground', hex: palette.textLight },
  ];

  const swW = (width - 80 - 64) / 5;
  const swH = 165;
  const swY = 120;

  swatches.forEach((sw, i) => {
    const sx = 40 + i * (swW + 16);
    ctx.fillStyle = '#151520';
    ctx.strokeStyle = '#272736';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(sx, swY, swW, swH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sw.hex;
    ctx.beginPath();
    ctx.roundRect(sx + 10, swY + 10, swW - 20, 96, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(sw.name, sx + 14, swY + 130);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.fillText(sw.hex.toUpperCase(), sx + 14, swY + 152);
  });

  // Section 2: Primary 50..900 Shade Ramp
  const shades = generateShadeScale(palette.primary);
  const rampY = 315;
  ctx.fillStyle = palette.textLight;
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('Otomatik 50–900 Renk Tonu Skalası (Primary Shade Ramp)', 40, rampY);

  const cellW = (width - 80) / 10;
  shades.forEach((sh, idx) => {
    const cx = 40 + idx * cellW;
    const cy = rampY + 18;
    ctx.fillStyle = sh.hex;
    ctx.beginPath();
    ctx.roundRect(cx + 3, cy, cellW - 6, 82, 10);
    ctx.fill();

    ctx.fillStyle = idx < 5 ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText(String(sh.step), cx + 14, cy + 28);
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(sh.hex.toUpperCase(), cx + 14, cy + 66);
  });

  // Section 3: Bottom Split — Left Live SaaS UI Kit Preview + Right WCAG Accessibility Audit
  const botY = 445;
  const botH = 415;
  const leftW = 820;

  ctx.fillStyle = '#14141e';
  ctx.strokeStyle = '#272736';
  ctx.beginPath();
  ctx.roundRect(40, botY, leftW, botH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.textLight;
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('Canlı Arayüz & Bileşen Önizlemesi (Live UI Component Kit)', 66, botY + 36);

  // Mock Hero Card inside Left Box
  ctx.fillStyle = palette.surfaceDark;
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(66, botY + 58, leftW - 52, 195, 14);
  ctx.fill();
  ctx.stroke();

  // Badge pill
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.roundRect(92, botY + 82, 190, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 11px JetBrains Mono, monospace';
  ctx.fillText('● DESIGN SYSTEM 3.0', 108, botY + 100);

  ctx.fillStyle = palette.textLight;
  ctx.font = 'bold 26px Inter, sans-serif';
  ctx.fillText(`${palette.brandName} Kurumsal Bulut Platformu`, 92, botY + 145);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText(palette.tagline, 92, botY + 174);

  // Primary & Secondary Buttons inside Mock UI
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.roundRect(92, botY + 194, 185, 42, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText('Hemen Başlayın →', 122, botY + 220);

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(292, botY + 194, 175, 42, 10);
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.fillText('Dokümantasyon', 326, botY + 220);

  // 3 Mini Metric Pills below Hero
  [
    { t: 'AKTİF KULLANICI', v: '148.920', c: palette.primary },
    { t: 'ERİŞİLEBİLİRLİK', v: 'WCAG AAA', c: palette.accent },
    { t: 'TASARIM TOKEN', v: '42 Değişken', c: palette.secondary },
  ].forEach((m, i) => {
    const mx = 66 + i * 260;
    const my = botY + 274;
    ctx.fillStyle = '#1b1b28';
    ctx.beginPath();
    ctx.roundRect(mx, my, 246, 114, 12);
    ctx.fill();

    ctx.fillStyle = m.c;
    ctx.fillRect(mx, my, 246, 4);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(m.t, mx + 18, my + 34);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px JetBrains Mono, monospace';
    ctx.fillText(m.v, mx + 18, my + 76);
  });

  // Right Box: WCAG 2.1 Contrast Audit Card
  const rightX = 40 + leftW + 20;
  const rightW = width - rightX - 40;

  ctx.fillStyle = '#14141e';
  ctx.strokeStyle = '#272736';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rightX, botY, rightW, botH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.textLight;
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('WCAG 2.1 Kontrast & Erişilebilirlik', rightX + 24, botY + 36);

  const audits = auditBrandContrast(palette);
  audits.forEach((au, idx) => {
    const ay = botY + 64 + idx * 82;
    ctx.fillStyle = '#1b1b28';
    ctx.beginPath();
    ctx.roundRect(rightX + 20, ay, rightW - 40, 68, 12);
    ctx.fill();

    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText(au.pairName, rightX + 36, ay + 28);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText(`${au.fg} / ${au.bg}`, rightX + 36, ay + 50);

    ctx.fillStyle = au.aaNormal ? '#10b981' : '#f59e0b';
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${au.ratio}:1 (${au.badge})`, rightX + rightW - 36, ay + 40);
    ctx.textAlign = 'left';
  });
}

export function exportBrandBookPng(canvas: HTMLCanvasElement, brandName: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'corpus-brand'}-4k-guide.png`;
  a.click();
}
