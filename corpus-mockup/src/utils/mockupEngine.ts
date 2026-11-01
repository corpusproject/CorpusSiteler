export type DeviceFrameType =
  | 'macos-browser'
  | 'macbook-pro'
  | 'iphone-16-pro'
  | 'code-carbon';

export type AspectRatioKey = '16:9' | '4:3' | '1:1' | '9:16';

export interface GradientPreset {
  id: string;
  name: string;
  stops: [string, string, string];
}

export interface MockupConfig {
  deviceFrame: DeviceFrameType;
  aspectRatio: AspectRatioKey;
  gradientId: string;
  customBgStart: string;
  customBgEnd: string;
  padding: number;
  cornerRadius: number;
  shadowIntensity: number;
  tiltAngle: number; // -15 to +15 degrees visual perspective simulation
  glassBorder: boolean;
  showNoiseGrid: boolean;
  browserUrl: string;
  windowDarkTheme: boolean;
  headline: string;
  subheadline: string;
  badgeText: string;
  showBadge: boolean;
  codeTitle: string;
  codeSnippet: string;
  uploadedImageDataUrl: string | null;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'hyper-violet',
    name: 'Corpus Hyper Violet',
    stops: ['#3b0764', '#6d28d9', '#0f172a'],
  },
  {
    id: 'cyber-ocean',
    name: 'Siber Okyanus',
    stops: ['#083344', '#0284c7', '#1e1b4b'],
  },
  {
    id: 'sunset-amber',
    name: 'Kaliforniya Gün Batımı',
    stops: ['#7c2d12', '#db2777', '#311042'],
  },
  {
    id: 'emerald-aurora',
    name: 'Kuzey Işıkları (Zümrüt)',
    stops: ['#064e3b', '#059669', '#0f172a'],
  },
  {
    id: 'noir-titanium',
    name: 'Gece Siyahı & Titanyum',
    stops: ['#09090b', '#27272a', '#18181b'],
  },
  {
    id: 'crimson-velvet',
    name: 'Yakut Kadife',
    stops: ['#450a0a', '#b91c1c', '#111827'],
  },
];

export const ASPECT_RATIOS: Record<
  AspectRatioKey,
  { label: string; width: number; height: number }
> = {
  '16:9': { label: '16:9 (YouTube / Sunum / X)', width: 1600, height: 900 },
  '4:3': { label: '4:3 (ProductHunt / Dribbble)', width: 1440, height: 1080 },
  '1:1': { label: '1:1 (Instagram / LinkedIn Kare)', width: 1200, height: 1200 },
  '9:16': { label: '9:16 (Story / Reels / TikTok)', width: 1080, height: 1920 },
};

export const DEFAULT_MOCKUP_CONFIG: MockupConfig = {
  deviceFrame: 'macos-browser',
  aspectRatio: '16:9',
  gradientId: 'hyper-violet',
  customBgStart: '#4c1d95',
  customBgEnd: '#09090b',
  padding: 84,
  cornerRadius: 22,
  shadowIntensity: 75,
  tiltAngle: 0,
  glassBorder: true,
  showNoiseGrid: true,
  browserUrl: 'https://app.corpus.studio/analytics/realtime',
  windowDarkTheme: true,
  headline: 'Yeni Nesil Sıfır-Bilgi (Zero-Knowledge) Bulut Stüdyosu',
  subheadline: '%100 Tarayıcı İçi Şifreleme • 4K Raporlama • Sıfır Sunucu Maliyeti',
  badgeText: 'Corpus Studio #014 • 4K Render',
  showBadge: true,
  codeTitle: 'cryptoVaultEngine.ts',
  codeSnippet: `export async function sealZeroKnowledgePayload(data: Uint8Array, secret: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePbkdf2Key(secret, salt, 310_000);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return { cipherBuffer, iv, salt, verifiedAt: new Date().toISOString() };
}`,
  uploadedImageDataUrl: null,
};

