import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Flame,
  Terminal,
  Activity,
  Code2,
  Eye,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Plus,
  Trash2,
  Gauge,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type LoadTestProject,
  PRESET_LOADTEST_PROJECT,
  simulateLoadAndCapacity,
  generateLoadTestScript,
} from './utils/loadtestEngine';

export default function App() {
  const [project, setProject] = useState<LoadTestProject>(
    PRESET_LOADTEST_PROJECT
  );
  const [rightMode, setRightMode] = useState<'canvas' | 'steps' | 'script'>(
    'canvas'
  );
  const [scriptTool, setScriptTool] = useState<'k6' | 'locust'>('k6');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => simulateLoadAndCapacity(project), [project]);
  const generatedScript = useMemo(
    () => generateLoadTestScript(project, scriptTool),
    [project, scriptTool]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Load Test Throughput, P99 Latency & USL Bottleneck Poster
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
    bg.addColorStop(0, '#0d0705');
    bg.addColorStop(0.5, '#190e08');
    bg.addColorStop(1, '#090b12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.035)';
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
      `CORPUS CHAOS, K6/LOCUST LOAD TESTING & CAPACITY STRESS STUDIO  •  PROFILE: ${project.profileType}  •  PEAK VUs: ${project.peakVirtualUsers.toLocaleString()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(project.testSuiteName, 74, 112);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Cluster: ${project.appServerReplicas} Pods × ${project.vCpuPerReplica} vCPU   |   DB Pool Max: ${project.dbConnectionPoolMax} Conns   |   Network Egress @ Peak: ${summary.bandwidthMbps} Mbps   |   Target: ${project.targetBaseUrl}`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(249, 115, 22, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#f97316';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#fdba74';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('PEAK SUSTAINED THROUGHPUT', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `${summary.estimatedPeakRps.toLocaleString()} RPS`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Breaking Point: ~${summary.breakingPointVu.toLocaleString()} VUs`,
      W - 570,
      133
    );

    ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('P95 / P99 LATENCY @ PEAK', W - 300, 76);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(
      `${summary.peakP95LatencyMs}ms / ${summary.peakP99LatencyMs}ms`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `DB Pool: ${summary.peakDbConnectionsUsed}/${project.dbConnectionPoolMax} Conns`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Step Stress Curve Table (10% -> 125% Load)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 960, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 960, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '1. UNIVERSAL SCALABILITY LAW (USL) STEP-STRESS SATURATION MATRIX',
      74,
      218
    );

    let stY = 266;
    for (const st of summary.curveSteps) {
      const isOverload = st.errorRate5xxPct > 1.0 || st.dbPoolUtilizationPct >= 90;
      ctx.fillStyle = isOverload
        ? 'rgba(239, 68, 68, 0.12)'
        : 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, stY - 22, 908, 114);
      ctx.strokeStyle = isOverload ? '#ef4444' : 'rgba(255,255,255,0.07)';
      ctx.strokeRect(74, stY - 22, 908, 114);

      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(
        `${st.stepLabel} (${st.virtualUsers.toLocaleString()} VUs)`,
        96,
        stY + 6
      );

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${st.achievedRps.toLocaleString()} RPS`, 790, stY + 8);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px monospace';
      ctx.fillText(
        `p50: ${st.p50LatencyMs}ms   |   p95: ${st.p95LatencyMs}ms   |   p99: ${st.p99LatencyMs}ms   |   DB Pool: ${st.dbPoolUtilizationPct}%   |   HTTP 5xx Error: ${st.errorRate5xxPct}%`,
        96,
        stY + 42
      );

      // DB Pool bar
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(96, stY + 60, 860, 12);
      ctx.fillStyle = st.dbPoolUtilizationPct > 85 ? '#ef4444' : '#f97316';
      ctx.fillRect(96, stY + 60, (860 * st.dbPoolUtilizationPct) / 100, 12);

      stY += 126;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: API Scenarios & SLA Thresholds
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(1032, 180, 840, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(1032, 180, 840, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '2. WEIGHTED API SCENARIO FLOWS & DB QUERY AMPLIFICATION',
      1060,
      218
    );

    let epY = 266;
    for (const ep of project.endpoints) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(1060, epY - 22, 784, 156);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(1060, epY - 22, 784, 156);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        `[${ep.method}] ${ep.path}  •  Weight: ${ep.trafficWeightPct}%`,
        1084,
        epY + 8
      );

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(ep.name, 1084, epY + 40);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Base Latency: ${ep.baseLatencyMs}ms   |   DB Queries/Call: ${ep.dbQueriesPerCall}x   |   Payload: ${ep.payloadSizeKb} KB`,
        1084,
        epY + 74
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `k6 Threshold Gate: p(95) < ${ep.slaP95ThresholdMs}ms`,
        1084,
        epY + 104
      );

      epY += 176;
    }
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-loadtest-stress-curve-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summary.curveSteps),
      'Stress Saturation Steps'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(project.endpoints),
      'API Endpoints'
    );
    XLSX.writeFile(wb, `corpus-loadtest-capacity.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-orange-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 flex items-center justify-center shadow-lg shadow-orange-950/50">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Chaos, Load Testing (k6/Locust) & Stress Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full">
                #043 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Little&apos;s Law & USL Capacity Modeler • P95/P99 Saturation • Grafana k6 & Locust Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Peak RPS:</span>
            <span className="font-mono font-bold text-orange-400">
              {summary.estimatedPeakRps.toLocaleString()}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">P99:</span>
            <span className="font-mono font-bold text-rose-400">
              {summary.peakP99LatencyMs}ms
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Stres Tablosu (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Stres Eğrisi Kartı İndir
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
              <Gauge className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold uppercase text-white">
                Sanal Kullanıcı (VU), Küme & API Senaryoları
              </span>
            </div>
            <button
              onClick={() =>
                setProject({
                  ...project,
                  endpoints: [
                    ...project.endpoints,
                    {
                      id: `ep-${Date.now()}`,
                      name: 'User Profile & Loyalty Points Fetch',
                      method: 'GET',
                      path: '/v2/users/loyalty-balance',
                      trafficWeightPct: 15,
                      baseLatencyMs: 35,
                      dbQueriesPerCall: 2,
                      payloadSizeKb: 6,
                      slaP95ThresholdMs: 180,
                    },
                  ],
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Endpoint Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Eşzamanlı Sanal Kullanıcı (Peak VUs)</span>
                  <span className="font-mono font-bold text-orange-400">
                    {project.peakVirtualUsers.toLocaleString()} VU
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={project.peakVirtualUsers}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      peakVirtualUsers: Number(e.target.value),
                    })
                  }
                  className="w-full accent-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400">
                    Pod Replikası
                  </label>
                  <input
                    type="number"
                    value={project.appServerReplicas}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        appServerReplicas: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400">
                    vCPU / Pod
                  </label>
                  <input
                    type="number"
                    value={project.vCpuPerReplica}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        vCpuPerReplica: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400">
                    DB Pool Max
                  </label>
                  <input
                    type="number"
                    value={project.dbConnectionPoolMax}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        dbConnectionPoolMax: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                  />
                </div>
              </div>
            </div>

            {project.endpoints.map((ep, idx) => (
              <div
                key={ep.id}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={ep.method}
                    onChange={(e) => {
                      const next = [...project.endpoints];
                      next[idx] = {
                        ...ep,
                        method: e.target.value as typeof ep.method,
                      };
                      setProject({ ...project, endpoints: next });
                    }}
                    className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-orange-400"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="text"
                    value={ep.path}
                    onChange={(e) => {
                      const next = [...project.endpoints];
                      next[idx] = { ...ep, path: e.target.value };
                      setProject({ ...project, endpoints: next });
                    }}
                    className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                  />
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        endpoints: project.endpoints.filter((_, i) => i !== idx),
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
                      Baz Gecikme (ms)
                    </label>
                    <input
                      type="number"
                      value={ep.baseLatencyMs}
                      onChange={(e) => {
                        const next = [...project.endpoints];
                        next[idx] = {
                          ...ep,
                          baseLatencyMs: Number(e.target.value),
                        };
                        setProject({ ...project, endpoints: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      DB Sorgu Adedi
                    </label>
                    <input
                      type="number"
                      value={ep.dbQueriesPerCall}
                      onChange={(e) => {
                        const next = [...project.endpoints];
                        next[idx] = {
                          ...ep,
                          dbQueriesPerCall: Number(e.target.value),
                        };
                        setProject({ ...project, endpoints: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400">
                      Ağırlık (%)
                    </label>
                    <input
                      type="number"
                      value={ep.trafficWeightPct}
                      onChange={(e) => {
                        const next = [...project.endpoints];
                        next[idx] = {
                          ...ep,
                          trafficWeightPct: Number(e.target.value),
                        };
                        setProject({ ...project, endpoints: next });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
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
                { id: 'canvas', label: '4K USL Stres & P99 Gecikme Kartı', icon: Eye },
                { id: 'steps', label: 'Kademeli Yük & DB Havuz Doygunluğu', icon: Activity },
                { id: 'script', label: 'Grafana k6 (.js) & Locust (.py) Kodu', icon: Code2 },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
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

            {rightMode === 'steps' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Yük Kademesi</th>
                      <th className="py-3 px-3">RPS</th>
                      <th className="py-3 px-3">p50 / p95 / p99</th>
                      <th className="py-3 px-3">DB Pool (%)</th>
                      <th className="py-3 px-3">HTTP 5xx (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.curveSteps.map((s) => (
                      <tr key={s.stepLabel} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-bold text-white">
                          {s.stepLabel} ({s.virtualUsers.toLocaleString()} VU)
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          {s.achievedRps.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-zinc-200">
                          {s.p50LatencyMs}ms / {s.p95LatencyMs}ms / {s.p99LatencyMs}ms
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          %{s.dbPoolUtilizationPct}
                        </td>
                        <td className="py-3 px-3 text-rose-400">
                          %{s.errorRate5xxPct}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'script' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScriptTool('k6')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                        scriptTool === 'k6'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Grafana k6 (loadtest.k6.js)
                    </button>
                    <button
                      onClick={() => setScriptTool('locust')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                        scriptTool === 'locust'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Python Locust (locustfile.py)
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedScript);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 1800);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Yük Testi Kodunu Kopyala
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-orange-300 overflow-x-auto leading-relaxed">
                  {generatedScript}
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
                Masaüstü Başlatıcı (.BAT) — Port 5215
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
title Corpus Chaos & LoadTest Studio (#043 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-loadtest"
start http://localhost:5215
npm run dev -- --port 5215`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
