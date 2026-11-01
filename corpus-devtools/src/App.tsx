import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Terminal,
  Code2,
  Clock,
  ShieldCheck,
  Database,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Hash,
  KeyRound,
  SearchCode,
} from 'lucide-react';
import {
  type DevToolMode,
  type DevToolsState,
  REGEX_PRESETS,
  CRON_PRESETS,
  DEFAULT_JWT_TOKEN,
  DEFAULT_JSON_INPUT,
  evaluateRegex,
  analyzeCronExpression,
  analyzeJwtToken,
  convertJsonToSchemas,
  computeSha256Hex,
  renderDevToolsCanvas,
} from './utils/devToolsEngine';

export function App() {
  const [state, setState] = useState<DevToolsState>({
    mode: 'regex',
    projectTitle: 'Corpus Core API Gateway & DevSecOps Denetim Paketi',
    environmentTag: 'PRODUCTION-EU-CENTRAL-1',
    regexPattern: REGEX_PRESETS[0].pattern,
    regexFlags: REGEX_PRESETS[0].flags,
    regexTestString: REGEX_PRESETS[0].sample,
    cronExpression: CRON_PRESETS[0].expr,
    cronJobName: CRON_PRESETS[0].job,
    cronTimezone: 'Europe/Istanbul',
    jwtToken: DEFAULT_JWT_TOKEN,
    jwtSecret: 'corpus-enterprise-hmac-256-secret-key-2026',
    jsonInput: DEFAULT_JSON_INPUT,
    schemaRootName: 'PaymentTransaction',
    hashInput: 'corpus-suite-zero-server-architecture-2026',
  });

  const [sha256Hex, setSha256Hex] = useState<string>('');
  const [generatedUuids, setGeneratedUuids] = useState<string[]>(() => [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ]);
  const [rightView, setRightView] = useState<'interactive' | 'canvas'>('interactive');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const regexResult = useMemo(
    () => evaluateRegex(state.regexPattern, state.regexFlags, state.regexTestString),
    [state.regexPattern, state.regexFlags, state.regexTestString]
  );

  const cronResult = useMemo(
    () =>
      analyzeCronExpression(
        state.cronExpression,
        state.cronJobName,
        state.cronTimezone
      ),
    [state.cronExpression, state.cronJobName, state.cronTimezone]
  );

  const jwtResult = useMemo(() => analyzeJwtToken(state.jwtToken), [state.jwtToken]);

  const schemaResult = useMemo(
    () => convertJsonToSchemas(state.jsonInput, state.schemaRootName),
    [state.jsonInput, state.schemaRootName]
  );

  useEffect(() => {
    let active = true;
    computeSha256Hex(state.hashInput).then((hex) => {
      if (active) setSha256Hex(hex);
    });
    return () => {
      active = false;
    };
  }, [state.hashInput]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderDevToolsCanvas(canvasRef.current, state, sha256Hex);
  }, [state, sha256Hex, rightView]);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    renderDevToolsCanvas(canvasRef.current, state, sha256Hex);
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpus-devtools-${state.mode}-4K.png`;
    a.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportBundleJSON = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      state,
      regexMatches: regexResult.matches,
      cronNextRuns: cronResult.nextRuns,
      jwtAudit: {
        algorithm: jwtResult.algorithm,
        securityScore: jwtResult.securityScore,
        ttlText: jwtResult.ttlText,
      },
      generatedSchemas: {
        typescript: schemaResult.typescriptInterface,
        postgresSql: schemaResult.postgresSql,
        zod: schemaResult.zodSchema,
      },
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corpus-devtools-rapor.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batContent = `@echo off
title Corpus DevTools Workbench (#023 PRO)
echo Starting Corpus DevTools Workbench on http://localhost:5195 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-devtools"
start http://localhost:5195
npm run dev -- --port 5195
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS DEVTOOLS WORKBENCH
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                #023 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Canlı Regex Motoru, Cron Simülatörü, JWT Güvenlik Denetçisi & JSON-TS/SQL/Zod Üretici
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <SearchCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Regex Eşleşme:</span>
            <span className="font-bold text-white">{regexResult.matches.length}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Cron Durumu:</span>
            <span className="font-bold text-emerald-400">
              {cronResult.isValid ? 'Aktif (8 Simülasyon)' : 'Hatalı'}
            </span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-zinc-400">JWT Güvenlik:</span>
            <span className="font-bold text-violet-400">{jwtResult.securityScore}/100</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleExportBundleJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 transition"
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-400" />
            <span>JSON Rapor</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K Blueprint İndir</span>
          </button>
        </div>
      </header>

      {/* TOP MODULE SWITCHER BAR */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              {
                id: 'regex',
                label: '1. Regex Test & Grup Analizörü',
                icon: SearchCode,
              },
              {
                id: 'cron',
                label: '2. Cron Zamanlayıcı & DevOps YAML',
                icon: Clock,
              },
              {
                id: 'jwt',
                label: '3. JWT Çözücü & Güvenlik Denetimi',
                icon: KeyRound,
              },
              {
                id: 'schema',
                label: '4. JSON ↔ TS / SQL / Zod & SHA-256',
                icon: Database,
              },
            ] as { id: DevToolMode; label: string; icon: typeof SearchCode }[]
          ).map((m) => {
            const Icon = m.icon;
            const active = state.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setState((prev) => ({ ...prev, mode: m.id }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Sağ Panel Görünümü:</span>
          <button
            onClick={() => setRightView('interactive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              rightView === 'interactive'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            Canlı İnteraktif Konsol
          </button>
          <button
            onClick={() => setRightView('canvas')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              rightView === 'canvas'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            4K Mühendislik Raporu Tuvali
          </button>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT INPUT & CONFIGURATION PANEL (5 COLS) */}
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          {/* Header Meta */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] text-zinc-400 block mb-1">Mühendislik Rapor Başlığı</label>
              <input
                type="text"
                value={state.projectTitle}
                onChange={(e) => setState((s) => ({ ...s, projectTitle: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Sunucu Ortamı</label>
              <input
                type="text"
                value={state.environmentTag}
                onChange={(e) => setState((s) => ({ ...s, environmentTag: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-400 font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* MODE 1: REGEX LAB */}
          {state.mode === 'regex' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Hazır Kurumsal Regex Şablonları
                  </span>
                </div>
                <div className="space-y-1.5">
                  {REGEX_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          regexPattern: p.pattern,
                          regexFlags: p.flags,
                          regexTestString: p.sample,
                        }))
                      }
                      className="w-full text-left px-3 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-xs text-zinc-200 transition flex items-center justify-between"
                    >
                      <span>{p.label}</span>
                      <span className="text-[10px] font-mono text-cyan-400">/{p.flags}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-4">
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Düzenli İfade Deseni (Regular Expression)
                    </label>
                    <input
                      type="text"
                      value={state.regexPattern}
                      onChange={(e) => setState((s) => ({ ...s, regexPattern: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Bayraklar</label>
                    <input
                      type="text"
                      value={state.regexFlags}
                      onChange={(e) => setState((s) => ({ ...s, regexFlags: e.target.value }))}
                      placeholder="gm"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-mono text-emerald-400 text-center focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                {regexResult.error && (
                  <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{regexResult.error}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Test Metni / Log Havuzu (Test String)
                  </label>
                  <textarea
                    rows={7}
                    value={state.regexTestString}
                    onChange={(e) => setState((s) => ({ ...s, regexTestString: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:border-cyan-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: CRON SIMULATOR */}
          {state.mode === 'cron' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  Hazır Kurumsal Zamanlayıcı Şablonları
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {CRON_PRESETS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          cronExpression: c.expr,
                          cronJobName: c.job,
                        }))
                      }
                      className="w-full text-left px-3 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs flex items-center justify-between transition"
                    >
                      <span className="text-zinc-200">{c.label}</span>
                      <code className="text-cyan-400 font-mono">{c.expr}</code>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    5 Alanlı Cron İfadesi (Dakika Saat AyınGünü Ay HaftanınGünü)
                  </label>
                  <input
                    type="text"
                    value={state.cronExpression}
                    onChange={(e) => setState((s) => ({ ...s, cronExpression: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base font-mono font-bold text-cyan-300 tracking-wider focus:border-cyan-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Servis / Job Adı</label>
                    <input
                      type="text"
                      value={state.cronJobName}
                      onChange={(e) => setState((s) => ({ ...s, cronJobName: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Zaman Dilimi (TZ)</label>
                    <select
                      value={state.cronTimezone}
                      onChange={(e) => setState((s) => ({ ...s, cronTimezone: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/Frankfurt">Europe/Frankfurt (CET)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: JWT INSPECTOR */}
          {state.mode === 'jwt' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    JWT Token Girişi (Encoded Base64Url)
                  </span>
                  <button
                    onClick={() => setState((s) => ({ ...s, jwtToken: DEFAULT_JWT_TOKEN }))}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Varsayılan Kurumsal Token'ı Yükle
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={state.jwtToken}
                  onChange={(e) => setState((s) => ({ ...s, jwtToken: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-amber-300 break-all focus:border-cyan-500 outline-none resize-none"
                />

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    HMAC Doğrulama Anahtarı (İsteğe Bağlı KMS Secret)
                  </label>
                  <input
                    type="text"
                    value={state.jwtSecret}
                    onChange={(e) => setState((s) => ({ ...s, jwtSecret: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: JSON TO TS / SQL / ZOD & CRYPTO */}
          {state.mode === 'schema' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Kaynak JSON Nesnesi
                  </span>
                  <input
                    type="text"
                    value={state.schemaRootName}
                    onChange={(e) => setState((s) => ({ ...s, schemaRootName: e.target.value }))}
                    placeholder="Entity Adı"
                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-cyan-400 w-44"
                  />
                </div>
                <textarea
                  rows={9}
                  value={state.jsonInput}
                  onChange={(e) => setState((s) => ({ ...s, jsonInput: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:border-cyan-500 outline-none resize-none"
                />
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Web Crypto SHA-256 & UUID v4 Üretici
                  </span>
                  <button
                    onClick={() =>
                      setGeneratedUuids([
                        crypto.randomUUID(),
                        crypto.randomUUID(),
                        crypto.randomUUID(),
                      ])
                    }
                    className="text-[11px] flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Yeni UUID Üret
                  </button>
                </div>
                <input
                  type="text"
                  value={state.hashInput}
                  onChange={(e) => setState((s) => ({ ...s, hashInput: e.target.value }))}
                  placeholder="SHA-256 özeti alınacak metin..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[11px] font-mono text-emerald-400 break-all">
                  SHA-256: {sha256Hex}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT LIVE OUTPUT CONSOLE OR 4K BLUEPRINT CANVAS (7 COLS) */}
        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)]">
          {/* Always keep hidden or visible canvas mounted for instant 4K PNG export */}
          <div className={rightView === 'canvas' ? 'block space-y-3' : 'hidden'}>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>4K Ultra HD (1920×1080) Mühendislik & Denetim Kartı Önizlemesi</span>
              <button
                onClick={handleExportPNG}
                className="text-cyan-400 hover:underline font-semibold"
              >
                PNG Olarak Kaydet →
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {rightView === 'interactive' && (
            <div className="space-y-4">
              {/* INTERACTIVE REGEX RESULTS */}
              {state.mode === 'regex' && (
                <>
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Yakalanan Eşleşmeler & İsimlendirilmiş Gruplar ({regexResult.matches.length})
                      </h3>
                      <button
                        onClick={() =>
                          copyText('regex', `/${state.regexPattern}/${state.regexFlags}`)
                        }
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      >
                        {copiedKey === 'regex' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Regex Kopyala</span>
                      </button>
                    </div>

                    {regexResult.matches.length === 0 ? (
                      <div className="text-xs text-zinc-500 py-6 text-center">
                        Eşleşme bulunamadı. Deseni veya test metnini güncelleyin.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        {regexResult.matches.map((m) => (
                          <div
                            key={m.index}
                            className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-cyan-400">
                                Eşleşme #{m.index} (İndeks {m.start}–{m.end})
                              </span>
                              <code className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                                {m.match}
                              </code>
                            </div>
                            {m.groups.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {m.groups.map((g, gi) => (
                                  <span
                                    key={gi}
                                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300"
                                  >
                                    <strong>{g.name}:</strong> {g.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Sözdizimi Atomu & Token Açıklamaları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {regexResult.tokens.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <code className="font-mono font-bold text-amber-400">{t.token}</code>
                          <span className="text-zinc-300">{t.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* INTERACTIVE CRON RESULTS */}
              {state.mode === 'cron' && (
                <>
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Doğal Dil Çevirisi & Önümüzdeki 8 Çalışma Zamanı
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-semibold text-emerald-300">
                      {cronResult.humanReadable}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {cronResult.nextRuns.map((run, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                        >
                          <span className="text-zinc-400 font-mono">Tetiklenme #{idx + 1}</span>
                          <span className="font-semibold text-white">{run}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        Hazır Kubernetes CronJob & GitHub Actions Manifestosu
                      </span>
                      <button
                        onClick={() =>
                          copyText(
                            'cron-yaml',
                            `${cronResult.snippets.k8sCronJob}\n---\n${cronResult.snippets.githubActions}`
                          )
                        }
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      >
                        {copiedKey === 'cron-yaml' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>YAML Kopyala</span>
                      </button>
                    </div>
                    <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
                      {cronResult.snippets.k8sCronJob}
                      {'\n\n# --- GitHub Actions Workflow ---\n'}
                      {cronResult.snippets.githubActions}
                    </pre>
                  </div>
                </>
              )}

              {/* INTERACTIVE JWT RESULTS */}
              {state.mode === 'jwt' && (
                <>
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Kriptografik Güvenlik Denetimi & TTL Analizi
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Skor: {jwtResult.securityScore}/100
                      </span>
                    </div>

                    <div className="space-y-2">
                      {jwtResult.securityFindings.map((f, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                            f.level === 'critical'
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              : f.level === 'warn'
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{f.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                      <div className="text-xs font-bold text-rose-400 uppercase">
                        Decoded Header (JOSE)
                      </div>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-rose-300 overflow-x-auto">
                        {jwtResult.headerRaw}
                      </pre>
                    </div>
                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                      <div className="text-xs font-bold text-violet-400 uppercase">
                        Decoded Payload (Claims)
                      </div>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-violet-300 overflow-x-auto">
                        {jwtResult.payloadRaw}
                      </pre>
                    </div>
                  </div>
                </>
              )}

              {/* INTERACTIVE SCHEMA & CRYPTO RESULTS */}
              {state.mode === 'schema' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 uppercase">
                          TypeScript Interface
                        </span>
                        <button
                          onClick={() => copyText('ts', schemaResult.typescriptInterface)}
                          className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'ts' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Kopyala
                        </button>
                      </div>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
                        {schemaResult.typescriptInterface || schemaResult.error}
                      </pre>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase">
                          PostgreSQL DDL Tablosu
                        </span>
                        <button
                          onClick={() => copyText('sql', schemaResult.postgresSql)}
                          className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1"
                        >
                          {copiedKey === 'sql' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Kopyala
                        </button>
                      </div>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                        {schemaResult.postgresSql || schemaResult.error}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-400 uppercase">
                        Zod Runtime Validation Şeması & Kriptografik UUID Havuzu
                      </span>
                      <button
                        onClick={() => copyText('zod', schemaResult.zodSchema)}
                        className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'zod' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Zod Kopyala
                      </button>
                    </div>
                    <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-violet-300 overflow-x-auto">
                      {schemaResult.zodSchema}
                    </pre>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                      {generatedUuids.map((u, i) => (
                        <button
                          key={i}
                          onClick={() => copyText(`uuid-${i}`, u)}
                          className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 text-[11px] font-mono text-zinc-300 flex items-center justify-between"
                        >
                          <span className="truncate">{u}</span>
                          <Copy className="w-3 h-3 shrink-0 ml-1 text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* .BAT DESKTOP LAUNCHER MODAL */}
      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  Masaüstü .BAT Başlatıcı (#023 Corpus DevTools)
                </h3>
              </div>
              <button
                onClick={() => setShowLauncherModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Kapat ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Aşağıdaki komutu <code className="text-cyan-400">corpus-devtools.bat</code> olarak
              kaydederek <strong>5195</strong> portunda başlatabilirsiniz:
            </p>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 font-mono overflow-x-auto">
              {batContent}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => copyText('bat', batContent)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedKey === 'bat' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'bat' ? 'Kopyalandı!' : '.BAT Kodunu Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
