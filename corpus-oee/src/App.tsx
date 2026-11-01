import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Factory,
  Terminal,
  Gauge,
  Activity,
  Eye,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type OeeProject,
  PRESET_OEE_PROJECT,
  calculatePlantOeeAndSixSigma,
} from './utils/oeeEngine';

export default function App() {
  const [project, setProject] = useState<OeeProject>(PRESET_OEE_PROJECT);
  const [rightMode, setRightMode] = useState<'canvas' | 'spc'>('canvas');
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(
    () => calculatePlantOeeAndSixSigma(project),
    [project]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Smart Factory OEE & Six Sigma Cp/Cpk Control Blueprint
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
    bg.addColorStop(0.5, '#0b1812');
    bg.addColorStop(1, '#060a10');
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
      `CORPUS MANUFACTURING, LEAN OEE & SIX SIGMA (Cp/Cpk) STUDIO  •  ${project.shiftLabel.toUpperCase()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(project.plantName, 74, 112);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Customer Takt Time: ${summary.taktTimeSec}s/unit   |   Bottleneck Line: ${summary.bottleneckLineName} (${summary.bottleneckCycleTimeSec}s)   |   Daily Good Output: ${summary.totalDailyGoodOutput.toLocaleString()} pcs`,
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
    ctx.fillText('PLANT COMPOSITE OEE', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`${summary.plantAvgOeePct}%`, W - 570, 115);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `A:${summary.plantAvgAvailabilityPct}% × P:${summary.plantAvgPerformancePct}% × Q:${summary.plantAvgQualityPct}%`,
      W - 570,
      134
    );

    ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('RECOVERABLE KAIZEN LOSS', W - 300, 76);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${(summary.totalAnnualRecoverableLossUsd / 1000).toFixed(0)}K/yr`,
      W - 300,
      115
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Unplanned Downtime + Scrap', W - 300, 134);

    // ------------------------------------------------------------------------
    // MAIN BODY: Workcenter OEE & Six Sigma Cp/Cpk Cards
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, W - 96, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, W - 96, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(
      '1. PRODUCTION LINE OEE (AVAILABILITY × PERFORMANCE × QUALITY) & SIX SIGMA SPC CAPABILITY',
      76,
      218
    );

    let lY = 268;
    for (const item of summary.computedLines.slice(0, 4)) {
      const wc = item.wc;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(76, lY - 22, W - 152, 212);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeRect(76, lY - 22, W - 152, 212);

      const oeeCol =
        item.oeePct >= 85
          ? '#10b981'
          : item.oeePct >= 75
          ? '#f59e0b'
          : '#ef4444';
      ctx.fillStyle = oeeCol;
      ctx.fillRect(76, lY - 22, 10, 212);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`[${wc.lineCode}]`, 106, lY + 8);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText(wc.machineName, 250, lY + 8);

      // Right OEE & Sigma Badge
      ctx.fillStyle = oeeCol;
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`OEE: ${item.oeePct}%`, W - 360, lY + 12);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        `Cpk: ${item.cpkIndex} (${item.sigmaLevel}σ • ${item.dpmoEstimate} DPMO)`,
        W - 360,
        lY + 40
      );

      // A x P x Q Bars
      const metrics = [
        { label: 'Availability', val: item.availabilityPct, col: '#3b82f6' },
        { label: 'Performance', val: item.performancePct, col: '#10b981' },
        { label: 'Quality Yield', val: item.qualityPct, col: '#a855f7' },
      ];

      metrics.forEach((m, idx) => {
        const bx = 106 + idx * 540;
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${m.label}: ${m.val}%`, bx, lY + 56);

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(bx, lY + 66, 480, 14);
        ctx.fillStyle = m.col;
        ctx.fillRect(bx, lY + 66, (480 * m.val) / 100, 14);
      });

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px monospace';
      ctx.fillText(
        `Run Time: ${item.runTimeMin}/${item.plannedProductionTimeMin} min (Downtime: ${wc.unplannedDowntimeMinutes}m)   |   Good Output: ${item.goodUnits}/${wc.totalUnitsProduced} pcs (Scrap: ${wc.defectiveScrapUnits})   |   Actual Cycle: ${item.actualCycleTimeSec}s vs Ideal ${wc.idealCycleTimeSec}s`,
        106,
        lY + 118
      );

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `SPC Tolerance [LSL: ${wc.lowerSpecLimitLsl} • Nominal: ${wc.nominalSpecTarget} • USL: ${wc.upperSpecLimitUsl}]   |   Measured Mean μ=${wc.measuredMeanMu}, σ=${wc.measuredStdDevSigma}   |   Annual Kaizen Opportunity: $${item.annualFinancialLossFromDowntimeAndScrapUsd.toLocaleString()}/yr`,
        106,
        lY + 152
      );

      lY += 232;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-oee-six-sigma-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = summary.computedLines.map((c) => ({
      Line: c.wc.lineCode,
      Machine: c.wc.machineName,
      'Availability (%)': c.availabilityPct,
      'Performance (%)': c.performancePct,
      'Quality (%)': c.qualityPct,
      'OEE (%)': c.oeePct,
      'Good Units': c.goodUnits,
      'Scrap Units': c.wc.defectiveScrapUnits,
      Cp: c.cpIndex,
      Cpk: c.cpkIndex,
      'Sigma Level': c.sigmaLevel,
      DPMO: c.dpmoEstimate,
      'Annual Loss ($)': c.annualFinancialLossFromDowntimeAndScrapUsd,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      'OEE & Six Sigma SPC'
    );
    XLSX.writeFile(wb, `corpus-manufacturing-oee.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Factory className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Manufacturing, OEE & Six Sigma (Cp/Cpk) Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                #046 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Availability × Performance × Quality OEE • SPC Process Capability (Cp/Cpk) • Takt Time & SMED ROI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Fabrika OEE:</span>
            <span className="font-mono font-bold text-emerald-400">
              %{summary.plantAvgOeePct}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Takt Time:</span>
            <span className="font-mono font-bold text-cyan-400">
              {summary.taktTimeSec} sn
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            OEE & SPC (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K OEE & Six Sigma Kartı İndir
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
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase text-white">
                Üretim Hatları, Duruş & SPC Toleransları ({project.workcenters.length})
              </span>
            </div>
            <button
              onClick={() =>
                setProject({
                  ...project,
                  workcenters: [
                    ...project.workcenters,
                    {
                      id: `wc-${Date.now()}`,
                      lineCode: `LINE-ASM-0${project.workcenters.length + 1}`,
                      machineName: 'Automated Torque Assembly & EOL Tester',
                      shiftMinutesPlanned: 480,
                      plannedBreakMinutes: 30,
                      unplannedDowntimeMinutes: 25,
                      idealCycleTimeSec: 13.0,
                      totalUnitsProduced: 1790,
                      defectiveScrapUnits: 14,
                      hourlyMachineCostUsd: 210,
                      unitContributionMarginUsd: 16.0,
                      nominalSpecTarget: 100.0,
                      lowerSpecLimitLsl: 99.7,
                      upperSpecLimitUsl: 100.3,
                      measuredMeanMu: 100.02,
                      measuredStdDevSigma: 0.065,
                    },
                  ],
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Hat Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {project.workcenters.map((wc, idx) => (
              <div
                key={wc.id}
                className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={wc.lineCode}
                    onChange={(e) => {
                      const next = [...project.workcenters];
                      next[idx] = { ...wc, lineCode: e.target.value };
                      setProject({ ...project, workcenters: next });
                    }}
                    className="w-32 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300"
                  />
                  <input
                    type="text"
                    value={wc.machineName}
                    onChange={(e) => {
                      const next = [...project.workcenters];
                      next[idx] = { ...wc, machineName: e.target.value };
                      setProject({ ...project, workcenters: next });
                    }}
                    className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        workcenters: project.workcenters.filter(
                          (_, i) => i !== idx
                        ),
                      })
                    }
                    className="text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Arıza Duruş (dk)
                    </label>
                    <input
                      type="number"
                      value={wc.unplannedDowntimeMinutes}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          unplannedDowntimeMinutes: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      İdeal Çevrim (sn)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={wc.idealCycleTimeSec}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          idealCycleTimeSec: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Toplam Üretim
                    </label>
                    <input
                      type="number"
                      value={wc.totalUnitsProduced}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          totalUnitsProduced: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Hurda / Red
                    </label>
                    <input
                      type="number"
                      value={wc.defectiveScrapUnits}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          defectiveScrapUnits: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-zinc-500">LSL</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wc.lowerSpecLimitLsl}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          lowerSpecLimitLsl: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">USL</label>
                    <input
                      type="number"
                      step="0.01"
                      value={wc.upperSpecLimitUsl}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          upperSpecLimitUsl: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">
                      Ortalama (μ)
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      value={wc.measuredMeanMu}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          measuredMeanMu: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">
                      Std Sapma (σ)
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      value={wc.measuredStdDevSigma}
                      onChange={(e) => {
                        const next = [...project.workcenters];
                        next[idx] = {
                          ...wc,
                          measuredStdDevSigma: Number(e.target.value),
                        };
                        setProject({ ...project, workcenters: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300"
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
                { id: 'canvas', label: '4K Fabrika OEE & Six Sigma Kartı', icon: Eye },
                { id: 'spc', label: 'Cp/Cpk & Kaizen Kayıp Matrisi', icon: Activity },
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
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
                  <canvas ref={canvasRef} className="w-full h-auto block" />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Ortalama OEE
                    </div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      %{summary.plantAvgOeePct}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Takt Time Hedefi</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {summary.taktTimeSec} sn/adet
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Günlük Sağlam Üretim</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {summary.totalDailyGoodOutput.toLocaleString()} adet
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Yıllık Kaizen Potansiyeli</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      ${summary.totalAnnualRecoverableLossUsd.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'spc' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Üretim Hattı</th>
                      <th className="py-3 px-3">A × P × Q</th>
                      <th className="py-3 px-3">OEE</th>
                      <th className="py-3 px-3">Cp / Cpk</th>
                      <th className="py-3 px-3">Sigma / DPMO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.computedLines.map((c) => (
                      <tr key={c.wc.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          [{c.wc.lineCode}] {c.wc.machineName}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {c.availabilityPct}% × {c.performancePct}% × {c.qualityPct}%
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          %{c.oeePct}
                        </td>
                        <td className="py-3 px-3 text-cyan-300">
                          {c.cpIndex} / {c.cpkIndex}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          {c.sigmaLevel}σ ({c.dpmoEstimate} DPMO)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                Masaüstü Başlatıcı (.BAT) — Port 5218
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
title Corpus Manufacturing, OEE & Six Sigma Studio (#046 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-oee"
start http://localhost:5218
npm run dev -- --port 5218`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
