import * as XLSX from 'xlsx';

export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SprintTask {
  id: string;
  code: string;
  title: string;
  assignee: string;
  tag: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  startDay: number; // 1 to 14 within sprint
  durationDays: number; // 1 to 10
}

export interface SprintBoard {
  id: string;
  sprintName: string;
  sprintGoal: string;
  sprintDays: number;
  tasks: SprintTask[];
}

export const STATUS_COLUMNS: {
  id: TaskStatus;
  label: string;
  color: string;
}[] = [
  { id: 'backlog', label: 'Backlog (Planlanan)', color: '#64748b' },
  { id: 'in-progress', label: 'Devam Eden (Active)', color: '#8b5cf6' },
  { id: 'review', label: 'Kod İnceleme / QA', color: '#f59e0b' },
  { id: 'done', label: 'Tamamlandı (Done)', color: '#10b981' },
];

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string; bg: string }
> = {
  critical: { label: 'P0 Kritik', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  high: { label: 'P1 Yüksek', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  medium: { label: 'P2 Normal', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  low: { label: 'P3 Düşük', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
};

export const PRESET_SPRINTS: Record<string, { name: string; build: () => SprintBoard }> = {
  'saas-release': {
    name: 'SaaS v2.4 Ürün Lansman Sprinti',
    build: () => ({
      id: 'saas-release',
      sprintName: 'Sprint #24 — Corpus Zero-Knowledge Cloud v2.4',
      sprintGoal: 'WebAssembly Şifreleme Motoru, SSO Entegrasyonu ve 4K Raporlama Modülü',
      sprintDays: 14,
      tasks: [
        {
          id: 't1',
          code: 'CRP-101',
          title: 'AES-256-GCM WebCrypto Anahtar Türetme Motoru',
          assignee: 'Ahmet Y.',
          tag: 'Security',
          status: 'done',
          priority: 'critical',
          storyPoints: 8,
          startDay: 1,
          durationDays: 4,
        },
        {
          id: 't2',
          code: 'CRP-102',
          title: 'Kurumsal SAML 2.0 & OIDC Tek Oturum Açma (SSO)',
          assignee: 'Zeynep K.',
          tag: 'Backend',
          status: 'done',
          priority: 'high',
          storyPoints: 5,
          startDay: 2,
          durationDays: 4,
        },
        {
          id: 't3',
          code: 'CRP-103',
          title: 'Gerçek Zamanlı WebSocket Telemetri & Grafik Arayüzü',
          assignee: 'Deniz A.',
          tag: 'Frontend',
          status: 'review',
          priority: 'high',
          storyPoints: 8,
          startDay: 5,
          durationDays: 5,
        },
        {
          id: 't4',
          code: 'CRP-104',
          title: 'Çoklu Kiracı (Multi-Tenant) PostgreSQL Satır İzolasyonu',
          assignee: 'Murat D.',
          tag: 'Database',
          status: 'in-progress',
          priority: 'critical',
          storyPoints: 13,
          startDay: 6,
          durationDays: 6,
        },
        {
          id: 't5',
          code: 'CRP-105',
          title: 'Otomatik E-Arşiv Fatura & Stripe Webhook Köprüsü',
          assignee: 'Selin T.',
          tag: 'FinTech',
          status: 'in-progress',
          priority: 'medium',
          storyPoints: 5,
          startDay: 8,
          durationDays: 4,
        },
        {
          id: 't6',
          code: 'CRP-106',
          title: 'Yük Testi (10.000 Eşzamanlı İstemci) & Sızma Testi',
          assignee: 'Ahmet Y.',
          tag: 'QA / DevOps',
          status: 'backlog',
          priority: 'high',
          storyPoints: 5,
          startDay: 11,
          durationDays: 4,
        },
      ],
    }),
  },
  'mobile-app': {
    name: 'FinTech Mobil Uygulama Sprinti',
    build: () => ({
      id: 'mobile-app',
      sprintName: 'Sprint #11 — NovaPay iOS & Android Biyometrik Cüzdan',
      sprintGoal: 'FaceID Hızlı Transfer, FAST Karekod Okuyucu ve Anlık Bildirimler',
      sprintDays: 14,
      tasks: [
        {
          id: 'm1',
          code: 'MOB-401',
          title: 'FaceID / TouchID Donanım Anahtarlık Entegrasyonu',
          assignee: 'Kerem S.',
          tag: 'iOS / Swift',
          status: 'done',
          priority: 'critical',
          storyPoints: 8,
          startDay: 1,
          durationDays: 5,
        },
        {
          id: 'm2',
          code: 'MOB-402',
          title: 'TR Karekod (EMVCo) Kamera Tarayıcı Modülü',
          assignee: 'Elif B.',
          tag: 'Android',
          status: 'in-progress',
          priority: 'high',
          storyPoints: 5,
          startDay: 4,
          durationDays: 5,
        },
        {
          id: 'm3',
          code: 'MOB-403',
          title: 'Harcama Kategorileri & Aylık Bütçe Limit Grafiği',
          assignee: 'Deniz A.',
          tag: 'UI / UX',
          status: 'review',
          priority: 'medium',
          storyPoints: 3,
          startDay: 6,
          durationDays: 4,
        },
        {
          id: 'm4',
          code: 'MOB-404',
          title: 'App Store & Play Store Beta Dağıtım Paketi',
          assignee: 'Kerem S.',
          tag: 'Release',
          status: 'backlog',
          priority: 'medium',
          storyPoints: 3,
          startDay: 11,
          durationDays: 3,
        },
      ],
    }),
  },
};

export const DEFAULT_SPRINT_BOARD: SprintBoard = PRESET_SPRINTS['saas-release'].build();

export function calculateSprintMetrics(board: SprintBoard) {
  const totalTasks = board.tasks.length;
  const doneTasks = board.tasks.filter((t) => t.status === 'done').length;
  const totalPoints = board.tasks.reduce((acc, t) => acc + t.storyPoints, 0);
  const completedPoints = board.tasks
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + t.storyPoints, 0);
  const activePoints = board.tasks
    .filter((t) => t.status === 'in-progress' || t.status === 'review')
    .reduce((acc, t) => acc + t.storyPoints, 0);

  const completionPercent = totalPoints
    ? Math.round((completedPoints / totalPoints) * 100)
    : 0;

  return {
    totalTasks,
    doneTasks,
    totalPoints,
    completedPoints,
    activePoints,
    completionPercent,
  };
}

/** Export Sprint Kanban & Gantt Schedule to Multi-Sheet Excel (.xlsx) */
export function exportSprintToExcel(board: SprintBoard) {
  const wb = XLSX.utils.book_new();

  const rows = board.tasks.map((t) => ({
    'Görev Kodu': t.code,
    'Görev Başlığı': t.title,
    'Sorumlu Kişi': t.assignee,
    Etiket: t.tag,
    Durum: STATUS_COLUMNS.find((s) => s.id === t.status)?.label || t.status,
    Öncelik: PRIORITY_META[t.priority].label,
    'Efor (Story Point)': t.storyPoints,
    'Başlangıç Günü': `Gün ${t.startDay}`,
    'Bitiş Günü': `Gün ${t.startDay + t.durationDays - 1}`,
    'Süre (Gün)': t.durationDays,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sprint_Gorev_ve_Gantt');
  XLSX.writeFile(
    wb,
    `${board.sprintName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'corpus-sprint'}.xlsx`
  );
}

/** Render 4K Sprint Kanban & Gantt Timeline Roadmap to HTML5 Canvas */
export function renderSprintRoadmapToCanvas(
  canvas: HTMLCanvasElement,
  board: SprintBoard
): void {
  const width = 1440;
  const height = 860;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const metrics = calculateSprintMetrics(board);

  // Dark Studio Background
  ctx.fillStyle = '#09090d';
  ctx.fillRect(0, 0, width, height);

  // Header Banner
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, width, 84);
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(0, 82, width, 2);

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 21px Inter, system-ui, sans-serif';
  ctx.fillText(board.sprintName, 36, 36);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(
    `Sprint Hedefi: ${board.sprintGoal}   •   Tamamlanma: %${metrics.completionPercent} (${metrics.completedPoints}/${metrics.totalPoints} SP)`,
    36,
    62
  );

  // Top 4 Column Summary Pills
  const colW = (width - 72 - 48) / 4;
  STATUS_COLUMNS.forEach((col, i) => {
    const cx = 36 + i * (colW + 16);
    const cy = 104;
    const count = board.tasks.filter((t) => t.status === col.id).length;
    const pts = board.tasks
      .filter((t) => t.status === col.id)
      .reduce((a, b) => a + b.storyPoints, 0);

    ctx.fillStyle = '#13131c';
    ctx.strokeStyle = '#272732';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, cy, colW, 74, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = col.color;
    ctx.fillRect(cx, cy, colW, 4);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(col.label, cx + 16, cy + 28);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px JetBrains Mono, monospace';
    ctx.fillText(`${count} Görev (${pts} SP)`, cx + 16, cy + 56);
  });

  // Main Gantt Timeline Chart Card
  const ganttX = 36;
  const ganttY = 200;
  const ganttW = width - 72;
  const ganttH = height - 236;

  ctx.fillStyle = '#13131c';
  ctx.strokeStyle = '#272732';
  ctx.beginPath();
  ctx.roundRect(ganttX, ganttY, ganttW, ganttH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText(
    `14 Günlük Sprint Gantt Zaman Çizelgesi & Efor Dağılımı`,
    ganttX + 24,
    ganttY + 36
  );

  const leftColW = 430;
  const timelineX = ganttX + leftColW;
  const timelineW = ganttW - leftColW - 28;
  const days = board.sprintDays || 14;
  const dayW = timelineW / days;

  // Day headers (Gün 1 .. Gün 14)
  for (let d = 1; d <= days; d++) {
    const dx = timelineX + (d - 1) * dayW;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`G${d}`, dx + dayW / 2 - 8, ganttY + 68);

    // Vertical grid line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(dx, ganttY + 78);
    ctx.lineTo(dx, ganttY + ganttH - 20);
    ctx.stroke();
  }

  // Task Rows in Gantt
  let rowY = ganttY + 92;
  const rowH = 54;

  board.tasks.slice(0, 9).forEach((task, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#171722' : '#13131c';
    ctx.fillRect(ganttX + 14, rowY, ganttW - 28, rowH - 6);

    // Code + Title + Assignee
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(task.code, ganttX + 26, rowY + 20);

    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText(task.title.slice(0, 38), ganttX + 92, rowY + 20);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(
      `👤 ${task.assignee}  •  ${task.tag}  •  ${task.storyPoints} SP`,
      ganttX + 92,
      rowY + 38
    );

    // Gantt Bar
    const statusObj =
      STATUS_COLUMNS.find((s) => s.id === task.status) || STATUS_COLUMNS[0];
    const barX = timelineX + (Math.max(1, task.startDay) - 1) * dayW + 4;
    const barW = Math.max(dayW - 8, task.durationDays * dayW - 8);

    ctx.fillStyle = statusObj.color;
    ctx.beginPath();
    ctx.roundRect(barX, rowY + 11, barW, 26, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(
      `${statusObj.label.split(' ')[0]} (${task.durationDays}g)`,
      barX + 10,
      rowY + 28
    );

    rowY += rowH;
  });
}

export function exportSprintRoadmapPng(canvas: HTMLCanvasElement, name: string) {
  const url = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'corpus-gantt'}-4k.png`;
  a.click();
}
