import * as XLSX from 'xlsx';

export interface GanttTask {
  id: string;
  code: string;
  phase: string;
  title: string;
  owner: string;
  startWeek: number; // 1..24
  durationWeeks: number;
  progress: number; // 0..100
  dependsOn: string | null;
  isMilestone: boolean;
  isCritical: boolean;
  color: string;
}

export interface GanttProject {
  id: string;
  title: string;
  subtitle: string;
  manager: string;
  totalWeeks: number;
  currentWeek: number;
  themeId: string;
  tasks: GanttTask[];
}

export const GANTT_THEMES = [
  {
    id: 'cyber-roadmap',
    name: 'Cyber Roadmap',
    bgStart: '#09090b',
    bgEnd: '#0f172a',
    accent: '#06b6d4',
    critical: '#f43f5e',
    cardBg: 'rgba(24, 24, 27, 0.94)',
    border: 'rgba(63, 63, 70, 0.8)',
  },
  {
    id: 'emerald-agile',
    name: 'Emerald Agile',
    bgStart: '#04120c',
    bgEnd: '#092218',
    accent: '#10b981',
    critical: '#f59e0b',
    cardBg: 'rgba(6, 28, 20, 0.94)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  {
    id: 'violet-program',
    name: 'Violet Enterprise',
    bgStart: '#0d091a',
    bgEnd: '#1e1b4b',
    accent: '#8b5cf6',
    critical: '#ec4899',
    cardBg: 'rgba(24, 20, 44, 0.94)',
    border: 'rgba(139, 92, 246, 0.4)',
  },
];

