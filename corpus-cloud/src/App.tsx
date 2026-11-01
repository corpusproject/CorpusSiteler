import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Cloud,
  Terminal,
  Server,
  Coins,
  Code2,
  Eye,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Plus,
  Trash2,
  Cpu,
  HardDrive,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type CloudArchitectureProject,
  type CloudProviderId,
  type WorkloadTier,
  CLOUD_PROVIDERS,
  PRESET_CLOUD_PROJECTS,
  calculateCloudFinOps,
  generateCloudIaC,
} from './utils/cloudEngine';

export default function App() {
  const [project, setProject] = useState<CloudArchitectureProject>(
    PRESET_CLOUD_PROJECTS.fintech_high_scale
  );
  const [leftTab, setLeftTab] = useState<'nodes' | 'strategy' | 'network'>('nodes');
  const [rightMode, setRightMode] = useState<'canvas' | 'matrix' | 'iac'>('canvas');
  const [iacFormat, setIacFormat] = useState<'terraform' | 'k8s_yaml' | 'docker_compose'>(
    'terraform'
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const finops = useMemo(() => calculateCloudFinOps(project), [project]);
  const selectedProviderResult = useMemo(
    () =>
      finops.results.find((r) => r.provider.id === project.selectedProvider) ||
      finops.results[0],
    [finops, project.selectedProvider]
  );
  const generatedCode = useMemo(
    () => generateCloudIaC(project, iacFormat),
    [project, iacFormat]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Multi-Cloud Topology & FinOps Blueprint Canvas
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
    bg.addColorStop(0, '#060a12');
    bg.addColorStop(0.5, '#0b1322');
    bg.addColorStop(1, '#070b14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Blueprint Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
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

    // Top Accent Bar
    ctx.fillStyle = project.accentColor;
    ctx.fillRect(0, 0, W, 8);

    // Header Banner
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(48, 36, W - 96, 120);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(48, 36, W - 96, 120);

    ctx.fillStyle = project.accentColor;
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      `CORPUS CLOUD & FINOPS TERRAFORM ARCHITECTURE  •  KUBERNETES v${project.kubernetesVersion}  •  ENV: ${project.environment.toUpperCase()}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText(project.projectName, 74, 114);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Cluster Footprint: ${finops.totalVCpu} vCPU  •  ${finops.totalRamGb} GB RAM  •  ${(finops.totalStorageGb / 1000).toFixed(1)} TB NVMe/Object  •  ${finops.totalEgressTb} TB/mo Egress  •  Est. Throughput: ${finops.estimatedMaxRpsCapacity.toLocaleString()} RPS`,
      74,
      142
    );

    // Top Right FinOps Badges
    ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#06b6d4';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(
      `SELECTED (${selectedProviderResult.provider.id.toUpperCase()}) MONTHLY`,
      W - 570,
      76
    );
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${Math.round(selectedProviderResult.optimizedBlendedMonthlyUsd).toLocaleString()}/mo`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`Strategy: ${project.commitmentStrategy}`, W - 570, 133);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('ANNUAL FINOPS RI/SPOT SAVINGS', W - 300, 76);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `+$${Math.round(selectedProviderResult.annualSavingsWithFinOpsUsd).toLocaleString()}/yr`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `vs On-Demand ($${Math.round(selectedProviderResult.onDemandMonthlyUsd).toLocaleString()}/mo)`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Kubernetes & Infrastructure Node Pools (x: 48, y: 180, w: 940, h: 852)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 940, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 940, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(
      '1. KUBERNETES HPA NODE-POOLS & STATEFUL INFRASTRUCTURE TOPOLOGY',
      74,
      218
    );

    let nodeY = 256;
    for (const node of project.nodes.slice(0, 6)) {
      const tierCol =
        node.tier === 'COMPUTE_K8S'
          ? '#06b6d4'
          : node.tier === 'MANAGED_DB'
          ? '#f59e0b'
          : node.tier === 'CACHE_REDIS'
          ? '#ec4899'
          : '#10b981';

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, nodeY - 22, 888, 112);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(74, nodeY - 22, 888, 112);

      ctx.fillStyle = tierCol;
      ctx.fillRect(74, nodeY - 22, 8, 112);

      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[${node.tier}]`, 98, nodeY + 2);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(node.name, 250, nodeY + 2);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(node.serviceRole, 98, nodeY + 28);

      // Specs pills
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `Instance: ${node.vCpuPerInstance} vCPU / ${node.ramGbPerInstance} GB RAM   |   Disk: ${node.storageGb} GB   |   HPA Replicas: ${node.minReplicas} → ${node.maxReplicas} pods   |   Egress: ${node.monthlyEgressTb} TB/mo`,
        98,
        nodeY + 56
      );

      // Right tags
      ctx.fillStyle = node.multiAzHa ? '#10b981' : '#64748b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        node.multiAzHa ? 'MULTI-AZ HA' : 'SINGLE-AZ',
        830,
        nodeY + 2
      );
      if (node.spotEligible) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('SPOT READY', 830, nodeY + 24);
      }

      nodeY += 126;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: Multi-Cloud FinOps Benchmark Matrix (x: 1012, y: 180, w: 860, h: 852)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(1012, 180, 860, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(1012, 180, 860, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(
      '2. MULTI-CLOUD FINOPS TCO MATRIX (AWS vs GCP vs AZURE vs HETZNER)',
      1038,
      218
    );

    const maxCost = Math.max(...finops.results.map((r) => r.onDemandMonthlyUsd), 1);
    let provY = 262;

    for (const res of finops.results) {
      const isSel = res.provider.id === project.selectedProvider;

      ctx.fillStyle = isSel ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.025)';
      ctx.fillRect(1038, provY - 22, 808, 152);
      ctx.strokeStyle = isSel ? '#06b6d4' : 'rgba(255,255,255,0.07)';
      ctx.strokeRect(1038, provY - 22, 808, 152);

      ctx.fillStyle = res.provider.badgeColor;
      ctx.beginPath();
      ctx.arc(1062, provY + 4, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText(
        `${res.provider.name} — ${res.provider.regionName}`,
        1082,
        provY + 10
      );

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(
        `$${Math.round(res.optimizedBlendedMonthlyUsd).toLocaleString()}/mo`,
        1660,
        provY + 10
      );

      // Breakdown line
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Compute: $${Math.round(res.computeCostUsd).toLocaleString()}  •  DB: $${Math.round(res.databaseCostUsd).toLocaleString()}  •  Cache/Obj: $${Math.round(res.storageAndCacheCostUsd).toLocaleString()}  •  Egress/NAT: $${Math.round(res.networkEgressAndNatUsd).toLocaleString()}`,
        1062,
        provY + 42
      );

      // Commitment comparison bars
      const onDemandW = Math.max(20, (res.onDemandMonthlyUsd / maxCost) * 520);
      const optW = Math.max(20, (res.optimizedBlendedMonthlyUsd / maxCost) * 520);

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(1062, provY + 62, onDemandW, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(
        `On-Demand: $${Math.round(res.onDemandMonthlyUsd).toLocaleString()}/mo`,
        1062 + onDemandW + 12,
        provY + 72
      );

      ctx.fillStyle = res.provider.badgeColor;
      ctx.fillRect(1062, provY + 84, optW, 14);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `FinOps Optimized: $${Math.round(res.optimizedBlendedMonthlyUsd).toLocaleString()}/mo (3Yr RI: $${Math.round(res.reserved3YrMonthlyUsd).toLocaleString()})`,
        1062 + optW + 12,
        provY + 96
      );

      provY += 172;
    }

    // Bottom Architecture Callout
    ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
    ctx.fillRect(1038, 945, 808, 66);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.strokeRect(1038, 945, 808, 66);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(
      `TERRAFORM & K8S READY: Multi-AZ NAT=${project.enableMultiAzNat} | Istio Service Mesh=${project.enableServiceMeshIstio} | Cloudflare WAF=${project.enableWafCloudflare}`,
      1058,
      983
    );
  }, [project, finops, selectedProviderResult]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${project.projectName.toLowerCase().replace(/\s+/g, '-')}-cloud-finops-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const providerRows = finops.results.map((r) => ({
      Provider: r.provider.name,
      Region: r.provider.regionName,
      'On-Demand Monthly ($)': Math.round(r.onDemandMonthlyUsd),
      '1-Year Reserved ($)': Math.round(r.reserved1YrMonthlyUsd),
      '3-Year Reserved ($)': Math.round(r.reserved3YrMonthlyUsd),
      'Selected FinOps Strategy ($)': Math.round(r.optimizedBlendedMonthlyUsd),
      'Compute ($)': Math.round(r.computeCostUsd),
      'Managed DB ($)': Math.round(r.databaseCostUsd),
      'Storage & Redis ($)': Math.round(r.storageAndCacheCostUsd),
      'Network Egress & NAT ($)': Math.round(r.networkEgressAndNatUsd),
      'Annual FinOps Savings ($)': Math.round(r.annualSavingsWithFinOpsUsd),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(providerRows),
      'Multi-Cloud FinOps TCO'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(project.nodes),
      'Kubernetes & DB Nodes'
    );

    XLSX.writeFile(wb, `corpus-cloud-finops-${project.environment}.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Cloud className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Cloud, Kubernetes & FinOps Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full">
                #036 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              AWS / GCP / Azure / Hetzner TCO Benchmark • K8s HPA Planner • Terraform HCL & YAML Generator
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="hidden xl:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setProject(PRESET_CLOUD_PROJECTS.fintech_high_scale)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              project.projectName.includes('FinTech')
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            FinTech Multi-AZ EKS
          </button>
          <button
            onClick={() => setProject(PRESET_CLOUD_PROJECTS.saas_ai_platform)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              project.projectName.includes('AI SaaS')
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            AI Vector SaaS GKE
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Cluster:</span>
            <span className="font-mono font-bold text-cyan-400">
              {finops.totalVCpu} vCPU / {finops.totalRamGb}GB
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">FinOps:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${Math.round(selectedProviderResult.optimizedBlendedMonthlyUsd).toLocaleString()}/mo
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
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Bulut Mimarisi İndir
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
              { id: 'nodes', label: `K8s & DB Düğümleri (${project.nodes.length})`, icon: Server },
              { id: 'strategy', label: 'FinOps & Sağlayıcı', icon: Coins },
              { id: 'network', label: 'Ağ, Egress & Güvenlik', icon: ShieldCheck },
            ].map((t) => {
              const Icon = t.icon;
              const active = leftTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
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
            {leftTab === 'nodes' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-zinc-200">
                      Altyapı İş Yükü & Node-Pool Listesi
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      K8s HPA pod havuzlarını, RDS veritabanlarını ve Redis kümelerini yapılandırın
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        nodes: [
                          ...project.nodes,
                          {
                            id: `nd-${Date.now()}`,
                            name: `worker-pool-${project.nodes.length + 1}`,
                            tier: 'COMPUTE_K8S',
                            serviceRole: 'Microservice Worker Node Pool',
                            vCpuPerInstance: 8,
                            ramGbPerInstance: 16,
                            storageGb: 120,
                            minReplicas: 2,
                            maxReplicas: 8,
                            avgUtilizationPct: 55,
                            multiAzHa: true,
                            spotEligible: true,
                            monthlyEgressTb: 2.0,
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Düğüm Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {project.nodes.map((node, idx) => (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={node.tier}
                          onChange={(e) => {
                            const next = [...project.nodes];
                            next[idx] = {
                              ...node,
                              tier: e.target.value as WorkloadTier,
                            };
                            setProject({ ...project, nodes: next });
                          }}
                          className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300"
                        >
                          <option value="COMPUTE_K8S">COMPUTE_K8S</option>
                          <option value="MANAGED_DB">MANAGED_DB</option>
                          <option value="CACHE_REDIS">CACHE_REDIS</option>
                          <option value="OBJECT_STORAGE">OBJECT_STORAGE</option>
                        </select>
                        <input
                          type="text"
                          value={node.name}
                          onChange={(e) => {
                            const next = [...project.nodes];
                            next[idx] = { ...node, name: e.target.value };
                            setProject({ ...project, nodes: next });
                          }}
                          className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                        />
                        <button
                          onClick={() =>
                            setProject({
                              ...project,
                              nodes: project.nodes.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={node.serviceRole}
                        onChange={(e) => {
                          const next = [...project.nodes];
                          next[idx] = { ...node, serviceRole: e.target.value };
                          setProject({ ...project, nodes: next });
                        }}
                        className="w-full px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400"
                      />

                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-500">vCPU</label>
                          <input
                            type="number"
                            value={node.vCpuPerInstance}
                            onChange={(e) => {
                              const next = [...project.nodes];
                              next[idx] = {
                                ...node,
                                vCpuPerInstance: Number(e.target.value),
                              };
                              setProject({ ...project, nodes: next });
                            }}
                            className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500">RAM (GB)</label>
                          <input
                            type="number"
                            value={node.ramGbPerInstance}
                            onChange={(e) => {
                              const next = [...project.nodes];
                              next[idx] = {
                                ...node,
                                ramGbPerInstance: Number(e.target.value),
                              };
                              setProject({ ...project, nodes: next });
                            }}
                            className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500">Disk (GB)</label>
                          <input
                            type="number"
                            value={node.storageGb}
                            onChange={(e) => {
                              const next = [...project.nodes];
                              next[idx] = { ...node, storageGb: Number(e.target.value) };
                              setProject({ ...project, nodes: next });
                            }}
                            className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500">Min/Max</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={node.minReplicas}
                              onChange={(e) => {
                                const next = [...project.nodes];
                                next[idx] = {
                                  ...node,
                                  minReplicas: Number(e.target.value),
                                };
                                setProject({ ...project, nodes: next });
                              }}
                              className="w-1/2 px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                            />
                            <input
                              type="number"
                              value={node.maxReplicas}
                              onChange={(e) => {
                                const next = [...project.nodes];
                                next[idx] = {
                                  ...node,
                                  maxReplicas: Number(e.target.value),
                                };
                                setProject({ ...project, nodes: next });
                              }}
                              className="w-1/2 px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500">Egress TB</label>
                          <input
                            type="number"
                            step="0.5"
                            value={node.monthlyEgressTb}
                            onChange={(e) => {
                              const next = [...project.nodes];
                              next[idx] = {
                                ...node,
                                monthlyEgressTb: Number(e.target.value),
                              };
                              setProject({ ...project, nodes: next });
                            }}
                            className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={node.multiAzHa}
                            onChange={(e) => {
                              const next = [...project.nodes];
                              next[idx] = { ...node, multiAzHa: e.target.checked };
                              setProject({ ...project, nodes: next });
                            }}
                            className="accent-cyan-500"
                          />
                          Multi-AZ Yüksek Erişilebilirlik
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={node.spotEligible}
                            onChange={(e) => {
                              const next = [...project.nodes];
                              next[idx] = { ...node, spotEligible: e.target.checked };
                              setProject({ ...project, nodes: next });
                            }}
                            className="accent-emerald-500"
                          />
                          Spot / Preemptible Uygun
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {leftTab === 'strategy' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1.5">
                    Mimari Proje Başlığı
                  </label>
                  <input
                    type="text"
                    value={project.projectName}
                    onChange={(e) =>
                      setProject({ ...project, projectName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-cyan-400 mb-1.5">
                    Birincil Bulut Sağlayıcı (Target Cloud)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CLOUD_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          setProject({
                            ...project,
                            selectedProvider: p.id as CloudProviderId,
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          project.selectedProvider === p.id
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                            : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.name}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {p.regionName} • SLA {p.slaUptime}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-400 mb-1.5">
                    FinOps Taahhüt & İndirim Stratejisi
                  </label>
                  <select
                    value={project.commitmentStrategy}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        commitmentStrategy:
                          e.target.value as CloudArchitectureProject['commitmentStrategy'],
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="ON_DEMAND">On-Demand (Taahhütsüz Liste Fiyatı)</option>
                    <option value="RESERVED_1YR">1 Yıllık Savings Plan / Reserved (~%36 İndirim)</option>
                    <option value="RESERVED_3YR">3 Yıllık Reserved Instance (~%57 İndirim)</option>
                    <option value="HYBRID_SPOT_RI">
                      Hibrit FinOps: Stateful 1Yr RI + Stateless Spot Nodes (Önerilen)
                    </option>
                  </select>
                </div>
              </div>
            )}

            {leftTab === 'network' && (
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold uppercase text-cyan-400">
                  Ağ Topolojisi & Güvenlik Katmanları
                </h3>
                {[
                  {
                    key: 'enableMultiAzNat',
                    title: 'Her Erişilebilirlik Alanında (3x AZ) Bağımsız NAT Gateway',
                    desc: 'Tek bir AZ çöktüğünde dış ağ çıkışının kesilmesini önler',
                  },
                  {
                    key: 'enableServiceMeshIstio',
                    title: 'Istio / Cilium eBPF Zero-Trust mTLS Service Mesh',
                    desc: 'Podlar arası trafiği otomatik mTLS sertifikalarıyla şifreler',
                  },
                  {
                    key: 'enableWafCloudflare',
                    title: 'Cloudflare Enterprise WAF & DDoS L7 Koruma Katmanı',
                    desc: 'Ingress önünde OWASP kuralları ve bot filtreleme uygular',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        project[item.key as keyof CloudArchitectureProject]
                      )}
                      onChange={(e) =>
                        setProject({ ...project, [item.key]: e.target.checked })
                      }
                      className="mt-1 accent-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-zinc-400">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Bulut Topoloji & FinOps Kartı', icon: Eye },
                { id: 'matrix', label: 'Çoklu Bulut Maliyet Karşılaştırması', icon: Layers },
                { id: 'iac', label: 'Terraform (.tf) & Kubernetes YAML', icon: Code2 },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
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
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Toplam Compute
                    </div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {finops.totalVCpu} vCPU / {finops.totalRamGb} GB
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Depolama & Egress
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {(finops.totalStorageGb / 1000).toFixed(1)} TB • {finops.totalEgressTb} TB
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Seçili Bulut Aylık TCO</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      ${Math.round(selectedProviderResult.optimizedBlendedMonthlyUsd).toLocaleString()}/ay
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Yıllık FinOps Tasarrufu</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      +${Math.round(selectedProviderResult.annualSavingsWithFinOpsUsd).toLocaleString()}/yıl
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'matrix' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">Sağlayıcı</th>
                      <th className="py-3 px-3">On-Demand</th>
                      <th className="py-3 px-3">1-Yıl RI</th>
                      <th className="py-3 px-3">3-Yıl RI</th>
                      <th className="py-3 px-3">FinOps Optimize</th>
                      <th className="py-3 px-3">Egress & NAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {finops.results.map((r) => (
                      <tr key={r.provider.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {r.provider.name}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          ${Math.round(r.onDemandMonthlyUsd).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-zinc-200">
                          ${Math.round(r.reserved1YrMonthlyUsd).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-cyan-300">
                          ${Math.round(r.reserved3YrMonthlyUsd).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          ${Math.round(r.optimizedBlendedMonthlyUsd).toLocaleString()}/ay
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          ${Math.round(r.networkEgressAndNatUsd).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'iac' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'terraform', label: 'Terraform HCL (main.tf)' },
                      { id: 'k8s_yaml', label: 'Kubernetes Deployment + HPA (.yaml)' },
                      { id: 'docker_compose', label: 'Docker Compose (docker-compose.yml)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setIacFormat(f.id as typeof iacFormat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                          iacFormat === f.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 1800);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    IaC Kodunu Kopyala
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                  {generatedCode}
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
                Masaüstü Başlatıcı (.BAT) — Port 5208
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
title Corpus Cloud, K8s & FinOps Studio (#036 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-cloud"
start http://localhost:5208
npm run dev -- --port 5208`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
