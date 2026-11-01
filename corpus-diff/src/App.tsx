import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  GitCompare,
  Download,
  FileDiff,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  type DiffProject,
  type ReviewVerdict,
  DIFF_PRESETS,
  computeLineDiff,
  generateUnifiedPatch,
  renderDiffCanvas,
} from './utils/diffEngine';

export function App() {
  const [project, setProject] = useState<DiffProject>(() =>
    JSON.parse(JSON.stringify(DIFF_PRESETS['auth-jwt-hardening']))
  );
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentLine, setNewCommentLine] = useState('L10');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const diffLines = useMemo(
    () => computeLineDiff(project.oldText, project.newText),
    [project.oldText, project.newText]
  );

  const unifiedPatch = useMemo(
    () => generateUnifiedPatch(project, diffLines),
    [project, diffLines]
  );

  const stats = useMemo(() => {
    const added = diffLines.filter((d) => d.type === 'add').length;
    const removed = diffLines.filter((d) => d.type === 'remove').length;
    return { added, removed };
  }, [diffLines]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderDiffCanvas(canvasRef.current, project, diffLines);
  }, [project, diffLines]);

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-CodeReview.png`;
    a.click();
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
  };

  const handleExportPatch = () => {
    const blob = new Blob([unifiedPatch], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    setProject((prev) => ({
      ...prev,
      comments: [
        ...prev.comments,
        {
          id: `c-${Date.now()}`,
          lineRef: newCommentLine,
          severity: 'warning',
          author: prev.reviewer,
          message: newCommentText.trim(),
        },
      ],
    }));
    setNewCommentText('');
  };

  const batContent = `@echo off
title Corpus Diff & Code Review Studio (#027 PRO)
echo Starting Corpus Diff Studio on http://localhost:5199 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-diff"
start http://localhost:5199
npm run dev -- --port 5199
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS DIFF & CODE REVIEW STUDIO
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                #027 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              LCS Satır Karşılaştırma, Güvenlik Kod İncelemesi, Git `.patch` & 4K PR Raporu Stüdyosu
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
          <span className="text-emerald-400 font-bold">+{stats.added} Eklendi</span>
          <div className="w-px h-3.5 bg-zinc-800" />
          <span className="text-rose-400 font-bold">-{stats.removed} Silindi</span>
          <div className="w-px h-3.5 bg-zinc-800" />
          <span className="text-sky-400 font-bold">{project.verdict}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleExportPatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-emerald-300 font-semibold"
          >
            <FileDiff className="w-3.5 h-3.5" />
            <span>.PATCH İndir</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K PR Raporu İndir</span>
          </button>
        </div>
      </header>

      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Hazır PR İnceleme Şablonları:
          </span>
          <button
            onClick={() =>
              setProject(JSON.parse(JSON.stringify(DIFF_PRESETS['auth-jwt-hardening'])))
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              project.id === 'auth-jwt-hardening'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            🔐 PR #1482: JWT İmza Doğrulaması (TypeScript)
          </button>
          <button
            onClick={() =>
              setProject(JSON.parse(JSON.stringify(DIFF_PRESETS['k8s-autoscaler-yaml'])))
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              project.id === 'k8s-autoscaler-yaml'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            ☸️ PR #1509: Kubernetes HPA Ölçekleme (YAML)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Karar (Verdict):</span>
          {(['APPROVED', 'CHANGES_REQUESTED', 'SECURITY_BLOCK'] as ReviewVerdict[]).map(
            (v) => (
              <button
                key={v}
                onClick={() => setProject((p) => ({ ...p, verdict: v }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  project.verdict === v
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                {v}
              </button>
            )
          )}
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">PR No</label>
                <input
                  type="text"
                  value={project.prNumber}
                  onChange={(e) => setProject((p) => ({ ...p, prNumber: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-zinc-400 block mb-1">Dosya Yolu</label>
                <input
                  type="text"
                  value={project.filePath}
                  onChange={(e) => setProject((p) => ({ ...p, filePath: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Pull Request Başlığı</label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-1.5">
              <label className="text-xs font-bold text-rose-400">
                Eski Sürüm (Base / Old Code)
              </label>
              <textarea
                rows={7}
                value={project.oldText}
                onChange={(e) => setProject((p) => ({ ...p, oldText: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-300 resize-none"
              />
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-1.5">
              <label className="text-xs font-bold text-emerald-400">
                Yeni Sürüm (Head / New Code)
              </label>
              <textarea
                rows={7}
                value={project.newText}
                onChange={(e) => setProject((p) => ({ ...p, newText: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 resize-none"
              />
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2.5">
            <div className="text-xs font-bold text-violet-400 uppercase">
              İnceleme Yorumu Ekle
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentLine}
                onChange={(e) => setNewCommentLine(e.target.value)}
                className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                placeholder="L12"
              />
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Denetim bulgusu veya yorum..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ekle
              </button>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Canlı 4K (1920×1080) Kod İnceleme & Unified LCS Diff Raporu
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(unifiedPatch);
                setCopiedPatch(true);
                setTimeout(() => setCopiedPatch(false), 1800);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-emerald-400"
            >
              {copiedPatch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPatch ? 'Patch Kopyalandı!' : 'Git Patch Kopyala'}</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          <div className="space-y-2">
            {project.comments.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  {c.severity === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-mono font-bold text-cyan-400">[{c.lineRef}]</span>
                  <span className="text-zinc-200">{c.message}</span>
                </div>
                <span className="text-zinc-500 font-mono">@{c.author}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Masaüstü .BAT Başlatıcı (#027 Corpus Diff)
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
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
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
