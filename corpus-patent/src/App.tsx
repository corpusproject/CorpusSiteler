import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Award,
  Terminal,
  Scale,
  FileText,
  Eye,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type PatentProject,
  type PatentJurisdiction,
  PRESET_PATENT_PROJECT,
  calculatePatentPortfolioValuation,
  generateIpLicenseAgreement,
} from './utils/patentEngine';

export default function App() {
  const [project, setProject] = useState<PatentProject>(PRESET_PATENT_PROJECT);
  const [rightMode, setRightMode] = useState<'canvas' | 'table' | 'license'>(
    'canvas'
  );
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(
    () => calculatePatentPortfolioValuation(project),
    [project]
  );
  const licenseDoc = useMemo(
    () => generateIpLicenseAgreement(project, summary),
    [project, summary]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) ISO 10668 Patent Portfolio Valuation & FTO Claim Map
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
    bg.addColorStop(0, '#070814');
    bg.addColorStop(0.5, '#0e1129');
    bg.addColorStop(1, '#070a14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.035)';
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
      `CORPUS PATENT, ISO 10668 IP VALUATION (RELIEF-FROM-ROYALTY) & FTO STUDIO  •  WACC: ${project.waccDiscountRatePct}%`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${project.ownerEntity} — ${project.portfolioName}`,
      74,
      112
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Active Patents: ${project.patents.length}   |   Avg Remaining Protection Life: ${summary.avgRemainingLifeYears} Years   |   R&D Replacement Cost: $${(project.rdReplacementCostUsd / 1_000_000).toFixed(2)}M (${summary.costToIncomeMultiple}x Value Multiple)`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(99, 102, 241, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#6366f1';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('RISK-ADJUSTED IP NPV VALUE', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${(summary.totalPortfolioFairValueUsd / 1_000_000).toFixed(2)}M`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('ISO 10668 Relief-from-Royalty', W - 570, 133);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('YEAR-1 ROYALTY LICENSING POOL', W - 300, 76);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${(summary.totalAnnualRoyaltyYear1Usd / 1_000_000).toFixed(2)}M/yr`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${summary.costToIncomeMultiple}x R&D Value Creation`, W - 300, 133);

    // ------------------------------------------------------------------------
    // MAIN BODY: Patent Asset Valuation & FTO Cards
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, W - 96, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, W - 96, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(
      '1. PATENT ASSET DCF VALUATION, ROYALTY RATES & FREEDOM-TO-OPERATE (FTO) MATRIX',
      76,
      218
    );

    let pY = 266;
    for (const res of summary.results.slice(0, 4)) {
      const p = res.asset;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(76, pY - 22, W - 152, 168);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeRect(76, pY - 22, W - 152, 168);

      ctx.fillStyle = '#6366f1';
      ctx.fillRect(76, pY - 22, 10, 168);

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(
        `[${p.patentNumber}]  •  ${p.jurisdiction}  •  IPC: ${p.ipcClass}`,
        106,
        pY + 8
      );

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText(p.title, 106, pY + 40);

      // Right Fair Value
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(
        `NPV: $${(res.riskAdjustedFairValueUsd / 1_000_000).toFixed(2)}M`,
        W - 360,
        pY + 14
      );
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(res.ftoClearanceStatus, W - 360, pY + 42);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px monospace';
      ctx.fillText(
        `Remaining Life: ${p.remainingLifeYears} Years   |   Attributable Revenue: $${(p.attributableAnnualRevenueUsd / 1_000_000).toFixed(1)}M/yr (+${p.annualRevenueGrowthPct}% CAGR)   |   Fair Royalty Rate: ${p.fairRoyaltyRatePct}%`,
        106,
        pY + 78
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Cumulative Gross Royalties: $${(res.grossRoyaltyStreamTotalUsd / 1_000_000).toFixed(2)}M   |   Unadjusted DCF: $${(res.discountedNpvUsd / 1_000_000).toFixed(2)}M   |   Prior-Art Overlap Discount: ${p.priorArtOverlapRiskPct}%`,
        106,
        pY + 110
      );

      pY += 186;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-patent-valuation-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = summary.results.map((r) => ({
      'Patent Number': r.asset.patentNumber,
      Title: r.asset.title,
      Jurisdiction: r.asset.jurisdiction,
      'IPC Class': r.asset.ipcClass,
      'Remaining Life (Yrs)': r.asset.remainingLifeYears,
      'Annual Revenue ($)': r.asset.attributableAnnualRevenueUsd,
      'Royalty Rate (%)': r.asset.fairRoyaltyRatePct,
      'Gross Royalty Stream ($)': r.grossRoyaltyStreamTotalUsd,
      'Risk-Adjusted NPV ($)': r.riskAdjustedFairValueUsd,
      'FTO Status': r.ftoClearanceStatus,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      'ISO10668 IP Valuation'
    );
    XLSX.writeFile(wb, `corpus-patent-valuation.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-950/50">
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Patent, IP Valuation & Licensing Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full">
                #044 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              ISO 10668 Relief-from-Royalty DCF • USPTO/EPO/TÜRKPATENT FTO Matrix • Royalty License Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Portföy NPV:</span>
            <span className="font-mono font-bold text-indigo-400">
              ${(summary.totalPortfolioFairValueUsd / 1_000_000).toFixed(2)}M
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Çarpan:</span>
            <span className="font-mono font-bold text-emerald-400">
              {summary.costToIncomeMultiple}x
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            IP Değerleme (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Patent Değerleme Kartı İndir
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
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase text-white">
                Patent Varlıkları & Royalty Parametreleri ({project.patents.length})
              </span>
            </div>
            <button
              onClick={() =>
                setProject({
                  ...project,
                  patents: [
                    ...project.patents,
                    {
                      id: `pat-${Date.now()}`,
                      patentNumber: 'WO-2026/088120-A1',
                      title: 'Zero-Knowledge Hardware Enclave Attestation Protocol',
                      jurisdiction: 'WIPO (PCT)',
                      ipcClass: 'H04L 9/32',
                      remainingLifeYears: 17,
                      attributableAnnualRevenueUsd: 12000000,
                      annualRevenueGrowthPct: 15,
                      fairRoyaltyRatePct: 6.0,
                      priorArtOverlapRiskPct: 10,
                      annualMaintenanceFeeUsd: 3500,
                    },
                  ],
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Patent Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  WACC İskonto Oranı (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={project.waccDiscountRatePct}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      waccDiscountRatePct: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-indigo-300"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Ar-Ge İkame Maliyeti ($)
                </label>
                <input
                  type="number"
                  step="250000"
                  value={project.rdReplacementCostUsd}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      rdReplacementCostUsd: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                />
              </div>
            </div>

            {project.patents.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.patentNumber}
                    onChange={(e) => {
                      const next = [...project.patents];
                      next[idx] = { ...p, patentNumber: e.target.value };
                      setProject({ ...project, patents: next });
                    }}
                    className="w-36 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-indigo-300"
                  />
                  <select
                    value={p.jurisdiction}
                    onChange={(e) => {
                      const next = [...project.patents];
                      next[idx] = {
                        ...p,
                        jurisdiction: e.target.value as PatentJurisdiction,
                      };
                      setProject({ ...project, patents: next });
                    }}
                    className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <option value="USPTO (US)">USPTO (US)</option>
                    <option value="EPO (EU)">EPO (EU)</option>
                    <option value="TÜRKPATENT (TR)">TÜRKPATENT (TR)</option>
                    <option value="WIPO (PCT)">WIPO (PCT)</option>
                  </select>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        patents: project.patents.filter((_, i) => i !== idx),
                      })
                    }
                    className="ml-auto text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={p.title}
                  onChange={(e) => {
                    const next = [...project.patents];
                    next[idx] = { ...p, title: e.target.value };
                    setProject({ ...project, patents: next });
                  }}
                  className="w-full px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Yıllık Gelir ($)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={p.attributableAnnualRevenueUsd}
                      onChange={(e) => {
                        const next = [...project.patents];
                        next[idx] = {
                          ...p,
                          attributableAnnualRevenueUsd: Number(e.target.value),
                        };
                        setProject({ ...project, patents: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Royalty Oranı (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={p.fairRoyaltyRatePct}
                      onChange={(e) => {
                        const next = [...project.patents];
                        next[idx] = {
                          ...p,
                          fairRoyaltyRatePct: Number(e.target.value),
                        };
                        setProject({ ...project, patents: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Kalan Ömür (Yıl)
                    </label>
                    <input
                      type="number"
                      value={p.remainingLifeYears}
                      onChange={(e) => {
                        const next = [...project.patents];
                        next[idx] = {
                          ...p,
                          remainingLifeYears: Number(e.target.value),
                        };
                        setProject({ ...project, patents: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K ISO 10668 Patent Değerleme Kartı', icon: Eye },
                { id: 'table', label: 'DCF Nakit Akışı & FTO Matrisi', icon: Scale },
                { id: 'license', label: 'Lisans & Royalty Sözleşmesi (Markdown)', icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
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

            {rightMode === 'table' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Patent No & Başlık</th>
                      <th className="py-3 px-3">Royalty (%)</th>
                      <th className="py-3 px-3">Brüt Royalty Akışı</th>
                      <th className="py-3 px-3">Net NPV Değer ($)</th>
                      <th className="py-3 px-3">FTO Riski</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.results.map((r) => (
                      <tr key={r.asset.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          [{r.asset.patentNumber}] {r.asset.title}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          %{r.asset.fairRoyaltyRatePct}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          ${(r.grossRoyaltyStreamTotalUsd / 1_000_000).toFixed(2)}M
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          ${(r.riskAdjustedFairValueUsd / 1_000_000).toFixed(2)}M
                        </td>
                        <td className="py-3 px-3 text-indigo-300">
                          {r.ftoClearanceStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'license' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(licenseDoc);
                      setCopiedDoc(true);
                      setTimeout(() => setCopiedDoc(false), 1800);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedDoc ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Lisans Sözleşmesini Kopyala
                  </button>
                </div>
                <pre className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {licenseDoc}
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
                Masaüstü Başlatıcı (.BAT) — Port 5216
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
title Corpus Patent & IP Valuation Studio (#044 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-patent"
start http://localhost:5216
npm run dev -- --port 5216`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