export const GANTT_PRESETS: Record<string, GanttProject> = {
  'cloud-migration': {
    id: 'cloud-migration',
    title: 'Multi-Region Kubernetes & Zero-Trust Bulut Göçü Programı',
    subtitle: '20 Haftalık Kritik Yol (CPM), Faz Geçişleri & Sorumlu Ekip Matrisi',
    manager: 'Alperen G. (Principal Program Manager)',
    totalWeeks: 20,
    currentWeek: 9,
    themeId: 'cyber-roadmap',
    tasks: [
      {
        id: 't1',
        code: 'WBS-1.1',
        phase: 'Faz 1: Keşif & Mimari',
        title: 'Mevcut Monolit Bağımlılık Haritası & SLA Analizi',
        owner: 'Arch Team',
        startWeek: 1,
        durationWeeks: 3,
        progress: 100,
        dependsOn: null,
        isMilestone: false,
        isCritical: true,
        color: '#06b6d4',
      },
      {
        id: 't2',
        code: 'WBS-1.2',
        phase: 'Faz 1: Keşif & Mimari',
        title: 'Terraform IaC & Multi-AZ VPC Ağ Omurgası Kurulumu',
        owner: 'DevSecOps',
        startWeek: 4,
        durationWeeks: 3,
        progress: 100,
        dependsOn: 't1',
        isMilestone: false,
        isCritical: true,
        color: '#38bdf8',
      },
      {
        id: 't3',
        code: 'MS-01',
        phase: 'Faz 1: Keşif & Mimari',
        title: '♦ KİLOMETRE TAŞI: Bulut Güvenlik & Mimari Onayı',
        owner: 'CISO & CTO',
        startWeek: 6,
        durationWeeks: 1,
        progress: 100,
        dependsOn: 't2',
        isMilestone: true,
        isCritical: true,
        color: '#f59e0b',
      },
      {
        id: 't4',
        code: 'WBS-2.1',
        phase: 'Faz 2: Veri & Mikroservis',
        title: 'PostgreSQL CDC (Debezium) Canlı Veri Senkronizasyonu',
        owner: 'Data Eng',
        startWeek: 7,
        durationWeeks: 4,
        progress: 75,
        dependsOn: 't3',
        isMilestone: false,
        isCritical: true,
        color: '#8b5cf6',
      },
      {
        id: 't5',
        code: 'WBS-2.2',
        phase: 'Faz 2: Veri & Mikroservis',
        title: 'Kimlik Doğrulama (OAuth2 / OIDC) & API Gateway Geçişi',
        owner: 'Core Backend',
        startWeek: 8,
        durationWeeks: 4,
        progress: 55,
        dependsOn: 't3',
        isMilestone: false,
        isCritical: false,
        color: '#10b981',
      },
      {
        id: 't6',
        code: 'WBS-2.3',
        phase: 'Faz 2: Veri & Mikroservis',
        title: 'Ödeme & Muhasebe Çekirdek Servislerinin Konteynerizasyonu',
        owner: 'Ledger Squad',
        startWeek: 11,
        durationWeeks: 4,
        progress: 25,
        dependsOn: 't4',
        isMilestone: false,
        isCritical: true,
        color: '#f43f5e',
      },
      {
        id: 't7',
        code: 'WBS-3.1',
        phase: 'Faz 3: Test & Canlıya Geçiş',
        title: 'Kaos Mühendisliği (Chaos Mesh) & 100K TPS Yük Testi',
        owner: 'SRE & QA',
        startWeek: 15,
        durationWeeks: 3,
        progress: 0,
        dependsOn: 't6',
        isMilestone: false,
        isCritical: true,
        color: '#ec4899',
      },
      {
        id: 't8',
        code: 'MS-02',
        phase: 'Faz 3: Test & Canlıya Geçiş',
        title: '♦ KİLOMETRE TAŞI: Sıfır Kesintili DNS Cutover & Go-Live',
        owner: 'Tüm Ekipler',
        startWeek: 18,
        durationWeeks: 2,
        progress: 0,
        dependsOn: 't7',
        isMilestone: true,
        isCritical: true,
        color: '#10b981',
      },
    ],
  },
  'ai-product-launch': {
    id: 'ai-product-launch',
    title: 'Corpus AI Copilot 3.0 Global Lansman & GTM Yol Haritası',
    subtitle: 'Model Eğitimi, Güvenlik Denetimi, Beta Programı & Kurumsal Satış Takvimi',
    manager: 'Selin Y. (VP of Product)',
    totalWeeks: 16,
    currentWeek: 7,
    themeId: 'violet-program',
    tasks: [
      {
        id: 'a1',
        code: 'AI-101',
        phase: 'Model & Veri',
        title: 'Sektörel Veri Seti Kürasyonu & Sentetik Veri Üretimi',
        owner: 'AI Research',
        startWeek: 1,
        durationWeeks: 3,
        progress: 100,
        dependsOn: null,
        isMilestone: false,
        isCritical: true,
        color: '#8b5cf6',
      },
      {
        id: 'a2',
        code: 'AI-102',
        phase: 'Model & Veri',
        title: 'LoRA Fine-Tuning & Halüsinasyon Benchmark Testleri',
        owner: 'MLOps',
        startWeek: 4,
        durationWeeks: 4,
        progress: 85,
        dependsOn: 'a1',
        isMilestone: false,
        isCritical: true,
        color: '#06b6d4',
      },
      {
        id: 'a3',
        code: 'UX-201',
        phase: 'Ürün & Arayüz',
        title: 'Streaming Yanıt Editörü & Kanvas Entegrasyonu',
        owner: 'Frontend Squad',
        startWeek: 5,
        durationWeeks: 4,
        progress: 60,
        dependsOn: 'a1',
        isMilestone: false,
        isCritical: false,
        color: '#10b981',
      },
      {
        id: 'a4',
        code: 'SEC-301',
        phase: 'Güvenlik & Beta',
        title: 'Red-Team Prompt Injection Testi & SOC2 Kontrolleri',
        owner: 'SecOps',
        startWeek: 8,
        durationWeeks: 3,
        progress: 30,
        dependsOn: 'a2',
        isMilestone: false,
        isCritical: true,
        color: '#f43f5e',
      },
      {
        id: 'a5',
        code: 'GTM-401',
        phase: 'Lansman',
        title: '♦ KİLOMETRE TAŞI: 50 Kurumsal Müşteri Kapalı Beta & Lansman',
        owner: 'Growth & Sales',
        startWeek: 11,
        durationWeeks: 4,
        progress: 10,
        dependsOn: 'a4',
        isMilestone: true,
        isCritical: true,
        color: '#f59e0b',
      },
    ],
  },
};

