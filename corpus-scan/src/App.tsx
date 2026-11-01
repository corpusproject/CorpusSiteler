import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ScanLine,
  UploadCloud,
  Camera,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RotateCw,
  Sliders,
  Eye,
  Trash2,
  MonitorDown,
  Lock,
  X,
  Wand2,
  Languages,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

import {
  type ScanFilterMode,
  type OcrLanguage,
  type ScanEnhancementOptions,
  type ScannedPageItem,
  DEFAULT_SCAN_OPTIONS,
  processScanImage,
  createScanPageFromImageFile,
  createScanPagesFromPdfFile,
  runNeuralOcrOnPage,
  extractSmartEntities,
  exportScanAndOcrToPdf,
  exportOcrToWordDoc,
  exportOcrToExcel,
  createDemoScannedInvoicePage,
} from './utils/scanEngine';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function triggerConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#8b5cf6', '#10b981', '#a78bfa', '#34d399'],
    });
  } catch {
    // ignore
  }
}

function downloadUint8Array(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function App() {
  // Pages & Selection
  const [pages, setPages] = useState<ScannedPageItem[]>([]);
  const [activePageId, setActivePageId] = useState<string>('');
  const [ocrLang, setOcrLang] = useState<OcrLanguage>('tur+eng');

  // OCR Status
  const [isScanningOcr, setIsScanningOcr] = useState<boolean>(false);
  const [ocrStatusLabel, setOcrStatusLabel] = useState<string>('');
  const [ocrProgressPct, setOcrProgressPct] = useState<number>(0);

  // UI Toggles
  const [showWordBoxes, setShowWordBoxes] = useState<boolean>(true);
  const [showOriginalCompare, setShowOriginalCompare] = useState<boolean>(false);
  const [rightTab, setRightTab] = useState<'text' | 'entities'>('text');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Camera Modal
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // PWA / Desktop Installer
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notify = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0] || null;

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for Ctrl+V Clipboard Image Paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const page = await createScanPageFromImageFile(file);
            setPages((prev) => [...prev, page]);
            setActivePageId(page.id);
            notify('Panodaki ekran görüntüsü tarayıcıya yapıştırıldı!');
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [notify]);

  // -------------------------------------------------------------------------
  // Upload Images or Scanned PDFs
  // -------------------------------------------------------------------------

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    notify('Belgeler taranıyor ve CamScanner filtresi uygulanıyor...');
    const newItems: ScannedPageItem[] = [];

    for (const file of Array.from(fileList)) {
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        const pdfPages = await createScanPagesFromPdfFile(file);
        newItems.push(...pdfPages);
      } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name)) {
        const imgPage = await createScanPageFromImageFile(file);
        newItems.push(imgPage);
      }
    }

    if (newItems.length > 0) {
      setPages((prev) => [...prev, ...newItems]);
      setActivePageId(newItems[0].id);
      notify(`${newItems.length} belge sayfası başarıyla yüklendi.`);
    }
  };

  // Load 1-Click Demo Invoice Scan & Auto-Run OCR
  const handleLoadDemoAndOcr = async () => {
    notify('Örnek taranmış Türkçe fatura oluşturuluyor...');
    const demoPage = await createDemoScannedInvoicePage();
    setPages([demoPage]);
    setActivePageId(demoPage.id);

    // Automatically run OCR on the demo page so user sees immediate magic
    setIsScanningOcr(true);
    try {
      const res = await runNeuralOcrOnPage(demoPage, ocrLang, (label, pct) => {
        setOcrStatusLabel(label);
        setOcrProgressPct(pct);
      });
      setPages((prev) =>
        prev.map((p) =>
          p.id === demoPage.id
            ? {
                ...p,
                ocrText: res.text,
                ocrConfidence: res.confidence,
                wordBoxes: res.wordBoxes,
                entities: res.entities,
                isOcrDone: true,
              }
            : p
        )
      );
      triggerConfetti();
      notify(`OCR tamamlandı! %${res.confidence} doğrulukla ${res.entities.length} akıllı veri ayıklandı.`);
    } finally {
      setIsScanningOcr(false);
    }
  };

  // -------------------------------------------------------------------------
  // Update CamScanner Filter / Deskew / Crop Options for Active Page
  // -------------------------------------------------------------------------

  const handleUpdateScanOptions = async (partial: Partial<ScanEnhancementOptions>) => {
    if (!activePage) return;
    const nextOptions: ScanEnhancementOptions = {
      ...activePage.options,
      ...partial,
    };

    const processed = await processScanImage(activePage.originalDataUrl, nextOptions);
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              options: nextOptions,
              enhancedDataUrl: processed.dataUrl,
              width: processed.width,
              height: processed.height,
            }
          : p
      )
    );
  };

  // -------------------------------------------------------------------------
  // Run Neural OCR (Single Page or All Pages)
  // -------------------------------------------------------------------------

  const handleRunOcrSingle = async (targetPage: ScannedPageItem) => {
    if (isScanningOcr) return;
    setIsScanningOcr(true);
    setOcrProgressPct(0);
    setOcrStatusLabel('Sinir Ağı OCR Başlatılıyor...');

    try {
      const res = await runNeuralOcrOnPage(targetPage, ocrLang, (label, pct) => {
        setOcrStatusLabel(label);
        setOcrProgressPct(pct);
      });

      setPages((prev) =>
        prev.map((p) =>
          p.id === targetPage.id
            ? {
                ...p,
                ocrText: res.text,
                ocrConfidence: res.confidence,
                wordBoxes: res.wordBoxes,
                entities: res.entities,
                isOcrDone: true,
              }
            : p
        )
      );
      triggerConfetti();
      notify(`Sayfa metni %${res.confidence} doğrulukla okundu!`);
    } catch (err) {
      notify(`OCR Hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleRunOcrAllPages = async () => {
    if (isScanningOcr || pages.length === 0) return;
    setIsScanningOcr(true);

    try {
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        setActivePageId(p.id);
        const res = await runNeuralOcrOnPage(p, ocrLang, (label, pct) => {
          setOcrStatusLabel(`Sayfa ${i + 1}/${pages.length}: ${label}`);
          setOcrProgressPct(pct);
        });

        setPages((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? {
                  ...item,
                  ocrText: res.text,
                  ocrConfidence: res.confidence,
                  wordBoxes: res.wordBoxes,
                  entities: res.entities,
                  isOcrDone: true,
                }
              : item
          )
        );
      }
      triggerConfetti();
      notify(`Tüm sayfalar (${pages.length} sayfa) başarıyla metne dönüştürüldü!`);
    } finally {
      setIsScanningOcr(false);
    }
  };

  // -------------------------------------------------------------------------
  // Camera Document Scanner
  // -------------------------------------------------------------------------

  const openCameraScanner = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      notify('Kamera erişimi reddedildi veya cihazda kamera bulunamadı.');
      setShowCameraModal(false);
    }
  };

  const closeCameraScanner = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const handleCaptureCameraFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const originalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    closeCameraScanner();

    const processed = await processScanImage(originalDataUrl, DEFAULT_SCAN_OPTIONS);
    const newPage: ScannedPageItem = {
      id: `cam-${Date.now()}`,
      name: `Kamera-Tarama-${pages.length + 1}.jpg`,
      originalDataUrl,
      enhancedDataUrl: processed.dataUrl,
      width: processed.width,
      height: processed.height,
      options: { ...DEFAULT_SCAN_OPTIONS },
      ocrText: '',
      ocrConfidence: null,
      wordBoxes: [],
      entities: [],
      isOcrDone: false,
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    notify('Kameradan belge yakalandı ve CamScanner filtresi uygulandı!');
  };

  // -------------------------------------------------------------------------
  // Desktop App Installer
  // -------------------------------------------------------------------------

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallModal(false);
        triggerConfetti();
        notify('Corpus Scan & OCR Pro cihazınıza kuruldu!');
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleDownloadDesktopLauncher = () => {
    const appUrl = window.location.origin;
    const batContent = `@echo off
title Corpus Scan & OCR Pro (#003)
start "" msedge --app="${appUrl}" 2>nul || start "" chrome --app="${appUrl}" 2>nul || start "" "${appUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Scan-OCR-Masaustu-Uygulamasi.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerConfetti();
    notify('Masaüstü başlatıcısı (.bat) indirildi!');
  };

  const wordCount = activePage?.ocrText.trim()
    ? activePage.ocrText.trim().split(/\s+/).length
    : 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col justify-between relative selection:bg-violet-500/30 corpus-grid-bg">
      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[380px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.16), rgba(16, 185, 129, 0.04), transparent)',
        }}
      />

      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-xl bg-zinc-900/95 border border-violet-500/40 px-4 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-100">{statusToast}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* CORPUS UNIFIED HEADER (#003)                                        */}
      {/* =================================================================== */}
      <header className="relative z-20 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-zinc-900 border border-violet-500/40 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.45)]">
              <ScanLine className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 text-sm sm:text-base">
                Corpus
              </span>
              <span className="text-zinc-600 font-light">/</span>
              <span className="font-medium text-zinc-300 text-sm sm:text-base">Scan & OCR</span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-violet-300 border border-violet-500/30">
              #003 PRO
            </span>
          </div>

          {/* Center OCR Language Selector & Quick Camera Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <Languages className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-zinc-400 hidden md:inline">OCR Dili:</span>
              <select
                value={ocrLang}
                onChange={(e) => setOcrLang(e.target.value as OcrLanguage)}
                className="bg-transparent text-zinc-100 font-medium focus:outline-none cursor-pointer"
              >
                <option value="tur+eng" className="bg-zinc-900">
                  Türkçe + İngilizce (Çift Dil)
                </option>
                <option value="tur" className="bg-zinc-900">
                  Türkçe (tur)
                </option>
                <option value="eng" className="bg-zinc-900">
                  English (eng)
                </option>
                <option value="deu" className="bg-zinc-900">
                  Deutsch (deu)
                </option>
                <option value="fra" className="bg-zinc-900">
                  Français (fra)
                </option>
                <option value="spa" className="bg-zinc-900">
                  Español (spa)
                </option>
                <option value="ara" className="bg-zinc-900">
                  العربية (ara)
                </option>
                <option value="rus" className="bg-zinc-900">
                  Русский (rus)
                </option>
              </select>
            </div>

            <button
              onClick={openCameraScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Kamerayla Tara</span>
            </button>
          </div>

          {/* Right Security Badge + Install CTA */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3 h-3 text-violet-400" />
              <span className="font-medium text-[11px]">Neural OCR • Zero Cloud Upload</span>
            </div>

            <button
              onClick={handleTriggerInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-medium transition-all cursor-pointer"
            >
              <MonitorDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Uygulamayı İndir</span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN WORKSPACE                                                      */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {pages.length === 0 ? (
          /* =============================================================== */
          /* EMPTY STATE — DROP IMAGE/PDF, CAMERA, CTRL+V, OR 1-CLICK DEMO   */
          /* =============================================================== */
          <div className="my-auto max-w-2xl w-full mx-auto">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-medium mb-3">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>ABBYY FineReader + CamScanner Pro Sınıfı Belge Stüdyosu</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
                Görselden & Taranmış PDF'den Metin Okuma (OCR)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                Telefonla çekilmiş eğri/gölgeli belge fotoğraflarını lazer netliğinde beyazlatın,
                Türkçe/İngilizce metinleri, IBAN ve tabloları Word, Excel veya PDF olarak çıkarın.
              </p>
            </div>

            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-6 sm:p-8 corpus-card-glow space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className="group cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-950/60 hover:bg-zinc-900/50 p-10 text-center transition-all"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7 text-violet-400" />
                </div>
                <p className="text-base font-medium text-zinc-100">
                  Görsel (`JPG, PNG, WebP`) veya Taranmış `PDF` sürükleyin ya da{' '}
                  <span className="text-violet-400 underline">cihazdan seçin</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1.5">
                  İpucu: Ekran görüntüsü alıp doğrudan <code className="text-zinc-300">Ctrl+V</code>{' '}
                  ile yapıştırabilirsiniz!
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                    CamScanner Magic Filter
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                    Türkçe + İngilizce Sinir Ağı OCR
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                    Word / Excel / PDF Çıktısı
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                <div className="text-xs text-zinc-400">
                  Hemen test etmek için örnek gölgeli Türkçe fatura taramasını yükleyin:
                </div>
                <button
                  onClick={handleLoadDemoAndOcr}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Örnek Fatura Yükle & OCR Çalıştır (Demo)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =============================================================== */
          /* SPLIT STUDIO: LEFT CAMSCANNER LAB + RIGHT ABBYY OCR WORKBENCH   */
          /* =============================================================== */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ------------------------------------------------------------- */}
            {/* LEFT PANE (7 COLS): CAMSCANNER PRO VISUAL ENHANCER & VIEWPORT */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-7 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 corpus-card-glow flex flex-col overflow-hidden">
              {/* Top Filter & Page Bar */}
              <div className="p-3 sm:px-4 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400 mr-1" />
                  {(
                    [
                      { id: 'magic', label: 'Sihirli Renk (CamScanner)' },
                      { id: 'bw', label: 'Siyah-Beyaz Lazer' },
                      { id: 'bleach', label: 'Gölge Silici' },
                      { id: 'grayscale', label: 'Gri Arşiv' },
                      { id: 'original', label: 'Orijinal' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleUpdateScanOptions({ filter: f.id as ScanFilterMode })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activePage?.options.filter === f.id
                          ? 'bg-violet-600 text-white shadow'
                          : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      handleUpdateScanOptions({
                        rotation: ((activePage?.options.rotation || 0) + 90) % 360,
                      })
                    }
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs cursor-pointer"
                    title="90° Döndür"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onMouseDown={() => setShowOriginalCompare(true)}
                    onMouseUp={() => setShowOriginalCompare(false)}
                    onMouseLeave={() => setShowOriginalCompare(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs cursor-pointer"
                    title="Basılı tutarak orijinal fotoğraf ile karşılaştırın"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Orijinali Gör</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
                  >
                    + Sayfa Ekle
                  </button>
                </div>
              </div>

              {/* Fine Deskew, Crop & Contrast Sliders */}
              {activePage && (
                <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/75 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <div className="flex justify-between text-zinc-400 font-mono mb-1">
                      <span>EĞRİLİK (DESKEW)</span>
                      <span className="text-violet-300">{activePage.options.deskewAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={activePage.options.deskewAngle}
                      onChange={(e) =>
                        handleUpdateScanOptions({ deskewAngle: Number(e.target.value) })
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 font-mono mb-1">
                      <span>KENAR KIRPMA</span>
                      <span className="text-violet-300">%{activePage.options.cropMargin}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={activePage.options.cropMargin}
                      onChange={(e) =>
                        handleUpdateScanOptions({ cropMargin: Number(e.target.value) })
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 font-mono mb-1">
                      <span>KONTRAST</span>
                      <span className="text-violet-300">{activePage.options.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={50}
                      value={activePage.options.contrast}
                      onChange={(e) =>
                        handleUpdateScanOptions({ contrast: Number(e.target.value) })
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 font-mono mb-1">
                      <span>S/B KESKİNLİK</span>
                      <span className="text-violet-300">{activePage.options.threshold}</span>
                    </div>
                    <input
                      type="range"
                      min={90}
                      max={215}
                      value={activePage.options.threshold}
                      onChange={(e) =>
                        handleUpdateScanOptions({ threshold: Number(e.target.value) })
                      }
                      className="w-full accent-violet-500"
                    />
                  </div>
                </div>
              )}

              {/* Center Document Viewport with Laser Beam & Word Bounding Boxes */}
              <div className="flex-1 bg-[#0b0b0e] p-4 sm:p-6 flex items-center justify-center overflow-auto max-h-[540px]">
                {activePage && (
                  <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                    <img
                      src={
                        showOriginalCompare
                          ? activePage.originalDataUrl
                          : activePage.enhancedDataUrl
                      }
                      alt={activePage.name}
                      className="max-h-[470px] w-auto object-contain block select-none"
                    />

                    {/* Animated Laser Scan Beam during OCR */}
                    {isScanningOcr && (
                      <div
                        className="pointer-events-none absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_24px_4px_rgba(139,92,246,0.9)] animate-scan-beam"
                      />
                    )}

                    {/* Recognized Word Bounding Boxes Overlay */}
                    {showWordBoxes &&
                      !showOriginalCompare &&
                      activePage.wordBoxes.map((wb, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            navigator.clipboard.writeText(wb.text);
                            notify(`"${wb.text}" kopyalandı (%${wb.confidence} güven).`);
                          }}
                          title={`"${wb.text}" (%${wb.confidence}) — Kopyalamak için tıklayın`}
                          className="absolute border border-emerald-500/45 bg-emerald-500/10 hover:bg-violet-500/35 hover:border-violet-400 transition-colors cursor-pointer"
                          style={{
                            left: `${wb.x0 * 100}%`,
                            top: `${wb.y0 * 100}%`,
                            width: `${Math.max(1, (wb.x1 - wb.x0) * 100)}%`,
                            height: `${Math.max(1, (wb.y1 - wb.y0) * 100)}%`,
                          }}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Bottom Multi-Page Thumbnail Strip */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {pages.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePageId(p.id)}
                      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer shrink-0 ${
                        p.id === activePage?.id
                          ? 'bg-violet-500/15 border-violet-500 text-violet-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="font-mono text-[11px]">#{idx + 1}</span>
                      <span className="max-w-[110px] truncate">{p.name}</span>
                      {p.isOcrDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const remaining = pages.filter((item) => item.id !== p.id);
                            setPages(remaining);
                            if (activePageId === p.id && remaining[0]) {
                              setActivePageId(remaining[0].id);
                            }
                          }}
                          className="text-zinc-500 hover:text-rose-400 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showWordBoxes}
                    onChange={(e) => setShowWordBoxes(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Kelime Kutuları</span>
                </label>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT PANE (5 COLS): ABBYY FINEREADER OCR & EXPORT WORKBENCH  */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-5 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 corpus-card-glow flex flex-col overflow-hidden">
              {/* Top OCR Action Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activePage && handleRunOcrSingle(activePage)}
                    disabled={isScanningOcr || !activePage}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-[0_0_20px_-4px_rgba(139,92,246,0.7)] transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isScanningOcr ? 'OCR Okunuyor...' : 'OCR Metni Oku'}</span>
                  </button>

                  {pages.length > 1 && (
                    <button
                      onClick={handleRunOcrAllPages}
                      disabled={isScanningOcr}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      <span>Tümünü Oku ({pages.length})</span>
                    </button>
                  )}
                </div>

                {activePage?.ocrConfidence !== null && activePage?.ocrConfidence !== undefined && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold">
                    Doğruluk: %{activePage.ocrConfidence}
                  </span>
                )}
              </div>

              {/* Live OCR Progress Bar */}
              {isScanningOcr && (
                <div className="px-4 py-3 bg-violet-500/10 border-b border-violet-500/25 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-violet-200 font-medium">{ocrStatusLabel}</span>
                    <span className="font-mono text-violet-300 font-semibold">
                      %{ocrProgressPct}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${ocrProgressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sub-navigation: Extracted Text vs Smart Entities */}
              <div className="px-4 pt-3 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRightTab('text')}
                    className={`pb-2.5 px-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                      rightTab === 'text'
                        ? 'border-violet-500 text-zinc-100'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Düzenlenebilir OCR Metni ({wordCount} kelime)
                  </button>
                  <button
                    onClick={() => setRightTab('entities')}
                    className={`pb-2.5 px-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                      rightTab === 'entities'
                        ? 'border-emerald-500 text-emerald-300'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Akıllı Veriler ({activePage?.entities.length || 0})
                  </button>
                </div>

                {activePage?.ocrText && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activePage.ocrText);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                      notify('OCR metni panoya kopyalandı!');
                    }}
                    className="mb-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Metni Kopyala</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Center Editor / Smart Entities Area */}
              <div className="flex-1 p-4 flex flex-col min-h-[340px]">
                {rightTab === 'text' ? (
                  <textarea
                    value={activePage?.ocrText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPages((prev) =>
                        prev.map((p) =>
                          p.id === activePage?.id
                            ? {
                                ...p,
                                ocrText: val,
                                entities: extractSmartEntities(val),
                              }
                            : p
                        )
                      );
                    }}
                    placeholder='Belge üzerindeki metinleri okumak için yukarıdaki "OCR Metni Oku" butonuna tıklayın veya buraya doğrudan not ekleyin...'
                    className="w-full flex-1 bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-4 text-xs sm:text-sm font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-violet-500/60 resize-none"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2.5">
                    {!activePage || activePage.entities.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
                        <Sliders className="w-7 h-7 text-zinc-600 mb-2" />
                        <p>
                          OCR çalıştırıldığında belgedeki IBAN, Tutar, Tarih, Telefon ve Belge
                          Numaraları otomatik olarak burada listelenir.
                        </p>
                      </div>
                    ) : (
                      activePage.entities.map((ent, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 font-mono text-[10px] font-semibold">
                              {ent.category}
                            </span>
                            <p className="text-xs font-mono text-zinc-100 mt-1 truncate">
                              {ent.value}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ent.value);
                              notify(`${ent.category} kopyalandı: ${ent.value}`);
                            }}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Export Suite (Word .DOC, Searchable/Scanned .PDF, Excel .XLSX) */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 space-y-2.5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Dışa Aktar (Word, PDF, Excel)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      exportOcrToWordDoc(pages, 'Corpus-OCR-Metin.doc');
                      triggerConfetti();
                      notify('Word belgesi (.doc) indirildi!');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word İndir (.doc)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportOcrToExcel(pages, 'Corpus-OCR-Tablo.xlsx');
                      triggerConfetti();
                      notify('Excel tablosu (.xlsx) indirildi!');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel İndir (.xlsx)</span>
                  </button>

                  <button
                    onClick={async () => {
                      const bytes = await exportScanAndOcrToPdf(pages, 'both');
                      downloadUint8Array(bytes, 'Corpus-Tarama-ve-OCR.pdf');
                      triggerConfetti();
                      notify('Taranmış Belge + OCR Raporu PDF olarak indirildi!');
                    }}
                    className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF İndir (.pdf)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL 1: CAMERA DOCUMENT SCANNER                                    */}
      {/* =================================================================== */}
      {showCameraModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeCameraScanner}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#121216] border border-zinc-800 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                Canlı Kamera ile Belge Tarayıcı
              </h3>
              <button
                onClick={closeCameraScanner}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-zinc-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-xl" />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={closeCameraScanner}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleCaptureCameraFrame}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Belgeyi Çek ve Filtrele</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: DESKTOP & MOBILE APP INSTALLER                             */}
      {/* =================================================================== */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#121216] border border-zinc-800 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <MonitorDown className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Corpus Scan & OCR Masaüstü Kurulumu
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    ABBYY FineReader & CamScanner Masaüstü Deneyimi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Tek Tıkla Masaüstü Başlatıcısı (.bat) İndir</span>
                </p>
                <p className="text-zinc-400">
                  Bağımsız masaüstü uygulaması penceresinde açmak için başlatıcıyı indirin:
                </p>
                <button
                  onClick={handleDownloadDesktopLauncher}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Corpus Scan & OCR Masaüstü Uygulamasını İndir (.bat)</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <p className="font-semibold text-violet-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  <span>Tarayıcıdan PWA Olarak Sabitle</span>
                </p>
                <p className="text-zinc-400">
                  Adres çubuğunun sağındaki uygulama yükleme simgesine tıklayarak cihazınıza kalıcı
                  olarak kurabilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CORPUS UNIFIED FOOTER (#003)                                        */}
      {/* =================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900/90 py-4 px-4 sm:px-6 text-center">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Corpus Platform</span>
            <span>•</span>
            <span>Site #003 of 100 — Corpus Scan & OCR Studio Pro</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Neural OCR (TR/EN) • CamScanner Filters • Word / Excel / PDF Export
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
