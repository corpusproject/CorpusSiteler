import { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Scale,
  Building2,
  FileText,
  ShieldCheck,
  Stamp,
  Plus,
  Trash2,
  Download,
  FileType2,
  MonitorDown,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_CONTRACT_DATA,
  CONTRACT_TEMPLATES,
  type ContractData,
  type ContractTemplateKey,
  type ContractClause,
  auditContractProtection,
  formatCurrencyValue,
  renderContractToA4Canvas,
  exportContractCanvasToPdf,
  exportContractToWordDoc,
} from './utils/contractEngine';

type ContractEditorTab = 'clauses' | 'parties' | 'terms' | 'audit';

const QUICK_CLAUSE_SNIPPETS: Omit<ContractClause, 'id' | 'number'>[] = [
  {
    title: 'MÜCBİR SEBEP (FORCE MAJEURE) HÜKMÜ',
    body: 'Doğal afet, salgın hastalık, savaş, siber saldırı, genel internet kesintisi veya resmi makamların kararları gibi tarafların kontrolü dışında gelişen mücbir sebepler süresince yükümlülükler askıya alınır ve taraflar gecikmeden sorumlu tutulamaz.',
    category: 'termination',
    mandatory: false,
  },
  {
    title: 'HİZMET SEVİYESİ VE SLA TAAHHÜDÜ (%99,9 UPTIME)',
    body: 'YÜKLENİCİ, sunulan sistemlerin aylık bazda en az %99,9 oranında erişilebilir olacağını ve kritik arızalara en geç 2 (iki) saat içinde müdahale edileceğini taahhüt eder.',
    category: 'core',
    mandatory: false,
  },
  {
    title: 'ALT YÜKLENİCİ ÇALIŞTIRMA VE DEVİR YASAĞI',
    body: 'Taraflar, diğer tarafın yazılı ön onayı olmaksızın işbu sözleşmeden doğan hak ve borçlarını üçüncü kişilere devredemez.',
    category: 'core',
    mandatory: false,
  },
];

const ACCENT_COLORS = [
  { name: 'Corpus Violet', hex: '#7c3aed' },
  { name: 'Kurumsal Lacivert', hex: '#1e3a8a' },
  { name: 'Zümrüt Yeşili', hex: '#059669' },
  { name: 'Bordo Resmi', hex: '#991b1b' },
  { name: 'Kehribar Altın', hex: '#d97706' },
];