/** Draw built-in crisp SaaS Analytics Dashboard inside the mockup frame when no custom screenshot is uploaded */
function drawBuiltInDashboardScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dark: boolean
) {
  ctx.save();
  ctx.fillStyle = dark ? '#0b0b10' : '#f8fafc';
  ctx.fillRect(x, y, w, h);

  const pad = Math.max(18, w * 0.035);
  const innerW = w - pad * 2;

  // Top App Header inside screen
  ctx.fillStyle = dark ? '#f4f4f5' : '#0f172a';
  ctx.font = `bold ${Math.round(w * 0.022)}px Inter, system-ui, sans-serif`;
  ctx.fillText('Corpus Realtime Revenue & Telemetry', x + pad, y + pad + 18);

  ctx.fillStyle = '#10b981';
  ctx.font = `600 ${Math.round(w * 0.015)}px JetBrains Mono, monospace`;
  ctx.fillText('● CANLI AKIŞ (+28.4% MRR)', x + w - pad - w * 0.24, y + pad + 18);

  // 3 KPI Metric Cards
  const cardGap = 16;
  const cardW = (innerW - cardGap * 2) / 3;
  const cardH = h * 0.23;
  const cardY = y + pad + 38;

  const kpis = [
    { title: 'AYLIK TEKRARLAYAN GELİR', val: '₺1.482.900', tag: '+19.2% bu ay', color: '#8b5cf6' },
    { title: 'AKTİF KURUMSAL LİSANS', val: '12,840', tag: '%99.98 Uptime', color: '#06b6d4' },
    { title: 'DÖNÜŞÜM ORANI (PRO)', val: '%14.8', tag: '+3.1 puan artış', color: '#10b981' },
  ];

  kpis.forEach((kpi, idx) => {
    const cx = x + pad + idx * (cardW + cardGap);
    ctx.fillStyle = dark ? '#14141d' : '#ffffff';
    ctx.strokeStyle = dark ? '#272732' : '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = kpi.color;
    ctx.fillRect(cx, cardY, cardW, 4);

    ctx.fillStyle = dark ? '#a1a1aa' : '#64748b';
    ctx.font = `600 ${Math.max(10, Math.round(w * 0.012))}px Inter, sans-serif`;
    ctx.fillText(kpi.title, cx + 16, cardY + cardH * 0.32);

    ctx.fillStyle = dark ? '#ffffff' : '#0f172a';
    ctx.font = `bold ${Math.max(16, Math.round(w * 0.028))}px JetBrains Mono, monospace`;
    ctx.fillText(kpi.val, cx + 16, cardY + cardH * 0.68);

    ctx.fillStyle = kpi.color;
    ctx.font = `600 ${Math.max(10, Math.round(w * 0.013))}px Inter, sans-serif`;
    ctx.fillText(kpi.tag, cx + 16, cardY + cardH * 0.88);
  });

  // Bottom Chart Panel
  const chartY = cardY + cardH + 20;
  const chartH = Math.max(90, y + h - chartY - pad);

  ctx.fillStyle = dark ? '#14141d' : '#ffffff';
  ctx.strokeStyle = dark ? '#272732' : '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(x + pad, chartY, innerW, chartH, 14);
  ctx.fill();
  ctx.stroke();

  // Animated-looking Bar/Wave Columns inside Chart
  const bars = [0.35, 0.48, 0.42, 0.62, 0.55, 0.74, 0.68, 0.85, 0.78, 0.92, 0.88, 0.96];
  const barAreaW = innerW - 48;
  const bw = barAreaW / bars.length - 12;

  bars.forEach((ratio, i) => {
    const bx = x + pad + 24 + i * (bw + 12);
    const bh = (chartH - 50) * ratio;
    const by = chartY + chartH - 22 - bh;

    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, '#8b5cf6');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(8, bw), bh, 6);
    ctx.fill();
  });

  ctx.restore();
}

