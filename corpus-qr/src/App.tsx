import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Contact,
  Wifi,
  Globe,
  MessageCircle,
  Landmark,
  MapPin,
  Palette,
  Download,
  FileCode2,
  FileText,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  DEFAULT_QR_CONFIG,
  COLOR_THEMES,
  type QrStudioConfig,
  type QrMode,
  type CardLayoutType,
  type ErrorCorrection,
  buildQrPayload,
  downloadVcfFile,
  exportQrToSvg,
  renderQrStudioToCanvas,
  exportQrCanvasToPng,
  exportQrCanvasToPdf,
} from './utils/qrEngine';

type StudioTab = 'payload' | 'design';

export default function App() {
  const [config, setConfig] = useState<QrStudioConfig>(() => {
    try {
      const saved = localStorage.getItem('corpus_qr_config_v1');
      return saved ? JSON.parse(saved) : DEFAULT_QR_CONFIG;
    } catch {
      return DEFAULT_QR_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('payload');
  const [zoom, setZoom] = useState<number>(0.52);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_qr_config_v1', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderQrStudioToCanvas(canvasRef.current, config);
  }, [config]);

  const rawPayload = useMemo(() => buildQrPayload(config), [config]);

  const handleModeChange = (mode: QrMode) => {
    const defaultHeadlines: Record<QrMode, { h: string; s: string }> = {
      vcard: {
        h: 'Kameranızla Okutun',
        s: 'Rehbere Tek Tıkla Kaydet • Dijital vCard 3.0',
      },
      wifi: {
        h: 'Ücretsiz Misafir Wi-Fi',
        s: 'Şifre Yazmadan Kamerayla Otomatik Bağlanın',
      },
      url: {
        h: 'Dijital Menü & Web Sayfası',
        s: 'Kameranızla Okutarak Hemen Görüntüleyin',
      },
      whatsapp: {
        h: 'WhatsApp Destek Hattı',
        s: 'Okutarak Doğrudan Sohbet Başlatın',
      },
      iban: {
        h: 'TR IBAN & FAST Transfer',
        s: 'Banka Uygulamanızla Okutarak Gönderin',
      },
      location: {
        h: 'Konum & Yol Tarifi',
        s: 'Haritalarda Açmak İçin Kodu Okutun',
      },
    };
    setConfig((prev) => ({
      ...prev,
      mode,
      headline: defaultHeadlines[mode].h,
      subheadline: defaultHeadlines[mode].s,
    }));
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    exportQrCanvasToPng(canvasRef.current, config.mode);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  const handleExportPdf = () => {
    if (!canvasRef.current) return;
    exportQrCanvasToPdf(canvasRef.current, config);
    confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportSvg = async () => {
    await exportQrToSvg(config);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus QR, vCard & Wi-Fi Stand Studio Pro (#017)',
      'echo Corpus QR ve Dijital Kartvizit Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5189',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-QR-Studio-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canvasDims =
    config.layout === 'business-card'
      ? { w: 1400, h: 800 }
      : config.layout === 'stand-vertical'
      ? { w: 1000, h: 1400 }
      : { w: 1000, h: 1000 };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus QR, vCard & Wi-Fi Stand Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #017 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Dijital Kartvizit (vCard 3.0), Otomatik Wi-Fi Standı, WhatsApp, TR IBAN, Konum & Vektörel QR Stüdyosu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Hata Toleransı:</span>
              <strong className="text-emerald-400">
                Seviye {config.ecc} (%30’a Kadar Logolu Okuma)
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
          {/* Left: 6 QR Payload Modes + Layout */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {(
                [
                  { id: 'vcard', label: 'vCard Kartvizit', icon: Contact },
                  { id: 'wifi', label: 'Wi-Fi Otomatik', icon: Wifi },
                  { id: 'url', label: 'Web / Menü', icon: Globe },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                  { id: 'iban', label: 'TR IBAN', icon: Landmark },
                  { id: 'location', label: 'Harita Konum', icon: MapPin },
                ] as { id: QrMode; label: string; icon: typeof Contact }[]
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      config.mode === m.id
                        ? 'bg-violet-600 text-white shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <select
              value={config.layout}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  layout: e.target.value as CardLayoutType,
                }))
              }
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
            >
              <option value="business-card">Şablon: Yatay Kurumsal Kartvizit</option>
              <option value="stand-vertical">Şablon: Dikey Masaüstü Standı</option>
              <option value="qr-badge">Şablon: Saf Kare Logolu QR (1:1)</option>
            </select>
          </div>

          {/* Right: Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              Vektörel SVG
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              A4 Baskı PDF
            </button>

            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              4K PNG Kart İndir
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'payload', label: '1. QR İçeriği & Bilgiler', icon: QrCode },
              { id: 'design', label: '2. Tasarım, Logo & Renkler', icon: Palette },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as StudioTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
            {/* TAB 1: PAYLOAD */}
            {activeTab === 'payload' && (
              <div className="space-y-4">
                {config.mode === 'vcard' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-violet-300">
                        Dijital Kartvizit (vCard 3.0) Bilgileri
                      </span>
                      <button
                        onClick={() => downloadVcfFile(config.vcard)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] text-emerald-300 cursor-pointer"
                      >
                        .VCF Rehber Dosyası İndir
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          value={config.vcard.fullName}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              vcard: { ...p.vcard, fullName: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Ünvan / Görev
                        </label>
                        <input
                          type="text"
                          value={config.vcard.jobTitle}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              vcard: { ...p.vcard, jobTitle: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Şirket / Kurum
                        </label>
                        <input
                          type="text"
                          value={config.vcard.company}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              vcard: { ...p.vcard, company: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Mobil Telefon
                        </label>
                        <input
                          type="text"
                          value={config.vcard.phone}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              vcard: { ...p.vcard, phone: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          E-Posta Adresi
                        </label>
                        <input
                          type="text"
                          value={config.vcard.email}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              vcard: { ...p.vcard, email: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Web Sitesi
                        </label>
                        <input
                          type="text"
                          value={config.vcard.website}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              vcard: { ...p.vcard, website: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        İş Adresi
                      </label>
                      <input
                        type="text"
                        value={config.vcard.address}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            vcard: { ...p.vcard, address: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                {config.mode === 'wifi' && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-violet-300">
                      Kablosuz Ağ (Wi-Fi) Otomatik Bağlantı Ayarları
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Wi-Fi Ağ Adı (SSID)
                      </label>
                      <input
                        type="text"
                        value={config.wifi.ssid}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            wifi: { ...p.wifi, ssid: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Wi-Fi Şifresi
                      </label>
                      <input
                        type="text"
                        value={config.wifi.password}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            wifi: { ...p.wifi, password: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Şifreleme Türü
                        </label>
                        <select
                          value={config.wifi.encryption}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              wifi: {
                                ...p.wifi,
                                encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        >
                          <option value="WPA">WPA / WPA2 / WPA3</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Şifresiz Açık Ağ</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 pt-5 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.wifi.hidden}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              wifi: { ...p.wifi, hidden: e.target.checked },
                            }))
                          }
                        />
                        <span>Gizli SSID Ağı</span>
                      </label>
                    </div>
                  </div>
                )}

                {config.mode === 'url' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-violet-300">
                      Hedef Web Sitesi / QR Menü / Kampanya Bağlantısı
                    </label>
                    <input
                      type="url"
                      value={config.urlValue}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, urlValue: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                )}

                {config.mode === 'whatsapp' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        WhatsApp Telefon Numarası (Ülke Koduyla)
                      </label>
                      <input
                        type="text"
                        value={config.whatsapp.phone}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            whatsapp: { ...p.whatsapp, phone: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Hazır Karşılama Mesajı
                      </label>
                      <textarea
                        rows={3}
                        value={config.whatsapp.message}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            whatsapp: { ...p.whatsapp, message: e.target.value },
                          }))
                        }
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                {config.mode === 'iban' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Hesap Sahibi Ad Soyad / Ticaret Ünvanı
                      </label>
                      <input
                        type="text"
                        value={config.iban.holderName}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            iban: { ...p.iban, holderName: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        TR IBAN Numarası
                      </label>
                      <input
                        type="text"
                        value={config.iban.iban}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            iban: { ...p.iban, iban: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Banka Adı
                        </label>
                        <input
                          type="text"
                          value={config.iban.bankName}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              iban: { ...p.iban, bankName: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Açıklama Notu
                        </label>
                        <input
                          type="text"
                          value={config.iban.note}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              iban: { ...p.iban, note: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {config.mode === 'location' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Mekan / Ofis Adı
                      </label>
                      <input
                        type="text"
                        value={config.location.placeName}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            location: { ...p.location, placeName: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Enlem (Latitude)
                        </label>
                        <input
                          type="text"
                          value={config.location.latitude}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              location: { ...p.location, latitude: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Boylam (Longitude)
                        </label>
                        <input
                          type="text"
                          value={config.location.longitude}
                          onChange={(e) =>
                            setConfig((p) => ({
                              ...p,
                              location: { ...p.location, longitude: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Payload Preview */}
                <div className="pt-2">
                  <div className="text-[11px] text-zinc-500 mb-1">
                    Üretilen Standart QR Veri Paketi (ISO/IEC 18004):
                  </div>
                  <pre className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-28">
                    {rawPayload}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: DESIGN & BRANDING */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5">
                    Kurumsal Renk Teması
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_THEMES.map((c) => (
                      <button
                        key={c.name}
                        onClick={() =>
                          setConfig((p) => ({
                            ...p,
                            accentColor: c.accent,
                            fgColor: c.fg,
                          }))
                        }
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                          config.accentColor === c.accent
                            ? 'bg-zinc-900 border-white'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: c.accent }}
                        />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Merkez Monogram / Logo Harfi (Maks 4)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={config.centerBadgeText}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, centerBadgeText: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Hata Düzeltme Seviyesi (ECC)
                    </label>
                    <select
                      value={config.ecc}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          ecc: e.target.value as ErrorCorrection,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    >
                      <option value="H">H — Yüksek (%30 Logolu Okuma)</option>
                      <option value="Q">Q — Çeyrek (%25 Tolerans)</option>
                      <option value="M">M — Orta (%15 Tolerans)</option>
                      <option value="L">L — Düşük (%7 Tolerans)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCenterBadge}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          showCenterBadge: e.target.checked,
                        }))
                      }
                    />
                    <span>QR Ortasında Marka Rozeti Göster</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.darkCardTheme}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          darkCardTheme: e.target.checked,
                        }))
                      }
                    />
                    <span>Koyu (Dark) Kart Tasarımı</span>
                  </label>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Kart Çağrı Başlığı
                    </label>
                    <input
                      type="text"
                      value={config.headline}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, headline: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Alt Açıklama Satırı
                    </label>
                    <input
                      type="text"
                      value={config.subheadline}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, subheadline: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live 4K QR Card / Stand Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı Baskı & Dijital Kart Önizlemesi ({canvasDims.w} × {canvasDims.h} px)
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
                width: canvasDims.w * zoom,
                height: canvasDims.h * zoom,
              }}
              className="relative shadow-2xl rounded-2xl overflow-hidden border border-zinc-800"
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
                    Corpus QR & vCard Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız QR, Kartvizit & Wi-Fi Stand Stüdyosu</p>
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
                <span>Süresiz çalışan statik QR kodlar (abonelik bittiğinde kapanmaz!)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>4K PNG, Vektörel SVG, A4 Baskı PDF ve .VCF Rehber çıktısı</span>
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
              %100 İstemci Taraflı ISO/IEC 18004 QR Motoru — Üretilen QR kodlar ömür boyu ücretsiz çalışır.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #017 • Uniqode / Bitly QR / Popl Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
