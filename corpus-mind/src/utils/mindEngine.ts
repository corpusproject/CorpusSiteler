export type LayoutMode = 'radial' | 'right-tree' | 'org-chart' | 'fishbone';
export type NodePriority = 'critical' | 'high' | 'medium' | 'low';
export type NodeShape = 'rounded' | 'pill' | 'card' | 'hexagon';
export type ConnectorStyle = 'bezier' | 'orthogonal' | 'straight';

export interface MindNode {
  id: string;
  parentId: string | null;
  title: string;
  subtitle?: string;
  notes?: string;
  emoji?: string;
  color: string;
  priority: NodePriority;
  progress: number; // 0 to 100
  effortHours: number;
  assignee?: string;
  collapsed?: boolean;
  // Computed layout coordinates (in 1920x1080 canvas space)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  side?: 'left' | 'right' | 'center';
}

export interface MindTheme {
  id: string;
  name: string;
  bgStart: string;
  bgEnd: string;
  gridColor: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
}

export interface MindMapProject {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  version: string;
  layout: LayoutMode;
  connectorStyle: ConnectorStyle;
  nodeShape: NodeShape;
  themeId: string;
  showProgress: boolean;
  showMetrics: boolean;
  showMinimap: boolean;
  nodes: MindNode[];
}

export interface ComputedMindNode extends MindNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  side: 'left' | 'right' | 'center';
}

export const MIND_THEMES: MindTheme[] = [
  {
    id: 'obsidian-cyber',
    name: 'Obsidian Cyber',
    bgStart: '#09090b',
    bgEnd: '#12121a',
    gridColor: 'rgba(255,255,255,0.04)',
    cardBg: 'rgba(24, 24, 27, 0.92)',
    cardBorder: 'rgba(63, 63, 70, 0.7)',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    accentColor: '#8b5cf6',
  },
  {
    id: 'midnight-ocean',
    name: 'Midnight Ocean',
    bgStart: '#040d1a',
    bgEnd: '#0a192f',
    gridColor: 'rgba(56, 189, 248, 0.05)',
    cardBg: 'rgba(15, 23, 42, 0.92)',
    cardBorder: 'rgba(51, 65, 85, 0.8)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accentColor: '#38bdf8',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    bgStart: '#05140e',
    bgEnd: '#092218',
    gridColor: 'rgba(16, 185, 129, 0.05)',
    cardBg: 'rgba(6, 28, 20, 0.92)',
    cardBorder: 'rgba(16, 185, 129, 0.35)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    accentColor: '#10b981',
  },
  {
    id: 'architect-light',
    name: 'Architect Blueprint',
    bgStart: '#f8fafc',
    bgEnd: '#eef2ff',
    gridColor: 'rgba(79, 70, 229, 0.07)',
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBorder: 'rgba(203, 213, 225, 0.9)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    accentColor: '#4f46e5',
  },
];

export const BRANCH_PALETTE = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f43f5e', // Rose
  '#84cc16', // Lime
];

export const PRIORITY_META: Record<NodePriority, { label: string; color: string; bg: string }> = {
  critical: { label: 'KRİTİK P0', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.18)' },
  high: { label: 'YÜKSEK P1', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.18)' },
  medium: { label: 'ORTA P2', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.18)' },
  low: { label: 'DÜŞÜK P3', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.18)' },
};

