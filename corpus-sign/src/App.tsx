import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileSignature,
  Stamp,
  Scale,
  Users,
  Download,
  PenTool,
  Eraser,
  Plus,
  Trash2,
  ShieldCheck,
  MonitorDown,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CONTRACT_TEMPLATES,
  DEFAULT_CONTRACT_DATA,
  type ContractDocumentData,
  type ContractTemplateId,
  generateCalligraphicSignatureDataUrl,
  renderCorporateStampDataUrl,
  computeDocumentSha256,
  renderContractToA4Canvas,
  exportSignedContractToPdf,
} from './utils/signEngine';

type EditorTab = 'signature-pad' | 'stamp-studio' | 'parties' | 'clauses';

const INK_COLORS = [
  { name: 'Islak İmza Mavisi', hex: '#1d4ed8' },
  { name: 'Dolma Kalem Laciverti', hex: '#1e3a8a' },
  { name: 'Resmi Siyah', hex: '#09090b' },
  { name: 'Mühür Kırmızısı', hex: '#b91c1c' },
  { name: 'Kurumsal Mor', hex: '#6d28d9' },
];

export default function App() {
  const [docData, setDocData] = useState<ContractDocumentData>(DEFAULT_CONTRACT_DATA);
  const [activeTab, setActiveTab] = useState<EditorTab>('signature-pad');
  const [sha256Hash, setSha256Hash] = useState<string>('');
  const [zoom, setZoom] = useState<number>(0.42);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Signature Pad State
  const [penColor, setPenColor] = useState<string>('#1d4ed8');
  const [penWidth] = useState<number>(3.5);
  const [typedSignatureName, setTypedSignatureName] = useState<string>('Kaan Demir');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const a4CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigPadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize signature pad with a clean transparent canvas
  useEffect(() => {
    const pad = sigPadCanvasRef.current;
    if (!pad) return;
    pad.width = 560;
    pad.height = 200;
  }, []);

  // Re-compute SHA-256 and re-render A4 Contract Canvas whenever docData changes
  useEffect(() => {
    let active = true;
    const updateCanvas = async () => {
      const hash = await computeDocumentSha256(docData);
      if (!active) return;
      setSha256Hash(hash);
      if (a4CanvasRef.current) {
        await renderContractToA4Canvas(a4CanvasRef.current, docData, hash);
      }
    };
    updateCanvas();
    return () => {
      active = false;
    };
  }, [docData]);

  const handleTemplateSelect = (tplId: ContractTemplateId) => {
    const tpl = CONTRACT_TEMPLATES[tplId];
    setDocData((prev) => ({
      ...prev,
      templateId: tplId,
      title: tpl.title,
      subtitle: tpl.subtitle,
      contractValue: tpl.defaultValue,
      partyA: { ...prev.partyA, roleTitle: tpl.partyARole },
      partyB: { ...prev.partyB, roleTitle: tpl.partyBRole },
      clauses: tpl.clauses.map((c) => ({ ...c })),
    }));
  };

  // Freehand Signature Pad handlers
  const getPadCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigPadCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    lastPointRef.current = getPadCoords(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current || !sigPadCanvasRef.current) return;
    const ctx = sigPadCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const pt = getPadCoords(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    lastPointRef.current = pt;
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearSignaturePad = () => {
    const canvas = sigPadCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applyDrawnSignatureToParty = (party: 'A' | 'B') => {
    const canvas = sigPadCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (party === 'A') {
      setDocData((prev) => ({ ...prev, partyASignatureDataUrl: dataUrl }));
    } else {
      setDocData((prev) => ({ ...prev, partyBSignatureDataUrl: dataUrl }));
    }
  };

  const applyCalligraphicSignatureToParty = (party: 'A' | 'B') => {
    const dataUrl = generateCalligraphicSignatureDataUrl(typedSignatureName, penColor);
    if (party === 'A') {
      setDocData((prev) => ({ ...prev, partyASignatureDataUrl: dataUrl }));
    } else {
      setDocData((prev) => ({ ...prev, partyBSignatureDataUrl: dataUrl }));
    }
  };

  const downloadTransparentSignaturePng = () => {
    const canvas = sigPadCanvasRef.current;
    const dataUrl =
      canvas && canvas.toDataURL().length > 1500
        ? canvas.toDataURL('image/png')
        : generateCalligraphicSignatureDataUrl(typedSignatureName, penColor);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `islak-imza-${typedSignatureName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const downloadCorporateStampPng = () => {
    const dataUrl = renderCorporateStampDataUrl(docData.stamp);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `kurumsal-kase-${docData.stamp.companyName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handleExportPdf = async () => {
    if (!a4CanvasRef.current) return;
    setIsExporting(true);
    try {
      await exportSignedContractToPdf(a4CanvasRef.current, docData);
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus E-Sign, Contract & Legal Studio Pro (#009)',
      'echo Corpus E-Sign Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5181',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-ESign-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <FileSignature className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus E-Sign & Legal Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #009 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Canlı Islak İmza Pedi, Kurumsal Şirket Kaşesi, Hukuki Sözleşme Şablonları & SHA-256 Mühürleme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/80 text-xs text-zinc-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256: {sha256Hash ? `${sha256Hash.slice(0, 12)}...` : 'Hesaplanıyor'}</span>
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

      {/* Top Contract Template & Export Toolbar */}
      <div className="border-b border-zinc-800/70 bg-[#111114]/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Contract Template Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-violet-400" />
              Hazır Hukuki Şablon:
            </span>
            {(Object.keys(CONTRACT_TEMPLATES) as ContractTemplateId[]).map((tplId) => (
              <button
                key={tplId}
                onClick={() => handleTemplateSelect(tplId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  docData.templateId === tplId
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {CONTRACT_TEMPLATES[tplId].name}
              </button>
            ))}
          </div>

          {/* Right: Standalone PNG & Certified A4 PDF Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTransparentSignaturePng}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              title="Şeffaf Arka Planlı Islak İmza PNG İndir"
            >
              <PenTool className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden xl:inline">Şeffaf İmza PNG</span>
            </button>
            <button
              onClick={downloadCorporateStampPng}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              title="Şeffaf Arka Planlı Kurumsal Kaşe/Mühür PNG İndir"
            >
              <Stamp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Kaşe PNG İndir</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting
                  ? 'Mühürlü PDF Üretiliyor...'
                  : 'İmzalı & Mühürlü A4 PDF İndir'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive E-Sign, Stamp & Contract Editor (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111114] border border-zinc-800/80 rounded-2xl corpus-card-glow overflow-hidden flex flex-col">
          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-zinc-800/80 bg-zinc-950/60 p-1.5 gap-1">
            {(
              [
                { id: 'signature-pad', label: 'Islak İmza Çizim Pedi', icon: PenTool },
                { id: 'stamp-studio', label: 'Kurumsal Kaşe & Mühür', icon: Stamp },
                { id: 'parties', label: 'Taraflar & Bedel', icon: Users },
                { id: 'clauses', label: 'Sözleşme Maddeleri', icon: Scale },
              ] as { id: EditorTab; label: string; icon: typeof PenTool }[]
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* TAB 1: WET-INK SIGNATURE PAD */}
            {activeTab === 'signature-pad' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      1. Serbest El Islak İmza Çizim Pedi (Fare / Dokunmatik / Kalem)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Aşağıdaki beyaz imza alanına imzanızı çizin ve sözleşmedeki Taraf 1 veya Taraf 2 kutusuna aktarın:
                    </p>
                  </div>

                  {/* Ink Color Picker */}
                  <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400">Mürekkep:</span>
                    {INK_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setPenColor(c.hex)}
                        title={c.name}
                        className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                          penColor === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-75'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Interactive Drawing Canvas */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-700 bg-white shadow-inner">
                  <canvas
                    ref={sigPadCanvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="w-full h-44 cursor-crosshair touch-none block"
                  />
                  <div className="absolute bottom-2 left-4 right-4 border-b border-dashed border-zinc-300 pointer-events-none flex justify-between text-[11px] text-zinc-400 pb-1">
                    <span>✕ İMZA ÇİZGİSİ</span>
                    <span>CORPUS WET-INK ENGINE</span>
                  </div>
                  <button
                    onClick={clearSignaturePad}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 text-zinc-100 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    Temizle
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => applyDrawnSignatureToParty('A')}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Çizilen İmzayı 1. Tarafa (Sol) Uygula
                  </button>
                  <button
                    onClick={() => applyDrawnSignatureToParty('B')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Çizilen İmzayı 2. Tarafa (Sağ) Uygula
                  </button>
                  <button
                    onClick={downloadTransparentSignaturePng}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 cursor-pointer ml-auto"
                  >
                    Şeffaf PNG Olarak İndir
                  </button>
                </div>

                {/* Calligraphic Font Signature Generator */}
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                    <Sparkles className="w-4 h-4" />
                    <span>2. Otomatik Kaligrafik Dolma Kalem İmzası Üretici</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Fareyle çizmek istemiyorsanız adınızı yazın; kaligrafik ıslak imza otomatik oluşturulsun:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={typedSignatureName}
                      onChange={(e) => setTypedSignatureName(e.target.value)}
                      placeholder="Ad Soyad yazın..."
                      className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100"
                    />
                    <button
                      onClick={() => applyCalligraphicSignatureToParty('A')}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-100 cursor-pointer"
                    >
                      1. Tarafa Aktar
                    </button>
                    <button
                      onClick={() => applyCalligraphicSignatureToParty('B')}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-100 cursor-pointer"
                    >
                      2. Tarafa Aktar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CORPORATE STAMP & SEAL GENERATOR */}
            {activeTab === 'stamp-studio' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Kurumsal Şirket Kaşesi & Resmi Mühür Tasarımcısı
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Sözleşmenin altına basılacak resmi kaşeyi özelleştirin veya şeffaf PNG olarak indirin.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docData.stamp.enabled}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          stamp: { ...p.stamp, enabled: e.target.checked },
                        }))
                      }
                      className="accent-violet-500 w-4 h-4"
                    />
                    <span>Sözleşmeye Kaşe Bas</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Kaşe Formu</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setDocData((p) => ({
                            ...p,
                            stamp: { ...p.stamp, shape: 'circle' },
                          }))
                        }
                        className={`py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                          docData.stamp.shape === 'circle'
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Yuvarlak Resmi Mühür
                      </button>
                      <button
                        onClick={() =>
                          setDocData((p) => ({
                            ...p,
                            stamp: { ...p.stamp, shape: 'rectangle' },
                          }))
                        }
                        className={`py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                          docData.stamp.shape === 'rectangle'
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Dikdörtgen Şirket Kaşesi
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Kaşe Mürekkep Rengi</label>
                    <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
                      {INK_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() =>
                            setDocData((p) => ({
                              ...p,
                              stamp: { ...p.stamp, inkColor: c.hex },
                            }))
                          }
                          className={`w-5 h-5 rounded-full cursor-pointer ${
                            docData.stamp.inkColor === c.hex ? 'ring-2 ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Şirket Ticaret Unvanı</label>
                    <input
                      type="text"
                      value={docData.stamp.companyName}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          stamp: { ...p.stamp, companyName: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Vergi Dairesi & VKN / Mersis No</label>
                    <input
                      type="text"
                      value={docData.stamp.taxInfo}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          stamp: { ...p.stamp, taxInfo: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Ticaret Sicil & Merkez Bilgisi</label>
                    <input
                      type="text"
                      value={docData.stamp.cityAndReg}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          stamp: { ...p.stamp, cityAndReg: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  onClick={downloadCorporateStampPng}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Stamp className="w-4 h-4" />
                  Sadece Şeffaf Kurumsal Kaşeyi İndir (.PNG)
                </button>
              </div>
            )}

            {/* TAB 3: PARTIES & CONTRACT INFO */}
            {activeTab === 'parties' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Sözleşme / Evrak No</label>
                    <input
                      type="text"
                      value={docData.documentNo}
                      onChange={(e) => setDocData((p) => ({ ...p, documentNo: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">İmza Tarihi</label>
                    <input
                      type="text"
                      value={docData.date}
                      onChange={(e) => setDocData((p) => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Mali Bedel / Cezai Şart</label>
                    <input
                      type="text"
                      value={docData.contractValue}
                      onChange={(e) => setDocData((p) => ({ ...p, contractValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                {/* Party A */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-violet-400">1. TARAF ({docData.partyA.roleTitle})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={docData.partyA.name}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyA: { ...p.partyA, name: e.target.value },
                        }))
                      }
                      placeholder="Şirket / Ad Soyad"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.partyA.taxOrIdNo}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyA: { ...p.partyA, taxOrIdNo: e.target.value },
                        }))
                      }
                      placeholder="Vergi Dairesi & VKN / TCKN"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.partyA.representative}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyA: { ...p.partyA, representative: e.target.value },
                        }))
                      }
                      placeholder="İmza Yetkilisi"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.partyA.address}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyA: { ...p.partyA, address: e.target.value },
                        }))
                      }
                      placeholder="Adres"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                {/* Party B */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-emerald-400">2. TARAF ({docData.partyB.roleTitle})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={docData.partyB.name}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyB: { ...p.partyB, name: e.target.value },
                        }))
                      }
                      placeholder="Şirket / Ad Soyad"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.partyB.taxOrIdNo}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyB: { ...p.partyB, taxOrIdNo: e.target.value },
                        }))
                      }
                      placeholder="Vergi Dairesi & VKN / TCKN"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.partyB.representative}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyB: { ...p.partyB, representative: e.target.value },
                        }))
                      }
                      placeholder="İmza Yetkilisi"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.partyB.address}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          partyB: { ...p.partyB, address: e.target.value },
                        }))
                      }
                      placeholder="Adres"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONTRACT CLAUSES */}
            {activeTab === 'clauses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100">Sözleşme Maddeleri</h3>
                  <button
                    onClick={() =>
                      setDocData((p) => ({
                        ...p,
                        clauses: [
                          ...p.clauses,
                          {
                            id: `c-${Date.now()}`,
                            title: `MADDE ${p.clauses.length + 1} — EK HÜKÜMLER`,
                            body: 'Taraflar arasında kararlaştırılan yeni özel hüküm metni.',
                          },
                        ],
                      }))
                    }
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Madde Ekle
                  </button>
                </div>

                {docData.clauses.map((clause) => (
                  <div
                    key={clause.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={clause.title}
                        onChange={(e) =>
                          setDocData((p) => ({
                            ...p,
                            clauses: p.clauses.map((c) =>
                              c.id === clause.id ? { ...c, title: e.target.value } : c
                            ),
                          }))
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-100"
                      />
                      <button
                        onClick={() =>
                          setDocData((p) => ({
                            ...p,
                            clauses: p.clauses.filter((c) => c.id !== clause.id),
                          }))
                        }
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={clause.body}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          clauses: p.clauses.map((c) =>
                            c.id === clause.id ? { ...c, body: e.target.value } : c
                          ),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live High-DPI A4 Contract Canvas Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111114] border border-zinc-800/80 rounded-2xl corpus-card-glow p-4 flex flex-col items-center sticky top-20">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı Resmi A4 Sözleşme & Mühür Önizlemesi
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.05).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-zinc-400 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(0.65, +(z + 0.05).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full overflow-auto bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-4 flex justify-center max-h-[75vh]">
            <div
              style={{
                width: `${Math.round(1588 * zoom)}px`,
                height: `${Math.round(2246 * zoom)}px`,
              }}
              className="shadow-2xl rounded-sm overflow-hidden bg-white shrink-0 transition-all"
            >
              <canvas
                ref={a4CanvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Desktop App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                Corpus E-Sign Masaüstü Uygulaması Kurulumu
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Corpus E-Sign & Legal Studio'yu bağımsız masaüstü penceresinde başlatmak için tıklayın:
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
            Corpus Platform • <strong>#009 Corpus E-Sign, Contract & Legal Studio Pro</strong> — Sözleşmeleriniz ve imzanız asla sunucuya yüklenmez.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">
          Wet-Ink Pad • Corporate Stamp • SHA-256 Audit Seal
        </span>
      </footer>
    </div>
  );
}
