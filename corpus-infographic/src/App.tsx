import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  LayoutGrid,
  Plus,
  Trash2,
  Download,
  Terminal,
  Copy,
  Check,
  GitCommitHorizontal,
  TableProperties,
  Workflow,
} from 'lucide-react';
import {
  type InfographicProject,
  type InfographicLayout,
  type ComparisonRow,
  INFOGRAPHIC_PRESETS,
  INFO_THEMES,
  renderInfographicCanvas,
} from './utils/infographicEngine';

export function App() {
  const [project, setProject] = useState<InfographicProject>(() =>
    JSON.parse(JSON.stringify(INFOGRAPHIC_PRESETS['saas-battlecard']))
  );
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderInfographicCanvas(canvasRef.current, project);
  }, [project]);

  const handleAddComparisonRow = () => {
    const newRow: ComparisonRow = {
      id: `r-${Date.now().toString().slice(-4)}`,
      feature: 'Yeni Karşılaştırma Kriteri',
      category: 'AVANTAJ',
      ourValue: '✓ Tam Destek & Otomasyon',
      compAValue: '✕ Ek Ücretli Eklenti',
      compBValue: '✕ Desteklenmiyor',
      ourScore: 10,
    };
    setProject((prev) => ({
      ...prev,
      rows: [...prev.rows, newRow],
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-${project.layout}-4K.png`;
    a.click();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const batContent = `@echo off
title Corpus Infographic & Comparison Studio (#033 PRO)
echo Starting Corpus Infographic Studio on http://localhost:5205 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-infographic"
start http://localhost:5205
npm run dev -- --port 5205
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS INFOGRAPHIC, TIMELINE & BATTLECARD
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                #033 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Rakip Karşılaştırma Matrisi ("Biz vs. Rakipler"), Kronolojik Tarihçe & Süreç İnfografiği Stüdyosu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K İnfografik İndir</span>
          </button>
        </div>
      </header>

      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase text-zinc-400">
            İnfografik Modu:
          </span>
          {(
            [
              {
                id: 'battlecard',
                label: '1. Rakip Karşılaştırma Matrisi (Battlecard)',
                icon: TableProperties,
              },
              {
                id: 'timeline',
                label: '2. Kronolojik Ürün & Şirket Tarihçesi',
                icon: GitCommitHorizontal,
              },
              {
                id: 'process-steps',
                label: '3. Adım Adım Mimari Süreç Kartları',
                icon: Workflow,
              },
            ] as { id: InfographicLayout; label: string; icon: typeof TableProperties }[]
          ).map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setProject((p) => ({ ...p, layout: m.id }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  project.layout === m.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {INFO_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setProject((p) => ({ ...p, themeId: t.id }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                project.themeId === t.id
                  ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                İnfografik Ana Başlığı
              </label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                Alt Sonuç / Yönetici Özeti Mesajı
              </label>
              <input
                type="text"
                value={project.bottomCallout}
                onChange={(e) =>
                  setProject((p) => ({ ...p, bottomCallout: e.target.value }))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-amber-300"
              />
            </div>
          </div>

          {project.layout === 'battlecard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase">
                  Karşılaştırma Satırları ({project.rows.length})
                </span>
                <button
                  onClick={handleAddComparisonRow}
                  className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Kriter Ekle
                </button>
              </div>
              {project.rows.map((r) => (
                <div
                  key={r.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={r.feature}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          rows: prev.rows.map((item) =>
                            item.id === r.id ? { ...item, feature: e.target.value } : item
                          ),
                        }))
                      }
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-bold text-white"
                    />
                    <button
                      onClick={() =>
                        setProject((prev) => ({
                          ...prev,
                          rows: prev.rows.filter((item) => item.id !== r.id),
                        }))
                      }
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={r.ourValue}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          rows: prev.rows.map((item) =>
                            item.id === r.id ? { ...item, ourValue: e.target.value } : item
                          ),
                        }))
                      }
                      className="bg-zinc-950 border border-emerald-500/40 rounded px-2 py-1 text-xs text-emerald-300"
                    />
                    <input
                      type="text"
                      value={r.compAValue}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          rows: prev.rows.map((item) =>
                            item.id === r.id
                              ? { ...item, compAValue: e.target.value }
                              : item
                          ),
                        }))
                      }
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-rose-300"
                    />
                    <input
                      type="text"
                      value={r.compBValue}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          rows: prev.rows.map((item) =>
                            item.id === r.id
                              ? { ...item, compBValue: e.target.value }
                              : item
                          ),
                        }))
                      }
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {project.layout === 'timeline' && (
            <div className="space-y-2.5">
              {project.timeline.map((node) => (
                <div
                  key={node.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={node.period}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          timeline: prev.timeline.map((n) =>
                            n.id === node.id ? { ...n, period: e.target.value } : n
                          ),
                        }))
                      }
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-amber-400"
                    />
                    <input
                      type="text"
                      value={node.title}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          timeline: prev.timeline.map((n) =>
                            n.id === node.id ? { ...n, title: e.target.value } : n
                          ),
                        }))
                      }
                      className="col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-bold text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={node.description}
                    onChange={(e) =>
                      setProject((prev) => ({
                        ...prev,
                        timeline: prev.timeline.map((n) =>
                          n.id === node.id ? { ...n, description: e.target.value } : n
                        ),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                  />
                </div>
              ))}
            </div>
          )}

          {project.layout === 'process-steps' && (
            <div className="space-y-2.5">
              {project.steps.map((st) => (
                <div
                  key={st.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={st.stepNo}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          steps: prev.steps.map((s) =>
                            s.id === st.id ? { ...s, stepNo: e.target.value } : s
                          ),
                        }))
                      }
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-amber-400"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          steps: prev.steps.map((s) =>
                            s.id === st.id ? { ...s, title: e.target.value } : s
                          ),
                        }))
                      }
                      className="col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-bold text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={st.detail}
                    onChange={(e) =>
                      setProject((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) =>
                          s.id === st.id ? { ...s, detail: e.target.value } : s
                        ),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                  />
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </section>
      </main>

      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Masaüstü .BAT Başlatıcı (#033 Corpus Infographic)
              </h3>
              <button
                onClick={() => setShowLauncherModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Kapat ✕
              </button>
            </div>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 font-mono overflow-x-auto">
              {batContent}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(batContent);
                  setCopiedBat(true);
                  setTimeout(() => setCopiedBat(false), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedBat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBat ? 'Kopyalandı!' : '.BAT Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