export const MIND_PRESETS: Record<string, MindMapProject> = {
  'saas-roadmap': {
    id: 'saas-roadmap',
    title: 'Corpus Cloud AI 2026 Ürün Yol Haritası',
    subtitle: 'Q3-Q4 Kurumsal Mimari, Büyüme Motoru & Güvenlik Fazları',
    author: 'Ürün & Mühendislik Ekibi',
    version: 'v4.2 PRO',
    layout: 'radial',
    connectorStyle: 'bezier',
    nodeShape: 'card',
    themeId: 'obsidian-cyber',
    showProgress: true,
    showMetrics: true,
    showMinimap: true,
    nodes: [
      {
        id: 'root',
        parentId: null,
        title: 'Corpus Cloud AI 3.0',
        subtitle: '2026 Global Enterprise Lansmanı',
        emoji: '🚀',
        color: '#8b5cf6',
        priority: 'critical',
        progress: 68,
        effortHours: 480,
        assignee: 'CTO Office',
        notes: 'Yıllık 5M$ ARR hedefi için ana omurga.',
      },
      // Branch 1: AI Engine
      {
        id: 'b1',
        parentId: 'root',
        title: 'Çok Modlu LLM Motoru',
        subtitle: 'RAG & Vektör İndeksleme',
        emoji: '🧠',
        color: '#06b6d4',
        priority: 'critical',
        progress: 82,
        effortHours: 160,
        assignee: 'AI Core Team',
      },
      {
        id: 'b1-1',
        parentId: 'b1',
        title: 'Hibrit Vektör Arama',
        subtitle: 'Qdrant + BM25 Reranker',
        emoji: '⚡',
        color: '#06b6d4',
        priority: 'high',
        progress: 95,
        effortHours: 64,
        assignee: 'Selin Y.',
      },
      {
        id: 'b1-2',
        parentId: 'b1',
        title: 'Ajan Orkestrasyonu',
        subtitle: 'Otonom Görev Zinciri',
        emoji: '🤖',
        color: '#06b6d4',
        priority: 'critical',
        progress: 70,
        effortHours: 96,
        assignee: 'Mert K.',
      },
      // Branch 2: Security & Compliance
      {
        id: 'b2',
        parentId: 'root',
        title: 'Sıfır Güven & Uyumluluk',
        subtitle: 'SOC2 Type II & KVKK / GDPR',
        emoji: '🛡️',
        color: '#10b981',
        priority: 'critical',
        progress: 75,
        effortHours: 120,
        assignee: 'SecOps',
      },
      {
        id: 'b2-1',
        parentId: 'b2',
        title: 'Uçtan Uca KMS Şifreleme',
        subtitle: 'AES-256-GCM Müşteri Anahtarı',
        emoji: '🔐',
        color: '#10b981',
        priority: 'high',
        progress: 90,
        effortHours: 50,
        assignee: 'Kaan D.',
      },
      {
        id: 'b2-2',
        parentId: 'b2',
        title: 'SSO / SAML 2.0 Entegrasyonu',
        subtitle: 'Okta & Azure AD Desteği',
        emoji: '🔑',
        color: '#10b981',
        priority: 'medium',
        progress: 60,
        effortHours: 70,
        assignee: 'Elif T.',
      },
      // Branch 3: GTM & Growth
      {
        id: 'b3',
        parentId: 'root',
        title: 'PLG Büyüme & Gelir Motoru',
        subtitle: 'Self-Servis Onboarding',
        emoji: '📈',
        color: '#f59e0b',
        priority: 'high',
        progress: 54,
        effortHours: 110,
        assignee: 'Growth Squad',
      },
      {
        id: 'b3-1',
        parentId: 'b3',
        title: 'İnteraktif Şablon Galerisi',
        subtitle: 'SEO Odaklı 100+ Hazır Akış',
        emoji: '✨',
        color: '#f59e0b',
        priority: 'high',
        progress: 65,
        effortHours: 60,
        assignee: 'Deniz A.',
      },
      {
        id: 'b3-2',
        parentId: 'b3',
        title: 'Kullanım Bazlı Faturalama',
        subtitle: 'Stripe Metered Billing API',
        emoji: '💳',
        color: '#f59e0b',
        priority: 'medium',
        progress: 40,
        effortHours: 50,
        assignee: 'Burak S.',
      },
      // Branch 4: Edge & Mobile
      {
        id: 'b4',
        parentId: 'root',
        title: 'WebAssembly & Masaüstü Stüdyo',
        subtitle: 'Offline-First Yerel Çalışma',
        emoji: '💻',
        color: '#ec4899',
        priority: 'medium',
        progress: 48,
        effortHours: 90,
        assignee: 'Platform Team',
      },
      {
        id: 'b4-1',
        parentId: 'b4',
        title: 'WebGPU Grafik Hızlandırma',
        subtitle: '60 FPS 4K Canvas Render',
        emoji: '🎨',
        color: '#ec4899',
        priority: 'medium',
        progress: 55,
        effortHours: 45,
        assignee: 'Arda M.',
      },
      {
        id: 'b4-2',
        parentId: 'b4',
        title: 'Gerçek Zamanlı CRDT Senkron',
        subtitle: 'Çoklu Kullanıcı İmleç Desteği',
        emoji: '🌐',
        color: '#ec4899',
        priority: 'low',
        progress: 35,
        effortHours: 45,
        assignee: 'Zeynep C.',
      },
    ],
  },
  'system-architecture': {
    id: 'system-architecture',
    title: 'YüksekErişilebilirlikli FinTech Çekirdek Mimarisi',
    subtitle: '100.000 TPS Gerçek Zamanlı Ödeme & Risk Analiz Ağacı',
    author: 'Baş Mimari Ofisi',
    version: 'v2.8 Enterprise',
    layout: 'right-tree',
    connectorStyle: 'orthogonal',
    nodeShape: 'rounded',
    themeId: 'midnight-ocean',
    showProgress: true,
    showMetrics: true,
    showMinimap: true,
    nodes: [
      {
        id: 'root',
        parentId: null,
        title: 'FinTech Core Gateway',
        subtitle: 'Global API & Edge Router',
        emoji: '🏦',
        color: '#38bdf8',
        priority: 'critical',
        progress: 88,
        effortHours: 320,
        assignee: 'Core Arch',
      },
      {
        id: 'c1',
        parentId: 'root',
        title: 'Ödeme Orkestrasyon Katmanı',
        subtitle: 'ISO-20022 & Tekil İşlem Defteri',
        emoji: '💸',
        color: '#10b981',
        priority: 'critical',
        progress: 92,
        effortHours: 140,
        assignee: 'Ledger Team',
      },
      {
        id: 'c1-1',
        parentId: 'c1',
        title: 'Çift Kayıtlı Muhasebe Motoru',
        subtitle: 'Idempotent PostgreSQL + TigerBeetle',
        emoji: '📒',
        color: '#10b981',
        priority: 'critical',
        progress: 95,
        effortHours: 80,
        assignee: 'Emre V.',
      },
      {
        id: 'c1-2',
        parentId: 'c1',
        title: 'Akıllı POS Yönlendirici',
        subtitle: 'Maliyet & Başarı Oranı Optimizasyonu',
        emoji: '🔄',
        color: '#10b981',
        priority: 'high',
        progress: 85,
        effortHours: 60,
        assignee: 'Seda N.',
      },
      {
        id: 'c2',
        parentId: 'root',
        title: 'Milisaniye Fraud & Risk Motoru',
        subtitle: ' <12ms Anomali Skorlama',
        emoji: '🚨',
        color: '#f43f5e',
        priority: 'critical',
        progress: 78,
        effortHours: 110,
        assignee: 'Risk AI',
      },
      {
        id: 'c2-1',
        parentId: 'c2',
        title: 'Gerçek Zamanlı Graf Analizi',
        subtitle: 'Hesaplar Arası Şüpheli Ağ Tespiti',
        emoji: '🕸️',
        color: '#f43f5e',
        priority: 'high',
        progress: 80,
        effortHours: 65,
        assignee: 'Onur B.',
      },
      {
        id: 'c2-2',
        parentId: 'c2',
        title: 'Cihaz Parmak İzi & Biyometri',
        subtitle: 'Davranışsal İmza Doğrulama',
        emoji: '指纹',
        color: '#f43f5e',
        priority: 'medium',
        progress: 74,
        effortHours: 45,
        assignee: 'Ceren P.',
      },
      {
        id: 'c3',
        parentId: 'root',
        title: 'Olay Güdümlü Veri Omurgası',
        subtitle: 'Apache Kafka & ClickHouse Analitik',
        emoji: '📡',
        color: '#8b5cf6',
        priority: 'high',
        progress: 84,
        effortHours: 70,
        assignee: 'Data Platform',
      },
    ],
  },
  'root-cause-fishbone': {
    id: 'root-cause-fishbone',
    title: 'Kök Neden Analizi (Ishikawa): %4.2 Sepet Terk Artışı',
    subtitle: 'E-Ticaret Ödeme Adımı Gecikme & Dönüşüm Kaybı İncelemesi',
    author: 'SRE & Ürün Analitik',
    version: 'RCA-2026-09',
    layout: 'fishbone',
    connectorStyle: 'straight',
    nodeShape: 'pill',
    themeId: 'emerald-matrix',
    showProgress: true,
    showMetrics: true,
    showMinimap: true,
    nodes: [
      {
        id: 'root',
        parentId: null,
        title: 'Ödeme Adımında %4.2 Dönüşüm Kaybı',
        subtitle: 'P99 Yanıt Süresi 3.8 Saniyeye Çıktı',
        emoji: '🎯',
        color: '#10b981',
        priority: 'critical',
        progress: 60,
        effortHours: 96,
        assignee: 'Incident Cmd',
      },
      {
        id: 'f1',
        parentId: 'root',
        title: 'Altyapı & Veritabanı',
        subtitle: 'Connection Pool Doygunluğu',
        emoji: '🗄️',
        color: '#f43f5e',
        priority: 'critical',
        progress: 85,
        effortHours: 32,
        assignee: 'DBA Team',
      },
      {
        id: 'f1-1',
        parentId: 'f1',
        title: 'Eksik Composite İndeks',
        subtitle: 'orders_user_status_idx eklendi',
        emoji: '⚡',
        color: '#f43f5e',
        priority: 'critical',
        progress: 100,
        effortHours: 16,
        assignee: 'Tuna K.',
      },
      {
        id: 'f2',
        parentId: 'root',
        title: '3. Parti Ödeme Geçidi',
        subtitle: '3D Secure SMS Gecikmesi',
        emoji: '💳',
        color: '#f59e0b',
        priority: 'high',
        progress: 50,
        effortHours: 24,
        assignee: 'PayOps',
      },
      {
        id: 'f2-1',
        parentId: 'f2',
        title: 'Yedek Banka Failover Yok',
        subtitle: 'Otomatik Circuit Breaker Kurulumu',
        emoji: '🔌',
        color: '#f59e0b',
        priority: 'high',
        progress: 45,
        effortHours: 24,
        assignee: 'Bora L.',
      },
      {
        id: 'f3',
        parentId: 'root',
        title: 'Önyüz (Frontend) Paketi',
        subtitle: 'Mobil Safari Bellek Sızıntısı',
        emoji: '📱',
        color: '#06b6d4',
        priority: 'medium',
        progress: 70,
        effortHours: 20,
        assignee: 'Web Core',
      },
      {
        id: 'f4',
        parentId: 'root',
        title: 'Kampanya Trafik Patlaması',
        subtitle: 'Önbellek (CDN) Bypass Hatası',
        emoji: '🔥',
        color: '#8b5cf6',
        priority: 'high',
        progress: 90,
        effortHours: 20,
        assignee: 'CloudOps',
      },
    ],
  },
  'org-okr-tree': {
    id: 'org-okr-tree',
    title: 'Holding Dijital Dönüşüm & OKR Organizasyon Şeması',
    subtitle: 'Çeyreklik Hedefler, Sorumlu Direktörlükler ve Efor Dağılımı',
    author: 'Strateji & İK Ofisi',
    version: 'Q4-OKR',
    layout: 'org-chart',
    connectorStyle: 'orthogonal',
    nodeShape: 'card',
    themeId: 'architect-light',
    showProgress: true,
    showMetrics: true,
    showMinimap: true,
    nodes: [
      {
        id: 'root',
        parentId: null,
        title: 'İcra Kurulu & CEO Ofisi',
        subtitle: 'OKR: %35 Uluslararası Büyüme',
        emoji: '🏛️',
        color: '#4f46e5',
        priority: 'critical',
        progress: 72,
        effortHours: 600,
        assignee: 'İcra Kurulu',
      },
      {
        id: 'o1',
        parentId: 'root',
        title: 'Ürün & Teknoloji (CTO)',
        subtitle: '%99.99 SLA & AI Otomasyon',
        emoji: '⚙️',
        color: '#0891b2',
        priority: 'critical',
        progress: 80,
        effortHours: 240,
        assignee: 'CTO',
      },
      {
        id: 'o1-1',
        parentId: 'o1',
        title: 'Bulut Platform & DevSecOps',
        subtitle: 'Multi-Region Kubernetes',
        emoji: '☁️',
        color: '#0891b2',
        priority: 'high',
        progress: 85,
        effortHours: 120,
        assignee: 'Alperen G.',
      },
      {
        id: 'o2',
        parentId: 'root',
        title: 'Global Satış & Gelir (CRO)',
        subtitle: 'Avrupa & MENA Kurumsal Satış',
        emoji: '🌍',
        color: '#059669',
        priority: 'high',
        progress: 68,
        effortHours: 200,
        assignee: 'CRO',
      },
      {
        id: 'o2-1',
        parentId: 'o2',
        title: 'Kurumsal İş Ortaklıkları',
        subtitle: '25 Yeni Kanal Partneri',
        emoji: '🤝',
        color: '#059669',
        priority: 'medium',
        progress: 64,
        effortHours: 100,
        assignee: 'Derya S.',
      },
      {
        id: 'o3',
        parentId: 'root',
        title: 'Finans & Yatırımcı İlişkileri (CFO)',
        subtitle: 'Seri B Hazırlığı & EBITDA +%22',
        emoji: '💎',
        color: '#d97706',
        priority: 'high',
        progress: 75,
        effortHours: 160,
        assignee: 'CFO',
      },
    ],
  },
};

