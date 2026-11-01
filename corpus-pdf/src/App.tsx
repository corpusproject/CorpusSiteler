import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Image as ImageIcon,
  Presentation,
  Table2,
  Layers,
  Type,
  Highlighter,
  EyeOff,
  Eraser,
  PenTool,
  Feather,
  Stamp,
  ImagePlus,
  RotateCw,
  Trash2,
  PlusSquare,
  Download,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
  X,
  Lock,
  MonitorDown,
  MousePointer,
  FilePlus2,
  Scissors,
  FileSpreadsheet,
  Sliders,
  ArrowRight,
  Undo2,
} from 'lucide-react';

import {
  type ToolMode,
  type PdfAnnotation,
  type PageConfig,
  type WatermarkSettings,
  type PdfMetadataSettings,
  loadPdfDocumentPages,
  renderSinglePageToCanvas,
  exportEditedPdf,
  createSampleWelcomePdf,
} from './utils/pdfEngine';

import {
  type ImageItem,
  type ImageToPdfOptions,
  type ParsedWordDoc,
  type ParsedSlide,
  type SlideTheme,
  type ParsedSheet,
  fileToImageItem,
  convertImagesToPdf,
  parseWordFile,
  convertWordToPdf,
  parsePowerPointFile,
  convertSlidesToPdf,
  parseSpreadsheetFile,
  convertSpreadsheetToPdf,
  mergeMultiplePdfs,
  extractPdfPageRange,
  renderPdfToImagesZip,
} from './utils/officeConverters';

// ---------------------------------------------------------------------------
// Workspace Module Tabs
// ---------------------------------------------------------------------------

type StudioTab =
  | 'editor'
  | 'img2pdf'
  | 'word2pdf'
  | 'ppt2pdf'
  | 'excel2pdf'
  | 'toolkit';

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

