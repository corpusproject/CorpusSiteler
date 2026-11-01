import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Barcode,
  Tag,
  FileSpreadsheet,
  Wifi,
  Contact,
  Landmark,
  MessageCircle,
  Globe,
  Mail,
  Type,
  Download,
  Sparkles,
  RefreshCw,
  Upload,
  Plus,
  Trash2,
  MonitorDown,
  Lock,
  Check,
  X,
  ArrowRight,
  Printer,
  Copy,
} from 'lucide-react';

import {
  type QrPresetType,
  type QrDesignConfig,
  type BarcodeFormatType,
  type BarcodeConfig,
  type LabelTemplateType,
  type LabelDesignState,
  type BatchLabelRow,
  DEFAULT_QR_CONFIG,
  DEFAULT_LABEL_STATE,
  buildQrPayload,
  renderStyledQrToCanvas,
  generateValidTurkishEan13,
  renderBarcodeCardToCanvas,
  renderIndustrialLabelToCanvas,
  getSampleBatchCatalog,
  parseBatchExcelFile,
  exportBatchCatalogToA4Pdf,
  canvasToPdfBytes,
} from './utils/labelEngine';

type StudioTab = 'qr' | 'barcode' | 'label' | 'batch';

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

function downloadCanvasAsPng(canvas: HTMLCanvasElement | null, filename: string) {
  if (!canvas) return;
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadUint8Array(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('qr');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // 1. Custom QR State
  const [qrConfig, setQrConfig] = useState<QrDesignConfig>(DEFAULT_QR_CONFIG);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Barcode State
  const [barcodeCfg, setBarcodeCfg] = useState<BarcodeConfig>({
    format: 'EAN13',
    value: '8690142589632',
    title: 'Corpus Pro Kablosuz Klavye',
    priceText: '2.799,00 TL',
    barWidth: 2.6,
    barHeight: 95,
    displayValue: true,
    lineColor: '#09090b',
    background: '#ffffff',
  });
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3. Industrial Label Designer State
  const [labelState, setLabelState] = useState<LabelDesignState>(DEFAULT_LABEL_STATE);
  const labelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4. Batch Excel Print State
  const [batchRows, setBatchRows] = useState<BatchLabelRow[]>(() => getSampleBatchCatalog());
  const [isExportingBatch, setIsExportingBatch] = useState<boolean>(false);

  // PWA / Desktop Installer
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const notify = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Re-render QR Canvas when qrConfig or activeTab changes
  useEffect(() => {
    if (activeTab === 'qr' && qrCanvasRef.current) {
      renderStyledQrToCanvas(qrCanvasRef.current, qrConfig, 640);
    }
  }, [activeTab, qrConfig]);

  // Re-render Barcode Canvas when barcodeCfg or activeTab changes
  useEffect(() => {
    if (activeTab === 'barcode' && barcodeCanvasRef.current) {
      const res = renderBarcodeCardToCanvas(barcodeCanvasRef.current, barcodeCfg);
      setBarcodeError(res.valid ? null : res.error || null);
    }
  }, [activeTab, barcodeCfg]);

  // Re-render Label Canvas when labelState or activeTab changes
  useEffect(() => {
    if (activeTab === 'label' && labelCanvasRef.current) {
      renderIndustrialLabelToCanvas(labelCanvasRef.current, labelState);
    }
  }, [activeTab, labelState]);

  // Desktop App Installer
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallModal(false);
        triggerConfetti();
        notify('Corpus Label & QR Studio cihazınıza kuruldu!');
        return;
      }
    }
    setShowInstallModal(true);
  };

  const handleDownloadDesktopLauncher = () => {
    const appUrl = window.location.origin;
    const batContent = `@echo off
title Corpus Label & QR Studio Pro (#005)
start "" msedge --app="${appUrl}" 2>nul || start "" chrome --app="${appUrl}" 2>nul || start "" "${appUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Label-QR-Masaustu-Uygulamasi.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerConfetti();
    notify('Masaüstü başlatıcısı (.bat) indirildi!');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col justify-between relative selection:bg-violet-500/30 corpus-grid-bg">
      {/* Ambient Top Glow */}
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
      {/* CORPUS UNIFIED HEADER (#005)                                        */}
      {/* =================================================================== */}
      <header className="relative z-20 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-zinc-900 border border-violet-500/40 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.45)]">
              <QrCode className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-zinc-100 text-sm sm:text-base">
                Corpus
              </span>
              <span className="text-zinc-600 font-light">/</span>
              <span className="font-medium text-zinc-300 text-sm sm:text-base">
                Label & QR Studio
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-violet-300 border border-violet-500/30">
              #005 PRO
            </span>
          </div>

          {/* Center Suite Navigation */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800/90">
            {(
              [
                { id: 'qr', label: 'Özel Logolu QR Stüdyo', icon: QrCode },
                { id: 'barcode', label: 'EAN-13 & Code128 Barkod', icon: Barcode },
                { id: 'label', label: 'Raf & Kargo Etiketi Tasarımcı', icon: Tag },
                { id: 'batch', label: 'Excel Toplu Etiket PDF Basım', icon: FileSpreadsheet },
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

          {/* Right Security Badge + Install Desktop App */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3 h-3 text-violet-400" />
              <span className="font-medium text-[11px]">Süresiz QR • 100% Yerel Üretim</span>
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

        {/* Mobile / Tablet Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-zinc-800/60 bg-zinc-950/70">
          {(
            [
              { id: 'qr', label: 'Özel QR', icon: QrCode },
              { id: 'barcode', label: 'Barkod', icon: Barcode },
              { id: 'label', label: 'Etiket Tasarla', icon: Tag },
              { id: 'batch', label: 'Excel Toplu Basım', icon: FileSpreadsheet },
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
      {/* MAIN STUDIO WORKSPACE                                               */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* ================================================================= */}
        {/* TAB 1: CUSTOM LOGO QR STUDIO (WI-FI, VCARD, IBAN, WHATSAPP, URL)  */}
        {/* ================================================================= */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Payload & Style Customizer */}
            <div className="lg:col-span-7 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-6 corpus-card-glow space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  1. Karekod Türü Seçin (Akıllı Şablonlar)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {(
                    [
                      { id: 'wifi', label: 'Wi-Fi Bağlantı', icon: Wifi, badge: 'WI-FI BAĞLAN' },
                      { id: 'vcard', label: 'vCard Kartvizit', icon: Contact, badge: 'REHBERE EKLE' },
                      { id: 'iban', label: 'TR IBAN Ödeme', icon: Landmark, badge: 'IBAN ÖDEME' },
                      { id: 'whatsapp', label: 'WhatsApp Mesaj', icon: MessageCircle, badge: 'WHATSAPP YAZ' },
                      { id: 'url', label: 'Web Sitesi / Menü', icon: Globe, badge: 'MENÜYÜ GÖR' },
                      { id: 'email', label: 'E-Posta Gönder', icon: Mail, badge: 'E-POSTA AT' },
                      { id: 'text', label: 'Serbest Metin / Kod', icon: Type, badge: 'BİZİ TARAYIN' },
                    ] as const
                  ).map((p) => {
                    const Icon = p.icon;
                    const active = qrConfig.preset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          setQrConfig((c) => ({
                            ...c,
                            preset: p.id as QrPresetType,
                            frameText: p.badge,
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-violet-600/20 border-violet-500 text-violet-200'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-violet-400 mb-1.5" />
                        <p className="text-xs font-medium">{p.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Form Fields by Preset */}
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-3">
                {qrConfig.preset === 'wifi' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        WI-FI AĞ ADI (SSID)
                      </label>
                      <input
                        type="text"
                        value={qrConfig.wifiSsid}
                        onChange={(e) =>
                          setQrConfig((c) => ({ ...c, wifiSsid: e.target.value }))
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        WI-FI ŞİFRESİ
                      </label>
                      <input
                        type="text"
                        value={qrConfig.wifiPassword}
                        onChange={(e) =>
                          setQrConfig((c) => ({ ...c, wifiPassword: e.target.value }))
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        GÜVENLİK
                      </label>
                      <select
                        value={qrConfig.wifiEncryption}
                        onChange={(e) =>
                          setQrConfig((c) => ({
                            ...c,
                            wifiEncryption: e.target.value as QrDesignConfig['wifiEncryption'],
                          }))
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Şifresiz (Açık Ağ)</option>
                      </select>
                    </div>
                  </div>
                )}

                {qrConfig.preset === 'vcard' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={qrConfig.vcardName}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, vcardName: e.target.value }))
                      }
                      placeholder="Ad Soyad"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.vcardOrg}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, vcardOrg: e.target.value }))
                      }
                      placeholder="Şirket / Kurum"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.vcardTitle}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, vcardTitle: e.target.value }))
                      }
                      placeholder="Unvan"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.vcardPhone}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, vcardPhone: e.target.value }))
                      }
                      placeholder="Telefon (+90...)"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.vcardEmail}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, vcardEmail: e.target.value }))
                      }
                      placeholder="E-posta"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.vcardWebsite}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, vcardWebsite: e.target.value }))
                      }
                      placeholder="Web Sitesi"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                )}

                {qrConfig.preset === 'iban' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={qrConfig.ibanHolder}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, ibanHolder: e.target.value }))
                      }
                      placeholder="Alıcı Ad Soyad / Unvan"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.ibanNumber}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, ibanNumber: e.target.value }))
                      }
                      placeholder="TR..."
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.ibanAmount}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, ibanAmount: e.target.value }))
                      }
                      placeholder="Tutar (TL)"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.ibanNote}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, ibanNote: e.target.value }))
                      }
                      placeholder="Açıklama"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                )}

                {qrConfig.preset === 'whatsapp' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={qrConfig.waPhone}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, waPhone: e.target.value }))
                      }
                      placeholder="Telefon (90532...)"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.waMessage}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, waMessage: e.target.value }))
                      }
                      placeholder="Hazır WhatsApp Mesajı"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                )}

                {qrConfig.preset === 'url' && (
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      HEDEF BAĞLANTI (URL / QR MENÜ ADRESİ)
                    </label>
                    <input
                      type="text"
                      value={qrConfig.url}
                      onChange={(e) => setQrConfig((c) => ({ ...c, url: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    />
                  </div>
                )}

                {qrConfig.preset === 'email' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={qrConfig.emailTo}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, emailTo: e.target.value }))
                      }
                      placeholder="Alıcı E-posta"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                    <input
                      type="text"
                      value={qrConfig.emailSubject}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, emailSubject: e.target.value }))
                      }
                      placeholder="Konu"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                )}

                {qrConfig.preset === 'text' && (
                  <textarea
                    rows={2}
                    value={qrConfig.rawText}
                    onChange={(e) => setQrConfig((c) => ({ ...c, rawText: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    placeholder="Serbest metin, seri no veya kripto cüzdan adresi..."
                  />
                )}
              </div>

              {/* Visual Brand Customizer */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200">
                  2. Tasarım, Çerçeve Metni & Merkez Logo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      ALT ÇERÇEVE SLOGANI
                    </label>
                    <input
                      type="text"
                      value={qrConfig.frameText}
                      onChange={(e) =>
                        setQrConfig((c) => ({ ...c, frameText: e.target.value }))
                      }
                      placeholder="WI-FI BAĞLAN"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      MERKEZ ROZET YAZISI
                    </label>
                    <input
                      type="text"
                      value={qrConfig.logoBadgeText}
                      onChange={(e) =>
                        setQrConfig((c) => ({
                          ...c,
                          logoBadgeText: e.target.value,
                          customLogoDataUrl: null,
                        }))
                      }
                      placeholder="CORPUS"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      ÖZEL LOGO GÖRSELİ
                    </label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = () =>
                          setQrConfig((c) => ({
                            ...c,
                            customLogoDataUrl: r.result as string,
                          }));
                        r.readAsDataURL(f);
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-violet-400" />
                      <span>{qrConfig.customLogoDataUrl ? 'Logo Değiştir' : 'Logo Yükle'}</span>
                    </button>
                  </div>
                </div>

                {/* Color Palette */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Çerçeve & Vurgu Rengi:</span>
                    {['#8b5cf6', '#10b981', '#09090b', '#e11d48', '#2563eb', '#d97706'].map(
                      (col) => (
                        <button
                          key={col}
                          onClick={() =>
                            setQrConfig((c) => ({
                              ...c,
                              frameColor: col,
                              fgColor: col === '#09090b' ? '#09090b' : '#18181b',
                            }))
                          }
                          className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                            qrConfig.frameColor === col
                              ? 'scale-125 border-white'
                              : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: High-Res QR Preview & Export */}
            <div className="lg:col-span-5 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-6 corpus-card-glow flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Canlı 4K Vektör Önizleme
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                  Hata Düzeltme: Seviye {qrConfig.errorLevel} (%30)
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center py-4 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                <canvas
                  ref={qrCanvasRef}
                  className="max-w-[290px] w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 truncate">
                  {buildQrPayload(qrConfig)}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      downloadCanvasAsPng(qrCanvasRef.current, `Corpus-QR-${qrConfig.preset}.png`);
                      triggerConfetti();
                      notify('Yüksek çözünürlüklü PNG QR kod indirildi!');
                    }}
                    className="py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>HD PNG İndir</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!qrCanvasRef.current) return;
                      const pdfBytes = await canvasToPdfBytes(qrCanvasRef.current);
                      downloadUint8Array(pdfBytes, `Corpus-QR-${qrConfig.preset}.pdf`);
                      triggerConfetti();
                      notify('Baskıya hazır A4 QR PDF indirildi!');
                    }}
                    className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Baskı PDF İndir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: INDUSTRIAL BARCODE GENERATOR (EAN-13, CODE128, UPC, ITF14) */}
        {/* ================================================================= */}
        {activeTab === 'barcode' && (
          <div className="max-w-4xl w-full mx-auto rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-6 sm:p-8 corpus-card-glow space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Endüstriyel Barkod Üretici (EAN-13, Code128, Code39, ITF-14)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  GS1 Türkiye (869) uyumlu market, ürün ve lojistik barkodlarını doğrulama basamağıyla
                  üretin.
                </p>
              </div>

              <button
                onClick={() => {
                  const ean = generateValidTurkishEan13();
                  setBarcodeCfg((c) => ({ ...c, format: 'EAN13', value: ean }));
                  notify(`Geçerli Türkiye GS1 EAN-13 barkodu üretildi: ${ean}`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-violet-300 text-xs font-medium cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rastgele Geçerli 869 EAN-13 Üret</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  BARKOD STANDARDI
                </label>
                <select
                  value={barcodeCfg.format}
                  onChange={(e) => {
                    const fmt = e.target.value as BarcodeFormatType;
                    setBarcodeCfg((c) => ({
                      ...c,
                      format: fmt,
                      value:
                        fmt === 'EAN13'
                          ? '8690142589632'
                          : fmt === 'UPC'
                          ? '123456789999'
                          : fmt === 'ITF14'
                          ? '10012345678902'
                          : 'CRP-2026-8842',
                    }));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                >
                  <option value="EAN13">EAN-13 (Market / Perakende 13 Hane)</option>
                  <option value="CODE128">CODE-128 (Kargo / Alfa-Nümerik)</option>
                  <option value="CODE39">CODE-39 (Sanayi / Lojistik)</option>
                  <option value="UPC">UPC-A (ABD / Global 12 Hane)</option>
                  <option value="ITF14">ITF-14 (Koli / Palet 14 Hane)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  BARKOD NUMARASI / KODU
                </label>
                <input
                  type="text"
                  value={barcodeCfg.value}
                  onChange={(e) =>
                    setBarcodeCfg((c) => ({ ...c, value: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  ÜRÜN BAŞLIĞI (ÜST)
                </label>
                <input
                  type="text"
                  value={barcodeCfg.title}
                  onChange={(e) =>
                    setBarcodeCfg((c) => ({ ...c, title: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  SATIŞ FİYATI (SAĞ ÜST)
                </label>
                <input
                  type="text"
                  value={barcodeCfg.priceText}
                  onChange={(e) =>
                    setBarcodeCfg((c) => ({ ...c, priceText: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                />
              </div>
            </div>

            {barcodeError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs">
                {barcodeError}
              </div>
            )}

            <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
              <canvas ref={barcodeCanvasRef} className="max-w-full h-auto rounded-xl shadow-xl" />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(barcodeCfg.value);
                  notify(`Barkod numarası kopyalandı: ${barcodeCfg.value}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Numarayı Kopyala</span>
              </button>

              <button
                onClick={() => {
                  downloadCanvasAsPng(
                    barcodeCanvasRef.current,
                    `Barkod-${barcodeCfg.value}.png`
                  );
                  triggerConfetti();
                  notify('Barkod PNG olarak indirildi!');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Barkod PNG İndir</span>
              </button>

              <button
                onClick={async () => {
                  if (!barcodeCanvasRef.current) return;
                  const pdfBytes = await canvasToPdfBytes(barcodeCanvasRef.current);
                  downloadUint8Array(pdfBytes, `Barkod-${barcodeCfg.value}.pdf`);
                  triggerConfetti();
                  notify('Barkod PDF olarak indirildi!');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Baskı PDF İndir</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: BARTENDER / ZEBRA LABEL DESIGNER (RETAIL, CARGO, ASSET)    */}
        {/* ================================================================= */}
        {activeTab === 'label' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Cols: Label Editor */}
            <div className="lg:col-span-6 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-6 corpus-card-glow space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  BarTender / Zebra Termal Etiket Şablonu
                </h2>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {(
                    [
                      { id: 'retail-price', label: 'Mağaza Raf & Fiyat' },
                      { id: 'shipping-cargo', label: '100×150mm Kargo' },
                      { id: 'asset-tag', label: 'Demirbaş Envanter' },
                    ] as const
                  ).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() =>
                        setLabelState((s) => ({
                          ...s,
                          template: tpl.id as LabelTemplateType,
                        }))
                      }
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                        labelState.template === tpl.id
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {labelState.template === 'shipping-cargo' ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      GÖNDERİCİ DEPO / FİRMA
                    </label>
                    <input
                      type="text"
                      value={labelState.senderName}
                      onChange={(e) =>
                        setLabelState((s) => ({ ...s, senderName: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        ALICI AD SOYAD / FİRMA
                      </label>
                      <input
                        type="text"
                        value={labelState.receiverName}
                        onChange={(e) =>
                          setLabelState((s) => ({ ...s, receiverName: e.target.value }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        ALICI TELEFON
                      </label>
                      <input
                        type="text"
                        value={labelState.receiverPhone}
                        onChange={(e) =>
                          setLabelState((s) => ({ ...s, receiverPhone: e.target.value }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      TESLİMAT ADRESİ
                    </label>
                    <input
                      type="text"
                      value={labelState.receiverAddress}
                      onChange={(e) =>
                        setLabelState((s) => ({ ...s, receiverAddress: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        KARGO TAKİP BARKOD NO
                      </label>
                      <input
                        type="text"
                        value={labelState.cargoTrackingNo}
                        onChange={(e) =>
                          setLabelState((s) => ({ ...s, cargoTrackingNo: e.target.value }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        SİPARİŞ / SKU REF
                      </label>
                      <input
                        type="text"
                        value={labelState.skuCode}
                        onChange={(e) =>
                          setLabelState((s) => ({ ...s, skuCode: e.target.value }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      ÜRÜN / DEMİRBAŞ ADI
                    </label>
                    <input
                      type="text"
                      value={labelState.productName}
                      onChange={(e) =>
                        setLabelState((s) => ({ ...s, productName: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        SKU / ENVANTER KODU
                      </label>
                      <input
                        type="text"
                        value={labelState.skuCode}
                        onChange={(e) =>
                          setLabelState((s) => ({ ...s, skuCode: e.target.value }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        BARKOD NUMARASI
                      </label>
                      <input
                        type="text"
                        value={labelState.barcodeValue}
                        onChange={(e) =>
                          setLabelState((s) => ({ ...s, barcodeValue: e.target.value }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                      />
                    </div>
                  </div>

                  {labelState.template === 'retail-price' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          ESKİ FİYAT
                        </label>
                        <input
                          type="text"
                          value={labelState.oldPrice}
                          onChange={(e) =>
                            setLabelState((s) => ({ ...s, oldPrice: e.target.value }))
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          YENİ SATIŞ FİYATI
                        </label>
                        <input
                          type="text"
                          value={labelState.newPrice}
                          onChange={(e) =>
                            setLabelState((s) => ({ ...s, newPrice: e.target.value }))
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          DEPARTMAN
                        </label>
                        <input
                          type="text"
                          value={labelState.assetDepartment}
                          onChange={(e) =>
                            setLabelState((s) => ({ ...s, assetDepartment: e.target.value }))
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          CİHAZ SERİ NO
                        </label>
                        <input
                          type="text"
                          value={labelState.assetSerial}
                          onChange={(e) =>
                            setLabelState((s) => ({ ...s, assetSerial: e.target.value }))
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right 6 Cols: Live Thermal Label Canvas & Print */}
            <div className="lg:col-span-6 rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-6 corpus-card-glow flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase text-zinc-400">
                  Termal & Lazer Etiket Önizleme (300 DPI)
                </span>
                <span className="text-emerald-400 font-mono">Zebra / BarTender Uyumlu</span>
              </div>

              <div className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 flex items-center justify-center">
                <canvas
                  ref={labelCanvasRef}
                  className="max-h-[420px] w-auto object-contain rounded-lg shadow-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    downloadCanvasAsPng(labelCanvasRef.current, `Etiket-${labelState.skuCode}.png`);
                    triggerConfetti();
                    notify('Termal etiket PNG olarak indirildi!');
                  }}
                  className="py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Etiket PNG İndir</span>
                </button>

                <button
                  onClick={async () => {
                    if (!labelCanvasRef.current) return;
                    const pdfBytes = await canvasToPdfBytes(labelCanvasRef.current);
                    downloadUint8Array(pdfBytes, `Etiket-${labelState.skuCode}.pdf`);
                    triggerConfetti();
                    notify('Baskıya hazır Termal/A4 Etiket PDF indirildi!');
                  }}
                  className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Termal / A4 PDF İndir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: BATCH EXCEL TO A4 MULTI-LABEL SHEET PDF PRINTER            */}
        {/* ================================================================= */}
        {activeTab === 'batch' && (
          <div className="max-w-5xl w-full mx-auto rounded-2xl bg-[#111114]/95 border border-zinc-800/90 p-6 corpus-card-glow space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Excel / CSV Toplu Ürün Etiketi Basım Stüdyosu (A4 12'li Kesimli Sayfa)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Yüzlerce ürünü Excel'den yükleyin veya aşağıdaki tabloyu düzenleyip tek tıkla A4
                  çoklu barkod/QR etiket sayfası PDF'i alın.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-violet-400" />
                  <span>Excel / CSV Yükle</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const parsed = await parseBatchExcelFile(f);
                      if (parsed.length > 0) {
                        setBatchRows(parsed);
                        notify(`${parsed.length} ürün Excel tablosundan aktarıldı!`);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() =>
                    setBatchRows((prev) => [
                      ...prev,
                      {
                        id: `new-${Date.now()}`,
                        name: `Yeni Ürün #${prev.length + 1}`,
                        sku: `CRP-${101 + prev.length}`,
                        price: '1.250 TL',
                        barcode: generateValidTurkishEan13(),
                        qrLink: 'https://corpus.app',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Satır Ekle</span>
                </button>

                <button
                  disabled={batchRows.length === 0 || isExportingBatch}
                  onClick={async () => {
                    setIsExportingBatch(true);
                    try {
                      const pdfBytes = await exportBatchCatalogToA4Pdf(batchRows);
                      downloadUint8Array(pdfBytes, 'Corpus-A4-Toplu-Etiket-Sayfasi.pdf');
                      triggerConfetti();
                      notify(
                        `${batchRows.length} ürünlük A4 Çoklu Etiket Baskı PDF'i başarıyla indirildi!`
                      );
                    } finally {
                      setIsExportingBatch(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {isExportingBatch
                      ? 'A4 Sayfası Hazırlanıyor...'
                      : `A4 Toplu Etiket PDF İndir (${batchRows.length} Etiket)`}
                  </span>
                </button>
              </div>
            </div>

            {/* Editable Data Grid */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 max-h-[440px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-900 text-zinc-300 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Ürün Adı</th>
                    <th className="py-2.5 px-3">SKU Kodu</th>
                    <th className="py-2.5 px-3">Satış Fiyatı</th>
                    <th className="py-2.5 px-3">Barkod No</th>
                    <th className="py-2.5 px-3">QR Bağlantısı</th>
                    <th className="py-2.5 px-3 text-right">Sil</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((row, idx) => (
                    <tr key={row.id} className="border-t border-zinc-800/70">
                      <td className="py-2 px-3 font-mono text-zinc-500">{idx + 1}</td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) =>
                            setBatchRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, name: e.target.value } : r
                              )
                            )
                          }
                          className="w-full bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1 text-zinc-100"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) =>
                            setBatchRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, sku: e.target.value } : r
                              )
                            )
                          }
                          className="w-28 bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.price}
                          onChange={(e) =>
                            setBatchRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, price: e.target.value } : r
                              )
                            )
                          }
                          className="w-28 bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1 font-mono text-emerald-300"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.barcode}
                          onChange={(e) =>
                            setBatchRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, barcode: e.target.value } : r
                              )
                            )
                          }
                          className="w-36 bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-200"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.qrLink}
                          onChange={(e) =>
                            setBatchRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, qrLink: e.target.value } : r
                              )
                            )
                          }
                          className="w-44 bg-zinc-900/70 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-400"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          onClick={() =>
                            setBatchRows((prev) => prev.filter((r) => r.id !== row.id))
                          }
                          className="text-zinc-500 hover:text-rose-400 cursor-pointer"
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
      </main>

      {/* =================================================================== */}
      {/* DESKTOP & MOBILE APP INSTALLER MODAL                                */}
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
                    Corpus Label & QR Studio Masaüstü Kurulumu
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    BarTender & Zebra Designer Masaüstü Deneyimi
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
                  <span>Corpus Label & QR Masaüstü Uygulamasını İndir (.bat)</span>
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
      {/* CORPUS UNIFIED FOOTER (#005)                                        */}
      {/* =================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900/90 py-4 px-4 sm:px-6 text-center">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Corpus Platform</span>
            <span>•</span>
            <span>Site #005 of 100 — Corpus QR, Barcode & Label Studio Pro</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Custom QR • GS1 EAN-13 & Code128 • Thermal Label & Batch A4 PDF Print
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
