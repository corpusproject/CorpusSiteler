import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Globe,
  Search,
  Share2,
  Code2,
  ShieldCheck,
  Download,
  Copy,
  MonitorDown,
  CheckCircle2,
  AlertTriangle,
  Star,
  X,
} from 'lucide-react';
import {
  DEFAULT_SEO_CONFIG,
  PRESET_SEO_CONFIGS,
  type SeoConfig,
  type SchemaType,
  auditSeoConfig,
  generateHtmlMetaTags,
  generateJsonLdSchema,
  generateRobotsAndSitemap,
  renderOgBannerToCanvas,
  exportOgBannerPng,
} from './utils/seoEngine';

type SeoStudioTab = 'meta' | 'og-design' | 'audit' | 'code';
type CodeFormat = 'html-meta' | 'json-ld' | 'robots-sitemap';

export default function App() {
  const [cfg, setCfg] = useState<SeoConfig>(() => {
    try {
      const saved = localStorage.getItem('corpus_seo_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SEO_CONFIG;
    } catch {
      return DEFAULT_SEO_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<SeoStudioTab>('meta');
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('html-meta');
  const [copied, setCopied] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const ogCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_seo_config_v1', JSON.stringify(cfg));
    } catch {
      // ignore
    }
  }, [cfg]);

  useEffect(() => {
    if (!ogCanvasRef.current) return;
    renderOgBannerToCanvas(ogCanvasRef.current, cfg);
  }, [cfg]);

  const audit = useMemo(() => auditSeoConfig(cfg), [cfg]);

  const generatedCode = useMemo(() => {
    if (codeFormat === 'html-meta') return generateHtmlMetaTags(cfg);
    if (codeFormat === 'json-ld') return generateJsonLdSchema(cfg);
    return generateRobotsAndSitemap(cfg);
  }, [cfg, codeFormat]);

  const handleExportOgImage = () => {
    if (!ogCanvasRef.current) return;
    exportOgBannerPng(ogCanvasRef.current, cfg.siteName);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    confetti({ particleCount: 45, spread: 55, origin: { y: 0.6 } });
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus SEO, Meta & OpenGraph Studio Pro (#019)',
      'echo Corpus SEO ve OpenGraph Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5191',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-SEO-Studio-Pro.bat';
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
              <Globe className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus SEO, SERP & OpenGraph Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #019 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Google SERP Önizleme, 1200×630 OpenGraph Kapak Tasarımcısı, Schema.org JSON-LD & Sitemap Üretici
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>On-Page SEO Skoru:</span>
              <strong className="text-emerald-400">%{audit.score} Optimize</strong>
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
          {/* Left: Preset SEO Templates */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {Object.entries(PRESET_SEO_CONFIGS).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => setCfg(tpl.build())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    cfg.id === key
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Copy Meta & Export 1200x630 OG PNG */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              {copied ? 'Kod Panoya Kopyalandı!' : 'Meta / Schema Kodu Kopyala'}
            </button>

            <button
              onClick={handleExportOgImage}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              1200×630 OG Görseli (PNG) İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'meta', label: 'SERP & Meta', icon: Search },
              { id: 'og-design', label: 'OG Görsel', icon: Share2 },
              { id: 'audit', label: `Denetim (%${audit.score})`, icon: ShieldCheck },
              { id: 'code', label: 'HTML & JSON-LD', icon: Code2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as SeoStudioTab)}
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
            {/* TAB 1: META & SERP */}
            {activeTab === 'meta' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Site / Marka Adı
                    </label>
                    <input
                      type="text"
                      value={cfg.siteName}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, siteName: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Odak Anahtar Kelime
                    </label>
                    <input
                      type="text"
                      value={cfg.targetKeyword}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, targetKeyword: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-violet-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Sayfa Kanonik URL Adresi
                  </label>
                  <input
                    type="url"
                    value={cfg.pageUrl}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, pageUrl: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Meta Başlık (`&lt;title&gt;`)</span>
                    <span
                      className={`font-mono ${
                        cfg.metaTitle.length >= 40 && cfg.metaTitle.length <= 65
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {cfg.metaTitle.length} / 60 karakter
                    </span>
                  </div>
                  <input
                    type="text"
                    value={cfg.metaTitle}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, metaTitle: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">
                      Meta Açıklama (`meta description`)
                    </span>
                    <span
                      className={`font-mono ${
                        cfg.metaDescription.length >= 110 &&
                        cfg.metaDescription.length <= 165
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {cfg.metaDescription.length} / 155 karakter
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={cfg.metaDescription}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, metaDescription: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 leading-relaxed"
                  />
                </div>

                {/* Schema.org Rich Snippet Settings */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Schema.org Türü
                    </label>
                    <select
                      value={cfg.schemaType}
                      onChange={(e) =>
                        setCfg((p) => ({
                          ...p,
                          schemaType: e.target.value as SchemaType,
                        }))
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    >
                      <option value="SoftwareApplication">SoftwareApp</option>
                      <option value="Product">Product (Ürün)</option>
                      <option value="Article">Article (Yazı)</option>
                      <option value="Organization">Organization</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Yıldız Puanı (1–5)
                    </label>
                    <input
                      type="text"
                      value={cfg.ratingValue}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, ratingValue: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Yorum Sayısı
                    </label>
                    <input
                      type="text"
                      value={cfg.ratingCount}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, ratingCount: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OPENGRAPH 1200x630 DESIGNER */}
            {activeTab === 'og-design' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    1200 × 630 OpenGraph Kapak Görseli Tasarımcısı
                  </h2>
                  <p className="text-xs text-zinc-400">
                    X/Twitter, LinkedIn, WhatsApp ve Slack paylaşımlarında görünecek kapak görseli
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Üst Rozet Etiketi
                  </label>
                  <input
                    type="text"
                    value={cfg.ogBadge}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, ogBadge: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Büyük Kapak Başlığı (`ogHeadline`)
                  </label>
                  <input
                    type="text"
                    value={cfg.ogHeadline}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, ogHeadline: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Alt Kapak Açıklaması (`ogSubheadline`)
                  </label>
                  <input
                    type="text"
                    value={cfg.ogSubheadline}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, ogSubheadline: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-xs text-zinc-300">Ana Vurgu Rengi</span>
                    <input
                      type="color"
                      value={cfg.themeColor}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, themeColor: e.target.value }))
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-xs text-zinc-300">İkincil Işık Rengi</span>
                    <input
                      type="color"
                      value={cfg.secondaryColor}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, secondaryColor: e.target.value }))
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEO AUDIT */}
            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400">
                      Google Arama & Sosyal Medya Teknik Denetimi
                    </div>
                    <div className="text-base font-bold text-zinc-100">
                      On-Page SEO Uyumluluk Skoru: %{audit.score}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                    {audit.checks.filter((c) => c.passed).length}/{audit.checks.length} Başarılı
                  </span>
                </div>

                <div className="space-y-2">
                  {audit.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-start gap-2.5"
                    >
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-zinc-100">
                          {chk.label}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {chk.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: GENERATED CODE */}
            {activeTab === 'code' && (
              <div className="space-y-3">
                <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 gap-1">
                  {(
                    [
                      { id: 'html-meta', label: 'HTML <head> Meta' },
                      { id: 'json-ld', label: 'Schema.org JSON-LD' },
                      { id: 'robots-sitemap', label: 'robots.txt + sitemap.xml' },
                    ] as { id: CodeFormat; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCodeFormat(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        codeFormat === f.id
                          ? 'bg-violet-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={generatedCode}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Live Google SERP + 1200x630 OpenGraph Card Previews (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Card 1: Google Search (SERP) Rich Result Simulation */}
          <div className="rounded-2xl bg-[#111115] border border-zinc-800/90 p-5 space-y-3 corpus-card-glow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-violet-400" />
                Canlı Google Arama Sonucu (SERP & Rich Snippet Önizlemesi)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Masaüstü & Mobil SERP
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#18181f] border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: cfg.themeColor }}
                >
                  {cfg.siteName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-zinc-100 leading-none">
                    {cfg.siteName}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{cfg.pageUrl}</div>
                </div>
              </div>

              <div className="text-lg font-semibold text-[#8ab4f8] hover:underline cursor-pointer pt-1 leading-snug">
                {cfg.metaTitle}
              </div>

              {/* Rich Snippet Rating Row */}
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-zinc-300">
                  Puan: {cfg.ratingValue} · {cfg.ratingCount} oy
                </span>
                {Number(cfg.priceAmount) > 0 && (
                  <span className="text-emerald-400 font-mono">
                    · {cfg.priceAmount} {cfg.priceCurrency} · Stokta
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">
                {cfg.metaDescription}
              </p>
            </div>
          </div>

          {/* Card 2: Live 1200x630 OpenGraph Social Share Card */}
          <div className="rounded-2xl bg-[#111115] border border-zinc-800/90 p-5 flex-1 flex flex-col gap-3 corpus-card-glow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                X (Twitter), LinkedIn & WhatsApp Büyük Sosyal Medya Kartı (1200 × 630 px)
              </span>
              <button
                onClick={handleExportOgImage}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 cursor-pointer"
              >
                og-image.png İndir →
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 max-w-2xl mx-auto w-full shadow-2xl">
              <canvas
                ref={ogCanvasRef}
                className="w-full h-auto block"
              />
              <div className="p-3.5 bg-[#15151d] border-t border-zinc-800">
                <div className="text-[11px] font-mono text-zinc-400 uppercase">
                  {cfg.pageUrl.replace(/^https?:\/\//, '').split('/')[0]}
                </div>
                <div className="text-sm font-semibold text-zinc-100 mt-0.5 truncate">
                  {cfg.metaTitle}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                  {cfg.metaDescription}
                </div>
              </div>
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
                    Corpus SEO & OpenGraph Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız SERP, Schema & OG Stüdyosu</p>
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
                <span>Canlı Google SERP, Rich Snippet ve 1200×630 OG görsel üretimi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tek tıkla HTML Meta, Schema.org JSON-LD ve Sitemap XML kodu</span>
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
              %100 İstemci Taraflı SERP, Schema.org & OpenGraph Stüdyosu — Verileriniz cihazınızdan çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #019 • Semrush On-Page / Metatags.io Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