/** Draw syntax-highlighted Code Carbon Window */
function drawCodeSnippetScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  config: MockupConfig
) {
  ctx.save();
  ctx.fillStyle = '#0d0e14';
  ctx.fillRect(x, y, w, h);

  const lines = config.codeSnippet.split('\n');
  const fontSize = Math.max(13, Math.min(20, Math.round(w * 0.017)));
  const lineHeight = Math.round(fontSize * 1.65);
  ctx.font = `${fontSize}px JetBrains Mono, monospace`;

  let curY = y + 36;
  lines.forEach((line, idx) => {
    if (curY > y + h - 20) return;

    // Line number
    ctx.fillStyle = '#52525b';
    ctx.fillText(String(idx + 1).padStart(2, '0'), x + 24, curY);

    // Simple keyword coloring
    const codeX = x + 68;
    if (line.trim().startsWith('export') || line.trim().startsWith('return')) {
      ctx.fillStyle = '#c084fc';
    } else if (line.includes('await') || line.includes('crypto')) {
      ctx.fillStyle = '#38bdf8';
    } else if (line.includes("'") || line.includes('`')) {
      ctx.fillStyle = '#34d399';
    } else {
      ctx.fillStyle = '#e4e4e7';
    }
    ctx.fillText(line, codeX, curY);
    curY += lineHeight;
  });

  ctx.restore();
}

