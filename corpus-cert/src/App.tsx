import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Users,
  Stamp,
  FileText,
  Download,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_CERT_CONFIG,
  CERT_TEMPLATES,
  type CertConfig,
  type CertTemplateKey,
  renderCertificateToCanvas,
  exportSingleCertPng,
  exportCertificatesToPdf,
} from './utils/certEngine';

type CertStudioTab = 'content' | 'recipients' | 'sign-seal';

export default function App() {
  const [cfg, setCfg] = useState<CertConfig>(() => {
    try {
      const saved = localStorage.getItem('corpus_cert_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CERT_CONFIG;
    } catch {
      return DEFAULT_CERT_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<CertStudioTab>('content');
  const [zoom, setZoom] = useState<number>(0.48);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_cert_config_v1', JSON.stringify(cfg));
    } catch {
      // ignore
    }
  }, [cfg]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderCertificateToCanvas(canvasRef.current, cfg, cfg.recipientName, 1);
  }, [cfg]);

  const handleSelectTemplate = (key: CertTemplateKey) => {
    setCfg(CERT_TEMPLATES[key].build());
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    exportSingleCertPng(canvasRef.current, cfg.recipientName);
    confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportPdf = async (batchMode: boolean) => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      await exportCertificatesToPdf(canvasRef.current, cfg, batchMode);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Cert, Diploma & Badge Studio Pro (#020)',
      'echo Corpus Sertifika ve Diploma Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5192',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Cert-Studio-Pro.bat';
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
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Cert, Diploma & Badge Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #020 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Altın Varak Mühürlü Kurumsal Sertifika, QR Doğrulama Kodu & Toplu (Batch) A4 PDF Diploma Üretici
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Toplu Liste:</span>
              <strong className="text-emerald-400">
                {cfg.batchRecipients.length} Katılımcı Hazır
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
          {/* Left: 4 Certificate Templates */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {(
                Object.entries(CERT_TEMPLATES) as [
                  CertTemplateKey,
                  (typeof CERT_TEMPLATES)[CertTemplateKey],
                ][]
              ).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    cfg.templateKey === key
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Export Single PNG / Single PDF / Batch Multi-Page PDF */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              4K PNG İndir
            </button>

            <button
              onClick={() => handleExportPdf(false)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Tekil A4 PDF
            </button>

            <button
              onClick={() => handleExportPdf(true)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isExporting
                ? 'Hazırlanıyor...'
                : `Toplu PDF İndir (${cfg.batchRecipients.length} Kişi)`}
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'content', label: 'Belge & Program', icon: FileText },
              {
                id: 'recipients',
                label: `Katılımcılar (${cfg.batchRecipients.length})`,
                icon: Users,
              },
              { id: 'sign-seal', label: 'Mühür, QR & İmza', icon: Stamp },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as CertStudioTab)}
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
            {/* TAB 1: CONTENT */}
            {activeTab === 'content' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Veren Kurum / Akademi Adı
                    </label>
                    <input
                      type="text"
                      value={cfg.institutionName}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, institutionName: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Alt Fakülte / Komite Başlığı
                    </label>
                    <input
                      type="text"
                      value={cfg.institutionSub}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, institutionSub: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Sertifika Ana Başlığı
                  </label>
                  <input
                    type="text"
                    value={cfg.headerTitle}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, headerTitle: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Eğitim / Uzmanlık Programı Adı
                  </label>
                  <input
                    type="text"
                    value={cfg.programTitle}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, programTitle: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Başarı & Tamamlama Açıklama Metni
                  </label>
                  <textarea
                    rows={3}
                    value={cfg.achievementDescription}
                    onChange={(e) =>
                      setCfg((p) => ({
                        ...p,
                        achievementDescription: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Veriliş Tarihi
                    </label>
                    <input
                      type="date"
                      value={cfg.issueDate}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, issueDate: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Süre / AKTS Kredisi
                    </label>
                    <input
                      type="text"
                      value={cfg.durationHours}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, durationHours: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Seri No Öneki
                    </label>
                    <input
                      type="text"
                      value={cfg.serialPrefix}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, serialPrefix: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RECIPIENTS & BATCH GENERATOR */}
            {activeTab === 'recipients' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Aktif Önizlenen Katılımcı Adı Soyadı
                  </label>
                  <input
                    type="text"
                    value={cfg.recipientName}
                    onChange={(e) =>
                      setCfg((p) => ({ ...p, recipientName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-violet-500/50 text-sm font-semibold text-zinc-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-200">
                      Toplu Katılımcı Listesi (Her Satıra 1 Ad Soyad Yazın)
                    </label>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {cfg.batchRecipients.length} kişi
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={cfg.batchRecipients.join('\n')}
                    onChange={(e) => {
                      const list = e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setCfg((p) => ({
                        ...p,
                        batchRecipients: list,
                        recipientName: list[0] || p.recipientName,
                      }));
                    }}
                    placeholder="Her satıra bir isim yazın..."
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200"
                  />
                </div>

                {/* Clickable Recipient Chips */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-400">
                    Önizlemek İçin Katılımcıya Tıklayın:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.batchRecipients.map((name, i) => (
                      <button
                        key={i}
                        onClick={() => setCfg((p) => ({ ...p, recipientName: name }))}
                        className={`px-2.5 py-1 rounded-lg text-xs border cursor-pointer transition-all ${
                          cfg.recipientName === name
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        #{i + 1} {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SIGNATURES, SEAL & THEME */}
            {activeTab === 'sign-seal' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      1. İmza Yetkilisi Adı
                    </label>
                    <input
                      type="text"
                      value={cfg.signer1Name}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, signer1Name: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      1. İmza Yetkilisi Ünvanı
                    </label>
                    <input
                      type="text"
                      value={cfg.signer1Role}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, signer1Role: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      2. İmza Yetkilisi Adı
                    </label>
                    <input
                      type="text"
                      value={cfg.signer2Name}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, signer2Name: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      2. İmza Yetkilisi Ünvanı
                    </label>
                    <input
                      type="text"
                      value={cfg.signer2Role}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, signer2Role: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Altın Varak Mühür Üst Metni
                    </label>
                    <input
                      type="text"
                      value={cfg.sealTitle}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, sealTitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Altın Varak Mühür Alt Metni
                    </label>
                    <input
                      type="text"
                      value={cfg.sealSub}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, sealSub: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-xs text-zinc-300">Altın Varak Rengi</span>
                    <input
                      type="color"
                      value={cfg.primaryGold}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, primaryGold: e.target.value }))
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-xs text-zinc-300">Çerçeve Rengi</span>
                    <input
                      type="color"
                      value={cfg.accentBorder}
                      onChange={(e) =>
                        setCfg((p) => ({ ...p, accentBorder: e.target.value }))
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.darkPrestigeTheme}
                      onChange={(e) =>
                        setCfg((p) => ({
                          ...p,
                          darkPrestigeTheme: e.target.checked,
                        }))
                      }
                    />
                    <span>Koyu Prestij</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.showGoldRibbonSeal}
                      onChange={(e) =>
                        setCfg((p) => ({
                          ...p,
                          showGoldRibbonSeal: e.target.checked,
                        }))
                      }
                    />
                    <span>Altın Rozet</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.showQrVerification}
                      onChange={(e) =>
                        setCfg((p) => ({
                          ...p,
                          showQrVerification: e.target.checked,
                        }))
                      }
                    />
                    <span>Doğrulama QR</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live A4 Landscape Certificate Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı A4 Yatay Sertifika & Diploma Önizlemesi ({cfg.recipientName})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.32, +(z - 0.06).toFixed(2)))}
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

          <div className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-5 overflow-auto flex justify-center items-center min-h-[540px] corpus-card-glow">
            <div
              style={{
                width: 1600 * zoom,
                height: 1131 * zoom,
              }}
              className="relative shadow-2xl rounded-lg overflow-hidden border border-zinc-800"
            >
              <canvas
                ref={canvasRef}
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
                    Corpus Cert & Diploma Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız Sertifika & Berat Stüdyosu</p>
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
                <span>Tek tıkla onlarca kişiye özel seri numaralı ve QR kodlu toplu A4 PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tamamen çevrimdışı çalışır, katılımcı listesi cihazınızdan çıkmaz</span>
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
              %100 İstemci Taraflı A4 Sertifika & Batch PDF Motoru — Katılımcı verileriniz cihazınızdan çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #020 • Certifier.io / Accredible Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
