import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Image as ImageIcon,
  Minimize2,
  Sliders,
  Stamp,
  UserCheck,
  Upload,
  Download,
  FolderArchive,
  Trash2,
  Sparkles,
  ShieldCheck,
  MonitorDown,
  RotateCcw,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_WATERMARK,
  type BatchImageItem,
  type OutputImageFormat,
  type AspectCropPreset,
  type ImageAdjustments,
  type WatermarkConfig,
  createSampleStudioImage,
  processImageWithStudioPipeline,
  renderBiometricSheetToCanvas,
  exportBatchImagesAsZip,
  exportBiometricCanvasToPdf,
  formatBytes,
} from './utils/imageEngine';

type StudioTab = 'compressor' | 'color-crop' | 'watermark' | 'biometric-sheet';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('compressor');
  const [items, setItems] = useState<BatchImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  // Compression & Format Settings
  const [outputFormat, setOutputFormat] = useState<OutputImageFormat>('image/webp');
  const [quality, setQuality] = useState<number>(0.78);
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [cropPreset, setCropPreset] = useState<AspectCropPreset>('free');

  // Lightroom Adjustments & Watermark
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [watermark, setWatermark] = useState<WatermarkConfig>(DEFAULT_WATERMARK);
  const [compareSplit, setCompareSplit] = useState<number>(50);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const biometricCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial sample studio image
  useEffect(() => {
    let mounted = true;
    createSampleStudioImage().then((sample) => {
      if (!mounted) return;
      setItems([sample]);
      setSelectedId(sample.id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Re-process all images whenever pipeline parameters change
  useEffect(() => {
    if (items.length === 0) return;
    let active = true;

    const runPipeline = async () => {
      const updated: BatchImageItem[] = [];
      for (const item of items) {
        const res = await processImageWithStudioPipeline(item, {
          format: outputFormat,
          quality,
          scalePercent,
          cropPreset,
          adjustments,
          watermark,
        });
        updated.push(res);
      }
      if (active) {
        setItems(updated);
      }
    };

    runPipeline();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputFormat, quality, scalePercent, cropPreset, adjustments, watermark, items.length]);

  const activeItem = useMemo(
    () => items.find((i) => i.id === selectedId) || items[0] || null,
    [items, selectedId]
  );

  // Update Biometric 8-up sheet canvas when activeItem changes or tab is biometric-sheet
  useEffect(() => {
    if (activeTab === 'biometric-sheet' && activeItem && biometricCanvasRef.current) {
      const src = activeItem.processedDataUrl || activeItem.originalDataUrl;
      renderBiometricSheetToCanvas(biometricCanvasRef.current, src);
    }
  }, [activeTab, activeItem]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newItems: BatchImageItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.onerror = () => resolve({ w: 800, h: 600 });
        img.src = dataUrl;
      });

      const rawItem: BatchImageItem = {
        id: `img-${Date.now()}-${i}`,
        name: file.name,
        originalSize: file.size,
        originalWidth: dims.w,
        originalHeight: dims.h,
        originalDataUrl: dataUrl,
        processedBlob: null,
        processedDataUrl: null,
        processedSize: file.size,
        processedWidth: dims.w,
        processedHeight: dims.h,
        exifStripped: true,
      };

      const processed = await processImageWithStudioPipeline(rawItem, {
        format: outputFormat,
        quality,
        scalePercent,
        cropPreset,
        adjustments,
        watermark,
      });
      newItems.push(processed);
    }

    if (newItems.length > 0) {
      setItems((prev) => [...newItems, ...prev]);
      setSelectedId(newItems[0].id);
    }
  };

  // Savings calculation
  const savingsStats = useMemo(() => {
    const totalOrig = items.reduce((acc, i) => acc + i.originalSize, 0);
    const totalProc = items.reduce((acc, i) => acc + (i.processedSize || i.originalSize), 0);
    const savedBytes = Math.max(0, totalOrig - totalProc);
    const savedPct = totalOrig > 0 ? Math.round((savedBytes / totalOrig) * 100) : 0;
    return { totalOrig, totalProc, savedBytes, savedPct };
  }, [items]);

  const handleDownloadSingle = (item: BatchImageItem) => {
    const url = item.processedDataUrl || item.originalDataUrl;
    const ext =
      outputFormat === 'image/webp' ? 'webp' : outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = item.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}-corpus.${ext}`;
    a.click();
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadAllZip = async () => {
    await exportBatchImagesAsZip(items, outputFormat);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleDownloadBiometricPng = () => {
    if (!biometricCanvasRef.current) return;
    const url = biometricCanvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corpus-8li-biyometrik-vesikalik-300dpi.png';
    a.click();
    confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Image, Photo & Compression Studio Pro (#010)',
      'echo Corpus Image Studio Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5182',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Image-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <ImageIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Image & Photo Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #010 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Toplu Görsel Sıkıştırma (WebP/JPEG), EXIF Temizleyici, Lightroom Renk & Biyometrik Vesikalık Stüdyosu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Tasarruf: -{savingsStats.savedPct}% ({formatBytes(savingsStats.savedBytes)} kazanıldı)
              </span>
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

      {/* Top Studio Mode Bar */}
      <div className="border-b border-zinc-800/70 bg-[#111114]/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'compressor', label: 'Toplu Sıkıştırma & WebP/JPG', icon: Minimize2 },
                { id: 'color-crop', label: 'Renk, Işık & Kırpma (Lightroom)', icon: Sliders },
                { id: 'watermark', label: 'Güvenlik Filigranı & Damga', icon: Stamp },
                { id: 'biometric-sheet', label: '8\'li Biyometrik / Vesikalık Şablonu', icon: UserCheck },
              ] as { id: StudioTab; label: string; icon: typeof Minimize2 }[]
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-violet-400" />
              <span>Görsel Ekle (Çoklu)</span>
            </button>
            <button
              onClick={handleDownloadAllZip}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/25 flex items-center gap-1.5 cursor-pointer"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Tümünü ZIP İndir ({items.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Batch Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Control Panel Card */}
          <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl p-5 corpus-card-glow space-y-5">
            {/* TAB 1: COMPRESSOR CONTROLS */}
            {activeTab === 'compressor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Sıkıştırma, Çıktı Formatı & EXIF Gizlilik Motoru
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    ✓ EXIF & GPS Silindi
                  </span>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Hedef Görsel Formatı</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'image/webp', label: 'WebP (Önerilen %85 Küçük)' },
                        { id: 'image/jpeg', label: 'JPEG (Standart Foto)' },
                        { id: 'image/png', label: 'PNG (Şeffaf / Kayıpsız)' },
                      ] as { id: OutputImageFormat; label: string }[]
                    ).map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setOutputFormat(fmt.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-medium border cursor-pointer ${
                          outputFormat === fmt.id
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Sıkıştırma Kalitesi</span>
                    <span className="font-mono font-bold text-violet-400">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.15}
                    max={0.98}
                    step={0.02}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>

                {/* Resolution Scale */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Çözünürlük Ölçeklendirme (Resize)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((sc) => (
                      <button
                        key={sc}
                        onClick={() => setScalePercent(sc)}
                        className={`py-1.5 rounded-xl text-xs font-mono border cursor-pointer ${
                          scalePercent === sc
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        %{sc} Boyut
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COLOR GRADING & CROP */}
            {activeTab === 'color-crop' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Lightroom Renk Kalibrasyonu & Kırpma Oranı
                  </h3>
                  <button
                    onClick={() => {
                      setAdjustments(DEFAULT_ADJUSTMENTS);
                      setCropPreset('free');
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Sıfırla
                  </button>
                </div>

                {/* Aspect Ratio Presets */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Kırpma Oranı (Aspect Ratio)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'free', label: 'Orijinal' },
                        { id: '1:1', label: '1:1 Kare (Profil)' },
                        { id: '16:9', label: '16:9 Sinematik' },
                        { id: '4:5', label: '4:5 Instagram' },
                        { id: 'biometric-50x60', label: '50x60 Biyometrik' },
                      ] as { id: AspectCropPreset; label: string }[]
                    ).map((cp) => (
                      <button
                        key={cp.id}
                        onClick={() => setCropPreset(cp.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer ${
                          cropPreset === cp.id
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {cp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick LUT Presets */}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tek Tıkla Hazır Renk Profilleri (LUT)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        setAdjustments({
                          brightness: 108,
                          contrast: 118,
                          saturation: 132,
                          sepia: 0,
                          blur: 0,
                        })
                      }
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
                    >
                      ✨ Canlı HDR
                    </button>
                    <button
                      onClick={() =>
                        setAdjustments({
                          brightness: 102,
                          contrast: 125,
                          saturation: 0,
                          sepia: 0,
                          blur: 0,
                        })
                      }
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
                    >
                      🎬 B&W Noir
                    </button>
                    <button
                      onClick={() =>
                        setAdjustments({
                          brightness: 105,
                          contrast: 108,
                          saturation: 112,
                          sepia: 28,
                          blur: 0,
                        })
                      }
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
                    >
                      🎞️ Sıcak Film
                    </button>
                  </div>
                </div>

                {/* Sliders */}
                {(
                  [
                    { key: 'brightness', label: 'Parlaklık (Brightness)', min: 50, max: 150 },
                    { key: 'contrast', label: 'Kontrast (Contrast)', min: 50, max: 150 },
                    { key: 'saturation', label: 'Canlılık / Doygunluk', min: 0, max: 200 },
                    { key: 'sepia', label: 'Sıcaklık / Sepia', min: 0, max: 100 },
                  ] as { key: keyof ImageAdjustments; label: string; min: number; max: number }[]
                ).map((sl) => (
                  <div key={sl.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{sl.label}</span>
                      <span className="font-mono text-violet-400">{adjustments[sl.key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={sl.min}
                      max={sl.max}
                      value={adjustments[sl.key]}
                      onChange={(e) =>
                        setAdjustments((p) => ({ ...p, [sl.key]: Number(e.target.value) }))
                      }
                      className="w-full accent-violet-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: SECURITY WATERMARK STUDIO */}
            {activeTab === 'watermark' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Telif & Kimlik Güvenlik Filigranı (Watermark)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Kimlik, tapu veya özel fotoğraflarınızın başka amaçla kullanılmasını önleyin.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watermark.enabled}
                      onChange={(e) =>
                        setWatermark((p) => ({ ...p, enabled: e.target.checked }))
                      }
                      className="accent-violet-500 w-4 h-4"
                    />
                    <span>Filigran Aktif</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setWatermark({
                        enabled: true,
                        text: 'SADECE RESMİ BAŞVURU İÇİNDİR • BAŞKA AMAÇLA KULLANILAMAZ',
                        mode: 'diagonal-tiled',
                        opacity: 0.32,
                        color: '#ffffff',
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs cursor-pointer"
                  >
                    🛡️ Kimlik / Tapu Güvenlik Damgası Uygula
                  </button>
                  <button
                    onClick={() =>
                      setWatermark({
                        enabled: true,
                        text: '© 2026 CORPUS STUDIO • TÜM HAKLARI SAKLIDIR',
                        mode: 'bottom-right',
                        opacity: 0.75,
                        color: '#ffffff',
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs cursor-pointer"
                  >
                    📸 Sağ Alt Telif Logosu
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Filigran Metni</label>
                  <input
                    type="text"
                    value={watermark.text}
                    onChange={(e) =>
                      setWatermark((p) => ({ ...p, text: e.target.value, enabled: true }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Filigran Saydamlığı (Opacity)</span>
                    <span className="font-mono text-violet-400">
                      {Math.round(watermark.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={watermark.opacity}
                    onChange={(e) =>
                      setWatermark((p) => ({ ...p, opacity: Number(e.target.value) }))
                    }
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: BIOMETRIC PASSPORT SHEET */}
            {activeTab === 'biometric-sheet' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>8'li Biyometrik / Vesikalık Baskı Şablonu (50x60mm)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Seçili fotoğrafınızı ICAO standartlarında <strong>50x60 mm Biyometrik / Pasaport / Vize / Ehliyet</strong> ölçüsünde ortalayarak tek bir 10x15cm (300 DPI) kart üzerine 8 adet kesim çizgili olarak dizer.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDownloadBiometricPng}
                    className="py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    8'li Baskı Kartı İndir (.PNG)
                  </button>
                  <button
                    onClick={() =>
                      biometricCanvasRef.current &&
                      exportBiometricCanvasToPdf(biometricCanvasRef.current)
                    }
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    A4 Yazıcı PDF İndir (.PDF)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Batch Queue List */}
          <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl p-4 corpus-card-glow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                İşlenen Görsel Kuyruğu ({items.length})
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-violet-400 hover:underline cursor-pointer"
              >
                + Yeni Görseller Ekle
              </button>
            </div>

            <div className="space-y-2 max-h-[34vh] overflow-y-auto pr-1">
              {items.map((item) => {
                const saved =
                  item.originalSize > 0
                    ? Math.round(
                        ((item.originalSize - (item.processedSize || item.originalSize)) /
                          item.originalSize) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      activeItem?.id === item.id
                        ? 'bg-violet-500/10 border-violet-500/40'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.processedDataUrl || item.originalDataUrl}
                        alt={item.name}
                        className="w-11 h-11 rounded-lg object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {formatBytes(item.originalSize)} →{' '}
                          <span className="text-emerald-400 font-semibold">
                            {formatBytes(item.processedSize)}
                          </span>{' '}
                          {saved > 0 && <span className="text-emerald-400">(-%{saved})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingle(item);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                      >
                        İndir
                      </button>
                      {items.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems((p) => p.filter((x) => x.id !== item.id));
                          }}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Before/After Studio Viewport or Biometric Sheet (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111114] border border-zinc-800/80 rounded-2xl p-5 corpus-card-glow space-y-4">
          {activeTab === 'biometric-sheet' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>8'li Biyometrik / Vesikalık Baskı Önizlemesi (10x15cm • 300 DPI)</span>
                <span className="font-mono text-emerald-400">ICAO 50x60mm Standart</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex justify-center overflow-auto">
                <canvas
                  ref={biometricCanvasRef}
                  className="max-w-full h-auto rounded shadow-2xl bg-white"
                />
              </div>
            </div>
          ) : (
            activeItem && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-medium text-zinc-200">{activeItem.name}</span>
                    <span className="font-mono text-zinc-400">
                      ({activeItem.processedWidth}×{activeItem.processedHeight} px)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">Önce / Sonra Karşılaştırma Perdesi:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={compareSplit}
                      onChange={(e) => setCompareSplit(Number(e.target.value))}
                      className="w-28 accent-violet-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Split Before/After Viewport */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-[66vh] flex items-center justify-center select-none">
                  <img
                    src={activeItem.processedDataUrl || activeItem.originalDataUrl}
                    alt="Processed"
                    className="max-h-[64vh] w-auto object-contain block"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-zinc-700 text-[11px] font-mono text-zinc-300">
                    Orijinal: {formatBytes(activeItem.originalSize)}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-950/85 backdrop-blur-sm border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                    Corpus Çıktısı: {formatBytes(activeItem.processedSize)}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Desktop App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                Corpus Image Studio Masaüstü Kurulumu
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Corpus Image & Photo Studio'yu bağımsız masaüstü uygulaması olarak çalıştırmak için başlatıcıyı indirin:
            </p>
            <button
              onClick={handleDownloadDesktopLauncher}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
            >
              Windows Masaüstü Başlatıcısını İndir (.bat)
            </button>
          </div>
        </div>
      )}

      {/* Unified Corpus Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-xs text-zinc-500 flex flex-wrap items-center justify-between max-w-[1600px] w-full mx-auto gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Corpus Platform • <strong>#010 Corpus Image, Photo & Batch Compression Studio Pro</strong> — Fotoğraflarınız cihazınızdan dışarı çıkmaz.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">
          WebP/JPEG Batch DSP • EXIF Stripper • 8-Up Biometric Sheet
        </span>
      </footer>
    </div>
  );
}
