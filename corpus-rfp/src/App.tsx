import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Award,
  Scale,
  DollarSign,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Terminal,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  DEFAULT_RFP_WEIGHTS,
  DEFAULT_VENDORS,
  evaluateRFPMatrix,
  type RFPCriterionWeights,
  type VendorBid,
} from './utils/rfpEngine';

export default function App() {
  const [rfpTitle, setRfpTitle] = useState<string>(
    'RFP-2026-050: Kurumsal Bulut ERP & Küresel Tedarik Zinciri Platformu İhalesi'
  );
  const [weights, setWeights] = useState<RFPCriterionWeights>(DEFAULT_RFP_WEIGHTS);
  const [vendors, setVendors] = useState<VendorBid[]>(DEFAULT_VENDORS);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);
  const [showBatModal, setShowBatModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const result = useMemo(
    () => evaluateRFPMatrix(rfpTitle, weights, vendors),
    [rfpTitle, weights, vendors]
  );

  const updateWeight = <K extends keyof RFPCriterionWeights>(key: K, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const addVendor = () => {
    const nextNum = vendors.length + 1;
    setVendors((prev) => [
      ...prev,
      {
        id: `V-0${nextNum}`,
        vendorName: `Yeni Aday Tedarikçi #${nextNum}`,
        tierTag: 'Enterprise Vendor',
        techScore: 85,
        securityScore: 86,
        slaScore: 84,
        speedScore: 85,
        implementationFee: 90000,
        annualLicenseFee: 135000,
        annualSupportFee: 22000,
        annualEscalationPct: 4,
        exitMigrationCost: 30000,
        supplyRiskScore: 5.5,
        profitImpactScore: 7.5,
      },
    ]);
  };

  const removeVendor = (id: string) => {
    if (vendors.length <= 2) return;
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVendor = <K extends keyof VendorBid>(id: string, key: K, val: VendorBid[K]) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [key]: val } : v))
    );
  };

  // Draw 4K (1920x1080) RFP AHP Scoring & Kraljic Portfolio Matrix Board
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
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#070a12');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#09101d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.06)';
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
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(60, 50, W - 120, 115);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 50, W - 120, 115);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('CORPUS PROCUREMENT #050 PRO • RFP MULTI-VENDOR AHP MATRIX, KRALJIC & 5-YR TCO STUDIO', 90, 95);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 31px Inter, sans-serif';
    ctx.fillText(rfpTitle, 90, 140);

    // KPI Cards
    const kpis = [
      {
        label: 'İHALE BİRİNCİSİ (AWARD WINNER)',
        val: result.winnerVendor.vendorName.slice(0, 22),
        sub: `AHP Skoru: ${result.winnerVendor.weightedAhpScore.toFixed(2)} / 100`,
        color: '#10b981',
      },
      {
        label: 'KAZANAN 5 YILLIK TOPLAM TCO',
        val: `$${result.winnerVendor.fiveYearTco.toLocaleString()}`,
        sub: `Yıllık Eskalasyon: %${result.winnerVendor.annualEscalationPct} Dahil`,
        color: '#38bdf8',
      },
      {
        label: 'KRALJIC PORTFÖY SINIFI',
        val: result.winnerVendor.kraljicQuadrant.split(' ')[0],
        sub: result.winnerVendor.kraljicQuadrant,
        color: '#f59e0b',
      },
      {
        label: 'TEKLİFLER ARASI TCO FARKI (SPREAD)',
        val: `$${result.tcoSpreadMaxMin.toLocaleString()}`,
        sub: `${result.evaluatedVendors.length} Aday Tedarikçi Kıyaslandı`,
        color: '#c084fc',
      },
    ];

    kpis.forEach((k, idx) => {
      const bx = 60 + idx * 455;
      const by = 195;
      const bw = 435;
      const bh = 165;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = k.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(k.label, bx + 24, by + 40);

      ctx.fillStyle = k.color;
      ctx.font = 'bold 34px JetBrains Mono, monospace';
      ctx.fillText(k.val, bx + 24, by + 96);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(k.sub, bx + 24, by + 138);
    });

    // Left Panel: Multi-Vendor AHP Weighted Score & 5-Yr TCO Ranking Table
    const leftX = 60;
    const leftY = 390;
    const leftW = 1040;
    const leftH = 620;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(leftX, leftY, leftW, leftH);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.strokeRect(leftX, leftY, leftW, leftH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('ÇOK KRİTERLİ AHP TEDARİKÇİ SIRALAMASI VE 5 YILLIK TCO ANALİZİ', leftX + 30, leftY + 48);

    result.evaluatedVendors.slice(0, 5).forEach((v, i) => {
      const ry = leftY + 95 + i * 100;
      ctx.fillStyle = i === 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(leftX + 30, ry, leftW - 60, 82);
      ctx.strokeStyle = i === 0 ? '#10b981' : '#334155';
      ctx.strokeRect(leftX + 30, ry, leftW - 60, 82);

      ctx.fillStyle = i === 0 ? '#10b981' : '#f59e0b';
      ctx.font = 'bold 24px JetBrains Mono, monospace';
      ctx.fillText(`#${v.rank}`, leftX + 50, ry + 50);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText(v.vendorName, leftX + 115, ry + 36);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText(
        `Teknik: ${v.techScore} | Güvenlik: ${v.securityScore} | SLA: ${v.slaScore} | Ticari Skor: ${v.commercialScoreNormalized.toFixed(1)}`,
        leftX + 115,
        ry + 64
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px JetBrains Mono, monospace';
      ctx.fillText(`5Y TCO: $${v.fiveYearTco.toLocaleString()}`, leftX + 585, ry + 48);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px JetBrains Mono, monospace';
      ctx.fillText(`${v.weightedAhpScore.toFixed(1)} Puan`, leftX + 865, ry + 48);
    });

    // Right Panel: Kraljic 2x2 Portfolio Matrix
    const rightX = 1130;
    const rightY = 390;
    const rightW = 730;
    const rightH = 620;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(rightX, rightY, rightW, rightH);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.strokeRect(rightX, rightY, rightW, rightH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('KRALJIC TEDARİK PORTFÖY MATRİSİ (2x2)', rightX + 30, rightY + 48);

    const mx = rightX + 70;
    const my = rightY + 90;
    const mw = 600;
    const mh = 470;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);

    // Mid lines
    ctx.beginPath();
    ctx.moveTo(mx + mw / 2, my);
    ctx.lineTo(mx + mw / 2, my + mh);
    ctx.moveTo(mx, my + mh / 2);
    ctx.lineTo(mx + mw, my + mh / 2);
    ctx.stroke();

    // Quadrant Labels
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('KALDIRAÇ (LEVERAGE)', mx + 20, my + 32);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.fillText('STRATEJİK ORTAK (STRATEGIC)', mx + mw / 2 + 20, my + 32);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.fillText('RUTİN (NON-CRITICAL)', mx + 20, my + mh / 2 + 32);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.fillText('DARBOĞAZ (BOTTLENECK)', mx + mw / 2 + 20, my + mh / 2 + 32);

    // Plot Vendors on Kraljic Matrix
    result.evaluatedVendors.forEach((v, idx) => {
      const px = mx + (Math.min(10, Math.max(0, v.supplyRiskScore)) / 10) * mw;
      const py = my + mh - (Math.min(10, Math.max(0, v.profitImpactScore)) / 10) * mh;

      ctx.fillStyle = idx === 0 ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(`#${v.rank} ${v.vendorName.slice(0, 16)}`, px - 45, py - 18);
    });
  }, [rfpTitle, weights, vendors, result]);

  const download4KPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Corpus-RFP-AHP-Award-4K-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const vendorRows = result.evaluatedVendors.map((v) => ({
      Sira: v.rank,
      Tedarikci: v.vendorName,
      Segment: v.tierTag,
      Teknik_Skor: v.techScore,
      Guvenlik_Skor: v.securityScore,
      SLA_Skor: v.slaScore,
      Ticari_Skor: Number(v.commercialScoreNormalized.toFixed(1)),
      AHP_Agirlikli_Puan: Number(v.weightedAhpScore.toFixed(2)),
      Bes_Yillik_TCO_USD: v.fiveYearTco,
      Kraljic_Sinifi: v.kraljicQuadrant,
    }));
    const ws = XLSX.utils.json_to_sheet(vendorRows);
    XLSX.utils.book_append_sheet(wb, ws, 'RFP_AHP_Karar_Matrisi');
    XLSX.writeFile(wb, `Corpus-RFP-Matrix-${Date.now()}.xlsx`);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const copyAwardMemo = () => {
    navigator.clipboard.writeText(result.executiveAwardMemoMarkdown);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-[#0c1221]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Award className="w-6 h-6 text-slate-950 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  #050 PRO • 50. SİTE MİLESTONE
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  AHP Multi-Vendor Matrix • Kraljic 2×2 • 5-Yr TCO
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                Corpus Procurement, RFP Vendor Scoring &amp; Kraljic TCO Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setWeights(DEFAULT_RFP_WEIGHTS);
                setVendors(DEFAULT_VENDORS);
              }}
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
              onClick={download4KPoster}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              4K İhale Karar Matrisi İndir
            </button>
            <button
              onClick={() => setShowBatModal(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-amber-300 flex items-center gap-1.5 cursor-pointer"
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
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>İHALE BİRİNCİSİ (RANK #1)</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 truncate">
              {result.winnerVendor.vendorName}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Ağırlıklı AHP Skoru:{' '}
              <strong className="text-white font-mono">
                {result.winnerVendor.weightedAhpScore.toFixed(2)} / 100
              </strong>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>KAZANAN 5 YILLIK TCO</span>
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400">
              ${result.winnerVendor.fiveYearTco.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              AHP Puan Başı Maliyet:{' '}
              <strong className="text-white font-mono">
                ${Math.round(result.winnerVendor.costPerAhpPoint).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>KRALJIC PORTFÖY KONUMU</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base font-bold text-amber-300">
              {result.winnerVendor.kraljicQuadrant}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Risk: {result.winnerVendor.supplyRiskScore}/10 • Etki: {result.winnerVendor.profitImpactScore}/10
            </div>
          </div>

          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>TCO MAKAS FARKI (MAX - MİN)</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">
              ${result.tcoSpreadMaxMin.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Toplam Kriter Ağırlığı: <strong className="text-white">%{result.totalWeightSum}</strong>
            </div>
          </div>
        </section>

        {/* AHP Criterion Weights Bar */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                1. Analitik Hiyerarşi Süreci (AHP) Kriter Ağırlıkları (Toplam: %{result.totalWeightSum})
              </h2>
            </div>
            <input
              type="text"
              value={rfpTitle}
              onChange={(e) => setRfpTitle(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white w-full md:w-96"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Teknik Mimari (%{weights.technicalArchitecture})
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={weights.technicalArchitecture}
                onChange={(e) => updateWeight('technicalArchitecture', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Bilgi Güvenliği (%{weights.securityCompliance})
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={weights.securityCompliance}
                onChange={(e) => updateWeight('securityCompliance', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                SLA &amp; Destek (%{weights.slaSupport})
              </label>
              <input
                type="range"
                min={5}
                max={50}
                value={weights.slaSupport}
                onChange={(e) => updateWeight('slaSupport', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                5-Yıl Ticari TCO (%{weights.commercialTco})
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={weights.commercialTco}
                onChange={(e) => updateWeight('commercialTco', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Canlıya Geçiş Hızı (%{weights.implementationSpeed})
              </label>
              <input
                type="range"
                min={5}
                max={40}
                value={weights.implementationSpeed}
                onChange={(e) => updateWeight('implementationSpeed', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </section>

        {/* Vendors Scoring & 5-Year TCO Table */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Aday Tedarikçi Teknik Puanlama &amp; 5 Yıllık TCO Girdileri
            </h2>
            <button
              onClick={addVendor}
              className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Yeni Tedarikçi Ekle
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-2">Sıra</th>
                  <th className="py-2.5 px-2">Tedarikçi Adı</th>
                  <th className="py-2.5 px-2">Teknik</th>
                  <th className="py-2.5 px-2">Güvenlik</th>
                  <th className="py-2.5 px-2">SLA</th>
                  <th className="py-2.5 px-2">Kurulum ($)</th>
                  <th className="py-2.5 px-2">Yıllık Lisans ($)</th>
                  <th className="py-2.5 px-2">5-Yıl TCO ($)</th>
                  <th className="py-2.5 px-2">AHP Skoru</th>
                  <th className="py-2.5 px-2">Sil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.evaluatedVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-2 font-mono font-bold text-amber-400">#{v.rank}</td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={v.vendorName}
                        onChange={(e) => updateVendor(v.id, 'vendorName', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-44 text-white"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={v.techScore}
                        onChange={(e) => updateVendor(v.id, 'techScore', Number(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-16 font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={v.securityScore}
                        onChange={(e) => updateVendor(v.id, 'securityScore', Number(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-16 font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={v.slaScore}
                        onChange={(e) => updateVendor(v.id, 'slaScore', Number(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-16 font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={v.implementationFee}
                        onChange={(e) => updateVendor(v.id, 'implementationFee', Number(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24 font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={v.annualLicenseFee}
                        onChange={(e) => updateVendor(v.id, 'annualLicenseFee', Number(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24 font-mono"
                      />
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-sky-400">
                      ${v.fiveYearTco.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-emerald-400">
                      {v.weightedAhpScore.toFixed(2)}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => removeVendor(v.id)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Executive Award Memo Markdown */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              3. Resmi Satınalma Komitesi İhale Karar Tutanağı (Markdown)
            </h2>
            <button
              onClick={copyAwardMemo}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMemo ? 'Kopyalandı' : 'Tutanağı Kopyala'}
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {result.executiveAwardMemoMarkdown}
          </pre>
        </section>

        {/* Live 4K Canvas Preview */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Canlı 4K (1920×1080) RFP AHP Skorlama &amp; Kraljic Portföy Karar Panosu
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
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                Tek Tıkla Başlatıcı (baslat.bat - Port 5222)
              </h3>
              <button
                onClick={() => setShowBatModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Kapat
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
{`@echo off
cd /d "%~dp0"
start http://localhost:5222
npm run dev -- --port 5222`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
