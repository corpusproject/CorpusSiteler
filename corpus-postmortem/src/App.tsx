import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Terminal,
  Clock,
  Activity,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  FileText,
  AlertOctagon,
  CheckCircle2,
  DollarSign,
  ServerCrash,
  ListChecks,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type IncidentPostmortemProject,
  type IncidentSeverity,
  type TimelineEvent,
  type CorrectiveAction,
  PRESET_INCIDENTS,
  calculateSreMetrics,
  parseRawServerLogs,
  generatePostmortemMarkdown,
} from './utils/postmortemEngine';

export default function App() {
  const [project, setProject] = useState<IncidentPostmortemProject>(
    PRESET_INCIDENTS.db_pool_exhaustion
  );
  const [leftTab, setLeftTab] = useState<'incident' | 'logs' | 'rca' | 'capa'>('incident');
  const [rightMode, setRightMode] = useState<'canvas' | 'siem' | 'sla' | 'markdown'>('canvas');
  const [copiedMd, setCopiedMd] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sreMetrics = useMemo(() => calculateSreMetrics(project), [project]);
  const parsedLogs = useMemo(
    () => parseRawServerLogs(project.rawLogDump),
    [project.rawLogDump]
  );
  const markdownDoc = useMemo(
    () => generatePostmortemMarkdown(project, sreMetrics),
    [project, sreMetrics]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Executive Incident Postmortem & SRE SLA Report Canvas
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

    // Dark Enterprise Command Center Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#09070a');
    bg.addColorStop(0.5, '#110c14');
    bg.addColorStop(1, '#090a10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
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

    // Top Severity Bar
    ctx.fillStyle = project.accentColor;
    ctx.fillRect(0, 0, W, 10);

    // Header Box
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(48, 36, W - 96, 124);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(48, 36, W - 96, 124);

    ctx.fillStyle = project.accentColor;
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      `OFFICIAL SRE BLAMELESS POSTMORTEM  •  ${project.incidentId}  •  ${project.severity}  •  DATE: ${project.dateIso}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.fillText(project.title.slice(0, 82), 74, 112);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Incident Commander: ${project.incidentCommander}   |   Lead SRE: ${project.leadSre}   |   Services: ${project.affectedServices.join(', ')}`,
      74,
      142
    );

    // Top Right SLA & TTR KPI Badges
    ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
    ctx.fillRect(W - 580, 52, 245, 92);
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(W - 580, 52, 245, 92);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('TOTAL OUTAGE (TTR) / BUDGET', W - 562, 78);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${sreMetrics.ttrMinutes}m (${sreMetrics.errorBudgetConsumedPct}%)`, W - 562, 115);
    ctx.fillStyle = '#f87171';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(
      `TTD: ${sreMetrics.ttdMinutes}m  •  TTM: ${sreMetrics.ttmMinutes}m`,
      W - 562,
      135
    );

    ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
    ctx.fillRect(W - 315, 52, 245, 92);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(W - 315, 52, 245, 92);
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('SLA UPTIME & CREDIT PENALTY', W - 297, 78);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(
      `$${sreMetrics.financialPenaltyUsd.toLocaleString('en-US')}`,
      W - 297,
      114
    );
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Actual: ${sreMetrics.actualMonthlyUptimePct}% (${sreMetrics.slaCreditTierPct}% Credit)`,
      W - 297,
      135
    );

    // ------------------------------------------------------------------------
    // SECTION 1: SRE Outage Lifecycle & Error Rate Curve (x: 48, y: 184, w: 900, h: 410)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 184, 900, 410);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 184, 900, 410);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '1. SRE INCIDENT TIMELINE & HTTP 5XX BURN PROFILE',
      74,
      220
    );

    // Simulated Burn Curve Area inside (74, 245, 848, 175)
    const chartX = 74;
    const chartY = 245;
    const chartW = 848;
    const chartH = 165;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(chartX, chartY, chartW, chartH);

    const curvePoints = [
      { x: 0.0, y: 0.05, label: `Start (${project.outageStartTime})` },
      { x: 0.14, y: 0.65, label: `Alert (${project.alertFiredTime})` },
      { x: 0.35, y: 0.95, label: `Peak ${project.peakErrorRatePct}% 5xx` },
      { x: 0.58, y: 0.88, label: 'Rollback Initiated' },
      { x: 0.76, y: 0.22, label: `Mitigated (${project.mitigationAppliedTime})` },
      { x: 1.0, y: 0.02, label: `Resolved (${project.fullRecoveryTime})` },
    ];

    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartH);
    for (const pt of curvePoints) {
      const px = chartX + pt.x * chartW;
      const py = chartY + chartH - pt.y * (chartH - 28);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
    areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Stroke curve
    ctx.beginPath();
    curvePoints.forEach((pt, i) => {
      const px = chartX + pt.x * chartW;
      const py = chartY + chartH - pt.y * (chartH - 28);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Plot milestone dots
    for (const pt of curvePoints) {
      const px = chartX + pt.x * chartW;
      const py = chartY + chartH - pt.y * (chartH - 28);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(pt.label, Math.min(chartX + chartW - 135, Math.max(chartX + 6, px - 40)), py - 10);
    }

    // Chronological Timeline List below chart
    let tlY = 442;
    for (const ev of project.timeline.slice(0, 4)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, tlY - 18, 848, 32);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(ev.timeUtc, 86, tlY + 2);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`[${ev.phase}]`, 180, tlY + 2);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(`${ev.actor}: ${ev.summary.slice(0, 74)}`, 305, tlY + 2);

      tlY += 36;
    }

    // ------------------------------------------------------------------------
    // SECTION 2: 5-Whys Root Cause Chain (x: 48, y: 614, w: 900, h: 418)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 614, 900, 418);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 614, 900, 418);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('2. 5-WHYS ROOT CAUSE ANALYSIS (CAUSAL CHAIN)', 74, 650);

    let whyY = 686;
    project.fiveWhys.slice(0, 5).forEach((whyText, idx) => {
      ctx.fillStyle = idx === 4 ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, whyY - 22, 848, 56);

      ctx.fillStyle = idx === 4 ? '#ef4444' : '#f59e0b';
      ctx.fillRect(74, whyY - 22, 6, 56);

      ctx.font = 'bold 13px monospace';
      ctx.fillText(`WHY #${idx + 1}`, 92, whyY);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(whyText.slice(0, 95), 165, whyY);
      if (whyText.length > 95) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(whyText.slice(95, 190), 165, whyY + 20);
      }

      whyY += 66;
    });

    // ------------------------------------------------------------------------
    // SECTION 3 (RIGHT TOP): SIEM Anomaly Telemetry & SLA Impact (x: 972, y: 184, w: 900, h: 410)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(972, 184, 900, 410);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(972, 184, 900, 410);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      `3. SIEM LOG TELEMETRY (${parsedLogs.fatalCount} FATAL • ${parsedLogs.errorCount} ERROR • P99: ${parsedLogs.p99LatencyMs}ms)`,
      998,
      220
    );

    let logY = 260;
    for (const entry of parsedLogs.entries.slice(0, 6)) {
      const lvlColor =
        entry.level === 'FATAL'
          ? '#ef4444'
          : entry.level === 'ERROR'
          ? '#f97316'
          : entry.level === 'WARN'
          ? '#eab308'
          : '#10b981';

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(998, logY - 18, 848, 44);

      ctx.fillStyle = lvlColor;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[${entry.level}]`, 1010, logY);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${entry.service} (${entry.statusCode})`, 1090, logY);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`${entry.latencyMs}ms`, 1360, logY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(entry.message.slice(0, 96), 1010, logY + 18);

      logY += 52;
    }

    // ------------------------------------------------------------------------
    // SECTION 4 (RIGHT BOTTOM): CAPA Action Items & SLA Financial Box (x: 972, y: 614, w: 900, h: 418)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(972, 614, 900, 418);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(972, 614, 900, 418);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '4. CORRECTIVE & PREVENTATIVE ACTIONS (CAPA) & SLA GOVERNANCE',
      998,
      650
    );

    let capaY = 690;
    for (const item of project.actionItems.slice(0, 4)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(998, capaY - 22, 848, 58);

      ctx.fillStyle = item.priority === 'P0' ? '#ef4444' : '#3b82f6';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`[${item.priority} • ${item.jiraKey}]`, 1014, capaY);

      ctx.fillStyle = '#10b981';
      ctx.fillText(item.category, 1175, capaY);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(item.title.slice(0, 74), 1275, capaY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(
        `Owner: ${item.owner}   |   Target Date: ${item.dueDate}   |   Status: ${
          item.completed ? 'VERIFIED COMPLETE' : 'IN PROGRESS'
        }`,
        1014,
        capaY + 22
      );

      capaY += 68;
    }

    // Bottom SLA Governance Callout
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(998, 938, 848, 72);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.strokeRect(998, 938, 848, 72);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(
      `SLA GOVERNANCE VERDICT: Contracted ${project.ContractedSlaPct}% (${sreMetrics.monthlyAllowedDowntimeMin}m/mo allowed) vs Actual ${sreMetrics.actualMonthlyUptimePct}% (${sreMetrics.ttrMinutes}m downtime).`,
      1018,
      966
    );
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(
      `Failed Requests: ${project.failedRequestsCount.toLocaleString()} (${sreMetrics.customerErrorRatioPct}%)  •  Contractual Credit Tier: ${sreMetrics.slaCreditTierPct}% ($${sreMetrics.financialPenaltyUsd.toLocaleString()} Liability)`,
      1018,
      992
    );
  }, [project, sreMetrics, parsedLogs]);

  // --------------------------------------------------------------------------
  // Export Handlers (4K PNG, Multi-Sheet Excel .xlsx, Markdown)
  // --------------------------------------------------------------------------
  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${project.incidentId.toLowerCase()}-postmortem-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      { Metric: 'Incident ID', Value: project.incidentId },
      { Metric: 'Title', Value: project.title },
      { Metric: 'Severity', Value: project.severity },
      { Metric: 'Incident Commander', Value: project.incidentCommander },
      { Metric: 'Time to Detect (TTD min)', Value: sreMetrics.ttdMinutes },
      { Metric: 'Time to Mitigate (TTM min)', Value: sreMetrics.ttmMinutes },
      { Metric: 'Total Resolution Time (TTR min)', Value: sreMetrics.ttrMinutes },
      { Metric: 'Contracted SLA (%)', Value: project.ContractedSlaPct },
      { Metric: 'Actual Monthly Uptime (%)', Value: sreMetrics.actualMonthlyUptimePct },
      { Metric: 'Error Budget Burned (%)', Value: sreMetrics.errorBudgetConsumedPct },
      { Metric: 'SLA Credit Penalty ($)', Value: sreMetrics.financialPenaltyUsd },
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summaryRows),
      'SLA & SRE Summary'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(project.timeline),
      'Incident Timeline'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(project.actionItems),
      'CAPA Action Items'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(parsedLogs.entries),
      'Parsed SIEM Logs'
    );

    XLSX.writeFile(wb, `${project.incidentId}-postmortem-report.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-rose-500/30">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <ServerCrash className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Log, SIEM & Postmortem Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full">
                #035 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              SIEM Log Parser • TTD/TTM/TTR Outage Timeline • 99.99% SLA Penalty & 4K RCA Studio
            </p>
          </div>
        </div>

        {/* Center Incident Presets */}
        <div className="hidden xl:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setProject(PRESET_INCIDENTS.db_pool_exhaustion)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              project.incidentId === 'INC-2026-0842'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            PostgreSQL Pool Exhaustion (SEV-1)
          </button>
          <button
            onClick={() => setProject(PRESET_INCIDENTS.bgp_dns_blackhole)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              project.incidentId === 'INC-2026-0915'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Anycast DNSSEC Outage (SEV-1)
          </button>
        </div>

        {/* Right Actions & KPI Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">TTR:</span>
            <span className="font-mono font-bold text-rose-400">
              {sreMetrics.ttrMinutes}m
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Uptime:</span>
            <span className="font-mono font-bold text-amber-400">
              %{sreMetrics.actualMonthlyUptimePct}
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Excel (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Postmortem Raporu İndir
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

      {/* MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE: 5 Columns */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 bg-[#0c0c0f] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="grid grid-cols-4 gap-1 p-2 bg-zinc-900/70 border-b border-zinc-800">
            {[
              { id: 'incident', label: 'Olay & SLA', icon: Clock },
              { id: 'logs', label: `SIEM Log (${parsedLogs.entries.length})`, icon: Activity },
              { id: 'rca', label: '5-Whys & Zaman', icon: HelpCircle },
              { id: 'capa', label: `Aksiyonlar (${project.actionItems.length})`, icon: ListChecks },
            ].map((t) => {
              const Icon = t.icon;
              const active = leftTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {leftTab === 'incident' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                      Olay Kodu
                    </label>
                    <input
                      type="text"
                      value={project.incidentId}
                      onChange={(e) =>
                        setProject({ ...project, incidentId: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                      Kritiklik (Severity)
                    </label>
                    <select
                      value={project.severity}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          severity: e.target.value as IncidentSeverity,
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    >
                      <option value="SEV-1 (CRITICAL)">SEV-1 (CRITICAL)</option>
                      <option value="SEV-2 (MAJOR)">SEV-2 (MAJOR)</option>
                      <option value="SEV-3 (MINOR)">SEV-3 (MINOR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                      Tarih (ISO)
                    </label>
                    <input
                      type="text"
                      value={project.dateIso}
                      onChange={(e) =>
                        setProject({ ...project, dateIso: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Kesinti Başlığı (Incident Title)
                  </label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>

                {/* Outage Timestamps -> TTD, TTM, TTR */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase">
                      Kesinti Zaman Çizelgesi (UTC SS:DD)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      TTD: {sreMetrics.ttdMinutes}m • TTM: {sreMetrics.ttmMinutes}m • TTR:{' '}
                      {sreMetrics.ttrMinutes}m
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Başlangıç (Start)
                      </label>
                      <input
                        type="text"
                        value={project.outageStartTime}
                        onChange={(e) =>
                          setProject({ ...project, outageStartTime: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Alarm (Detected)
                      </label>
                      <input
                        type="text"
                        value={project.alertFiredTime}
                        onChange={(e) =>
                          setProject({ ...project, alertFiredTime: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Müdahale (Mitigated)
                      </label>
                      <input
                        type="text"
                        value={project.mitigationAppliedTime}
                        onChange={(e) =>
                          setProject({ ...project, mitigationAppliedTime: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Tam Çözüm (Resolved)
                      </label>
                      <input
                        type="text"
                        value={project.fullRecoveryTime}
                        onChange={(e) =>
                          setProject({ ...project, fullRecoveryTime: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                {/* SLA & Financial Impact */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 uppercase block">
                    SLA Taahhüdü & Finansal Ceza Parametreleri
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Sözleşme SLA Hedefi (%)
                      </label>
                      <select
                        value={project.ContractedSlaPct}
                        onChange={(e) =>
                          setProject({
                            ...project,
                            ContractedSlaPct: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                      >
                        <option value={99.9}>99.9% (43.2 dk/ay izinli)</option>
                        <option value={99.95}>99.95% (21.6 dk/ay izinli)</option>
                        <option value={99.99}>99.99% (4.32 dk/ay izinli)</option>
                        <option value={99.999}>99.999% (26 sn/ay izinli)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Risk Altındaki Aylık Gelir ($)
                      </label>
                      <input
                        type="number"
                        step="25000"
                        value={project.monthlyArrAtRiskUsd}
                        onChange={(e) =>
                          setProject({
                            ...project,
                            monthlyArrAtRiskUsd: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Kesinti Anındaki Toplam İstek
                      </label>
                      <input
                        type="number"
                        value={project.totalRequestsDuringWindow}
                        onChange={(e) =>
                          setProject({
                            ...project,
                            totalRequestsDuringWindow: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Başarısız (HTTP 5xx) İstek Sayısı
                      </label>
                      <input
                        type="number"
                        value={project.failedRequestsCount}
                        onChange={(e) =>
                          setProject({
                            ...project,
                            failedRequestsCount: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-rose-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Yönetici Özeti (Executive Summary)
                  </label>
                  <textarea
                    rows={4}
                    value={project.executiveSummary}
                    onChange={(e) =>
                      setProject({ ...project, executiveSummary: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 leading-relaxed"
                  />
                </div>
              </>
            )}

            {leftTab === 'logs' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-rose-400">
                      HAM SUNUCU / KUBERNETES / SIEM LOG DÖKÜMÜ
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {parsedLogs.fatalCount} FATAL • {parsedLogs.errorCount} ERROR
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={project.rawLogDump}
                    onChange={(e) =>
                      setProject({ ...project, rawLogDump: e.target.value })
                    }
                    placeholder="Sunucu loglarını buraya yapıştırın..."
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 leading-relaxed outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-zinc-200">
                    Otomatik SIEM Anomali Özeti
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">
                        En Çok Hata Veren Servis
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        {parsedLogs.topFailingService}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">
                        Maksimum (P99) Gecikme
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {parsedLogs.p99LatencyMs.toLocaleString()} ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'rca' && (
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase text-amber-400">
                    5-Whys Kök Neden Analizi Zinciri
                  </h3>
                  {project.fiveWhys.map((w, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[11px] font-mono text-zinc-400">
                        Why #{idx + 1}
                      </label>
                      <textarea
                        rows={2}
                        value={w}
                        onChange={(e) => {
                          const next = [...project.fiveWhys];
                          next[idx] = e.target.value;
                          setProject({ ...project, fiveWhys: next });
                        }}
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                      />
                    </div>
                  ))}
                </div>

                {/* Timeline Events Editor */}
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-cyan-400">
                      Kronolojik Olay Adımları
                    </h3>
                    <button
                      onClick={() =>
                        setProject({
                          ...project,
                          timeline: [
                            ...project.timeline,
                            {
                              id: `tl-${Date.now()}`,
                              timeUtc: '14:55 UTC',
                              phase: 'RECOVERY',
                              actor: 'On-Call SRE',
                              summary: 'Yeni müdahale kaydı...',
                              isKeyMilestone: false,
                            },
                          ],
                        })
                      }
                      className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Adım Ekle
                    </button>
                  </div>

                  {project.timeline.map((ev, i) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ev.timeUtc}
                          onChange={(e) => {
                            const next = [...project.timeline];
                            next[i] = { ...ev, timeUtc: e.target.value };
                            setProject({ ...project, timeline: next });
                          }}
                          className="w-24 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                        />
                        <select
                          value={ev.phase}
                          onChange={(e) => {
                            const next = [...project.timeline];
                            next[i] = {
                              ...ev,
                              phase: e.target.value as TimelineEvent['phase'],
                            };
                            setProject({ ...project, timeline: next });
                          }}
                          className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-cyan-300"
                        >
                          <option value="DETECTION">DETECTION</option>
                          <option value="ESCALATION">ESCALATION</option>
                          <option value="DIAGNOSIS">DIAGNOSIS</option>
                          <option value="MITIGATION">MITIGATION</option>
                          <option value="RECOVERY">RECOVERY</option>
                        </select>
                        <input
                          type="text"
                          value={ev.actor}
                          onChange={(e) => {
                            const next = [...project.timeline];
                            next[i] = { ...ev, actor: e.target.value };
                            setProject({ ...project, timeline: next });
                          }}
                          className="flex-1 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                        />
                        <button
                          onClick={() =>
                            setProject({
                              ...project,
                              timeline: project.timeline.filter((_, idx) => idx !== i),
                            })
                          }
                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={ev.summary}
                        onChange={(e) => {
                          const next = [...project.timeline];
                          next[i] = { ...ev, summary: e.target.value };
                          setProject({ ...project, timeline: next });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'capa' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-emerald-400">
                    CAPA Düzeltici & Önleyici Aksiyonlar
                  </h3>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        actionItems: [
                          ...project.actionItems,
                          {
                            id: `ca-${Date.now()}`,
                            jiraKey: `SRE-${4120 + project.actionItems.length}`,
                            category: 'PREVENT',
                            priority: 'P1',
                            owner: 'Platform SRE',
                            dueDate: '2026-11-05',
                            title: 'Yeni önleyici mühendislik aksiyonu...',
                            completed: false,
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Aksiyon Ekle
                  </button>
                </div>

                {project.actionItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => {
                          const next = [...project.actionItems];
                          next[idx] = { ...item, completed: e.target.checked };
                          setProject({ ...project, actionItems: next });
                        }}
                        className="accent-emerald-500"
                      />
                      <input
                        type="text"
                        value={item.jiraKey}
                        onChange={(e) => {
                          const next = [...project.actionItems];
                          next[idx] = { ...item, jiraKey: e.target.value };
                          setProject({ ...project, actionItems: next });
                        }}
                        className="w-24 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-rose-300"
                      />
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const next = [...project.actionItems];
                          next[idx] = {
                            ...item,
                            category: e.target.value as CorrectiveAction['category'],
                          };
                          setProject({ ...project, actionItems: next });
                        }}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-emerald-300"
                      >
                        <option value="PREVENT">PREVENT</option>
                        <option value="DETECT">DETECT</option>
                        <option value="MITIGATE">MITIGATE</option>
                      </select>
                      <select
                        value={item.priority}
                        onChange={(e) => {
                          const next = [...project.actionItems];
                          next[idx] = {
                            ...item,
                            priority: e.target.value as CorrectiveAction['priority'],
                          };
                          setProject({ ...project, actionItems: next });
                        }}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-amber-300"
                      >
                        <option value="P0">P0</option>
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                      </select>
                      <button
                        onClick={() =>
                          setProject({
                            ...project,
                            actionItems: project.actionItems.filter((_, i) => i !== idx),
                          })
                        }
                        className="ml-auto text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...project.actionItems];
                        next[idx] = { ...item, title: e.target.value };
                        setProject({ ...project, actionItems: next });
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: 7 Columns */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Postmortem Rapor Kartı', icon: Eye },
                { id: 'siem', label: 'SIEM Ayrıştırılmış Log Tablosu', icon: AlertOctagon },
                { id: 'sla', label: 'SLA & Hata Bütçesi Hesaplayıcı', icon: DollarSign },
                { id: 'markdown', label: 'Resmi Markdown Raporu', icon: FileText },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
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
                    <div className="text-[11px] text-zinc-400">TTD / TTM / TTR</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {sreMetrics.ttdMinutes}m / {sreMetrics.ttmMinutes}m / {sreMetrics.ttrMinutes}m
                    </div>
                    <div className="text-[11px] text-rose-400">
                      Algılama • Müdahale • Çözüm
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Gerçekleşen Aylık Uptime</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      %{sreMetrics.actualMonthlyUptimePct}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Hedef SLA: %{project.ContractedSlaPct}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Hata Bütçesi Tüketimi</div>
                    <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                      %{sreMetrics.errorBudgetConsumedPct}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      İzinli: {sreMetrics.monthlyAllowedDowntimeMin} dk/ay
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">SLA Hizmet Kredisi Cezası</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      ${sreMetrics.financialPenaltyUsd.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      %{sreMetrics.slaCreditTierPct} İade Dilimi
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'siem' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Zaman (UTC)</th>
                      <th className="py-3 px-3">Seviye</th>
                      <th className="py-3 px-3">Mikroservis</th>
                      <th className="py-3 px-3">HTTP</th>
                      <th className="py-3 px-3">Gecikme</th>
                      <th className="py-3 px-4">Log Mesajı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {parsedLogs.entries.map((e) => (
                      <tr key={e.id} className="hover:bg-zinc-800/40">
                        <td className="py-2.5 px-4 text-zinc-400">{e.timestamp}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              e.level === 'FATAL'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : e.level === 'ERROR'
                                ? 'bg-orange-500/20 text-orange-300'
                                : e.level === 'WARN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {e.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300">{e.service}</td>
                        <td className="py-2.5 px-3 text-zinc-200">{e.statusCode}</td>
                        <td className="py-2.5 px-3 text-rose-400">{e.latencyMs}ms</td>
                        <td className="py-2.5 px-4 text-zinc-300 truncate max-w-md">
                          {e.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'sla' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {sreMetrics.slaBreached ? (
                      <ShieldAlert className="w-8 h-8 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {sreMetrics.slaBreached
                          ? 'SÖZLEŞME SLA İHLALİ TESPİT EDİLDİ (SERVICE CREDIT TRIGGERED)'
                          : 'SLA HATA BÜTÇESİ KORUNDU'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Hedef: %{project.ContractedSlaPct} • Gerçekleşen: %
                        {sreMetrics.actualMonthlyUptimePct}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-rose-400">
                      ${sreMetrics.financialPenaltyUsd.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      %{sreMetrics.slaCreditTierPct} Müşteri Fatura İadesi
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                        <th className="py-3 px-4">Aylık Uptime Dilimi</th>
                        <th className="py-3 px-4">İzinli Kesinti (30 Gün)</th>
                        <th className="py-3 px-4">SLA Hizmet Kredisi Cezası</th>
                        <th className="py-3 px-4">Finansal Karşılık</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {[
                        { tier: '99.99% - 100%', allowed: '0 - 4.32 dk', credit: 0 },
                        { tier: '99.90% - 99.98%', allowed: '4.33 - 43.2 dk', credit: 10 },
                        { tier: '99.00% - 99.89%', allowed: '43.3 - 432 dk', credit: 25 },
                        { tier: '95.00% - 98.99%', allowed: '433 - 2,160 dk', credit: 50 },
                        { tier: '< 95.00%', allowed: '> 2,160 dk', credit: 100 },
                      ].map((row) => {
                        const active = sreMetrics.slaCreditTierPct === row.credit;
                        return (
                          <tr
                            key={row.tier}
                            className={active ? 'bg-rose-500/15 font-bold' : ''}
                          >
                            <td className="py-3 px-4 text-white">{row.tier}</td>
                            <td className="py-3 px-4 text-zinc-300">{row.allowed}</td>
                            <td className="py-3 px-4 text-amber-400">%{row.credit}</td>
                            <td className="py-3 px-4 text-rose-400">
                              $
                              {Math.round(
                                project.monthlyArrAtRiskUsd * (row.credit / 100)
                              ).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rightMode === 'markdown' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(markdownDoc);
                      setCopiedMd(true);
                      setTimeout(() => setCopiedMd(false), 1800);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedMd ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Resmi Postmortem Markdown Kopyala
                  </button>
                </div>
                <pre className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {markdownDoc}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* .BAT MODAL */}
      {showBatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Masaüstü Başlatıcı (.BAT) — Port 5207
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
title Corpus Log, SIEM & Postmortem Studio (#035 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-postmortem"
start http://localhost:5207
npm run dev -- --port 5207`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
