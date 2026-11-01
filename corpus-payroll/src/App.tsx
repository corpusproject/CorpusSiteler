import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Terminal,
  Coins,
  Globe,
  Eye,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Briefcase,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type PayrollProject,
  type CountryHubCode,
  COUNTRY_PROFILES,
  PRESET_PAYROLL_PROJECT,
  calculatePayrollAndBands,
} from './utils/payrollEngine';

export default function App() {
  const [project, setProject] = useState<PayrollProject>(PRESET_PAYROLL_PROJECT);
  const [rightMode, setRightMode] = useState<'canvas' | 'eor' | 'bands'>(
    'canvas'
  );
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => calculatePayrollAndBands(project), [project]);

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Global EOR Employer Cost & Salary Band Architecture Poster
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
    bg.addColorStop(0, '#0d060b');
    bg.addColorStop(0.5, '#170b14');
    bg.addColorStop(1, '#080a12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.035)';
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
      `CORPUS PAYROLL, GLOBAL EOR COST & COMPENSATION BAND STUDIO  •  PRIMARY HUB: ${project.primaryHub}  •  HEADCOUNT: ${summary.totalHeadcount} FTE`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText(project.companyName, 74, 114);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Monthly Fully-Loaded Burn: $${summary.selectedHubMonthlyBurnUsd.toLocaleString()}/mo   |   Annual Bonus Target: ${project.annualBonusTargetPct}%   |   Mean Compa-Ratio: ${summary.avgCompaRatioPct}%`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(236, 72, 153, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#ec4899';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#f9a8d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('ANNUAL FULLY-LOADED PAYROLL', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${(summary.selectedHubAnnualCostUsd / 1_000_000).toFixed(2)}M/yr`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${summary.totalHeadcount} Engineers & Leaders`, W - 570, 133);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('MEAN COMPA-RATIO (VS P50)', W - 300, 76);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${summary.avgCompaRatioPct}%`, W - 300, 113);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Target Market Midpoint = 100%', W - 300, 133);

    // ------------------------------------------------------------------------
    // LEFT COLUMN: IC/Manager Level Compensation Bands & Gross-to-Net
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 960, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 960, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '1. LEVEL SALARY BANDS (IC3–M2), GROSS-TO-NET & TOTAL REWARDS',
      74,
      218
    );

    let rY = 266;
    for (const b of summary.roleBreakdowns.slice(0, 5)) {
      const r = b.role;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, rY - 22, 908, 146);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(74, rY - 22, 908, 146);

      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`[${r.levelCode} • ${r.headcount} FTE]`, 96, rY + 6);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(r.roleTitle, 275, rY + 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `$${b.annualTotalDepartmentCostUsd.toLocaleString()}/yr`,
        790,
        rY + 8
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Monthly Gross: $${r.monthlyGrossUsd.toLocaleString()}   ➔   Net Take-Home: $${b.monthlyNetTakeHomeUsd.toLocaleString()}   |   Employer Taxes/SGK: +$${b.monthlyEmployerTaxesUsd.toLocaleString()}/mo`,
        96,
        rY + 42
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Band P50 Midpoint: $${r.bandMidpointP50Usd.toLocaleString()} (Compa-Ratio: ${b.compaRatioPct}%)   |   Annual RSU Equity: $${r.annualEquityRsuUsd.toLocaleString()}/yr   |   5746 R&D Exempt: ${r.isRdTechnoparkExempt ? 'YES' : 'NO'}`,
        96,
        rY + 72
      );

      // Compa-Ratio bar
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(96, rY + 92, 860, 12);
      ctx.fillStyle = b.compaRatioPct > 105 ? '#f59e0b' : '#10b981';
      ctx.fillRect(
        96,
        rY + 92,
        Math.min(860, (860 * b.compaRatioPct) / 130),
        12
      );

      rY += 164;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: 5-Country Global EOR Cost & Tax Wedge Benchmark
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(1032, 180, 840, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(1032, 180, 840, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '2. GLOBAL EOR HUB COMPARISON (TR vs DE vs UK vs US vs UAE)',
      1060,
      218
    );

    let cY = 266;
    for (const c of summary.countryComparisons) {
      const isSel = c.profile.code === project.primaryHub;
      ctx.fillStyle = isSel
        ? 'rgba(236, 72, 153, 0.14)'
        : 'rgba(255,255,255,0.025)';
      ctx.fillRect(1060, cY - 22, 784, 136);
      ctx.strokeStyle = isSel ? '#ec4899' : 'rgba(255,255,255,0.07)';
      ctx.strokeRect(1060, cY - 22, 784, 136);

      ctx.fillStyle = c.profile.badgeColor;
      ctx.fillRect(1060, cY - 22, 8, 136);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.fillText(c.profile.name, 1084, cY + 6);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `$${(c.totalAnnualFullyLoadedCostUsd / 1_000_000).toFixed(2)}M/yr`,
        1670,
        cY + 8
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Annual Gross: $${c.totalAnnualGrossPayrollUsd.toLocaleString()}   |   Employer Social/EOR: +$${c.totalAnnualEmployerTaxesUsd.toLocaleString()}`,
        1084,
        cY + 40
      );

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `Employee Net Pool: $${c.totalAnnualNetTakeHomeUsd.toLocaleString()}   |   Effective Tax Wedge: ${c.taxWedgePct}%`,
        1084,
        cY + 70
      );

      cY += 152;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-payroll-eor-bands-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const roleRows = summary.roleBreakdowns.map((b) => ({
      Level: b.role.levelCode,
      Title: b.role.roleTitle,
      Headcount: b.role.headcount,
      'Monthly Gross ($)': b.role.monthlyGrossUsd,
      'Monthly Net Take-Home ($)': b.monthlyNetTakeHomeUsd,
      'Monthly Employer Taxes ($)': b.monthlyEmployerTaxesUsd,
      'Band P50 Midpoint ($)': b.role.bandMidpointP50Usd,
      'Compa-Ratio (%)': b.compaRatioPct,
      'Annual RSU ($)': b.role.annualEquityRsuUsd,
      'Total Annual Cost ($)': b.annualTotalDepartmentCostUsd,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(roleRows),
      'Salary Bands & Cost'
    );
    XLSX.writeFile(wb, `corpus-payroll-compensation.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-pink-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/40 flex items-center justify-center shadow-lg shadow-pink-950/50">
            <Users className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Payroll, Global EOR & Salary Band Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-pink-500/15 text-pink-400 border border-pink-500/30 rounded-full">
                #042 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Brüt ➔ Net & İşveren Maliyeti • 5746 Teknopark İstisnası • Global EOR (TR/DE/UK/US/AE)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Kadro:</span>
            <span className="font-mono font-bold text-pink-400">
              {summary.totalHeadcount} Kişi
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Yıllık Bütçe:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${(summary.selectedHubAnnualCostUsd / 1_000_000).toFixed(2)}M
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Bordro & Band (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-pink-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Maaş & EOR Kartı İndir
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
              <Briefcase className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold uppercase text-white">
                Ülke Hub & Maaş Skalası Yapılandırması
              </span>
            </div>
            <button
              onClick={() =>
                setProject({
                  ...project,
                  roles: [
                    ...project.roles,
                    {
                      id: `rl-${Date.now()}`,
                      levelCode: 'IC2 (Junior)',
                      roleTitle: 'Software Engineer I',
                      headcount: 4,
                      monthlyGrossUsd: 2400,
                      bandMidpointP50Usd: 2500,
                      annualEquityRsuUsd: 2000,
                      monthlyBenefitsPerHeadUsd: 280,
                      isRdTechnoparkExempt: true,
                    },
                  ],
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-pink-500/15 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Seviye Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <label className="block text-xs font-bold text-pink-400 uppercase">
                Birincil Bordro / EOR Ülke Merkezi
              </label>
              <select
                value={project.primaryHub}
                onChange={(e) =>
                  setProject({
                    ...project,
                    primaryHub: e.target.value as CountryHubCode,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
              >
                {COUNTRY_PROFILES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {project.roles.map((r, idx) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={r.levelCode}
                    onChange={(e) => {
                      const next = [...project.roles];
                      next[idx] = { ...r, levelCode: e.target.value };
                      setProject({ ...project, roles: next });
                    }}
                    className="w-28 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-pink-300"
                  />
                  <input
                    type="text"
                    value={r.roleTitle}
                    onChange={(e) => {
                      const next = [...project.roles];
                      next[idx] = { ...r, roleTitle: e.target.value };
                      setProject({ ...project, roles: next });
                    }}
                    className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        roles: project.roles.filter((_, i) => i !== idx),
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
                      Kişi Sayısı
                    </label>
                    <input
                      type="number"
                      value={r.headcount}
                      onChange={(e) => {
                        const next = [...project.roles];
                        next[idx] = { ...r, headcount: Number(e.target.value) };
                        setProject({ ...project, roles: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Aylık Brüt ($)
                    </label>
                    <input
                      type="number"
                      step="200"
                      value={r.monthlyGrossUsd}
                      onChange={(e) => {
                        const next = [...project.roles];
                        next[idx] = {
                          ...r,
                          monthlyGrossUsd: Number(e.target.value),
                        };
                        setProject({ ...project, roles: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Band P50 ($)
                    </label>
                    <input
                      type="number"
                      step="200"
                      value={r.bandMidpointP50Usd}
                      onChange={(e) => {
                        const next = [...project.roles];
                        next[idx] = {
                          ...r,
                          bandMidpointP50Usd: Number(e.target.value),
                        };
                        setProject({ ...project, roles: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Yıllık RSU ($)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={r.annualEquityRsuUsd}
                      onChange={(e) => {
                        const next = [...project.roles];
                        next[idx] = {
                          ...r,
                          annualEquityRsuUsd: Number(e.target.value),
                        };
                        setProject({ ...project, roles: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.isRdTechnoparkExempt}
                    onChange={(e) => {
                      const next = [...project.roles];
                      next[idx] = {
                        ...r,
                        isRdTechnoparkExempt: e.target.checked,
                      };
                      setProject({ ...project, roles: next });
                    }}
                    className="accent-pink-500"
                  />
                  5746 Ar-Ge / Teknopark Gelir Vergisi İstisnası Kapsamında
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Maaş Skalası & Global EOR Kartı', icon: Eye },
                { id: 'eor', label: '5 Ülke İşveren Maliyet Karşılaştırması', icon: Globe },
                { id: 'bands', label: 'Brüt ➔ Net & Compa-Ratio Tablosu', icon: Coins },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
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

            {rightMode === 'eor' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Ülke Hub</th>
                      <th className="py-3 px-3">Yıllık Brüt Havuz</th>
                      <th className="py-3 px-3">İşveren SGK/EOR</th>
                      <th className="py-3 px-3">Çalışan Net Havuz</th>
                      <th className="py-3 px-3">Toplam İşveren Maliyeti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.countryComparisons.map((c) => (
                      <tr key={c.profile.code} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {c.profile.name}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          ${c.totalAnnualGrossPayrollUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          +${c.totalAnnualEmployerTaxesUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-cyan-300">
                          ${c.totalAnnualNetTakeHomeUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          ${c.totalAnnualFullyLoadedCostUsd.toLocaleString()}/yıl
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'bands' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Seviye & Rol</th>
                      <th className="py-3 px-3">Aylık Brüt</th>
                      <th className="py-3 px-3">Aylık Net</th>
                      <th className="py-3 px-3">Compa-Ratio</th>
                      <th className="py-3 px-3">Kişi Başı İşveren/Ay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.roleBreakdowns.map((b) => (
                      <tr key={b.role.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          [{b.role.levelCode}] {b.role.roleTitle}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          ${b.role.monthlyGrossUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          ${b.monthlyNetTakeHomeUsd.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-pink-300">
                          %{b.compaRatioPct}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          ${b.monthlyTotalEmployerCostPerHeadUsd.toLocaleString()}/ay
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
                Masaüstü Başlatıcı (.BAT) — Port 5214
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
title Corpus Payroll & Global EOR Studio (#042 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-payroll"
start http://localhost:5214
npm run dev -- --port 5214`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
