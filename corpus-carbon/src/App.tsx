import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Leaf,
  Terminal,
  Factory,
  Coins,
  FileText,
  Eye,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Plus,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type CarbonProject,
  type EmissionScope,
  PRESET_CARBON_PROJECT,
  calculateCarbonAndCbam,
  generateCsrdMarkdownReport,
} from './utils/carbonEngine';

export default function App() {
  const [project, setProject] = useState<CarbonProject>(PRESET_CARBON_PROJECT);
  const [leftTab, setLeftTab] = useState<'activities' | 'cbam'>('activities');
  const [rightMode, setRightMode] = useState<'canvas' | 'roadmap' | 'markdown'>(
    'canvas'
  );
  const [copiedMd, setCopiedMd] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => calculateCarbonAndCbam(project), [project]);
  const markdownReport = useMemo(
    () => generateCsrdMarkdownReport(project, summary),
    [project, summary]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Scope 1-2-3 GHG Inventory & EU CBAM Tax Roadmap Poster
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1920;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#050c09');
    bg.addColorStop(0.5, '#091912');
    bg.addColorStop(1, '#060c10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Top Accent
    ctx.fillStyle = project.accentColor;
    ctx.fillRect(0, 0, W, 8);

    // Header
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(48, 36, W - 96, 120);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(48, 36, W - 96, 120);

    ctx.fillStyle = project.accentColor;
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      `CORPUS ESG, ISO 14064-1 GHG PROTOCOL & EU CBAM COMPLIANCE STUDIO  •  FY ${project.reportingYear}  •  SECTOR: ${project.cbamSector.toUpperCase()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${project.organizationName} — ${project.facilityLocation}`,
      74,
      112
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Output: ${project.annualProductionTons.toLocaleString()} t/yr   |   Specific Intensity: ${summary.emissionIntensityPerTonProduct} tCO2e/t   |   I-REC Green Electricity: ${project.irecRenewableSharePct}%   |   Rating: ${summary.esgRatingGrade}`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('NET CORPORATE FOOTPRINT', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `${summary.totalNetTonsCo2e.toLocaleString()} tCO2e`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Gross before I-REC: ${summary.totalGrossTonsCo2e.toLocaleString()} t`,
      W - 570,
      133
    );

    ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('EU CBAM CERTIFICATE LIABILITY', W - 300, 76);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `€${summary.netCbamLiabilityEur.toLocaleString()}/yr`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `EU Export: ${project.euExportSharePct}% • ETS €${project.euEtsCarbonPriceEurPerTon}/t`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Scope 1, 2 & 3 Breakdown + Net-Zero Abatement Waterfall
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 760, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 760, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('1. GHG PROTOCOL SCOPE 1, 2 & 3 EMISSION SPLIT', 74, 218);

    const scopes = [
      {
        name: 'Scope 1 — Direct Combustion & Fleet',
        tons: summary.scope1Tons,
        color: '#ef4444',
      },
      {
        name: `Scope 2 — Net Market Electricity (${project.irecRenewableSharePct}% I-REC)`,
        tons: summary.scope2MarketBasedTons,
        color: '#f59e0b',
      },
      {
        name: 'Scope 3 — Raw Feedstock & Global Logistics',
        tons: summary.scope3Tons,
        color: '#3b82f6',
      },
    ];

    let scY = 264;
    for (const sc of scopes) {
      const pct =
        summary.totalNetTonsCo2e > 0
          ? ((sc.tons / summary.totalNetTonsCo2e) * 100).toFixed(1)
          : '0';

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(sc.name, 74, scY);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${sc.tons.toLocaleString()} tCO2e (${pct}%)`, 550, scY);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(74, scY + 14, 708, 18);
      ctx.fillStyle = sc.color;
      ctx.fillRect(74, scY + 14, (708 * Number(pct)) / 100, 18);

      scY += 74;
    }

    // Net-Zero Decarbonization Trajectory Box
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('2. NET-ZERO ABATEMENT & RESIDUAL FOOTPRINT', 74, 526);

    const steps = [
      {
        label: 'Baseline Gross Footprint (Location-Based)',
        val: summary.totalGrossTonsCo2e,
        col: '#ef4444',
      },
      {
        label: 'After I-REC & Green PPA Deduction',
        val: summary.totalNetTonsCo2e,
        col: '#f59e0b',
      },
      {
        label: 'Abatement CapEx Reductions (-tCO2e)',
        val: summary.totalAbatementPotentialTons,
        col: '#10b981',
      },
      {
        label: 'Post-Investment Residual Emissions',
        val: summary.postAbatementResidualTons,
        col: '#38bdf8',
      },
    ];

    let stpY = 572;
    for (const st of steps) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, stpY - 22, 708, 86);
      ctx.fillStyle = st.col;
      ctx.fillRect(74, stpY - 22, 8, 86);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(st.label, 100, stpY + 8);

      ctx.fillStyle = st.col;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${st.val.toLocaleString()} tCO2e`, 560, stpY + 12);

      stpY += 102;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: Activity-Level Emissions & Abatement ROI Table
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(832, 180, 1040, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(832, 180, 1040, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '3. INDUSTRIAL EMISSION SOURCES, DEFRA FACTORS & ABATEMENT ROI',
      860,
      218
    );

    let actY = 266;
    for (const c of summary.computedActivities.slice(0, 5)) {
      const a = c.item;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(860, actY - 22, 984, 134);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(860, actY - 22, 984, 134);

      ctx.fillStyle =
        a.scope === 'SCOPE_1'
          ? '#ef4444'
          : a.scope === 'SCOPE_2'
          ? '#f59e0b'
          : '#3b82f6';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`[${a.scope} • ${a.category}]`, 882, actY + 4);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.fillText(a.sourceName, 882, actY + 32);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${c.netTonsCo2eAfterIrec.toLocaleString()} tCO2e`, 1660, actY + 12);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Consumption: ${a.annualConsumption.toLocaleString()} ${a.unit}   |   Factor: ${a.emissionFactorKgCo2ePerUnit} kgCO2e/${a.unit}`,
        882,
        actY + 62
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `Abatement Potential: -${c.potentialAbatedTonsCo2e} tCO2e (${a.abatablePctWithInvestment}%)   •   CapEx: €${a.abatementCapexEur.toLocaleString()}   •   CBAM Saved: €${c.annualCarbonTaxSavedEur.toLocaleString()}/yr`,
        882,
        actY + 90
      );

      actY += 148;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-esg-carbon-cbam-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = summary.computedActivities.map((c) => ({
      Scope: c.item.scope,
      Category: c.item.category,
      Source: c.item.sourceName,
      Consumption: c.item.annualConsumption,
      Unit: c.item.unit,
      'Factor (kgCO2e/unit)': c.item.emissionFactorKgCo2ePerUnit,
      'Gross tCO2e': c.grossTonsCo2e,
      'Net tCO2e (Post I-REC)': c.netTonsCo2eAfterIrec,
      'Abatement Potential (tCO2e)': c.potentialAbatedTonsCo2e,
      'CapEx (EUR)': c.item.abatementCapexEur,
      'Annual CBAM Tax Saved (EUR)': c.annualCarbonTaxSavedEur,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      'ISO14064 GHG Inventory'
    );
    XLSX.writeFile(wb, `corpus-carbon-cbam-${project.reportingYear}.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus ESG, Carbon Footprint & EU CBAM Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                #041 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Scope 1-2-3 GHG Protocol • EU CBAM Border Tax Simulator • Net-Zero Decarbonization ROI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Net Emisyon:</span>
            <span className="font-mono font-bold text-emerald-400">
              {summary.totalNetTonsCo2e.toLocaleString()} tCO2e
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">CBAM Vergisi:</span>
            <span className="font-mono font-bold text-amber-400">
              €{summary.netCbamLiabilityEur.toLocaleString()}/yıl
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            GHG Envanteri (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Karbon & CBAM Kartı İndir
          </button>

          <button
            onClick={() => setShowBatModal(true)}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            .BAT
          </button>
        </div>
      </header>

      {/* MAIN STUDIO */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 bg-[#0c0c0f] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="grid grid-cols-2 gap-1 p-2 bg-zinc-900/70 border-b border-zinc-800">
            {[
              {
                id: 'activities',
                label: `Scope 1-2-3 Kaynakları (${project.activities.length})`,
                icon: Factory,
              },
              { id: 'cbam', label: 'EU CBAM & I-REC Parametreleri', icon: Coins },
            ].map((t) => {
              const Icon = t.icon;
              const active = leftTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {leftTab === 'activities' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-200">
                    Endüstriyel Emisyon Kalemleri
                  </span>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        activities: [
                          ...project.activities,
                          {
                            id: `em-${Date.now()}`,
                            scope: 'SCOPE_1',
                            category: 'Process Emissions',
                            sourceName: 'Yeni Emisyon Kaynağı',
                            unit: 'kWh',
                            annualConsumption: 250000,
                            emissionFactorKgCo2ePerUnit: 0.44,
                            abatablePctWithInvestment: 50,
                            abatementCapexEur: 80000,
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Kaynak Ekle
                  </button>
                </div>

                {project.activities.map((act, idx) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={act.scope}
                        onChange={(e) => {
                          const next = [...project.activities];
                          next[idx] = {
                            ...act,
                            scope: e.target.value as EmissionScope,
                          };
                          setProject({ ...project, activities: next });
                        }}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300"
                      >
                        <option value="SCOPE_1">SCOPE_1</option>
                        <option value="SCOPE_2">SCOPE_2</option>
                        <option value="SCOPE_3">SCOPE_3</option>
                      </select>
                      <input
                        type="text"
                        value={act.sourceName}
                        onChange={(e) => {
                          const next = [...project.activities];
                          next[idx] = { ...act, sourceName: e.target.value };
                          setProject({ ...project, activities: next });
                        }}
                        className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                      />
                      <button
                        onClick={() =>
                          setProject({
                            ...project,
                            activities: project.activities.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400">
                          Tüketim ({act.unit})
                        </label>
                        <input
                          type="number"
                          value={act.annualConsumption}
                          onChange={(e) => {
                            const next = [...project.activities];
                            next[idx] = {
                              ...act,
                              annualConsumption: Number(e.target.value),
                            };
                            setProject({ ...project, activities: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400">
                          Faktör (kgCO2e)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={act.emissionFactorKgCo2ePerUnit}
                          onChange={(e) => {
                            const next = [...project.activities];
                            next[idx] = {
                              ...act,
                              emissionFactorKgCo2ePerUnit: Number(
                                e.target.value
                              ),
                            };
                            setProject({ ...project, activities: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400">
                          Azaltım CapEx (€)
                        </label>
                        <input
                          type="number"
                          step="10000"
                          value={act.abatementCapexEur}
                          onChange={(e) => {
                            const next = [...project.activities];
                            next[idx] = {
                              ...act,
                              abatementCapexEur: Number(e.target.value),
                            };
                            setProject({ ...project, activities: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {leftTab === 'cbam' && (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Yıllık Toplam Üretim Tonajı (Ton)
                  </label>
                  <input
                    type="number"
                    value={project.annualProductionTons}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        annualProductionTons: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    AB (EU-27) İhracat Payı (%) — %{project.euExportSharePct}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.euExportSharePct}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        euExportSharePct: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    AB ETS Karbon Sertifika Fiyatı (€ / tCO2e) — €
                    {project.euEtsCarbonPriceEurPerTon}
                  </label>
                  <input
                    type="range"
                    min={40}
                    max={150}
                    value={project.euEtsCarbonPriceEurPerTon}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        euEtsCarbonPriceEurPerTon: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    I-REC / Çatı GES Yenilenebilir Elektrik Oranı (%) — %
                    {project.irecRenewableSharePct}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.irecRenewableSharePct}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        irecRenewableSharePct: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Scope 1-2-3 & CBAM Rapor Kartı', icon: Eye },
                { id: 'roadmap', label: 'Net-Zero Azaltım & ROI Tablosu', icon: TrendingDown },
                { id: 'markdown', label: 'CSRD / ISO 14064 Raporu (Markdown)', icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {rightMode === 'canvas' && (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
                <canvas ref={canvasRef} className="w-full h-auto block" />
              </div>
            )}

            {rightMode === 'roadmap' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Kapsam & Kaynak</th>
                      <th className="py-3 px-3">Net Emisyon</th>
                      <th className="py-3 px-3">Azaltım Potansiyeli</th>
                      <th className="py-3 px-3">CapEx Yatırım</th>
                      <th className="py-3 px-3">Yıllık CBAM Tasarrufu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.computedActivities.map((c) => (
                      <tr key={c.item.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          [{c.item.scope}] {c.item.sourceName}
                        </td>
                        <td className="py-3 px-3 text-zinc-200">
                          {c.netTonsCo2eAfterIrec} tCO2e
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          -{c.potentialAbatedTonsCo2e} tCO2e
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          €{c.item.abatementCapexEur.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-cyan-300">
                          €{c.annualCarbonTaxSavedEur.toLocaleString()}/yıl
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'markdown' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(markdownReport);
                      setCopiedMd(true);
                      setTimeout(() => setCopiedMd(false), 1800);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedMd ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    CSRD Raporunu Kopyala
                  </button>
                </div>
                <pre className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {markdownReport}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Masaüstü Başlatıcı (.BAT) — Port 5213
              </h3>
              <button
                onClick={() => setShowBatModal(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Kapat
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300 overflow-x-auto">
{`@echo off
title Corpus ESG, Carbon & CBAM Studio (#041 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-carbon"
start http://localhost:5213
npm run dev -- --port 5213`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
