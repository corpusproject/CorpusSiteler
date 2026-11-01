import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Calculator,
  Landmark,
  TrendingUp,
  Coins,
  Table2,
  Sliders,
  FileSpreadsheet,
  Download,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  DEFAULT_CALC_CONFIG,
  type CalcConfig,
  type CalcMode,
  fmtMoney,
  computeLoanSimulation,
  computeSaasSimulation,
  computeCompoundSimulation,
  exportSimulationToExcel,
  renderSimulationToCanvas,
  exportSimCanvasPng,
} from './utils/calcEngine';

type StudioTab = 'params' | 'schedule';

export default function App() {
  const [cfg, setCfg] = useState<CalcConfig>(() => {
    try {
      const saved = localStorage.getItem('corpus_calc_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CALC_CONFIG;
    } catch {
      return DEFAULT_CALC_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('params');
  const [zoom, setZoom] = useState<number>(0.54);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_calc_config_v1', JSON.stringify(cfg));
    } catch {
      // ignore
    }
  }, [cfg]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderSimulationToCanvas(canvasRef.current, cfg);
  }, [cfg]);

  const loanSim = useMemo(() => computeLoanSimulation(cfg.loan), [cfg.loan]);
  const saasSim = useMemo(() => computeSaasSimulation(cfg.saas), [cfg.saas]);
  const compSim = useMemo(() => computeCompoundSimulation(cfg.compound), [cfg.compound]);

  const activeRows =
    cfg.mode === 'loan'
      ? loanSim.rows
      : cfg.mode === 'saas-roi'
      ? saasSim.rows
      : compSim.rows;

  const handleExportExcel = () => {
    exportSimulationToExcel(cfg);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    exportSimCanvasPng(canvasRef.current, cfg.mode);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Calc, ROI & Loan Simulator Pro (#021)',
      'echo Corpus Finansal Kredi, ROI ve Yatirim Simulatoru baslatiliyor...',
      'start "" msedge --app=http://localhost:5193',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Calc-Studio-Pro.bat';
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
              <Calculator className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Calc, ROI & Loan Simulator
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #021 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Ticari Kredi İtfa (Amortisman) Tablosu, SaaS LTV/CAC Birim Ekonomisi & Enflasyonlu Bileşik Yatırım Simülatörü
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              {cfg.mode === 'loan' && (
                <>
                  <span>Aylık Taksit:</span>
                  <strong className="text-emerald-400">
                    {fmtMoney(loanSim.monthlyPayment, cfg.currency)}
                  </strong>
                </>
              )}
              {cfg.mode === 'saas-roi' && (
                <>
                  <span>LTV / CAC Oranı:</span>
                  <strong className="text-emerald-400">
                    {saasSim.ltvCacRatio}x ({fmtMoney(saasSim.endArr, cfg.currency)} ARR)
                  </strong>
                </>
              )}
              {cfg.mode === 'compound' && (
                <>
                  <span>Reel Alım Gücü:</span>
                  <strong className="text-emerald-400">
                    {fmtMoney(compSim.finalRealPower, cfg.currency)}
                  </strong>
                </>
              )}
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
          {/* Left: 3 Simulator Modes + Currency */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {(
                [
                  {
                    id: 'loan',
                    label: '1. Kredi & İtfa (Amortisman)',
                    icon: Landmark,
                  },
                  {
                    id: 'saas-roi',
                    label: '2. SaaS LTV / CAC & MRR',
                    icon: TrendingUp,
                  },
                  {
                    id: 'compound',
                    label: '3. Bileşik Getiri & Enflasyon',
                    icon: Coins,
                  },
                ] as { id: CalcMode; label: string; icon: typeof Landmark }[]
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setCfg((p) => ({ ...p, mode: m.id }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      cfg.mode === m.id
                        ? 'bg-violet-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <select
              value={cfg.currency}
              onChange={(e) =>
                setCfg((p) => ({
                  ...p,
                  currency: e.target.value as 'TRY' | 'USD' | 'EUR',
                }))
              }
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 cursor-pointer"
            >
              <option value="TRY">TRY (₺ Türk Lirası)</option>
              <option value="USD">USD ($ Amerikan Doları)</option>
              <option value="EUR">EUR (€ Euro)</option>
            </select>
          </div>

          {/* Right: Export Excel & 4K PNG */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              İtfa / Projeksiyon (.XLSX) İndir
            </button>

            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              4K Finansal Rapor (PNG) İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'params', label: 'Simülasyon Parametreleri', icon: Sliders },
              {
                id: 'schedule',
                label: `Dönemsel Tablo (${activeRows.length} Dönem)`,
                icon: Table2,
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as StudioTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
            {/* TAB 1: PARAMETERS */}
            {activeTab === 'params' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Rapor Başlığı
                  </label>
                  <input
                    type="text"
                    value={cfg.reportTitle}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, reportTitle: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                {/* MODE 1: LOAN */}
                {cfg.mode === 'loan' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Kredi Anapara Tutarı</span>
                        <span className="font-mono font-bold text-violet-300">
                          {fmtMoney(cfg.loan.principal, cfg.currency)}
                        </span>
                      </div>
                      <input
                        type="number"
                        step={50000}
                        value={cfg.loan.principal}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            loan: {
                              ...p.loan,
                              principal: Math.max(1000, Number(e.target.value) || 0),
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Aylık Akdi Faiz Oranı (%)</span>
                        <span className="font-mono font-bold text-violet-300">
                          %{cfg.loan.monthlyRatePercent}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={6.5}
                        step={0.05}
                        value={cfg.loan.monthlyRatePercent}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            loan: {
                              ...p.loan,
                              monthlyRatePercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Kredi Vadesi (Ay)</span>
                        <span className="font-mono font-bold text-violet-300">
                          {cfg.loan.termMonths} Ay
                        </span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={120}
                        step={3}
                        value={cfg.loan.termMonths}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            loan: {
                              ...p.loan,
                              termMonths: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        KKDF + BSMV Vergi Yükü Türü
                      </label>
                      <select
                        value={cfg.loan.taxPercent}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            loan: {
                              ...p.loan,
                              taxPercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                      >
                        <option value={0}>%0 — Konut / Mortgage Kredisi (Vergi Muaf)</option>
                        <option value={5}>%5 — Kurumsal / Ticari Kredi (BSMV %5)</option>
                        <option value={25}>
                          %25 — Bireysel İhtiyaç Kredisi (KKDF %15 + BSMV %10)
                        </option>
                      </select>
                    </div>
                  </div>
                )}

                {/* MODE 2: SAAS ROI */}
                {cfg.mode === 'saas-roi' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Aylık Abonelik (ARPU)
                        </label>
                        <input
                          type="number"
                          value={cfg.saas.arpu}
                          onChange={(e) =>
                            setCfg((p) => ({
                              ...p,
                              saas: { ...p.saas, arpu: Number(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Müşteri Edinme Maliyeti (CAC)
                        </label>
                        <input
                          type="number"
                          value={cfg.saas.cac}
                          onChange={(e) =>
                            setCfg((p) => ({
                              ...p,
                              saas: { ...p.saas, cac: Number(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Mevcut Aktif Müşteri
                        </label>
                        <input
                          type="number"
                          value={cfg.saas.initialCustomers}
                          onChange={(e) =>
                            setCfg((p) => ({
                              ...p,
                              saas: {
                                ...p.saas,
                                initialCustomers: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Aylık Yeni Müşteri Kazanımı
                        </label>
                        <input
                          type="number"
                          value={cfg.saas.monthlyNewCustomers}
                          onChange={(e) =>
                            setCfg((p) => ({
                              ...p,
                              saas: {
                                ...p.saas,
                                monthlyNewCustomers: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Aylık İptal (Churn) Oranı</span>
                        <span className="font-mono text-violet-300">
                          %{cfg.saas.monthlyChurnPercent}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={12}
                        step={0.2}
                        value={cfg.saas.monthlyChurnPercent}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            saas: {
                              ...p.saas,
                              monthlyChurnPercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Brüt Kâr Marjı (%)</span>
                        <span className="font-mono text-violet-300">
                          %{cfg.saas.grossMarginPercent}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={95}
                        step={1}
                        value={cfg.saas.grossMarginPercent}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            saas: {
                              ...p.saas,
                              grossMarginPercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>
                  </div>
                )}

                {/* MODE 3: COMPOUND */}
                {cfg.mode === 'compound' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Başlangıç Sermayesi
                        </label>
                        <input
                          type="number"
                          step={25000}
                          value={cfg.compound.initialCapital}
                          onChange={(e) =>
                            setCfg((p) => ({
                              ...p,
                              compound: {
                                ...p.compound,
                                initialCapital: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Aylık Düzenli Ek Yatırım
                        </label>
                        <input
                          type="number"
                          step={5000}
                          value={cfg.compound.monthlyContribution}
                          onChange={(e) =>
                            setCfg((p) => ({
                              ...p,
                              compound: {
                                ...p.compound,
                                monthlyContribution: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Yıllık Beklenen Getiri (%)</span>
                        <span className="font-mono text-emerald-400">
                          %{cfg.compound.annualReturnPercent}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={85}
                        step={1}
                        value={cfg.compound.annualReturnPercent}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            compound: {
                              ...p.compound,
                              annualReturnPercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Yıllık Ortalama Enflasyon (%)</span>
                        <span className="font-mono text-amber-400">
                          %{cfg.compound.annualInflationPercent}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={65}
                        step={1}
                        value={cfg.compound.annualInflationPercent}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            compound: {
                              ...p.compound,
                              annualInflationPercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Yatırım Vadesi (Yıl)</span>
                        <span className="font-mono text-violet-300">
                          {cfg.compound.years} Yıl
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={25}
                        step={1}
                        value={cfg.compound.years}
                        onChange={(e) =>
                          setCfg((p) => ({
                            ...p,
                            compound: {
                              ...p.compound,
                              years: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCHEDULE TABLE */}
            {activeTab === 'schedule' && (
              <div className="overflow-x-auto max-h-[460px] rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-2">Dönem</th>
                      <th className="px-2.5 py-2">
                        {cfg.mode === 'loan'
                          ? 'Taksit'
                          : cfg.mode === 'saas-roi'
                          ? 'Müşteri'
                          : 'Anapara'}
                      </th>
                      <th className="px-2.5 py-2">
                        {cfg.mode === 'loan'
                          ? 'Anapara'
                          : cfg.mode === 'saas-roi'
                          ? 'MRR Gelir'
                          : 'Net Kazanç'}
                      </th>
                      <th className="px-2.5 py-2">
                        {cfg.mode === 'loan'
                          ? 'Kalan Borç'
                          : cfg.mode === 'saas-roi'
                          ? 'Net Katkı'
                          : 'Reel Değer'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 font-mono">
                    {activeRows.map((r) => (
                      <tr key={r.period} className="hover:bg-zinc-900/50">
                        <td className="px-2.5 py-1.5 text-violet-300">{r.label}</td>
                        <td className="px-2.5 py-1.5">
                          {cfg.mode === 'saas-roi'
                            ? r.col1
                            : fmtMoney(r.col1, cfg.currency)}
                        </td>
                        <td className="px-2.5 py-1.5">
                          {fmtMoney(r.col2, cfg.currency)}
                        </td>
                        <td className="px-2.5 py-1.5 text-emerald-400">
                          {fmtMoney(r.balance, cfg.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Live 4K Financial Report Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı 4K Finansal Simülasyon & İtfa Raporu (1440 × 880 px)
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
                height: 880 * zoom,
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
                    Corpus Calc & ROI Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız Finansal Simülasyon Stüdyosu</p>
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
                <span>Kredi İtfa Tablosu, SaaS LTV/CAC ve Bileşik Getiri Excel (.XLSX) çıktısı</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Finansal projeksiyonlarınız tamamen yerel hesaplanır</span>
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
              %100 İstemci Taraflı Finansal Amortisman & ROI Motoru — Verileriniz cihazınızdan çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #021 • Outgrow / Calculoid / Bankrate Pro Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
