import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Share2,
  Download,
  Code2,
  Sparkles,
  Palette,
  Type,
  BarChart3,
  Terminal,
  Copy,
  Check,
  Monitor,
  FileJson,
  Globe,
} from 'lucide-react';
import {
  type SocialBannerProject,
  type SocialPlatformId,
  type PatternOverlay,
  PLATFORM_SPECS,
  SOCIAL_THEMES,
  SOCIAL_PRESETS,
  renderSocialCanvas,
  generateOpenGraphMetaTags,
} from './utils/socialEngine';

export function App() {
  const [project, setProject] = useState<SocialBannerProject>(() =>
    JSON.parse(JSON.stringify(SOCIAL_PRESETS['saas-launch-og']))
  );
  const [activeTab, setActiveTab] = useState<'copy' | 'widgets' | 'theme' | 'meta'>('copy');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activePlatform = useMemo(
    () =>
      PLATFORM_SPECS.find((p) => p.id === project.platformId) || PLATFORM_SPECS[0],
    [project.platformId]
  );

  const metaTagsHtml = useMemo(() => generateOpenGraphMetaTags(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderSocialCanvas(canvasRef.current, project);
  }, [project]);

  const handleLoadPreset = (key: string) => {
    const preset = SOCIAL_PRESETS[key];
    if (!preset) return;
    setProject(JSON.parse(JSON.stringify(preset)));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpus-social-${project.platformId}-${activePlatform.width}x${activePlatform.height}.png`;
    a.click();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpus-social-${project.platformId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const batContent = `@echo off
title Corpus Social & OpenGraph Studio (#025 PRO)
echo Starting Corpus Social Studio on http://localhost:5197 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-social"
start http://localhost:5197
npm run dev -- --port 5197
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS SOCIAL & OPENGRAPH STUDIO
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
                #025 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Çoklu Platform Sosyal Medya Görseli, Ürün Lansman Kartı & OpenGraph (`og:image`) Stüdyosu
            </p>
          </div>
        </div>

        {/* Active Dimension Pill */}
        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-zinc-400">Platform:</span>
            <span className="font-bold text-white">{activePlatform.name}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Çözünürlük:</span>
            <span className="font-mono font-bold text-cyan-400">
              {activePlatform.width}×{activePlatform.height}px
            </span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">HTML Meta:</span>
            <span className="font-bold text-emerald-400">OG + Twitter Hazır</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 transition"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-fuchsia-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG İndir ({activePlatform.width}×{activePlatform.height})</span>
          </button>
        </div>
      </header>

      {/* TOP PLATFORM & PRESET BAR */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mr-1">
            Format & Boyut:
          </span>
          {PLATFORM_SPECS.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setProject((prev) => ({
                  ...prev,
                  platformId: p.id as SocialPlatformId,
                }))
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                project.platformId === p.id
                  ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.name} <span className="opacity-70 font-mono">({p.width}×{p.height})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Şablonlar:
          </span>
          {[
            { id: 'saas-launch-og', label: '🚀 SaaS Lansman OG' },
            { id: 'fintech-case-study', label: '📈 FinTech Vaka Analizi' },
            { id: 'ai-developer-post', label: '🧠 AI / RAG Kare Post' },
          ].map((pr) => (
            <button
              key={pr.id}
              onClick={() => handleLoadPreset(pr.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                project.id === pr.id
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT EDITOR PANEL (4 COLS) */}
        <aside className="lg:col-span-4 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[calc(100vh-112px)]">
          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
            {[
              { id: 'copy', label: 'Metin & CTA', icon: Type },
              { id: 'widgets', label: 'KPI & Kod', icon: BarChart3 },
              { id: 'theme', label: 'Tema & Desen', icon: Palette },
              { id: 'meta', label: 'OG Meta Kod', icon: Code2 },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === t.id
                      ? 'bg-fuchsia-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'copy' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Üst Rozet (Pill Badge)</label>
                  <input
                    type="text"
                    value={project.badgeText}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, badgeText: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-fuchsia-300"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Ana Başlık (Headline)
                  </label>
                  <textarea
                    rows={3}
                    value={project.headline}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, headline: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold text-white resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Alt Açıklama (Subheadline)
                  </label>
                  <textarea
                    rows={3}
                    value={project.subheadline}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, subheadline: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">CTA Buton Metni</label>
                    <input
                      type="text"
                      value={project.ctaText}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, ctaText: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Alan Adı / URL</label>
                    <input
                      type="text"
                      value={project.domainUrl}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, domainUrl: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Yazar / Marka Adı</label>
                    <input
                      type="text"
                      value={project.authorName}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, authorName: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Unvan / Slogan</label>
                    <input
                      type="text"
                      value={project.authorRole}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, authorRole: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'widgets' && (
              <div className="space-y-4">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">
                    3'lü Canlı KPI & Metrik Rozetleri
                  </div>
                  {project.stats.map((st, idx) => (
                    <div key={st.id} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={st.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProject((prev) => ({
                            ...prev,
                            stats: prev.stats.map((item, i) =>
                              i === idx ? { ...item, label: val } : item
                            ),
                          }));
                        }}
                        placeholder="Etiket"
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400"
                      />
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProject((prev) => ({
                            ...prev,
                            stats: prev.stats.map((item, i) =>
                              i === idx ? { ...item, value: val } : item
                            ),
                          }));
                        }}
                        placeholder="Değer"
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-400"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Sağ 3B Pencere Kod / Terminal İçeriği
                    </span>
                    <input
                      type="checkbox"
                      checked={project.showBrowserMockup}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          showBrowserMockup: e.target.checked,
                        }))
                      }
                      className="accent-fuchsia-500 w-4 h-4"
                    />
                  </div>
                  <textarea
                    rows={5}
                    value={project.codeSnippet}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, codeSnippet: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-cyan-300 resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">
                    Stüdyo Atmosfer Teması
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SOCIAL_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          setProject((prev) => ({ ...prev, themeId: t.id }))
                        }
                        className={`p-3 rounded-xl border text-left transition ${
                          project.themeId === t.id
                            ? 'border-fuchsia-500 bg-fuchsia-500/10'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: t.accent }}
                          />
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: t.secondary }}
                          />
                        </div>
                        <div className="text-xs font-semibold text-white">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Arka Plan Geometrik Doku
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'grid', label: 'Mimari Izgara (Grid)' },
                        { id: 'dots', label: 'Nokta Matrisi (Dots)' },
                        { id: 'rings', label: 'Radyal Halkalar (Rings)' },
                        { id: 'none', label: 'Saf Gradyan (Temiz)' },
                      ] as { id: PatternOverlay; label: string }[]
                    ).map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() =>
                          setProject((prev) => ({ ...prev, pattern: pat.id }))
                        }
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition ${
                          project.pattern === pat.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {pat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meta' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Otomatik HTML OpenGraph & Twitter Card Etiketleri
                  </span>
                  <button
                    onClick={() => copyToClipboard('meta', metaTagsHtml)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
                  >
                    {copiedKey === 'meta' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Kopyala</span>
                  </button>
                </div>
                <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                  {metaTagsHtml}
                </pre>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT LIVE CANVAS & SOCIAL FEED PREVIEW (8 COLS) */}
        <section className="lg:col-span-8 bg-[#070709] p-6 overflow-y-auto h-[calc(100vh-112px)] flex flex-col items-center justify-between space-y-6">
          <div className="w-full flex items-center justify-between text-xs text-zinc-400">
            <span>
              <strong>{activePlatform.name}</strong> — {activePlatform.desc}
            </span>
            <span className="font-mono text-fuchsia-400">{activePlatform.ratioLabel}</span>
          </div>

          {/* Scaled Canvas Container */}
          <div className="w-full flex-1 flex items-center justify-center">
            <div
              className="rounded-2xl overflow-hidden border border-zinc-800/90 shadow-2xl shadow-black/90 bg-zinc-950"
              style={{
                maxWidth:
                  activePlatform.height > activePlatform.width ? '390px' : '920px',
                width: '100%',
              }}
            >
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {/* Bottom Social Feed Link Card Simulation */}
          <div className="w-full bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <div className="text-[11px] font-mono text-fuchsia-400">
                https://{project.domainUrl}
              </div>
              <div className="font-bold text-white">{project.headline}</div>
              <div className="text-zinc-400 truncate max-w-2xl">{project.subheadline}</div>
            </div>
            <button
              onClick={handleExportPNG}
              className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yüksek Çözünürlüklü PNG İndir</span>
            </button>
          </div>
        </section>
      </main>

      {/* .BAT DESKTOP LAUNCHER MODAL */}
      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-fuchsia-400" />
                <h3 className="font-bold text-sm text-white">
                  Masaüstü .BAT Başlatıcı (#025 Corpus Social)
                </h3>
              </div>
              <button
                onClick={() => setShowLauncherModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Kapat ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Aşağıdaki komutu <code className="text-fuchsia-400">corpus-social.bat</code> olarak
              kaydederek <strong>5197</strong> portunda başlatabilirsiniz:
            </p>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 font-mono overflow-x-auto">
              {batContent}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => copyToClipboard('bat', batContent)}
                className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedKey === 'bat' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'bat' ? 'Kopyalandı!' : '.BAT Kodunu Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