export default function App() {
  const [contract, setContract] = useState<ContractData>(() => {
    try {
      const saved = localStorage.getItem('corpus_contract_doc_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CONTRACT_DATA;
    } catch {
      return DEFAULT_CONTRACT_DATA;
    }
  });

  const [activeTab, setActiveTab] = useState<ContractEditorTab>('clauses');
  const [zoom, setZoom] = useState<number>(0.48);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const a4CanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('corpus_contract_doc_v1', JSON.stringify(contract));
    } catch {
      // ignore
    }
  }, [contract]);

  useEffect(() => {
    if (!a4CanvasRef.current) return;
    renderContractToA4Canvas(a4CanvasRef.current, contract);
  }, [contract]);

  const legalAudit = useMemo(() => auditContractProtection(contract), [contract]);

  const handleSelectTemplate = (key: ContractTemplateKey) => {
    setContract(CONTRACT_TEMPLATES[key].build());
  };

  const handleAddClause = (snippet?: Omit<ContractClause, 'id' | 'number'>) => {
    const nextNum = `MADDE ${contract.clauses.length + 1}`;
    const newClause: ContractClause = {
      id: `cl-${Date.now()}`,
      number: nextNum,
      title: snippet?.title || 'YENİ ÖZEL HÜKÜM BAŞLIĞI',
      body:
        snippet?.body ||
        'Taraflar işbu madde kapsamında kararlaştırılan özel yükümlülükleri eksiksiz yerine getirmeyi kabul ve taahhüt eder.',
      category: snippet?.category || 'core',
      mandatory: snippet?.mandatory ?? false,
    };
    setContract((prev) => ({
      ...prev,
      clauses: [...prev.clauses, newClause],
    }));
  };

  const handleUpdateClause = (id: string, patch: Partial<ContractClause>) => {
    setContract((prev) => ({
      ...prev,
      clauses: prev.clauses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const handleDeleteClause = (id: string) => {
    setContract((prev) => {
      const filtered = prev.clauses
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, number: `MADDE ${idx + 1}` }));
      return { ...prev, clauses: filtered };
    });
  };

  const handleExportPdf = async () => {
    if (!a4CanvasRef.current) return;
    setIsExporting(true);
    try {
      await exportContractCanvasToPdf(a4CanvasRef.current, contract);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = () => {
    exportContractToWordDoc(contract);
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Contract, NDA & Legal Studio Pro (#013)',
      'echo Corpus Sozlesme ve Hukuk Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5185',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Contract-Studio-Pro.bat';
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
              <Scale className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Contract, NDA & Legal Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #013 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Kurumsal Hizmet Sözleşmesi, Gizlilik (NDA), Freelance Telif Devri, 6698 KVKK Protokolü & Hukuki Risk Denetçisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <span>Hukuki Güvence Skoru:</span>
              <strong className="text-emerald-400">%{legalAudit.score} Uyumlu</strong>
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
          {/* Left: Contract Template Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1">
              {(
                Object.entries(CONTRACT_TEMPLATES) as [
                  ContractTemplateKey,
                  (typeof CONTRACT_TEMPLATES)[ContractTemplateKey],
                ][]
              ).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    contract.templateKey === key
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            <select
              value={contract.currency}
              onChange={(e) =>
                setContract((p) => ({
                  ...p,
                  currency: e.target.value as 'TRY' | 'USD' | 'EUR',
                }))
              }
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 cursor-pointer"
            >
              <option value="TRY">TRY (₺ Türk Lirası)</option>
              <option value="USD">USD ($ Amerikan Doları)</option>
              <option value="EUR">EUR (€ Euro)</option>
            </select>
          </div>

          {/* Right: Export Word & PDF */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <FileType2 className="w-3.5 h-3.5 text-blue-400" />
              Word (.DOC) İndir
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Hazırlanıyor...' : 'Resmi A4 PDF Sözleşme İndir'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Editor Panel (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
            {[
              { id: 'clauses', label: 'Maddeler', icon: FileText },
              { id: 'parties', label: 'Taraflar', icon: Building2 },
              { id: 'terms', label: 'Bedel & Mühür', icon: Stamp },
              { id: 'audit', label: `Denetim (%${legalAudit.score})`, icon: ShieldCheck },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as ContractEditorTab)}
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
            {/* TAB 1: CLAUSES */}
            {activeTab === 'clauses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Sözleşme Maddeleri & Özel Hükümler ({contract.clauses.length})
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Dinamik değişkenler ({'{{CONTRACT_VALUE}}'}, {'{{PENALTY_VALUE}}'}) A4 belgede otomatik doldurulur
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddClause()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Yeni Madde Ekle
                  </button>
                </div>

                {/* Quick Legal Snippet Bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Hazır Hüküm Ekle:
                  </span>
                  {QUICK_CLAUSE_SNIPPETS.map((sn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddClause(sn)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 cursor-pointer"
                    >
                      + {sn.title.split(' ')[0]} {sn.title.split(' ')[1]}
                    </button>
                  ))}
                </div>

                {/* Clauses List */}
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {contract.clauses.map((clause) => (
                    <div
                      key={clause.id}
                      className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-[11px] font-mono font-semibold text-violet-300 shrink-0">
                            {clause.number}
                          </span>
                          <input
                            type="text"
                            value={clause.title}
                            onChange={(e) =>
                              handleUpdateClause(clause.id, { title: e.target.value })
                            }
                            className="w-full px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-100"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteClause(clause.id)}
                          className="text-zinc-500 hover:text-red-400 p-1"
                          title="Maddeyi Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={clause.body}
                        onChange={(e) =>
                          handleUpdateClause(clause.id, { body: e.target.value })
                        }
                        className="w-full p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: PARTIES */}
            {activeTab === 'parties' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  [
                    { key: 'partyA', header: '1. Taraf (Hizmet Veren / Açıklayan)' },
                    { key: 'partyB', header: '2. Taraf (Müşteri / Karşı Taraf)' },
                  ] as const
                ).map(({ key, header }) => {
                  const p = contract[key];
                  const updateParty = (patch: Partial<typeof p>) =>
                    setContract((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], ...patch },
                    }));
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                    >
                      <div className="text-xs font-semibold text-violet-300">{header}</div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Sözleşmedeki Sıfatı
                        </label>
                        <input
                          type="text"
                          value={p.roleTitle}
                          onChange={(e) => updateParty({ roleTitle: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Ticaret Ünvanı / Ad Soyad
                        </label>
                        <input
                          type="text"
                          value={p.companyName}
                          onChange={(e) => updateParty({ companyName: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          İmza Yetkilisi & Görevi
                        </label>
                        <input
                          type="text"
                          value={p.representative}
                          onChange={(e) => updateParty({ representative: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Vergi Dairesi ve VKN / TCKN
                        </label>
                        <input
                          type="text"
                          value={p.taxOfficeAndNo}
                          onChange={(e) => updateParty({ taxOfficeAndNo: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Resmi Tebligat Adresi
                        </label>
                        <input
                          type="text"
                          value={p.address}
                          onChange={(e) => updateParty({ address: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          KEP / Kurumsal E-Posta
                        </label>
                        <input
                          type="text"
                          value={p.email}
                          onChange={(e) => updateParty({ email: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: FINANCIAL TERMS, JURISDICTION & STAMP */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Sözleşme Referans No
                    </label>
                    <input
                      type="text"
                      value={contract.contractNo}
                      onChange={(e) =>
                        setContract((p) => ({ ...p, contractNo: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Yürürlük Tarihi
                    </label>
                    <input
                      type="date"
                      value={contract.effectiveDate}
                      onChange={(e) =>
                        setContract((p) => ({ ...p, effectiveDate: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Sözleşme Süresi (Ay)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={contract.durationMonths}
                      onChange={(e) =>
                        setContract((p) => ({
                          ...p,
                          durationMonths: Number(e.target.value) || 12,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Toplam Sözleşme Bedeli ({contract.currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={contract.contractValue}
                      onChange={(e) =>
                        setContract((p) => ({
                          ...p,
                          contractValue: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      İhlal Cezai Şart Tutarı ({contract.currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={contract.penaltyAmount}
                      onChange={(e) =>
                        setContract((p) => ({
                          ...p,
                          penaltyAmount: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Yetkili Mahkeme ve İcra Daireleri
                  </label>
                  <input
                    type="text"
                    value={contract.jurisdictionCity}
                    onChange={(e) =>
                      setContract((p) => ({ ...p, jurisdictionCity: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Resmi Kaşe / Onay Mührü Metni
                    </label>
                    <input
                      type="text"
                      value={contract.stampTitle}
                      onChange={(e) =>
                        setContract((p) => ({ ...p, stampTitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1.5">
                      Kurumsal Tema Rengi
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() =>
                            setContract((p) => ({ ...p, accentColor: c.hex }))
                          }
                          className={`w-6 h-6 rounded-full border cursor-pointer ${
                            contract.accentColor === c.hex
                              ? 'scale-110 border-white'
                              : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contract.showOfficialStamp}
                      onChange={(e) =>
                        setContract((p) => ({
                          ...p,
                          showOfficialStamp: e.target.checked,
                        }))
                      }
                    />
                    <span>Yuvarlak Hukuk & Onay Mührü Göster</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contract.showDigitalVerifyQr}
                      onChange={(e) =>
                        setContract((p) => ({
                          ...p,
                          showDigitalVerifyQr: e.target.checked,
                        }))
                      }
                    />
                    <span>SHA-256 Dijital Bütünlük İzi Ekle</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: LEGAL RISK & COMPLIANCE AUDIT */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400">
                      TBK, FSEK, 6698 KVKK ve HMK m.193 Otomatik Denetimi
                    </div>
                    <div className="text-lg font-bold text-zinc-100 mt-0.5">
                      Hukuki Koruma & Tamlık Skoru: %{legalAudit.score}
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                    Cezai Şart: {formatCurrencyValue(contract.penaltyAmount, contract.currency)}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {legalAudit.checks.map((chk, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex items-start gap-3"
                    >
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-zinc-100">
                          {chk.label}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{chk.hint}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live A4 Official Contract Preview (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#111115] border border-zinc-800/90">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-200">
                Canlı A4 Resmi Sözleşme Önizlemesi ({contract.contractNo})
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

          <div className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-4 overflow-auto flex justify-center items-start min-h-[600px] corpus-card-glow">
            <div
              style={{
                width: 1240 * zoom,
                height: 1754 * zoom,
              }}
              className="relative shadow-2xl"
            >
              <canvas
                ref={a4CanvasRef}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                className="rounded-sm bg-white"
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
                    Corpus Contract Masaüstü Başlatıcı
                  </h3>
                  <p className="text-xs text-zinc-400">Bağımsız Hukuk & Sözleşme Stüdyosu</p>
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
                <span>Resmi A4 PDF ve Düzenlenebilir Word (.DOC) sözleşme çıktısı</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gizli ticari sözleşmeleriniz hiçbir sunucuya gönderilmez</span>
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
              %100 İstemci Taraflı Hukuki Belge & Sözleşme Motoru — Ticari sırlarınız cihazınızdan dışarı çıkmaz.
            </span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Corpus Suite #013 • PandaDoc / DocuSign CLM / Juro Alternatifi
          </div>
        </div>
      </footer>
    </div>
  );
}
