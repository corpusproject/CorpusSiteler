// ---------------------------------------------------------------------------
// Corpus Screen Studio Pro (#004) — Real-Time 60fps Canvas Compositor Engine
// ---------------------------------------------------------------------------

export type WallpaperTheme =
  | 'corpus-violet'
  | 'emerald-matrix'
  | 'sunset-glow'
  | 'midnight-slate'
  | 'none';

export type PipShape = 'circle' | 'rounded' | 'portrait';
export type PipCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type DrawTool = 'cursor' | 'laser' | 'spotlight' | 'pen' | 'rect' | 'arrow';

export interface NormalizedPoint {
  x: number; // 0..1
  y: number; // 0..1
}

export interface LaserTrailPoint extends NormalizedPoint {
  timestamp: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'rect' | 'arrow';
  color: string;
  lineWidth: number;
  points: NormalizedPoint[];
}

export interface StudioConfig {
  resolution: '4k' | '1080p' | '720p';
  fps: 60 | 30;
  bitrateMbps: number;
  wallpaper: WallpaperTheme;
  padding: number; // 0 to 80 px (normalized to 1920w)
  cornerRadius: number; // 0 to 32 px
  pipEnabled: boolean;
  pipShape: PipShape;
  pipCorner: PipCorner;
  pipSize: number; // 0.14 to 0.28 of canvas height
  pipMirror: boolean;
  pipBorderColor: string;
  lowerThirdEnabled: boolean;
  lowerThirdTitle: string;
  lowerThirdSubtitle: string;
}

export interface RecordedTake {
  id: string;
  name: string;
  url: string;
  blob: Blob;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: string;
  resolutionLabel: string;
}

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  resolution: '1080p',
  fps: 60,
  bitrateMbps: 16,
  wallpaper: 'corpus-violet',
  padding: 44,
  cornerRadius: 18,
  pipEnabled: true,
  pipShape: 'circle',
  pipCorner: 'bottom-left',
  pipSize: 0.22,
  pipMirror: true,
  pipBorderColor: '#8b5cf6',
  lowerThirdEnabled: true,
  lowerThirdTitle: 'Corpus Screen Studio Pro',
  lowerThirdSubtitle: 'Canlı 4K Sunum & Eğitim Kaydı • #004',
};

export function getResolutionDimensions(res: StudioConfig['resolution']): {
  width: number;
  height: number;
} {
  if (res === '4k') return { width: 3840, height: 2160 };
  if (res === '720p') return { width: 1280, height: 720 };
  return { width: 1920, height: 1080 };
}

// ---------------------------------------------------------------------------
// Master 60fps Compositor Frame Renderer
// ---------------------------------------------------------------------------

