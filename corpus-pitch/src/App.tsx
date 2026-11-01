import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Rocket,
  Download,
  FileSpreadsheet,
  Terminal,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  PieChart,
  DollarSign,
} from 'lucide-react';
import {
  type PitchProject,
  PITCH_PRESETS,
  calculatePitchMetrics,
  renderPitchCanvas,
  exportPitchExcel,
} from './utils/pitchEngine';

export function App() {
  const [project, setProject] = useState<PitchProject>(() =>
    JSON.parse(JSON.stringify(PITCH_PRESETS['series-a-ai-saas']))
  );
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metrics = useMemo(() => calculatePitchMetrics(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderPitchCanvas(canvasRef.current, project);
  }, [project]);

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-InvestorDeck.png`;
    a.click();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const batContent = `@echo off
title Corpus Pitch & Cap Table Studio (#029 PRO)
echo Starting Corpus Pitch Studio on http://localhost:5201 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-pitch"
start http://localhost:5201
npm run dev -- --port 5201
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS PITCH & CAP TABLE STUDIO
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                #029 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Yatırımcı Sunumu, Pre/Post-Money Cap Table Seyrelme, TAM/SAM/SOM & Runway Stüdyosu
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Post-Money:</span>
            <span className="font-bold text-emerald-400">${metrics.postMoneyM}M</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-zinc-400">Seyrelme (Dilution):</span>
            <span className="font-bold text-rose-400">%{metrics.newInvestorDilution}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-zinc-400">Runway:</span>
            <span className="font-bold text-sky-400">{metrics.runwayMonths} Ay</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={() => exportPitchExcel(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Cap Table (.XLSX)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K Yatırımcı Kartı İndir</span>
          </button>
        </div>
      </header>

      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase text-zinc-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Yatırım Senaryoları:
        </span>
        <button
          onClick={() =>
            setProject(JSON.parse(JSON.stringify(PITCH_PRESETS['series-a-ai-saas'])))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium border ${
            project.id === 'series-a-ai-saas'
              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          🦄 Seri A — Corpus Cloud AI ($32M Pre-Money / $8M Yatırım)
        </button>
        <button
          onClick={() =>
            setProject(JSON.parse(JSON.stringify(PITCH_PRESETS['seed-fintech-infra'])))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium border ${
            project.id === 'seed-fintech-infra'
              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          💸 Tohum Turu (Seed) — NovaLedger FinTech ($12M Pre-Money / $3M Yatırım)
        </button>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <aside className="lg:col-span-4 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="text-xs font-bold text-purple-400 uppercase">
              1. Girişim & Yatırım Turu Parametreleri
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Girişim Adı</label>
                <input
                  type="text"
                  value={project.companyName}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, companyName: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Yatırım Turu</label>
                <input
                  type="text"
                  value={project.roundName}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, roundName: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-purple-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Pre-Money Değerleme ($M)
                </label>
                <input
                  type="number"
                  min={1}
                  value={project.preMoneyValuationM}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      preMoneyValuationM: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Talep Edilen Yatırım ($M)
                </label>
                <input
                  type="number"
                  min={0.2}
                  step={0.5}
                  value={project.investmentAskM}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      investmentAskM: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Mevcut ARR ($M)</label>
                <input
                  type="number"
                  step={0.1}
                  value={project.currentArrM}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, currentArrM: Number(e.target.value) }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">YoY Büyüme (%)</label>
                <input
                  type="number"
                  value={project.yoyGrowthPercent}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      yoyGrowthPercent: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-sky-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Aylık Burn ($K)</label>
                <input
                  type="number"
                  value={project.monthlyBurnK}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      monthlyBurnK: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-sky-400 uppercase">
              2. Pazar Büyüklüğü (TAM / SAM / SOM)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block">TAM ($ Milyar)</label>
                <input
                  type="number"
                  value={project.tamBillion}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, tamBillion: Number(e.target.value) }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block">SAM ($ Milyar)</label>
                <input
                  type="number"
                  value={project.samBillion}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, samBillion: Number(e.target.value) }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block">SOM ($ Milyon)</label>
                <input
                  type="number"
                  value={project.somMillion}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, somMillion: Number(e.target.value) }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs font-mono text-emerald-400"
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
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
                Masaüstü .BAT Başlatıcı (#029 Corpus Pitch)
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
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5"
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
