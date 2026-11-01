import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sun,
  Terminal,
  BatteryCharging,
  TrendingUp,
  Eye,
  Download,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type SolarEnergyProject,
  PRESET_ENERGY_PROJECT,
  calculateSolarAndBessRoi,
} from './utils/energyEngine';

export default function App() {
  const [project, setProject] = useState<SolarEnergyProject>(
    PRESET_ENERGY_PROJECT
  );
  const [rightMode, setRightMode] = useState<'canvas' | 'cashflow'>('canvas');
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => calculateSolarAndBessRoi(project), [project]);

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Solar PV + BESS Microgrid Engineering & 25-Year ROI Poster
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
    bg.addColorStop(0, '#0c0a04');
    bg.addColorStop(0.5, '#181306');
    bg.addColorStop(1, '#070c10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.035)';
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
      `CORPUS SOLAR PV, LFP BESS MICROGRID & 25-YEAR LCOE ENGINEERING STUDIO  •  ${project.regionName.toUpperCase()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(project.facilityName, 74, 112);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `DC Power: ${(project.installedDcPowerKwp / 1000).toFixed(2)} MWp (${summary.totalModulesCount.toLocaleString()} × ${project.moduleWattPeak}W TOPCon)   |   AC Inverter: ${summary.inverterAcPowerKw} kW   |   BESS: ${(project.bessCapacityKwh / 1000).toFixed(2)} MWh   |   Roof Area: ${summary.requiredRoofOrLandAreaM2.toLocaleString()} m²`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(234, 179, 8, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#eab308';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('LCOE & PAYBACK PERIOD', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(
      `$${summary.lcoeUsdPerKwh.toFixed(3)}/kWh • ${summary.simplePaybackYears} Yr`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`Turnkey CapEx: $${(summary.totalCapexUsd / 1_000_000).toFixed(2)}M`, W - 570, 133);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('25-YEAR NET PRESENT VALUE', W - 300, 76);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `+$${(summary.npv25YrUsd / 1_000_000).toFixed(2)}M NPV`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Year-1 Net Savings: $${summary.year1NetRevenueUsd.toLocaleString()}/yr`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Engineering Bill of Materials & Microgrid Sizing
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 740, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 740, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '1. PV + BESS ENGINEERING SIZING & TARIFF ARBITRAGE',
      74,
      218
    );

    const specs = [
      {
        title: 'N-Type TOPCon Bifacial PV Array',
        val: `${(project.installedDcPowerKwp / 1000).toFixed(2)} MWp (${summary.totalModulesCount.toLocaleString()} Panels)`,
        sub: `Year-1 Output: ${summary.year1GenerationMwh.toLocaleString()} MWh  •  25-Yr Total: ${summary.lifetime25YrGenerationMwh.toLocaleString()} MWh`,
        col: '#eab308',
      },
      {
        title: 'String Inverter Station (1.22 DC/AC Ratio)',
        val: `${summary.inverterAcPowerKw.toLocaleString()} kW AC Nominal`,
        sub: `Self-Consumption Ratio: ${project.selfConsumptionRatioPct}%  •  Grid Export Feed-In: $${project.feedInExportTariffUsdPerKwh}/kWh`,
        col: '#38bdf8',
      },
      {
        title: 'Containerized LiFePO4 BESS Storage',
        val: `${(project.bessCapacityKwh / 1000).toFixed(2)} MWh Capacity`,
        sub: `Night Charge ($${project.gridNightTariffUsdPerKwh}/kWh) ➔ Peak Discharge ($${project.gridPeakTariffUsdPerKwh}/kWh)`,
        col: '#10b981',
      },
      {
        title: 'Turnkey EPC CapEx & Carbon Offset',
        val: `$${summary.totalCapexUsd.toLocaleString()} Total CapEx`,
        sub: `Avoided Grid Emissions: ${summary.annualCo2AvoidedTons.toLocaleString()} tCO2e / year`,
        col: '#a855f7',
      },
    ];

    let spY = 266;
    for (const sp of specs) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, spY - 22, 688, 148);
      ctx.fillStyle = sp.col;
      ctx.fillRect(74, spY - 22, 8, 148);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(sp.title.toUpperCase(), 100, spY + 8);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(sp.val, 100, spY + 46);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(sp.sub, 100, spY + 86);

      spY += 172;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: 25-Year Cumulative Cashflow & Break-Even Trajectory Chart
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(812, 180, 1060, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(812, 180, 1060, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '2. 25-YEAR CUMULATIVE CASHFLOW & BREAK-EVEN TRAJECTORY',
      840,
      218
    );

    const chartX = 840;
    const chartY = 250;
    const chartW = 1004;
    const chartH = 380;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(chartX, chartY, chartW, chartH);

    const maxCum = Math.max(
      ...summary.cashflows.map((c) => c.cumulativeCashflowUsd),
      1
    );
    const minCum = -summary.totalCapexUsd;
    const range = maxCum - minCum;

    const zeroY = chartY + (maxCum / range) * chartH;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(chartX, zeroY);
    ctx.lineTo(chartX + chartW, zeroY);
    ctx.stroke();

    const barW = Math.floor(chartW / 25) - 6;
    summary.cashflows.forEach((cf, i) => {
      const bx = chartX + 10 + i * (barW + 6);
      const isPos = cf.cumulativeCashflowUsd >= 0;
      const barHeight =
        (Math.abs(cf.cumulativeCashflowUsd) / range) * (chartH - 20);

      ctx.fillStyle = isPos ? '#10b981' : '#f59e0b';
      if (isPos) {
        ctx.fillRect(bx, zeroY - barHeight, barW, barHeight);
      } else {
        ctx.fillRect(bx, zeroY, barW, barHeight);
      }

      if (cf.year % 5 === 0 || cf.year === 1) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Y${cf.year}`, bx, chartY + chartH + 20);
      }
    });

    // Milestone Years Table below chart
    let tbY = 690;
    const milestoneYears = [
      summary.cashflows[0],
      summary.cashflows[4],
      summary.cashflows[9],
      summary.cashflows[14],
      summary.cashflows[24],
    ].filter(Boolean);

    for (const row of milestoneYears) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(840, tbY - 20, 1004, 52);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`YEAR ${row.year}`, 860, tbY + 10);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px monospace';
      ctx.fillText(
        `PV Output: ${row.pvGenerationMwh} MWh   |   Net Annual Cashflow: +$${row.netCashflowUsd.toLocaleString()}   |   Cumulative: $${row.cumulativeCashflowUsd.toLocaleString()}`,
        980,
        tbY + 10
      );

      tbY += 62;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-solar-bess-roi-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summary.cashflows),
      '25-Year Solar BESS Cashflow'
    );
    XLSX.writeFile(wb, `corpus-solar-bess-feasibility.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-yellow-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 flex items-center justify-center shadow-lg shadow-yellow-950/50">
            <Sun className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Solar, BESS Microgrid & Energy ROI Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-full">
                #045 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Industrial Rooftop PV + LFP BESS Sizing • LCOE ($/kWh) • 25-Year Cashflow & Payback Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Amortisman:</span>
            <span className="font-mono font-bold text-yellow-400">
              {summary.simplePaybackYears} Yıl
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">25Y NPV:</span>
            <span className="font-mono font-bold text-emerald-400">
              +${(summary.npv25YrUsd / 1_000_000).toFixed(2)}M
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            25 Yıllık Fizibilite (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-yellow-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K GES + BESS Mühendislik Kartı İndir
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
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase text-white">
              GES Gücü, BESS Batarya & Çok Zamanlı Tarife Parametreleri
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Santral / Fabrika Adı
              </label>
              <input
                type="text"
                value={project.facilityName}
                onChange={(e) =>
                  setProject({ ...project, facilityName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Kurulu Güneş Gücü (DC kWp)</span>
                  <span className="font-mono font-bold text-yellow-400">
                    {project.installedDcPowerKwp.toLocaleString()} kWp (
                    {(project.installedDcPowerKwp / 1000).toFixed(2)} MWp)
                  </span>
                </div>
                <input
                  type="range"
                  min={250}
                  max={15000}
                  step={250}
                  value={project.installedDcPowerKwp}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      installedDcPowerKwp: Number(e.target.value),
                    })
                  }
                  className="w-full accent-yellow-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">
                    LFP Batarya Depolama Kapasitesi (BESS kWh)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {project.bessCapacityKwh.toLocaleString()} kWh
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={250}
                  value={project.bessCapacityKwh}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      bessCapacityKwh: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Yıllık Spesifik Üretim (kWh/kWp)
                  </label>
                  <input
                    type="number"
                    value={project.specificYieldKwhPerKwp}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        specificYieldKwhPerKwp: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    İç Tüketim Oranı (%)
                  </label>
                  <input
                    type="number"
                    value={project.selfConsumptionRatioPct}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        selfConsumptionRatioPct: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Gündüz ($/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={project.gridDayTariffUsdPerKwh}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        gridDayTariffUsdPerKwh: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Puant ($/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={project.gridPeakTariffUsdPerKwh}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        gridPeakTariffUsdPerKwh: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Gece ($/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={project.gridNightTariffUsdPerKwh}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        gridNightTariffUsdPerKwh: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K GES + BESS Mühendislik & ROI Kartı', icon: Eye },
                { id: 'cashflow', label: '25 Yıllık Nakit Akışı & Degradasyon', icon: TrendingUp },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
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
                      <Zap className="w-3.5 h-3.5 text-yellow-400" /> 1. Yıl Üretim
                    </div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {summary.year1GenerationMwh.toLocaleString()} MWh
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">LCOE Birim Maliyet</div>
                    <div className="text-lg font-bold font-mono text-yellow-400 mt-0.5">
                      ${summary.lcoeUsdPerKwh.toFixed(3)} / kWh
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Geri Dönüş (Payback)</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {summary.simplePaybackYears} Yıl
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Yıllık Karbon Azaltımı</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {summary.annualCo2AvoidedTons.toLocaleString()} tCO2e
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'cashflow' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Yıl</th>
                      <th className="py-3 px-3">GES Üretim (MWh)</th>
                      <th className="py-3 px-3">Brüt Tasarruf</th>
                      <th className="py-3 px-3">Net Nakit Akışı</th>
                      <th className="py-3 px-3">Kümülatif Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.cashflows.map((c) => (
                      <tr key={c.year} className="hover:bg-zinc-800/40">
                        <td className="py-2.5 px-4 font-bold text-white">
                          Yıl {c.year}
                        </td>
                        <td className="py-2.5 px-3 text-yellow-300">
                          {c.pvGenerationMwh} MWh
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300">
                          ${c.grossEnergySavingsUsd.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">
                          +${c.netCashflowUsd.toLocaleString()}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            c.cumulativeCashflowUsd >= 0
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          ${c.cumulativeCashflowUsd.toLocaleString()}
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
                Masaüstü Başlatıcı (.BAT) — Port 5217
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
title Corpus Solar, BESS & Energy ROI Studio (#045 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-energy"
start http://localhost:5217
npm run dev -- --port 5217`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
