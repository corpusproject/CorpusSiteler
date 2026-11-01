import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Scale,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  Code2,
  Terminal,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Globe,
  Cookie,
  Building2,
  Database,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  type PrivacyProject,
  type LegalDocType,
  type DataInventoryRow,
  type CookieItem,
  type CookieCategory,
  PRIVACY_PRESETS,
  COOKIE_CATEGORY_META,
  calculatePrivacyMetrics,
  generateLegalDocumentText,
  generateCookieBannerSnippet,
  renderPrivacyArchitectureCanvas,
  exportVerbisExcel,
} from './utils/privacyEngine';

const DOC_TABS: { id: LegalDocType; label: string; badge: string }[] = [
  { id: 'kvkk-aydinlatma', label: '1. KVKK Aydınlatma Metni', badge: 'm.10 Zorunlu' },
  { id: 'acik-riza', label: '2. Açık Rıza & İYS Beyanı', badge: 'm.5/1 & ETK' },
  { id: 'gdpr-privacy', label: '3. EU GDPR Privacy & RoPA', badge: 'Art. 13/30' },
  { id: 'cookie-policy', label: '4. Çerez (Cookie) Politikası', badge: 'ePrivacy' },
  { id: 'terms-of-service', label: '5. SaaS Kullanım Koşulları (ToS)', badge: 'TBK / SLA' },
  { id: 'retention-policy', label: '6. Veri Saklama & İmha Politikası', badge: 'Yönetmelik m.11' },
];

