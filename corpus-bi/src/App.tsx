import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  BarChart3,
  Table2,
  Layers,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Download,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import {
  DEFAULT_BI_DATASET,
  PRESET_BI_DATASETS,
  type BiDataset,
  type AggregationFn,
  type ChartStyle,
  inspectColumns,
  computePivot,
  calculateMetricStats,
  parseUploadedDataFile,
  exportBiReportToExcel,
  renderBiDashboardToCanvas,
  exportBiDashboardPng,
} from './utils/biEngine';

type BiStudioTab = 'pivot' | 'table' | 'anomalies';

export default function App() {
  const [dataset, setDataset] = useState<BiDataset>(() => {
    try {
      const saved = localStorage.getItem('corpus_bi_dataset_v1');
      return saved ? JSON.parse(saved) : DEFAULT_BI_DATASET;
    } catch {
      return DEFAULT_BI_DATASET;
    }
  });

  const { dimensions, metrics } = useMemo(
    () => inspectColumns(dataset.rows),
    [dataset.rows]
  );

  const [dimensionKey, setDimensionKey] = useState<string>(
    () => dimensions[1] || dimensions[0] || ''
  );
  const [metricKey, setMetricKey] = useState<string>(
    () => metrics[0] || ''
  );
  const [aggFn, setAggFn] = useState<AggregationFn>('SUM');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');
  const [activeTab, setActiveTab] = useState<BiStudioTab>('pivot');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoom, setZoom] = useState<number>(0.54);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const dashboardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep dimensionKey & metricKey valid when dataset changes
  useEffect(() => {
    if (!dimensions.includes(dimensionKey)) {
      setDimensionKey(dimensions[1] || dimensions[0] || '');
    }
    if (!metrics.includes(metricKey)) {
      setMetricKey(metrics[0] || '');
    }
  }, [dimensions, metrics, dimensionKey, metricKey]);

  // Save dataset to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('corpus_bi_dataset_v1', JSON.stringify(dataset));
    } catch {
      // ignore quota error
    }
  }, [dataset]);

  // Filtered rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return dataset.rows;
    const q = searchQuery.toLowerCase();
    return dataset.rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [dataset.rows, searchQuery]);

  const pivotData = useMemo(
    () => computePivot(filteredRows, dimensionKey, metricKey, aggFn),
    [filteredRows, dimensionKey, metricKey, aggFn]
  );

  const metricStats = useMemo(
    () => calculateMetricStats(filteredRows, metricKey, dimensionKey),
    [filteredRows, metricKey, dimensionKey]
  );

  // Render Executive BI Canvas
  useEffect(() => {
    if (!dashboardCanvasRef.current) return;
    renderBiDashboardToCanvas(
      dashboardCanvasRef.current,
      { ...dataset, rows: filteredRows },
      pivotData,
      metricStats,
      dimensionKey,
      metricKey,
      aggFn,
      chartStyle
    );
  }, [dataset, filteredRows, pivotData, metricStats, dimensionKey, metricKey, aggFn, chartStyle]);

  const handleSelectPreset = (key: string) => {
    const preset = PRESET_BI_DATASETS[key];
    if (!preset) return;
    const built = preset.build();
    const cols = inspectColumns(built.rows);
    setDataset(built);
    setDimensionKey(cols.dimensions[1] || cols.dimensions[0] || '');
    setMetricKey(cols.metrics[0] || '');
    setSearchQuery('');
  };

  const handleFileUpload = async (file: File) => {
    try {
      const rows = await parseUploadedDataFile(file);
      if (!rows.length) return;
      const cols = inspectColumns(rows);
      setDataset({
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, '') + ' — Kurumsal Veri Analizi',
        subtitle: `${rows.length} Satır • Otomatik Sütun ve Pivot Algılama`,
        currencySymbol: '',
        rows,
      });
      setDimensionKey(cols.dimensions[0] || '');
      setMetricKey(cols.metrics[0] || '');
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore invalid file
    }
  };

  const handleAddRow = () => {
    if (!dataset.rows.length) return;
    const template = dataset.rows[0];
    const newRow: Record<string, string | number> = {};
    Object.keys(template).forEach((k) => {
      newRow[k] = typeof template[k] === 'number' ? 1000 : 'Yeni Kayıt';
    });
    setDataset((prev) => ({ ...prev, rows: [newRow, ...prev.rows] }));
  };

  const handleExportExcel = () => {
    exportBiReportToExcel(dataset, pivotData, dimensionKey, metricKey, aggFn);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportPng = () => {
    if (!dashboardCanvasRef.current) return;
    exportBiDashboardPng(dashboardCanvasRef.current, dataset.title);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Data, Pivot & BI Studio Pro (#015)',
      'echo Corpus Veri Analizi ve BI Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5187',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-BI-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const allColumns = dataset.rows.length ? Object.keys(dataset.rows[0]) : [];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Data, Pivot & BI Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #015 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Excel / CSV / JSON Veri Analizi, Otomatik Pivot Tablo, Z-Score Anomali Tespiti & 4K Yönetici Raporu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Toplam ({metricKey}):</span>
              <strong className="text-emerald-400">
                {dataset.currencySymbol}
                {metricStats.sum.toLocaleString('tr-TR')}
              </strong>
            </div>

            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-all cursor-pointer"
            >
              <MonitorDown className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Uygulamayı İndir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Top Studio Control Bar */}
      <div className="border-b border-zinc-800/70 bg-[#111114]/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Dataset Switcher & Upload */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {Object.entries(PRESET_BI_DATASETS).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    dataset.id === key
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-violet-400" />
              Excel (.XLSX) / CSV Yükle
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                  e.target.value = '';
                }}
              />
            </label>

            <select
              value={chartStyle}
              onChange={(e) => setChartStyle(e.target.value as ChartStyle)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
            >
              <option value="bar">Grafik: Dikey Sütun (Bar)</option>
              <option value="line-area">Grafik: Trend Çizgi & Alan</option>
              <option value="donut">Grafik: Halka Dağılım (Donut)</option>
              <option value="horizontal">Grafik: Yatay Sıralama</option>
            </select>
          </div>

          {/* Right: Export Excel & 4K PNG */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Pivot + Veri (.XLSX) İndir
            </button>

            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              4K Yönetici Raporu İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'pivot', label: 'Pivot & Boyutlar', icon: Layers },
              { id: 'table', label: `Veri (${filteredRows.length})`, icon: Table2 },
              {
                id: 'anomalies',
                label: `İstatistik (${metricStats.anomalies.length})`,
                icon: AlertTriangle,
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as BiStudioTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-[#111115] border border-zinc-800/90 p-4 sm:p-5 flex-1 flex flex-col gap-4 corpus-card-glow">
            {/* TAB 1: PIVOT ENGINE */}
            {activeTab === 'pivot' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Dinamik Pivot Tablo & Gruplama Motoru
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Kategorik sütuna göre sayısal verileri anında gruplayın
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Gruplanacak Boyut (X)
                    </label>
                    <select
                      value={dimensionKey}
                      onChange={(e) => setDimensionKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    >
                      {allColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Hesaplanacak Metrik (Y)
                    </label>
                    <select
                      value={metricKey}
                      onChange={(e) => setMetricKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    >
                      {metrics.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Özet Fonksiyonu
                    </label>
                    <select
                      value={aggFn}
                      onChange={(e) => setAggFn(e.target.value as AggregationFn)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    >
                      <option value="SUM">SUM (Toplam)</option>
                      <option value="AVG">AVG (Ortalama)</option>
                      <option value="COUNT">COUNT (Adet)</option>
                      <option value="MAX">MAX (En Yüksek)</option>
                      <option value="MIN">MIN (En Düşük)</option>
                    </select>
                  </div>
                </div>

                {/* Live Pivot Breakdown List */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {pivotData.map((item, idx) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-100">
                          {idx + 1}. {item.label}
                        </span>
                        <span className="font-mono font-semibold text-violet-300">
                          {dataset.currencySymbol}
                          {item.value.toLocaleString('tr-TR')}{' '}
                          <span className="text-zinc-500 text-[11px]">
                            (%{item.sharePercent})
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${Math.min(100, item.sharePercent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: DATA TABLE & SEARCH */}
            {activeTab === 'table' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tabloda filtrele (Bölge, Kategori, Sektör...)"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Satır
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96 rounded-xl border border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        {allColumns.map((col) => (
                          <th key={col} className="px-2.5 py-2 font-medium">
                            {col}
                          </th>
                        ))}
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {filteredRows.slice(0, 25).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-zinc-900/50">
                          {allColumns.map((col) => (
                            <td key={col} className="px-2 py-1.5">
                              <input
                                type={typeof row[col] === 'number' ? 'number' : 'text'}
                                value={row[col]}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const val =
                                    typeof row[col] === 'number'
                                      ? Number(raw) || 0
                                      : raw;
                                  setDataset((prev) => ({
                                    ...prev,
                                    rows: prev.rows.map((item, idx) =>
                                      idx === rIdx ? { ...item, [col]: val } : item
                                    ),
                                  }));
                                }}
                                className="w-full min-w-[72px] bg-transparent border-b border-transparent focus:border-violet-500 focus:outline-none text-xs text-zinc-200"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-right">
                            <button
                              onClick={() =>
                                setDataset((prev) => ({
                                  ...prev,
                                  rows: prev.rows.filter((_, idx) => idx !== rIdx),
                                }))
                              }
                              className="text-zinc-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: STATISTICS & ANOMALIES */}
            {activeTab === 'anomalies' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Dashboard Rapor Başlığı
                  </label>
                  <input
                    type="text"
                    value={dataset.title}
                    onChange={(e) =>
                      setDataset((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Medyan ({metricKey})</div>
                    <div className="text-sm font-mono font-bold text-zinc-100 mt-0.5">
                      {dataset.currencySymbol}
                      {metricStats.median.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">Standart Sapma (σ)</div>
                    <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                      ±{metricStats.stdDev.toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">
                    Otomatik Z-Score Uç Değer / Anomali Tespiti (|Z| ≥ 1.45)
                  </div>
                  {metricStats.anomalies.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                      Seçili metrikte aşırı uç değer (anomali) tespit edilmedi; dağılım dengeli.
                    </div>
                  ) : (
                    metricStats.anomalies.map((an, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-amber-200">
                            Satır #{an.rowIndex} ({an.label})
                          </span>
                          <div className="text-[11px] text-zinc-400">
                            Ortalamadan {an.zScore}σ sapma gösterdi
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-300">
                          {dataset.currencySymbol}
                          {an.value.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live 4K Executive BI Dashboard Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı 4K Yönetici BI Dashboard Önizlemesi (1400 × 880 px)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.06).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-zinc-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(0.85, +(z + 0.06).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-4 overflow-auto flex justify-center items-center min-h-[540px] corpus-card-glow"
          >
            <div
              style={{
                width: 1400 * zoom,
                height: 880 * zoom,
              }}
              className="relative shadow-2xl rounded-xl overflow-hidden border border-zinc-800"
            >
              <canvas
                ref={dashboardCanvasRef}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#121216] border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <MonitorDown className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Corpus BI Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız Veri Analizi & Pivot Stüdyosu</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Excel (.XLSX), CSV ve JSON dosyalarını sunucusuz yerel analiz eder</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Çok sayfalı Excel Pivot raporu ve 4K PNG Dashboard çıktısı</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 text-xs text-zinc-300"
              >
                Kapat
              </button>
              <button
                onClick={handleDownloadDesktopLauncher}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
              >
                .BAT Masaüstü Başlatıcı İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Corpus Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] py-3.5 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              %100 İstemci Taraflı SheetJS & BI Motoru — Finansal Excel tablolarınız cihazınızdan dışarı çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #015 • Tableau / Power BI / Rows Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
