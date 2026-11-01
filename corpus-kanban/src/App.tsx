import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Kanban,
  CalendarRange,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  DEFAULT_SPRINT_BOARD,
  PRESET_SPRINTS,
  STATUS_COLUMNS,
  PRIORITY_META,
  type SprintBoard,
  type SprintTask,
  type TaskStatus,
  type TaskPriority,
  calculateSprintMetrics,
  exportSprintToExcel,
  renderSprintRoadmapToCanvas,
  exportSprintRoadmapPng,
} from './utils/kanbanEngine';

type WorkspaceMode = 'kanban-board' | 'gantt-canvas';

export default function App() {
  const [board, setBoard] = useState<SprintBoard>(() => {
    try {
      const saved = localStorage.getItem('corpus_kanban_board_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SPRINT_BOARD;
    } catch {
      return DEFAULT_SPRINT_BOARD;
    }
  });

  const [mode, setMode] = useState<WorkspaceMode>('kanban-board');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    () => board.tasks[0]?.id || ''
  );
  const [zoom, setZoom] = useState<number>(0.54);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Embedded Pomodoro Focus Timer (25 min = 1500 sec)
  const [pomoSeconds, setPomoSeconds] = useState<number>(1500);
  const [pomoRunning, setPomoRunning] = useState<boolean>(false);

  const ganttCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_kanban_board_v1', JSON.stringify(board));
    } catch {
      // ignore
    }
  }, [board]);

  useEffect(() => {
    if (!pomoRunning) return;
    const id = setInterval(() => {
      setPomoSeconds((s) => {
        if (s <= 1) {
          setPomoRunning(false);
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          return 1500;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomoRunning]);

  useEffect(() => {
    if (!ganttCanvasRef.current) return;
    renderSprintRoadmapToCanvas(ganttCanvasRef.current, board);
  }, [board, mode]);

  const metrics = useMemo(() => calculateSprintMetrics(board), [board]);

  const selectedTask = useMemo(
    () => board.tasks.find((t) => t.id === selectedTaskId) || board.tasks[0] || null,
    [board.tasks, selectedTaskId]
  );

  const handleAddTask = () => {
    const nextNum = board.tasks.length + 101;
    const newTask: SprintTask = {
      id: `tsk-${Date.now()}`,
      code: `CRP-${nextNum}`,
      title: 'Yeni Sprint Görevi / Özellik Geliştirmesi',
      assignee: 'Ekip Üyesi',
      tag: 'Feature',
      status: 'backlog',
      priority: 'medium',
      storyPoints: 5,
      startDay: 3,
      durationDays: 4,
    };
    setBoard((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    setSelectedTaskId(newTask.id);
  };

  const handleUpdateTask = (id: string, patch: Partial<SprintTask>) => {
    setBoard((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const handleAdvanceStatus = (task: SprintTask) => {
    const order: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];
    handleUpdateTask(task.id, { status: nextStatus });
    if (nextStatus === 'done') {
      confetti({ particleCount: 45, spread: 50, origin: { y: 0.6 } });
    }
  };

  const handleExportExcel = () => {
    exportSprintToExcel(board);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportGanttPng = () => {
    if (!ganttCanvasRef.current) return;
    renderSprintRoadmapToCanvas(ganttCanvasRef.current, board);
    exportSprintRoadmapPng(ganttCanvasRef.current, board.sprintName);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Kanban, Sprint & Gantt Studio Pro (#016)',
      'echo Corpus Proje, Kanban ve Gantt Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5188',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Kanban-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <Kanban className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Kanban, Sprint & Gantt Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #016 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Çevik Kanban Panosu, 14 Günlük Gantt Zaman Çizelgesi, Story Point Velocity & Pomodoro Odak Sayacı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Embedded Pomodoro Focus Timer Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-200 font-semibold">
                {formatTimer(pomoSeconds)}
              </span>
              <button
                onClick={() => setPomoRunning((r) => !r)}
                className="p-1 text-violet-400 hover:text-violet-300 cursor-pointer"
                title={pomoRunning ? 'Duraklat' : 'Odak Sayacını Başlat'}
              >
                {pomoRunning ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => {
                  setPomoRunning(false);
                  setPomoSeconds(1500);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Sayacı Sıfırla"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Sprint İlerlemesi:</span>
              <strong className="text-emerald-400">
                %{metrics.completionPercent} ({metrics.completedPoints}/{metrics.totalPoints} SP)
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
          {/* Left: Sprint Template & Workspace View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {Object.entries(PRESET_SPRINTS).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => {
                    const next = tpl.build();
                    setBoard(next);
                    setSelectedTaskId(next.tasks[0]?.id || '');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    board.id === key
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              <button
                onClick={() => setMode('kanban-board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  mode === 'kanban-board'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Kanban Sütun Görünümü
              </button>
              <button
                onClick={() => setMode('gantt-canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  mode === 'gantt-canvas'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                4K Gantt Zaman Çizelgesi
              </button>
            </div>
          </div>

          {/* Right: Export Excel & 4K Gantt PNG */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.XLSX) İndir
            </button>

            <button
              onClick={handleExportGanttPng}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              4K Gantt & Sprint Raporu İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Task Inspector & Sprint Editor (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl bg-[#111115] border border-zinc-800/90 p-4 sm:p-5 flex-1 flex flex-col gap-4 corpus-card-glow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Sprint & Görev Denetçisi
                </h2>
                <p className="text-xs text-zinc-400">
                  Görev detaylarını, efor puanını ve Gantt günlerini düzenleyin
                </p>
              </div>
              <button
                onClick={handleAddTask}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Görev
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Sprint Başlığı
                </label>
                <input
                  type="text"
                  value={board.sprintName}
                  onChange={(e) =>
                    setBoard((p) => ({ ...p, sprintName: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Sprint Hedefi
                </label>
                <input
                  type="text"
                  value={board.sprintGoal}
                  onChange={(e) =>
                    setBoard((p) => ({ ...p, sprintGoal: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                />
              </div>
            </div>

            {selectedTask && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-300">
                    {selectedTask.code}
                  </span>
                  <button
                    onClick={() =>
                      setBoard((prev) => ({
                        ...prev,
                        tasks: prev.tasks.filter((t) => t.id !== selectedTask.id),
                      }))
                    }
                    className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Görevi Sil
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Görev Başlığı
                  </label>
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) =>
                      handleUpdateTask(selectedTask.id, { title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Sorumlu Kişi
                    </label>
                    <input
                      type="text"
                      value={selectedTask.assignee}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, {
                          assignee: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Modül / Etiket
                    </label>
                    <input
                      type="text"
                      value={selectedTask.tag}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, { tag: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Durum
                    </label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, {
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    >
                      {STATUS_COLUMNS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Öncelik
                    </label>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, {
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    >
                      {Object.entries(PRIORITY_META).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Efor (SP)
                    </label>
                    <select
                      value={selectedTask.storyPoints}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, {
                          storyPoints: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100"
                    >
                      {[1, 2, 3, 5, 8, 13].map((sp) => (
                        <option key={sp} value={sp}>
                          {sp} SP
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gantt Timeline Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Başlangıç Günü</span>
                      <span className="font-mono text-violet-300">
                        Gün {selectedTask.startDay}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={selectedTask.startDay}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, {
                          startDay: Number(e.target.value),
                        })
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Süre (Gün)</span>
                      <span className="font-mono text-violet-300">
                        {selectedTask.durationDays} Gün
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={selectedTask.durationDays}
                      onChange={(e) =>
                        handleUpdateTask(selectedTask.id, {
                          durationDays: Number(e.target.value),
                        })
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Workspace: Interactive 4-Column Kanban OR 4K Gantt Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {mode === 'kanban-board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 flex-1">
              {STATUS_COLUMNS.map((col) => {
                const colTasks = board.tasks.filter((t) => t.status === col.id);
                const colPoints = colTasks.reduce((a, b) => a + b.storyPoints, 0);

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = e.dataTransfer.getData('text/plain');
                      if (draggedId) {
                        handleUpdateTask(draggedId, { status: col.id });
                      }
                    }}
                    className="rounded-2xl bg-[#111115] border border-zinc-800/90 p-3 flex flex-col gap-2.5 min-h-[540px] corpus-card-glow"
                  >
                    <div
                      className="pb-2.5 border-b border-zinc-800 flex items-center justify-between"
                      style={{ borderTop: `3px solid ${col.color}`, paddingTop: 8 }}
                    >
                      <span className="text-xs font-semibold text-zinc-100">
                        {col.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                        {colTasks.length} • {colPoints} SP
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {colTasks.map((task) => {
                        const prio = PRIORITY_META[task.priority];
                        const isSelected = selectedTask?.id === task.id;
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) =>
                              e.dataTransfer.setData('text/plain', task.id)
                            }
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2 ${
                              isSelected
                                ? 'bg-violet-500/10 border-violet-500/50 shadow-lg'
                                : 'bg-zinc-950/90 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-violet-300">
                                {task.code}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  color: prio.color,
                                  backgroundColor: prio.bg,
                                }}
                              >
                                {prio.label}
                              </span>
                            </div>

                            <div className="text-xs font-medium text-zinc-100 leading-snug">
                              {task.title}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/70">
                              <span>👤 {task.assignee}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-900 font-mono text-[10px] text-zinc-300">
                                  {task.storyPoints} SP
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdvanceStatus(task);
                                  }}
                                  className="p-1 rounded bg-zinc-900 hover:bg-violet-600 text-zinc-300 hover:text-white cursor-pointer"
                                  title="Sonraki Sütuna Taşı"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
                <span className="text-xs font-medium text-zinc-200">
                  Canlı 4K Sprint Gantt Zaman Çizelgesi (1440 × 860 px)
                </span>
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

              <div className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-4 overflow-auto flex justify-center items-center min-h-[500px] corpus-card-glow">
                <div
                  style={{
                    width: 1440 * zoom,
                    height: 860 * zoom,
                  }}
                  className="relative shadow-2xl rounded-xl overflow-hidden border border-zinc-800"
                >
                  <canvas
                    ref={ganttCanvasRef}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas when in Kanban view so 4K PNG export works anytime */}
          {mode === 'kanban-board' && (
            <canvas ref={ganttCanvasRef} className="hidden" />
          )}
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
                    Corpus Kanban & Gantt Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız Çevik Proje & Sprint Stüdyosu</p>
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
                <span>Sürükle-bırak Kanban panosu ve 14 günlük 4K Gantt Zaman Çizelgesi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tamamen yerel çalışır, proje planlarınız cihazınızdan dışarı çıkmaz</span>
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
              %100 İstemci Taraflı Çevik Sprint & Gantt Motoru — Proje verileriniz hiçbir sunucuya gönderilmez.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #016 • Linear / Jira / Trello Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
