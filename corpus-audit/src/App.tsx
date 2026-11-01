import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  Terminal,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  type AuditProject,
  type ControlStatus,
  type SecurityControl,
  AUDIT_PRESETS,
  calculateAuditMetrics,
  renderAuditCanvas,
  exportAuditExcel,
} from './utils/auditEngine';

export function App() {
  const [project, setProject] = useState<AuditProject>(() =>
    JSON.parse(JSON.stringify(AUDIT_PRESETS['iso27001-soc2']))
  );
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metrics = useMemo(() => calculateAuditMetrics(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderAuditCanvas(canvasRef.current, project);
  }, [project]);

  const handleAddControl = () => {
    const newCtrl: SecurityControl = {
      id: `ctrl-${Date.now().toString().slice(-4)}`,
      code: `A.8.${project.controls.length + 10}`,
      domain: 'Bulut Güvenliği',
      title: 'Yeni Siber Güvenlik Kontrolü & İzleme Kuralı',
      status: 'PARTIAL',
      likelihood: 2,
      impact: 4,
      owner: 'SecOps',
      remediation: 'WAF ve EDR kuralları doğrulanıyor.',
    };
    setProject((prev) => ({ ...prev, controls: [...prev.controls, newCtrl] }));
  };

  const updateControl = (id: string, patch: Partial<SecurityControl>) => {
    setProject((prev) => ({
      ...prev,
      controls: prev.controls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-CISO-Audit.png`;
    a.click();
    confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
  };

  const batContent = `@echo off
title Corpus Audit & Cybersecurity Matrix (#030 PRO)
echo Starting Corpus Audit Studio on http://localhost:5202 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-audit"
start http://localhost:5202
npm run dev -- --port 5202
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS AUDIT & CYBERSECURITY MATRIX
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                #030 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              ISO 27001, SOC2, KVKK/GDPR Uyumluluk Karnesi & 5×5 Siber Risk Isı Haritası Stüdyosu
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Uyumluluk Skoru:</span>
            <span className="font-bold text-emerald-400">%{metrics.score}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-zinc-400">Yüksek Risk (≥12):</span>
            <span className="font-bold text-rose-400">{metrics.highRisks} Kontrol</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={() => exportAuditExcel(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.XLSX)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K CISO Raporu İndir</span>
          </button>
        </div>
      </header>

      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase text-zinc-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Denetim Çerçeveleri:
        </span>
        <button
          onClick={() =>
            setProject(JSON.parse(JSON.stringify(AUDIT_PRESETS['iso27001-soc2'])))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium border ${
            project.id === 'iso27001-soc2'
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          🛡️ ISO/IEC 27001:2022 & SOC2 Type II Denetimi
        </button>
        <button
          onClick={() =>
            setProject(JSON.parse(JSON.stringify(AUDIT_PRESETS['kvkk-gdpr-audit'])))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium border ${
            project.id === 'kvkk-gdpr-audit'
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          ⚖️ KVKK & GDPR Teknik Veri Güvenliği Denetimi
        </button>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Denetlenen Kurum</label>
              <input
                type="text"
                value={project.organization}
                onChange={(e) =>
                  setProject((p) => ({ ...p, organization: e.target.value }))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Baş Denetçi / CISO</label>
                <input
                  type="text"
                  value={project.leadAuditor}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, leadAuditor: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Denetim Tarihi</label>
                <input
                  type="text"
                  value={project.auditDate}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, auditDate: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase">
              Güvenlik Kontrolleri & Risk Puanları ({project.controls.length})
            </span>
            <button
              onClick={handleAddControl}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Kontrol Ekle
            </button>
          </div>

          <div className="space-y-2.5">
            {project.controls.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={c.code}
                    onChange={(e) => updateControl(c.id, { code: e.target.value })}
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono font-bold text-amber-400"
                  />
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => updateControl(c.id, { title: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                  />
                  <button
                    onClick={() =>
                      setProject((prev) => ({
                        ...prev,
                        controls: prev.controls.filter((item) => item.id !== c.id),
                      }))
                    }
                    className="text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Uyumluluk Durumu</label>
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateControl(c.id, { status: e.target.value as ControlStatus })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="COMPLIANT">COMPLIANT (Uyumlu)</option>
                      <option value="PARTIAL">PARTIAL (Kısmi)</option>
                      <option value="NON_COMPLIANT">NON_COMPLIANT (Açık)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Olasılık (1–5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={c.likelihood}
                      onChange={(e) =>
                        updateControl(c.id, {
                          likelihood: Math.min(5, Math.max(1, Number(e.target.value))),
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Etki (1–5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={c.impact}
                      onChange={(e) =>
                        updateControl(c.id, {
                          impact: Math.min(5, Math.max(1, Number(e.target.value))),
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={c.remediation}
                  onChange={(e) => updateControl(c.id, { remediation: e.target.value })}
                  placeholder="Düzeltici aksiyon ve kanıt notu..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300"
                />
              </div>
            ))}
          </div>
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
                Masaüstü .BAT Başlatıcı (#030 Corpus Audit)
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
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5"
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