export function renderCompositorFrame(params: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  config: StudioConfig;
  screenVideo: HTMLVideoElement | null;
  cameraVideo: HTMLVideoElement | null;
  hasScreenStream: boolean;
  hasCameraStream: boolean;
  isDemoSceneActive: boolean;
  strokes: DrawingStroke[];
  laserPoints: LaserTrailPoint[];
  mousePos: NormalizedPoint | null;
  activeTool: DrawTool;
  audioLevel: number; // 0..1 for reactive avatar ring
  timestamp: number;
}) {
  const {
    ctx,
    width,
    height,
    config,
    screenVideo,
    cameraVideo,
    hasScreenStream,
    hasCameraStream,
    isDemoSceneActive,
    strokes,
    laserPoints,
    mousePos,
    activeTool,
    audioLevel,
    timestamp,
  } = params;

  const scaleRatio = width / 1920;

  // 1. Draw Wallpaper Background
  if (config.wallpaper === 'corpus-violet') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f0c24');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#09090b');
    ctx.fillStyle = grad;
  } else if (config.wallpaper === 'emerald-matrix') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.5, '#064e3b');
    grad.addColorStop(1, '#09090b');
    ctx.fillStyle = grad;
  } else if (config.wallpaper === 'sunset-glow') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#3b0764');
    grad.addColorStop(0.5, '#831843');
    grad.addColorStop(1, '#09090b');
    ctx.fillStyle = grad;
  } else if (config.wallpaper === 'midnight-slate') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(1, '#18181b');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#09090b';
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Calculate Inner Screen Window Rect
  const pad = config.wallpaper === 'none' ? 0 : config.padding * scaleRatio;
  const radius = config.wallpaper === 'none' ? 0 : config.cornerRadius * scaleRatio;
  const winX = pad;
  const winY = pad;
  const winW = width - pad * 2;
  const winH = height - pad * 2;

  ctx.save();
  if (pad > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 42 * scaleRatio;
    ctx.shadowOffsetY = 14 * scaleRatio;
  }

  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, winH, radius);
  ctx.fillStyle = '#09090b';
  ctx.fill();
  ctx.restore();

  // Clip inside the rounded screen window
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, winH, radius);
  ctx.clip();

  // 3. Draw Screen Share Video OR Interactive Demo Scene
  if (hasScreenStream && screenVideo && screenVideo.readyState >= 2) {
    const vw = screenVideo.videoWidth || 1920;
    const vh = screenVideo.videoHeight || 1080;
    const scale = Math.min(winW / vw, winH / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = winX + (winW - dw) / 2;
    const dy = winY + (winH - dh) / 2;
    ctx.drawImage(screenVideo, dx, dy, dw, dh);
  } else if (isDemoSceneActive) {
    renderInteractiveDemoDashboard(ctx, winX, winY, winW, winH, scaleRatio, timestamp);
  } else {
    // Idle stage guide
    ctx.fillStyle = '#0d0d11';
    ctx.fillRect(winX, winY, winW, winH);
    ctx.fillStyle = '#71717a';
    ctx.font = `500 ${22 * scaleRatio}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Ekran Paylaşımı veya Demo Sahne Bekleniyor...',
      winX + winW / 2,
      winY + winH / 2
    );
  }

  ctx.restore();

  // 4. Draw Live Telestrator Strokes (Pen, Rect, Arrow)
  for (const s of strokes) {
    if (s.points.length === 0) continue;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.lineWidth * scaleRatio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'pen') {
      ctx.beginPath();
      s.points.forEach((pt, idx) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    } else if (s.tool === 'rect' && s.points.length >= 2) {
      const p0 = s.points[0];
      const p1 = s.points[s.points.length - 1];
      const rx = Math.min(p0.x, p1.x) * width;
      const ry = Math.min(p0.y, p1.y) * height;
      const rw = Math.abs(p1.x - p0.x) * width;
      const rh = Math.abs(p1.y - p0.y) * height;
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (s.tool === 'arrow' && s.points.length >= 2) {
      const p0 = s.points[0];
      const p1 = s.points[s.points.length - 1];
      const x1 = p0.x * width;
      const y1 = p0.y * height;
      const x2 = p1.x * width;
      const y2 = p1.y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 22 * scaleRatio;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI / 6),
        y2 - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI / 6),
        y2 - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // 5. Cursor Spotlight Effect
  if (activeTool === 'spotlight' && mousePos) {
    const mx = mousePos.x * width;
    const my = mousePos.y * height;
    const spotRadius = 155 * scaleRatio;

    ctx.save();
    const grad = ctx.createRadialGradient(mx, my, spotRadius * 0.4, mx, my, spotRadius * 1.6);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Fading Laser Pointer Trail
  if (laserPoints.length > 0) {
    ctx.save();
    for (let i = 1; i < laserPoints.length; i++) {
      const p0 = laserPoints[i - 1];
      const p1 = laserPoints[i];
      const age = timestamp - p1.timestamp;
      const alpha = Math.max(0, 1 - age / 650);
      if (alpha <= 0) continue;

      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 16 * scaleRatio;
      ctx.lineWidth = 6 * scaleRatio * alpha;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p0.x * width, p0.y * height);
      ctx.lineTo(p1.x * width, p1.y * height);
      ctx.stroke();
    }

    const last = laserPoints[laserPoints.length - 1];
    if (timestamp - last.timestamp < 650) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 22 * scaleRatio;
      ctx.beginPath();
      ctx.arc(last.x * width, last.y * height, 7 * scaleRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. Draw Webcam Picture-in-Picture (PiP) Bubble
  if (config.pipEnabled) {
    const pipH = height * config.pipSize;
    const pipW =
      config.pipShape === 'portrait'
        ? pipH * 0.78
        : config.pipShape === 'rounded'
        ? pipH * 1.25
        : pipH;

    const margin = Math.max(32 * scaleRatio, pad + 24 * scaleRatio);
    let px = margin;
    let py = height - pipH - margin;

    if (config.pipCorner === 'bottom-right') {
      px = width - pipW - margin;
      py = height - pipH - margin;
    } else if (config.pipCorner === 'top-left') {
      px = margin;
      py = margin;
    } else if (config.pipCorner === 'top-right') {
      px = width - pipW - margin;
      py = margin;
    }

    ctx.save();
    // Audio-reactive outer glow ring
    const voiceBoost = audioLevel * 14 * scaleRatio;
    ctx.shadowColor = config.pipBorderColor;
    ctx.shadowBlur = (20 + voiceBoost) * scaleRatio;

    ctx.beginPath();
    if (config.pipShape === 'circle') {
      ctx.arc(px + pipW / 2, py + pipH / 2, pipH / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect(px, py, pipW, pipH, 24 * scaleRatio);
    }
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = (4 + audioLevel * 5) * scaleRatio;
    ctx.strokeStyle = config.pipBorderColor;
    ctx.stroke();

    ctx.clip();

    if (hasCameraStream && cameraVideo && cameraVideo.readyState >= 2) {
      const cw = cameraVideo.videoWidth || 640;
      const ch = cameraVideo.videoHeight || 480;
      const sc = Math.max(pipW / cw, pipH / ch);
      const dw = cw * sc;
      const dh = ch * sc;
      const dx = px + (pipW - dw) / 2;
      const dy = py + (pipH - dh) / 2;

      if (config.pipMirror) {
        ctx.translate(px + pipW / 2, py + pipH / 2);
        ctx.scale(-1, 1);
        ctx.translate(-(px + pipW / 2), -(py + pipH / 2));
      }
      ctx.drawImage(cameraVideo, dx, dy, dw, dh);
    } else {
      // Stylish Studio Presenter Avatar when webcam is toggled off
      const grad = ctx.createLinearGradient(px, py, px + pipW, py + pipH);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pipW, pipH);

      // Animated audio pulse rings inside avatar
      const cx = px + pipW / 2;
      const cy = py + pipH / 2;
      ctx.fillStyle = config.pipBorderColor;
      ctx.font = `700 ${32 * scaleRatio}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CORPUS', cx, cy - 8 * scaleRatio);
      ctx.font = `500 ${13 * scaleRatio}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText('STUDIO CAM', cx, cy + 20 * scaleRatio);
    }

    ctx.restore();
  }

  // 8. Lower-Third Speaker / Presentation Banner
  if (config.lowerThirdEnabled && (config.lowerThirdTitle.trim() || config.lowerThirdSubtitle.trim())) {
    const bannerW = 460 * scaleRatio;
    const bannerH = 76 * scaleRatio;
    const bx =
      config.pipEnabled && config.pipCorner === 'bottom-right'
        ? Math.max(36 * scaleRatio, pad + 28 * scaleRatio)
        : width - bannerW - Math.max(36 * scaleRatio, pad + 28 * scaleRatio);
    const by = height - bannerH - Math.max(36 * scaleRatio, pad + 28 * scaleRatio);

    ctx.save();
    ctx.fillStyle = 'rgba(17, 17, 20, 0.88)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.55)';
    ctx.lineWidth = 2 * scaleRatio;
    ctx.beginPath();
    ctx.roundRect(bx, by, bannerW, bannerH, 14 * scaleRatio);
    ctx.fill();
    ctx.stroke();

    // Left Accent Bar
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.roundRect(bx + 12 * scaleRatio, by + 14 * scaleRatio, 5 * scaleRatio, bannerH - 28 * scaleRatio, 4);
    ctx.fill();

    ctx.fillStyle = '#fafafa';
    ctx.font = `700 ${20 * scaleRatio}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.lowerThirdTitle, bx + 28 * scaleRatio, by + 15 * scaleRatio);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = `500 ${13.5 * scaleRatio}px "JetBrains Mono", monospace`;
    ctx.fillText(config.lowerThirdSubtitle, bx + 28 * scaleRatio, by + 43 * scaleRatio);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Interactive Demo Scene (For instant testing without window selection)
// ---------------------------------------------------------------------------

function renderInteractiveDemoDashboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
  timestamp: number
) {
  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(x, y, w, h);

  // macOS / Linear style window titlebar
  ctx.fillStyle = '#141419';
  ctx.fillRect(x, y, w, 46 * scale);
  const dots = ['#f43f5e', '#f59e0b', '#10b981'];
  dots.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + (24 + i * 22) * scale, y + 23 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#a1a1aa';
  ctx.font = `500 ${13 * scale}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'corpus-platform / 004-screen-studio — Live 60fps Demo Workspace',
    x + w / 2,
    y + 23 * scale
  );

  // Content cards inside demo scene
  const contentY = y + 76 * scale;
  const contentX = x + 56 * scale;

  ctx.fillStyle = '#fafafa';
  ctx.textAlign = 'left';
  ctx.font = `700 ${34 * scale}px Inter, sans-serif`;
  ctx.fillText('Corpus Screen Studio Pro • Canlı Sahne', contentX, contentY);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = `400 ${18 * scale}px Inter, sans-serif`;
  ctx.fillText(
    'Üstteki Lazer İmleç, Spot Işığı veya Kalem araçlarıyla bu sahne üzerine canlı çizim yapıp kaydedebilirsiniz.',
    contentX,
    contentY + 42 * scale
  );

  // Animated Metric Cards
  const cards = [
    { label: 'KARE HIZI (FPS)', val: '60.0 FPS', color: '#10b981' },
    { label: 'ÇIKIŞ ÇÖZÜNÜRLÜĞÜ', val: '4K / 1080p HD', color: '#8b5cf6' },
    { label: 'FİLİGRAN DURUMU', val: '%0 Filigransız', color: '#38bdf8' },
  ];

  cards.forEach((c, idx) => {
    const cx = contentX + idx * 390 * scale;
    const cy = contentY + 95 * scale;
    ctx.fillStyle = '#16161d';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.roundRect(cx, cy, 360 * scale, 130 * scale, 14 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#71717a';
    ctx.font = `600 ${13 * scale}px "JetBrains Mono", monospace`;
    ctx.fillText(c.label, cx + 24 * scale, cy + 36 * scale);

    ctx.fillStyle = c.color;
    ctx.font = `700 ${32 * scale}px "JetBrains Mono", monospace`;
    ctx.fillText(c.val, cx + 24 * scale, cy + 84 * scale);
  });

  // Animated Waveform Chart
  const chartY = contentY + 265 * scale;
  const chartW = w - 112 * scale;
  const chartH = 220 * scale;
  ctx.fillStyle = '#131318';
  ctx.strokeStyle = '#27272a';
  ctx.beginPath();
  ctx.roundRect(contentX, chartY, chartW, chartH, 16 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3.5 * scale;
  ctx.beginPath();
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const px = contentX + 24 * scale + (i / steps) * (chartW - 48 * scale);
    const wave =
      Math.sin(i * 0.25 + timestamp * 0.004) * 45 * scale +
      Math.cos(i * 0.12 - timestamp * 0.002) * 25 * scale;
    const py = chartY + chartH / 2 + wave;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}