function downloadUint8Array(bytes: Uint8Array, filename: string, mime = 'application/pdf') {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------------------------------------------------------------------------
// Main App Component
// ---------------------------------------------------------------------------

export function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('editor');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // PWA / Desktop App Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // =========================================================================
  // 1. ACROBAT PRO EDITOR STATE
  // =========================================================================
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('Corpus-Belge.pdf');
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [activePageId, setActivePageId] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1.25);
  const [tool, setTool] = useState<ToolMode>('select');
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Tool Styling Options
  const [activeColor, setActiveColor] = useState<string>('#8b5cf6');
  const [fontSize, setFontSize] = useState<number>(18);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [activeStamp, setActiveStamp] = useState<PdfAnnotation['stampType']>('ONAYLANDI');

  // Watermark & Metadata
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    enabled: false,
    text: 'CORPUS GİZLİ / CONFIDENTIAL',
    opacity: 0.16,
    color: '#8b5cf6',
    size: 46,
  });
  const [metadata, setMetadata] = useState<PdfMetadataSettings>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
  });
  const [showDocSettingsModal, setShowDocSettingsModal] = useState<boolean>(false);

  // Signature Pad Modal State
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [sigTab, setSigTab] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState<string>('Kemal Corpus');
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSigRef = useRef<boolean>(false);

  // Main Page Canvas & Interactive Drawing Refs
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvasPixelSize, setCanvasPixelSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 848,
  });
  const isDrawingOnPageRef = useRef<boolean>(false);
  const currentDrawIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingAnnRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const imageAnnotationInputRef = useRef<HTMLInputElement | null>(null);
  const editorFileInputRef = useRef<HTMLInputElement | null>(null);

  // =========================================================================
  // 2. CONVERTERS STATE (Images, Word, PPTX, Excel, Merge/Split)
  // =========================================================================

  // Images -> PDF
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [imgOptions, setImgOptions] = useState<ImageToPdfOptions>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'small',
  });

  // Word -> PDF
  const [parsedWord, setParsedWord] = useState<ParsedWordDoc | null>(null);

  // PowerPoint -> PDF
  const [parsedSlides, setParsedSlides] = useState<ParsedSlide[]>([]);
  const [pptFileName, setPptFileName] = useState<string>('Sunum');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('corpus-dark');

  // Excel -> PDF
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [excelFileName, setExcelFileName] = useState<string>('Tablo');

  // Toolkit (Merge / Split / PDF to Images)
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitRange, setSplitRange] = useState<string>('1-2');
  const [pdfToImgFile, setPdfToImgFile] = useState<File | null>(null);
  const [pdfImgPreviews, setPdfImgPreviews] = useState<string[]>([]);

  // Toast helper
  const notify = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load PDF bytes into Acrobat Editor
  const openPdfBytesInEditor = useCallback(
    async (bytes: Uint8Array, name: string) => {
      setIsProcessing(true);
      try {
        const { pages: loadedPages, metadata: loadedMeta } = await loadPdfDocumentPages(bytes);
        setPdfBytes(bytes);
        setPdfFileName(name.endsWith('.pdf') ? name : `${name}.pdf`);
        setPages(loadedPages);
        setActivePageId(loadedPages[0]?.id || '');
        setAnnotations([]);
        setSelectedAnnotationId(null);
        setMetadata(loadedMeta);
        setActiveTab('editor');
        notify(`${name} Acrobat Editörde açıldı (${loadedPages.length} sayfa).`);
      } catch (err) {
        notify(
          `PDF okunamadı: ${err instanceof Error ? err.message : 'Geçersiz PDF dosyası'}`
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [notify]
  );

  // Load Demo PDF on user request
  const handleLoadDemoPdf = async () => {
    setIsProcessing(true);
    try {
      const sampleBytes = await createSampleWelcomePdf();
      await openPdfBytesInEditor(sampleBytes, 'Corpus-Acrobat-Demo-Sozlesme.pdf');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render active page onto main canvas whenever activePageId, zoom, or rotation changes
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  useEffect(() => {
    let cancelled = false;
    async function renderPage() {
      if (!pdfBytes || !activePage || !pageCanvasRef.current) return;
      try {
        const dims = await renderSinglePageToCanvas(
          pdfBytes,
          activePage,
          pageCanvasRef.current,
          zoom
        );
        if (!cancelled) {
          setCanvasPixelSize({ width: Math.round(dims.width), height: Math.round(dims.height) });
        }
      } catch {
        // ignore render cancellation
      }
    }
    renderPage();
    return () => {
      cancelled = true;
    };
  }, [pdfBytes, activePage, zoom]);

  // =========================================================================
  // ACROBAT EDITOR INTERACTIVE HANDLERS
  // =========================================================================

  const getNormalizedCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayContainerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePage) return;
    // Ignore if clicking directly on an annotation control
    if ((e.target as HTMLElement).closest('[data-ann-box="true"]')) {
      return;
    }

    const { x, y } = getNormalizedCoords(e);

    if (tool === 'select') {
      setSelectedAnnotationId(null);
      return;
    }

    if (tool === 'text') {
      const newAnn: PdfAnnotation = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'text',
        x: Math.min(0.82, x),
        y: Math.min(0.92, y),
        width: 0.28,
        height: 0.05,
        text: 'Yeni Metin (Düzenlemek için yazın)',
        fontSize,
        color: activeColor,
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedAnnotationId(newAnn.id);
      setTool('select');
      return;
    }

    if (tool === 'stamp') {
      const stampColors: Record<string, string> = {
        ONAYLANDI: '#10b981',
        GİZLİ: '#f43f5e',
        TASLAK: '#f59e0b',
        ACİL: '#ef4444',
        İMZALANDI: '#8b5cf6',
      };
      const st = activeStamp || 'ONAYLANDI';
      const newAnn: PdfAnnotation = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'stamp',
        x: Math.max(0.02, Math.min(0.75, x - 0.1)),
        y: Math.max(0.02, Math.min(0.9, y - 0.03)),
        width: 0.24,
        height: 0.06,
        stampType: st,
        text: st,
        color: stampColors[st] || '#10b981',
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedAnnotationId(newAnn.id);
      setTool('select');
      return;
    }

    if (tool === 'signature') {
      setShowSignatureModal(true);
      return;
    }

    if (tool === 'image') {
      imageAnnotationInputRef.current?.click();
      return;
    }

    if (tool === 'draw') {
      const id = `ann-${Date.now()}`;
      currentDrawIdRef.current = id;
      isDrawingOnPageRef.current = true;
      const newAnn: PdfAnnotation = {
        id,
        pageId: activePage.id,
        type: 'draw',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        color: activeColor,
        strokeWidth,
        points: [{ x, y }],
      };
      setAnnotations((prev) => [...prev, newAnn]);
      return;
    }

    if (tool === 'highlight' || tool === 'redact' || tool === 'whiteout') {
      const id = `ann-${Date.now()}`;
      currentDrawIdRef.current = id;
      isDrawingOnPageRef.current = true;
      dragStartRef.current = { x, y };
      const newAnn: PdfAnnotation = {
        id,
        pageId: activePage.id,
        type: tool,
        x,
        y,
        width: 0.01,
        height: 0.02,
        color: tool === 'highlight' ? '#facc15' : tool === 'redact' ? '#09090b' : '#ffffff',
        opacity: tool === 'highlight' ? 0.4 : 1,
      };
      setAnnotations((prev) => [...prev, newAnn]);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getNormalizedCoords(e);

    // Dragging an existing annotation
    if (draggingAnnRef.current) {
      const { id, offsetX, offsetY } = draggingAnnRef.current;
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                x: Math.max(0, Math.min(0.95, x - offsetX)),
                y: Math.max(0, Math.min(0.95, y - offsetY)),
              }
            : a
        )
      );
      return;
    }

    if (!isDrawingOnPageRef.current || !currentDrawIdRef.current) return;
    const activeId = currentDrawIdRef.current;

    if (tool === 'draw') {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === activeId
            ? { ...a, points: [...(a.points || []), { x, y }] }
            : a
        )
      );
    } else if (
      (tool === 'highlight' || tool === 'redact' || tool === 'whiteout') &&
      dragStartRef.current
    ) {
      const sx = dragStartRef.current.x;
      const sy = dragStartRef.current.y;
      const rx = Math.min(sx, x);
      const ry = Math.min(sy, y);
      const rw = Math.max(0.02, Math.abs(x - sx));
      const rh = Math.max(0.015, Math.abs(y - sy));

      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === activeId ? { ...a, x: rx, y: ry, width: rw, height: rh } : a
        )
      );
    }
  };

  const handleOverlayMouseUp = () => {
    isDrawingOnPageRef.current = false;
    currentDrawIdRef.current = null;
    dragStartRef.current = null;
    draggingAnnRef.current = null;
  };

  // Signature Pad Handlers
  const clearSignaturePad = () => {
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, c.width, c.height);
    }
  };

  const handleSigMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = sigCanvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext('2d');
    if (!ctx) return;
    isDrawingSigRef.current = true;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleSigMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSigRef.current || !sigCanvasRef.current) return;
    const rect = sigCanvasRef.current.getBoundingClientRect();
    const ctx = sigCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleSigMouseUp = () => {
    isDrawingSigRef.current = false;
  };

  const handleInsertSignature = () => {
    if (!activePage) return;
    let dataUrl = '';

    if (sigTab === 'draw' && sigCanvasRef.current) {
      dataUrl = sigCanvasRef.current.toDataURL('image/png');
    } else {
      const c = document.createElement('canvas');
      c.width = 420;
      c.height = 130;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'italic 600 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature || 'Corpus Imza', 210, 65);
      dataUrl = c.toDataURL('image/png');
    }

    const newAnn: PdfAnnotation = {
      id: `ann-${Date.now()}`,
      pageId: activePage.id,
      type: 'signature',
      x: 0.12,
      y: 0.72,
      width: 0.28,
      height: 0.09,
      color: '#111827',
      imageDataUrl: dataUrl,
    };

    setAnnotations((prev) => [...prev, newAnn]);
    setSelectedAnnotationId(newAnn.id);
    setShowSignatureModal(false);
    setTool('select');
    notify('İmza sayfaya eklendi. Sürükleyerek istediğiniz yere taşıyabilirsiniz.');
  };

  const handleImageAnnotationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePage) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newAnn: PdfAnnotation = {
        id: `ann-${Date.now()}`,
        pageId: activePage.id,
        type: 'image',
        x: 0.2,
        y: 0.25,
        width: 0.3,
        height: 0.22,
        color: '#8b5cf6',
        imageDataUrl: reader.result as string,
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedAnnotationId(newAnn.id);
      setTool('select');
      notify('Görsel sayfaya eklendi.');
    };
    reader.readAsDataURL(file);
  };

  // Page Operations (Rotate, Reorder, Delete, Insert Blank)
  const handleRotatePage = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleMovePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    const copy = [...pages];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setPages(copy);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      notify('Belgede en az 1 sayfa bulunmalıdır.');
      return;
    }
    const filtered = pages.filter((p) => p.id !== pageId);
    setPages(filtered);
    if (activePageId === pageId) {
      setActivePageId(filtered[0].id);
    }
  };

  const handleInsertBlankPage = () => {
    const newPage: PageConfig = {
      id: `blank-${Date.now()}`,
      sourcePageIndex: null,
      rotation: 0,
      width: 595.28,
      height: 841.89,
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    notify('Yeni boş A4 sayfası eklendi.');
  };

  const handleExportFinalPdf = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const finalBytes = await exportEditedPdf(
        pdfBytes,
        pages,
        annotations,
        watermark,
        metadata
      );
      const outName = pdfFileName.replace(/\.pdf$/i, '') + '-duzenlendi.pdf';
      downloadUint8Array(finalBytes, outName);
      triggerConfetti();
      notify(`${outName} başarıyla indirildi!`);
    } catch (err) {
      notify(`PDF dışa aktarma hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================================================================
  // CONVERTER HANDLERS
  // =========================================================================

  // 1. Images -> PDF
  const handleAddImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const items: ImageItem[] = [];
      for (const f of Array.from(files)) {
        if (f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(f.name)) {
          items.push(await fileToImageItem(f));
        }
      }
      setImageItems((prev) => [...prev, ...items]);
      notify(`${items.length} görsel listeye eklendi.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportImagesPdf = async (openInEditorAfter = false) => {
    if (imageItems.length === 0) return;
    setIsProcessing(true);
    try {
      const bytes = await convertImagesToPdf(imageItems, imgOptions);
      if (openInEditorAfter) {
        await openPdfBytesInEditor(bytes, 'Gorsellerden-Olusturulan.pdf');
      } else {
        downloadUint8Array(bytes, 'Corpus-Gorseller.pdf');
        triggerConfetti();
        notify('Görseller PDF olarak indirildi!');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Word -> PDF
  const handleWordUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const parsed = await parseWordFile(file);
      setParsedWord(parsed);
      notify(`${file.name} analiz edildi (${parsed.wordCount} kelime).`);
    } catch {
      notify('Word dosyası okunamadı.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportWordPdf = async (openInEditorAfter = false) => {
    if (!parsedWord) return;
    setIsProcessing(true);
    try {
      const bytes = await convertWordToPdf(parsedWord);
      const outName = parsedWord.fileName.replace(/\.[^.]+$/, '') + '.pdf';
      if (openInEditorAfter) {
        await openPdfBytesInEditor(bytes, outName);
      } else {
        downloadUint8Array(bytes, outName);
        triggerConfetti();
        notify(`${outName} başarıyla oluşturuldu!`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. PowerPoint -> PDF
  const handlePptUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const slides = await parsePowerPointFile(file);
      setParsedSlides(slides);
      setPptFileName(file.name.replace(/\.[^.]+$/, ''));
      notify(`${file.name} yüklendi (${slides.length} slayt ayıklandı).`);
    } catch {
      notify('Sunum dosyası okunamadı.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPptPdf = async (openInEditorAfter = false) => {
    if (parsedSlides.length === 0) return;
    setIsProcessing(true);
    try {
      const bytes = await convertSlidesToPdf(parsedSlides, slideTheme, pptFileName);
      const outName = `${pptFileName}-Sunum.pdf`;
      if (openInEditorAfter) {
        await openPdfBytesInEditor(bytes, outName);
      } else {
        downloadUint8Array(bytes, outName);
        triggerConfetti();
        notify(`${outName} 16:9 geniş ekran PDF olarak indirildi!`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Excel / CSV -> PDF
  const handleExcelUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const sheets = await parseSpreadsheetFile(file);
      setParsedSheets(sheets);
      setActiveSheetIdx(0);
      setExcelFileName(file.name.replace(/\.[^.]+$/, ''));
      notify(`${file.name} yüklendi (${sheets.length} çalışma sayfası).`);
    } catch {
      notify('Tablo dosyası okunamadı.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcelPdf = async (openInEditorAfter = false) => {
    const sheet = parsedSheets[activeSheetIdx];
    if (!sheet) return;
    setIsProcessing(true);
    try {
      const bytes = await convertSpreadsheetToPdf(sheet, excelFileName);
      const outName = `${excelFileName}-${sheet.name}.pdf`;
      if (openInEditorAfter) {
        await openPdfBytesInEditor(bytes, outName);
      } else {
        downloadUint8Array(bytes, outName);
        triggerConfetti();
        notify(`${outName} yatay A4 tablo PDF olarak indirildi!`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Desktop Launcher Generator (Portable .HTML / PWA Installer)
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallModal(false);
        triggerConfetti();
        notify('Corpus PDF Studio cihazınıza uygulama olarak kuruldu!');
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleDownloadDesktopShortcut = () => {
    const appUrl = window.location.origin;
    const batContent = `@echo off
title Corpus PDF Studio Pro (#002)
start "" msedge --app="${appUrl}" 2>nul || start "" chrome --app="${appUrl}" 2>nul || start "" "${appUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    downloadBlob(blob, 'Corpus-PDF-Studio-Masaustu-Uygulamasi.bat');
    triggerConfetti();
    notify('Masaüstü başlatıcısı (.bat) indirildi! Çift tıklayarak bağımsız uygulama penceresinde açabilirsiniz.');
  };

  const activePageAnnotations = annotations.filter((a) => a.pageId === activePage?.id);
  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) || null;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col justify-between relative selection:bg-violet-500/30 corpus-grid-bg">
      {/* Ambient Violet/Emerald Glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[380px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.16), rgba(16, 185, 129, 0.04), transparent)',
        }}
      />

      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-xl bg-zinc-900/95 border border-violet-500/40 px-4 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-100">{statusToast}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* CORPUS UNIFIED HEADER (#002)                                        */}
      {/* =================================================================== */}
      <header className="relative z-20 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-zinc-900 border border-violet-500/40 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.45)]">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 text-sm sm:text-base">
                Corpus
              </span>
              <span className="text-zinc-600 font-light">/</span>
              <span className="font-medium text-zinc-300 text-sm sm:text-base">PDF Studio</span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-violet-300 border border-violet-500/30">
              #002 PRO
            </span>
          </div>

          {/* Center Suite Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800/90">
            {(
              [
                { id: 'editor', label: 'Acrobat PDF Editör', icon: PenTool },
                { id: 'img2pdf', label: 'Görsel → PDF', icon: ImageIcon },
                { id: 'word2pdf', label: 'Word → PDF', icon: FileText },
                { id: 'ppt2pdf', label: 'Sunum → PDF', icon: Presentation },
                { id: 'excel2pdf', label: 'Tablo → PDF', icon: Table2 },
                { id: 'toolkit', label: 'Birleştir & Böl', icon: Layers },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow-[0_0_16px_-3px_rgba(139,92,246,0.65)]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Security Badge + Install Desktop App CTA */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3 h-3 text-violet-400" />
              <span className="font-medium text-[11px]">100% Free Pro • Zero Server Upload</span>
            </div>

            <button
              onClick={handleTriggerInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-medium transition-all cursor-pointer"
              title="Bilgisayarınıza veya Telefonunuza Uygulama Olarak İndirin"
            >
              <MonitorDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Uygulamayı İndir</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-zinc-800/60 bg-zinc-950/70">
          {(
            [
              { id: 'editor', label: 'PDF Editör', icon: PenTool },
              { id: 'img2pdf', label: 'Görsel→PDF', icon: ImageIcon },
              { id: 'word2pdf', label: 'Word→PDF', icon: FileText },
              { id: 'ppt2pdf', label: 'Sunum→PDF', icon: Presentation },
              { id: 'excel2pdf', label: 'Tablo→PDF', icon: Table2 },
              { id: 'toolkit', label: 'Birleştir/Böl', icon: Layers },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN STUDIO CONTENT AREA                                            */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* ================================================================= */}
        {/* TAB 1: ADOBE ACROBAT PRO-CLASS PDF EDITOR                         */}
        {/* ================================================================= */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col gap-4">
            {!pdfBytes ? (
              /* Empty State — Drop a PDF or Load Sample Acrobat Demo */
              <div className="my-auto max-w-2xl w-full mx-auto">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-medium mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Adobe Acrobat Pro Sınıfı Tarayıcı İçi PDF Stüdyosu</span>
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
                    PDF Düzenle, İmzala, Karart ve Yönet
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                    Metin ekleyin, gizli bilgileri karartın (Redact), ıslak imza çizin, damga/filigran
                    basın veya sayfaları döndürüp sıralayın.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-6 sm:p-8 corpus-card-glow space-y-5">
                  <input
                    ref={editorFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const buf = await f.arrayBuffer();
                        await openPdfBytesInEditor(new Uint8Array(buf), f.name);
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => editorFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) {
                        const buf = await f.arrayBuffer();
                        await openPdfBytesInEditor(new Uint8Array(buf), f.name);
                      }
                    }}
                    className="group cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-950/60 hover:bg-zinc-900/50 p-10 text-center transition-all"
                  >
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-7 h-7 text-violet-400" />
                    </div>
                    <p className="text-base font-medium text-zinc-100">
                      Düzenlemek istediğiniz PDF dosyasını sürükleyin veya{' '}
                      <span className="text-violet-400 underline">cihazdan seçin</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1.5">
                      Dosyanız hiçbir sunucuya yüklenmez • 100% RAM içinde işlenir
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                    <div className="text-xs text-zinc-400">
                      Hemen denemek için örnek 2 sayfalık sözleşme PDF'ini açabilirsiniz:
                    </div>
                    <button
                      onClick={handleLoadDemoPdf}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Örnek PDF Aç (Acrobat Demo)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Acrobat Pro Studio Interface */
              <div className="flex-1 flex flex-col rounded-2xl bg-[#111114]/95 border border-zinc-800/90 corpus-card-glow overflow-hidden">
                {/* Top Acrobat Ribbon Toolbar */}
                <div className="px-3 sm:px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/70 flex flex-wrap items-center justify-between gap-2">
                  {/* Tool Selection Buttons */}
                  <div className="flex items-center flex-wrap gap-1">
                    {(
                      [
                        { mode: 'select', label: 'Seç / Taşı', icon: MousePointer },
                        { mode: 'text', label: 'Metin Ekle', icon: Type },
                        { mode: 'highlight', label: 'Vurgula', icon: Highlighter },
                        { mode: 'whiteout', label: 'Beyazlat (Silgi)', icon: Eraser },
                        { mode: 'redact', label: 'Karart (Sansür)', icon: EyeOff },
                        { mode: 'draw', label: 'Kalem Çizim', icon: PenTool },
                        { mode: 'signature', label: 'İmza Ekle', icon: Feather },
                        { mode: 'stamp', label: 'Damga Bas', icon: Stamp },
                        { mode: 'image', label: 'Görsel Ekle', icon: ImagePlus },
                      ] as const
                    ).map((t) => {
                      const Icon = t.icon;
                      const isActive = tool === t.mode;
                      return (
                        <button
                          key={t.mode}
                          onClick={() => {
                            if (t.mode === 'signature') {
                              setShowSignatureModal(true);
                            } else if (t.mode === 'image') {
                              imageAnnotationInputRef.current?.click();
                            } else {
                              setTool(t.mode);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-violet-600 text-white shadow-[0_0_15px_-3px_rgba(139,92,246,0.7)]'
                              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                    <input
                      ref={imageAnnotationInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageAnnotationUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Right Actions: Undo, Watermark/Meta, New File, Export PDF */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setAnnotations((prev) => prev.slice(0, -1));
                        setSelectedAnnotationId(null);
                      }}
                      disabled={annotations.length === 0}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs cursor-pointer"
                      title="Son İşlemi Geri Al"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShowDocSettingsModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-violet-400" />
                      <span className="hidden sm:inline">Filigran & Meta</span>
                    </button>

                    <button
                      onClick={() => {
                        setPdfBytes(null);
                        setPages([]);
                        setAnnotations([]);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 cursor-pointer"
                    >
                      Kapat
                    </button>

                    <button
                      onClick={handleExportFinalPdf}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-[0_0_20px_-4px_rgba(16,185,129,0.6)] transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'İşleniyor...' : 'PDF İndir'}</span>
                    </button>
                  </div>
                </div>

                {/* Secondary Context Property Bar (Color, Font Size, Stamp Type, Zoom) */}
                <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center flex-wrap gap-3">
                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Renk:</span>
                      {['#111827', '#8b5cf6', '#10b981', '#ef4444', '#2563eb', '#f59e0b'].map(
                        (col) => (
                          <button
                            key={col}
                            onClick={() => {
                              setActiveColor(col);
                              if (selectedAnnotationId) {
                                setAnnotations((prev) =>
                                  prev.map((a) =>
                                    a.id === selectedAnnotationId ? { ...a, color: col } : a
                                  )
                                );
                              }
                            }}
                            className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                              activeColor === col
                                ? 'scale-125 border-white'
                                : 'border-zinc-700 opacity-80'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        )
                      )}
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Boyut:</span>
                      <select
                        value={fontSize}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFontSize(val);
                          if (selectedAnnotationId) {
                            setAnnotations((prev) =>
                              prev.map((a) =>
                                a.id === selectedAnnotationId ? { ...a, fontSize: val } : a
                              )
                            );
                          }
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-200"
                      >
                        {[12, 14, 16, 18, 22, 28, 36].map((sz) => (
                          <option key={sz} value={sz}>
                            {sz} px
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stamp Type Selector */}
                    {tool === 'stamp' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">Damga:</span>
                        {(
                          ['ONAYLANDI', 'GİZLİ', 'TASLAK', 'ACİL', 'İMZALANDI'] as const
                        ).map((st) => (
                          <button
                            key={st}
                            onClick={() => setActiveStamp(st)}
                            className={`px-2 py-0.5 rounded font-mono text-[11px] border cursor-pointer ${
                              activeStamp === st
                                ? 'bg-violet-500/20 border-violet-500 text-violet-200'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Stroke Width */}
                    {tool === 'draw' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">Kalınlık:</span>
                        <input
                          type="range"
                          min={1}
                          max={12}
                          value={strokeWidth}
                          onChange={(e) => setStrokeWidth(Number(e.target.value))}
                          className="w-20 accent-violet-500"
                        />
                      </div>
                    )}

                    {/* Selected Annotation Editor Controls */}
                    {selectedAnnotation && (
                      <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                        {selectedAnnotation.type === 'text' && (
                          <input
                            type="text"
                            value={selectedAnnotation.text || ''}
                            onChange={(e) =>
                              setAnnotations((prev) =>
                                prev.map((a) =>
                                  a.id === selectedAnnotation.id
                                    ? { ...a, text: e.target.value }
                                    : a
                                )
                              )
                            }
                            className="bg-zinc-900 border border-violet-500/50 rounded px-2.5 py-1 text-xs text-zinc-100 w-56"
                            placeholder="Metni düzenleyin..."
                          />
                        )}
                        <button
                          onClick={() => {
                            setAnnotations((prev) =>
                              prev.filter((a) => a.id !== selectedAnnotation.id)
                            );
                            setSelectedAnnotationId(null);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Sil</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-zinc-300">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)))}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Split Workspace: Left Page Thumbnails + Center Interactive Canvas */}
                <div className="flex-1 flex min-h-[620px] max-h-[76vh] overflow-hidden">
                  {/* Left Sidebar: Page Organizer */}
                  <aside className="w-48 sm:w-56 border-r border-zinc-800/90 bg-zinc-950/60 flex flex-col">
                    <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Sayfalar ({pages.length})
                      </span>
                      <button
                        onClick={handleInsertBlankPage}
                        className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                        title="Boş A4 Sayfası Ekle"
                      >
                        <PlusSquare className="w-3.5 h-3.5" />
                        <span>Boş Ekle</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {pages.map((p, idx) => {
                        const isCurrent = p.id === activePage?.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setActivePageId(p.id)}
                            className={`group rounded-xl p-2 border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-violet-500/15 border-violet-500/60'
                                : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="relative bg-white rounded-lg overflow-hidden aspect-[1/1.41] flex items-center justify-center mb-2">
                              {p.thumbnailDataUrl ? (
                                <img
                                  src={p.thumbnailDataUrl}
                                  alt={`Sayfa ${idx + 1}`}
                                  className="w-full h-full object-contain transition-transform"
                                  style={{ transform: `rotate(${p.rotation}deg)` }}
                                />
                              ) : (
                                <span className="text-[11px] font-mono text-zinc-400">
                                  Boş A4 Sayfası
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-zinc-300 text-[11px]">
                                #{idx + 1}
                              </span>
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleRotatePage(p.id)}
                                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                                  title="90° Döndür"
                                >
                                  <RotateCw className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMovePage(idx, -1)}
                                  disabled={idx === 0}
                                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                                  title="Yukarı Taşı"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMovePage(idx, 1)}
                                  disabled={idx === pages.length - 1}
                                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                                  title="Aşağı Taşı"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeletePage(p.id)}
                                  className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                                  title="Sayfayı Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </aside>

                  {/* Center Interactive PDF Page Viewport */}
                  <div className="flex-1 overflow-auto bg-[#0c0c10] p-6 flex items-start justify-center">
                    <div
                      ref={overlayContainerRef}
                      onMouseDown={handleOverlayMouseDown}
                      onMouseMove={handleOverlayMouseMove}
                      onMouseUp={handleOverlayMouseUp}
                      className={`relative shadow-2xl select-none bg-white ${
                        tool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                      style={{
                        width: canvasPixelSize.width,
                        height: canvasPixelSize.height,
                      }}
                    >
                      {/* Underlying PDF.js Rendered Canvas */}
                      <canvas ref={pageCanvasRef} className="block w-full h-full" />

                      {/* Watermark Live Preview */}
                      {watermark.enabled && watermark.text.trim() && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                          <span
                            className="font-bold tracking-widest uppercase whitespace-nowrap"
                            style={{
                              transform: 'rotate(-35deg)',
                              opacity: watermark.opacity,
                              color: watermark.color,
                              fontSize: `${watermark.size * zoom}px`,
                            }}
                          >
                            {watermark.text}
                          </span>
                        </div>
                      )}

                      {/* SVG Layer for Freehand Drawings */}
                      <svg className="pointer-events-none absolute inset-0 w-full h-full">
                        {activePageAnnotations
                          .filter((a) => a.type === 'draw' && a.points && a.points.length > 1)
                          .map((a) => {
                            const d = a
                              .points!.map(
                                (pt, idx) =>
                                  `${idx === 0 ? 'M' : 'L'} ${pt.x * canvasPixelSize.width} ${
                                    pt.y * canvasPixelSize.height
                                  }`
                              )
                              .join(' ');
                            return (
                              <path
                                key={a.id}
                                d={d}
                                fill="none"
                                stroke={a.color}
                                strokeWidth={(a.strokeWidth || 3) * zoom}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            );
                          })}
                      </svg>

                      {/* Interactive Box Annotations (Text, Highlight, Redact, Whiteout, Signature, Stamp, Image) */}
                      {activePageAnnotations
                        .filter((a) => a.type !== 'draw')
                        .map((ann) => {
                          const isSelected = ann.id === selectedAnnotationId;
                          const left = ann.x * canvasPixelSize.width;
                          const top = ann.y * canvasPixelSize.height;
                          const width = ann.width * canvasPixelSize.width;
                          const height = ann.height * canvasPixelSize.height;

                          return (
                            <div
                              key={ann.id}
                              data-ann-box="true"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedAnnotationId(ann.id);
                                const coords = getNormalizedCoords(e);
                                draggingAnnRef.current = {
                                  id: ann.id,
                                  offsetX: coords.x - ann.x,
                                  offsetY: coords.y - ann.y,
                                };
                              }}
                              className={`absolute group cursor-move ${
                                isSelected
                                  ? 'ring-2 ring-violet-500 ring-offset-1'
                                  : 'hover:ring-1 hover:ring-violet-400/60'
                              }`}
                              style={{
                                left,
                                top,
                                width: ann.type === 'text' ? 'auto' : width,
                                height: ann.type === 'text' ? 'auto' : height,
                                minWidth: 32,
                                minHeight: 20,
                              }}
                            >
                              {ann.type === 'highlight' && (
                                <div
                                  className="w-full h-full"
                                  style={{
                                    backgroundColor: ann.color || '#facc15',
                                    opacity: ann.opacity ?? 0.4,
                                  }}
                                />
                              )}

                              {ann.type === 'redact' && (
                                <div className="w-full h-full bg-[#09090b]" />
                              )}

                              {ann.type === 'whiteout' && (
                                <div className="w-full h-full bg-white border border-zinc-200/60" />
                              )}

                              {ann.type === 'text' && (
                                <div
                                  style={{
                                    color: ann.color,
                                    fontSize: `${(ann.fontSize || 16) * zoom}px`,
                                    fontWeight: 600,
                                  }}
                                  className="px-1.5 py-0.5 whitespace-pre-wrap leading-snug"
                                >
                                  {ann.text}
                                </div>
                              )}

                              {ann.type === 'stamp' && (
                                <div
                                  className="px-3 py-1.5 rounded-md border-2 font-mono font-bold text-center tracking-wider uppercase flex items-center justify-center"
                                  style={{
                                    borderColor: ann.color,
                                    color: ann.color,
                                    backgroundColor: `${ann.color}18`,
                                    fontSize: `${13 * zoom}px`,
                                  }}
                                >
                                  {ann.text || ann.stampType}
                                </div>
                              )}

                              {(ann.type === 'signature' || ann.type === 'image') &&
                                ann.imageDataUrl && (
                                  <img
                                    src={ann.imageDataUrl}
                                    alt="Annotation"
                                    className="w-full h-full object-contain pointer-events-none"
                                  />
                                )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: IMAGES TO PDF (GÖRSELDEN PDF)                              */}
        {/* ================================================================= */}
        {activeTab === 'img2pdf' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-zinc-100">
                Görselden PDF Oluşturucu (JPG, PNG, WebP → PDF)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Birden fazla görseli sürükleyin, sırasını değiştirin, sayfa boyutunu seçip tek tıkla PDF
                yapın.
              </p>
            </div>

            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-6 corpus-card-glow space-y-6">
              {/* Dropzone */}
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-950/60 p-8 text-center transition-all">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddImages(e.target.files)}
                  className="hidden"
                />
                <ImageIcon className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-200">
                  Görselleri buraya bırakın veya <span className="text-violet-400 underline">seçin</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  JPG, PNG, WebP, GIF desteklenir • Sınırsız adet
                </p>
              </label>

              {/* Options Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    SAYFA BOYUTU
                  </label>
                  <select
                    value={imgOptions.pageSize}
                    onChange={(e) =>
                      setImgOptions((o) => ({
                        ...o,
                        pageSize: e.target.value as ImageToPdfOptions['pageSize'],
                      }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                  >
                    <option value="a4">A4 Standart (210 × 297 mm)</option>
                    <option value="letter">US Letter</option>
                    <option value="fit">Görsel Boyutuna Göre (Tam Oturt)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">YÖN</label>
                  <select
                    value={imgOptions.orientation}
                    onChange={(e) =>
                      setImgOptions((o) => ({
                        ...o,
                        orientation: e.target.value as ImageToPdfOptions['orientation'],
                      }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                  >
                    <option value="portrait">Dikey (Portrait)</option>
                    <option value="landscape">Yatay (Landscape)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    KENAR BOŞLUĞU
                  </label>
                  <select
                    value={imgOptions.margin}
                    onChange={(e) =>
                      setImgOptions((o) => ({
                        ...o,
                        margin: e.target.value as ImageToPdfOptions['margin'],
                      }))
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                  >
                    <option value="none">Kenarlıksız (Tam Sayfa)</option>
                    <option value="small">İnce Kenarlık</option>
                    <option value="large">Geniş Kenarlık</option>
                  </select>
                </div>
              </div>

              {/* Image Grid */}
              {imageItems.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {imageItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-zinc-950 border border-zinc-800 p-2 relative group"
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="font-mono text-[11px] text-zinc-400 truncate">
                            #{idx + 1} {item.name}
                          </span>
                          <button
                            onClick={() =>
                              setImageItems((prev) => prev.filter((i) => i.id !== item.id))
                            }
                            className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                    <button
                      onClick={() => handleExportImagesPdf(true)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-violet-400" />
                      <span>PDF Yap ve Acrobat Editörde Aç</span>
                    </button>
                    <button
                      onClick={() => handleExportImagesPdf(false)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF Olarak İndir ({imageItems.length} Sayfa)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: WORD TO PDF (.DOC / .DOCX -> PDF)                          */}
        {/* ================================================================= */}
        {activeTab === 'word2pdf' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-zinc-100">
                Word'den PDF'e Dönüştürücü (.DOCX, .DOC, .TXT → PDF)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Word belgelerinizi başlık, paragraf, liste ve tablo yapısını koruyarak yüksek çözünürlüklü
                A4 PDF'e çevirin.
              </p>
            </div>

            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-6 corpus-card-glow space-y-6">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-950/60 p-8 text-center transition-all">
                <input
                  type="file"
                  accept=".docx,.doc,.txt,.rtf,.md"
                  onChange={(e) => handleWordUpload(e.target.files?.[0])}
                  className="hidden"
                />
                <FileText className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-200">
                  Word belgesini (`.docx` / `.doc`) sürükleyin veya{' '}
                  <span className="text-violet-400 underline">seçin</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Tam Türkçe karakter uyumlu • Mammoth AST + Retina A4 Sayfalayıcı
                </p>
              </label>

              {parsedWord && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{parsedWord.fileName}</p>
                      <p className="text-xs font-mono text-zinc-400">
                        {parsedWord.wordCount} kelime • {parsedWord.blocks.length} metin bloğu hazır
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportWordPdf(true)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-violet-400" />
                        <span>Acrobat Editörde Aç & İmzala</span>
                      </button>
                      <button
                        onClick={() => handleExportWordPdf(false)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Olarak İndir</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="rounded-xl bg-white text-zinc-900 p-6 sm:p-8 max-h-96 overflow-y-auto shadow-inner space-y-2.5">
                    {parsedWord.blocks.slice(0, 40).map((b, i) => (
                      <div
                        key={i}
                        className={
                          b.type === 'h1'
                            ? 'text-xl font-bold text-zinc-950'
                            : b.type === 'h2'
                            ? 'text-lg font-bold text-zinc-900'
                            : b.type === 'li'
                            ? 'text-sm pl-4 text-zinc-800'
                            : 'text-sm text-zinc-700 leading-relaxed'
                        }
                      >
                        {b.type === 'li' ? `• ${b.text}` : b.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: POWERPOINT TO PDF (.PPT / .PPTX -> PDF)                    */}
        {/* ================================================================= */}
        {activeTab === 'ppt2pdf' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-zinc-100">
                Sunumdan PDF'e Dönüştürücü (.PPTX, .PPT → 16:9 PDF)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                PowerPoint sunumlarınızdaki tüm slayt başlıklarını, maddeleri ve gömülü görselleri 16:9
                geniş ekran PDF sunumuna dönüştürün.
              </p>
            </div>

            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-6 corpus-card-glow space-y-6">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-950/60 p-8 text-center transition-all">
                <input
                  type="file"
                  accept=".pptx,.ppt"
                  onChange={(e) => handlePptUpload(e.target.files?.[0])}
                  className="hidden"
                />
                <Presentation className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-200">
                  PowerPoint sunumunu (`.pptx` / `.ppt`) sürükleyin veya{' '}
                  <span className="text-violet-400 underline">seçin</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Slayt XML ve medya görselleri otomatik ayıklanır • 16:9 Full HD PDF çıktısı
                </p>
              </label>

              {parsedSlides.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">Slayt Teması:</span>
                      {(
                        [
                          { id: 'corpus-dark', label: 'Corpus Koyu' },
                          { id: 'executive-violet', label: 'Executive Violet' },
                          { id: 'clean-light', label: 'Klasik Beyaz' },
                        ] as const
                      ).map((th) => (
                        <button
                          key={th.id}
                          onClick={() => setSlideTheme(th.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                            slideTheme === th.id
                              ? 'bg-violet-600 text-white'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {th.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportPptPdf(true)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-violet-400" />
                        <span>Acrobat Editörde Aç</span>
                      </button>
                      <button
                        onClick={() => handleExportPptPdf(false)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Sunumu PDF İndir ({parsedSlides.length} Slayt)</span>
                      </button>
                    </div>
                  </div>

                  {/* Slide Cards Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                    {parsedSlides.map((s) => (
                      <div
                        key={s.slideNumber}
                        className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 font-mono text-[10px]">
                            SLAYT #{s.slideNumber}
                          </span>
                          {s.images.length > 0 && (
                            <span className="text-[10px] font-mono text-emerald-400">
                              {s.images.length} Görsel
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-100">{s.title}</h4>
                        <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                          {s.bullets.slice(0, 4).map((b, idx) => (
                            <li key={idx} className="truncate">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: EXCEL / SPREADSHEET TO PDF (.XLSX / .XLS / .CSV -> PDF)    */}
        {/* ================================================================= */}
        {activeTab === 'excel2pdf' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-zinc-100">
                Tablodan PDF'e Dönüştürücü (.XLSX, .XLS, .CSV → PDF)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Excel ve CSV tablolarınızı otomatik sütun hizalamalı yatay A4 rapor PDF'ine dönüştürün.
              </p>
            </div>

            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-6 corpus-card-glow space-y-6">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-950/60 p-8 text-center transition-all">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleExcelUpload(e.target.files?.[0])}
                  className="hidden"
                />
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-200">
                  Excel veya CSV dosyasını sürükleyin veya{' '}
                  <span className="text-violet-400 underline">seçin</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Çoklu çalışma sayfası (Sheet) desteği • Otomatik tablo ızgarası
                </p>
              </label>

              {parsedSheets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-2">
                      {parsedSheets.map((sh, idx) => (
                        <button
                          key={sh.name}
                          onClick={() => setActiveSheetIdx(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                            activeSheetIdx === idx
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {sh.name} ({sh.rows.length})
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportExcelPdf(true)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-violet-400" />
                        <span>Acrobat Editörde Aç</span>
                      </button>
                      <button
                        onClick={() => handleExportExcelPdf(false)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tabloyu PDF İndir</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Table Preview */}
                  <div className="overflow-x-auto max-h-80 rounded-xl border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody>
                        {parsedSheets[activeSheetIdx]?.rows.slice(0, 20).map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={
                              rIdx === 0
                                ? 'bg-zinc-900 font-semibold text-zinc-100'
                                : 'border-t border-zinc-800/70 text-zinc-300'
                            }
                          >
                            {row.slice(0, 10).map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 truncate max-w-[180px]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: PDF MERGE, SPLIT & PDF-TO-JPG TOOLKIT                      */}
        {/* ================================================================= */}
        {activeTab === 'toolkit' && (
          <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Merge PDFs */}
            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-5 corpus-card-glow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <FilePlus2 className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">PDF Birleştir (Merge)</h3>
                <p className="text-xs text-zinc-400">
                  Birden fazla PDF dosyasını seçtiğiniz sırayla tek bir PDF belgesinde birleştirin.
                </p>

                <label className="block cursor-pointer rounded-xl border border-dashed border-zinc-700 hover:border-violet-500 bg-zinc-950/60 p-4 text-center text-xs text-zinc-300">
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="hidden"
                  />
                  + PDF Dosyaları Ekle ({mergeFiles.length} seçili)
                </label>

                {mergeFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {mergeFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-zinc-900 px-2.5 py-1.5 rounded-lg"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          onClick={() =>
                            setMergeFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-zinc-500 hover:text-rose-400 ml-2 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                disabled={mergeFiles.length < 2 || isProcessing}
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    const merged = await mergeMultiplePdfs(mergeFiles);
                    downloadUint8Array(merged, 'Corpus-Birlestirilmis.pdf');
                    triggerConfetti();
                    notify('PDF dosyaları başarıyla birleştirildi!');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
              >
                Birleştir ve İndir
              </button>
            </div>

            {/* Card 2: Split / Extract Pages */}
            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-5 corpus-card-glow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">PDF Böl / Sayfa Ayıkla</h3>
                <p className="text-xs text-zinc-400">
                  Belirli sayfa aralıklarını (örn. `1-3, 5`) yeni bir PDF olarak ayıklayın.
                </p>

                <label className="block cursor-pointer rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500 bg-zinc-950/60 p-4 text-center text-xs text-zinc-300">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setSplitFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {splitFile ? splitFile.name : '+ PDF Dosyası Seçin'}
                </label>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    SAYFA ARALIĞI (Örn: 1-3, 5)
                  </label>
                  <input
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100"
                    placeholder="1-2, 4"
                  />
                </div>
              </div>

              <button
                disabled={!splitFile || isProcessing}
                onClick={async () => {
                  if (!splitFile) return;
                  setIsProcessing(true);
                  try {
                    const out = await extractPdfPageRange(splitFile, splitRange);
                    downloadUint8Array(out, `Ayiklanan-${splitFile.name}`);
                    triggerConfetti();
                    notify('Seçili sayfalar yeni PDF olarak indirildi!');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                Sayfaları Ayıkla ve İndir
              </button>
            </div>

            {/* Card 3: PDF to Images ZIP */}
            <div className="rounded-2xl bg-[#111114]/90 border border-zinc-800/80 p-5 corpus-card-glow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">PDF → Yüksek Çözünürlüklü PNG</h3>
                <p className="text-xs text-zinc-400">
                  PDF'in tüm sayfalarını HD görsellere dönüştürüp tek bir `.zip` paketi olarak indirin.
                </p>

                <label className="block cursor-pointer rounded-xl border border-dashed border-zinc-700 hover:border-amber-500 bg-zinc-950/60 p-4 text-center text-xs text-zinc-300">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      setPdfToImgFile(e.target.files?.[0] || null);
                      setPdfImgPreviews([]);
                    }}
                    className="hidden"
                  />
                  {pdfToImgFile ? pdfToImgFile.name : '+ PDF Dosyası Seçin'}
                </label>

                {pdfImgPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 max-h-28 overflow-y-auto">
                    {pdfImgPreviews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Page ${i + 1}`}
                        className="w-full h-16 object-cover rounded border border-zinc-800"
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                disabled={!pdfToImgFile || isProcessing}
                onClick={async () => {
                  if (!pdfToImgFile) return;
                  setIsProcessing(true);
                  try {
                    const { zipBlob, previews } = await renderPdfToImagesZip(pdfToImgFile, 'png');
                    setPdfImgPreviews(previews);
                    downloadBlob(
                      zipBlob,
                      `${pdfToImgFile.name.replace(/\.pdf$/i, '')}-Gorseller.zip`
                    );
                    triggerConfetti();
                    notify(`${previews.length} sayfa PNG (.zip) olarak indirildi!`);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                Tüm Sayfaları ZIP İndir
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL 1: SIGNATURE STUDIO PAD                                       */}
      {/* =================================================================== */}
      {showSignatureModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSignatureModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#121216] border border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">Islak / Dijital İmza Stüdyosu</h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSigTab('draw')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  sigTab === 'draw' ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400'
                }`}
              >
                Fare / Dokunmatik ile Çiz
              </button>
              <button
                onClick={() => setSigTab('type')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  sigTab === 'type' ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400'
                }`}
              >
                Klavye ile Kaligrafik Yaz
              </button>
            </div>

            {sigTab === 'draw' ? (
              <div className="space-y-2">
                <canvas
                  ref={sigCanvasRef}
                  width={390}
                  height={150}
                  onMouseDown={handleSigMouseDown}
                  onMouseMove={handleSigMouseMove}
                  onMouseUp={handleSigMouseUp}
                  onMouseLeave={handleSigMouseUp}
                  className="w-full h-[150px] bg-white rounded-xl cursor-crosshair border border-zinc-700"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Beyaz alana imzanızı çizin</span>
                  <button
                    onClick={clearSignaturePad}
                    className="text-rose-400 hover:underline cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100"
                  placeholder="Adınız Soyadınız"
                />
                <div className="bg-white text-indigo-950 rounded-xl p-6 text-center italic font-serif text-3xl">
                  {typedSignature || 'Corpus İmza'}
                </div>
              </div>
            )}

            <button
              onClick={handleInsertSignature}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer"
            >
              İmzayı PDF Sayfasına Yerleştir
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: WATERMARK & PDF METADATA INSPECTOR                         */}
      {/* =================================================================== */}
      {showDocSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDocSettingsModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#121216] border border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                Filigran (Watermark) & PDF Meta Verileri
              </h3>
              <button
                onClick={() => setShowDocSettingsModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <label className="flex items-center justify-between text-xs font-medium text-zinc-200 cursor-pointer">
                <span>Tüm Sayfalarda Çapraz Filigran Göster</span>
                <input
                  type="checkbox"
                  checked={watermark.enabled}
                  onChange={(e) =>
                    setWatermark((w) => ({ ...w, enabled: e.target.checked }))
                  }
                  className="accent-violet-500"
                />
              </label>

              {watermark.enabled && (
                <input
                  type="text"
                  value={watermark.text}
                  onChange={(e) => setWatermark((w) => ({ ...w, text: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                  placeholder="GİZLİ / ONAYLANDI"
                />
              )}
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-mono uppercase text-zinc-400">PDF Belge Özellikleri</p>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value }))}
                placeholder="Belge Başlığı (Title)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
              />
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => setMetadata((m) => ({ ...m, author: e.target.value }))}
                placeholder="Yazar / Kurum (Author)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
              />
              <input
                type="text"
                value={metadata.subject}
                onChange={(e) => setMetadata((m) => ({ ...m, subject: e.target.value }))}
                placeholder="Konu (Subject)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            <button
              onClick={() => {
                setShowDocSettingsModal(false);
                notify('Filigran ve belge meta verileri güncellendi.');
              }}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              Uygula ve Kapat
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: DESKTOP & MOBILE APP INSTALLER                             */}
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
                    Corpus PDF Studio Masaüstü Kurulumu
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Windows, macOS, Linux ve Mobil (PWA + Masaüstü Başlatıcı)
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
                  <span>Seçenek 1: Tek Tıkla Masaüstü Uygulaması (.bat) İndir</span>
                </p>
                <p className="text-zinc-400">
                  Tarayıcı adres çubuğu olmadan, tıpkı Adobe Acrobat Reader gibi bağımsız masaüstü
                  penceresinde çalışan başlatıcıyı bilgisayarınıza indirin:
                </p>
                <button
                  onClick={handleDownloadDesktopShortcut}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Corpus PDF Masaüstü Başlatıcısını İndir (.bat)</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <p className="font-semibold text-violet-300 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  <span>Seçenek 2: Tarayıcıdan Doğrudan PWA Kurulumu</span>
                </p>
                <p className="text-zinc-400">
                  Chrome / Edge adres çubuğunun sağındaki{' '}
                  <strong className="text-zinc-200">"Corpus PDF Studio Yükle"</strong> simgesine
                  tıklayarak Başlat Menünüze ve Masaüstünüze kalıcı uygulama olarak sabitleyebilirsiniz.
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
      {/* CORPUS UNIFIED FOOTER (#002)                                        */}
      {/* =================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900/90 py-4 px-4 sm:px-6 text-center">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Corpus Platform</span>
            <span>•</span>
            <span>Site #002 of 100 — Corpus PDF Studio Pro</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Acrobat Editor • Word / PPTX / Excel / Image to PDF • 100% Local Processing
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
