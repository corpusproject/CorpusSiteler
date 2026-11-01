import { useState, useRef, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  TrendingUp,
  Sigma,
  DollarSign,
  Download,
  FileSpreadsheet,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  DEFAULT_ABTEST_INPUT,
  calculateABTestMetrics,
  type ABTestInput,
} from './utils/abtestEngine';

export default function App() {
  const [input, setInput] = useState<ABTestInput>(DEFAULT_ABTEST_INPUT);
  const [showBatModal, setShowBatModal] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const result = useMemo(() => calculateABTestMetrics(input), [input]);

  const updateField = <K extends keyof ABTestInput>(key: K, val: ABTestInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: val }));
  };

  // Draw 4K (1920x1080) Frequentist & Bayesian A/B Experimentation Decision Board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1920;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#070514');
    grad.addColorStop(0.5, '#110c29');
    grad.addColorStop(1, '#060a17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.fillRect(60, 50, W - 120, 115);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 50, W - 120, 115);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('CORPUS EXPERIMENT #049 PRO • FREQUENTIST Z-TEST, BAYESIAN POSTERIOR & ARR UPLIFT STUDIO', 90, 95);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText(input.experimentName, 90, 140);

    // KPI Cards
    const cards = [
      {
        title: 'BAĞIL DÖNÜŞÜM ARTIŞI (UPLIFT)',
        val: `${result.relativeUpliftPct >= 0 ? '+' : ''}${result.relativeUpliftPct.toFixed(2)}%`,
        sub: `Kontrol: %${result.controlCr.toFixed(2)} → Varyant B: %${result.variantCr.toFixed(2)}`,
        color: result.relativeUpliftPct >= 0 ? '#10b981' : '#ef4444',
      },
      {
        title: 'FREQUENTIST Z-SKOR & P-DEĞERİ',
        val: `p = ${result.pValueTwoTailed.toFixed(5)}`,
        sub: `Z = ${result.zScore.toFixed(3)} | Güven: %${input.confidenceLevel}`,
        color: result.isSignificant ? '#38bdf8' : '#f59e0b',
      },
      {
        title: 'BAYESIAN KAZANMA OLASILIĞI',
        val: `%${result.bayesianChanceToBeatControlPct.toFixed(2)}`,
        sub: `P(θ_B > θ_A) Beta-Binomial Posterior`,
        color: '#c084fc',
      },
      {
        title: 'YILLIK EK ARR GELİR ETKİSİ',
        val: `$${Math.round(result.annualArrUplift).toLocaleString()}`,
        sub: `+${result.monthlyIncrementalConversions.toLocaleString()} Ek Dönüşüm / Ay`,
        color: '#22c55e',
      },
    ];

    cards.forEach((c, idx) => {
      const bx = 60 + idx * 455;
      const by = 195;
      const bw = 435;
      const bh = 165;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(c.title, bx + 24, by + 40);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 38px JetBrains Mono, monospace';
      ctx.fillText(c.val, bx + 24, by + 98);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(c.sub, bx + 24, by + 138);
    });

    // Left Panel: Bell Curve Posterior Distribution Overlay
    const leftX = 60;
    const leftY = 390;
    const leftW = 920;
    const leftH = 620;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(leftX, leftY, leftW, leftH);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.strokeRect(leftX, leftY, leftW, leftH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('POSTERIOR OLASILIK YOĞUNLUK EĞRİLERİ (KONTROL A vs VARYANT B)', leftX + 30, leftY + 48);

    const plotX = leftX + 60;
    const plotY = leftY + 100;
    const plotW = 800;
    const plotH = 380;

    // Draw Control A Gaussian Bell Curve & Variant B shifted Bell Curve
    const drawGaussian = (centerRatio: number, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const normX = i / 200;
        const z = (normX - centerRatio) * 14;
        const density = Math.exp(-0.5 * z * z);
        const px = plotX + normX * plotW;
        const py = plotY + plotH - density * (plotH - 40);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const peakX = plotX + centerRatio * plotW;
      ctx.fillStyle = color;
      ctx.font = 'bold 18px JetBrains Mono, monospace';
      ctx.fillText(label, peakX - 65, plotY + 20);
    };

    drawGaussian(0.38, '#94a3b8', `Kontrol A (%${result.controlCr.toFixed(2)})`);
    const shift = Math.max(0.2, Math.min(0.75, 0.38 + (result.relativeUpliftPct / 100) * 0.9));
    drawGaussian(shift, '#10b981', `Varyant B (%${result.variantCr.toFixed(2)})`);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px JetBrains Mono, monospace';
    ctx.fillText(
      `%${input.confidenceLevel} Güven Aralığı (Mutlak Fark): [${result.ciLower.toFixed(3)}%, ${result.ciUpper.toFixed(3)}%]`,
      leftX + 50,
      leftY + 555
    );

    // Right Panel: Sample Size Power Analysis & Final Verdict
    const rightX = 1010;
    const rightY = 390;
    const rightW = 850;
    const rightH = 620;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(rightX, rightY, rightW, rightH);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.strokeRect(rightX, rightY, rightW, rightH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('MDE ÖRNEKLEM GÜÇ (POWER) PLANI & ROLLOUT KARARI', rightX + 35, rightY + 48);

    const infoRows = [
      ['Minimum Tespit Edilebilir Etki (MDE)', `%${input.targetMdePct.toFixed(1)}`],
      ['İstatistiksel Güç (1 - β)', `%${input.statisticalPower}`],
      ['Varyant Başına Gerekli Örneklem', `${result.requiredSamplePerVariant.toLocaleString()} Ziyaretçi`],
      ['Tahmini Test Süresi', `${result.estimatedDaysToComplete} Gün (${input.dailyTrafficTotal.toLocaleString()} ziyaretçi/gün)`],
      ['SRM (Sample Ratio Mismatch) χ²', `${result.srmChiSquare.toFixed(3)} (${result.srmWarning ? 'UYARI: TRAFİK DENGESİZ' : 'DENGELİ 50/50'})`],
    ];

    infoRows.forEach(([k, v], i) => {
      const ry = rightY + 115 + i * 68;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(rightX + 35, ry - 34, rightW - 70, 54);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(k, rightX + 55, ry);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 19px JetBrains Mono, monospace';
      ctx.fillText(v, rightX + 470, ry);
    });

    // Verdict Box
    const vColor =
      result.verdictBadge.startsWith('KAZANAN')
        ? '#10b981'
        : result.verdictBadge.startsWith('NEGATİF')
        ? '#ef4444'
        : '#f59e0b';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(rightX + 35, rightY + 465, rightW - 70, 120);
    ctx.strokeStyle = vColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(rightX + 35, rightY + 465, rightW - 70, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('KOMİTE DENEY SONUÇ KARARI:', rightX + 60, rightY + 505);

    ctx.fillStyle = vColor;
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(result.verdictBadge, rightX + 60, rightY + 552);
  }, [input, result]);

  const download4KBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Corpus-ABTest-4K-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['CORPUS EXPERIMENT #049 PRO - FREQUENTIST & BAYESIAN A/B TEST RAPORU'],
      ['Deney Adı', input.experimentName],
      ['Hipotez', input.hypothesis],
      ['Kontrol (A) Ziyaretçi / Dönüşüm', `${input.controlVisitors} / ${input.controlConversions}`],
      ['Varyant (B) Ziyaretçi / Dönüşüm', `${input.variantVisitors} / ${input.variantConversions}`],
      ['Kontrol CR (%)', Number(result.controlCr.toFixed(3))],
      ['Varyant CR (%)', Number(result.variantCr.toFixed(3))],
      ['Bağıl Uplift (%)', Number(result.relativeUpliftPct.toFixed(2))],
      ['Z-Skoru', Number(result.zScore.toFixed(4))],
      ['Two-Tailed p-Value', Number(result.pValueTwoTailed.toFixed(6))],
      ['Bayesian P(B > A) (%)', Number(result.bayesianChanceToBeatControlPct.toFixed(2))],
      ['Yıllık Ek ARR Gelir Etkisi ($)', Math.round(result.annualArrUplift)],
      ['Karar', result.verdictBadge],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'AB_Test_Sonuc');
    XLSX.writeFile(wb, `Corpus-ABTest-${Date.now()}.xlsx`);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-[#0d0822]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FlaskConical className="w-6 h-6 text-slate-950 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  #049 PRO
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Frequentist Z-Test • Bayesian Beta-Binomial • SRM Check
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                Corpus Experiment, Bayesian A/B Test &amp; ARR Uplift Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setInput(DEFAULT_ABTEST_INPUT)}
              className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sıfırla
            </button>
            <button
              onClick={exportExcel}
              className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.XLSX)
            </button>
            <button
              onClick={download4KBoard}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-400 hover:to-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              4K Deney Karar Panosu İndir
            </button>
            <button
              onClick={() => setShowBatModal(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-purple-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              .BAT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>BAĞIL DÖNÜŞÜM ARTIŞI (UPLIFT)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {result.relativeUpliftPct >= 0 ? '+' : ''}
              {result.relativeUpliftPct.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Kontrol: <strong className="text-white">%{result.controlCr.toFixed(2)}</strong> → Varyant B:{' '}
              <strong className="text-emerald-300">%{result.variantCr.toFixed(2)}</strong>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Z-SKORU &amp; P-DEĞERİ (İKİ YÖNLÜ)</span>
              <Sigma className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400">
              p = {result.pValueTwoTailed.toFixed(5)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Z = {result.zScore.toFixed(3)} •{' '}
              {result.isSignificant ? (
                <span className="text-emerald-400 font-semibold">%{input.confidenceLevel} Anlamlı</span>
              ) : (
                <span className="text-amber-400 font-semibold">Anlamlı Değil</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>BAYESIAN P(VARYANT B &gt; A)</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">
              %{result.bayesianChanceToBeatControlPct.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              GA: [{result.ciLower.toFixed(2)}%, {result.ciUpper.toFixed(2)}%]
            </div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>YILLIK EK ARR GELİR ETKİSİ</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${Math.round(result.annualArrUplift).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              +{result.monthlyIncrementalConversions.toLocaleString()} Ek Sipariş / Ay
            </div>
          </div>
        </section>

        {/* Main Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Cohort Data */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> 1. Kohort Trafik &amp; Dönüşüm Verileri
            </h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Deney Kodu &amp; Adı</label>
              <input
                type="text"
                value={input.experimentName}
                onChange={(e) => updateField('experimentName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Kontrol (A) Ziyaretçi</label>
                <input
                  type="number"
                  value={input.controlVisitors}
                  onChange={(e) => updateField('controlVisitors', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Kontrol (A) Dönüşüm</label>
                <input
                  type="number"
                  value={input.controlConversions}
                  onChange={(e) => updateField('controlConversions', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <div>
                <label className="text-xs text-purple-300 block mb-1">Varyant (B) Ziyaretçi</label>
                <input
                  type="number"
                  value={input.variantVisitors}
                  onChange={(e) => updateField('variantVisitors', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-purple-300 block mb-1">Varyant (B) Dönüşüm</label>
                <input
                  type="number"
                  value={input.variantConversions}
                  onChange={(e) => updateField('variantConversions', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Güven Düzeyi (1 - α)</label>
              <div className="grid grid-cols-3 gap-2">
                {([90, 95, 99] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => updateField('confidenceLevel', lvl)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                      input.confidenceLevel === lvl
                        ? 'bg-purple-500 text-slate-950 border-purple-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    %{lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Sample Size & Power Planner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Sigma className="w-4 h-4" /> 2. Örneklem Büyüklüğü (MDE &amp; Power)
            </h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Minimum Tespit Edilebilir Etki (MDE): <strong className="text-white">%{input.targetMdePct}</strong>
              </label>
              <input
                type="range"
                min={2}
                max={40}
                step={1}
                value={input.targetMdePct}
                onChange={(e) => updateField('targetMdePct', Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">İstatistiksel Güç (1 - β)</label>
              <div className="grid grid-cols-4 gap-2">
                {([80, 85, 90, 95] as const).map((pw) => (
                  <button
                    key={pw}
                    onClick={() => updateField('statisticalPower', pw)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                      input.statisticalPower === pw
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    %{pw}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Günlük Toplam Deney Trafiği</label>
              <input
                type="number"
                value={input.dailyTrafficTotal}
                onChange={(e) => updateField('dailyTrafficTotal', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Varyant Başına Örneklem:</span>
                <strong className="font-mono text-sky-400">
                  {result.requiredSamplePerVariant.toLocaleString()} kişi
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Önerilen Test Süresi:</span>
                <strong className="font-mono text-emerald-400">{result.estimatedDaysToComplete} Gün</strong>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">SRM Trafik Dağılım Testi:</span>
                {result.srmWarning ? (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> SRM Sapması!
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 50/50 Dengeli
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Financial ARR Uplift */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> 3. Yıllık ARR Gelir Simülasyonu
            </h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ortalama Sepet / Lisans Değeri (AOV $)</label>
              <input
                type="number"
                value={input.averageOrderValue}
                onChange={(e) => updateField('averageOrderValue', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Aylık Toplam Uygun Trafik (Ziyaretçi/Ay)</label>
              <input
                type="number"
                value={input.monthlyEligibleVisitors}
                onChange={(e) => updateField('monthlyEligibleVisitors', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="text-xs text-slate-400">Komite Rollout Kararı:</div>
              <div className="text-sm font-bold text-emerald-300">{result.verdictBadge}</div>
              <div className="text-xs text-slate-400 pt-1">
                Yıllık Beklenen Net Ciro Katkısı:{' '}
                <strong className="text-white font-mono">
                  ${Math.round(result.annualArrUplift).toLocaleString()} / Yıl
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live 4K Canvas Preview */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Canlı 4K (1920×1080) Frequentist &amp; Bayesian Deney Karar Panosu
            </h2>
            <span className="text-xs font-mono text-slate-400">1920 × 1080px • Ultra HD</span>
          </div>
          <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </section>
      </main>

      {/* .BAT Modal */}
      {showBatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                Tek Tıkla Başlatıcı (baslat.bat - Port 5221)
              </h3>
              <button
                onClick={() => setShowBatModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Kapat
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-purple-300 overflow-x-auto border border-slate-800">
{`@echo off
cd /d "%~dp0"
start http://localhost:5221
npm run dev -- --port 5221`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
