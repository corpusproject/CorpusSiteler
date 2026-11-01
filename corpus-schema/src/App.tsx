import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Database,
  Plus,
  Trash2,
  Download,
  Code2,
  Terminal,
  Copy,
  Check,
  KeyRound,
  Table2,
} from 'lucide-react';
import {
  type SchemaProject,
  type SqlColumnType,
  SCHEMA_PRESETS,
  generatePostgresDDL,
  generatePrismaSchema,
  renderErdCanvas,
} from './utils/schemaEngine';

const SQL_TYPES: SqlColumnType[] = [
  'UUID',
  'BIGSERIAL',
  'VARCHAR(255)',
  'TEXT',
  'NUMERIC(14,2)',
  'BOOLEAN',
  'TIMESTAMPTZ',
  'JSONB',
];

export function App() {
  const [project, setProject] = useState<SchemaProject>(() =>
    JSON.parse(JSON.stringify(SCHEMA_PRESETS['saas-multitenant-erd']))
  );
  const [selectedTableId, setSelectedTableId] = useState<string>('tb1');
  const [codeTab, setCodeTab] = useState<'canvas' | 'sql' | 'prisma'>('canvas');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedTable = useMemo(
    () => project.tables.find((t) => t.id === selectedTableId) || project.tables[0],
    [project.tables, selectedTableId]
  );

  const sqlOutput = useMemo(() => generatePostgresDDL(project), [project]);
  const prismaOutput = useMemo(() => generatePrismaSchema(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderErdCanvas(canvasRef.current, project, selectedTableId);
  }, [project, selectedTableId, codeTab]);

  const handleAddTable = () => {
    const idx = project.tables.length + 1;
    const newId = `tb-${Date.now().toString().slice(-4)}`;
    setProject((prev) => ({
      ...prev,
      tables: [
        ...prev.tables,
        {
          id: newId,
          name: `custom_entity_${idx}`,
          description: 'Yeni ilişkisel varlık tablosu',
          color: '#38bdf8',
          x: 120 + (idx % 3) * 540,
          y: 580,
          columns: [
            {
              id: `col-${Date.now()}`,
              name: 'id',
              type: 'UUID',
              isPrimaryKey: true,
              isNullable: false,
              isUnique: true,
            },
            {
              id: `col-${Date.now() + 1}`,
              name: 'created_at',
              type: 'TIMESTAMPTZ',
              isPrimaryKey: false,
              isNullable: false,
              isUnique: false,
            },
          ],
        },
      ],
    }));
    setSelectedTableId(newId);
  };

  const handleAddColumn = () => {
    if (!selectedTable) return;
    setProject((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === selectedTable.id
          ? {
              ...t,
              columns: [
                ...t.columns,
                {
                  id: `c-${Date.now().toString().slice(-4)}`,
                  name: `field_${t.columns.length + 1}`,
                  type: 'VARCHAR(255)',
                  isPrimaryKey: false,
                  isNullable: false,
                  isUnique: false,
                },
              ],
            }
          : t
      ),
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    renderErdCanvas(canvasRef.current, project, selectedTableId);
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-ERD.png`;
    a.click();
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-migration.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (k: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const batContent = `@echo off
title Corpus Schema & ERD Architect (#028 PRO)
echo Starting Corpus Schema Architect on http://localhost:5200 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-schema"
start http://localhost:5200
npm run dev -- --port 5200
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS SCHEMA & ERD ARCHITECT
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                #028 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Görsel Varlık-İlişki Diyagramı (ERD), PostgreSQL DDL & Prisma ORM Şema Üretici
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleDownloadSQL}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-cyan-400 font-semibold"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>.SQL İndir</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K ERD İndir</span>
          </button>
        </div>
      </header>

      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase text-zinc-400">
            Tablolar ({project.tables.length}):
          </span>
          {project.tables.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTableId(t.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition ${
                selectedTableId === t.id
                  ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              ⊞ {t.name}
            </button>
          ))}
          <button
            onClick={handleAddTable}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Tablo
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { id: 'canvas', label: '4K Görsel ERD Diyagramı' },
              { id: 'sql', label: 'PostgreSQL DDL (.sql)' },
              { id: 'prisma', label: 'Prisma ORM (schema.prisma)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCodeTab(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                codeTab === tab.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <aside className="lg:col-span-4 border-r border-zinc-800/80 bg-zinc-950/60 p-4 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          {selectedTable && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-400 uppercase flex items-center gap-1.5">
                  <Table2 className="w-3.5 h-3.5" /> Tablo Düzenleyici: {selectedTable.name}
                </span>
                <button
                  onClick={handleAddColumn}
                  className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Sütun Ekle
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Tablo Adı</label>
                  <input
                    type="text"
                    value={selectedTable.name}
                    onChange={(e) =>
                      setProject((prev) => ({
                        ...prev,
                        tables: prev.tables.map((t) =>
                          t.id === selectedTable.id ? { ...t, name: e.target.value } : t
                        ),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={selectedTable.description}
                    onChange={(e) =>
                      setProject((prev) => ({
                        ...prev,
                        tables: prev.tables.map((t) =>
                          t.id === selectedTable.id
                            ? { ...t, description: e.target.value }
                            : t
                        ),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {selectedTable.columns.map((col) => (
                  <div
                    key={col.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            tables: prev.tables.map((t) =>
                              t.id === selectedTable.id
                                ? {
                                    ...t,
                                    columns: t.columns.map((c) =>
                                      c.id === col.id ? { ...c, name: e.target.value } : c
                                    ),
                                  }
                                : t
                            ),
                          }))
                        }
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                      <select
                        value={col.type}
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            tables: prev.tables.map((t) =>
                              t.id === selectedTable.id
                                ? {
                                    ...t,
                                    columns: t.columns.map((c) =>
                                      c.id === col.id
                                        ? { ...c, type: e.target.value as SqlColumnType }
                                        : c
                                    ),
                                  }
                                : t
                            ),
                          }))
                        }
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-cyan-400"
                      >
                        {SQL_TYPES.map((tp) => (
                          <option key={tp} value={tp}>
                            {tp}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          setProject((prev) => ({
                            ...prev,
                            tables: prev.tables.map((t) =>
                              t.id === selectedTable.id
                                ? {
                                    ...t,
                                    columns: t.columns.filter((c) => c.id !== col.id),
                                  }
                                : t
                            ),
                          }))
                        }
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <label className="flex items-center gap-1 cursor-pointer text-amber-400">
                        <input
                          type="checkbox"
                          checked={col.isPrimaryKey}
                          onChange={(e) =>
                            setProject((prev) => ({
                              ...prev,
                              tables: prev.tables.map((t) =>
                                t.id === selectedTable.id
                                  ? {
                                      ...t,
                                      columns: t.columns.map((c) =>
                                        c.id === col.id
                                          ? { ...c, isPrimaryKey: e.target.checked }
                                          : c
                                      ),
                                    }
                                  : t
                              ),
                            }))
                          }
                        />
                        <KeyRound className="w-3 h-3" /> PK
                      </label>

                      <select
                        value={col.referencesTable || ''}
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            tables: prev.tables.map((t) =>
                              t.id === selectedTable.id
                                ? {
                                    ...t,
                                    columns: t.columns.map((c) =>
                                      c.id === col.id
                                        ? {
                                            ...c,
                                            referencesTable: e.target.value || undefined,
                                          }
                                        : c
                                    ),
                                  }
                                : t
                            ),
                          }))
                        }
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[11px] text-sky-400"
                      >
                        <option value="">FK İlişkisi Yok</option>
                        {project.tables
                          .filter((tb) => tb.id !== selectedTable.id)
                          .map((tb) => (
                            <option key={tb.id} value={tb.name}>
                              → {tb.name}.id
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="lg:col-span-8 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-112px)] space-y-4">
          <div className={codeTab === 'canvas' ? 'block space-y-3' : 'hidden'}>
            <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {codeTab === 'sql' && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase">
                  PostgreSQL 17 DDL Şeması
                </span>
                <button
                  onClick={() => copyText('sql', sqlOutput)}
                  className="px-3 py-1 rounded bg-zinc-800 text-xs text-white flex items-center gap-1"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>SQL Kopyala</span>
                </button>
              </div>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto">
                {sqlOutput}
              </pre>
            </div>
          )}

          {codeTab === 'prisma' && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-400 uppercase">
                  Prisma ORM (schema.prisma)
                </span>
                <button
                  onClick={() => copyText('prisma', prismaOutput)}
                  className="px-3 py-1 rounded bg-zinc-800 text-xs text-white flex items-center gap-1"
                >
                  {copiedKey === 'prisma' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Prisma Kopyala</span>
                </button>
              </div>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-violet-300 overflow-x-auto">
                {prismaOutput}
              </pre>
            </div>
          )}
        </section>
      </main>

      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Masaüstü .BAT Başlatıcı (#028 Corpus Schema)
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
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold flex items-center gap-1.5"
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