export function getVisibleNodes(nodes: MindNode[]): MindNode[] {
  const nodeMap = new Map<string, MindNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const isHidden = (node: MindNode): boolean => {
    let currParentId = node.parentId;
    while (currParentId) {
      const parent = nodeMap.get(currParentId);
      if (!parent) break;
      if (parent.collapsed) return true;
      currParentId = parent.parentId;
    }
    return false;
  };

  return nodes.filter((n) => !isHidden(n));
}

export function computeMindLayout(project: MindMapProject): ComputedMindNode[] {
  const visible = getVisibleNodes(project.nodes);
  const root = visible.find((n) => n.parentId === null) || visible[0];
  if (!root) return [];

  const childrenMap = new Map<string, MindNode[]>();
  visible.forEach((n) => {
    if (n.parentId) {
      const list = childrenMap.get(n.parentId) || [];
      list.push(n);
      childrenMap.set(n.parentId, list);
    }
  });

  const computed: ComputedMindNode[] = [];

  const getSubtreeLeafCount = (nodeId: string): number => {
    const ch = childrenMap.get(nodeId) || [];
    if (ch.length === 0) return 1;
    return ch.reduce((acc, c) => acc + getSubtreeLeafCount(c.id), 0);
  };

  if (project.layout === 'radial') {
    const centerX = 960;
    const centerY = 530;
    computed.push({
      ...root,
      x: centerX,
      y: centerY,
      width: 280,
      height: 96,
      depth: 0,
      side: 'center',
    });

    const topBranches = childrenMap.get(root.id) || [];
    const rightBranches: MindNode[] = [];
    const leftBranches: MindNode[] = [];

    topBranches.forEach((b, idx) => {
      if (idx % 2 === 0) rightBranches.push(b);
      else leftBranches.push(b);
    });

    const layoutSide = (branches: MindNode[], side: 'left' | 'right') => {
      const totalLeaves = Math.max(
        1,
        branches.reduce((acc, b) => acc + getSubtreeLeafCount(b.id), 0)
      );
      const availableHeight = 760;
      const startY = centerY - availableHeight / 2;
      let currentLeafCursor = 0;

      const placeRecursive = (node: MindNode, depth: number) => {
        const leaves = getSubtreeLeafCount(node.id);
        const spanHeight = (leaves / totalLeaves) * availableHeight;
        const nodeCenterY = startY + (currentLeafCursor + leaves / 2) * (availableHeight / totalLeaves);

        const dir = side === 'right' ? 1 : -1;
        const horizontalStep = depth === 1 ? 340 : 300;
        const nodeX = centerX + dir * (depth * horizontalStep);

        computed.push({
          ...node,
          x: nodeX,
          y: nodeCenterY,
          width: depth === 1 ? 240 : 220,
          height: depth === 1 ? 84 : 76,
          depth,
          side,
        });

        const children = childrenMap.get(node.id) || [];
        if (children.length === 0) {
          currentLeafCursor += 1;
        } else {
          children.forEach((child) => placeRecursive(child, depth + 1));
        }
        return spanHeight;
      };

      branches.forEach((b) => placeRecursive(b, 1));
    };

    layoutSide(rightBranches, 'right');
    layoutSide(leftBranches, 'left');
  } else if (project.layout === 'right-tree') {
    const startX = 240;
    const centerY = 530;
    const totalLeaves = Math.max(1, getSubtreeLeafCount(root.id));
    const availableHeight = 780;
    const topY = centerY - availableHeight / 2;
    let leafCursor = 0;

    const placeRight = (node: MindNode, depth: number) => {
      const leaves = getSubtreeLeafCount(node.id);
      const y = topY + (leafCursor + leaves / 2) * (availableHeight / totalLeaves);
      const x = startX + depth * 440;

      computed.push({
        ...node,
        x,
        y,
        width: depth === 0 ? 270 : 240,
        height: depth === 0 ? 92 : 80,
        depth,
        side: 'right',
      });

      const children = childrenMap.get(node.id) || [];
      if (children.length === 0) {
        leafCursor += 1;
      } else {
        children.forEach((c) => placeRight(c, depth + 1));
      }
    };

    placeRight(root, 0);
  } else if (project.layout === 'org-chart') {
    const topY = 185;
    const totalLeaves = Math.max(1, getSubtreeLeafCount(root.id));
    const availableWidth = 1560;
    const leftX = 960 - availableWidth / 2;
    let leafCursor = 0;

    const placeOrg = (node: MindNode, depth: number) => {
      const leaves = getSubtreeLeafCount(node.id);
      const x = leftX + (leafCursor + leaves / 2) * (availableWidth / totalLeaves);
      const y = topY + depth * 280;

      computed.push({
        ...node,
        x,
        y,
        width: depth === 0 ? 280 : 235,
        height: depth === 0 ? 92 : 82,
        depth,
        side: 'center',
      });

      const children = childrenMap.get(node.id) || [];
      if (children.length === 0) {
        leafCursor += 1;
      } else {
        children.forEach((c) => placeOrg(c, depth + 1));
      }
    };

    placeOrg(root, 0);
  } else if (project.layout === 'fishbone') {
    // Ishikawa Root Cause diagram: Root on far right, spine down the middle
    const headX = 1610;
    const spineY = 530;

    computed.push({
      ...root,
      x: headX,
      y: spineY,
      width: 280,
      height: 98,
      depth: 0,
      side: 'right',
    });

    const categories = childrenMap.get(root.id) || [];
    categories.forEach((cat, idx) => {
      const isTop = idx % 2 === 0;
      const pairIndex = Math.floor(idx / 2);
      const totalPairs = Math.max(1, Math.ceil(categories.length / 2));
      const spineStart = 320;
      const spineEnd = 1280;
      const stepX = (spineEnd - spineStart) / Math.max(1, totalPairs);
      const catX = spineEnd - pairIndex * stepX - 120;
      const catY = isTop ? spineY - 250 : spineY + 250;

      computed.push({
        ...cat,
        x: catX,
        y: catY,
        width: 240,
        height: 82,
        depth: 1,
        side: isTop ? 'left' : 'right',
      });

      const subCauses = childrenMap.get(cat.id) || [];
      subCauses.forEach((sub, sIdx) => {
        const subX = catX - 230;
        const subY = isTop
          ? catY + 75 + sIdx * 85
          : catY - 75 - sIdx * 85;
        computed.push({
          ...sub,
          x: subX,
          y: subY,
          width: 215,
          height: 72,
          depth: 2,
          side: isTop ? 'left' : 'right',
        });
      });
    });
  }

  return computed;
}

