import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Briefcase,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileCode,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Clock,
  DollarSign,
  Users,
  Sliders,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  type ProposalProject,
  type ScopeItem,
  type ComplexityLevel,
  type CurrencyCode,
  type RoleId,
  PROPOSAL_PRESETS,
  PROPOSAL_THEMES,
  COMPLEXITY_META,
  calculateProposalSummary,
  formatMoney,
  renderProposalCanvas,
  exportProposalExcel,
} from './utils/pricingEngine';

export function App() {
  const [project, setProject] = useState<ProposalProject>(() =>
    JSON.parse(JSON.stringify(PROPOSAL_PRESETS['enterprise-ai-rag']))
  );
  const [activeTab, setActiveTab] = useState<'wbs' | 'roles' | 'finance' | 'tiers'>('wbs');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => calculateProposalSummary(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderProposalCanvas(canvasRef.current, project, summary);
  }, [project, summary]);

  const handleLoadPreset = (key: string) => {
    const preset = PROPOSAL_PRESETS[key];
    if (!preset) return;
    setProject(JSON.parse(JSON.stringify(preset)));
  };

  const handleAddScopeItem = () => {
    const newItem: ScopeItem = {
      id: `item-${Date.now().toString().slice(-4)}`,
      phase: 'Faz 3: Ek Geliştirme & Entegrasyon',
      title: 'Yeni Kurumsal Modül / API Bağlayıcı',
      deliverable: 'Uçtan uca test edilmiş mikroservis teslimatı',
      roleId: 'fullstack',
      baseHours: 40,
      complexity: 'standard',
      included: true,
    };
    setProject((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleUpdateScopeItem = (id: string, patch: Partial<ScopeItem>) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const handleDeleteScopeItem = (id: string) => {
    if (project.items.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.proposalNo}-4K-Teklif.png`;
    a.click();
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    exportProposalExcel(project, summary);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ project, summary }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.proposalNo}-teklif.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batContent = `@echo off
title Corpus Pricing & Proposal Studio (#024 PRO)
echo Starting Corpus Pricing Studio on http://localhost:5196 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-pricing"
start http://localhost:5196
npm run dev -- --port 5196
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS PRICING & PROPOSAL
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                #024 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              WBS Mühendislik Eforu, Adam/Gün Maliyet Matrisi & 4K Yönetici Teklif Sunumu Stüdyosu
            </p>
          </div>
        </div>

        {/* Live Financial & Effort Pill */}
        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-zinc-400">Net Efor:</span>
            <span className="font-bold text-white">
              {summary.totalEffectiveHours}s ({summary.totalPersonDays} Gün)
            </span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">KDV Hariç Net:</span>
            <span className="font-bold text-emerald-400">
              {formatMoney(summary.netSubtotal, project.currency)}
            </span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Genel Toplam:</span>
            <span className="font-bold text-amber-400">
              {formatMoney(summary.grandTotal, project.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.XLSX)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K Teklif İndir</span>
          </button>
        </div>
      </header>

      {/* TOP PRESET & THEME BAR */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Hazır Teklif Senaryoları:
          </span>
          <button
            onClick={() => handleLoadPreset('enterprise-ai-rag')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              project.id === 'enterprise-ai-rag'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🤖 Kurumsal Yapay Zeka (RAG & LLM) Teklifi (TRY)
          </button>
          <button
            onClick={() => handleLoadPreset('fintech-superapp')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              project.id === 'fintech-superapp'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            💳 FinTech Dijital Cüzdan & Sanal POS Teklifi (USD)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Sunum Teması:</span>
          {PROPOSAL_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setProject((prev) => ({ ...prev, themeId: t.id }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                project.themeId === t.id
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SPLIT STUDIO WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT CONFIGURATION PANEL (5 COLS) */}
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[calc(100vh-112px)]">
          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
            {[
              { id: 'wbs', label: 'WBS Kapsam', icon: Layers },
              { id: 'roles', label: 'Rol & Saat', icon: Users },
              { id: 'finance', label: 'Finans & Risk', icon: Sliders },
              { id: 'tiers', label: 'SaaS Paketler', icon: Briefcase },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === t.id
                      ? 'bg-amber-600 text-white shadow'
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
            {/* Project Meta Card */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] text-zinc-400 block mb-1">Müşteri / Kurum Adı</label>
                  <input
                    type="text"
                    value={project.clientName}
                    onChange={(e) => setProject((p) => ({ ...p, clientName: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Teklif Kodu</label>
                  <input
                    type="text"
                    value={project.proposalNo}
                    onChange={(e) => setProject((p) => ({ ...p, proposalNo: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Teklif & Proje Başlığı</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* TAB 1: WBS SCOPE ITEMS */}
            {activeTab === 'wbs' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    İş Kırılım Yapısı ({project.items.length} Kalem)
                  </span>
                  <button
                    onClick={handleAddScopeItem}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>İş Paketi Ekle</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {summary.rows.map((row) => (
                    <div
                      key={row.id}
                      className={`p-3 rounded-xl border transition space-y-2 ${
                        row.included
                          ? 'bg-zinc-900/80 border-zinc-800'
                          : 'bg-zinc-950/50 border-zinc-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateScopeItem(row.id, { included: !row.included })
                          }
                          className="flex items-center gap-1.5 text-xs font-semibold text-white text-left"
                        >
                          {row.included ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                          )}
                          <span>{row.title}</span>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {formatMoney(row.lineTotal, project.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteScopeItem(row.id)}
                            className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) =>
                            handleUpdateScopeItem(row.id, { title: e.target.value })
                          }
                          placeholder="Modül başlığı"
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={row.deliverable}
                          onChange={(e) =>
                            handleUpdateScopeItem(row.id, { deliverable: e.target.value })
                          }
                          placeholder="Teslimat çıktısı"
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block">Mühendislik Rolü</label>
                          <select
                            value={row.roleId}
                            onChange={(e) =>
                              handleUpdateScopeItem(row.id, {
                                roleId: e.target.value as RoleId,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                          >
                            {project.roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block">Baz Efor (Saat)</label>
                          <input
                            type="number"
                            min={4}
                            max={2000}
                            value={row.baseHours}
                            onChange={(e) =>
                              handleUpdateScopeItem(row.id, {
                                baseHours: Number(e.target.value),
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block">Karmaşıklık</label>
                          <select
                            value={row.complexity}
                            onChange={(e) =>
                              handleUpdateScopeItem(row.id, {
                                complexity: e.target.value as ComplexityLevel,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-amber-300"
                          >
                            {Object.entries(COMPLEXITY_META).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ROLES & HOURLY RATES */}
            {activeTab === 'roles' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Unvan Bazlı Saatlik Ücret Matrisi ({project.currency})
                </div>
                <div className="space-y-2.5">
                  {project.roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-xs font-medium text-white">{role.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={10}
                          value={role.hourlyRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setProject((prev) => ({
                              ...prev,
                              roles: prev.roles.map((r) =>
                                r.id === role.id ? { ...r, hourlyRate: val } : r
                              ),
                            }));
                          }}
                          className="w-28 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-right text-emerald-400"
                        />
                        <span className="text-[11px] text-zinc-400">/ Saat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: FINANCIAL PARAMETERS */}
            {activeTab === 'finance' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3.5">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Risk Tamponu, İndirim, KDV & SLA Retainer
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Para Birimi</label>
                    <select
                      value={project.currency}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, currency: e.target.value as CurrencyCode }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="TRY">TRY (₺ Türk Lirası)</option>
                      <option value="USD">USD ($ Amerikan Doları)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Tahmini Teslim Süresi (Hafta)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={104}
                      value={project.sprintWeeks}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, sprintWeeks: Number(e.target.value) }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 flex justify-between mb-1">
                    <span>Risk & Beklenmeyen Efor Tamponu (Contingency)</span>
                    <span className="font-bold text-amber-400">%{project.contingencyPercent}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    value={project.contingencyPercent}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, contingencyPercent: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 flex justify-between mb-1">
                    <span>Kurumsal İndirim Oranı</span>
                    <span className="font-bold text-emerald-400">%{project.discountPercent}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={project.discountPercent}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, discountPercent: Number(e.target.value) }))
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">KDV / Vergi Oranı (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={project.taxPercent}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, taxPercent: Number(e.target.value) }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Aylık SLA Bakım Bedeli
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={project.monthlyRetainer}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, monthlyRetainer: Number(e.target.value) }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAAS / LICENSING TIERS */}
            {activeTab === 'tiers' && (
              <div className="space-y-3">
                {project.tiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">
                        Paket #{idx + 1}: {tier.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {tier.badge}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block">Kurulum Bedeli</label>
                        <input
                          type="number"
                          value={tier.setupFee}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setProject((prev) => ({
                              ...prev,
                              tiers: prev.tiers.map((t) =>
                                t.id === tier.id ? { ...t, setupFee: val } : t
                              ),
                            }));
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block">Aylık Lisans/SLA</label>
                        <input
                          type="number"
                          value={tier.monthlyPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setProject((prev) => ({
                              ...prev,
                              tiers: prev.tiers.map((t) =>
                                t.id === tier.id ? { ...t, monthlyPrice: val } : t
                              ),
                            }));
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT 4K PROPOSAL PRESENTATION CANVAS (7 COLS) */}
        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Canlı 4K (1920×1080) Yönetici Teklif Sunumu & WBS Maliyet Matrisi</span>
            </div>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON Yedeği</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-zinc-800/90 shadow-2xl bg-zinc-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          {/* Bottom Milestone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.milestones.map((m, i) => (
              <div
                key={i}
                className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-1"
              >
                <div className="text-[11px] text-zinc-400">{m.name}</div>
                <div className="text-base font-bold font-mono text-amber-400">
                  {formatMoney(m.amount, project.currency)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* .BAT DESKTOP LAUNCHER MODAL */}
      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Masaüstü .BAT Başlatıcı (#024 Corpus Pricing)
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
              Aşağıdaki komutu <code className="text-amber-400">corpus-pricing.bat</code> olarak
              kaydederek <strong>5196</strong> portunda başlatabilirsiniz:
            </p>
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
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedBat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBat ? 'Kopyalandı!' : '.BAT Kodunu Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
