import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Monitor,
  Smartphone,
  Code2,
  Palette,
  Sliders,
  ImagePlus,
  Download,
  Copy,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_MOCKUP_CONFIG,
  GRADIENT_PRESETS,
  ASPECT_RATIOS,
  type MockupConfig,
  type DeviceFrameType,
  type AspectRatioKey,
  renderMockupToCanvas,
  exportMockupCanvasToPng,
} from './utils/mockupEngine';

type MockupStudioTab = 'content' | 'backdrop' | 'geometry';

export default function App() {
  const [config, setConfig] = useState<MockupConfig>(() => {
    try {
      const saved = localStorage.getItem('corpus_mockup_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_MOCKUP_CONFIG;
    } catch {
      return DEFAULT_MOCKUP_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<MockupStudioTab>('content');
  const [zoom, setZoom] = useState<number>(0.48);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [copiedPng, setCopiedPng] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem('corpus_mockup_config_v1', JSON.stringify(config));
    } catch {
      // ignore quota errors
    }
  }, [config]);

  // Decode uploaded screenshot DataURL into HTMLImageElement
  useEffect(() => {
    if (!config.uploadedImageDataUrl) {
      setLoadedImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLoadedImg(img);
    img.src = config.uploadedImageDataUrl;
  }, [config.uploadedImageDataUrl]);

  // Re-render Canvas whenever config or loadedImg changes
  useEffect(() => {
    if (!canvasRef.current) return;
    renderMockupToCanvas(canvasRef.current, config, loadedImg);
  }, [config, loadedImg]);

  // Support Ctrl+V clipboard image paste anywhere on the page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFileUpload(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        uploadedImageDataUrl: String(reader.result),
        deviceFrame:
          prev.deviceFrame === 'code-carbon' ? 'macos-browser' : prev.deviceFrame,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    exportMockupCanvasToPng(canvasRef.current, config);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleCopyCanvasToClipboard = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedPng(true);
        confetti({ particleCount: 45, spread: 55, origin: { y: 0.6 } });
        setTimeout(() => setCopiedPng(false), 1800);
      } catch {
        // Fallback if clipboard permission denied
      }
    }, 'image/png');
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Mockup, Screenshot & Carbon Studio Pro (#014)',
      'echo Corpus Mockup & Ekran Goruntusu Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5186',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Mockup-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentDim = ASPECT_RATIOS[config.aspectRatio];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Mockup, Shot & Carbon Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #014 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                MacBook Pro, iPhone 16 Pro, Safari Çerçevesi, 3D Perspektif, Mesh Gradyan & Carbon.sh Kod Görselleştirici
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Çıktı Çözünürlüğü:</span>
              <strong className="text-emerald-400">
                {currentDim.width} × {currentDim.height} px
              </strong>
            </div>

            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-all cursor-pointer"
            >
              <MonitorDown className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Uygulamayı İndir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Top Studio Control Bar */}
      <div className="border-b border-zinc-800/70 bg-[#111114]/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Device Frame Type & Aspect Ratio */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {(
                [
                  { id: 'macos-browser', label: 'macOS Safari Penceresi', icon: Monitor },
                  { id: 'macbook-pro', label: 'MacBook Pro M4', icon: Monitor },
                  { id: 'iphone-16-pro', label: 'iPhone 16 Pro Max', icon: Smartphone },
                  { id: 'code-carbon', label: 'Carbon Kod Kartı', icon: Code2 },
                ] as { id: DeviceFrameType; label: string; icon: typeof Monitor }[]
              ).map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => setConfig((p) => ({ ...p, deviceFrame: d.id }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      config.deviceFrame === d.id
                        ? 'bg-violet-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

            <select
              value={config.aspectRatio}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  aspectRatio: e.target.value as AspectRatioKey,
                }))
              }
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
            >
              {Object.entries(ASPECT_RATIOS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Copy & Export 4K PNG */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfig(DEFAULT_MOCKUP_CONFIG)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 cursor-pointer"
              title="Varsayılana Sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sıfırla
            </button>

            <button
              onClick={handleCopyCanvasToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              {copiedPng ? 'Panoya Kopyalandı!' : 'Panoya Kopyala'}
            </button>

            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              4K PNG İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'content', label: 'Ekran & İçerik', icon: ImagePlus },
              { id: 'backdrop', label: 'Gradyan & Tema', icon: Palette },
              { id: 'geometry', label: '3D Eğim & Gölge', icon: Sliders },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as MockupStudioTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-[#111115] border border-zinc-800/90 p-4 sm:p-5 flex-1 flex flex-col gap-4 corpus-card-glow">
            {/* TAB 1: CONTENT */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Ekran Görüntüsü Yükle veya Kod Yapıştır
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Dosya seçebilir veya doğrudan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-[10px]">Ctrl + V</kbd> ile ekran görüntüsü yapıştırabilirsiniz
                  </p>
                </div>

                {/* Upload Dropzone */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer transition-all">
                    <ImagePlus className="w-6 h-6 text-violet-400 mb-1.5" />
                    <span className="text-xs font-semibold text-zinc-200">
                      Ekran Görüntüsü Seç (PNG / JPG / WebP)
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">
                      veya Ctrl+V ile panodan yapıştırın
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {config.uploadedImageDataUrl && (
                    <button
                      onClick={() =>
                        setConfig((p) => ({ ...p, uploadedImageDataUrl: null }))
                      }
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex flex-col items-center gap-1 cursor-pointer"
                      title="Yüklenen Görseli Kaldır ve Demo Dashboard'a Dön"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Görseli Sil</span>
                    </button>
                  )}
                </div>

                {/* Headline & Subheadline */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Üst Tanıtım Başlığı (İsteğe Bağlı)
                    </label>
                    <input
                      type="text"
                      value={config.headline}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, headline: e.target.value }))
                      }
                      placeholder="Başlığı gizlemek için boş bırakın"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Alt Açıklama Satırı
                    </label>
                    <input
                      type="text"
                      value={config.subheadline}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, subheadline: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Tarayıcı Adres Çubuğu (URL) / Dosya Adı
                    </label>
                    <input
                      type="text"
                      value={
                        config.deviceFrame === 'code-carbon'
                          ? config.codeTitle
                          : config.browserUrl
                      }
                      onChange={(e) =>
                        setConfig((p) =>
                          p.deviceFrame === 'code-carbon'
                            ? { ...p, codeTitle: e.target.value }
                            : { ...p, browserUrl: e.target.value }
                        )
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200"
                    />
                  </div>
                </div>

                {/* Carbon Code Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-zinc-400">
                      Carbon Kod İçeriği (Carbon Kod Kartı Modu İçin)
                    </label>
                    {config.deviceFrame !== 'code-carbon' && (
                      <button
                        onClick={() =>
                          setConfig((p) => ({ ...p, deviceFrame: 'code-carbon' }))
                        }
                        className="text-[11px] text-violet-400 hover:underline cursor-pointer"
                      >
                        Kod Moduna Geç →
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={6}
                    value={config.codeSnippet}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        codeSnippet: e.target.value,
                        deviceFrame: 'code-carbon',
                      }))
                    }
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BACKDROP & GRADIENTS */}
            {activeTab === 'backdrop' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Stüdyo Mesh Gradyanları & Arka Plan
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Shots.so ve Ray.so kalitesinde sinematik arka plan ışıklandırması
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setConfig((p) => ({ ...p, gradientId: g.id }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        config.gradientId === g.id
                          ? 'border-white ring-2 ring-violet-500/40'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]}, ${g.stops[2]})`,
                      }}
                    >
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {g.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.windowDarkTheme}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          windowDarkTheme: e.target.checked,
                        }))
                      }
                    />
                    <span>Koyu (Dark) Cihaz Çerçevesi</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showNoiseGrid}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          showNoiseGrid: e.target.checked,
                        }))
                      }
                    />
                    <span>Noktalı Arka Plan Dokusu</span>
                  </label>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showBadge}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, showBadge: e.target.checked }))
                      }
                    />
                    <span>Sağ Alt Köşe Marka Rozetini Göster</span>
                  </label>
                  {config.showBadge && (
                    <input
                      type="text"
                      value={config.badgeText}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, badgeText: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200"
                    />
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: GEOMETRY, 3D TILT & SHADOW */}
            {activeTab === 'geometry' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    3D Perspektif, Kenar Boşluğu & Gölge
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Çerçeve açısını, cam efektini ve derinliği milimetrik ayarlayın
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Kenar Boşluğu (Padding)</span>
                      <span className="font-mono text-violet-300">{config.padding} px</span>
                    </div>
                    <input
                      type="range"
                      min={32}
                      max={160}
                      value={config.padding}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, padding: Number(e.target.value) }))
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Köşe Yuvarlaklığı (Radius)</span>
                      <span className="font-mono text-violet-300">
                        {config.cornerRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={44}
                      value={config.cornerRadius}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          cornerRadius: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Gölge Yoğunluğu (Elevation)</span>
                      <span className="font-mono text-violet-300">
                        %{config.shadowIntensity}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.shadowIntensity}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          shadowIntensity: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">3D Perspektif Eğim Açısı (Tilt)</span>
                      <span className="font-mono text-violet-300">{config.tiltAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={config.tiltAngle}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          tiltAngle: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.glassBorder}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, glassBorder: e.target.checked }))
                      }
                    />
                    <span>Glassmorphism Yarı Saydam Cam Çerçeve Halesi</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live 4K Mockup Preview Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı 4K Stüdyo Render Önizlemesi ({currentDim.label})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.28, +(z - 0.06).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-zinc-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(0.85, +(z + 0.06).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f && f.type.startsWith('image/')) handleFileUpload(f);
            }}
            className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-5 overflow-auto flex justify-center items-center min-h-[540px] corpus-card-glow"
          >
            <div
              style={{
                width: currentDim.width * zoom,
                height: currentDim.height * zoom,
              }}
              className="relative shadow-2xl rounded-xl overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#121216] border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <MonitorDown className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Corpus Mockup Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız 4K Mockup & Shot Stüdyosu</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ctrl+V ile anında ekran görüntüsü yapıştırma ve 4K PNG çıktı</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tamamen çevrimdışı çalışır, görselleriniz hiçbir sunucuya gitmez</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 text-xs text-zinc-300"
              >
                Kapat
              </button>
              <button
                onClick={handleDownloadDesktopLauncher}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
              >
                .BAT Masaüstü Başlatıcı İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Corpus Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] py-3.5 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              %100 İstemci Taraflı HTML5 4K Canvas Motoru — Ekran görüntüleriniz cihazınızdan çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #014 • Shots.so / Cleanshot X / Ray.so Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