export function calculateMindMetrics(nodes: MindNode[]) {
  const totalNodes = nodes.length;
  const totalEffort = nodes.reduce((acc, n) => acc + (Number(n.effortHours) || 0), 0);
  const avgProgress =
    totalNodes > 0
      ? Math.round(nodes.reduce((acc, n) => acc + (Number(n.progress) || 0), 0) / totalNodes)
      : 0;
  const criticalCount = nodes.filter((n) => n.priority === 'critical').length;
  const completedCount = nodes.filter((n) => n.progress >= 100).length;

  return {
    totalNodes,
    totalEffort,
    avgProgress,
    criticalCount,
    completedCount,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function renderMindMapCanvas(
  canvas: HTMLCanvasElement,
  project: MindMapProject,
  selectedNodeId: string | null
): ComputedMindNode[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const theme = MIND_THEMES.find((t) => t.id === project.themeId) || MIND_THEMES[0];
  const computedNodes = computeMindLayout(project);
  const nodeMap = new Map<string, ComputedMindNode>();
  computedNodes.forEach((n) => nodeMap.set(n.id, n));

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle Ambient Glow
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, 760);
  glow.addColorStop(0, theme.accentColor + '16');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 2. Studio Dot / Blueprint Grid
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  const gridStep = 48;
  for (let x = 0; x < W; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 3. Top Header Banner on Canvas
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 40, 28, W - 80, 74, 16);
  ctx.fill();
  ctx.stroke();

  // Accent bar on left of header
  ctx.fillStyle = theme.accentColor;
  drawRoundedRect(ctx, 56, 44, 6, 42, 3);
  ctx.fill();

  ctx.fillStyle = theme.textPrimary;
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText(project.title, 76, 59);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = '500 13px Inter, sans-serif';
  ctx.fillText(`${project.subtitle}  •  ${project.author}  •  ${project.version}`, 76, 82);

  // Metrics Pill in Header
  if (project.showMetrics) {
    const metrics = calculateMindMetrics(project.nodes);
    const pills = [
      { label: 'TOPLAM DÜĞÜM', val: `${metrics.totalNodes}` },
      { label: 'KRİTİK P0', val: `${metrics.criticalCount}` },
      { label: 'TOPLAM EFOR', val: `${metrics.totalEffort} Saat` },
      { label: 'ORT. İLERLEME', val: `%${metrics.avgProgress}` },
    ];
    let px = W - 640;
    pills.forEach((p) => {
      ctx.fillStyle = theme.accentColor + '18';
      ctx.strokeStyle = theme.accentColor + '45';
      drawRoundedRect(ctx, px, 41, 138, 48, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.textSecondary;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(p.label, px + 14, 58);

      ctx.fillStyle = theme.textPrimary;
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(p.val, px + 14, 78);
      px += 148;
    });
  }

  // 4. Fishbone Main Spine if layout === 'fishbone'
  if (project.layout === 'fishbone') {
    const rootNode = computedNodes.find((n) => n.parentId === null);
    if (rootNode) {
      ctx.save();
      ctx.strokeStyle = rootNode.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(160, rootNode.y);
      ctx.lineTo(rootNode.x - rootNode.width / 2, rootNode.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 5. Draw Connectors
  computedNodes.forEach((node) => {
    if (!node.parentId) return;
    const parent = nodeMap.get(node.parentId);
    if (!parent) return;

    ctx.save();
    ctx.strokeStyle = node.color || theme.accentColor;
    ctx.lineWidth = node.depth === 1 ? 3.2 : 2.2;

    if (project.layout === 'fishbone') {
      ctx.beginPath();
      if (node.depth === 1) {
        // Connect category rib directly to horizontal spine
        const spineAttachX = node.x + 95;
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(spineAttachX, parent.y);
      } else {
        ctx.moveTo(node.x + node.width / 2, node.y);
        ctx.lineTo(parent.x, parent.y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    let startX = parent.x;
    let startY = parent.y;
    let endX = node.x;
    let endY = node.y;

    if (project.layout === 'org-chart') {
      startY = parent.y + parent.height / 2;
      endY = node.y - node.height / 2;
    } else if (project.layout === 'right-tree') {
      startX = parent.x + parent.width / 2;
      endX = node.x - node.width / 2;
    } else {
      // Radial
      if (node.side === 'right') {
        startX = parent.x + parent.width / 2;
        endX = node.x - node.width / 2;
      } else {
        startX = parent.x - parent.width / 2;
        endX = node.x + node.width / 2;
      }
    }

    ctx.beginPath();
    if (project.connectorStyle === 'straight') {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    } else if (project.connectorStyle === 'orthogonal') {
      ctx.moveTo(startX, startY);
      if (project.layout === 'org-chart') {
        const midY = (startY + endY) / 2;
        ctx.lineTo(startX, midY);
        ctx.lineTo(endX, midY);
        ctx.lineTo(endX, endY);
      } else {
        const midX = (startX + endX) / 2;
        ctx.lineTo(midX, startY);
        ctx.lineTo(midX, endY);
        ctx.lineTo(endX, endY);
      }
    } else {
      // Bezier
      ctx.moveTo(startX, startY);
      if (project.layout === 'org-chart') {
        const cpY = (startY + endY) / 2;
        ctx.bezierCurveTo(startX, cpY, endX, cpY, endX, endY);
      } else {
        const cpX = (startX + endX) / 2;
        ctx.bezierCurveTo(cpX, startY, cpX, endY, endX, endY);
      }
    }
    ctx.stroke();

    // Terminal connector dot
    ctx.fillStyle = node.color || theme.accentColor;
    ctx.beginPath();
    ctx.arc(endX, endY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // 6. Draw Nodes
  computedNodes.forEach((node) => {
    const x = node.x - node.width / 2;
    const y = node.y - node.height / 2;
    const w = node.width;
    const h = node.height;
    const isSelected = node.id === selectedNodeId;
    const isRoot = node.parentId === null;

    ctx.save();

    // Selection or Root Glow
    if (isSelected || isRoot) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isSelected ? 26 : 16;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 12;
    }

    const radius =
      project.nodeShape === 'pill' ? h / 2 : project.nodeShape === 'rounded' ? 18 : 12;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = isSelected ? node.color : isRoot ? node.color : theme.cardBorder;
    ctx.lineWidth = isSelected ? 3 : isRoot ? 2.5 : 1.5;

    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Color Accent Strip on Left
    ctx.fillStyle = node.color;
    drawRoundedRect(ctx, x + 6, y + 10, 5, h - 20, 3);
    ctx.fill();

    // Emoji / Icon Circle
    const textStartX = x + 20;
    const titleText = `${node.emoji ? node.emoji + ' ' : ''}${node.title}`;
    ctx.fillStyle = theme.textPrimary;
    ctx.font = isRoot ? 'bold 15px Inter, sans-serif' : 'bold 13.5px Inter, sans-serif';
    ctx.fillText(titleText.slice(0, 26), textStartX, y + 26);

    if (node.subtitle) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '500 11.5px Inter, sans-serif';
      ctx.fillText(node.subtitle.slice(0, 32), textStartX, y + 45);
    }

    // Priority & Assignee Row
    const pMeta = PRIORITY_META[node.priority];
    ctx.fillStyle = pMeta.bg;
    drawRoundedRect(ctx, textStartX, y + h - 26, 66, 17, 5);
    ctx.fill();
    ctx.fillStyle = pMeta.color;
    ctx.font = 'bold 9.5px Inter, sans-serif';
    ctx.fillText(pMeta.label, textStartX + 6, y + h - 14);

    if (node.assignee) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '600 10px Inter, sans-serif';
      ctx.fillText(`@${node.assignee.slice(0, 12)}`, textStartX + 74, y + h - 14);
    }

    // Effort badge on top-right
    if (project.showMetrics && node.effortHours > 0) {
      const effText = `${node.effortHours}s`;
      ctx.fillStyle = node.color + '22';
      drawRoundedRect(ctx, x + w - 46, y + 10, 36, 18, 6);
      ctx.fill();
      ctx.fillStyle = node.color;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(effText, x + w - 40, y + 22);
    }

    // Progress Bar at bottom
    if (project.showProgress) {
      const barX = x + w - 66;
      const barY = y + h - 19;
      const barW = 54;
      const barH = 6;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      drawRoundedRect(ctx, barX, barY, barW, barH, 3);
      ctx.fill();

      const fillW = Math.max(4, (Math.min(100, Math.max(0, node.progress)) / 100) * barW);
      ctx.fillStyle = node.progress >= 100 ? '#10b981' : node.color;
      drawRoundedRect(ctx, barX, barY, fillW, barH, 3);
      ctx.fill();
    }

    // Collapsed children count indicator
    const hiddenChildren = project.nodes.filter((c) => c.parentId === node.id);
    if (node.collapsed && hiddenChildren.length > 0) {
      const badgeX = x + w + 6;
      const badgeY = node.y - 11;
      ctx.fillStyle = node.color;
      drawRoundedRect(ctx, badgeX, badgeY, 26, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`+${hiddenChildren.length}`, badgeX + 5, badgeY + 15);
    }

    ctx.restore();
  });

  // 7. Footer Watermark
  ctx.fillStyle = theme.textSecondary;
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    `CORPUS MIND & ARCHITECTURE STUDIO (#022 PRO)  •  DÜZEN: ${project.layout.toUpperCase()}  •  4K ULTRA HD DIŞA AKTARIM`,
    44,
    H - 22
  );

  return computedNodes;
}

export function generateProjectMarkdown(project: MindMapProject): string {
  const lines: string[] = [
    `# ${project.title}`,
    `> ${project.subtitle} | Yazar: ${project.author} | Sürüm: ${project.version}`,
    '',
  ];

  const childrenMap = new Map<string, MindNode[]>();
  project.nodes.forEach((n) => {
    if (n.parentId) {
      const arr = childrenMap.get(n.parentId) || [];
      arr.push(n);
      childrenMap.set(n.parentId, arr);
    }
  });

  const root = project.nodes.find((n) => n.parentId === null);
  if (!root) return lines.join('\n');

  const walk = (node: MindNode, depth: number) => {
    const indent = '  '.repeat(Math.max(0, depth - 1));
    const prefix = depth === 0 ? '##' : '-';
    const meta = `[${PRIORITY_META[node.priority].label} | %${node.progress} | ${node.effortHours} Saat${
      node.assignee ? ' | @' + node.assignee : ''
    }]`;
    lines.push(
      `${indent}${prefix} ${node.emoji || '•'} **${node.title}** ${
        node.subtitle ? `— _${node.subtitle}_` : ''
      } ${meta}`
    );
    if (node.notes) {
      lines.push(`${indent}  > Not: ${node.notes}`);
    }
    const ch = childrenMap.get(node.id) || [];
    ch.forEach((c) => walk(c, depth + 1));
  };

  walk(root, 0);
  return lines.join('\n');
}

export function generateProjectSVG(project: MindMapProject): string {
  const computed = computeMindLayout(project);
  const theme = MIND_THEMES.find((t) => t.id === project.themeId) || MIND_THEMES[0];
  const nodeMap = new Map<string, ComputedMindNode>();
  computed.forEach((n) => nodeMap.set(n.id, n));

  const paths: string[] = [];
  computed.forEach((node) => {
    if (!node.parentId) return;
    const parent = nodeMap.get(node.parentId);
    if (!parent) return;
    paths.push(
      `<line x1="${parent.x}" y1="${parent.y}" x2="${node.x}" y2="${node.y}" stroke="${node.color}" stroke-width="2.5" stroke-opacity="0.85" />`
    );
  });

  const rects: string[] = computed.map((n) => {
    const x = n.x - n.width / 2;
    const y = n.y - n.height / 2;
    const safeTitle = n.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeSub = (n.subtitle || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `
      <g>
        <rect x="${x}" y="${y}" width="${n.width}" height="${n.height}" rx="12" fill="${theme.bgEnd}" stroke="${n.color}" stroke-width="2"/>
        <text x="${x + 18}" y="${y + 30}" fill="${theme.textPrimary}" font-family="Inter, sans-serif" font-size="14" font-weight="bold">${n.emoji || ''} ${safeTitle}</text>
        <text x="${x + 18}" y="${y + 52}" fill="${theme.textSecondary}" font-family="Inter, sans-serif" font-size="11">${safeSub}</text>
        <text x="${x + 18}" y="${y + n.height - 12}" fill="${n.color}" font-family="Inter, sans-serif" font-size="10" font-weight="bold">%${n.progress} • ${n.effortHours}s</text>
      </g>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <rect width="1920" height="1080" fill="${theme.bgStart}"/>
  ${paths.join('\n  ')}
  ${rects.join('\n  ')}
</svg>`;
}
