import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Truck,
  ThermometerSnowflake,
  Zap,
  Fuel,
  Download,
  FileSpreadsheet,
  Terminal,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Navigation,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  DEFAULT_FLEET_INPUT,
  DEFAULT_COLD_CHAIN_PROBES,
  calculateFleetMetrics,
  type FleetTCOInput,
  type ColdChainProbeReading,
} from './utils/fleetEngine';

export default function App() {
  const [tcoInput, setTcoInput] = useState<FleetTCOInput>(DEFAULT_FLEET_INPUT);
  const [probes, setProbes] = useState<ColdChainProbeReading[]>(DEFAULT_COLD_CHAIN_PROBES);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(940);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<number>(78);
  const [activeTab, setActiveTab] = useState<'tco' | 'coldchain' | 'tachograph'>('tco');
  const [showBatModal, setShowBatModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const metrics = useMemo(
    () => calculateFleetMetrics(tcoInput, probes, routeDistanceKm, avgSpeedKmh),
    [tcoInput, probes, routeDistanceKm, avgSpeedKmh]
  );

  const updateTcoField = <K extends keyof FleetTCOInput>(key: K, val: FleetTCOInput[K]) => {
    setTcoInput((prev) => ({ ...prev, [key]: val }));
  };

  const addProbe = () => {
    const nextIdx = probes.length + 1;
    setProbes((prev) => [
      ...prev,
      {
        id: `P-0${nextIdx}`,
        timeStamp: '23:30',
        locationZone: `Kontrol Noktası #${nextIdx}`,
        tempCelsius: 5.2,
      },
    ]);
  };

  const removeProbe = (id: string) => {
    if (probes.length <= 2) return;
    setProbes((prev) => prev.filter((p) => p.id !== id));
  };

  const updateProbe = (id: string, field: keyof ColdChainProbeReading, value: string | number) => {
    setProbes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Draw 4K (1920x1080) Fleet TCO & Cold-Chain MKT Certificate Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1920;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#040914');
    bgGrad.addColorStop(0.5, '#091526');
    bgGrad.addColorStop(1, '#040d1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
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

    // Header Banner
    ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
    ctx.fillRect(60, 50, W - 120, 110);
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 50, W - 120, 110);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('CORPUS FLEET #048 PRO • EV VS DIESEL 5-YR TCO & USP <1079> COLD-CHAIN STUDIO', 90, 95);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.fillText(tcoInput.fleetName, 90, 138);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px JetBrains Mono, monospace';
    ctx.fillText(
      `Filo: ${tcoInput.vehicleCount} Araç | Yıllık: ${tcoInput.annualKmPerVehicle.toLocaleString()} km | Süre: ${tcoInput.holdingYears} Yıl`,
      W - 760,
      135
    );

    // KPI Cards Row
    const kpis = [
      {
        label: '5 YILLIK EV FİLO TCO',
        value: `$${Math.round(metrics.evFleetTotalCost).toLocaleString()}`,
        sub: `$${metrics.evCostPerKm.toFixed(3)} / km`,
        color: '#10b981',
      },
      {
        label: '5 YILLIK DİZEL FİLO TCO',
        value: `$${Math.round(metrics.dieselFleetTotalCost).toLocaleString()}`,
        sub: `$${metrics.dieselCostPerKm.toFixed(3)} / km`,
        color: '#f59e0b',
      },
      {
        label: 'NET ELEKTRİFİKASYON TASARRUFU',
        value: `$${Math.round(metrics.totalFleetSavings).toLocaleString()}`,
        sub: `Başabaş: ${metrics.breakEvenMonths} Ay | -${Math.round(metrics.co2SavedTonnesTotal)} tCO2`,
        color: '#38bdf8',
      },
      {
        label: 'USP <1079> ARRHENIUS MKT',
        value: `${metrics.mktCelsius.toFixed(2)} °C`,
        sub: metrics.coldChainStatus,
        color: metrics.mktCelsius <= 8.0 && metrics.mktCelsius >= 2.0 ? '#22c55e' : '#ef4444',
      },
    ];

    kpis.forEach((k, idx) => {
      const bx = 60 + idx * 455;
      const by = 190;
      const bw = 435;
      const bh = 165;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = k.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(k.label, bx + 24, by + 40);

      ctx.fillStyle = k.color;
      ctx.font = 'bold 38px JetBrains Mono, monospace';
      ctx.fillText(k.value, bx + 24, by + 98);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(k.sub, bx + 24, by + 138);
    });

    // Left Panel: 5-Year Cumulative TCO Bar Comparison
    const leftX = 60;
    const leftY = 390;
    const leftW = 870;
    const leftH = 620;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(leftX, leftY, leftW, leftH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeRect(leftX, leftY, leftW, leftH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('KÜMÜLATİF FİLO TCO PROJEKSİYONU (EV vs EURO-6 DİZEL)', leftX + 30, leftY + 48);

    const maxCost = Math.max(
      ...metrics.yearlyCumulativeComparison.map((c) => Math.max(c.evCumulative, c.dieselCumulative)),
      1
    );

    metrics.yearlyCumulativeComparison.forEach((item, i) => {
      const barGroupX = leftX + 70 + i * 150;
      const baseY = leftY + 520;
      const maxBarH = 380;

      const evH = (item.evCumulative / maxCost) * maxBarH;
      const dieselH = (item.dieselCumulative / maxCost) * maxBarH;

      // EV Bar
      ctx.fillStyle = '#10b981';
      ctx.fillRect(barGroupX, baseY - evH, 46, evH);

      // Diesel Bar
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barGroupX + 54, baseY - dieselH, 46, dieselH);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 16px JetBrains Mono, monospace';
      ctx.fillText(`${item.year}. Yıl`, barGroupX + 22, baseY + 32);

      ctx.fillStyle = '#10b981';
      ctx.font = '13px JetBrains Mono, monospace';
      ctx.fillText(`$${Math.round(item.evCumulative / 1000)}k`, barGroupX - 4, baseY - evH - 10);

      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`$${Math.round(item.dieselCumulative / 1000)}k`, barGroupX + 50, baseY - dieselH - 10);
    });

    // Right Panel: Cold-Chain Thermal Profile & Tachograph Summary
    const rightX = 960;
    const rightY = 390;
    const rightW = 900;
    const rightH = 620;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(rightX, rightY, rightW, rightH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeRect(rightX, rightY, rightW, rightH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('SOĞUK ZİNCİR SENSÖR EĞRİSİ (2°C - 8°C) & TAKOGRAF ÖZETİ', rightX + 30, rightY + 48);

    // Draw safe zone band (2°C to 8°C)
    const chartX = rightX + 60;
    const chartY = rightY + 90;
    const chartW = 790;
    const chartH = 290;

    const tempToY = (t: number) => chartY + chartH - ((t - 0) / 12) * chartH;

    // 2C - 8C safe band
    const y8 = tempToY(8);
    const y2 = tempToY(2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.fillRect(chartX, y8, chartW, y2 - y8);
    ctx.strokeStyle = '#22c55e';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(chartX, y8);
    ctx.lineTo(chartX + chartW, y8);
    ctx.moveTo(chartX, y2);
    ctx.lineTo(chartX + chartW, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot Probe curve
    if (probes.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      probes.forEach((p, idx) => {
        const px = chartX + (idx / (probes.length - 1)) * chartW;
        const py = tempToY(p.tempCelsius);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      probes.forEach((p, idx) => {
        const px = chartX + (idx / (probes.length - 1)) * chartW;
        const py = tempToY(p.tempCelsius);
        ctx.fillStyle = p.tempCelsius > 8 || p.tempCelsius < 2 ? '#ef4444' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.fillText(`${p.tempCelsius.toFixed(1)}°C`, px - 22, py - 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(p.timeStamp, px - 18, chartY + chartH + 24);
      });
    }

    // Tachograph Summary Box inside Right Panel bottom
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(rightX + 35, rightY + 430, rightW - 70, 155);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(rightX + 35, rightY + 430, rightW - 70, 155);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('AB REGÜLASYONU (EC 561/2006) TAKOGRAF SÜRÜŞ & MOLA PLANI', rightX + 60, rightY + 468);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px JetBrains Mono, monospace';
    ctx.fillText(
      `Rota: ${metrics.totalRouteKm} km | Net Sürüş: ${metrics.pureDrivingHours.toFixed(1)} Saat | 45dk Zorunlu Mola: ${metrics.mandatory45MinBreaks} Adet`,
      rightX + 60,
      rightY + 510
    );
    ctx.fillText(
      `11 Saatlik Günlük Dinlenme: ${metrics.dailyRestPeriods11h} Adet | Toplam Lojistik Varış Süresi: ${metrics.totalElapsedTripHours.toFixed(1)} Saat`,
      rightX + 60,
      rightY + 550
    );
  }, [tcoInput, probes, metrics]);

  const download4KPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Corpus-Fleet-TCO-MKT-4K-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  };

  const exportExcelReport = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      ['CORPUS FLEET #048 PRO - EV vs DİZEL 5 YILLIK TCO & SOĞUK ZİNCİR MKT RAPORU'],
      ['Filo Adı', tcoInput.fleetName],
      ['Araç Sayısı', tcoInput.vehicleCount],
      ['Yıllık KM / Araç', tcoInput.annualKmPerVehicle],
      ['5 Yıllık EV Filo TCO ($)', Math.round(metrics.evFleetTotalCost)],
      ['5 Yıllık Dizel Filo TCO ($)', Math.round(metrics.dieselFleetTotalCost)],
      ['Net Filo Tasarrufu ($)', Math.round(metrics.totalFleetSavings)],
      ['Başabaş Süresi (Ay)', metrics.breakEvenMonths],
      ['Engellenen Emisyon (tCO2)', Math.round(metrics.co2SavedTonnesTotal)],
      ['USP <1079> Mean Kinetic Temp (°C)', Number(metrics.mktCelsius.toFixed(2))],
      ['Soğuk Zincir Durumu', metrics.coldChainStatus],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Filo_Ozet');

    const probeRows = probes.map((p) => ({
      Sensör_ID: p.id,
      Saat: p.timeStamp,
      Lokasyon: p.locationZone,
      Sicaklik_C: p.tempCelsius,
      Kelvin_K: Number((p.tempCelsius + 273.15).toFixed(2)),
    }));
    const wsProbes = XLSX.utils.json_to_sheet(probeRows);
    XLSX.utils.book_append_sheet(wb, wsProbes, 'ColdChain_MKT');

    XLSX.writeFile(wb, `Corpus-Fleet-TCO-MKT-${Date.now()}.xlsx`);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#040914] text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-sky-500/20 bg-[#071022]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Truck className="w-6 h-6 text-slate-950 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  #048 PRO
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  USP &lt;1079&gt; Arrhenius MKT • EC 561/2006
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                Corpus Fleet, EV vs Diesel TCO &amp; Cold-Chain MKT Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setTcoInput(DEFAULT_FLEET_INPUT);
                setProbes(DEFAULT_COLD_CHAIN_PROBES);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sıfırla
            </button>
            <button
              onClick={exportExcelReport}
              className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.XLSX)
            </button>
            <button
              onClick={download4KPoster}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              4K Filo &amp; MKT Sertifikası İndir
            </button>
            <button
              onClick={() => setShowBatModal(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              .BAT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* Top KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/75 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>5 YILLIK EV FİLO TCO</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${Math.round(metrics.evFleetTotalCost).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              KM Başı Maliyet: <strong className="text-slate-200">${metrics.evCostPerKm.toFixed(3)}/km</strong>
            </div>
          </div>

          <div className="bg-slate-900/75 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>5 YILLIK DİZEL FİLO TCO</span>
              <Fuel className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              ${Math.round(metrics.dieselFleetTotalCost).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              KM Başı Maliyet: <strong className="text-slate-200">${metrics.dieselCostPerKm.toFixed(3)}/km</strong>
            </div>
          </div>

          <div className="bg-slate-900/75 border border-sky-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>ELEKTRİFİKASYON NET AVANTAJI</span>
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400">
              ${Math.round(metrics.totalFleetSavings).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ROI Başabaş: <strong className="text-slate-200">{metrics.breakEvenMonths} Ay</strong> •{' '}
              {Math.round(metrics.co2SavedTonnesTotal)} tCO₂ Tasarruf
            </div>
          </div>

          <div className="bg-slate-900/75 border border-cyan-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>USP &lt;1079&gt; ARRHENIUS MKT</span>
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-300">
              {metrics.mktCelsius.toFixed(2)} °C
            </div>
            <div className="text-xs mt-1 flex items-center gap-1">
              {metrics.excursionCount === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2°C - 8°C Soğuk Zincir Tam Uyumlu
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> {metrics.excursionCount} Noktada Termal Sapma
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('tco')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'tco'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            1. EV vs Euro-6 Dizel 5-Yıl TCO Motoru
          </button>
          <button
            onClick={() => setActiveTab('coldchain')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'coldchain'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ThermometerSnowflake className="w-4 h-4" />
            2. USP &lt;1079&gt; Soğuk Zincir MKT Telemetrisi
          </button>
          <button
            onClick={() => setActiveTab('tachograph')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'tachograph'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            3. AB EC 561/2006 Takograf &amp; Sürüş Simülatörü
          </button>
        </div>

        {/* Tab 1: TCO Calculator */}
        {activeTab === 'tco' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
                Filo Operasyon Parametreleri
              </h2>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Filo / Operasyon Adı</label>
                <input
                  type="text"
                  value={tcoInput.fleetName}
                  onChange={(e) => updateTcoField('fleetName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Araç Adedi</label>
                  <input
                    type="number"
                    value={tcoInput.vehicleCount}
                    onChange={(e) => updateTcoField('vehicleCount', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Yıllık KM / Araç</label>
                  <input
                    type="number"
                    value={tcoInput.annualKmPerVehicle}
                    onChange={(e) => updateTcoField('annualKmPerVehicle', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Süre (Yıl)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tcoInput.holdingYears}
                    onChange={(e) => updateTcoField('holdingYears', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/75 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" /> Elektrikli Ticari Araç (e-Truck / e-Van)
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Satın Alma ($)</label>
                  <input
                    type="number"
                    value={tcoInput.evPurchasePrice}
                    onChange={(e) => updateTcoField('evPurchasePrice', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Yeşil Hibe/Teşvik ($)</label>
                  <input
                    type="number"
                    value={tcoInput.evSubsidyGrant}
                    onChange={(e) => updateTcoField('evSubsidyGrant', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tüketim (kWh/100km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tcoInput.evKwhPer100Km}
                    onChange={(e) => updateTcoField('evKwhPer100Km', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Elektrik ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tcoInput.electricityCostPerKwh}
                    onChange={(e) => updateTcoField('electricityCostPerKwh', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/75 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Fuel className="w-4 h-4" /> Euro-6 Dizel Ticari Araç
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Satın Alma ($)</label>
                  <input
                    type="number"
                    value={tcoInput.dieselPurchasePrice}
                    onChange={(e) => updateTcoField('dieselPurchasePrice', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tüketim (L/100km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tcoInput.dieselLitersPer100Km}
                    onChange={(e) => updateTcoField('dieselLitersPer100Km', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Motorin ($/Litre)</label>
                  <input
                    type="number"
                    step="0.02"
                    value={tcoInput.dieselCostPerLiter}
                    onChange={(e) => updateTcoField('dieselCostPerLiter', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Bakım ($/km)</label>
                  <input
                    type="number"
                    step="0.005"
                    value={tcoInput.dieselMaintenancePerKm}
                    onChange={(e) => updateTcoField('dieselMaintenancePerKm', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cold Chain MKT */}
        {activeTab === 'coldchain' && (
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
                  USP &lt;1079&gt; Arrhenius Ortalama Kinetik Sıcaklık (MKT) Telemetri Kayıtları
                </h2>
                <p className="text-xs text-slate-400">
                  Aktivasyon enerjisi ΔH = 83.144 kJ/mol ile üstel bozunma ağırlıklı sıcaklık hesabı.
                </p>
              </div>
              <button
                onClick={addProbe}
                className="px-3.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Sensör Okuması Ekle
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Sensör ID</th>
                    <th className="py-2.5 px-3">Saat</th>
                    <th className="py-2.5 px-3">Lojistik Koridor / İstasyon</th>
                    <th className="py-2.5 px-3">Sıcaklık (°C)</th>
                    <th className="py-2.5 px-3">Durum (2°C - 8°C)</th>
                    <th className="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {probes.map((p) => {
                    const isExcursion = p.tempCelsius < 2.0 || p.tempCelsius > 8.0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono text-sky-400">{p.id}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={p.timeStamp}
                            onChange={(e) => updateProbe(p.id, 'timeStamp', e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-20 font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={p.locationZone}
                            onChange={(e) => updateProbe(p.id, 'locationZone', e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 w-full max-w-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={p.tempCelsius}
                            onChange={(e) => updateProbe(p.id, 'tempCelsius', Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24 font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          {isExcursion ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                              İHLAL (EXCURSION)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              UYUMLU
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => removeProbe(p.id)}
                            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Tachograph Simulator */}
        {activeTab === 'tachograph' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-sky-400" />
                AB EC 561/2006 Takograf Rota Girdileri
              </h2>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Toplam Lojistik Hat Mesafesi (km): <strong className="text-white">{routeDistanceKm} km</strong>
                </label>
                <input
                  type="range"
                  min={150}
                  max={3500}
                  step={10}
                  value={routeDistanceKm}
                  onChange={(e) => setRouteDistanceKm(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Ortalama Ticari Seyir Hızı (km/s): <strong className="text-white">{avgSpeedKmh} km/s</strong>
                </label>
                <input
                  type="range"
                  min={45}
                  max={90}
                  step={1}
                  value={avgSpeedKmh}
                  onChange={(e) => setAvgSpeedKmh(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/75 border border-sky-500/30 rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Net Direksiyon Süresi</span>
                <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                  {metrics.pureDrivingHours.toFixed(1)} Saat
                </div>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">45 Dk Zorunlu Mola (4.5s Kuralı)</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {metrics.mandatory45MinBreaks} Adet
                </div>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">11 Saat Günlük İstirahat (9s Kuralı)</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {metrics.dailyRestPeriods11h} Periyot
                </div>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Toplam Kapıdan Kapıya ETA</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {metrics.totalElapsedTripHours.toFixed(1)} Saat
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live 4K Canvas Preview */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Canlı 4K (1920×1080) Filo Elektrifikasyon &amp; USP &lt;1079&gt; Soğuk Zincir Sertifikası
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
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                Tek Tıkla Başlatıcı (baslat.bat - Port 5220)
              </h3>
              <button
                onClick={() => setShowBatModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Kapat
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-sky-300 overflow-x-auto border border-slate-800">
{`@echo off
cd /d "%~dp0"
start http://localhost:5220
npm run dev -- --port 5220`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
