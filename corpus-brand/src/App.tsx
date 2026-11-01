import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Palette,
  Eye,
  Code2,
  Shuffle,
  Download,
  Copy,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  DEFAULT_BRAND_PALETTE,
  PRESET_BRAND_SYSTEMS,
  type BrandPalette,
  generateShadeScale,
  auditBrandContrast,
  generateDesignTokensCode,
  renderBrandBookToCanvas,
  exportBrandBookPng,
  rgbToHex,
} from './utils/brandEngine';

type BrandTab = 'palette' | 'wcag' | 'tokens';
type TokenFormat = 'tailwind' | 'css' | 'figma';

export default function App() {
  const [palette, setPalette] = useState<BrandPalette>(() => {
    try {
      const saved = localStorage.getItem('corpus_brand_palette_v1');
      return saved ? JSON.parse(saved) : DEFAULT_BRAND_PALETTE;
    } catch {
      return DEFAULT_BRAND_PALETTE;
    }
  });

  const [activeTab, setActiveTab] = useState<BrandTab>('palette');
  const [tokenFormat, setTokenFormat] = useState<TokenFormat>('tailwind');
  const [copiedHex, setCopiedHex] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.53);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_brand_palette_v1', JSON.stringify(palette));
    } catch {
      // ignore
    }
  }, [palette]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderBrandBookToCanvas(canvasRef.current, palette);
  }, [palette]);

  const primaryShades = useMemo(
    () => generateShadeScale(palette.primary),
    [palette.primary]
  );

  const contrastAudits = useMemo(
    () => auditBrandContrast(palette),
    [palette]
  );

  const tokenCode = useMemo(
    () => generateDesignTokensCode(palette, tokenFormat),
    [palette, tokenFormat]
  );

  const handleRandomizePalette = () => {
    const randChannel = (min: number, max: number) =>
      Math.floor(min + Math.random() * (max - min));
    const primary = rgbToHex(
      randChannel(40, 230),
      randChannel(30, 180),
      randChannel(80, 245)
    );
    const secondary = rgbToHex(
      randChannel(20, 200),
      randChannel(120, 230),
      randChannel(140, 250)
    );
    const accent = rgbToHex(
      randChannel(16, 240),
      randChannel(150, 220),
      randChannel(60, 160)
    );
    setPalette((prev) => ({
      ...prev,
      id: 'custom',
      primary,
      secondary,
      accent,
    }));
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    exportBrandBookPng(canvasRef.current, palette.brandName);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Color, Brand & Design System Studio Pro (#018)',
      'echo Corpus Marka Kitabi ve Renk Sistemi Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5190',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Brand-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <Palette className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Color, Brand & Design System Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #018 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                50–900 Renk Tonu Üretici, WCAG 2.1 AAA Kontrast Denetçisi, Tailwind/Figma Token & 4K Marka Kitabı Stüdyosu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Ana Kontrast:</span>
              <strong className="text-emerald-400">
                {contrastAudits[0]?.ratio}:1 ({contrastAudits[0]?.badge})
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
          {/* Left: Preset Brand Systems & Randomizer */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {Object.entries(PRESET_BRAND_SYSTEMS).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => setPalette(tpl.build())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    palette.id === key
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleRandomizePalette}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              Yeni Palet Üret
            </button>
          </div>

          {/* Right: Export 4K Brand Book Poster */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(tokenCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 1500);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              {copiedCode ? 'Token Kodu Kopyalandı!' : 'Tailwind / CSS Kopyala'}
            </button>

            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              4K Marka Kitabı (PNG) İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'palette', label: 'Renkler & Skalalar', icon: Palette },
              { id: 'wcag', label: 'WCAG Kontrast', icon: Eye },
              { id: 'tokens', label: 'Tailwind / Token', icon: Code2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as BrandTab)}
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
            {/* TAB 1: PALETTE & SHADE RAMP */}
            {activeTab === 'palette' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Marka / Ürün Adı
                    </label>
                    <input
                      type="text"
                      value={palette.brandName}
                      onChange={(e) =>
                        setPalette((p) => ({ ...p, brandName: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Tasarım Sistemi Alt Başlığı
                    </label>
                    <input
                      type="text"
                      value={palette.tagline}
                      onChange={(e) =>
                        setPalette((p) => ({ ...p, tagline: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                {/* 5 Core Color Pickers */}
                <div className="space-y-2">
                  {(
                    [
                      { key: 'primary', label: 'Ana Marka Rengi (Primary)' },
                      { key: 'secondary', label: 'İkincil Vurgu Rengi (Secondary)' },
                      { key: 'accent', label: 'Eylem & Onay Rengi (Accent)' },
                      { key: 'surfaceDark', label: 'Koyu Arka Plan Zemini (Surface)' },
                      { key: 'textLight', label: 'Açık Metin Rengi (Foreground)' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={palette[key]}
                          onChange={(e) =>
                            setPalette((p) => ({ ...p, [key]: e.target.value }))
                          }
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-medium text-zinc-200">
                          {label}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={palette[key]}
                        onChange={(e) =>
                          setPalette((p) => ({ ...p, [key]: e.target.value }))
                        }
                        className="w-24 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 text-center"
                      />
                    </div>
                  ))}
                </div>

                {/* 50..900 Shade Scale Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-200">
                      Otomatik 50–900 Renk Tonu Skalası (Kopyalamak İçin Tıklayın)
                    </span>
                    {copiedHex && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        {copiedHex} kopyalandı!
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {primaryShades.map((sh) => (
                      <button
                        key={sh.step}
                        onClick={() => {
                          navigator.clipboard.writeText(sh.hex);
                          setCopiedHex(sh.hex);
                          setTimeout(() => setCopiedHex(''), 1200);
                        }}
                        className="p-2 rounded-lg border border-zinc-800 flex flex-col items-start cursor-pointer transition-transform hover:scale-105"
                        style={{
                          backgroundColor: sh.hex,
                          color: sh.step < 500 ? '#0f172a' : '#ffffff',
                        }}
                      >
                        <span className="text-[10px] font-mono font-bold">
                          {sh.step}
                        </span>
                        <span className="text-[10px] font-mono">{sh.hex}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WCAG ACCESSIBILITY */}
            {activeTab === 'wcag' && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    WCAG 2.1 AA / AAA Kontrast Denetçisi
                  </h2>
                  <p className="text-xs text-zinc-400">
                    W3C Göreli Parlaklık (Relative Luminance) formülüyle okunabilirlik testi
                  </p>
                </div>

                <div className="space-y-2.5">
                  {contrastAudits.map((au, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {au.aaNormal ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="text-xs font-semibold text-zinc-100">
                            {au.pairName}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            au.aaaNormal
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : au.aaNormal
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {au.ratio}:1 • {au.badge}
                        </span>
                      </div>

                      {/* Live Sample Bar */}
                      <div
                        className="p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between"
                        style={{ backgroundColor: au.bg, color: au.fg }}
                      >
                        <span>Örnek Kurumsal Arayüz Metni ({palette.brandName})</span>
                        <span className="font-mono text-[10px]">
                          {au.fg} / {au.bg}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: DESIGN TOKENS CODE */}
            {activeTab === 'tokens' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 gap-1">
                    {(
                      [
                        { id: 'tailwind', label: 'Tailwind v4 (@theme)' },
                        { id: 'css', label: 'CSS Variables (:root)' },
                        { id: 'figma', label: 'Figma Tokens (.JSON)' },
                      ] as { id: TokenFormat; label: string }[]
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setTokenFormat(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          tokenFormat === f.id
                            ? 'bg-violet-600 text-white'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={tokenCode}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Live 4K Brand Book & UI Kit Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı 4K Marka Kimliği Kitabı & Arayüz Önizlemesi (1440 × 900 px)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.06).toFixed(2)))}
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

          <div className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-4 overflow-auto flex justify-center items-center min-h-[540px] corpus-card-glow">
            <div
              style={{
                width: 1440 * zoom,
                height: 900 * zoom,
              }}
              className="relative shadow-2xl rounded-xl overflow-hidden border border-zinc-800"
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
                    Corpus Brand Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız Marka Kitabı & Renk Sistemi Stüdyosu</p>
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
                <span>Otomatik 50–900 renk skalası, WCAG AAA kontrast testi ve Tailwind v4 çıktısı</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tek tıkla 4K Marka Kimliği Kitabı (Brand Guidelines) posteri indirir</span>
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
              %100 İstemci Taraflı W3C WCAG & Renk Motoru — Marka tasarımlarınız cihazınızdan çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #018 • Coolors Pro / Realtime Colors / Figma Tokens Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
