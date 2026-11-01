import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Receipt,
  Building2,
  QrCode,
  TrendingUp,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  MonitorDown,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  Palette,
  X,
} from 'lucide-react';
import {
  DEFAULT_INVOICE_DATA,
  INITIAL_LEDGER_ENTRIES,
  type InvoiceDocumentData,
  type DocumentKind,
  type CurrencyCode,
  type TevkifatRate,
  type LedgerEntry,
  calculateInvoiceTotals,
  formatMoney,
  renderInvoiceToA4Canvas,
  exportInvoiceCanvasToPdf,
  exportInvoiceAndLedgerToExcel,
} from './utils/invoiceEngine';

type EditorTab = 'items' | 'parties' | 'payment-stamp' | 'ledger';

const ACCENT_COLORS = [
  { name: 'Corpus Violet', hex: '#7c3aed' },
  { name: 'Finans Mavisi', hex: '#1d4ed8' },
  { name: 'Zümrüt Yeşili', hex: '#059669' },
  { name: 'Kurumsal Lacivert', hex: '#0f172a' },
  { name: 'Bordo Resmi', hex: '#b91c1c' },
];

export default function App() {
  const [docData, setDocData] = useState<InvoiceDocumentData>(() => {
    try {
      const saved = localStorage.getItem('corpus_invoice_doc_v1');
      return saved ? JSON.parse(saved) : DEFAULT_INVOICE_DATA;
    } catch {
      return DEFAULT_INVOICE_DATA;
    }
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('corpus_invoice_ledger_v1');
      return saved ? JSON.parse(saved) : INITIAL_LEDGER_ENTRIES;
    } catch {
      return INITIAL_LEDGER_ENTRIES;
    }
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('items');
  const [zoom, setZoom] = useState<number>(0.42);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const a4CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('corpus_invoice_doc_v1', JSON.stringify(docData));
    } catch {
      // ignore
    }
  }, [docData]);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_invoice_ledger_v1', JSON.stringify(ledger));
    } catch {
      // ignore
    }
  }, [ledger]);

  // Re-render A4 Invoice Canvas whenever docData changes
  useEffect(() => {
    if (!a4CanvasRef.current) return;
    renderInvoiceToA4Canvas(a4CanvasRef.current, docData);
  }, [docData]);

  const totals = useMemo(() => calculateInvoiceTotals(docData), [docData]);

  const ledgerStats = useMemo(() => {
    const totalIncome = ledger
      .filter((l) => l.type === 'income')
      .reduce((acc, l) => acc + l.amount, 0);
    const totalExpense = ledger
      .filter((l) => l.type === 'expense')
      .reduce((acc, l) => acc + l.amount, 0);
    const pendingIncome = ledger
      .filter((l) => l.type === 'income' && l.status !== 'paid')
      .reduce((acc, l) => acc + l.amount, 0);
    return {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      pendingIncome,
    };
  }, [ledger]);

  const handleExportPdf = async () => {
    if (!a4CanvasRef.current) return;
    setIsExporting(true);
    try {
      await exportInvoiceCanvasToPdf(a4CanvasRef.current, docData);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    exportInvoiceAndLedgerToExcel(docData, ledger);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleAddCurrentInvoiceToLedger = () => {
    const entry: LedgerEntry = {
      id: `ldg-${Date.now()}`,
      date: docData.issueDate,
      type: 'income',
      partyName: docData.client.companyName,
      docNo: docData.invoiceNo,
      amount: Math.round(totals.grandTotalPayable * 100) / 100,
      currency: docData.currency,
      status: 'pending',
    };
    setLedger((prev) => [entry, ...prev]);
    setActiveTab('ledger');
    confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Invoice, Quote & Finance Studio Pro (#011)',
      'echo Corpus Invoice & Finans Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5183',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Invoice-Studio-Pro.bat';
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
              <Receipt className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Invoice & Finance Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #011 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Kurumsal Fatura, Proforma Teklif, KDV/Tevkifat Motoru, FAST/IBAN QR & Cari Gelir-Gider Stüdyosu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Genel Toplam:</span>
              <strong className="text-emerald-400">
                {formatMoney(totals.grandTotalPayable, docData.currency)}
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
          {/* Left: Document Kind + Currency + Tevkifat */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">
              {(
                [
                  { id: 'invoice', label: 'Ticari / E-Arşiv Fatura' },
                  { id: 'proforma-quote', label: 'Proforma Fiyat Teklifi' },
                  { id: 'freelance-makbuz', label: 'Serbest Meslek Makbuzu' },
                ] as { id: DocumentKind; label: string }[]
              ).map((k) => (
                <button
                  key={k.id}
                  onClick={() => setDocData((p) => ({ ...p, kind: k.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    docData.kind === k.id
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            {/* Currency Selector */}
            <select
              value={docData.currency}
              onChange={(e) =>
                setDocData((p) => ({ ...p, currency: e.target.value as CurrencyCode }))
              }
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 cursor-pointer"
            >
              <option value="TRY">TRY (₺ Türk Lirası)</option>
              <option value="USD">USD ($ Amerikan Doları)</option>
              <option value="EUR">EUR (€ Euro)</option>
              <option value="GBP">GBP (£ Sterlin)</option>
            </select>

            {/* Tevkifat Selector */}
            <select
              value={docData.tevkifat}
              onChange={(e) =>
                setDocData((p) => ({ ...p, tevkifat: e.target.value as TevkifatRate }))
              }
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
            >
              <option value="none">KDV Tevkifatı: Yok</option>
              <option value="9/10">9/10 Tevkifat (Danışmanlık / Güvenlik)</option>
              <option value="7/10">7/10 Tevkifat (Yapım / Bakım / Onarım)</option>
              <option value="5/10">5/10 Tevkifat (Yazılım / Hizmet)</option>
              <option value="4/10">4/10 Tevkifat (İşgücü / Organizasyon)</option>
              <option value="2/10">2/10 Tevkifat (Taşımacılık / Lojistik)</option>
            </select>

            {/* Accent Color Swatches */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800/80">
              <Palette className="w-3.5 h-3.5 text-zinc-400 mr-0.5" />
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setDocData((p) => ({ ...p, accentColor: c.hex }))}
                  title={c.name}
                  className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                    docData.accentColor === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-75'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Right: Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddCurrentInvoiceToLedger}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-emerald-300 flex items-center gap-1.5 cursor-pointer"
              title="Bu faturayı Cari Gelir-Gider defterine kaydet"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Cari Deftere İşle</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel (.XLSX)</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'PDF Hazırlanıyor...' : 'A4 PDF Fatura İndir'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Editor & Ledger (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111114] border border-zinc-800/80 rounded-2xl corpus-card-glow overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-zinc-800/80 bg-zinc-950/60 p-1.5 gap-1">
            {(
              [
                { id: 'items', label: 'Hizmet Kalemleri & KDV', icon: Receipt },
                { id: 'parties', label: 'Satıcı & Müşteri (Cari)', icon: Building2 },
                { id: 'payment-stamp', label: 'IBAN QR, Kaşe & Notlar', icon: QrCode },
                { id: 'ledger', label: 'Cari Gelir-Gider Defteri', icon: TrendingUp },
              ] as { id: EditorTab; label: string; icon: typeof Receipt }[]
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

          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* TAB 1: LINE ITEMS & TAX SUMMARY */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Fatura / Teklif No</label>
                    <input
                      type="text"
                      value={docData.invoiceNo}
                      onChange={(e) => setDocData((p) => ({ ...p, invoiceNo: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Düzenleme Tarihi</label>
                    <input
                      type="text"
                      value={docData.issueDate}
                      onChange={(e) => setDocData((p) => ({ ...p, issueDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Son Ödeme / Vade</label>
                    <input
                      type="text"
                      value={docData.dueDate}
                      onChange={(e) => setDocData((p) => ({ ...p, dueDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Fatura / Teklif Kalemleri ({docData.items.length})
                  </h3>
                  <button
                    onClick={() =>
                      setDocData((p) => ({
                        ...p,
                        items: [
                          ...p.items,
                          {
                            id: `it-${Date.now()}`,
                            description: 'Yeni Hizmet veya Ürün Kalemi',
                            quantity: 1,
                            unit: 'Adet',
                            unitPrice: 15000,
                            discountPct: 0,
                            vatRate: 20,
                          },
                        ],
                      }))
                    }
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Yeni Kalem Ekle
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {docData.items.map((item, idx) => {
                    const lineNet =
                      item.quantity * item.unitPrice * (1 - item.discountPct / 100);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-violet-400 font-semibold">
                            Kalem #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              Net: {formatMoney(lineNet, docData.currency)}
                            </span>
                            {docData.items.length > 1 && (
                              <button
                                onClick={() =>
                                  setDocData((p) => ({
                                    ...p,
                                    items: p.items.filter((x) => x.id !== item.id),
                                  }))
                                }
                                className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            setDocData((p) => ({
                              ...p,
                              items: p.items.map((x) =>
                                x.id === item.id ? { ...x, description: e.target.value } : x
                              ),
                            }))
                          }
                          placeholder="Hizmet veya ürün açıklaması..."
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">Miktar</label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                setDocData((p) => ({
                                  ...p,
                                  items: p.items.map((x) =>
                                    x.id === item.id
                                      ? { ...x, quantity: Number(e.target.value) || 0 }
                                      : x
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">Birim</label>
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                setDocData((p) => ({
                                  ...p,
                                  items: p.items.map((x) =>
                                    x.id === item.id ? { ...x, unit: e.target.value } : x
                                  ),
                                }))
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200"
                            >
                              <option value="Adet">Adet</option>
                              <option value="Saat">Saat</option>
                              <option value="Ay">Ay</option>
                              <option value="Proje">Proje</option>
                              <option value="Lisans">Lisans</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">
                              Birim Fiyat
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) =>
                                setDocData((p) => ({
                                  ...p,
                                  items: p.items.map((x) =>
                                    x.id === item.id
                                      ? { ...x, unitPrice: Number(e.target.value) || 0 }
                                      : x
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">
                              İskonto (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPct}
                              onChange={(e) =>
                                setDocData((p) => ({
                                  ...p,
                                  items: p.items.map((x) =>
                                    x.id === item.id
                                      ? { ...x, discountPct: Number(e.target.value) || 0 }
                                      : x
                                  ),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-0.5">KDV (%)</label>
                            <select
                              value={item.vatRate}
                              onChange={(e) =>
                                setDocData((p) => ({
                                  ...p,
                                  items: p.items.map((x) =>
                                    x.id === item.id
                                      ? { ...x, vatRate: Number(e.target.value) }
                                      : x
                                  ),
                                }))
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-zinc-200"
                            >
                              <option value={20}>%20 KDV</option>
                              <option value={10}>%10 KDV</option>
                              <option value={1}>%1 KDV</option>
                              <option value={0}>%0 (İstisna)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Totals Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Ara Toplam (Brüt):</span>
                    <span className="font-mono">{formatMoney(totals.grossSubtotal, docData.currency)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Toplam İskonto (-):</span>
                      <span className="font-mono">-{formatMoney(totals.totalDiscount, docData.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-200 font-medium">
                    <span>KDV Matrahı (Net):</span>
                    <span className="font-mono">{formatMoney(totals.netTaxableSubtotal, docData.currency)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Hesaplanan KDV Toplamı:</span>
                    <span className="font-mono">{formatMoney(totals.totalVat, docData.currency)}</span>
                  </div>
                  {totals.withheldVat > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>KDV Tevkifatı ({docData.tevkifat}) (-):</span>
                      <span className="font-mono">-{formatMoney(totals.withheldVat, docData.currency)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold text-emerald-400">
                    <span>ÖDENECEK GENEL TOPLAM:</span>
                    <span className="font-mono">{formatMoney(totals.grandTotalPayable, docData.currency)}</span>
                  </div>
                  <div className="text-[11px] text-violet-300 font-medium pt-1">
                    {totals.amountInTurkishWords}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SENDER & CLIENT INFO */}
            {activeTab === 'parties' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-violet-400">
                    1. SATICI / DÜZENLEYEN FİRMA BİLGİLERİ
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      value={docData.sender.companyName}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          sender: { ...p.sender, companyName: e.target.value },
                        }))
                      }
                      placeholder="Firma Unvanı"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.sender.taxOffice}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          sender: { ...p.sender, taxOffice: e.target.value },
                        }))
                      }
                      placeholder="Vergi Dairesi"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.sender.taxNo}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          sender: { ...p.sender, taxNo: e.target.value },
                        }))
                      }
                      placeholder="VKN / TCKN"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono"
                    />
                    <input
                      type="text"
                      value={docData.sender.iban}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          sender: { ...p.sender, iban: e.target.value },
                        }))
                      }
                      placeholder="TR IBAN Numarası"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono"
                    />
                    <input
                      type="text"
                      value={docData.sender.bankName}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          sender: { ...p.sender, bankName: e.target.value },
                        }))
                      }
                      placeholder="Banka & Şube Adı"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.sender.address}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          sender: { ...p.sender, address: e.target.value },
                        }))
                      }
                      placeholder="Adres"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-emerald-400">
                    2. SAYIN / MÜŞTERİ (ALICI CARİ) BİLGİLERİ
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      value={docData.client.companyName}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          client: { ...p.client, companyName: e.target.value },
                        }))
                      }
                      placeholder="Müşteri Firma Unvanı"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.client.taxOffice}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          client: { ...p.client, taxOffice: e.target.value },
                        }))
                      }
                      placeholder="Müşteri Vergi Dairesi"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.client.taxNo}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          client: { ...p.client, taxNo: e.target.value },
                        }))
                      }
                      placeholder="Müşteri VKN / TCKN"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono"
                    />
                    <input
                      type="text"
                      value={docData.client.contactPerson}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          client: { ...p.client, contactPerson: e.target.value },
                        }))
                      }
                      placeholder="İlgili Kişi / Departman"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                    <input
                      type="text"
                      value={docData.client.address}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          client: { ...p.client, address: e.target.value },
                        }))
                      }
                      placeholder="Müşteri Adresi"
                      className="sm:col-span-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENT QR, STAMP & NOTES */}
            {activeTab === 'payment-stamp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docData.showIbanQr}
                      onChange={(e) =>
                        setDocData((p) => ({ ...p, showIbanQr: e.target.checked }))
                      }
                      className="accent-violet-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-semibold text-zinc-100">
                        FAST / IBAN Ödeme Karekodu Göster
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        IBAN ve ödenecek net tutarı içeren QR kod basar.
                      </div>
                    </div>
                  </label>

                  <label className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docData.showStampAndSignature}
                      onChange={(e) =>
                        setDocData((p) => ({
                          ...p,
                          showStampAndSignature: e.target.checked,
                        }))
                      }
                      className="accent-violet-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-semibold text-zinc-100">
                        Kurumsal Kaşe & Islak İmza Bas
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Sağ alt köşeye resmi şirket kaşesi ve imza ekler.
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Fatura / Proforma Alt Notu & Banka Açıklaması
                  </label>
                  <textarea
                    rows={4}
                    value={docData.notes}
                    onChange={(e) => setDocData((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: CARI GELİR-GİDER DEFTERİ (LEDGER) */}
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <div className="text-[11px] text-emerald-300">Toplam Faturalanan Gelir</div>
                    <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                      {formatMoney(ledgerStats.totalIncome, 'TRY')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <div className="text-[11px] text-rose-300">Toplam Şirket Gideri</div>
                    <div className="text-base font-mono font-bold text-rose-400 mt-0.5">
                      {formatMoney(ledgerStats.totalExpense, 'TRY')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25">
                    <div className="text-[11px] text-violet-300">Net Nakit Akışı (Kâr)</div>
                    <div className="text-base font-mono font-bold text-violet-400 mt-0.5">
                      {formatMoney(ledgerStats.netCashflow, 'TRY')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-300">
                    Cari Hareketler & Tahsilat Takibi
                  </h3>
                  <button
                    onClick={handleAddCurrentInvoiceToLedger}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                  >
                    + Aktif Faturayı Cariye Ekle
                  </button>
                </div>

                <div className="space-y-2">
                  {ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-zinc-100">{entry.partyName}</div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {entry.date} • Belge: {entry.docNo}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold ${
                            entry.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {entry.type === 'income' ? '+' : '-'}
                          {formatMoney(entry.amount, entry.currency)}
                        </span>

                        <button
                          onClick={() =>
                            setLedger((prev) =>
                              prev.map((x) =>
                                x.id === entry.id
                                  ? { ...x, status: x.status === 'paid' ? 'pending' : 'paid' }
                                  : x
                              )
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer ${
                            entry.status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {entry.status === 'paid' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ödendi</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Bekliyor</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live High-DPI A4 Invoice Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111114] border border-zinc-800/80 rounded-2xl corpus-card-glow p-4 flex flex-col items-center sticky top-20">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı A4 Resmi Fatura / Proforma Önizlemesi
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
                Corpus Invoice & Finans Masaüstü Kurulumu
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Corpus Invoice Studio'yu bağımsız masaüstü muhasebe uygulaması olarak başlatmak için tıklayın:
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
            Corpus Platform • <strong>#011 Corpus Invoice, Quote & Finance Studio Pro</strong> — Finansal verileriniz %100 cihazınızda saklanır.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">
          KDV & Tevkifat Engine • FAST/IBAN QR • 300 DPI A4 PDF & XLSX
        </span>
      </footer>
    </div>
  );
}
