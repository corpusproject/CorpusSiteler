import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Landmark,
  Terminal,
  ShieldCheck,
  TrendingUp,
  Eye,
  Download,
  FileSpreadsheet,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type CorporateCreditProject,
  PRESET_CREDIT_PROJECT,
  calculateCreditAndAltmanZ,
} from './utils/creditEngine';

export default function App() {
  const [project, setProject] = useState<CorporateCreditProject>(
    PRESET_CREDIT_PROJECT
  );
  const [rightMode, setRightMode] = useState<'canvas' | 'amortization'>(
    'canvas'
  );
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => calculateCreditAndAltmanZ(project), [project]);

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Corporate Credit Risk, Altman Z-Score & Basel III Poster
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
    bg.addColorStop(0, '#060913');
    bg.addColorStop(0.5, '#0b1428');
    bg.addColorStop(1, '#070a12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.035)';
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
      `CORPUS TREASURY, ALTMAN Z-SCORE & BASEL III CREDIT RISK STUDIO  •  RATING: ${summary.syntheticCreditRating.toUpperCase()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(`${project.borrowerName} — ${project.sector}`, 74, 112);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Total Assets: $${(project.totalAssetsUsd / 1_000_000).toFixed(1)}M   |   EBITDA: $${(project.ebitdaUsd / 1_000_000).toFixed(1)}M   |   Credit Facility: $${(project.loanPrincipalFacilityUsd / 1_000_000).toFixed(1)}M @ ${project.annualInterestRatePct}% (${project.loanTermYears} Yrs)`,
      74,
      142
    );

    // Top Right Badges
    const zCol =
      summary.altmanZScore >= 2.99
        ? '#10b981'
        : summary.altmanZScore >= 1.81
        ? '#f59e0b'
        : '#ef4444';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = zCol;
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('ALTMAN Z-SCORE VERDICT', W - 570, 76);
    ctx.fillStyle = zCol;
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`Z = ${summary.altmanZScore}`, W - 570, 113);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(summary.zScoreZone, W - 570, 133);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('BASEL III EXPECTED LOSS (ECL)', W - 300, 76);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${summary.baselExpectedCreditLossEclUsd.toLocaleString()}`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `PD: ${summary.impliedProbabilityOfDefaultPdPct}% × LGD: ${project.lossGivenDefaultLgdPct}%`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: 5 Altman Z-Score Factors & Covenant Ratios
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 820, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 820, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '1. ALTMAN Z-SCORE DECOMPOSITION & BANKING COVENANTS',
      74,
      218
    );

    const zFactors = [
      {
        code: '1.2 × X1 (Working Capital / Total Assets)',
        raw: summary.x1WorkingCapitalToAssets,
        weighted: (1.2 * summary.x1WorkingCapitalToAssets).toFixed(2),
      },
      {
        code: '1.4 × X2 (Retained Earnings / Total Assets)',
        raw: summary.x2RetainedEarningsToAssets,
        weighted: (1.4 * summary.x2RetainedEarningsToAssets).toFixed(2),
      },
      {
        code: '3.3 × X3 (Operating EBIT / Total Assets)',
        raw: summary.x3EbitToAssets,
        weighted: (3.3 * summary.x3EbitToAssets).toFixed(2),
      },
      {
        code: '0.6 × X4 (Market Equity / Total Liabilities)',
        raw: summary.x4EquityToTotalLiabilities,
        weighted: (0.6 * summary.x4EquityToTotalLiabilities).toFixed(2),
      },
      {
        code: '1.0 × X5 (Annual Revenue Sales / Total Assets)',
        raw: summary.x5SalesToAssets,
        weighted: (1.0 * summary.x5SalesToAssets).toFixed(2),
      },
    ];

    let zY = 264;
    for (const f of zFactors) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, zY - 22, 768, 68);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(74, zY - 22, 6, 68);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(f.code, 98, zY + 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`+${f.weighted} pts (Ratio: ${f.raw})`, 560, zY + 8);

      zY += 80;
    }

    // Banking Covenants Section
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('2. SYNDICATED LOAN COVENANT HEALTH CHECK', 74, 700);

    const covs = [
      {
        name: 'DSCR (Debt Service Coverage Ratio)',
        val: `${summary.year1DscrRatio}x`,
        rule: 'Min Covenant >= 1.25x',
        ok: summary.year1DscrRatio >= 1.25,
      },
      {
        name: 'Net Debt / EBITDA Leverage Ratio',
        val: `${summary.netDebtToEbitdaRatio}x`,
        rule: 'Max Covenant <= 3.50x',
        ok: summary.netDebtToEbitdaRatio <= 3.5,
      },
      {
        name: 'Interest Coverage (EBIT / Interest)',
        val: `${summary.interestCoverageRatio}x`,
        rule: 'Min Covenant >= 3.00x',
        ok: summary.interestCoverageRatio >= 3.0,
      },
      {
        name: 'Current Liquidity Ratio',
        val: `${summary.currentRatio}x`,
        rule: 'Min Covenant >= 1.15x',
        ok: summary.currentRatio >= 1.15,
      },
    ];

    let cY = 744;
    for (const cv of covs) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, cY - 20, 768, 56);
      ctx.fillStyle = cv.ok ? '#10b981' : '#ef4444';
      ctx.fillRect(74, cY - 20, 6, 56);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(cv.name, 98, cY + 12);

      ctx.fillStyle = cv.ok ? '#34d399' : '#f87171';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${cv.val} (${cv.rule})`, 520, cY + 12);

      cY += 66;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: Multi-Year Debt Service & Principal Amortization Table
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(892, 180, 980, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(892, 180, 980, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '3. COMMERCIAL FACILITY AMORTIZATION & DSCR PROJECTION SCHEDULE',
      920,
      218
    );

    let amY = 268;
    for (const row of summary.schedule.slice(0, 7)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(920, amY - 22, 924, 94);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(920, amY - 22, 924, 94);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`YEAR ${row.year}`, 942, amY + 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`DSCR: ${row.dscrRatio}x`, 1690, amY + 8);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Beginning Debt: $${(row.beginningBalanceUsd / 1_000_000).toFixed(2)}M   |   Principal Paid: $${(row.principalRepaymentUsd / 1_000_000).toFixed(2)}M   |   Interest: $${(row.interestPaymentUsd / 1_000_000).toFixed(2)}M   |   Ending: $${(row.endingBalanceUsd / 1_000_000).toFixed(2)}M`,
        942,
        amY + 42
      );

      amY += 106;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-credit-altman-zscore-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summary.schedule),
      'Loan Amortization & DSCR'
    );
    XLSX.writeFile(wb, `corpus-credit-treasury.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-950/50">
            <Landmark className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Treasury, Altman Z-Score & Basel III Credit Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                #047 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Altman Z-Score Bankruptcy Model • Basel III ECL (PD × LGD × EAD) • DSCR & Loan Covenants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Altman Z:</span>
            <span className="font-mono font-bold text-emerald-400">
              {summary.altmanZScore}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">DSCR:</span>
            <span className="font-mono font-bold text-blue-400">
              {summary.year1DscrRatio}x
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            İtfa & Risk (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-blue-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Kredi Risk Kartı İndir
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
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase text-white">
              Bilanço, Gelir Tablosu & Ticari Kredi Parametreleri
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Borçlu Kurum Unvanı
              </label>
              <input
                type="text"
                value={project.borrowerName}
                onChange={(e) =>
                  setProject({ ...project, borrowerName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-2 gap-3">
              {[
                { key: 'totalAssetsUsd', label: 'Toplam Aktifler ($)' },
                { key: 'currentAssetsUsd', label: 'Dönen Varlıklar ($)' },
                { key: 'currentLiabilitiesUsd', label: 'Kısa Vadeli Yük. ($)' },
                { key: 'retainedEarningsUsd', label: 'Dağıtılmamış Kâr ($)' },
                { key: 'ebitUsd', label: 'FAVÖK Öncesi EBIT ($)' },
                { key: 'ebitdaUsd', label: 'Yıllık EBITDA ($)' },
                { key: 'marketValueEquityUsd', label: 'Özsermaye Değeri ($)' },
                { key: 'totalDebtLiabilitiesUsd', label: 'Toplam Yükümlülük ($)' },
                { key: 'annualRevenueSalesUsd', label: 'Yıllık Net Satış ($)' },
                { key: 'loanPrincipalFacilityUsd', label: 'Kredi Anapara ($)' },
              ].map((fld) => (
                <div key={fld.key}>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    {fld.label}
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={
                      project[
                        fld.key as keyof CorporateCreditProject
                      ] as number
                    }
                    onChange={(e) =>
                      setProject({
                        ...project,
                        [fld.key]: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Altman Z-Score & Basel III Kartı', icon: Eye },
                { id: 'amortization', label: 'Kredi İtfa & DSCR Tablosu', icon: TrendingUp },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
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
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Altman Z-Skoru
                    </div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {summary.altmanZScore}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Net Borç / EBITDA</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {summary.netDebtToEbitdaRatio}x
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">1. Yıl DSCR Oranı</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {summary.year1DscrRatio}x
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Basel III ECL Karşılığı</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      ${summary.baselExpectedCreditLossEclUsd.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'amortization' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Yıl</th>
                      <th className="py-3 px-3">Başlangıç Borç</th>
                      <th className="py-3 px-3">Anapara Ödemesi</th>
                      <th className="py-3 px-3">Faiz Ödemesi</th>
                      <th className="py-3 px-3">DSCR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.schedule.map((r) => (
                      <tr key={r.year} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-bold text-white">
                          Yıl {r.year}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          ${r.beginningBalanceUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-emerald-400">
                          ${r.principalRepaymentUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          ${r.interestPaymentUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-cyan-300">
                          {r.dscrRatio}x
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
                Masaüstü Başlatıcı (.BAT) — Port 5219
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
title Corpus Treasury & Credit Risk Studio (#047 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-credit"
start http://localhost:5219
npm run dev -- --port 5219`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