export function App() {
  const [project, setProject] = useState<PrivacyProject>(() =>
    JSON.parse(JSON.stringify(PRIVACY_PRESETS['b2b-ai-saas']))
  );
  const [leftTab, setLeftTab] = useState<'company' | 'inventory' | 'cookies' | 'banner'>(
    'inventory'
  );
  const [rightMode, setRightMode] = useState<'canvas' | 'documents' | 'cmp-widget'>(
    'canvas'
  );
  const [activeDocType, setActiveDocType] = useState<LegalDocType>('kvkk-aydinlatma');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simulatedConsentState, setSimulatedConsentState] = useState<{
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
  }>({
    analytics: false,
    functional: true,
    marketing: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const metrics = useMemo(() => calculatePrivacyMetrics(project), [project]);
  const legalMarkdown = useMemo(
    () => generateLegalDocumentText(project, activeDocType),
    [project, activeDocType]
  );
  const cmpScriptCode = useMemo(
    () => generateCookieBannerSnippet(project),
    [project]
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    renderPrivacyArchitectureCanvas(canvasRef.current, project);
  }, [project, rightMode]);

  const copyText = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleAddInventoryRow = () => {
    const newRow: DataInventoryRow = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      categoryId: 'transaction',
      categoryName: `Özel Veri Kategorisi (${project.inventory.length + 1})`,
      dataFields: 'Departman Kayıtları, Görev Atamaları, Sistem Logları',
      dataSubjectGroup: 'Kurumsal Kullanıcılar',
      processingPurpose: 'Hizmet kalitesinin artırılması ve operasyonel denetim',
      legalBasisKvkk: 'KVKK m.5/2-(f) Meşru Menfaat',
      legalBasisGdpr: 'GDPR Art. 6(1)(f) Legitimate Interest',
      retentionPeriod: '5 Yıl',
      destructionMethod: 'Periyodik Veritabanı Anonimleştirme',
      recipients: 'Yetkili Denetim Kuruluşları',
      crossBorderTransfer: false,
      encryptionStandard: 'AES-256-GCM',
      riskLevel: 'MEDIUM',
      enabled: true,
    };
    setProject((prev) => ({
      ...prev,
      inventory: [...prev.inventory, newRow],
    }));
  };

  const updateInventoryRow = (id: string, patch: Partial<DataInventoryRow>) => {
    setProject((prev) => ({
      ...prev,
      inventory: prev.inventory.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const handleAddCookie = () => {
    const newCk: CookieItem = {
      id: `ck-${Date.now().toString().slice(-4)}`,
      name: '_corpus_custom_metric',
      provider: project.websiteUrl,
      category: 'analytics',
      duration: '6 Ay',
      purpose: 'Kullanıcı oturum akışı ve performans ölçümü.',
      firstParty: true,
      enabled: true,
    };
    setProject((prev) => ({
      ...prev,
      cookies: [...prev.cookies, newCk],
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    renderPrivacyArchitectureCanvas(canvasRef.current, project);
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-VERBIS-Veri-Haritasi.png`;
    a.click();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleDownloadMarkdownDoc = () => {
    const blob = new Blob([legalMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-${activeDocType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batContent = `@echo off
title Corpus Legal, KVKK/GDPR & Cookie Policy Studio (#031 PRO)
echo Starting Corpus Privacy Studio on http://localhost:5203 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-privacy"
start http://localhost:5203
npm run dev -- --port 5203
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS LEGAL, KVKK/GDPR & COOKIE STUDIO
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                #031 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              VERBİS Veri Envanteri (RoPA), 6 Hukuki Sözleşme Üretici, CMP Çerez Banner Kodu & 4K Veri Haritası
            </p>
          </div>
        </div>

        {/* Live Compliance Pill */}
        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Uyumluluk Skoru:</span>
            <span className="font-bold text-emerald-400">%{metrics.complianceScore}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Veri Kategorisi:</span>
            <span className="font-bold text-white">{metrics.activeInventoryCount} Aktif</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Cookie className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Çerez & Alt İşleyen:</span>
            <span className="font-bold text-amber-400">
              {metrics.activeCookiesCount} Çerez / {metrics.subProcessorCount} DPA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={() => exportVerbisExcel(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>VERBİS Excel (.XLSX)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K Veri Haritası İndir</span>
          </button>
        </div>
      </header>

      {/* TOP PRESET & VIEW SWITCHER BAR */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Sektörel Hukuk Paketi:
          </span>
          <button
            onClick={() =>
              setProject(JSON.parse(JSON.stringify(PRIVACY_PRESETS['b2b-ai-saas'])))
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              project.id === 'b2b-ai-saas'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            🤖 B2B Bulut & Yapay Zeka SaaS Platformu (KVKK m.9 + GDPR SCC)
          </button>
          <button
            onClick={() =>
              setProject(JSON.parse(JSON.stringify(PRIVACY_PRESETS['fintech-mobile-app'])))
            }
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              project.id === 'fintech-mobile-app'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            🏦 FinTech Elektronik Para & Mobil Cüzdan (BDDK + MASAK + KVKK)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Sağ Stüdyo Modu:</span>
          {(
            [
              { id: 'canvas', label: '1. 4K VERBİS & RoPA Haritası' },
              { id: 'documents', label: '2. Hukuki Metin & Sözleşme Üretici (6 Belge)' },
              { id: 'cmp-widget', label: '3. Canlı CMP Çerez Banner & JS Kodu' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setRightMode(m.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                rightMode === m.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SPLIT STUDIO WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT CONFIGURATION PANEL (5 COLS) */}
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[calc(100vh-112px)]">
          {/* Left Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
            {[
              { id: 'inventory', label: 'Veri Envanteri', icon: Database },
              { id: 'company', label: 'Veri Sorumlusu', icon: Building2 },
              { id: 'cookies', label: 'Çerez & DPA', icon: Cookie },
              { id: 'banner', label: 'CMP Banner', icon: Globe },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    leftTab === t.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: VERBIS & GDPR DATA INVENTORY */}
            {leftTab === 'inventory' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    VERBİS & GDPR m.30 Kişisel Veri Envanteri ({project.inventory.length})
                  </span>
                  <button
                    onClick={handleAddInventoryRow}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Veri Kategorisi Ekle</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {project.inventory.map((row) => (
                    <div
                      key={row.id}
                      className={`p-3 rounded-xl border transition space-y-2 ${
                        row.enabled
                          ? 'bg-zinc-900/80 border-zinc-800'
                          : 'bg-zinc-950/50 border-zinc-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateInventoryRow(row.id, { enabled: !row.enabled })
                          }
                          className="flex items-center gap-1.5 text-xs font-bold text-white text-left"
                        >
                          {row.enabled ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                          )}
                          <span>{row.categoryName}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <select
                            value={row.riskLevel}
                            onChange={(e) =>
                              updateInventoryRow(row.id, {
                                riskLevel: e.target.value as DataInventoryRow['riskLevel'],
                              })
                            }
                            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] font-mono text-amber-400"
                          >
                            <option value="LOW">LOW RISK</option>
                            <option value="MEDIUM">MEDIUM RISK</option>
                            <option value="HIGH">HIGH RISK</option>
                            <option value="CRITICAL">CRITICAL (Özel Nitelikli)</option>
                          </select>
                          <button
                            onClick={() =>
                              setProject((prev) => ({
                                ...prev,
                                inventory: prev.inventory.filter((i) => i.id !== row.id),
                              }))
                            }
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            İşlenen Veri Alanları
                          </label>
                          <input
                            type="text"
                            value={row.dataFields}
                            onChange={(e) =>
                              updateInventoryRow(row.id, { dataFields: e.target.value })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            İşleme Amacı
                          </label>
                          <input
                            type="text"
                            value={row.processingPurpose}
                            onChange={(e) =>
                              updateInventoryRow(row.id, {
                                processingPurpose: e.target.value,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            KVKK Hukuki Sebep
                          </label>
                          <input
                            type="text"
                            value={row.legalBasisKvkk}
                            onChange={(e) =>
                              updateInventoryRow(row.id, {
                                legalBasisKvkk: e.target.value,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-cyan-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            Saklama Süresi
                          </label>
                          <input
                            type="text"
                            value={row.retentionPeriod}
                            onChange={(e) =>
                              updateInventoryRow(row.id, {
                                retentionPeriod: e.target.value,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-amber-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            Şifreleme Standardı
                          </label>
                          <input
                            type="text"
                            value={row.encryptionStandard}
                            onChange={(e) =>
                              updateInventoryRow(row.id, {
                                encryptionStandard: e.target.value,
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={row.crossBorderTransfer}
                            onChange={(e) =>
                              updateInventoryRow(row.id, {
                                crossBorderTransfer: e.target.checked,
                              })
                            }
                            className="accent-amber-500"
                          />
                          <span>Yurt Dışı Aktarım (KVKK m.9 Standart Sözleşme / SCC)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: COMPANY & DATA CONTROLLER DETAILS */}
            {leftTab === 'company' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Veri Sorumlusu Sicil & DPO İletişim Bilgileri
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Resmi Ticaret Unvanı (Veri Sorumlusu)
                  </label>
                  <input
                    type="text"
                    value={project.companyName}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, companyName: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">MERSİS No</label>
                    <input
                      type="text"
                      value={project.mersisNo}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, mersisNo: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Ticaret Sicil No
                    </label>
                    <input
                      type="text"
                      value={project.tradeRegistryNo}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, tradeRegistryNo: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      KEP (Kayıtlı E-Posta) Adresi
                    </label>
                    <input
                      type="text"
                      value={project.kepAddress}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, kepAddress: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      DPO / KVKK Başvuru E-Postası
                    </label>
                    <input
                      type="text"
                      value={project.dpoEmail}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, dpoEmail: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Merkez Tebligat Adresi
                  </label>
                  <input
                    type="text"
                    value={project.headquartersAddress}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        headquartersAddress: e.target.value,
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Web Sitesi / Alan Adı
                    </label>
                    <input
                      type="text"
                      value={project.websiteUrl}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, websiteUrl: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Yetkili Mahkeme & İcra Dairesi
                    </label>
                    <input
                      type="text"
                      value={project.jurisdictionCity}
                      onChange={(e) =>
                        setProject((p) => ({ ...p, jurisdictionCity: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COOKIES & SUB-PROCESSORS */}
            {leftTab === 'cookies' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">
                    Çerez (Cookie) Envanteri ({project.cookies.length})
                  </span>
                  <button
                    onClick={handleAddCookie}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Çerez Ekle
                  </button>
                </div>

                <div className="space-y-2">
                  {project.cookies.map((ck) => (
                    <div
                      key={ck.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={ck.name}
                          onChange={(e) =>
                            setProject((prev) => ({
                              ...prev,
                              cookies: prev.cookies.map((c) =>
                                c.id === ck.id ? { ...c, name: e.target.value } : c
                              ),
                            }))
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono font-bold text-white"
                        />
                        <select
                          value={ck.category}
                          onChange={(e) =>
                            setProject((prev) => ({
                              ...prev,
                              cookies: prev.cookies.map((c) =>
                                c.id === ck.id
                                  ? { ...c, category: e.target.value as CookieCategory }
                                  : c
                              ),
                            }))
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-amber-300"
                        >
                          {Object.entries(COOKIE_CATEGORY_META).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            setProject((prev) => ({
                              ...prev,
                              cookies: prev.cookies.filter((c) => c.id !== ck.id),
                            }))
                          }
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={ck.purpose}
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            cookies: prev.cookies.map((c) =>
                              c.id === ck.id ? { ...c, purpose: e.target.value } : c
                            ),
                          }))
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CMP BANNER CONFIG */}
            {leftTab === 'banner' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-cyan-400 uppercase">
                  CMP Çerez Onay Banner & Consent Mode v2 Ayarları
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Banner Başlığı</label>
                  <input
                    type="text"
                    value={project.bannerConfig.headline}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        bannerConfig: { ...p.bannerConfig, headline: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Aydınlatma Açıklaması
                  </label>
                  <textarea
                    rows={3}
                    value={project.bannerConfig.description}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        bannerConfig: { ...p.bannerConfig, description: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Kabul Et Butonu
                    </label>
                    <input
                      type="text"
                      value={project.bannerConfig.acceptAllLabel}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          bannerConfig: {
                            ...p.bannerConfig,
                            acceptAllLabel: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Reddet Butonu (Eşit Görünürlük İlkesi)
                    </label>
                    <input
                      type="text"
                      value={project.bannerConfig.rejectAllLabel}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          bannerConfig: {
                            ...p.bannerConfig,
                            rejectAllLabel: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT MULTI-MODE WORKSPACE (7 COLS) */}
        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          {/* MODE 1: 4K ARCHITECTURE CANVAS */}
          <div className={rightMode === 'canvas' ? 'block space-y-3' : 'hidden'}>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                Canlı 4K (1920×1080) VERBİS Kişisel Veri Envanteri, Alt İşleyenler & CMP Haritası
              </span>
              <button
                onClick={handleExportPNG}
                className="text-emerald-400 hover:underline font-semibold"
              >
                4K PNG Olarak İndir →
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {/* MODE 2: 6 FULL LEGAL DOCUMENTS GENERATOR */}
          {rightMode === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DOC_TABS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocType(doc.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      activeDocType === doc.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-emerald-400">
                      {doc.badge}
                    </div>
                    <div className="text-xs font-semibold mt-0.5">{doc.label}</div>
                  </button>
                ))}
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Otomatik Oluşturulan Resmi Hukuk Metni
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyText('legal-doc', legalMarkdown)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
                    >
                      {copiedKey === 'legal-doc' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Metni Kopyala</span>
                    </button>
                    <button
                      onClick={handleDownloadMarkdownDoc}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.MD İndir</span>
                    </button>
                  </div>
                </div>
                <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed max-h-[540px] overflow-y-auto">
                  {legalMarkdown}
                </pre>
              </div>
            </div>
          )}

          {/* MODE 3: INTERACTIVE CMP COOKIE BANNER SIMULATOR & EMBED CODE */}
          {rightMode === 'cmp-widget' && (
            <div className="space-y-4">
              {/* Interactive Cookie Modal Simulator */}
              <div className="bg-zinc-900/80 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">
                      {project.bannerConfig.headline}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Google Consent Mode v2 Aktif
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {project.bannerConfig.description}
                </p>

                {/* Granular Category Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400">
                        Zorunlu Güvenlik Çerezleri
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Oturum ve CSRF güvenliği (Kapatılamaz)
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      HER ZAMAN AKTİF
                    </span>
                  </div>

                  <label className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-sky-400">
                        İşlevsel & Tercih Çerezleri
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Dil ve karanlık mod ayarlarını korur
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={simulatedConsentState.functional}
                      onChange={(e) =>
                        setSimulatedConsentState((s) => ({
                          ...s,
                          functional: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-emerald-500"
                    />
                  </label>

                  <label className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-violet-400">
                        Performans & Analitik (analytics_storage)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Anonim trafik ve hata ölçümü
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={simulatedConsentState.analytics}
                      onChange={(e) =>
                        setSimulatedConsentState((s) => ({
                          ...s,
                          analytics: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-emerald-500"
                    />
                  </label>

                  <label className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-amber-400">
                        Pazarlama & Hedefleme (ad_storage)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Kampanya dönüşüm ve yeniden hedefleme
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={simulatedConsentState.marketing}
                      onChange={(e) =>
                        setSimulatedConsentState((s) => ({
                          ...s,
                          marketing: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-emerald-500"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() =>
                      setSimulatedConsentState({
                        functional: true,
                        analytics: true,
                        marketing: true,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    {project.bannerConfig.acceptAllLabel}
                  </button>
                  <button
                    onClick={() =>
                      setSimulatedConsentState({
                        functional: false,
                        analytics: false,
                        marketing: false,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                  >
                    {project.bannerConfig.rejectAllLabel}
                  </button>
                </div>
              </div>

              {/* Embeddable Script Box */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" /> Web Sitenize Gömülebilir Sıfır-Bağımlılıklı CMP Kodu
                  </span>
                  <button
                    onClick={() => copyText('cmp-script', cmpScriptCode)}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
                  >
                    {copiedKey === 'cmp-script' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Script Kopyala</span>
                  </button>
                </div>
                <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[300px]">
                  {cmpScriptCode}
                </pre>
              </div>
            </div>
          )}
        </section>
      </main>

      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Masaüstü .BAT Başlatıcı (#031 Corpus Privacy)
              </h3>
              <button
                onClick={() => setShowLauncherModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Kapat ✕
              </button>
            </div>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 font-mono overflow-x-auto">
              {batContent}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => copyText('bat', batContent)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedKey === 'bat' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'bat' ? 'Kopyalandı!' : '.BAT Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
