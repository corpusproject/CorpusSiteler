import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Container,
  Terminal,
  Package,
  Coins,
  BarChart3,
  Eye,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Ship,
  Scale,
  Box,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type LogisticsProject,
  type ContainerTypeId,
  type IncotermRule,
  type CargoSkuItem,
  CONTAINER_SPECS,
  PRESET_LOGISTICS_PROJECTS,
  calculateShipmentAndSupply,
} from './utils/logisticsEngine';

export default function App() {
  const [project, setProject] = useState<LogisticsProject>(
    PRESET_LOGISTICS_PROJECTS.shenzhen_istanbul_40hc
  );
  const [leftTab, setLeftTab] = useState<'cargo' | 'freight' | 'eoq'>('cargo');
  const [rightMode, setRightMode] = useState<'canvas' | 'landed' | 'inventory'>('canvas');
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary = useMemo(() => calculateShipmentAndSupply(project), [project]);

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Container Bin-Packing, Slotting & Landed Cost Manifest
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
    bg.addColorStop(0, '#09090d');
    bg.addColorStop(0.5, '#12100c');
    bg.addColorStop(1, '#080c12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.03)';
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
      `CORPUS SUPPLY CHAIN & CONTAINER LOAD MANIFEST  •  ${project.shipmentCode}  •  INCOTERM: ${project.incoterm}`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${project.originPort}  ➔  ${project.destinationPort} (${summary.containerSpec.name})`,
      74,
      112
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Total Cartons: ${summary.totalCartons.toLocaleString()}   |   Est. Euro Pallets: ${summary.totalPalletsEstimated}   |   Gross Weight: ${(summary.totalGrossWeightKg / 1000).toFixed(2)} Metric Tons   |   Limiting Constraint: ${summary.limitingFactor}`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('CONTAINER UTILIZATION', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `${summary.containersRequired}x Container (${summary.primaryContainerVolumeUtilPct}%)`,
      W - 570,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `${summary.totalVolumeCbm} CBM / ${summary.containerSpec.maxVolumeCbm} CBM`,
      W - 570,
      133
    );

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('TOTAL LANDED COST (DDP/CIF)', W - 300, 76);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `$${Math.round(summary.totalLandedCostUsd).toLocaleString()}`,
      W - 300,
      113
    );
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Multiplier: ${summary.landedCostMultiplier}x over FOB ($${Math.round(summary.totalFobUsd).toLocaleString()})`,
      W - 300,
      133
    );

    // ------------------------------------------------------------------------
    // SECTION 1 (LEFT TOP): 2D Container Cross-Section & Pallet Slotting Map
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 920, 410);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 920, 410);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      `1. CONTAINER DECK BIN-PACKING & PALLET BAY ALLOCATION (${summary.containerSpec.internalLengthCm}×${summary.containerSpec.internalWidthCm}×${summary.containerSpec.internalHeightCm} cm)`,
      74,
      218
    );

    // Draw Container Steel Shell
    const contX = 74;
    const contY = 242;
    const contW = 868;
    const contH = 220;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(contX, contY, contW, contH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(contX, contY, contW, contH);
    ctx.lineWidth = 1;

    // Render SKU Cargo Blocks inside Container proportionally
    const skuColors = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];
    let curX = contX + 8;
    const usableW = (contW - 16) * (summary.primaryContainerVolumeUtilPct / 100);

    summary.skuMetrics.forEach((m, idx) => {
      const share =
        summary.totalVolumeCbm > 0
          ? m.totalCartonVolumeCbm / summary.totalVolumeCbm
          : 0;
      const blockW = Math.max(40, usableW * share - 6);
      const col = skuColors[idx % skuColors.length];

      ctx.fillStyle = `${col}33`;
      ctx.fillRect(curX, contY + 12, blockW, contH - 24);
      ctx.strokeStyle = col;
      ctx.strokeRect(curX, contY + 12, blockW, contH - 24);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(m.sku.skuCode.slice(0, 16), curX + 12, contY + 46);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`${m.sku.cartonQuantity} Cartons`, curX + 12, contY + 72);
      ctx.fillText(`${m.totalCartonVolumeCbm} CBM`, curX + 12, contY + 94);
      ctx.fillText(`${(m.totalGrossWeightKg / 1000).toFixed(2)} t`, curX + 12, contY + 116);
      ctx.fillStyle = col;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`Class: ${m.sku.abcClass}`, curX + 12, contY + 146);

      curX += blockW + 6;
    });

    // Volume & Payload Utilization Bars under container drawing
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      `Volume (CBM) Fill: ${summary.primaryContainerVolumeUtilPct}%`,
      74,
      495
    );
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(74, 505, 410, 14);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(
      74,
      505,
      (410 * summary.primaryContainerVolumeUtilPct) / 100,
      14
    );

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(
      `Payload Weight Fill: ${summary.primaryContainerWeightUtilPct}%`,
      520,
      495
    );
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(520, 505, 422, 14);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(
      520,
      505,
      (422 * summary.primaryContainerWeightUtilPct) / 100,
      14
    );

    // ------------------------------------------------------------------------
    // SECTION 2 (LEFT BOTTOM): Wilson EOQ, Safety Stock & Reorder Point Matrix
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 614, 920, 418);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 614, 920, 418);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '2. WAREHOUSE ABC SLOTTING, WILSON EOQ & SAFETY STOCK POLICY',
      74,
      650
    );

    let eoqY = 696;
    for (const m of summary.skuMetrics.slice(0, 4)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, eoqY - 22, 868, 72);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(m.sku.skuCode, 92, eoqY + 2);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(m.sku.productName.slice(0, 42), 260, eoqY + 2);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `EOQ: ${m.eoqUnits.toLocaleString()} units   |   Safety Stock: ${m.safetyStockUnits.toLocaleString()} units   |   ROP (Reorder Point): ${m.reorderPointUnits.toLocaleString()} units   |   Lead Time: ${m.sku.leadTimeDays}d`,
        92,
        eoqY + 30
      );

      eoqY += 82;
    }

    // ------------------------------------------------------------------------
    // SECTION 3 (RIGHT): Landed Cost, Customs Duty & Incoterms Breakdown
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(992, 180, 880, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(992, 180, 880, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      `3. CUSTOMS HS-CODE DUTY & UNIT LANDED COST TABLE (${project.incoterm})`,
      1020,
      218
    );

    let skuY = 264;
    for (const m of summary.skuMetrics.slice(0, 5)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(1020, skuY - 22, 824, 122);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(1020, skuY - 22, 824, 122);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(
        `${m.sku.skuCode} — ${m.sku.productName}`,
        1040,
        skuY + 4
      );

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`HS Code: ${m.sku.hsCode} (Duty ${m.sku.customsDutyRatePct}%)`, 1580, skuY + 4);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Total Units: ${m.totalUnits.toLocaleString()} pcs   •   FOB Value: $${Math.round(m.totalFobValueUsd).toLocaleString()}   •   CIF Value: $${Math.round(m.cifValueUsd).toLocaleString()}   •   Duty: $${Math.round(m.customsDutyUsd).toLocaleString()}`,
        1040,
        skuY + 38
      );

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(
        `Unit FOB: $${m.sku.unitFobPriceUsd.toFixed(2)}  ➔  Unit Landed Cost: $${m.unitLandedCostUsd.toFixed(2)} / unit  (Total Landed: $${Math.round(m.totalLandedCostUsd).toLocaleString()})`,
        1040,
        skuY + 72
      );

      skuY += 136;
    }

    // Bottom Cost Summary Box
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(1020, 916, 824, 92);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.strokeRect(1020, 916, 824, 92);

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(
      `LOGISTICS SURCHARGE BREAKDOWN: Ocean Freight $${project.oceanFreightUsd} + Insurance $${project.marineInsuranceUsd} + Port THC $${project.portHandlingThcUsd} + Trucking $${project.inlandTruckingUsd}`,
      1042,
      950
    );
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    ctx.fillText(
      `Total FOB: $${Math.round(summary.totalFobUsd).toLocaleString()}   |   Total Customs Duty: $${Math.round(summary.totalDutyUsd).toLocaleString()}   |   Net Landed Cost: $${Math.round(summary.totalLandedCostUsd).toLocaleString()}`,
      1042,
      982
    );
  }, [project, summary]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${project.shipmentCode.toLowerCase()}-container-manifest-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const packingRows = summary.skuMetrics.map((m) => ({
      SKU: m.sku.skuCode,
      Description: m.sku.productName,
      'HS Code': m.sku.hsCode,
      'ABC Class': m.sku.abcClass,
      Cartons: m.sku.cartonQuantity,
      'Units/Carton': m.sku.unitsPerCarton,
      'Total Units': m.totalUnits,
      'Total Volume (CBM)': m.totalCartonVolumeCbm,
      'Gross Weight (kg)': m.totalGrossWeightKg,
      'Unit FOB ($)': m.sku.unitFobPriceUsd,
      'Total FOB ($)': Math.round(m.totalFobValueUsd),
      'Customs Duty ($)': Math.round(m.customsDutyUsd),
      'Total Landed Cost ($)': Math.round(m.totalLandedCostUsd),
      'Unit Landed Cost ($)': Number(m.unitLandedCostUsd.toFixed(2)),
      'EOQ (Units)': m.eoqUnits,
      'Safety Stock (Units)': m.safetyStockUnits,
      'Reorder Point (Units)': m.reorderPointUnits,
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(packingRows),
      'Packing List & Landed Cost'
    );

    XLSX.writeFile(wb, `${project.shipmentCode}-packing-manifest.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-950/50">
            <Container className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Supply, Container Load & Logistics Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full">
                #037 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              20ft/40ft HC Bin-Packing • Incoterms Landed Cost • Wilson EOQ & Safety Stock Engine
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="hidden xl:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() =>
              setProject(PRESET_LOGISTICS_PROJECTS.shenzhen_istanbul_40hc)
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              project.shipmentCode.includes('CN-TR')
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Shanghai ➔ İstanbul (40&apos; HC)
          </button>
          <button
            onClick={() =>
              setProject(PRESET_LOGISTICS_PROJECTS.izmir_hamburg_road)
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              project.shipmentCode.includes('TR-DE')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            İzmir ➔ Hamburg (Mega Tır)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Doluluk:</span>
            <span className="font-mono font-bold text-amber-400">
              %{summary.primaryContainerVolumeUtilPct} CBM
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Maliyet:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${Math.round(summary.totalLandedCostUsd).toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Çeki Listesi (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-amber-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Konteyner Manifestosu İndir
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
              { id: 'cargo', label: `Koli & SKU (${project.skus.length})`, icon: Package },
              { id: 'freight', label: 'Konteyner & Navlun', icon: Ship },
              { id: 'eoq', label: 'EOQ & Stok Politikası', icon: BarChart3 },
            ].map((t) => {
              const Icon = t.icon;
              const active = leftTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
            {leftTab === 'cargo' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-zinc-200">
                      Koli Ebatları, GTİP (HS Code) & Sipariş Kalemleri
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Koli ölçülerini (cm), ağırlığını (kg) ve gümrük vergisi oranlarını girin
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        skus: [
                          ...project.skus,
                          {
                            id: `sku-${Date.now()}`,
                            skuCode: `SKU-NEW-${project.skus.length + 1}`,
                            productName: 'Yeni İthalat / İhracat Ürün Kalemi',
                            hsCode: '8471.30.00',
                            abcClass: 'B (Regular)',
                            cartonLengthCm: 50,
                            cartonWidthCm: 40,
                            cartonHeightCm: 35,
                            cartonGrossWeightKg: 18.0,
                            unitsPerCarton: 10,
                            cartonQuantity: 150,
                            unitFobPriceUsd: 45.0,
                            customsDutyRatePct: 5.0,
                            annualDemandUnits: 12000,
                            orderingCostUsd: 350,
                            holdingCostPct: 20,
                            leadTimeDays: 25,
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    SKU Ekle
                  </button>
                </div>

                {project.skus.map((sku, idx) => (
                  <div
                    key={sku.id}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sku.skuCode}
                        onChange={(e) => {
                          const next = [...project.skus];
                          next[idx] = { ...sku, skuCode: e.target.value };
                          setProject({ ...project, skus: next });
                        }}
                        className="w-36 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                      />
                      <input
                        type="text"
                        value={sku.hsCode}
                        onChange={(e) => {
                          const next = [...project.skus];
                          next[idx] = { ...sku, hsCode: e.target.value };
                          setProject({ ...project, skus: next });
                        }}
                        placeholder="GTİP / HS Code"
                        className="w-28 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300"
                      />
                      <select
                        value={sku.abcClass}
                        onChange={(e) => {
                          const next = [...project.skus];
                          next[idx] = {
                            ...sku,
                            abcClass: e.target.value as CargoSkuItem['abcClass'],
                          };
                          setProject({ ...project, skus: next });
                        }}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                      >
                        <option value="A (Fast Mover)">A (Fast Mover)</option>
                        <option value="B (Regular)">B (Regular)</option>
                        <option value="C (Slow Mover)">C (Slow Mover)</option>
                      </select>
                      <button
                        onClick={() =>
                          setProject({
                            ...project,
                            skus: project.skus.filter((_, i) => i !== idx),
                          })
                        }
                        className="ml-auto text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={sku.productName}
                      onChange={(e) => {
                        const next = [...project.skus];
                        next[idx] = { ...sku, productName: e.target.value };
                        setProject({ ...project, skus: next });
                      }}
                      className="w-full px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-white"
                    />

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500">
                          Boy×En×Yük (cm)
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={sku.cartonLengthCm}
                            onChange={(e) => {
                              const next = [...project.skus];
                              next[idx] = {
                                ...sku,
                                cartonLengthCm: Number(e.target.value),
                              };
                              setProject({ ...project, skus: next });
                            }}
                            className="w-1/3 px-1 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono"
                          />
                          <input
                            type="number"
                            value={sku.cartonWidthCm}
                            onChange={(e) => {
                              const next = [...project.skus];
                              next[idx] = {
                                ...sku,
                                cartonWidthCm: Number(e.target.value),
                              };
                              setProject({ ...project, skus: next });
                            }}
                            className="w-1/3 px-1 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono"
                          />
                          <input
                            type="number"
                            value={sku.cartonHeightCm}
                            onChange={(e) => {
                              const next = [...project.skus];
                              next[idx] = {
                                ...sku,
                                cartonHeightCm: Number(e.target.value),
                              };
                              setProject({ ...project, skus: next });
                            }}
                            className="w-1/3 px-1 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500">
                          Koli Adedi & Kg
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={sku.cartonQuantity}
                            onChange={(e) => {
                              const next = [...project.skus];
                              next[idx] = {
                                ...sku,
                                cartonQuantity: Number(e.target.value),
                              };
                              setProject({ ...project, skus: next });
                            }}
                            className="w-1/2 px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                          />
                          <input
                            type="number"
                            value={sku.cartonGrossWeightKg}
                            onChange={(e) => {
                              const next = [...project.skus];
                              next[idx] = {
                                ...sku,
                                cartonGrossWeightKg: Number(e.target.value),
                              };
                              setProject({ ...project, skus: next });
                            }}
                            className="w-1/2 px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500">
                          Birim FOB ($)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={sku.unitFobPriceUsd}
                          onChange={(e) => {
                            const next = [...project.skus];
                            next[idx] = {
                              ...sku,
                              unitFobPriceUsd: Number(e.target.value),
                            };
                            setProject({ ...project, skus: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500">
                          Gümrük Vergi %
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={sku.customsDutyRatePct}
                          onChange={(e) => {
                            const next = [...project.skus];
                            next[idx] = {
                              ...sku,
                              customsDutyRatePct: Number(e.target.value),
                            };
                            setProject({ ...project, skus: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {leftTab === 'freight' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Çıkış Limanı (Origin)
                    </label>
                    <input
                      type="text"
                      value={project.originPort}
                      onChange={(e) =>
                        setProject({ ...project, originPort: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Varış Limanı (Destination)
                    </label>
                    <input
                      type="text"
                      value={project.destinationPort}
                      onChange={(e) =>
                        setProject({ ...project, destinationPort: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Konteyner / Tır Tipi
                    </label>
                    <select
                      value={project.containerType}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          containerType: e.target.value as ContainerTypeId,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    >
                      {CONTAINER_SPECS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.maxVolumeCbm} CBM)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Incoterms 2020 Teslim Şekli
                    </label>
                    <select
                      value={project.incoterm}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          incoterm: e.target.value as IncotermRule,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-300"
                    >
                      <option value="EXW">EXW (Ex Works)</option>
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                      <option value="DAP">DAP (Delivered at Place)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Deniz / Kara Navlun Bedeli ($)
                    </label>
                    <input
                      type="number"
                      value={project.oceanFreightUsd}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          oceanFreightUsd: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Nakliyat Sigortası ($)
                    </label>
                    <input
                      type="number"
                      value={project.marineInsuranceUsd}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          marineInsuranceUsd: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Liman THC & Ardiye ($)
                    </label>
                    <input
                      type="number"
                      value={project.portHandlingThcUsd}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          portHandlingThcUsd: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      İç Nakliye / Tır Çekici ($)
                    </label>
                    <input
                      type="number"
                      value={project.inlandTruckingUsd}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          inlandTruckingUsd: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'eoq' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <label className="block text-xs font-bold uppercase text-amber-400">
                    Hedef Hizmet Seviyesi (Service Level Z-Score)
                  </label>
                  <select
                    value={project.serviceLevelZScore}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        serviceLevelZScore: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                  >
                    <option value={1.65}>%95 Hizmet Seviyesi (Z = 1.65)</option>
                    <option value={2.05}>%98 Hizmet Seviyesi (Z = 2.05)</option>
                    <option value={2.33}>%99 Kritik Stoksuz Kalmama (Z = 2.33)</option>
                  </select>
                </div>

                {project.skus.map((sku, idx) => (
                  <div
                    key={sku.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2"
                  >
                    <div className="text-xs font-bold text-white">{sku.skuCode}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400">
                          Yıllık Talep (Adet)
                        </label>
                        <input
                          type="number"
                          value={sku.annualDemandUnits}
                          onChange={(e) => {
                            const next = [...project.skus];
                            next[idx] = {
                              ...sku,
                              annualDemandUnits: Number(e.target.value),
                            };
                            setProject({ ...project, skus: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400">
                          Tedarik Süresi (Gün)
                        </label>
                        <input
                          type="number"
                          value={sku.leadTimeDays}
                          onChange={(e) => {
                            const next = [...project.skus];
                            next[idx] = {
                              ...sku,
                              leadTimeDays: Number(e.target.value),
                            };
                            setProject({ ...project, skus: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400">
                          Stok Tutma (% Yıl)
                        </label>
                        <input
                          type="number"
                          value={sku.holdingCostPct}
                          onChange={(e) => {
                            const next = [...project.skus];
                            next[idx] = {
                              ...sku,
                              holdingCostPct: Number(e.target.value),
                            };
                            setProject({ ...project, skus: next });
                          }}
                          className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
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
                { id: 'canvas', label: '4K Konteyner & Tedarik Zinciri Kartı', icon: Eye },
                { id: 'landed', label: 'Gümrük & Birim Maliyet (Landed Cost)', icon: Coins },
                { id: 'inventory', label: 'EOQ & Emniyet Stoku Matrisi', icon: Box },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
                      <Box className="w-3.5 h-3.5 text-amber-400" /> Toplam Hacim
                    </div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {summary.totalVolumeCbm} m³ (CBM)
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" /> Brüt Tonaj
                    </div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {(summary.totalGrossWeightKg / 1000).toFixed(2)} Ton
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Euro Palet Tahmini</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {summary.totalPalletsEstimated} Palet
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Toplam Landed Cost</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      ${Math.round(summary.totalLandedCostUsd).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightMode === 'landed' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">SKU / GTİP</th>
                      <th className="py-3 px-3">Toplam Adet</th>
                      <th className="py-3 px-3">Toplam FOB</th>
                      <th className="py-3 px-3">Gümrük Vergisi</th>
                      <th className="py-3 px-3">Birim FOB</th>
                      <th className="py-3 px-3">Birim Landed Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.skuMetrics.map((m) => (
                      <tr key={m.sku.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{m.sku.skuCode}</div>
                          <div className="text-[10px] text-zinc-400">HS: {m.sku.hsCode}</div>
                        </td>
                        <td className="py-3 px-3 text-zinc-200">
                          {m.totalUnits.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          ${Math.round(m.totalFobValueUsd).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          ${Math.round(m.customsDutyUsd).toLocaleString()} (%{m.sku.customsDutyRatePct})
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          ${m.sku.unitFobPriceUsd.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          ${m.unitLandedCostUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rightMode === 'inventory' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <th className="py-3 px-4">SKU & ABC Sınıfı</th>
                      <th className="py-3 px-3">Yıllık Talep</th>
                      <th className="py-3 px-3">Wilson EOQ</th>
                      <th className="py-3 px-3">Emniyet Stoku</th>
                      <th className="py-3 px-3">Yeniden Sipariş (ROP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {summary.skuMetrics.map((m) => (
                      <tr key={m.sku.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{m.sku.skuCode}</div>
                          <div className="text-[10px] text-amber-400">{m.sku.abcClass}</div>
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {m.sku.annualDemandUnits.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-cyan-400">
                          {m.eoqUnits.toLocaleString()} adet
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          {m.safetyStockUnits.toLocaleString()} adet
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          {m.reorderPointUnits.toLocaleString()} adet
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
                Masaüstü Başlatıcı (.BAT) — Port 5209
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
title Corpus Supply, Container & Logistics Studio (#037 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-logistics"
start http://localhost:5209
npm run dev -- --port 5209`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