/** Render the entire Mockup Studio scene onto HTML5 Canvas */
export function renderMockupToCanvas(
  canvas: HTMLCanvasElement,
  config: MockupConfig,
  loadedImage: HTMLImageElement | null
): void {
  const dim = ASPECT_RATIOS[config.aspectRatio];
  const width = dim.width;
  const height = dim.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background Mesh Gradient
  const preset =
    GRADIENT_PRESETS.find((g) => g.id === config.gradientId) || GRADIENT_PRESETS[0];
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, preset.stops[0]);
  bgGrad.addColorStop(0.52, preset.stops[1]);
  bgGrad.addColorStop(1, preset.stops[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial glow
  const radGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.25,
    40,
    width * 0.5,
    height * 0.5,
    width * 0.65
  );
  radGrad.addColorStop(0, 'rgba(255,255,255,0.14)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, width, height);

  // Optional Subtle Engineering Dot Grid
  if (config.showNoiseGrid) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let gx = 32; gx < width; gx += 32) {
      for (let gy = 32; gy < height; gy += 32) {
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }
  }

  // 2. Optional Top Headline & Subheadline
  let topHeaderOffset = 0;
  if (config.headline.trim()) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(width * 0.028)}px Inter, system-ui, sans-serif`;
    ctx.fillText(config.headline, width / 2, config.padding * 0.62 + 28);

    if (config.subheadline.trim()) {
      ctx.fillStyle = 'rgba(244,244,245,0.82)';
      ctx.font = `500 ${Math.round(width * 0.015)}px Inter, system-ui, sans-serif`;
      ctx.fillText(config.subheadline, width / 2, config.padding * 0.62 + 62);
      topHeaderOffset = 76;
    } else {
      topHeaderOffset = 46;
    }
    ctx.restore();
  }

  // 3. Calculate Device Frame Box
  const pad = config.padding;
  let frameW = width - pad * 2;
  let frameH = height - pad * 2 - topHeaderOffset;
  let frameX = pad;
  let frameY = pad + topHeaderOffset * 0.85;

  if (config.deviceFrame === 'iphone-16-pro') {
    frameW = Math.min(frameW, Math.round(frameH * 0.49));
    frameX = Math.round((width - frameW) / 2);
  }

  // Apply subtle tilt rotation around center
  ctx.save();
  if (config.tiltAngle !== 0) {
    const cx = frameX + frameW / 2;
    const cy = frameY + frameH / 2;
    ctx.translate(cx, cy);
    ctx.rotate((config.tiltAngle * Math.PI) / 180);
    ctx.scale(0.96, 0.96);
    ctx.translate(-cx, -cy);
  }

  // Outer Glassmorphism Rim + Elevation Shadow
  ctx.save();
  ctx.shadowColor = `rgba(0, 0, 0, ${(config.shadowIntensity / 100) * 0.78})`;
  ctx.shadowBlur = Math.max(10, config.shadowIntensity * 0.95);
  ctx.shadowOffsetY = Math.round(config.shadowIntensity * 0.35);

  const radius =
    config.deviceFrame === 'iphone-16-pro' ? 46 : config.cornerRadius;

  if (config.glassBorder) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.roundRect(frameX - 10, frameY - 10, frameW + 20, frameH + 20, radius + 8);
    ctx.fill();
  }

  // Main Window / Device Shell
  ctx.fillStyle = config.windowDarkTheme ? '#121218' : '#ffffff';
  ctx.beginPath();
  ctx.roundRect(frameX, frameY, frameW, frameH, radius);
  ctx.fill();
  ctx.restore();

  // Clip inner content to rounded frame
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(frameX, frameY, frameW, frameH, radius);
  ctx.clip();

  let contentY = frameY;
  let contentH = frameH;

  // Frame Header Chrome
  if (config.deviceFrame === 'macos-browser' || config.deviceFrame === 'code-carbon') {
    const barH = 48;
    ctx.fillStyle = config.windowDarkTheme ? '#181820' : '#f1f5f9';
    ctx.fillRect(frameX, frameY, frameW, barH);

    // macOS Traffic Lights
    const dots = ['#ef4444', '#f59e0b', '#10b981'];
    dots.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(frameX + 24 + i * 20, frameY + barH / 2, 6.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // URL pill or Filename Tab
    const pillW = Math.min(460, frameW * 0.55);
    const pillX = frameX + (frameW - pillW) / 2;
    ctx.fillStyle = config.windowDarkTheme ? '#0d0d12' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(pillX, frameY + 10, pillW, barH - 20, 8);
    ctx.fill();

    ctx.fillStyle = config.windowDarkTheme ? '#a1a1aa' : '#475569';
    ctx.font = '13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      config.deviceFrame === 'code-carbon' ? config.codeTitle : config.browserUrl,
      frameX + frameW / 2,
      frameY + 29
    );
    ctx.textAlign = 'left';

    contentY = frameY + barH;
    contentH = frameH - barH;
  } else if (config.deviceFrame === 'macbook-pro') {
    const bezel = 14;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(frameX, frameY, frameW, bezel + 18);
    // Camera notch
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(frameX + frameW / 2 - 55, frameY, 110, 22, [0, 0, 10, 10]);
    ctx.fill();
    contentY = frameY + 24;
    contentH = frameH - 24;
  } else if (config.deviceFrame === 'iphone-16-pro') {
    // Dynamic island
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(frameX + frameW / 2 - 54, frameY + 14, 108, 26, 13);
    ctx.fill();
    contentY = frameY + 52;
    contentH = frameH - 52;
  }

  // Draw Screen Body Content
  if (config.deviceFrame === 'code-carbon') {
    drawCodeSnippetScreen(ctx, frameX, contentY, frameW, contentH, config);
  } else if (loadedImage) {
    // Cover-fit uploaded screenshot
    const imgRatio = loadedImage.width / loadedImage.height;
    const boxRatio = frameW / contentH;
    let drawW = frameW;
    let drawH = contentH;
    let drawX = frameX;
    let drawY = contentY;

    if (imgRatio > boxRatio) {
      drawH = frameW / imgRatio;
      drawY = contentY + (contentH - drawH) / 2;
    } else {
      drawW = contentH * imgRatio;
      drawX = frameX + (frameW - drawW) / 2;
    }
    ctx.fillStyle = config.windowDarkTheme ? '#0b0b10' : '#ffffff';
    ctx.fillRect(frameX, contentY, frameW, contentH);
    ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
  } else {
    drawBuiltInDashboardScreen(
      ctx,
      frameX,
      contentY,
      frameW,
      contentH,
      config.windowDarkTheme
    );
  }

  ctx.restore(); // end clip
  ctx.restore(); // end tilt

  // 4. Optional Corner Watermark Badge
  if (config.showBadge && config.badgeText.trim()) {
    ctx.save();
    ctx.font = '600 13px JetBrains Mono, monospace';
    const bw = ctx.measureText(config.badgeText).width + 28;
    const bx = width - bw - 26;
    const by = height - 48;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.65)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 30, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(config.badgeText, bx + 14, by + 19);
    ctx.restore();
  }
}

/** Download 4K PNG from Canvas */
export function exportMockupCanvasToPng(
  canvas: HTMLCanvasElement,
  config: MockupConfig
): void {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corpus-mockup-${config.deviceFrame}-${config.aspectRatio.replace(':', 'x')}.png`;
  a.click();
}
