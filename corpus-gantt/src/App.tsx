import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CalendarRange,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileCode,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Flame,
  Flag,
  Target,
} from 'lucide-react';
import {
  type GanttProject,
  type GanttTask,
  GANTT_PRESETS,
  GANTT_THEMES,
  calculateGanttMetrics,
  renderGanttCanvas,
  exportGanttExcel,
} from './utils/ganttEngine';

export function App() {
  const [project, setProject] = useState<GanttProject>(() =>
    JSON.parse(JSON.stringify(GANTT_PRESETS['cloud-migration']))
  );
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metrics = useMemo(() => calculateGanttMetrics(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderGanttCanvas(canvasRef.current, project);
  }, [project]);

  const handleAddTask = () => {
    const idx = project.tasks.length + 1;
    const newTask: GanttTask = {
      id: `task-${Date.now().toString().slice(-4)}`,
      code: `WBS-4.${idx}`,
      phase: 'Faz 4: Genişleme',
      title: 'Yeni Sprint Teslimatı & Entegrasyon',
      owner: 'Core Team',
      startWeek: Math.min(project.totalWeeks - 2, 10),
      durationWeeks: 3,
      progress: 20,
      dependsOn: project.tasks[project.tasks.length - 1]?.id || null,
      isMilestone: false,
      isCritical: false,
      color: '#06b6d4',
    };
    setProject((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (id: string, patch: Partial<GanttTask>) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const deleteTask = (id: string) => {
    if (project.tasks.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-Gantt.png`;
    a.click();
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
  };

  const batContent = `@echo off
title Corpus Gantt & Roadmap Studio (#026 PRO)
echo Starting Corpus Gantt Studio on http://localhost:5198 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-gantt"
start http://localhost:5198
npm run dev -- --port 5198
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CalendarRange className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS GANTT & ROADMAP STUDIO
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                #026 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Kritik Yol (CPM), Görev Bağımlılıkları, Kilometre Taşları & 4K Zaman Çizelgesi Stüdyosu
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-zinc-400">Kritik Yol:</span>
            <span className="font-bold text-rose-400">{metrics.criticalTasks} Görev</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Kilometre Taşı:</span>
            <span className="font-bold text-amber-400">{metrics.milestones}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Ort. İlerleme:</span>
            <span className="font-bold text-emerald-400">%{metrics.avgProgress}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={() => exportGanttExcel(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.XLSX)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K Gantt İndir</span>
          </button>
        </div>
      </header>

      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Hazır Program Şablonları:
          </span>
          <button
            onClick={() =>
              setProject(JSON.parse(JSON.stringify(GANTT_PRESETS['cloud-migration'])))
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              project.id === 'cloud-migration'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            ☁️ Multi-Region Kubernetes Bulut Göçü (20 Hafta)
          </button>
          <button
            onClick={() =>
              setProject(JSON.parse(JSON.stringify(GANTT_PRESETS['ai-product-launch'])))
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              project.id === 'ai-product-launch'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            🚀 Corpus AI Copilot 3.0 Lansman Yol Haritası (16 Hafta)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Tema:</span>
          {GANTT_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setProject((p) => ({ ...p, themeId: t.id }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                project.themeId === t.id
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
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
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2.5">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Program / Yol Haritası Başlığı</label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Program Yöneticisi</label>
                <input
                  type="text"
                  value={project.manager}
                  onChange={(e) => setProject((p) => ({ ...p, manager: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Toplam Hafta</label>
                <input
                  type="number"
                  min={8}
                  max={36}
                  value={project.totalWeeks}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, totalWeeks: Number(e.target.value) }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Aktif Hafta (Bugün)</label>
                <input
                  type="number"
                  min={1}
                  max={project.totalWeeks}
                  value={project.currentWeek}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, currentWeek: Number(e.target.value) }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Görevler & Kilometre Taşları ({project.tasks.length})
            </span>
            <button
              onClick={handleAddTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Görev Ekle</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask(task.id, { title: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-semibold text-white"
                  />
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-zinc-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Başlangıç (W)</label>
                    <input
                      type="number"
                      min={1}
                      max={project.totalWeeks}
                      value={task.startWeek}
                      onChange={(e) =>
                        updateTask(task.id, { startWeek: Number(e.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Süre (Hafta)</label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={task.durationWeeks}
                      onChange={(e) =>
                        updateTask(task.id, { durationWeeks: Number(e.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">İlerleme (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={task.progress}
                      onChange={(e) =>
                        updateTask(task.id, { progress: Number(e.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Sorumlu Ekip</label>
                    <input
                      type="text"
                      value={task.owner}
                      onChange={(e) => updateTask(task.id, { owner: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-300">
                    <input
                      type="checkbox"
                      checked={task.isCritical}
                      onChange={(e) =>
                        updateTask(task.id, { isCritical: e.target.checked })
                      }
                      className="accent-rose-500"
                    />
                    <span>Kritik Yol (CPM)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-300">
                    <input
                      type="checkbox"
                      checked={task.isMilestone}
                      onChange={(e) =>
                        updateTask(task.id, { isMilestone: e.target.checked })
                      }
                      className="accent-amber-500"
                    />
                    <span>♦ Kilometre Taşı</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Canlı 4K (1920×1080) Gantt Zaman Çizelgesi & Kaynak Kapasite Matrisi</span>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(project, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.id}-gantt.json`;
                a.click();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" /> JSON İndir
            </button>
          </div>

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
                Masaüstü .BAT Başlatıcı (#026 Corpus Gantt)
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
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold flex items-center gap-1.5"
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
