import { useState, useRef, useEffect, useMemo } from 'react';
import {
  PieChart,
  Terminal,
  Users,
  TrendingUp,
  Coins,
  Eye,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Award,
  Briefcase,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type CapTableProject,
  type StakeholderRole,
  PRESET_CAPTABLE_PROJECTS,
  calculateCapTableAndWaterfall,
} from './utils/capTableEngine';

export default function App() {
  const [project, setProject] = useState<CapTableProject>(
    PRESET_CAPTABLE_PROJECTS.b2b_ai_unicorn_path
  );
  const [leftTab, setLeftTab] = useState<'stakeholders' | 'rounds' | 'exit'>(
    'stakeholders'
  );
  const [rightMode, setRightMode] = useState<'canvas' | 'captable' | 'waterfall'>(
    'canvas'
  );
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(
    () => calculateCapTableAndWaterfall(project),
    [project]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Cap Table Dilution & Exit Waterfall Boardroom Poster
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
    bg.addColorStop(0, '#0a0712');
    bg.addColorStop(0.5, '#130d24');
    bg.addColorStop(1, '#080a14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.035)';
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
      `CORPUS CAPTABLE, DILUTION & EXIT WATERFALL STUDIO  •  ${project.incorporationJurisdiction.toUpperCase()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText(`${project.companyName} — ${project.sectorTag}`, 74, 114);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Post-Money Valuation: $${(summary.latestPostMoneyValuationUsd / 1_000_000).toFixed(1)}M   |   Total Raised: $${(summary.totalCapitalRaisedUsd / 1_000_000).toFixed(2)}M   |   Share Price: $${summary.latestSharePriceUsd.toFixed(2)}   |   Fully Diluted Shares: ${summary.totalPostRoundShares.toLocaleString()}`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(168, 85, 247, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#a855f7';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#d8b4fe';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('FOUNDER / ESOP / VC SPLIT', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(
      `${summary.founderCombinedOwnershipPct.toFixed(1)}% / ${summary.esopCombinedOwnershipPct.toFixed(1)}% / ${summary.investorCombinedOwnershipPct.toFixed(1)}%`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Founders / Option Pool / Investors', W - 570, 133);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('TARGET EXIT WATERFALL', W - 300, 76);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${(project.exitEnterpriseValueUsd / 1_000_000).toFixed(1)}M Exit`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Net Distributable: $${(summary.netExitProceedsUsd / 1_000_000).toFixed(2)}M`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Ownership & Dilution Bar + Round Progression (x: 48, y: 180, w: 780)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 780, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 780, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('1. FULLY-DILUTED OWNERSHIP DISTRIBUTION', 74, 218);

    // Stacked Horizontal Ownership Bar
    const barX = 74;
    const barY = 242;
    const barW = 728;
    const barH = 44;

    let curX = barX;
    for (const r of summary.stakeholderResults) {
      const segW = Math.max(4, (r.ownershipPct / 100) * barW);
      ctx.fillStyle = r.stakeholder.badgeColor;
      ctx.fillRect(curX, barY, segW, barH);
      curX += segW;
    }

    // Funding Rounds History Cards
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('2. VENTURE FINANCING ROUNDS & VALUATION STEP-UP', 74, 336);

    let rndY = 374;
    for (const r of project.rounds) {
      const post = r.preMoneyValuationUsd + r.newCapitalRaisedUsd;
      const dil = post > 0 ? ((r.newCapitalRaisedUsd / post) * 100).toFixed(1) : '0';

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, rndY - 22, 728, 108);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.strokeRect(74, rndY - 22, 728, 108);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(r.roundName.toUpperCase(), 96, rndY + 4);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        `+$${(r.newCapitalRaisedUsd / 1_000_000).toFixed(2)}M Raised`,
        610,
        rndY + 4
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Pre-Money: $${(r.preMoneyValuationUsd / 1_000_000).toFixed(1)}M   ➔   Post-Money: $${(post / 1_000_000).toFixed(2)}M   |   Round Dilution: ${dil}%`,
        96,
        rndY + 36
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(
        r.safeValuationCapUsd
          ? `SAFE Valuation Cap: $${(r.safeValuationCapUsd / 1_000_000).toFixed(1)}M  •  Discount: ${r.safeDiscountPct || 20}%`
          : `ESOP Pool Top-Up Target: ${r.esopTopUpTargetPct}% Post-Round`,
        96,
        rndY + 64
      );

      rndY += 126;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: Stakeholder Cap Table & Exit Liquidation Waterfall (x: 852, y: 180, w: 1020)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(852, 180, 1020, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(852, 180, 1020, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      `3. STAKEHOLDER CAP TABLE & $${(project.exitEnterpriseValueUsd / 1_000_000).toFixed(0)}M M&A EXIT WATERFALL PAYOUTS`,
      880,
      218
    );

    let stY = 266;
    for (const res of summary.stakeholderResults.slice(0, 6)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(880, stY - 22, 964, 112);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(880, stY - 22, 964, 112);

      ctx.fillStyle = res.stakeholder.badgeColor;
      ctx.fillRect(880, stY - 22, 8, 112);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.fillText(res.stakeholder.name, 906, stY + 4);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `[${res.stakeholder.role} • ${res.stakeholder.roundEntered}]`,
        906,
        stY + 26
      );

      // Right payout & MOIC
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(
        `$${(res.totalExitPayoutUsd / 1_000_000).toFixed(2)}M`,
        1690,
        stY + 8
      );
      if (res.moicMultiple > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${res.moicMultiple}x MOIC`, 1690, stY + 30);
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Shares: ${res.finalShares.toLocaleString()} (${res.ownershipPct}%)   |   Invested: $${(res.stakeholder.investedCapitalUsd / 1_000_000).toFixed(2)}M   |   Liq Pref: $${(res.liquidationPreferencePayoutUsd / 1_000_000).toFixed(2)}M   |   Common Pool: $${(res.proRataCommonPayoutUsd / 1_000_000).toFixed(2)}M`,
        906,
        stY + 58
      );

      stY += 124;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${project.companyName.toLowerCase().replace(/\s+/g, '-')}-captable-waterfall-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const capRows = summary.stakeholderResults.map((r) => ({
      Stakeholder: r.stakeholder.name,
      Role: r.stakeholder.role,
      Round: r.stakeholder.roundEntered,
      'Final Shares': r.finalShares,
      'Ownership (%)': r.ownershipPct,
      'Invested Capital ($)': r.stakeholder.investedCapitalUsd,
      'Liquidation Pref Multiple': `${r.stakeholder.liquidationPrefMultiple}x`,
      Participating: r.stakeholder.isParticipatingPreferred ? 'YES' : 'NO',
      'Liquidation Pref Payout ($)': r.liquidationPreferencePayoutUsd,
      'Common Pool Payout ($)': r.proRataCommonPayoutUsd,
      'Total Exit Payout ($)': r.totalExitPayoutUsd,
      'MOIC (x)': r.moicMultiple,
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(capRows),
      'Cap Table & Exit Waterfall'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(project.rounds),
      'Financing Rounds'
    );

    XLSX.writeFile(wb, `${project.companyName.toLowerCase().replace(/\s+/g, '-')}-captable.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/50">
            <PieChart className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus CapTable, Dilution & Exit Waterfall Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-full">
                #038 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Pre-Seed to Series B Dilution • SAFE Conversion • Liquidation Preference (1x/2x) & MOIC Simulator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Kurucu Payı:</span>
            <span className="font-mono font-bold text-emerald-400">
              %{summary.founderCombinedOwnershipPct}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Değerleme:</span>
            <span className="font-mono font-bold text-purple-400">
              ${(summary.latestPostMoneyValuationUsd / 1_000_000).toFixed(1)}M
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Cap Table (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Cap Table Kartı İndir
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
          <div className="grid grid-cols-3 gap-1 p-2 bg-zinc-900/70 border-b border-zinc-800">
            {[
              {
                id: 'stakeholders',
                label: `Paydaşlar (${project.stakeholders.length})`,
                icon: Users,
              },
              {
                id: 'rounds',
                label: `Yatırım Turları (${project.rounds.length})`,
                icon: TrendingUp,
              },
              { id: 'exit', label: 'Exit & Waterfall', icon: Coins },
            ].map((t) => {
              const Icon = t.icon;
              const active = leftTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
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
            {leftTab === 'stakeholders' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-zinc-200">
                      Kurucular, ESOP Havuzu & VC Yatırımcıları
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Hisse adetlerini, yatırılan sermayeyi ve Liquidation Preference çarpanlarını yönetin
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        stakeholders: [
                          ...project.stakeholders,
                          {
                            id: `st-${Date.now()}`,
                            name: 'Yeni Yatırımcı Fonu LP',
                            role: 'SERIES_B_VC',
                            initialFounderShares: 0,
                            investedCapitalUsd: 10_000_000,
                            roundEntered: 'SERIES_B',
                            liquidationPrefMultiple: 1.0,
                            isParticipatingPreferred: false,
                            vestingMonths: 0,
                            cliffMonths: 0,
                            badgeColor: '#ec4899',
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Paydaş Ekle
                  </button>
                </div>

                {project.stakeholders.map((st, idx) => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={st.role}
                        onChange={(e) => {
                          const next = [...project.stakeholders];
                          next[idx] = {
                            ...st,
                            role: e.target.value as StakeholderRole,
                          };
                          setProject({ ...project, stakeholders: next });
                        }}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-purple-300"
                      >
                        <option value="FOUNDER">FOUNDER</option>
                        <option value="ESOP_POOL">ESOP_POOL</option>
                        <option value="ANGEL_SAFE">ANGEL_SAFE</option>
                        <option value="SEED_VC">SEED_VC</option>
                        <option value="SERIES_A_VC">SERIES_A_VC</option>
                        <option value="SERIES_B_VC">SERIES_B_VC</option>
                      </select>
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => {
                          const next = [...project.stakeholders];
                          next[idx] = { ...st, name: e.target.value };
                          setProject({ ...project, stakeholders: next });
                        }}
                        className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                      />
                      <button
                        onClick={() =>
                          setProject({
                            ...project,
                            stakeholders: project.stakeholders.filter(
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
                        <label className="block text-[10px] text-zinc-500">
                          Başlangıç Hissesi
                        </label>
                        <input
                          type="number"
                          step="100000"
                          value={st.initialFounderShares}
                          onChange={(e) => {
                            const next = [...project.stakeholders];
                            next[idx] = {
                              ...st,
                              initialFounderShares: Number(e.target.value),
                            };
                            setProject({ ...project, stakeholders: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500">
                          Yatırılan Sermaye ($)
                        </label>
                        <input
                          type="number"
                          step="250000"
                          value={st.investedCapitalUsd}
                          onChange={(e) => {
                            const next = [...project.stakeholders];
                            next[idx] = {
                              ...st,
                              investedCapitalUsd: Number(e.target.value),
                            };
                            setProject({ ...project, stakeholders: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500">
                          Liq. Pref Çarpanı (x)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={st.liquidationPrefMultiple}
                          onChange={(e) => {
                            const next = [...project.stakeholders];
                            next[idx] = {
                              ...st,
                              liquidationPrefMultiple: Number(e.target.value),
                            };
                            setProject({ ...project, stakeholders: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={st.isParticipatingPreferred}
                        onChange={(e) => {
                          const next = [...project.stakeholders];
                          next[idx] = {
                            ...st,
                            isParticipatingPreferred: e.target.checked,
                          };
                          setProject({ ...project, stakeholders: next });
                        }}
                        className="accent-purple-500"
                      />
                      Participating Preferred (Önce 1x/2x Nakit Alır + Kalan Havuza Ortak Olur)
                    </label>
                  </div>
                ))}
              </>
            )}

            {leftTab === 'rounds' && (
              <div className="space-y-3">
                {project.rounds.map((r, idx) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3"
                  >
                    <div className="text-xs font-bold text-purple-300 uppercase">
                      {r.roundName}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Pre-Money Değerleme ($)
                        </label>
                        <input
                          type="number"
                          step="1000000"
                          value={r.preMoneyValuationUsd}
                          onChange={(e) => {
                            const next = [...project.rounds];
                            next[idx] = {
                              ...r,
                              preMoneyValuationUsd: Number(e.target.value),
                            };
                            setProject({ ...project, rounds: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          Yeni Yatırım Tutarı ($)
                        </label>
                        <input
                          type="number"
                          step="500000"
                          value={r.newCapitalRaisedUsd}
                          onChange={(e) => {
                            const next = [...project.rounds];
                            next[idx] = {
                              ...r,
                              newCapitalRaisedUsd: Number(e.target.value),
                            };
                            setProject({ ...project, rounds: next });
                          }}
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leftTab === 'exit' && (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold uppercase text-emerald-400">
                  M&A Satış / IPO Exit Senaryosu Simülatörü
                </h3>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Hedef Şirket Satış Değeri (Exit Valuation)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${(project.exitEnterpriseValueUsd / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5_000_000}
                    max={500_000_000}
                    step={5_000_000}
                    value={project.exitEnterpriseValueUsd}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        exitEnterpriseValueUsd: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-500"
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
                { id: 'canvas', label: '4K Cap Table & Exit Waterfall Kartı', icon: Eye },
                { id: 'captable', label: 'Paydaş Seyrelme (Dilution) Tablosu', icon: Briefcase },
                { id: 'waterfall', label: 'Exit Nakit Dağılımı & MOIC', icon: Award },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
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
                    <div className="text-[11px] text-zinc-400">Kurucu Toplam Payı</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      %{summary.founderCombinedOwnershipPct}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Çalışan Opsiyon (ESOP)</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      %{summary.esopCombinedOwnershipPct}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Toplam Yatırımcı Payı</div>
                    <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                      %{summary.investorCombinedOwnershipPct}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Hisse Başına Fiyat</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      ${summary.latestSharePriceUsd.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(rightMode === 'captable' || rightMode === 'waterfall') && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Paydaş</th>
                      <th className="py-3 px-3">Hisse Adedi</th>
                      <th className="py-3 px-3">Pay (%)</th>
                      <th className="py-3 px-3">Liq. Pref ($)</th>
                      <th className="py-3 px-3">Toplam Exit ($)</th>
                      <th className="py-3 px-3">MOIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.stakeholderResults.map((r) => (
                      <tr key={r.stakeholder.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {r.stakeholder.name}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {r.finalShares.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-purple-300 font-bold">
                          %{r.ownershipPct}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          ${(r.liquidationPreferencePayoutUsd / 1_000_000).toFixed(2)}M
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          ${(r.totalExitPayoutUsd / 1_000_000).toFixed(2)}M
                        </td>
                        <td className="py-3 px-3 text-cyan-300">
                          {r.moicMultiple > 0 ? `${r.moicMultiple}x` : 'Founder'}
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
                Masaüstü Başlatıcı (.BAT) — Port 5210
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
title Corpus CapTable & Exit Waterfall Studio (#038 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-captable"
start http://localhost:5210
npm run dev -- --port 5210`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