export function calculateGanttMetrics(project: GanttProject) {
  const totalTasks = project.tasks.length;
  const criticalTasks = project.tasks.filter((t) => t.isCritical).length;
  const milestones = project.tasks.filter((t) => t.isMilestone).length;
  const avgProgress =
    totalTasks > 0
      ? Math.round(project.tasks.reduce((a, b) => a + b.progress, 0) / totalTasks)
      : 0;
  const maxEndWeek = project.tasks.reduce(
    (max, t) => Math.max(max, t.startWeek + t.durationWeeks - 1),
    1
  );

  // Resource workload by owner
  const ownerMap = new Map<string, number>();
  project.tasks.forEach((t) => {
    ownerMap.set(t.owner, (ownerMap.get(t.owner) || 0) + t.durationWeeks);
  });

  const ownerLoads = Array.from(ownerMap.entries()).map(([owner, weeks]) => ({
    owner,
    weeks,
  }));

  return {
    totalTasks,
    criticalTasks,
    milestones,
    avgProgress,
    maxEndWeek,
    ownerLoads,
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
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function renderGanttCanvas(canvas: HTMLCanvasElement, project: GanttProject) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const theme =
    GANTT_THEMES.find((t) => t.id === project.themeId) || GANTT_THEMES[0];
  const metrics = calculateGanttMetrics(project);

  // 1. Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.bgStart);
  bg.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Top Header Banner
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 40, 28, W - 80, 88, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  drawRoundedRect(ctx, 60, 46, 6, 52, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 23px Inter, sans-serif';
  ctx.fillText(project.title, 82, 68);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `${project.subtitle}  •  YÖNETİCİ: ${project.manager}  •  AKTİF HAFTA: W${project.currentWeek}/${project.totalWeeks}`,
    82,
    95
  );

  // Header KPI Pills
  const pills = [
    { l: 'GENEL İLERLEME', v: `%${metrics.avgProgress}`, c: '#10b981' },
    { l: 'KRİTİK YOL (CPM)', v: `${metrics.criticalTasks} Görev`, c: theme.critical },
    { l: 'KİLOMETRE TAŞI', v: `${metrics.milestones} Adet`, c: '#f59e0b' },
    { l: 'TOPLAM SÜRE', v: `${metrics.maxEndWeek} Hafta`, c: theme.accent },
  ];
  pills.forEach((p, idx) => {
    const px = W - 660 + idx * 154;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
    ctx.strokeStyle = p.c + '66';
    drawRoundedRect(ctx, px, 42, 144, 60, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(p.l, px + 14, 62);

    ctx.fillStyle = p.c;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(p.v, px + 14, 88);
  });

  // 3. Main Gantt Matrix Frame
  const ganttX = 40;
  const ganttY = 136;
  const ganttW = W - 80;
  const ganttH = 740;

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  drawRoundedRect(ctx, ganttX, ganttY, ganttW, ganttH, 16);
  ctx.fill();
  ctx.stroke();

  const leftColW = 540;
  const timelineX = ganttX + leftColW;
  const timelineW = ganttW - leftColW - 28;
  const totalWeeks = Math.max(8, project.totalWeeks);
  const weekColW = timelineW / totalWeeks;

  // Timeline Header Row
  ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
  drawRoundedRect(ctx, ganttX + 16, ganttY + 16, ganttW - 32, 48, 10);
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText('KOD & GÖREV ADI', ganttX + 32, ganttY + 45);
  ctx.fillText('SORUMLU', ganttX + 390, ganttY + 45);
  ctx.fillText('DURUM', ganttX + 475, ganttY + 45);

  // Week Columns & Grid Lines
  for (let w = 1; w <= totalWeeks; w++) {
    const wx = timelineX + (w - 1) * weekColW;
    const isCurrent = w === project.currentWeek;

    if (isCurrent) {
      ctx.fillStyle = theme.accent + '18';
      ctx.fillRect(wx, ganttY + 68, weekColW, ganttH - 88);
    }

    ctx.strokeStyle = isCurrent
      ? theme.accent
      : 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = isCurrent ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(wx, ganttY + 18);
    ctx.lineTo(wx, ganttY + ganttH - 20);
    ctx.stroke();

    ctx.fillStyle = isCurrent ? theme.accent : '#94a3b8';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(`W${w}`, wx + weekColW / 2 - 10, ganttY + 45);
  }

  // 4. Task Rows & Bars
  const rowStartY = ganttY + 80;
  const rowH = 68;
  const barCoords = new Map<string, { startX: number; endX: number; centerY: number }>();

  project.tasks.slice(0, 9).forEach((task, idx) => {
    const ry = rowStartY + idx * rowH;

    // Row Stripe
    ctx.fillStyle =
      idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.25)';
    drawRoundedRect(ctx, ganttX + 16, ry, ganttW - 32, rowH - 8, 8);
    ctx.fill();

    // Critical Badge Indicator
    ctx.fillStyle = task.isCritical ? theme.critical : task.color;
    drawRoundedRect(ctx, ganttX + 24, ry + 12, 5, rowH - 32, 2.5);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(
      `${task.code} — ${task.title.slice(0, 36)}`,
      ganttX + 38,
      ry + 26
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(
      `${task.phase} ${task.isCritical ? ' • [KRİTİK YOL]' : ''}`,
      ganttX + 38,
      ry + 46
    );

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 11.5px Inter, sans-serif';
    ctx.fillText(task.owner.slice(0, 12), ganttX + 390, ry + 35);

    ctx.fillStyle = task.progress >= 100 ? '#10b981' : theme.accent;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`%${task.progress}`, ganttX + 478, ry + 35);

    // Gantt Bar on Timeline
    const barX = timelineX + (task.startWeek - 1) * weekColW + 4;
    const barW = Math.max(24, task.durationWeeks * weekColW - 8);
    const barY = ry + 14;
    const barH = 32;

    barCoords.set(task.id, {
      startX: barX,
      endX: barX + barW,
      centerY: barY + barH / 2,
    });

    // Outer Bar Track
    ctx.fillStyle = task.color + '30';
    ctx.strokeStyle = task.isCritical ? theme.critical : task.color;
    ctx.lineWidth = task.isCritical ? 2.2 : 1.5;
    drawRoundedRect(ctx, barX, barY, barW, barH, 8);
    ctx.fill();
    ctx.stroke();

    // Inner Progress Fill
    if (task.progress > 0) {
      const fillW = Math.max(8, (task.progress / 100) * barW);
      ctx.fillStyle = task.color;
      drawRoundedRect(ctx, barX, barY, fillW, barH, 8);
      ctx.fill();
    }

    // Label inside Bar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(
      `${task.isMilestone ? '♦ ' : ''}W${task.startWeek}–W${
        task.startWeek + task.durationWeeks - 1
      } (%${task.progress})`,
      barX + 10,
      barY + 20
    );
  });

  // 5. Dependency Connectors
  project.tasks.slice(0, 9).forEach((task) => {
    if (!task.dependsOn) return;
    const from = barCoords.get(task.dependsOn);
    const to = barCoords.get(task.id);
    if (!from || !to) return;

    ctx.save();
    ctx.strokeStyle = task.isCritical ? theme.critical : '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(from.endX, from.centerY);
    ctx.lineTo(from.endX + 10, from.centerY);
    ctx.lineTo(from.endX + 10, to.centerY);
    ctx.lineTo(to.startX, to.centerY);
    ctx.stroke();
    ctx.restore();
  });

  // 6. Bottom Resource Capacity Bar
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.border;
  drawRoundedRect(ctx, 40, 896, W - 80, 140, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText(
    'KAYNAK & EKİP KAPASİTE DAĞILIMI (TOPLAM HAFTALIK İŞ YÜKÜ)',
    68,
    928
  );

  metrics.ownerLoads.slice(0, 6).forEach((item, idx) => {
    const ox = 68 + idx * 300;
    const oy = 946;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
    drawRoundedRect(ctx, ox, oy, 280, 68, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13.5px Inter, sans-serif';
    ctx.fillText(item.owner, ox + 16, oy + 26);

    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${item.weeks} Hafta-Ekip Eforu`, ox + 16, oy + 52);
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS GANTT, ROADMAP & CRITICAL PATH STUDIO (#026 PRO)  •  4K ULTRA HD TIMELINE',
    44,
    H - 16
  );
}

export function exportGanttExcel(project: GanttProject) {
  const wb = XLSX.utils.book_new();
  const rows = project.tasks.map((t) => ({
    Kod: t.code,
    Faz: t.phase,
    'Görev / İş Paketi': t.title,
    'Sorumlu Ekip': t.owner,
    'Başlangıç Haftası': `W${t.startWeek}`,
    'Süre (Hafta)': t.durationWeeks,
    'Bitiş Haftası': `W${t.startWeek + t.durationWeeks - 1}`,
    'İlerleme (%)': t.progress,
    'Kritik Yol (CPM)': t.isCritical ? 'EVET' : 'Hayır',
    'Kilometre Taşı': t.isMilestone ? 'EVET' : 'Hayır',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Gantt Yol Haritası');
  XLSX.writeFile(wb, `${project.id}-Corpus-Gantt.xlsx`);
}
