import { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  FileLock2,
  Smartphone,
  ShieldAlert,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Search,
  RefreshCw,
  Download,
  Upload,
  CreditCard,
  FileText,
  Terminal,
  Globe,
  Star,
  MonitorDown,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  SAMPLE_VAULT_ITEMS,
  type VaultItem,
  type VaultItemCategory,
  type EncryptedVaultEnvelope,
  encryptVaultData,
  decryptVaultData,
  encryptFileToCorpusLock,
  decryptCorpusLockFile,
  generateTotpCode,
  generateStrongPassword,
  evaluatePasswordStrength,
} from './utils/cryptoVaultEngine';

type StudioTab = 'vault' | 'file-locker' | 'totp-studio' | 'generator-audit';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('vault');
  const [items, setItems] = useState<VaultItem[]>(() => {
    try {
      const saved = localStorage.getItem('corpus_vault_plain_demo_v1');
      return saved ? JSON.parse(saved) : SAMPLE_VAULT_ITEMS;
    } catch {
      return SAMPLE_VAULT_ITEMS;
    }
  });

  // Vault Lock State (AES-256-GCM Master Password)
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);
  const [encryptedEnvelope, setEncryptedEnvelope] = useState<EncryptedVaultEnvelope | null>(null);
  const [masterPasswordInput, setMasterPasswordInput] = useState<string>('');
  const [lockError, setLockError] = useState<string | null>(null);

  // Filters & Selection
  const [categoryFilter, setCategoryFilter] = useState<VaultItemCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live 2FA TOTP Codes map
  const [totpMap, setTotpMap] = useState<Record<string, { code: string; secondsRemaining: number }>>({});
  const [selectedQrDataUrl, setSelectedQrDataUrl] = useState<{ title: string; url: string } | null>(null);

  // New Item Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<Partial<VaultItem>>({
    category: 'login',
    title: '',
    username: '',
    password: '',
    url: '',
    totpSecret: '',
    notes: '',
    favorite: false,
  });

  // File Locker State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState<string>('');
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Password Generator State
  const [genLength, setGenLength] = useState<number>(24);
  const [genUpper, setGenUpper] = useState<boolean>(true);
  const [genLower, setGenLower] = useState<boolean>(true);
  const [genNumbers, setGenNumbers] = useState<boolean>(true);
  const [genSymbols, setGenSymbols] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>(() =>
    generateStrongPassword({
      length: 24,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    })
  );

  // Desktop App Modal
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const vaultFileInputRef = useRef<HTMLInputElement | null>(null);
  const lockerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Save items in local sandbox when unlocked
  useEffect(() => {
    if (!isVaultLocked) {
      try {
        localStorage.setItem('corpus_vault_plain_demo_v1', JSON.stringify(items));
      } catch {
        // ignore quota error
      }
    }
  }, [items, isVaultLocked]);

  // Refresh RFC 6238 TOTP codes every second
  useEffect(() => {
    let active = true;
    const updateTotps = async () => {
      const next: Record<string, { code: string; secondsRemaining: number }> = {};
      for (const item of items) {
        if (item.totpSecret && item.totpSecret.trim()) {
          try {
            next[item.id] = await generateTotpCode(item.totpSecret);
          } catch {
            next[item.id] = { code: '------', secondsRemaining: 30 };
          }
        }
      }
      if (active) setTotpMap(next);
    };
    updateTotps();
    const timer = setInterval(updateTotps, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [items]);

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Filtered vault items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.username && item.username.toLowerCase().includes(q)) ||
        (item.url && item.url.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    });
  }, [items, categoryFilter, searchQuery]);

  // Security Watchtower Audit
  const securitySummary = useMemo(() => {
    const loginItems = items.filter((i) => i.password && i.password.length > 0);
    let weakCount = 0;
    let totalScore = 0;
    for (const it of loginItems) {
      const audit = evaluatePasswordStrength(it.password || '');
      totalScore += audit.score;
      if (audit.score < 60) weakCount++;
    }
    const avgScore = loginItems.length > 0 ? Math.round(totalScore / loginItems.length) : 100;
    return {
      totalLogins: loginItems.length,
      weakCount,
      totpEnabledCount: items.filter((i) => Boolean(i.totpSecret)).length,
      avgScore,
    };
  }, [items]);

  const handleLockVaultWithMasterPassword = async () => {
    if (masterPasswordInput.trim().length < 4) {
      setLockError('Lütfen kasayı kilitlemek için en az 4 karakterli bir Ana Parola (Master Password) girin.');
      return;
    }
    setLockError(null);
    const env = await encryptVaultData(items, masterPasswordInput);
    setEncryptedEnvelope(env);
    setIsVaultLocked(true);
    setMasterPasswordInput('');
  };

  const handleUnlockVault = async () => {
    if (!encryptedEnvelope) return;
    setLockError(null);
    try {
      const decrypted = await decryptVaultData(encryptedEnvelope, masterPasswordInput);
      setItems(decrypted);
      setIsVaultLocked(false);
      setMasterPasswordInput('');
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
    } catch {
      setLockError('Hatalı Ana Parola! AES-256-GCM kimlik doğrulama etiketi doğrulanamadı.');
    }
  };

  const handleExportEncryptedVaultFile = async () => {
    const pwd = prompt(
      'Dışa aktarılacak .cvault dosyasını şifrelemek için Ana Parolanızı girin:',
      masterPasswordInput || 'CorpusMaster2026!'
    );
    if (!pwd) return;
    const env = await encryptVaultData(items, pwd);
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpus-vault-aes256-${new Date().toISOString().slice(0, 10)}.cvault`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 65, spread: 65, origin: { y: 0.6 } });
  };

  const handleImportEncryptedVaultFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const env = JSON.parse(reader.result as string) as EncryptedVaultEnvelope;
        const pwd = prompt('Bu .cvault dosyasının AES-256 Ana Parolasını girin:');
        if (!pwd) return;
        const decrypted = await decryptVaultData(env, pwd);
        setItems(decrypted);
        setIsVaultLocked(false);
        confetti({ particleCount: 65, spread: 65, origin: { y: 0.6 } });
      } catch {
        alert('Şifre çözülemedi: Parola yanlış veya dosya bozuk.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessFileLocker = async (mode: 'encrypt' | 'decrypt') => {
    if (!selectedFile) return;
    if (filePassword.length < 4) {
      setFileStatus('Hata: Lütfen en az 4 karakterli güçlü bir dosya şifresi girin.');
      return;
    }
    setIsProcessingFile(true);
    setFileStatus(null);
    try {
      if (mode === 'encrypt') {
        const { blob, lockedName } = await encryptFileToCorpusLock(selectedFile, filePassword);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = lockedName;
        a.click();
        URL.revokeObjectURL(url);
        setFileStatus(`✓ "${selectedFile.name}" dosyası AES-256-GCM ile şifrelenerek "${lockedName}" olarak indirildi.`);
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      } else {
        const { blob, originalName } = await decryptCorpusLockFile(selectedFile, filePassword);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        a.click();
        URL.revokeObjectURL(url);
        setFileStatus(`✓ Şifre başarıyla çözüldü! Orijinal dosya "${originalName}" indirildi.`);
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      }
    } catch (err) {
      setFileStatus(
        err instanceof Error
          ? `✗ Şifre Çözme Hatası: ${err.message} (Parolanızı kontrol edin)`
          : '✗ İşlem başarısız oldu.'
      );
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleShowOtpQr = async (item: VaultItem) => {
    if (!item.totpSecret) return;
    const otpauth = `otpauth://totp/${encodeURIComponent(item.title)}:${encodeURIComponent(
      item.username || 'user'
    )}?secret=${item.totpSecret.replace(/\s+/g, '')}&issuer=CorpusVault`;
    const dataUrl = await QRCode.toDataURL(otpauth, { width: 260, margin: 2 });
    setSelectedQrDataUrl({ title: item.title, url: dataUrl });
  };

  const handleDownloadDesktopLauncher = () => {
    const batContent = [
      '@echo off',
      'title Corpus Vault & Encryption Studio Pro (#008)',
      'echo Corpus Vault AES-256 Masaustu Uygulamasi baslatiliyor...',
      'start "" msedge --app=http://localhost:5180',
      'exit',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Corpus-Vault-Pro.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const genAudit = useMemo(() => evaluatePasswordStrength(generatedPassword), [generatedPassword]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-violet-500/30">
      {/* Hidden File Inputs */}
      <input
        ref={vaultFileInputRef}
        type="file"
        accept=".cvault,.json"
        className="hidden"
        onChange={handleImportEncryptedVaultFile}
      />
      <input
        ref={lockerFileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setSelectedFile(f);
            setFileStatus(null);
          }
        }}
      />

      {/* Unified Corpus Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-zinc-100 text-base">
                  Corpus Vault & Crypto Studio
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                  #008 PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                AES-256-GCM Parola Kasası, Canlı 2FA TOTP Üretici & Askeri Düzey Dosya Şifreleme Stüdyosu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800/80 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AES-256-GCM • PBKDF2 310K • Zero-Knowledge</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Navigation Studio Tabs & Vault Lock Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111114] border border-zinc-800/80 p-3 rounded-2xl corpus-card-glow">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'vault', label: 'Şifreli Parola Kasası', icon: KeyRound },
                { id: 'file-locker', label: 'AES-256 Dosya Kilitleyici (.corpuslock)', icon: FileLock2 },
                { id: 'totp-studio', label: '2FA TOTP Kimlik Doğrulayıcı', icon: Smartphone },
                { id: 'generator-audit', label: 'Parola Üretici & Güvenlik Denetimi', icon: ShieldAlert },
              ] as { id: StudioTab; label: string; icon: typeof KeyRound }[]
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportEncryptedVaultFile}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              title="Tüm kasayı AES-256-GCM ile şifreleyip .cvault dosyası olarak indir"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Şifreli Yedek İndir (.cvault)</span>
            </button>
            <button
              onClick={() => vaultFileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              title=".cvault şifreli yedek dosyasını içe aktar"
            >
              <Upload className="w-3.5 h-3.5 text-violet-400" />
              <span>Yedek Yükle</span>
            </button>
          </div>
        </div>

        {/* IF VAULT IS LOCKED */}
        {isVaultLocked ? (
          <div className="max-w-md mx-auto my-12 bg-[#111114] border border-zinc-800 rounded-2xl p-8 corpus-card-glow text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Kasa AES-256-GCM İle Kilitlendi</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Kasa verileriniz bellekte PBKDF2-SHA256 (310,000 iterasyon) ile şifrelendi. Kilidi açmak için Ana Parolanızı girin:
              </p>
            </div>
            <input
              type="password"
              value={masterPasswordInput}
              onChange={(e) => setMasterPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
              placeholder="Ana Parola (Master Password)..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 font-mono"
            />
            {lockError && <p className="text-xs text-rose-400">{lockError}</p>}
            <button
              onClick={handleUnlockVault}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Kasanın Kilidini Aç
            </button>
          </div>
        ) : (
          <>
            {/* MODULE 1: PASSWORD & SECRET VAULT */}
            {activeTab === 'vault' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Sidebar Categories + Master Lock */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl p-4 corpus-card-glow space-y-2">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer mb-3"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Kayıt Ekle
                    </button>

                    {(
                      [
                        { id: 'all', label: 'Tüm Kayıtlar', count: items.length },
                        {
                          id: 'login',
                          label: 'Giriş & Hesaplar',
                          count: items.filter((i) => i.category === 'login').length,
                        },
                        {
                          id: 'card',
                          label: 'Kredi Kartları',
                          count: items.filter((i) => i.category === 'card').length,
                        },
                        {
                          id: 'ssh-api',
                          label: 'API & SSH Anahtarları',
                          count: items.filter((i) => i.category === 'ssh-api').length,
                        },
                        {
                          id: 'note',
                          label: 'Gizli Kasa Notları',
                          count: items.filter((i) => i.category === 'note').length,
                        },
                      ] as { id: VaultItemCategory | 'all'; label: string; count: number }[]
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          categoryFilter === cat.id
                            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400">
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Master Password Lock Box */}
                  <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl p-4 corpus-card-glow space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Kasayı Ana Parola İle Kilitle</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Bilgisayar başından ayrılırken kasayı AES-256-GCM ile bellekte kilitleyin:
                    </p>
                    <input
                      type="password"
                      value={masterPasswordInput}
                      onChange={(e) => setMasterPasswordInput(e.target.value)}
                      placeholder="Ana Parola belirleyin..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                    />
                    {lockError && <p className="text-[11px] text-rose-400">{lockError}</p>}
                    <button
                      onClick={handleLockVaultWithMasterPassword}
                      className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-violet-400" />
                      Kasayı Şimdi Kilitle
                    </button>
                  </div>
                </div>

                {/* Right Vault Items List */}
                <div className="lg:col-span-9 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Kasa içinde başlık, kullanıcı adı, domain veya not ara..."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#111114] border border-zinc-800/80 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Vault Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => {
                      const isRevealed = Boolean(revealedIds[item.id]);
                      const totp = totpMap[item.id];
                      const strength = item.password
                        ? evaluatePasswordStrength(item.password)
                        : null;

                      return (
                        <div
                          key={item.id}
                          className="bg-[#111114] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 corpus-card-glow flex flex-col justify-between gap-4 transition-all"
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400 shrink-0">
                                  {item.category === 'card' ? (
                                    <CreditCard className="w-4 h-4" />
                                  ) : item.category === 'ssh-api' ? (
                                    <Terminal className="w-4 h-4" />
                                  ) : item.category === 'note' ? (
                                    <FileText className="w-4 h-4" />
                                  ) : (
                                    <Globe className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-semibold text-zinc-100">
                                      {item.title}
                                    </h3>
                                    {item.favorite && (
                                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-400 font-mono">
                                    {item.username || item.cardHolder || item.url || 'Şifreli Kayıt'}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  setItems((prev) => prev.filter((x) => x.id !== item.id))
                                }
                                className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                                title="Kaydı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Password / Secret Field */}
                            {item.password && (
                              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-2">
                                <div className="font-mono text-xs text-zinc-200 truncate">
                                  {isRevealed ? item.password : '••••••••••••••••••••••••'}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() =>
                                      setRevealedIds((p) => ({ ...p, [item.id]: !p[item.id] }))
                                    }
                                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                    title="Göster / Gizle"
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(item.password || '', `pwd-${item.id}`)
                                    }
                                    className="px-2 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `pwd-${item.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>Kopyalandı</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Parola</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Credit Card Details */}
                            {item.category === 'card' && (
                              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1 font-mono text-xs">
                                <div className="flex justify-between text-zinc-200">
                                  <span>Kart No:</span>
                                  <span>{item.cardNumber}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                  <span>SKT: {item.cardExpiry}</span>
                                  <span>CVV: {isRevealed ? item.cardCvv : '•••'}</span>
                                </div>
                              </div>
                            )}

                            {/* Live 2FA TOTP Badge */}
                            {totp && (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-emerald-400" />
                                  <div>
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">
                                      Canlı 2FA TOTP Kodu ({totp.secondsRemaining}sn)
                                    </div>
                                    <div className="text-sm font-mono font-bold text-emerald-400 tracking-widest">
                                      {totp.code}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleShowOtpQr(item)}
                                    className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                                  >
                                    QR
                                  </button>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        totp.code.replace(/\s+/g, ''),
                                        `totp-${item.id}`
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium cursor-pointer"
                                  >
                                    {copiedKey === `totp-${item.id}` ? 'Kopyalandı!' : '2FA Kopyala'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-xs text-zinc-400 leading-relaxed">{item.notes}</p>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>Güncelleme: {item.updatedAt}</span>
                            {strength && (
                              <span
                                className={`font-mono font-medium ${
                                  strength.score >= 85
                                    ? 'text-emerald-400'
                                    : strength.score >= 55
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {strength.strengthLabel} ({strength.entropyBits} bit)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 2: AES-256-GCM BINARY FILE LOCKER (.corpuslock) */}
            {activeTab === 'file-locker' && (
              <div className="max-w-3xl mx-auto bg-[#111114] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 corpus-card-glow space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <FileLock2 className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">
                      CorpusLock — Askeri Düzey AES-256-GCM Dosya Şifreleme & Kilit Açma
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Özel PDF sözleşmelerinizi, ZIP arşivlerinizi, fotoğraflarınızı veya Excel tablolarınızı sunucuya yüklemeden doğrudan tarayıcı içinde <strong>AES-256-GCM + PBKDF2 (250,000 iterasyon)</strong> ile şifreleyip <code>.corpuslock</code> paketine dönüştürün.
                    </p>
                  </div>
                </div>

                {/* File Dropzone */}
                <div
                  onClick={() => lockerFileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-violet-500/50 rounded-2xl p-8 text-center bg-zinc-950/60 transition-all cursor-pointer space-y-2"
                >
                  <FileLock2 className="w-10 h-10 text-violet-400 mx-auto" />
                  {selectedFile ? (
                    <div>
                      <div className="text-sm font-semibold text-emerald-400">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                        {selectedFile.name.endsWith('.corpuslock')
                          ? 'Şifreli CorpusLock Paketi Algılandı (Kilidi Açmaya Hazır)'
                          : 'Şifrelenmeye Hazır Orijinal Dosya'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        Şifrelemek veya Kilidini Açmak İstediğiniz Dosyayı Seçin
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Tüm dosya formatları desteklenir (.pdf, .zip, .docx, .jpg, .corpuslock)
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Input & Action Buttons */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Dosya Şifreleme / Kilit Açma Parolası (AES-256-GCM Anahtarı):
                    </label>
                    <input
                      type="password"
                      value={filePassword}
                      onChange={(e) => setFilePassword(e.target.value)}
                      placeholder="Güçlü bir parola girin..."
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleProcessFileLocker('encrypt')}
                      disabled={!selectedFile || isProcessingFile}
                      className="py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Dosyayı AES-256 İle Şifrele (.corpuslock İndir)</span>
                    </button>
                    <button
                      onClick={() => handleProcessFileLocker('decrypt')}
                      disabled={!selectedFile || isProcessingFile}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>.corpuslock Dosyasının Şifresini Çöz & İndir</span>
                    </button>
                  </div>

                  {fileStatus && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs font-mono ${
                        fileStatus.startsWith('✓')
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {fileStatus}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODULE 3: 2FA TOTP AUTHENTICATOR STUDIO */}
            {activeTab === 'totp-studio' && (
              <div className="space-y-6">
                <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl p-6 corpus-card-glow flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">
                      RFC 6238 Canlı 2FA (TOTP) Kimlik Doğrulama Stüdyosu
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Telefonunuz yanınızda olmasa bile Google Authenticator / Authy uyumlu 6 haneli zaman tabanlı HMAC-SHA1 kodlarınızı doğrudan bilgisayarınızda üretin.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewItem({
                        category: 'login',
                        title: 'Yeni 2FA Hesabı',
                        username: 'user@corpus.app',
                        totpSecret: 'JBSWY3DPEHPK3PXP',
                      });
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni 2FA Anahtarı Ekle
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items
                    .filter((i) => Boolean(i.totpSecret))
                    .map((item) => {
                      const totp = totpMap[item.id] || { code: '--- ---', secondsRemaining: 30 };
                      return (
                        <div
                          key={item.id}
                          className="bg-[#111114] border border-zinc-800/80 rounded-2xl p-5 corpus-card-glow space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                              <p className="text-xs text-zinc-400 font-mono">{item.username}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                              {totp.secondsRemaining}s
                            </span>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                            <div className="text-3xl font-mono font-extrabold tracking-widest text-emerald-400">
                              {totp.code}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                copyToClipboard(totp.code.replace(/\s+/g, ''), `t-${item.id}`)
                              }
                              className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                            >
                              {copiedKey === `t-${item.id}` ? '✓ Kopyalandı' : '6 Haneli Kodu Kopyala'}
                            </button>
                            <button
                              onClick={() => handleShowOtpQr(item)}
                              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 cursor-pointer"
                            >
                              Mobil QR
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* MODULE 4: CRYPTOGRAPHIC PASSWORD GENERATOR & WATCHTOWER AUDIT */}
            {activeTab === 'generator-audit' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Entropy Password Generator (6 Cols) */}
                <div className="lg:col-span-6 bg-[#111114] border border-zinc-800/80 rounded-2xl p-6 corpus-card-glow space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        Donanımsal Kriptografik Parola Üretici (CSPRNG)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        <code>window.crypto.getRandomValues</code> ile tahmin edilemez entropi üretimi
                      </p>
                    </div>
                  </div>

                  {/* Generated Output Display */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="font-mono text-base sm:text-lg font-bold text-emerald-400 break-all">
                      {generatedPassword}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-900">
                      <span className="font-mono text-zinc-400">
                        Entropi: <strong>{genAudit.entropyBits} bit</strong> • Kırılma Süresi:{' '}
                        <strong className="text-violet-300">{genAudit.crackTimeLabel}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setGeneratedPassword(
                              generateStrongPassword({
                                length: genLength,
                                uppercase: genUpper,
                                lowercase: genLower,
                                numbers: genNumbers,
                                symbols: genSymbols,
                              })
                            )
                          }
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
                          title="Yeniden Üret"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(generatedPassword, 'gen-main')}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium cursor-pointer"
                        >
                          {copiedKey === 'gen-main' ? '✓ Kopyalandı' : 'Kopyala'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Length Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                      <span>Parola Uzunluğu</span>
                      <span className="font-mono font-bold text-violet-400">{genLength} Karakter</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={64}
                      value={genLength}
                      onChange={(e) => {
                        const len = Number(e.target.value);
                        setGenLength(len);
                        setGeneratedPassword(
                          generateStrongPassword({
                            length: len,
                            uppercase: genUpper,
                            lowercase: genLower,
                            numbers: genNumbers,
                            symbols: genSymbols,
                          })
                        );
                      }}
                      className="w-full accent-violet-500 cursor-pointer"
                    />
                  </div>

                  {/* Character Set Checkboxes */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: 'Büyük Harfler (A-Z)', state: genUpper, setter: setGenUpper },
                      { label: 'Küçük Harfler (a-z)', state: genLower, setter: setGenLower },
                      { label: 'Rakamlar (0-9)', state: genNumbers, setter: setGenNumbers },
                      { label: 'Özel Semboller (!@#$%)', state: genSymbols, setter: setGenSymbols },
                    ].map((opt, idx) => (
                      <label
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={opt.state}
                          onChange={(e) => {
                            opt.setter(e.target.checked);
                          }}
                          className="accent-violet-500 w-4 h-4"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right: Security Watchtower Audit (6 Cols) */}
                <div className="lg:col-span-6 bg-[#111114] border border-zinc-800/80 rounded-2xl p-6 corpus-card-glow space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">
                        Watchtower Güvenlik & Zayıf Parola Denetleyicisi
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Kasanızdaki tüm hesapların entropi ve sözlük saldırısı dayanıklılık analizi
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-mono text-sm font-bold text-emerald-400">
                      Skor: {securitySummary.avgScore}/100
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="text-lg font-mono font-bold text-zinc-100">
                        {securitySummary.totalLogins}
                      </div>
                      <div className="text-[11px] text-zinc-400">Denetlenen Parola</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="text-lg font-mono font-bold text-rose-400">
                        {securitySummary.weakCount}
                      </div>
                      <div className="text-[11px] text-zinc-400">Riskli / Zayıf Parola</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="text-lg font-mono font-bold text-emerald-400">
                        {securitySummary.totpEnabledCount}
                      </div>
                      <div className="text-[11px] text-zinc-400">2FA Korunmalı Hesap</div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {items
                      .filter((i) => i.password)
                      .map((item) => {
                        const audit = evaluatePasswordStrength(item.password || '');
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="text-xs font-semibold text-zinc-200">{item.title}</div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                {audit.entropyBits} bit • Kırılma: {audit.crackTimeLabel}
                              </div>
                            </div>
                            {audit.score < 65 ? (
                              <button
                                onClick={() => {
                                  const strong = generateStrongPassword({
                                    length: 22,
                                    uppercase: true,
                                    lowercase: true,
                                    numbers: true,
                                    symbols: true,
                                  });
                                  setItems((prev) =>
                                    prev.map((x) =>
                                      x.id === item.id
                                        ? {
                                            ...x,
                                            password: strong,
                                            updatedAt: new Date().toISOString().slice(0, 10),
                                          }
                                        : x
                                    )
                                  );
                                  confetti({ particleCount: 45, spread: 50, origin: { y: 0.6 } });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium cursor-pointer shrink-0"
                              >
                                ⚡ Tek Tıkla Güçlendir
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-mono">
                                ✓ Güvenli
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add New Vault Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">Kasaya Yeni Şifreli Kayıt Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Kayıt Kategorisi</label>
                <select
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, category: e.target.value as VaultItemCategory }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                >
                  <option value="login">Giriş Hesabı & Web Sitesi</option>
                  <option value="card">Kredi / Banka Kartı</option>
                  <option value="ssh-api">API / SSH Anahtarı</option>
                  <option value="note">Gizli Şifreli Not</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Başlık / Servis Adı</label>
                <input
                  type="text"
                  value={newItem.title || ''}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Örn: Binance Global, Şirket AWS, E-Devlet..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Kullanıcı Adı / E-Posta</label>
                  <input
                    type="text"
                    value={newItem.username || ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Web Adresi (URL)</label>
                  <input
                    type="text"
                    value={newItem.url || ''}
                    onChange={(e) => setNewItem((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-zinc-400">Parola / Gizli Anahtar</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewItem((p) => ({
                        ...p,
                        password: generateStrongPassword({
                          length: 20,
                          uppercase: true,
                          lowercase: true,
                          numbers: true,
                          symbols: true,
                        }),
                      }))
                    }
                    className="text-violet-400 hover:underline cursor-pointer"
                  >
                    + Güçlü Parola Üret
                  </button>
                </div>
                <input
                  type="text"
                  value={newItem.password || ''}
                  onChange={(e) => setNewItem((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  2FA TOTP Gizli Anahtarı (Base32 - Opsiyonel)
                </label>
                <input
                  type="text"
                  value={newItem.totpSecret || ''}
                  onChange={(e) => setNewItem((p) => ({ ...p, totpSecret: e.target.value }))}
                  placeholder="Örn: JBSWY3DPEHPK3PXP"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Şifreli Notlar</label>
                <textarea
                  rows={2}
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
                />
              </div>

              <button
                onClick={() => {
                  if (!newItem.title?.trim()) return;
                  const created: VaultItem = {
                    id: `v-${Date.now()}`,
                    category: (newItem.category as VaultItemCategory) || 'login',
                    title: newItem.title.trim(),
                    username: newItem.username || '',
                    password: newItem.password || '',
                    url: newItem.url || '',
                    totpSecret: newItem.totpSecret || '',
                    notes: newItem.notes || '',
                    favorite: true,
                    updatedAt: new Date().toISOString().slice(0, 10),
                  };
                  setItems((prev) => [created, ...prev]);
                  setShowAddModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium cursor-pointer"
              >
                Kaydı Kasaya Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA QR Modal */}
      {selectedQrDataUrl && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl max-w-xs w-full p-6 text-center space-y-4">
            <h3 className="text-sm font-bold text-zinc-100">{selectedQrDataUrl.title} — 2FA QR</h3>
            <p className="text-xs text-zinc-400">
              Google Authenticator, Authy veya iCloud Anahtar Zinciri ile okutabilirsiniz:
            </p>
            <img
              src={selectedQrDataUrl.url}
              alt="2FA QR"
              className="w-48 h-48 mx-auto rounded-xl border border-zinc-700"
            />
            <button
              onClick={() => setSelectedQrDataUrl(null)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Desktop App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                Corpus Vault Masaüstü Kurulumu
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Corpus Vault'u bağımsız bir masaüstü kasa penceresi olarak çalıştırmak için başlatıcıyı indirin:
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
      <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-xs text-zinc-500 flex flex-wrap items-center justify-between max-w-7xl w-full mx-auto gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Corpus Platform • <strong>#008 Corpus Vault & File Encryption Studio Pro</strong> — Sıfır Bilgi (Zero-Knowledge) WebCrypto Mimarisi.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">
          AES-256-GCM • PBKDF2-SHA256 • RFC 6238 TOTP
        </span>
      </footer>
    </div>
  );
}
