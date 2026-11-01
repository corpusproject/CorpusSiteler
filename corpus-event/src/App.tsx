import { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Ticket,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  Terminal,
  Copy,
  Check,
  Calendar,
  MapPin,
  QrCode,
  DollarSign,
  Users,
  Mic2,
} from 'lucide-react';
import {
  type EventProject,
  type ConferenceSession,
  type ExpoBooth,
  type BadgeRole,
  type BoothStatus,
  EVENT_PRESETS,
  BADGE_ROLE_META,
  calculateEventFinancials,
  renderEventMasterCanvas,
  exportEventExcel,
} from './utils/eventEngine';

export function App() {
  const [project, setProject] = useState<EventProject>(() =>
    JSON.parse(JSON.stringify(EVENT_PRESETS['corpus-ai-summit-2026']))
  );
  const [activeTab, setActiveTab] = useState<
    'agenda' | 'floorplan' | 'badge' | 'budget'
  >('agenda');
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const financials = useMemo(() => calculateEventFinancials(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderEventMasterCanvas(canvasRef.current, project);
  }, [project]);

  const handleAddSession = () => {
    const newSess: ConferenceSession = {
      id: `s-${Date.now().toString().slice(-4)}`,
      timeSlot: '17:45 - 18:30',
      track: 'Main Stage (Keynote)',
      title: 'Kapanış Paneli: 2027 Küresel Teknoloji Öngörüleri',
      speakerName: 'Yeni Konuşmacı',
      speakerTitle: 'VP of Engineering',
      company: 'Enterprise Corp',
      capacity: 800,
      registered: 640,
      highlight: true,
    };
    setProject((prev) => ({
      ...prev,
      sessions: [...prev.sessions, newSess],
    }));
  };

  const updateSession = (id: string, patch: Partial<ConferenceSession>) => {
    setProject((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const updateBooth = (id: string, patch: Partial<ExpoBooth>) => {
    setProject((prev) => ({
      ...prev,
      booths: prev.booths.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-4K-Summit-Masterplan.png`;
    a.click();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const batContent = `@echo off
title Corpus Event, Badge & Floorplan Studio (#032 PRO)
echo Starting Corpus Event Studio on http://localhost:5204 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-event"
start http://localhost:5204
npm run dev -- --port 5204
pause`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS EVENT, BADGE & FLOORPLAN STUDIO
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                #032 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Çok Salonlu Zirve Ajandası, Fuar Stant Yerleşim Planı, QR VIP Yaka Kartı & Bütçe Stüdyosu
            </p>
          </div>
        </div>

        {/* Live Summit KPI Pill */}
        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-zinc-400">Katılımcı:</span>
            <span className="font-bold text-white">
              {project.expectedAttendees.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-zinc-400">Satılan Stant:</span>
            <span className="font-bold text-sky-400">
              {financials.soldBooths}/{financials.totalBooths} ({financials.totalSqm}m²)
            </span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Net Zirve Kârı:</span>
            <span className="font-bold text-emerald-400">
              ${financials.netProfit.toLocaleString('en-US')} (+%{financials.roiPercent})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300"
          >
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={() => exportEventExcel(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.XLSX)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 text-white font-semibold text-xs shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K Masterplan & Yaka Kartı İndir</span>
          </button>
        </div>
      </header>

      {/* MAIN SPLIT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT CONTROL PANEL (5 COLS) */}
        <aside className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[calc(100vh-56px)]">
          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
            {[
              { id: 'agenda', label: 'Konferans Akışı', icon: Mic2 },
              { id: 'floorplan', label: 'Fuar & Stantlar', icon: MapPin },
              { id: 'badge', label: 'VIP Yaka Kartı', icon: QrCode },
              { id: 'budget', label: 'Bütçe & Bilet', icon: Calendar },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === t.id
                      ? 'bg-rose-600 text-white shadow'
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
            {/* Event Title Card */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Zirve / Konferans Başlığı
                </label>
                <input
                  type="text"
                  value={project.eventName}
                  onChange={(e) =>
                    setProject((p) => ({ ...p, eventName: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-bold text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Kongre Merkezi / Mekan
                  </label>
                  <input
                    type="text"
                    value={project.venueName}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, venueName: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Şehir & Tarih
                  </label>
                  <input
                    type="text"
                    value={project.cityAndDate}
                    onChange={(e) =>
                      setProject((p) => ({ ...p, cityAndDate: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-rose-300"
                  />
                </div>
              </div>
            </div>

            {/* TAB 1: AGENDA SESSIONS */}
            {activeTab === 'agenda' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase">
                    Oturumlar & Konuşmacılar ({project.sessions.length})
                  </span>
                  <button
                    onClick={handleAddSession}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Oturum Ekle
                  </button>
                </div>

                <div className="space-y-2.5">
                  {project.sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={sess.timeSlot}
                          onChange={(e) =>
                            updateSession(sess.id, { timeSlot: e.target.value })
                          }
                          className="w-28 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-sky-400"
                        />
                        <select
                          value={sess.track}
                          onChange={(e) =>
                            updateSession(sess.id, {
                              track: e.target.value as ConferenceSession['track'],
                            })
                          }
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-violet-300"
                        >
                          <option value="Main Stage (Keynote)">Main Stage (Keynote)</option>
                          <option value="Track A: AI & Cloud">Track A: AI & Cloud</option>
                          <option value="Track B: FinTech & SecOps">
                            Track B: FinTech & SecOps
                          </option>
                          <option value="VIP Executive Lounge">VIP Executive Lounge</option>
                        </select>
                        <button
                          onClick={() =>
                            setProject((prev) => ({
                              ...prev,
                              sessions: prev.sessions.filter((s) => s.id !== sess.id),
                            }))
                          }
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={sess.title}
                        onChange={(e) =>
                          updateSession(sess.id, { title: e.target.value })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs font-semibold text-white"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={sess.speakerName}
                          onChange={(e) =>
                            updateSession(sess.id, { speakerName: e.target.value })
                          }
                          placeholder="Konuşmacı"
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={sess.company}
                          onChange={(e) =>
                            updateSession(sess.id, { company: e.target.value })
                          }
                          placeholder="Kurum"
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                        />
                        <input
                          type="number"
                          value={sess.registered}
                          onChange={(e) =>
                            updateSession(sess.id, {
                              registered: Number(e.target.value),
                            })
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: EXPO FLOORPLAN BOOTHS */}
            {activeTab === 'floorplan' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase">
                  Sponsor Stantları & Fuar Yerleşim Matrisi
                </div>
                <div className="space-y-2.5">
                  {project.booths.map((booth) => (
                    <div
                      key={booth.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={booth.code}
                          onChange={(e) =>
                            updateBooth(booth.id, { code: e.target.value })
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono font-bold text-amber-400"
                        />
                        <input
                          type="text"
                          value={booth.sponsorName}
                          onChange={(e) =>
                            updateBooth(booth.id, { sponsorName: e.target.value })
                          }
                          className="col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                        />
                        <select
                          value={booth.status}
                          onChange={(e) =>
                            updateBooth(booth.id, {
                              status: e.target.value as BoothStatus,
                            })
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-emerald-400"
                        >
                          <option value="SOLD">SOLD (Satıldı)</option>
                          <option value="RESERVED">RESERVED</option>
                          <option value="AVAILABLE">AVAILABLE</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            Sponsorluk Bedeli ($)
                          </label>
                          <input
                            type="number"
                            value={booth.priceUsd}
                            onChange={(e) =>
                              updateBooth(booth.id, {
                                priceUsd: Number(e.target.value),
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block">
                            Stant Alanı (m²)
                          </label>
                          <input
                            type="number"
                            value={booth.sizeSqm}
                            onChange={(e) =>
                              updateBooth(booth.id, {
                                sizeSqm: Number(e.target.value),
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VIP BADGE DESIGNER */}
            {activeTab === 'badge' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-rose-400 uppercase">
                  QR Kodlu VIP Yaka Kartı (Badge) Özelleştirici
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Katılımcı / Konuşmacı Adı Soyadı
                  </label>
                  <input
                    type="text"
                    value={project.badge.attendeeName}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        badge: { ...p.badge, attendeeName: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Unvan</label>
                    <input
                      type="text"
                      value={project.badge.attendeeTitle}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          badge: { ...p.badge, attendeeTitle: e.target.value },
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Temsil Edilen Kurum
                    </label>
                    <input
                      type="text"
                      value={project.badge.companyName}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          badge: { ...p.badge, companyName: e.target.value },
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-rose-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Akreditasyon Rolü
                    </label>
                    <select
                      value={project.badge.role}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          badge: { ...p.badge, role: e.target.value as BadgeRole },
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300"
                    >
                      {Object.entries(BADGE_ROLE_META).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Bilet / QR Kodu (Pass ID)
                    </label>
                    <input
                      type="text"
                      value={project.badge.ticketCode}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          badge: { ...p.badge, ticketCode: e.target.value },
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BUDGET & TICKET SIMULATOR */}
            {activeTab === 'budget' && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase">
                  Zirve Bilet Geliri & Prodüksiyon Maliyeti
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Ücretli Bilet Adedi
                    </label>
                    <input
                      type="number"
                      value={project.paidTicketsCount}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          paidTicketsCount: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Ortalama Bilet Fiyatı ($)
                    </label>
                    <input
                      type="number"
                      value={project.ticketPriceUsd}
                      onChange={(e) =>
                        setProject((p) => ({
                          ...p,
                          ticketPriceUsd: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-emerald-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Toplam Mekan, Sahne & İkram Maliyeti ($)
                  </label>
                  <input
                    type="number"
                    value={project.productionCostUsd}
                    onChange={(e) =>
                      setProject((p) => ({
                        ...p,
                        productionCostUsd: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-rose-400"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT 4K MASTERPLAN & VIP BADGE CANVAS (7 COLS) */}
        <section className="lg:col-span-7 bg-[#070709] p-5 overflow-y-auto h-[calc(100vh-56px)] space-y-4">
          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </section>
      </main>

      {showLauncherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Masaüstü .BAT Başlatıcı (#032 Corpus Event)
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
                onClick={() => {
                  navigator.clipboard.writeText(batContent);
                  setCopiedBat(true);
                  setTimeout(() => setCopiedBat(false), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedBat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBat ? 'Kopyalandı!' : '.BAT Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
