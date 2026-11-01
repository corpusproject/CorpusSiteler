import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Network,
  Plus,
  Trash2,
  Download,
  FileCode,
  FileText,
  Sparkles,
  Layers,
  Sliders,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Terminal,
  Copy,
  Check,
  Target,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
} from 'lucide-react';
import {
  type MindMapProject,
  type MindNode,
  type LayoutMode,
  type ConnectorStyle,
  type NodeShape,
  type NodePriority,
  type ComputedMindNode,
  MIND_PRESETS,
  MIND_THEMES,
  BRANCH_PALETTE,
  PRIORITY_META,
  renderMindMapCanvas,
  calculateMindMetrics,
  generateProjectMarkdown,
  generateProjectSVG,
} from './utils/mindEngine';

export function App() {
  const [project, setProject] = useState<MindMapProject>(() =>
    JSON.parse(JSON.stringify(MIND_PRESETS['saas-roadmap']))
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [activeTab, setActiveTab] = useState<'tree' | 'inspector' | 'style' | 'markdown'>('tree');
  const [zoom, setZoom] = useState<number>(100);
  const [showLauncherModal, setShowLauncherModal] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const computedNodesRef = useRef<ComputedMindNode[]>([]);

  const selectedNode = useMemo(
    () => project.nodes.find((n) => n.id === selectedNodeId) || project.nodes[0],
    [project.nodes, selectedNodeId]
  );

  const metrics = useMemo(() => calculateMindMetrics(project.nodes), [project.nodes]);
  const markdownOutput = useMemo(() => generateProjectMarkdown(project), [project]);

  useEffect(() => {
    if (!canvasRef.current) return;
    computedNodesRef.current = renderMindMapCanvas(canvasRef.current, project, selectedNodeId);
  }, [project, selectedNodeId]);

  const handleLoadPreset = (presetKey: string) => {
    const preset = MIND_PRESETS[presetKey];
    if (!preset) return;
    const cloned: MindMapProject = JSON.parse(JSON.stringify(preset));
    setProject(cloned);
    setSelectedNodeId(cloned.nodes[0]?.id || 'root');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked node in reverse order (topmost first)
    const nodes = computedNodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const left = n.x - n.width / 2;
      const right = n.x + n.width / 2;
      const top = n.y - n.height / 2;
      const bottom = n.y + n.height / 2;
      if (clickX >= left && clickX <= right && clickY >= top && clickY <= bottom) {
        setSelectedNodeId(n.id);
        setActiveTab('inspector');
        return;
      }
    }
  };

  const updateSelectedNode = (patch: Partial<MindNode>) => {
    if (!selectedNode) return;
    setProject((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)),
    }));
  };

  const handleAddChildNode = (parentId: string) => {
    const parent = project.nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const newId = `node-${Date.now().toString().slice(-5)}`;
    const color =
      parent.parentId === null
        ? BRANCH_PALETTE[project.nodes.length % BRANCH_PALETTE.length]
        : parent.color;

    const newNode: MindNode = {
      id: newId,
      parentId: parent.id,
      title: 'Yeni Stratejik Dal',
      subtitle: 'Alt görev veya bileşen detayı',
      emoji: '✨',
      color,
      priority: 'medium',
      progress: 25,
      effortHours: 24,
      assignee: 'Atanmadı',
      notes: '',
    };

    setProject((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === parent.id ? { ...n, collapsed: false } : n)).concat(newNode),
    }));
    setSelectedNodeId(newId);
    setActiveTab('inspector');
  };

  const handleAddSiblingNode = () => {
    if (!selectedNode || !selectedNode.parentId) {
      handleAddChildNode(selectedNode?.id || 'root');
      return;
    }
    handleAddChildNode(selectedNode.parentId);
  };

  const handleDeleteNode = (nodeId: string) => {
    const target = project.nodes.find((n) => n.id === nodeId);
    if (!target || target.parentId === null) return; // Prevent deleting root

    const toDelete = new Set<string>([nodeId]);
    let added = true;
    while (added) {
      added = false;
      project.nodes.forEach((n) => {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          added = true;
        }
      });
    }

    const remaining = project.nodes.filter((n) => !toDelete.has(n.id));
    setProject((prev) => ({ ...prev, nodes: remaining }));
    setSelectedNodeId(target.parentId || 'root');
  };

  const toggleCollapseNode = (nodeId: string) => {
    setProject((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n)),
    }));
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${project.id || 'corpus-mind'}-4K.png`;
    a.click();
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
  };

  const handleExportSVG = () => {
    const svgContent = generateProjectSVG(project);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id || 'corpus-mind'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id || 'corpus-mind'}-rapor.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id || 'corpus-mind'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batContent = `@echo off
