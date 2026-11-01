import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Globe,
  Terminal,
  Languages,
  AlertTriangle,
  Code2,
  Eye,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  type I18nProject,
  type SupportedLocale,
  LOCALE_METADATA,
  PRESET_I18N_PROJECT,
  analyzeI18nProject,
  exportI18nBundle,
  generatePseudoLocalizedString,
} from './utils/i18nEngine';

export default function App() {
  const [project, setProject] = useState<I18nProject>(PRESET_I18N_PROJECT);
  const [selectedExportLocale, setSelectedExportLocale] =
    useState<SupportedLocale>('en');
  const [exportFormat, setExportFormat] = useState<
    'json_nested' | 'android_xml' | 'ios_strings' | 'typescript_dts' | 'pseudo_json'
  >('json_nested');
  const [rightMode, setRightMode] = useState<'canvas' | 'diagnostics' | 'code'>(
    'canvas'
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const analysis = useMemo(() => analyzeI18nProject(project), [project]);
  const compiledCode = useMemo(
    () => exportI18nBundle(project, selectedExportLocale, exportFormat),
    [project, selectedExportLocale, exportFormat]
  );

  // --------------------------------------------------------------------------
  // 4K (1920x1080) Global Localization Coverage & ICU Readiness Poster
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1920;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#070b14');
    bg.addColorStop(0.5, '#0c1526');
    bg.addColorStop(1, '#080c16');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Top Accent
    ctx.fillStyle = project.accentColor;
    ctx.fillRect(0, 0, W, 8);

    // Header
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(48, 36, W - 96, 120);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(48, 36, W - 96, 120);

    ctx.fillStyle = project.accentColor;
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      `CORPUS LOCALIZATION, MULTI-LOCALE i18N & PSEUDO-LOCALE STUDIO  •  SOURCE: [${project.sourceLocale.toUpperCase()}]`,
      74,
      70
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.fillText(project.projectName, 74, 114);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Total Translation Keys: ${project.entries.length}   |   Active Locales: ${project.activeLocales.map((l) => l.toUpperCase()).join(', ')}   |   RTL Support: Arabic (AR) Verified   |   ICU Placeholder Parity Linter Active`,
      74,
      142
    );

    // Top Right Badges
    ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
    ctx.fillRect(W - 590, 50, 250, 92);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(W - 590, 50, 250, 92);
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('GLOBAL LOCALE COVERAGE', W - 570, 76);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`${analysis.overallCoveragePct}%`, W - 570, 115);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${project.activeLocales.length} Target Markets`, W - 570, 134);

    const errColor = analysis.issues.length === 0 ? '#10b981' : '#f59e0b';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(W - 320, 50, 250, 92);
    ctx.strokeStyle = errColor;
    ctx.strokeRect(W - 320, 50, 250, 92);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('ICU & OVERFLOW WARNINGS', W - 300, 76);
    ctx.fillStyle = errColor;
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`${analysis.issues.length} Issues`, W - 300, 115);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Missing Keys / Overflow Checks', W - 300, 134);

    // ------------------------------------------------------------------------
    // LEFT COLUMN: Locale Coverage Bars & Expansion Ratios (x: 48, y: 180, w: 660)
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(48, 180, 660, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(48, 180, 660, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText('1. REGIONAL COVERAGE & TEXT EXPANSION METRICS', 74, 218);

    let locY = 262;
    for (const locCode of project.activeLocales) {
      const meta = LOCALE_METADATA[locCode];
      const cov = analysis.localeCoveragePct[locCode];

      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(74, locY - 22, 608, 102);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(74, locY - 22, 608, 102);

      ctx.fillStyle = meta.badgeColor;
      ctx.fillRect(74, locY - 22, 8, 102);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.fillText(
        `[${locCode.toUpperCase()}] ${meta.name} (${meta.nativeName})`,
        98,
        locY + 4
      );

      ctx.fillStyle = cov === 100 ? '#34d399' : '#fbbf24';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${cov}%`, 610, locY + 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(
        `Direction: ${meta.direction}   |   UI Expansion Factor: ${meta.avgExpansionRatio}x`,
        98,
        locY + 30
      );

      // Bar
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(98, locY + 46, 560, 12);
      ctx.fillStyle = meta.badgeColor;
      ctx.fillRect(98, locY + 46, (560 * cov) / 100, 12);

      locY += 118;
    }

    // ------------------------------------------------------------------------
    // RIGHT COLUMN: Multi-Language Key Matrix & Pseudo-Localization Preview
    // ------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(732, 180, 1140, 852);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(732, 180, 1140, 852);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 19px Inter, sans-serif';
    ctx.fillText(
      '2. MULTI-LANGUAGE STRING MATRIX & PSEUDO-LOCALE UI STRESS TEST',
      760,
      218
    );

    let keyY = 264;
    for (const entry of project.entries.slice(0, 4)) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(760, keyY - 22, 1084, 174);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(760, keyY - 22, 1084, 174);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${entry.namespace}.${entry.key}`, 782, keyY + 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`Max UI Limit: ${entry.maxCharLimit} chars`, 1640, keyY + 4);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(`TR: "${entry.values.tr}"`, 782, keyY + 34);
      ctx.fillText(`EN: "${entry.values.en}"`, 1310, keyY + 34);

      ctx.fillText(`DE: "${entry.values.de}"`, 782, keyY + 62);
      ctx.fillText(`AR (RTL): "${entry.values.ar}"`, 1310, keyY + 62);

      ctx.fillText(`JA: "${entry.values.ja}"`, 782, keyY + 90);
      ctx.fillText(
        `ES: "${entry.values.es || '[MISSING TRANSLATION]'}"`,
        1310,
        keyY + 90
      );

      // Pseudo-locale preview line
      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px monospace';
      ctx.fillText(
        `PSEUDO-STRESS: ${generatePseudoLocalizedString(entry.values.en || entry.values.tr)}`,
        782,
        keyY + 124
      );

      keyY += 190;
    }
  }, [project, analysis]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `corpus-i18n-localization-matrix-4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = project.entries.map((e) => ({
      Namespace: e.namespace,
      Key: e.key,
      'Max Chars': e.maxCharLimit,
      TR: e.values.tr,
      EN: e.values.en,
      DE: e.values.de,
      AR: e.values.ar,
      JA: e.values.ja,
      ES: e.values.es,
      'Pseudo-Locale Stress': generatePseudoLocalizedString(e.values.en),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      'i18n Translation Matrix'
    );
    XLSX.writeFile(wb, `corpus-i18n-translations.xlsx`);
    confetti({ particleCount: 55, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-950/50">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white">
                Corpus Localization, i18n & Pseudo-Locale Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                #039 PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              6-Language Matrix (TR/EN/DE/AR/JA/ES) • ICU Placeholder Linter • JSON / XML / iOS / .d.ts Compiler
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Kapsama:</span>
            <span className="font-mono font-bold text-blue-400">
              %{analysis.overallCoveragePct}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">Uyarı:</span>
            <span className="font-mono font-bold text-amber-400">
              {analysis.issues.length}
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Çeviri Paketi (.xlsx)
          </button>

          <button
            onClick={handleDownloadPoster}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-blue-950/50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            4K Lokalizasyon Haritası İndir
          </button>

          <button
            onClick={() => setShowBatModal(true)}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            .BAT
          </button>
        </div>
      </header>

      {/* MAIN STUDIO */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 bg-[#0c0c0f] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase text-white">
                Çok Dilli Anahtar Matrisi ({project.entries.length} Anahtar)
              </span>
            </div>
            <button
              onClick={() =>
                setProject({
                  ...project,
                  entries: [
                    ...project.entries,
                    {
                      id: `k-${Date.now()}`,
                      namespace: 'common',
                      key: `new_action_key_${project.entries.length + 1}`,
                      maxCharLimit: 40,
                      description: 'Yeni çok dilli arayüz anahtarı',
                      values: {
                        tr: 'Değişiklikleri Kaydet',
                        en: 'Save Changes',
                        de: 'Änderungen speichern',
                        ar: 'حفظ التغييرات',
                        ja: '変更を保存',
                        es: 'Guardar cambios',
                      },
                    },
                  ],
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Anahtar Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {project.entries.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.namespace}
                    onChange={(e) => {
                      const next = [...project.entries];
                      next[idx] = { ...entry, namespace: e.target.value };
                      setProject({ ...project, entries: next });
                    }}
                    className="w-24 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-blue-300"
                  />
                  <span className="text-zinc-500 font-mono">.</span>
                  <input
                    type="text"
                    value={entry.key}
                    onChange={(e) => {
                      const next = [...project.entries];
                      next[idx] = { ...entry, key: e.target.value };
                      setProject({ ...project, entries: next });
                    }}
                    className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
                  />
                  <input
                    type="number"
                    value={entry.maxCharLimit}
                    onChange={(e) => {
                      const next = [...project.entries];
                      next[idx] = {
                        ...entry,
                        maxCharLimit: Number(e.target.value),
                      };
                      setProject({ ...project, entries: next });
                    }}
                    title="Maksimum Karakter Sınırı"
                    className="w-16 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300"
                  />
                  <button
                    onClick={() =>
                      setProject({
                        ...project,
                        entries: project.entries.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {(['tr', 'en', 'de', 'ar', 'ja', 'es'] as SupportedLocale[]).map(
                    (loc) => (
                      <div key={loc} className="flex items-center gap-2">
                        <span className="w-9 text-[11px] font-mono font-bold uppercase text-zinc-400">
                          {loc}:
                        </span>
                        <input
                          type="text"
                          dir={loc === 'ar' ? 'rtl' : 'ltr'}
                          value={entry.values[loc]}
                          onChange={(e) => {
                            const next = [...project.entries];
                            next[idx] = {
                              ...entry,
                              values: {
                                ...entry.values,
                                [loc]: e.target.value,
                              },
                            };
                            setProject({ ...project, entries: next });
                          }}
                          placeholder={`${loc.toUpperCase()} çevirisi...`}
                          className="flex-1 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 bg-[#09090b] flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'canvas', label: '4K Lokalizasyon & Pseudo-Locale Kartı', icon: Eye },
                {
                  id: 'diagnostics',
                  label: `ICU & Taşma Denetçisi (${analysis.issues.length})`,
                  icon: Sparkles,
                },
                {
                  id: 'code',
                  label: 'JSON / Android XML / iOS .strings / .d.ts',
                  icon: Code2,
                },
              ].map((m) => {
                const Icon = m.icon;
                const active = rightMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRightMode(m.id as typeof rightMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {rightMode === 'canvas' && (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
                <canvas ref={canvasRef} className="w-full h-auto block" />
              </div>
            )}

            {rightMode === 'diagnostics' && (
              <div className="space-y-3">
                {analysis.issues.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-sm font-bold">
                      Tüm dillerde %100 anahtar ve {'{{variable}}'} değişken uyumu doğrulandı!
                    </span>
                  </div>
                ) : (
                  analysis.issues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white font-mono">
                          [{iss.locale.toUpperCase()}] {iss.key} • {iss.issueType}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">{iss.detail}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {rightMode === 'code' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedExportLocale}
                      onChange={(e) =>
                        setSelectedExportLocale(e.target.value as SupportedLocale)
                      }
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white"
                    >
                      {project.activeLocales.map((l) => (
                        <option key={l} value={l}>
                          Dil: {l.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {(
                      [
                        { id: 'json_nested', label: 'i18next JSON' },
                        { id: 'pseudo_json', label: 'Pseudo-Locale JSON' },
                        { id: 'android_xml', label: 'Android XML' },
                        { id: 'ios_strings', label: 'iOS .strings' },
                        { id: 'typescript_dts', label: 'TypeScript .d.ts' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setExportFormat(f.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                          exportFormat === f.id
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(compiledCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 1800);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Kodu Kopyala
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed">
                  {compiledCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Masaüstü Başlatıcı (.BAT) — Port 5211
              </h3>
              <button
                onClick={() => setShowBatModal(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Kapat
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300 overflow-x-auto">
{`@echo off
title Corpus Localization & i18n Studio (#039 PRO)
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-i18n"
start http://localhost:5211
npm run dev -- --port 5211`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
