import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  FileUser,
  Sparkles,
  Download,
  FileText,
  Briefcase,
  GraduationCap,
  Code2,
  Mail,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Camera,
  MonitorDown,
  ShieldCheck,
  Palette,
  RotateCcw,
  Upload,
  Save,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import {
  DEFAULT_CV_DATA,
  type CvDocumentData,
  type CvTemplateStyle,
  analyzeAtsScore,
  renderCvToA4Canvas,
  renderCoverLetterToA4Canvas,
  exportCanvasToA4Pdf,
  exportCvToWordDoc,
} from './utils/cvEngine';

type EditorTab = 'personal' | 'experience' | 'education' | 'skills' | 'cover-letter' | 'ats-analyzer';
type PreviewMode = 'cv' | 'cover-letter';

const ACCENT_PRESETS = [
  { name: 'Corpus Violet', hex: '#7c3aed' },
  { name: 'Executive Blue', hex: '#2563eb' },
  { name: 'Emerald Trust', hex: '#059669' },
  { name: 'Slate Minimal', hex: '#0f172a' },
  { name: 'Crimson Bold', hex: '#dc2626' },
  { name: 'Amber Gold', hex: '#d97706' },
];

export default function App() {
  const [cvData, setCvData] = useState<CvDocumentData>(() => {
    try {
      const saved = localStorage.getItem('corpus_cv_data_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CV_DATA;
    } catch {
      return DEFAULT_CV_DATA;
    }
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('personal');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('cv');
  const [jobDescription, setJobDescription] = useState<string>(
    'Senior Software Architect arıyoruz. TypeScript, React, Next.js, Node.js, Go, Microservices, AWS, Kubernetes, PostgreSQL, Redis, Kafka ve CI/CD süreçlerinde deneyimli, yüksek trafikli dağıtık sistemler geliştirmiş takım lideri.'
  );
  const [zoom, setZoom] = useState<number>(0.42);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newCertName, setNewCertName] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem('corpus_cv_data_v1', JSON.stringify(cvData));
    } catch {
      // ignore storage quota errors
    }
  }, [cvData]);

  // Re-render A4 canvas whenever cvData or previewMode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (previewMode === 'cv') {
      renderCvToA4Canvas(canvas, cvData);
    } else {
      renderCoverLetterToA4Canvas(canvas, cvData);
    }
  }, [cvData, previewMode]);

  const atsResult = useMemo(() => analyzeAtsScore(cvData, jobDescription), [cvData, jobDescription]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCvData((prev) => ({ ...prev, photoDataUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const slug = (cvData.personal.fullName || 'corpus-cv').toLowerCase().replace(/\s+/g, '-');
      const fileName =
        previewMode === 'cv' ? `${slug}-cv-a4.pdf` : `${slug}-on-yazi-a4.pdf`;
      await exportCanvasToA4Pdf(canvasRef.current, fileName);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = () => {
    exportCvToWordDoc(cvData);
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportJsonBackup = () => {
    const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(cvData.personal.fullName || 'corpus').toLowerCase().replace(/\s+/g, '-')}-cv-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as CvDocumentData;
        if (parsed && parsed.personal) {
          setCvData(parsed);
        }
      } catch {
        alert('Geçersiz JSON yedek dosyası.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Resume & CV Studio Pro (#007)',
      'echo Corpus CV Studio Pro Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5179',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-CV-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addMissingKeywordToSkills = (kw: string) => {
    const formatted = kw.charAt(0).toUpperCase() + kw.slice(1);
    if (cvData.skills.some((s) => s.name.toLowerCase() === kw.toLowerCase())) return;
    setCvData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        { id: `sk-${Date.now()}`, name: formatted, category: 'Tech', level: 4 },
      ],
    }));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJsonBackup}
      />

      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <FileUser className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus CV & Resume Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #007 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                ATS Uyumlu Özgeçmiş, Ön Yazı (Cover Letter) & İş İlanı Anahtar Kelime Analiz Stüdyosu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live ATS Score Pill */}
            <button
              onClick={() => setActiveTab('ats-analyzer')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 transition-all text-xs"
              title="ATS Uyumluluk ve İlan Eşleşme Analizini Aç"
            >
              <Target
                className={`w-3.5 h-3.5 ${
                  atsResult.score >= 85
                    ? 'text-emerald-400'
                    : atsResult.score >= 65
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              />
              <span className="text-zinc-400 hidden md:inline">ATS Skoru:</span>
              <span
                className={`font-mono font-bold ${
                  atsResult.score >= 85
                    ? 'text-emerald-400'
                    : atsResult.score >= 65
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {atsResult.score}/100
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/80 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% Local-First • No Watermark</span>
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
          {/* Left: Document Mode + Template Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">
              <button
                onClick={() => setPreviewMode('cv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === 'cv'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileUser className="w-3.5 h-3.5" />
                CV / Özgeçmiş (A4)
              </button>
              <button
                onClick={() => {
                  setPreviewMode('cover-letter');
                  setActiveTab('cover-letter');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === 'cover-letter'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Ön Yazı / Cover Letter
              </button>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800/80">
              <span className="text-[11px] text-zinc-400">Şablon:</span>
              {(
                [
                  { id: 'executive-modern', label: 'Executive Modern' },
                  { id: 'harvard-ats', label: 'Harvard ATS Classic' },
                  { id: 'creative-sidebar', label: 'Creative Sidebar' },
                ] as { id: CvTemplateStyle; label: string }[]
              ).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setCvData((prev) => ({ ...prev, template: tpl.id }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    cvData.template === tpl.id
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Accent Color Swatches */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800/80">
              <Palette className="w-3.5 h-3.5 text-zinc-400 mr-0.5" />
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setCvData((prev) => ({ ...prev, accentColor: c.hex }))}
                  title={c.name}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    cvData.accentColor === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Right: Export & Backup Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJsonBackup}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              title="CV Verisini JSON Olarak Yedekle"
            >
              <Save className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden xl:inline">JSON Yedekle</span>
            </button>
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              title="JSON Yedeğini Geri Yükle"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden xl:inline">Yükle</span>
            </button>
            <button
              onClick={handleExportWord}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Word (.DOC)</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'PDF Hazırlanıyor...' : 'A4 PDF İndir (300 DPI)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Structured CV & ATS Editor (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111114] border border-zinc-800/80 rounded-2xl corpus-card-glow overflow-hidden flex flex-col">
          {/* Editor Section Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-zinc-800/80 bg-zinc-950/60 p-1.5 gap-1">
            {(
              [
                { id: 'personal', label: 'Kişisel & Özet', icon: FileUser },
                { id: 'experience', label: 'İş Deneyimi', icon: Briefcase },
                { id: 'education', label: 'Eğitim & Dil', icon: GraduationCap },
                { id: 'skills', label: 'Yetenek & Proje', icon: Code2 },
                { id: 'cover-letter', label: 'Ön Yazı', icon: Mail },
                { id: 'ats-analyzer', label: 'ATS & İlan Analizi', icon: Target },
              ] as { id: EditorTab; label: string; icon: typeof FileUser }[]
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'cover-letter') setPreviewMode('cover-letter');
                    else if (previewMode === 'cover-letter' && tab.id !== 'ats-analyzer') setPreviewMode('cv');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
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

          {/* Tab Body */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[76vh] overflow-y-auto">
            {/* TAB 1: PERSONAL & SUMMARY */}
            {activeTab === 'personal' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="flex items-center gap-3.5">
                    {cvData.photoDataUrl ? (
                      <img
                        src={cvData.photoDataUrl}
                        alt="Profile"
                        className="w-14 h-14 rounded-full object-cover border-2 border-violet-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Profil Fotoğrafı & QR Kartvizit</h3>
                      <p className="text-xs text-zinc-400">
                        Fotoğraf ekleyin veya sağ üst köşede dijital portfolyo QR kodunu aktif edin.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 cursor-pointer"
                    >
                      Fotoğraf Seç
                    </button>
                    {cvData.photoDataUrl && (
                      <button
                        onClick={() => setCvData((prev) => ({ ...prev, photoDataUrl: null }))}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 cursor-pointer"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                </div>

                {/* Personal Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      value={cvData.personal.fullName}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, fullName: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Hedef Unvan / Pozisyon</label>
                    <input
                      type="text"
                      value={cvData.personal.title}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, title: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">E-Posta Adresi</label>
                    <input
                      type="email"
                      value={cvData.personal.email}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, email: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Telefon Numarası</label>
                    <input
                      type="text"
                      value={cvData.personal.phone}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, phone: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Konum / Çalışma Tercihi</label>
                    <input
                      type="text"
                      value={cvData.personal.location}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, location: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">LinkedIn Profili</label>
                    <input
                      type="text"
                      value={cvData.personal.linkedin}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, linkedin: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">GitHub / Behance</label>
                    <input
                      type="text"
                      value={cvData.personal.github}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, github: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Kişisel Web Sitesi</label>
                    <input
                      type="text"
                      value={cvData.personal.website}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          personal: { ...p.personal, website: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* QR Code Setting */}
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cvData.showQrCode}
                      onChange={(e) => setCvData((p) => ({ ...p, showQrCode: e.target.checked }))}
                      className="accent-violet-500 w-4 h-4 rounded"
                    />
                    <QrCode className="w-4 h-4 text-violet-400" />
                    <span>CV Üzerinde Taranabilir Portfolyo / LinkedIn QR Kodu Göster</span>
                  </label>
                  {cvData.showQrCode && (
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/..."
                      value={cvData.qrUrl}
                      onChange={(e) => setCvData((p) => ({ ...p, qrUrl: e.target.value }))}
                      className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200"
                    />
                  )}
                </div>

                {/* Executive Summary */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Profesyonel Yönetici Özeti (Executive Summary)</label>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {cvData.personal.summary.length} karakter (Önerilen: 150-450)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={cvData.personal.summary}
                    onChange={(e) =>
                      setCvData((p) => ({
                        ...p,
                        personal: { ...p.personal, summary: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: EXPERIENCE */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">İş Deneyimi & Ölçülebilir Başarılar</h3>
                    <p className="text-xs text-zinc-400">
                      ATS algoritmaları için maddelerinizde <span className="text-emerald-400">%45 artış, $120K tasarruf</span> gibi somut rakamlar kullanın.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setCvData((p) => ({
                        ...p,
                        experiences: [
                          {
                            id: `exp-${Date.now()}`,
                            role: 'Yeni Pozisyon / Unvan',
                            company: 'Şirket Adı',
                            location: 'İstanbul, TR',
                            period: '2024 – Günümüz',
                            bullets: ['Süreç verimliliğini %35 artıran yeni mimari geliştirildi.'],
                          },
                          ...p.experiences,
                        ],
                      }))
                    }
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Deneyim Ekle
                  </button>
                </div>

                {cvData.experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-violet-400 font-semibold">
                        #{idx + 1} • {exp.company}
                      </span>
                      <button
                        onClick={() =>
                          setCvData((p) => ({
                            ...p,
                            experiences: p.experiences.filter((item) => item.id !== exp.id),
                          }))
                        }
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Deneyimi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Pozisyon / Rol"
                        value={exp.role}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            experiences: p.experiences.map((item) =>
                              item.id === exp.id ? { ...item, role: e.target.value } : item
                            ),
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                      <input
                        type="text"
                        placeholder="Şirket Adı"
                        value={exp.company}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            experiences: p.experiences.map((item) =>
                              item.id === exp.id ? { ...item, company: e.target.value } : item
                            ),
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                      <input
                        type="text"
                        placeholder="Konum"
                        value={exp.location}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            experiences: p.experiences.map((item) =>
                              item.id === exp.id ? { ...item, location: e.target.value } : item
                            ),
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                      <input
                        type="text"
                        placeholder="Tarih Aralığı (Örn: Oca 2022 - Günümüz)"
                        value={exp.period}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            experiences: p.experiences.map((item) =>
                              item.id === exp.id ? { ...item, period: e.target.value } : item
                            ),
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] text-zinc-400">
                        Başarı & Sorumluluk Maddeleri (Her satır ayrı bir madde olarak çizilir):
                      </label>
                      <textarea
                        rows={3}
                        value={exp.bullets.join('\n')}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            experiences: p.experiences.map((item) =>
                              item.id === exp.id
                                ? { ...item, bullets: e.target.value.split('\n') }
                                : item
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: EDUCATION, CERTIFICATIONS & LANGUAGES */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                {/* Education List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100">Eğitim Bilgileri</h3>
                    <button
                      onClick={() =>
                        setCvData((p) => ({
                          ...p,
                          educations: [
                            ...p.educations,
                            {
                              id: `edu-${Date.now()}`,
                              degree: 'Bölüm / Derece',
                              school: 'Üniversite Adı',
                              period: '2018 – 2022',
                              gpaOrNotes: 'Onur Öğrencisi',
                            },
                          ],
                        }))
                      }
                      className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Eğitim Ekle
                    </button>
                  </div>

                  {cvData.educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              educations: p.educations.map((item) =>
                                item.id === edu.id ? { ...item, degree: e.target.value } : item
                              ),
                            }))
                          }
                          placeholder="Derece / Bölüm"
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              educations: p.educations.map((item) =>
                                item.id === edu.id ? { ...item, school: e.target.value } : item
                              ),
                            }))
                          }
                          placeholder="Üniversite / Okul"
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={edu.period}
                            onChange={(e) =>
                              setCvData((p) => ({
                                ...p,
                                educations: p.educations.map((item) =>
                                  item.id === edu.id ? { ...item, period: e.target.value } : item
                                ),
                              }))
                            }
                            placeholder="Yıl"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                          />
                          <button
                            onClick={() =>
                              setCvData((p) => ({
                                ...p,
                                educations: p.educations.filter((item) => item.id !== edu.id),
                              }))
                            }
                            className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={edu.gpaOrNotes}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            educations: p.educations.map((item) =>
                              item.id === edu.id ? { ...item, gpaOrNotes: e.target.value } : item
                            ),
                          }))
                        }
                        placeholder="GPA / Notlar"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                      />
                    </div>
                  ))}
                </div>

                {/* Certifications */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-zinc-100">Uluslararası Sertifikalar & Lisanslar</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      placeholder="Örn: AWS Certified Solutions Architect (2025)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <button
                      onClick={() => {
                        if (!newCertName.trim()) return;
                        setCvData((p) => ({
                          ...p,
                          certifications: [...p.certifications, newCertName.trim()],
                        }));
                        setNewCertName('');
                      }}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {cvData.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                      >
                        {cert}
                        <button
                          onClick={() =>
                            setCvData((p) => ({
                              ...p,
                              certifications: p.certifications.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-zinc-100">Yabancı Diller</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {cvData.languages.map((lang) => (
                      <div
                        key={lang.id}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1.5"
                      >
                        <input
                          type="text"
                          value={lang.language}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              languages: p.languages.map((l) =>
                                l.id === lang.id ? { ...l, language: e.target.value } : l
                              ),
                            }))
                          }
                          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100"
                        />
                        <input
                          type="text"
                          value={lang.proficiency}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              languages: p.languages.map((l) =>
                                l.id === lang.id ? { ...l, proficiency: e.target.value } : l
                              ),
                            }))
                          }
                          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SKILLS & PROJECTS */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                {/* Skills */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-100">Teknik Yetkinlikler & Seviye Çubukları</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Yeni yetenek ekle (Örn: GraphQL, Docker, Figma...)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                    <button
                      onClick={() => {
                        if (!newSkillName.trim()) return;
                        setCvData((p) => ({
                          ...p,
                          skills: [
                            ...p.skills,
                            {
                              id: `sk-${Date.now()}`,
                              name: newSkillName.trim(),
                              category: 'Tech',
                              level: 5,
                            },
                          ],
                        }));
                        setNewSkillName('');
                      }}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                    >
                      Yetenek Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cvData.skills.map((sk) => (
                      <div
                        key={sk.id}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
                      >
                        <input
                          type="text"
                          value={sk.name}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              skills: p.skills.map((item) =>
                                item.id === sk.id ? { ...item, name: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-transparent text-xs font-medium text-zinc-200 focus:outline-none flex-1"
                        />
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={sk.level}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              skills: p.skills.map((item) =>
                                item.id === sk.id ? { ...item, level: Number(e.target.value) } : item
                              ),
                            }))
                          }
                          className="w-20 accent-violet-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-mono text-violet-400 w-6 text-right">
                          {sk.level}/5
                        </span>
                        <button
                          onClick={() =>
                            setCvData((p) => ({
                              ...p,
                              skills: p.skills.filter((item) => item.id !== sk.id),
                            }))
                          }
                          className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Projects */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100">Öne Çıkan Projeler & Açık Kaynak</h3>
                    <button
                      onClick={() =>
                        setCvData((p) => ({
                          ...p,
                          projects: [
                            ...p.projects,
                            {
                              id: `proj-${Date.now()}`,
                              name: 'Yeni Proje Adı',
                              techStack: 'React, TypeScript, Node.js',
                              link: 'github.com/proje',
                              description: 'Projenin sağladığı fayda ve mimari özeti.',
                            },
                          ],
                        }))
                      }
                      className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Proje Ekle
                    </button>
                  </div>

                  {cvData.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              projects: p.projects.map((item) =>
                                item.id === proj.id ? { ...item, name: e.target.value } : item
                              ),
                            }))
                          }
                          placeholder="Proje Adı"
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <input
                          type="text"
                          value={proj.techStack}
                          onChange={(e) =>
                            setCvData((p) => ({
                              ...p,
                              projects: p.projects.map((item) =>
                                item.id === proj.id ? { ...item, techStack: e.target.value } : item
                              ),
                            }))
                          }
                          placeholder="Kullanılan Teknolojiler"
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={proj.link}
                            onChange={(e) =>
                              setCvData((p) => ({
                                ...p,
                                projects: p.projects.map((item) =>
                                  item.id === proj.id ? { ...item, link: e.target.value } : item
                                ),
                              }))
                            }
                            placeholder="Link"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                          />
                          <button
                            onClick={() =>
                              setCvData((p) => ({
                                ...p,
                                projects: p.projects.filter((item) => item.id !== proj.id),
                              }))
                            }
                            className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={proj.description}
                        onChange={(e) =>
                          setCvData((p) => ({
                            ...p,
                            projects: p.projects.map((item) =>
                              item.id === proj.id ? { ...item, description: e.target.value } : item
                            ),
                          }))
                        }
                        placeholder="Proje açıklaması"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: COVER LETTER (ÖN YAZI) */}
            {activeTab === 'cover-letter' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-violet-300">
                      Kurumsal Ön Yazı (Cover Letter) Tasarımcısı
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      CV şablonunuzun renk ve tipografisiyle %100 uyumlu A4 Ön Yazı anında sağ tarafta oluşturulur.
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewMode('cover-letter')}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium cursor-pointer"
                  >
                    Ön Yazıyı Önizle
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Alıcı Adı / Departman</label>
                    <input
                      type="text"
                      value={cvData.coverLetter.recipientName}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          coverLetter: { ...p.coverLetter, recipientName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Alıcı Unvanı</label>
                    <input
                      type="text"
                      value={cvData.coverLetter.recipientRole}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          coverLetter: { ...p.coverLetter, recipientRole: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Başvurulan Şirket Adı</label>
                    <input
                      type="text"
                      value={cvData.coverLetter.companyName}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          coverLetter: { ...p.coverLetter, companyName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Tarih</label>
                    <input
                      type="text"
                      value={cvData.coverLetter.date}
                      onChange={(e) =>
                        setCvData((p) => ({
                          ...p,
                          coverLetter: { ...p.coverLetter, date: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Konu Başlığı</label>
                  <input
                    type="text"
                    value={cvData.coverLetter.subject}
                    onChange={(e) =>
                      setCvData((p) => ({
                        ...p,
                        coverLetter: { ...p.coverLetter, subject: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Giriş Paragrafı (Neden Bu Rol & Şirket?)</label>
                  <textarea
                    rows={3}
                    value={cvData.coverLetter.openingParagraph}
                    onChange={(e) =>
                      setCvData((p) => ({
                        ...p,
                        coverLetter: { ...p.coverLetter, openingParagraph: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Gelişme Paragrafı (Somut Başarılarınız & Deneyiminiz)</label>
                  <textarea
                    rows={4}
                    value={cvData.coverLetter.bodyParagraph}
                    onChange={(e) =>
                      setCvData((p) => ({
                        ...p,
                        coverLetter: { ...p.coverLetter, bodyParagraph: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Sonuç & Görüşme Talebi Paragrafı</label>
                  <textarea
                    rows={3}
                    value={cvData.coverLetter.closingParagraph}
                    onChange={(e) =>
                      setCvData((p) => ({
                        ...p,
                        coverLetter: { ...p.coverLetter, closingParagraph: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* TAB 6: ATS & JOB DESCRIPTION ANALYZER */}
            {activeTab === 'ats-analyzer' && (
              <div className="space-y-5">
                {/* Score Card */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/40 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        {atsResult.score}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">/ 100</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        ATS Uyumluluk & İlan Eşleşme Raporu
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Toplam {atsResult.wordCount} kelime • {atsResult.bulletCount} deneyim maddesi •{' '}
                        <span className="text-emerald-400 font-medium">
                          {atsResult.metricsCount} ölçülebilir başarı metriği
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Description Input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Başvuracağınız İş İlanı Metnini Yapıştırın (LinkedIn / Kariyer.net / Indeed):
                  </label>
                  <textarea
                    rows={3}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="İş ilanındaki aranan nitelikleri buraya yapıştırın; CV'nizde eksik olan anahtar kelimeleri anında tespit edelim..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Matched vs Missing Keywords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      CV'nizde Bulunan İlan Kelimeleri ({atsResult.matchedKeywords.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-mono"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      İlanda Geçen Ama CV'de Eksik Olanlar (Tıkla & Ekle)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.missingKeywords.length === 0 ? (
                        <span className="text-xs text-zinc-400">
                          Harika! İlandaki tüm kritik anahtar kelimeler CV'nizde yer alıyor.
                        </span>
                      ) : (
                        atsResult.missingKeywords.map((kw) => (
                          <button
                            key={kw}
                            onClick={() => addMissingKeywordToSkills(kw)}
                            className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 text-[11px] font-mono transition-colors cursor-pointer"
                            title="Yetkinliklere eklemek için tıklayın"
                          >
                            + {kw}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 5-Point ATS Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-300">ATS Kalite Kontrol Listesi</h4>
                  {atsResult.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5"
                    >
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{chk.label}</div>
                        <div className="text-[11px] text-zinc-400">{chk.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Editor Bottom Bar */}
          <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Tüm değişiklikler tarayıcınızda otomatik kaydedilir (`localStorage`).</span>
            <button
              onClick={() => {
                if (confirm('Örnek Kıdemli Yazılım Mimarı CV verilerine sıfırlamak istiyor musunuz?')) {
                  setCvData(DEFAULT_CV_DATA);
                }
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Örnek Veriye Sıfırla
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live High-DPI A4 Canvas Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111114] border border-zinc-800/80 rounded-2xl corpus-card-glow p-4 flex flex-col items-center sticky top-20">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı A4 Baskı Önizlemesi ({previewMode === 'cv' ? 'Özgeçmiş' : 'Ön Yazı'})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.05).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                title="Küçült"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-zinc-400 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(0.65, +(z + 0.05).toFixed(2)))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                title="Büyüt"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* A4 Canvas Viewport */}
          <div className="w-full overflow-auto bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-4 flex justify-center max-h-[75vh]">
            <div
              style={{
                width: `${Math.round(1588 * zoom)}px`,
                height: `${Math.round(2246 * zoom)}px`,
              }}
              className="shadow-2xl rounded-sm overflow-hidden bg-white shrink-0 transition-all"
            >
              <canvas
                ref={canvasRef}
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

      {/* Install Desktop / Mobile App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <MonitorDown className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Corpus CV Studio Masaüstü & Mobil Kurulum
                  </h3>
                  <p className="text-xs text-zinc-400">100% Çevrimdışı Çalışan Yerel Uygulama</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">1. Windows Masaüstü Başlatıcısı (.BAT)</div>
                <p className="text-zinc-400">
                  Tarayıcı sekmesi olmadan bağımsız masaüstü penceresinde açmak için başlatıcıyı indirin:
                </p>
                <button
                  onClick={handleDownloadDesktopLauncher}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium cursor-pointer"
                >
                  Windows Masaüstü Başlatıcısını İndir (.bat)
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="font-semibold text-zinc-100">2. Chrome / Edge / Mobil PWA Kurulumu</div>
                <p className="text-zinc-400">
                  Adres çubuğunun sağındaki <strong>"Uygulamayı Yükle"</strong> ikonuna tıklayarak veya mobilde{' '}
                  <strong>"Ana Ekrana Ekle"</strong> seçeneğiyle cihazınıza kurabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Corpus Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-xs text-zinc-500 flex flex-wrap items-center justify-between max-w-[1600px] w-full mx-auto gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Corpus Platform • <strong>#007 Corpus CV & Portfolio Studio Pro</strong> — Kişisel verileriniz asla buluta yüklenmez.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">
          300 DPI Retina A4 PDF Engine • ATS Keyword Analyzer
        </span>
      </footer>
    </div>
  );
}