title Corpus Mind & Flowchart Studio (#022 PRO)
echo Starting Corpus Mind Studio on http://localhost:5194 ...
cd /d "c:\\Users\\PC\\Desktop\\siteler\\corpus-mind"
start http://localhost:5194
npm run dev -- --port 5194
pause`;

  const renderTreeItems = (parentId: string | null, depth = 0): React.ReactNode => {
    const items = project.nodes.filter((n) => n.parentId === parentId);
    if (items.length === 0) return null;

    return items.map((item) => {
      const hasChildren = project.nodes.some((c) => c.parentId === item.id);
      const isSelected = item.id === selectedNodeId;
      const pMeta = PRIORITY_META[item.priority];

      return (
        <div key={item.id} className="select-none">
          <div
            onClick={() => {
              setSelectedNodeId(item.id);
            }}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all text-xs mb-0.5 ${
              isSelected
                ? 'bg-violet-500/20 border border-violet-500/50 text-white'
                : 'hover:bg-zinc-800/70 text-zinc-300 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapseNode(item.id);
                  }}
                  className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400"
                >
                  {item.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <span className="w-4 inline-block" />
              )}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-medium">
                {item.emoji} {item.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ backgroundColor: pMeta.bg, color: pMeta.color }}
              >
                %{item.progress}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChildNode(item.id);
                }}
                title="Alt Dal Ekle"
                className="opacity-0 group-hover:opacity-100 p-1 rounded bg-zinc-800 hover:bg-violet-600 text-zinc-200 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!item.collapsed && renderTreeItems(item.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* UNIFIED CORPUS PRO HEADER */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white">
                CORPUS MIND & FLOWCHART
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                #022 PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              İnteraktif Zihin Haritası, OKR Ağacı, Ishikawa Kök Neden & Sistem Mimarisi Stüdyosu
            </p>
          </div>
        </div>

        {/* Live Metrics Pill */}
        <div className="hidden xl:flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-zinc-400">Düğüm:</span>
            <span className="font-bold text-white">{metrics.totalNodes}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-zinc-400">Kritik P0:</span>
            <span className="font-bold text-rose-400">{metrics.criticalCount}</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Toplam Efor:</span>
            <span className="font-bold text-cyan-400">{metrics.totalEffort} Saat</span>
          </div>
          <div className="w-px h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Ort. İlerleme:</span>
            <span className="font-bold text-emerald-400">%{metrics.avgProgress}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
            <span>.BAT Başlatıcı</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4K PNG İndir</span>
          </button>
        </div>
      </header>

      {/* TOP STUDIO PRESET & LAYOUT BAR */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Hazır Şablonlar:
          </span>
          {[
            { id: 'saas-roadmap', label: '🚀 SaaS Ürün Yol Haritası' },
            { id: 'system-architecture', label: '🏦 FinTech Çekirdek Mimari' },
            { id: 'root-cause-fishbone', label: '🎯 Ishikawa Kök Neden (5-Why)' },
            { id: 'org-okr-tree', label: '🏛️ Holding OKR & Org Şeması' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handleLoadPreset(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                project.id === p.id
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Layout Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Yerleşim Motoru:
          </span>
          {(
            [
              { id: 'radial', label: 'Merkezi Zihin Haritası' },
              { id: 'right-tree', label: 'Yatay Mimari Ağaç' },
              { id: 'org-chart', label: 'Dikey Org Şeması' },
              { id: 'fishbone', label: 'Balık Kılçığı (RCA)' },
            ] as { id: LayoutMode; label: string }[]
          ).map((l) => (
            <button
              key={l.id}
              onClick={() => setProject((prev) => ({ ...prev, layout: l.id }))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                project.layout === l.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT CONTROL PANEL (4 COLS) */}
        <aside className="lg:col-span-4 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[calc(100vh-112px)]">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
            {[
              { id: 'tree', label: 'Ağaç Gezgini', icon: FolderTree },
              { id: 'inspector', label: 'Düğüm Detay', icon: Sliders },
              { id: 'style', label: 'Tema & Stil', icon: Layers },
              { id: 'markdown', label: 'MD & Rapor', icon: FileText },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    activeTab === t.id
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

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'tree' && (
              <div className="space-y-4">
                {/* Project Title Edit */}
                <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-3 space-y-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                    Harita Üst Bilgisi
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Proje / Harita Başlığı</label>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Departman / Yazar</label>
                      <input
                        type="text"
                        value={project.author}
                        onChange={(e) => setProject((p) => ({ ...p, author: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Sürüm Kodu</label>
                      <input
                        type="text"
                        value={project.version}
                        onChange={(e) => setProject((p) => ({ ...p, version: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddChildNode(selectedNode?.id || 'root')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Alt Dal Ekle</span>
                  </button>
                  <button
                    onClick={handleAddSiblingNode}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kardeş Dal Ekle</span>
                  </button>
                </div>

                {/* Hierarchical Tree View */}
                <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Hiyerarşik Düğüm Ağacı ({project.nodes.length})
                    </span>
                    <button
                      onClick={() =>
                        setProject((prev) => ({
                          ...prev,
                          nodes: prev.nodes.map((n) => ({ ...n, collapsed: false })),
                        }))
                      }
                      className="text-[11px] text-violet-400 hover:underline"
                    >
                      Tümünü Aç
                    </button>
                  </div>
                  <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1">
                    {renderTreeItems(null, 0)}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inspector' && selectedNode && (
              <div className="space-y-4">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                      Seçili Düğüm Düzenleyici
                    </span>
                    {selectedNode.parentId !== null && (
                      <button
                        onClick={() => handleDeleteNode(selectedNode.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[11px] font-medium transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Düğümü Sil</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <label className="text-[11px] text-zinc-400 block mb-1">İkon</label>
                      <input
                        type="text"
                        value={selectedNode.emoji || ''}
                        onChange={(e) => updateSelectedNode({ emoji: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-center text-sm text-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[11px] text-zinc-400 block mb-1">Düğüm Başlığı</label>
                      <input
                        type="text"
                        value={selectedNode.title}
                        onChange={(e) => updateSelectedNode({ title: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Alt Açıklama / Teknik Detay</label>
                    <input
                      type="text"
                      value={selectedNode.subtitle || ''}
                      onChange={(e) => updateSelectedNode({ subtitle: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Öncelik Seviyesi</label>
                      <select
                        value={selectedNode.priority}
                        onChange={(e) =>
                          updateSelectedNode({ priority: e.target.value as NodePriority })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="critical">Kritik (P0)</option>
                        <option value="high">Yüksek (P1)</option>
                        <option value="medium">Orta (P2)</option>
                        <option value="low">Düşük (P3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Sorumlu Kişi / Ekip</label>
                      <input
                        type="text"
                        value={selectedNode.assignee || ''}
                        onChange={(e) => updateSelectedNode({ assignee: e.target.value })}
                        placeholder="Örn: AI Core Team"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-zinc-400 flex justify-between mb-1">
                        <span>İlerleme Durumu</span>
                        <span className="font-bold text-violet-400">%{selectedNode.progress}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={selectedNode.progress}
                        onChange={(e) =>
                          updateSelectedNode({ progress: Number(e.target.value) })
                        }
                        className="w-full accent-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Tahmini Efor (Saat)</label>
                      <input
                        type="number"
                        min={0}
                        max={5000}
                        value={selectedNode.effortHours}
                        onChange={(e) =>
                          updateSelectedNode({ effortHours: Number(e.target.value) })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Branch Color Picker */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1.5">Dal Vurgu Rengi</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {BRANCH_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateSelectedNode({ color: hex })}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            selectedNode.color === hex
                              ? 'border-white scale-110'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Toplantı / Mimari Notlar</label>
                    <textarea
                      rows={3}
                      value={selectedNode.notes || ''}
                      onChange={(e) => updateSelectedNode({ notes: e.target.value })}
                      placeholder="Bu düğüm için kabul kriterleri, bağımlılıklar veya risk notları..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-violet-500 outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex gap-2">
                    <button
                      onClick={() => handleAddChildNode(selectedNode.id)}
                      className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Alt Dal Ekle</span>
                    </button>
                    <button
                      onClick={() => toggleCollapseNode(selectedNode.id)}
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition"
                    >
                      {selectedNode.collapsed ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Dalları Göster
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Dalları Gizle
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="space-y-4">
                {/* Studio Theme Selector */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    Renk & Atmosfer Teması
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {MIND_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setProject((prev) => ({ ...prev, themeId: t.id }))}
                        className={`p-3 rounded-xl border text-left transition ${
                          project.themeId === t.id
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: t.bgStart }}
                          />
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: t.accentColor }}
                          />
                        </div>
                        <div className="text-xs font-semibold text-white">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connector & Node Shape */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Bağlantı Hattı & Düğüm Geometrisi
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1.5">Bağlantı Eğrisi Stili</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'bezier', label: 'Organik Bezier' },
                          { id: 'orthogonal', label: 'Mimari Dik Açı' },
                          { id: 'straight', label: 'Doğrudan Vektör' },
                        ] as { id: ConnectorStyle; label: string }[]
                      ).map((c) => (
                        <button
                          key={c.id}
                          onClick={() =>
                            setProject((prev) => ({ ...prev, connectorStyle: c.id }))
                          }
                          className={`py-2 px-2 rounded-lg text-xs font-medium border transition ${
                            project.connectorStyle === c.id
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1.5">Düğüm Kartı Şekli</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'card', label: 'Kurumsal Kart' },
                          { id: 'rounded', label: 'Yumuşak Köşe' },
                          { id: 'pill', label: 'Kapsül (Pill)' },
                        ] as { id: NodeShape; label: string }[]
                      ).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setProject((prev) => ({ ...prev, nodeShape: s.id }))}
                          className={`py-2 px-2 rounded-lg text-xs font-medium border transition ${
                            project.nodeShape === s.id
                              ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 border-t border-zinc-800">
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span className="text-zinc-300">İlerleme Çubuklarını Göster (% Bar)</span>
                      <input
                        type="checkbox"
                        checked={project.showProgress}
                        onChange={(e) =>
                          setProject((p) => ({ ...p, showProgress: e.target.checked }))
                        }
                        className="accent-violet-500 w-4 h-4"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span className="text-zinc-300">Efor & Üst KPI Rozetlerini Göster</span>
                      <input
                        type="checkbox"
                        checked={project.showMetrics}
                        onChange={(e) =>
                          setProject((p) => ({ ...p, showMetrics: e.target.checked }))
                        }
                        className="accent-violet-500 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'markdown' && (
              <div className="space-y-3">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Canlı Markdown Dokümantasyonu
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(markdownOutput);
                        setCopiedMd(true);
                        setTimeout(() => setCopiedMd(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition"
                    >
                      {copiedMd ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Kopyala
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Zihin haritanızın Notion, GitHub Wiki veya Confluence ile %100 uyumlu hiyerarşik
                    Markdown çıktısı:
                  </p>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-300 font-mono overflow-x-auto max-h-[340px] whitespace-pre-wrap">
                    {markdownOutput}
                  </pre>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleExportMarkdown}
                      className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>.MD Olarak İndir</span>
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>JSON Yedeği İndir</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT INTERACTIVE 4K MIND MAP CANVAS (8 COLS) */}
        <section className="lg:col-span-8 bg-[#070709] flex flex-col h-[calc(100vh-112px)] relative overflow-hidden">
          {/* Floating Canvas Toolbar */}
          <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Tuval üzerindeki herhangi bir düğüme tıklayarak doğrudan seçebilir ve düzenleyebilirsiniz.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setZoom((z) => Math.max(60, z - 10))}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                  title="Küçült"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-mono text-zinc-300">%{zoom}</span>
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                  title="Büyüt"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                  title="Sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleExportSVG}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-cyan-400 font-medium transition"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>SVG Vektör İndir</span>
              </button>
            </div>
          </div>

          {/* 4K Canvas Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <div
              style={{
                width: `${zoom}%`,
                maxWidth: '1400px',
              }}
              className="transition-all duration-150 shadow-2xl shadow-black/80 rounded-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950"
            >
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full h-auto block cursor-pointer"
              />
            </div>
          </div>

          {/* Bottom Selected Node Quick Bar */}
          {selectedNode && (
            <div className="px-5 py-2.5 border-t border-zinc-800/80 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedNode.color }}
                />
                <span className="font-bold text-white">
                  {selectedNode.emoji} {selectedNode.title}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{selectedNode.subtitle || 'Alt açıklama yok'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddChildNode(selectedNode.id)}
                  className="px-2.5 py-1 rounded bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 font-medium transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Alt Dal Ekle
                </button>
                <button
                  onClick={() => setActiveTab('inspector')}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  Detayları Düzenle
                </button>
              </div>
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
                <Terminal className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-sm text-white">
                  Masaüstü .BAT Başlatıcı (#022 Corpus Mind)
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
              Aşağıdaki komutu <code className="text-violet-400">corpus-mind.bat</code> olarak
              masaüstünüze kaydederek tek tıklamayla <strong>5194</strong> portunda başlatabilirsiniz:
            </p>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 font-mono overflow-x-auto">
              {batContent}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(batContent);
                  setCopiedBat(true);
                  setTimeout(() => setCopiedBat(false), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedBat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBat ? 'Kopyalandı!' : '.BAT Kodunu Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
