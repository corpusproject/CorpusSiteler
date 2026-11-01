import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Cpu,
  Terminal,
  Coins,
  ShieldAlert,
  Braces,
  Sparkles,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  Code2,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type PromptProject,
  type PromptVariable,
  type JsonSchemaField,
  LLM_MODELS,
  PRESET_PROMPT_PROJECTS,
  calculateTokenBreakdown,
  calculateModelBenchmarks,
  auditPromptSecurity,
  interpolatePrompt,
  extractTemplateVariables,
  buildJsonSchemaString,
  generateSdkCode,
} from './utils/promptEngine';

export default function App() {
  const [project, setProject] = useState<PromptProject>(PRESET_PROMPT_PROJECTS.fintech_kyc);
  const [leftTab, setLeftTab] = useState<'prompts' | 'variables' | 'schema' | 'finops'>('prompts');
  const [rightMode, setRightMode] = useState<'canvas' | 'benchmark' | 'security' | 'sdk'>('canvas');
  const [sdkLang, setSdkLang] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tokenBreakdown = useMemo(() => calculateTokenBreakdown(project), [project]);
  const benchmarks = useMemo(
    () => calculateModelBenchmarks(project, tokenBreakdown),
    [project, tokenBreakdown]
  );
  const securityAudit = useMemo(() => auditPromptSecurity(project), [project]);

  const primaryBench = useMemo(
    () =>
      benchmarks.find((b) => b.model.id === project.primaryModelId) || benchmarks[0],
    [benchmarks, project.primaryModelId]
  );

  const cheapestBench = useMemo(
    () => [...benchmarks].sort((a, b) => a.monthlyCost - b.monthlyCost)[0],
    [benchmarks]
  );

  // Sync newly typed {{variables}} automatically button
  const handleSyncDetectedVariables = () => {
    const detected = extractTemplateVariables(project.systemPrompt, project.userPromptTemplate);
    const existingMap = new Map(project.variables.map((v) => [v.key, v]));
    const merged: PromptVariable[] = detected.map((key) => {
      const found = existingMap.get(key);
      if (found) return found;
      return {
        key,
        defaultValue: `sample_${key}`,
        currentValue: `sample_${key}`,
        description: `Auto-detected template parameter {{${key}}}`,
        required: true,
      };
    });
    setProject((prev) => ({ ...prev, variables: merged }));
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFlag(label);
    setTimeout(() => setCopiedFlag(null), 1800);
  };

  // --------------------------------------------------------------------------
  // 4K (1920x1080) LLM Architecture & FinOps Benchmark Card Renderer
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

    // Deep studio background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#07090e');
    bgGrad.addColorStop(0.5, '#0b101b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle technical grid
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

    // Top Accent Bar
    ctx.fillStyle = project.accentColor;
    ctx.fillRect(0, 0, W, 8);

    // Header Banner
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(48, 36, W - 96, 118);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.strokeRect(48, 36, W - 96, 118);

    ctx.fillStyle = project.accentColor;
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText(
      `CORPUS PROMPT & FINOPS BENCHMARK ARCHITECTURE  •  ${project.useCaseCategory.toUpperCase()}  •  ${project.versionTag}`,
      76,
      72
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px Inter, system-ui, sans-serif';
    ctx.fillText(project.projectName, 76, 118);

    // Top Right Security & Monthly FinOps Badges
    const secColor =
      securityAudit.score >= 85
        ? '#10b981'
        : securityAudit.score >= 65
        ? '#f59e0b'
        : '#ef4444';

    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(W - 580, 54, 240, 82);
    ctx.strokeStyle = secColor;
    ctx.strokeRect(W - 580, 54, 240, 82);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('GUARDRAIL AUDIT SCORE', W - 560, 80);
    ctx.fillStyle = secColor;
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillText(`${securityAudit.score} / 100`, W - 560, 118);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.fillRect(W - 320, 54, 250, 82);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(W - 320, 54, 250, 82);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('PRIMARY EST. MONTHLY API', W - 300, 80);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(
      `$${primaryBench.monthlyCost.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}/mo`,
      W - 300,
      118
    );

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Token Pipeline & Context Breakdown (x: 48, y: 180, w: 620)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 620, 430);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 620, 430);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('1. BPE TOKEN PIPELINE & CONTEXT ALLOCATION', 74, 218);

    const tokenSegments = [
      {
        label: 'System Prompt Directives (Cacheable)',
        tokens: tokenBreakdown.systemTokens,
        color: '#10b981',
      },
      {
        label: `Few-Shot Examples (${project.fewShotExamples.filter((e) => e.enabled).length} active pairs)`,
        tokens: tokenBreakdown.fewShotTokens,
        color: '#3b82f6',
      },
      {
        label: 'Strict JSON Schema Grammar',
        tokens: tokenBreakdown.schemaTokens,
        color: '#a855f7',
      },
      {
        label: `Dynamic User Template (${project.variables.length} bound vars)`,
        tokens: tokenBreakdown.userPromptTokens,
        color: '#f59e0b',
      },
      {
        label: 'Expected Completion Output Tokens',
        tokens: tokenBreakdown.estimatedOutputTokens,
        color: '#ec4899',
      },
    ];

    let segY = 255;
    for (const seg of tokenSegments) {
      const pct =
        tokenBreakdown.totalCombinedTokens > 0
          ? Math.round((seg.tokens / tokenBreakdown.totalCombinedTokens) * 100)
          : 0;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText(seg.label, 74, segY);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`${seg.tokens} tok (${pct}%)`, 510, segY);

      // Bar track
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(74, segY + 10, 566, 12);

      // Bar fill
      ctx.fillStyle = seg.color;
      ctx.fillRect(74, segY + 10, Math.max(6, (566 * pct) / 100), 12);

      segY += 54;
    }

    // Total Token Footer inside box 1
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(74, 532, 566, 56);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Total Input: ${tokenBreakdown.totalInputTokens} tok   |   Est. Output: ${tokenBreakdown.estimatedOutputTokens} tok   |   Prefix Cache Hit: ${project.cacheHitRatioPct}%`,
      90,
      565
    );

    // ------------------------------------------------------------------------
    // BOTTOM LEFT: Prompt Red-Team & Guardrail Matrix (x: 48, y: 634, w: 620)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 634, 620, 396);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 634, 620, 396);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('2. RED-TEAM SECURITY & DETERMINISM AUDIT', 74, 672);

    let findY = 708;
    for (const f of securityAudit.findings.slice(0, 5)) {
      const badgeCol =
        f.severity === 'PASS'
          ? '#10b981'
          : f.severity === 'MEDIUM'
          ? '#f59e0b'
          : '#ef4444';

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, findY - 20, 566, 52);

      ctx.fillStyle = badgeCol;
      ctx.fillRect(74, findY - 20, 6, 52);

      ctx.font = 'bold 13px monospace';
      ctx.fillText(`[${f.severity}]`, 92, findY);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(f.title.slice(0, 52), 175, findY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(f.detail.slice(0, 78), 92, findY + 20);

      findY += 62;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: Multi-Model Cost & Latency Matrix (x: 696, y: 180, w: 1176)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(696, 180, 1176, 850);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(696, 180, 1176, 850);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(
      `3. MULTI-LLM FINOPS & LATENCY BENCHMARK MATRIX (${project.requestsPerDay.toLocaleString()} REQ/DAY • ${project.cacheHitRatioPct}% CACHE HIT)`,
      726,
      218
    );

    // Table Header
    const colX = {
      model: 726,
      provider: 1030,
      unitPrice: 1155,
      latency: 1330,
      mmlu: 1475,
      daily: 1595,
      monthly: 1720,
    };

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(720, 240, 1126, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('LLM MODEL', colX.model, 265);
    ctx.fillText('PROVIDER', colX.provider, 265);
    ctx.fillText('IN / OUT ($/1M)', colX.unitPrice, 265);
    ctx.fillText('E2E LATENCY', colX.latency, 265);
    ctx.fillText('MMLU / CODE', colX.mmlu, 265);
    ctx.fillText('DAILY COST', colX.daily, 265);
    ctx.fillText('MONTHLY API', colX.monthly, 265);

    let rowY = 308;
    const maxMonthly = Math.max(...benchmarks.map((b) => b.monthlyCost), 1);

    for (const b of benchmarks) {
      const isPrimary = b.model.id === project.primaryModelId;
      const isFallback = b.model.id === project.fallbackModelId;

      ctx.fillStyle = isPrimary
        ? 'rgba(16, 185, 129, 0.13)'
        : isFallback
        ? 'rgba(59, 130, 246, 0.10)'
        : 'rgba(255,255,255,0.02)';
      ctx.fillRect(720, rowY - 24, 1126, 68);

      if (isPrimary || isFallback) {
        ctx.strokeStyle = isPrimary ? '#10b981' : '#3b82f6';
        ctx.strokeRect(720, rowY - 24, 1126, 68);
      }

      // Color dot
      ctx.fillStyle = b.model.badgeColor;
      ctx.beginPath();
      ctx.arc(colX.model + 8, rowY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(b.model.name, colX.model + 24, rowY + 5);

      if (isPrimary) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('[PRIMARY TARGET]', colX.model + 24, rowY + 24);
      } else if (isFallback) {
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('[FALLBACK ROUTER]', colX.model + 24, rowY + 24);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(
          `Context: ${(b.model.contextWindow / 1000).toFixed(0)}K tok`,
          colX.model + 24,
          rowY + 24
        );
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(b.model.provider, colX.provider, rowY + 5);

      ctx.font = '13px monospace';
      ctx.fillText(
        `$${b.model.inputCostPer1M.toFixed(2)} / $${b.model.outputCostPer1M.toFixed(2)}`,
        colX.unitPrice,
        rowY + 5
      );
      ctx.fillStyle = '#10b981';
      ctx.font = '11px monospace';
      ctx.fillText(
        `Cache: $${b.model.cachedInputCostPer1M.toFixed(3)}`,
        colX.unitPrice,
        rowY + 23
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px monospace';
      ctx.fillText(`${(b.estimatedLatencyMs / 1000).toFixed(2)}s`, colX.latency, rowY + 5);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`${b.model.avgTps} tok/s`, colX.latency, rowY + 23);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `${b.model.mmluProScore}% / ${b.model.codingHumanEval}%`,
        colX.mmlu,
        rowY + 5
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px monospace';
      ctx.fillText(`$${b.dailyCost.toFixed(2)}`, colX.daily, rowY + 5);

      ctx.fillStyle = isPrimary ? '#34d399' : '#f8fafc';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(
        `$${b.monthlyCost.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`,
        colX.monthly,
        rowY + 5
      );

      // Mini cost bar
      const barWidth = Math.max(6, (b.monthlyCost / maxMonthly) * 110);
      ctx.fillStyle = b.model.badgeColor;
      ctx.fillRect(colX.monthly, rowY + 14, barWidth, 6);

      rowY += 78;
    }

    // Bottom Summary Callout inside Right Box
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(720, 922, 1126, 86);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.strokeRect(720, 922, 1126, 86);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(
      `FINOPS INSIGHT: Prompt Prefix Caching (${project.cacheHitRatioPct}%) saves $${primaryBench.monthlyCacheSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month on ${primaryBench.model.name}.`,
      744,
      954
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Parameters: temp=${project.temperature} | top_p=${project.topP} | max_tokens=${project.maxTokens} | strict_json=${project.enforceStrictSchema} | Lowest Cost Alternative: ${cheapestBench.model.name} ($${cheapestBench.monthlyCost.toFixed(0)}/mo)`,
      744,
      984
    );
  }, [project, tokenBreakdown, benchmarks, securityAudit, primaryBench, cheapestBench]);

  // --------------------------------------------------------------------------
  // Export Handlers (4K PNG, Multi-Sheet Excel .xlsx, JSON Spec)
  // --------------------------------------------------------------------------
  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${project.projectName.toLowerCase().replace(/\s+/g, '-')}-llm-benchmark-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const benchmarkRows = benchmarks.map((b) => ({
      Model: b.model.name,
      Provider: b.model.provider,
      Role:
        b.model.id === project.primaryModelId
          ? 'PRIMARY'
          : b.model.id === project.fallbackModelId
          ? 'FALLBACK'
          : 'BENCHMARK',
      'Context Window': b.model.contextWindow,
      'Input $/1M': b.model.inputCostPer1M,
      'Cached Input $/1M': b.model.cachedInputCostPer1M,
      'Output $/1M': b.model.outputCostPer1M,
      'Single Call Cost ($)': Number(b.singleCallTotalCost.toFixed(6)),
      'Daily Cost ($)': Number(b.dailyCost.toFixed(2)),
      'Monthly Cost ($)': Number(b.monthlyCost.toFixed(2)),
      'Annual Cost ($)': Number(b.annualCost.toFixed(2)),
      'Monthly Cache Savings ($)': Number(b.monthlyCacheSavings.toFixed(2)),
      'Est. Latency (ms)': b.estimatedLatencyMs,
      'Throughput (tok/s)': b.model.avgTps,
      'MMLU-Pro (%)': b.model.mmluProScore,
    }));

    const wsBench = XLSX.utils.json_to_sheet(benchmarkRows);
    XLSX.utils.book_append_sheet(wb, wsBench, 'LLM FinOps Benchmark');

    const varRows = project.variables.map((v) => ({
      Variable: `{{${v.key}}}`,
      CurrentValue: v.currentValue,
      DefaultValue: v.defaultValue,
      Description: v.description,
      Required: v.required ? 'YES' : 'NO',
    }));
    const wsVars = XLSX.utils.json_to_sheet(varRows);
    XLSX.utils.book_append_sheet(wb, wsVars, 'Prompt Variables');

    const secRows = securityAudit.findings.map((f) => ({
      ID: f.id,
      Severity: f.severity,
      Category: f.category,
      Finding: f.title,
      Details: f.detail,
      Remediation: f.remediation,
    }));
    const wsSec = XLSX.utils.json_to_sheet(secRows);
    XLSX.utils.book_append_sheet(wb, wsSec, 'RedTeam Security Audit');

    XLSX.writeFile(wb, `corpus-prompt-benchmark-${project.versionTag}.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Prompt & FinOps Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                #034 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              System Prompt Engineering • BPE Token Profiler • Multi-LLM Cost & Red-Team Security Studio
            </p>
          </div>
        </div>

        {/* Center Preset Switcher */}
        <div className="hidden xl:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setProject(PRESET_PROMPT_PROJECTS.fintech_kyc)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              project.projectName.includes('FinTech')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            FinTech KYC/AML Agent
          </button>
          <button
            onClick={() => setProject(PRESET_PROMPT_PROJECTS.sql_copilot)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              project.projectName.includes('SQL')
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Text-to-SQL Copilot
          </button>
        </div>

        {/* Right Actions & Live KPI Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Tokens:</span>
            <span className="font-mono font-bold text-emerald-400">
              {tokenBreakdown.totalCombinedTokens.toLocaleString()}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Primary:</span>
            <span className="font-mono font-bold text-cyan-400">
              ${primaryBench.monthlyCost.toFixed(0)}/mo
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
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Mimari Kartı İndir
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

      {/* MAIN DUAL-PANE STUDIO */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE: 5 Columns */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 bg-[#0c0c0f] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          {/* Left Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-zinc-900/70 border-b border-zinc-800">
            {[
              { id: 'prompts', label: 'Sistem & İstem', icon: Sparkles },
              { id: 'variables', label: `Değişkenler (${project.variables.length})`, icon: Braces },
              { id: 'schema', label: 'JSON Şema & FewShot', icon: Layers },
              { id: 'finops', label: 'FinOps & Trafik', icon: Coins },
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

          {/* Left Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {leftTab === 'prompts' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Proje / Ajan Adı
                    </label>
                    <input
                      type="text"
                      value={project.projectName}
                      onChange={(e) =>
                        setProject({ ...project, projectName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Versiyon & Kategori
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={project.versionTag}
                        onChange={(e) =>
                          setProject({ ...project, versionTag: e.target.value })
                        }
                        className="w-28 px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 outline-none"
                      />
                      <input
                        type="text"
                        value={project.useCaseCategory}
                        onChange={(e) =>
                          setProject({ ...project, useCaseCategory: e.target.value })
                        }
                        className="flex-1 px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* System Prompt Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      SYSTEM PROMPT (Önbelleklenebilir Sabit Yönerge)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {tokenBreakdown.systemTokens} BPE token
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={project.systemPrompt}
                    onChange={(e) =>
                      setProject({ ...project, systemPrompt: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500/60 text-xs font-mono text-zinc-200 leading-relaxed outline-none resize-y"
                  />
                </div>

                {/* User Prompt Template Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Braces className="w-3.5 h-3.5" />
                      USER PROMPT ŞABLONU ({'{{variable}}'} Destekli)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncDetectedVariables}
                        className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {'{{Değişkenleri}}'} Senkronize Et
                      </button>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {tokenBreakdown.userPromptTokens} tok
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={7}
                    value={project.userPromptTemplate}
                    onChange={(e) =>
                      setProject({ ...project, userPromptTemplate: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500/60 text-xs font-mono text-zinc-200 leading-relaxed outline-none resize-y"
                  />
                </div>

                {/* Expected Output Sample */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-pink-400">
                      ÖRNEK HEDEF ÇIKTI (Output Token Tahmini İçin)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      ~{tokenBreakdown.estimatedOutputTokens} output tok
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={project.expectedOutputSample}
                    onChange={(e) =>
                      setProject({ ...project, expectedOutputSample: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 leading-relaxed outline-none resize-y"
                  />
                </div>
              </>
            )}

            {leftTab === 'variables' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      Mustache {'{{Variable}}'} Kayıt Defteri
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Şablondaki dinamik alanları gerçek zamanlı test verileriyle doldurun
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        variables: [
                          ...project.variables,
                          {
                            key: `custom_var_${project.variables.length + 1}`,
                            defaultValue: 'ornek_deger',
                            currentValue: 'ornek_deger',
                            description: 'Yeni dinamik şablon parametresi',
                            required: true,
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Değişken Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {project.variables.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                            {`{{${v.key}}}`}
                          </span>
                          <input
                            type="text"
                            value={v.key}
                            onChange={(e) => {
                              const next = [...project.variables];
                              next[idx] = { ...v, key: e.target.value };
                              setProject({ ...project, variables: next });
                            }}
                            className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 w-40"
                          />
                        </div>
                        <button
                          onClick={() =>
                            setProject({
                              ...project,
                              variables: project.variables.filter((_, i) => i !== idx),
                            })
                          }
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={v.description}
                        onChange={(e) => {
                          const next = [...project.variables];
                          next[idx] = { ...v, description: e.target.value };
                          setProject({ ...project, variables: next });
                        }}
                        placeholder="Açıklama"
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400"
                      />

                      <div>
                        <label className="block text-[10px] uppercase text-zinc-500 mb-1">
                          Canlı Enjekte Edilen Değer (Current Test Value)
                        </label>
                        <textarea
                          rows={2}
                          value={v.currentValue}
                          onChange={(e) => {
                            const next = [...project.variables];
                            next[idx] = { ...v, currentValue: e.target.value };
                            setProject({ ...project, variables: next });
                          }}
                          className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'schema' && (
              <div className="space-y-5">
                {/* Strict JSON Schema Builder */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        Structured Outputs (JSON Schema)
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        OpenAI / Anthropic / Gemini deterministik JSON çıktı şeması
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={project.enforceStrictSchema}
                        onChange={(e) =>
                          setProject({ ...project, enforceStrictSchema: e.target.checked })
                        }
                        className="accent-purple-500"
                      />
                      Strict Mode Aktif
                    </label>
                  </div>

                  <div className="space-y-2">
                    {project.schemaFields.map((sf, idx) => (
                      <div
                        key={sf.id}
                        className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sf.name}
                            onChange={(e) => {
                              const next = [...project.schemaFields];
                              next[idx] = { ...sf, name: e.target.value };
                              setProject({ ...project, schemaFields: next });
                            }}
                            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-purple-300 w-36"
                          />
                          <select
                            value={sf.type}
                            onChange={(e) => {
                              const next = [...project.schemaFields];
                              next[idx] = {
                                ...sf,
                                type: e.target.value as JsonSchemaField['type'],
                              };
                              setProject({ ...project, schemaFields: next });
                            }}
                            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="array<string>">array&lt;string&gt;</option>
                            <option value="enum">enum</option>
                          </select>
                          <button
                            onClick={() =>
                              setProject({
                                ...project,
                                schemaFields: project.schemaFields.filter((_, i) => i !== idx),
                              })
                            }
                            className="ml-auto text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {sf.type === 'enum' && (
                          <input
                            type="text"
                            value={sf.enumValues || ''}
                            onChange={(e) => {
                              const next = [...project.schemaFields];
                              next[idx] = { ...sf, enumValues: e.target.value };
                              setProject({ ...project, schemaFields: next });
                            }}
                            placeholder="Virgülle ayrılmış enum değerleri: APPROVE,REVIEW,REJECT"
                            className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-amber-300"
                          />
                        )}
                        <input
                          type="text"
                          value={sf.description}
                          onChange={(e) => {
                            const next = [...project.schemaFields];
                            next[idx] = { ...sf, description: e.target.value };
                            setProject({ ...project, schemaFields: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        schemaFields: [
                          ...project.schemaFields,
                          {
                            id: `sf-${Date.now()}`,
                            name: 'confidence_level',
                            type: 'number',
                            description: 'Model epistemic confidence score (0.0 - 1.0)',
                            required: true,
                          },
                        ],
                      })
                    }
                    className="w-full py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    JSON Alanı Ekle
                  </button>
                </div>

                {/* Few-Shot Examples */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                      Few-Shot In-Context Örnekleri ({tokenBreakdown.fewShotTokens} tok)
                    </h3>
                    <button
                      onClick={() =>
                        setProject({
                          ...project,
                          fewShotExamples: [
                            ...project.fewShotExamples,
                            {
                              id: `fs-${Date.now()}`,
                              label: 'Yeni Few-Shot Kalibrasyon Örneği',
                              userInput: 'Örnek girdi verisi...',
                              assistantOutput: '{"status": "VERIFIED"}',
                              enabled: true,
                            },
                          ],
                        })
                      }
                      className="px-2 py-1 rounded bg-blue-500/15 text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Örnek Ekle
                    </button>
                  </div>

                  {project.fewShotExamples.map((fs, i) => (
                    <div
                      key={fs.id}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                          <input
                            type="checkbox"
                            checked={fs.enabled}
                            onChange={(e) => {
                              const next = [...project.fewShotExamples];
                              next[i] = { ...fs, enabled: e.target.checked };
                              setProject({ ...project, fewShotExamples: next });
                            }}
                            className="accent-blue-500"
                          />
                          {fs.label}
                        </label>
                        <button
                          onClick={() =>
                            setProject({
                              ...project,
                              fewShotExamples: project.fewShotExamples.filter(
                                (_, idx) => idx !== i
                              ),
                            })
                          }
                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={fs.userInput}
                        onChange={(e) => {
                          const next = [...project.fewShotExamples];
                          next[i] = { ...fs, userInput: e.target.value };
                          setProject({ ...project, fewShotExamples: next });
                        }}
                        className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                      />
                      <textarea
                        rows={2}
                        value={fs.assistantOutput}
                        onChange={(e) => {
                          const next = [...project.fewShotExamples];
                          next[i] = { ...fs, assistantOutput: e.target.value };
                          setProject({ ...project, fewShotExamples: next });
                        }}
                        className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leftTab === 'finops' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Üretim Trafiği & Önbellek (Prompt Caching) Parametreleri
                  </h3>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">Günlük API İstek Hacmi (Requests/Day)</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {project.requestsPerDay.toLocaleString()} istek/gün
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={250000}
                      step={500}
                      value={project.requestsPerDay}
                      onChange={(e) =>
                        setProject({ ...project, requestsPerDay: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">
                        Prefix Prompt Cache Hit Oranı (%)
                      </span>
                      <span className="font-mono font-bold text-cyan-400">
                        %{project.cacheHitRatioPct}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={95}
                      step={5}
                      value={project.cacheHitRatioPct}
                      onChange={(e) =>
                        setProject({ ...project, cacheHitRatioPct: Number(e.target.value) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Birincil Üretim Modeli (Primary)
                      </label>
                      <select
                        value={project.primaryModelId}
                        onChange={(e) =>
                          setProject({ ...project, primaryModelId: e.target.value })
                        }
                        className="w-full px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                      >
                        {LLM_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Yedek / Fallback Modeli
                      </label>
                      <select
                        value={project.fallbackModelId}
                        onChange={(e) =>
                          setProject({ ...project, fallbackModelId: e.target.value })
                        }
                        className="w-full px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                      >
                        {LLM_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Temperature ({project.temperature})
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1.5"
                        value={project.temperature}
                        onChange={(e) =>
                          setProject({ ...project, temperature: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Top-P ({project.topP})
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1.0"
                        value={project.topP}
                        onChange={(e) =>
                          setProject({ ...project, topP: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Max Output Tokens
                      </label>
                      <input
                        type="number"
                        step="256"
                        value={project.maxTokens}
                        onChange={(e) =>
                          setProject({ ...project, maxTokens: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: 7 Columns */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          {/* Right Mode Bar */}
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Mimari & Maliyet Kartı', icon: Eye },
                { id: 'benchmark', label: 'Canlı İnterpole İstem & Maliyetler', icon: Zap },
                {
                  id: 'security',
                  label: `Red-Team Güvenlik (${securityAudit.score}/100)`,
                  icon: ShieldAlert,
                },
                { id: 'sdk', label: 'TS / Python / JSON SDK Kodu', icon: Code2 },
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

          {/* Right Viewport Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {rightMode === 'canvas' && (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto block"
                  />
                </div>

                {/* Quick Metric Cards under Canvas */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Toplam Giriş + Çıkış Token</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {tokenBreakdown.totalCombinedTokens.toLocaleString()} tok
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      {tokenBreakdown.wordCount} kelime • {tokenBreakdown.charCount} karakter
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Primary Aylık Maliyet</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      ${primaryBench.monthlyCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}/ay
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {primaryBench.model.name}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Prefix Cache Tasarrufu</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      +${primaryBench.monthlyCacheSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}/ay
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      %{project.cacheHitRatioPct} önbellek isabeti
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Tahmini Uçtan Uca Süre</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {(primaryBench.estimatedLatencyMs / 1000).toFixed(2)} sn
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      TTFT {primaryBench.model.avgTtftMs}ms • {primaryBench.model.avgTps} tok/sn
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'benchmark' && (
              <div className="space-y-6">
                {/* Live Compiled Prompt Preview */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Derlenmiş (Interpolated) Canlı İstem Çıktısı
                    </h3>
                    <button
                      onClick={() =>
                        handleCopyText(
                          `[SYSTEM]\n${interpolatePrompt(
                            project.systemPrompt,
                            project.variables
                          )}\n\n[USER]\n${interpolatePrompt(
                            project.userPromptTemplate,
                            project.variables
                          )}`,
                          'compiled'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedFlag === 'compiled' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Derlenmiş İstemi Kopyala
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {interpolatePrompt(project.userPromptTemplate, project.variables)}
                  </pre>
                </div>

                {/* Interactive FinOps Comparison Table */}
                <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400">
                        <th className="py-3 px-4">Model</th>
                        <th className="py-3 px-3">Input / Output ($/1M)</th>
                        <th className="py-3 px-3">Tek Çağrı</th>
                        <th className="py-3 px-3">Aylık Maliyet</th>
                        <th className="py-3 px-3">Cache Kazancı</th>
                        <th className="py-3 px-3">Gecikme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {benchmarks.map((b) => {
                        const isPri = b.model.id === project.primaryModelId;
                        return (
                          <tr
                            key={b.model.id}
                            onClick={() =>
                              setProject({ ...project, primaryModelId: b.model.id })
                            }
                            className={`cursor-pointer transition ${
                              isPri
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                                : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: b.model.badgeColor }}
                              />
                              {b.model.name}
                              {isPri && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded">
                                  SEÇİLİ
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-300">
                              ${b.model.inputCostPer1M.toFixed(2)} / $
                              {b.model.outputCostPer1M.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-300">
                              ${b.singleCallTotalCost.toFixed(5)}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                              ${b.monthlyCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}/ay
                            </td>
                            <td className="py-3 px-3 font-mono text-cyan-400">
                              +${b.monthlyCacheSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="py-3 px-3 font-mono text-amber-300">
                              {(b.estimatedLatencyMs / 1000).toFixed(2)}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rightMode === 'security' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      OWASP LLM01 Prompt Injection & Halüsinasyon Denetimi
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Sistem isteminiz ve dinamik şablon sınırlarınız otomatik Red-Team kurallarıyla tarandı
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-emerald-400">
                      {securityAudit.score} / 100
                    </div>
                    <div className="text-[11px] text-zinc-400">Güvenlik & Determinizm Skoru</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {securityAudit.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3.5"
                    >
                      {f.severity === 'PASS' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{f.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              f.severity === 'PASS'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {f.category} • {f.severity}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{f.detail}</p>
                        <p className="text-[11px] text-emerald-400/90 font-mono">
                          Çözüm: {f.remediation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightMode === 'sdk' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(['typescript', 'python', 'curl'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSdkLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer ${
                          sdkLang === lang
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      handleCopyText(generateSdkCode(project, sdkLang), 'sdk')
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFlag === 'sdk' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    SDK Kodunu Kopyala
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {generateSdkCode(project, sdkLang)}
                </pre>

                {project.enforceStrictSchema && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-purple-300 uppercase">
                      Derlenmiş Strict JSON Schema Nesnesi
                    </div>
                    <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-purple-300 overflow-x-auto">
                      {buildJsonSchemaString(project.schemaFields, true)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* .BAT LAUNCHER MODAL */}
      {showBatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Masaüstü Başlatıcı (.BAT) — Port 5206
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
title Corpus Prompt & FinOps Studio (#034 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-prompt"
start http://localhost:5206
npm run dev -- --port 5206`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
