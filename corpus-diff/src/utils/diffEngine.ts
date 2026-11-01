export type DiffViewMode = 'split' | 'unified' | 'canvas';
export type ReviewVerdict = 'APPROVED' | 'CHANGES_REQUESTED' | 'SECURITY_BLOCK';

export interface DiffLine {
  type: 'equal' | 'add' | 'remove';
  oldLineNo: number | null;
  newLineNo: number | null;
  content: string;
}

export interface ReviewComment {
  id: string;
  lineRef: string;
  severity: 'info' | 'warning' | 'critical';
  author: string;
  message: string;
}

export interface DiffProject {
  id: string;
  prNumber: string;
  title: string;
  filePath: string;
  author: string;
  reviewer: string;
  verdict: ReviewVerdict;
  oldText: string;
  newText: string;
  comments: ReviewComment[];
}

export const DIFF_PRESETS: Record<string, DiffProject> = {
  'auth-jwt-hardening': {
    id: 'auth-jwt-hardening',
    prNumber: 'PR #1482',
    title: 'fix(security): Sıfır Güven JWT İmza Doğrulaması & Rate Limiter Sıkılaştırması',
    filePath: 'src/security/tokenVerifier.ts',
    author: 'kdemir (Principal SecOps)',
    reviewer: 'syilmaz (Staff Eng)',
    verdict: 'APPROVED',
    oldText: `export async function verifySessionToken(token: string) {
  const decoded = jwt.decode(token);
  if (!decoded) {
    throw new Error("Invalid token");
  }
  // TODO: add signature verification
  const user = await db.users.findById(decoded.sub);
  return {
    authenticated: true,
    role: user.role,
    rateLimit: 1000
  };
}`,
    newText: `export async function verifySessionToken(token: string, kmsPublicKey: CryptoKey) {
  const verified = await jwt.verifyRS256(token, kmsPublicKey, {
    issuer: "https://auth.corpus.suite",
    audience: "corpus-enterprise-api",
    clockToleranceSec: 5
  });
  const user = await db.users.findActiveById(verified.sub);
  if (!user || user.isRevoked) {
    throw new SecurityException("SESSION_REVOKED_OR_EXPIRED", 401);
  }
  return {
    authenticated: true,
    role: user.role,
    permissions: verified.scopes,
    rateLimit: 120
  };
}`,
    comments: [
      {
        id: 'c1',
        lineRef: 'L2-L6',
        severity: 'critical',
        author: 'SecOps Bot',
        message: 'jwt.decode() yerine KMS RS256 kriptografik imza doğrulaması zorunlu kılındı (CVE-2026-019).',
      },
      {
        id: 'c2',
        lineRef: 'L8-L10',
        severity: 'warning',
        author: 'syilmaz',
        message: 'İptal edilmiş (isRevoked) oturumlar için anlık kontrol eklendi, harika.',
      },
    ],
  },
  'k8s-autoscaler-yaml': {
    id: 'k8s-autoscaler-yaml',
    prNumber: 'PR #1509',
    title: 'perf(k8s): Ödeme Geçidi HPA Otomatik Ölçekleme & Bellek Limitleri Güncellemesi',
    filePath: 'k8s/production/payment-gateway-hpa.yaml',
    author: 'agokce (Cloud Architect)',
    reviewer: 'mertk (SRE Lead)',
    verdict: 'APPROVED',
    oldText: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-gateway-hpa
spec:
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 85`,
    newText: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-gateway-hpa
  namespace: fintech-prod
spec:
  minReplicas: 6
  maxReplicas: 32
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65`,
    comments: [
      {
        id: 'c1',
        lineRef: 'L7-L8',
        severity: 'info',
        author: 'mertk',
        message: 'Black Friday trafiği için minReplicas 2 -> 6 ve maxReplicas 8 -> 32 seviyesine çıkarıldı.',
      },
    ],
  },
};

export function computeLineDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.replace(/\r\n/g, '\n').split('\n');
  const newLines = newStr.replace(/\r\n/g, '\n').split('\n');

  const N = oldLines.length;
  const M = newLines.length;

  // LCS Dynamic Programming table
  const dp: number[][] = Array.from({ length: N + 1 }, () =>
    new Array(M + 1).fill(0)
  );

  for (let i = N - 1; i >= 0; i--) {
    for (let j = M - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let oldNum = 1;
  let newNum = 1;

  while (i < N && j < M) {
    if (oldLines[i] === newLines[j]) {
      result.push({
        type: 'equal',
        oldLineNo: oldNum++,
        newLineNo: newNum++,
        content: oldLines[i],
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({
        type: 'remove',
        oldLineNo: oldNum++,
        newLineNo: null,
        content: oldLines[i],
      });
      i++;
    } else {
      result.push({
        type: 'add',
        oldLineNo: null,
        newLineNo: newNum++,
        content: newLines[j],
      });
      j++;
    }
  }

  while (i < N) {
    result.push({
      type: 'remove',
      oldLineNo: oldNum++,
      newLineNo: null,
      content: oldLines[i++],
    });
  }
  while (j < M) {
    result.push({
      type: 'add',
      oldLineNo: null,
      newLineNo: newNum++,
      content: newLines[j++],
    });
  }

  return result;
}

export function generateUnifiedPatch(project: DiffProject, diffLines: DiffLine[]): string {
  const header = [
    `--- a/${project.filePath}`,
    `+++ b/${project.filePath}`,
    `@@ -1,${project.oldText.split('\n').length} +1,${project.newText.split('\n').length} @@ ${project.prNumber}: ${project.title}`,
  ];
  const body = diffLines.map((ln) => {
    const prefix = ln.type === 'add' ? '+' : ln.type === 'remove' ? '-' : ' ';
    return `${prefix}${ln.content}`;
  });
  return [...header, ...body].join('\n');
}

function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderDiffCanvas(
  canvas: HTMLCanvasElement,
  project: DiffProject,
  diffLines: DiffLine[]
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const added = diffLines.filter((d) => d.type === 'add').length;
  const removed = diffLines.filter((d) => d.type === 'remove').length;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header Card
  ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 40, 28, W - 80, 92, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  drawRoundedBox(ctx, 60, 48, 6, 52, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText(`${project.prNumber} — ${project.title.slice(0, 68)}`, 82, 70);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13.5px monospace';
  ctx.fillText(
    `DOSYA: ${project.filePath}  •  YAZAR: ${project.author}  •  DENETÇİ: ${project.reviewer}`,
    82,
    98
  );

  // Diff Stat Pill
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.strokeStyle = '#10b981';
  drawRoundedBox(ctx, W - 440, 44, 376, 60, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`+${added} Eklendi`, W - 418, 81);

  ctx.fillStyle = '#f43f5e';
  ctx.fillText(`-${removed} Silindi`, W - 260, 81);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText(project.verdict, W - 135, 80);

  // Main Diff Code Window
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
  drawRoundedBox(ctx, 40, 140, 1260, 880, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('BİRLEŞİK KOD FARKI (UNIFIED LCS DIFF GÖRÜNÜMÜ)', 68, 176);

  diffLines.slice(0, 24).forEach((ln, idx) => {
    const ly = 198 + idx * 32;
    if (ln.type === 'add') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.fillRect(56, ly - 18, 1228, 28);
    } else if (ln.type === 'remove') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
      ctx.fillRect(56, ly - 18, 1228, 28);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    const oldNo = ln.oldLineNo !== null ? String(ln.oldLineNo).padStart(2, ' ') : '  ';
    const newNo = ln.newLineNo !== null ? String(ln.newLineNo).padStart(2, ' ') : '  ';
    ctx.fillText(`${oldNo} ${newNo}`, 68, ly);

    const sign = ln.type === 'add' ? '+' : ln.type === 'remove' ? '-' : ' ';
    ctx.fillStyle =
      ln.type === 'add' ? '#34d399' : ln.type === 'remove' ? '#fb7185' : '#e2e8f0';
    ctx.font = '13.5px monospace';
    ctx.fillText(`${sign} ${ln.content.slice(0, 88)}`, 132, ly);
  });

  // Right Panel: Review Notes & Security Audit
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 1324, 140, 556, 880, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('KOD İNCELEME (CODE REVIEW) & GÜVENLİK NOTLARI', 1352, 176);

  project.comments.forEach((c, idx) => {
    const cy = 205 + idx * 140;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.strokeStyle =
      c.severity === 'critical'
        ? '#f43f5e'
        : c.severity === 'warning'
        ? '#f59e0b'
        : '#38bdf8';
    drawRoundedBox(ctx, 1352, cy, 500, 120, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`[${c.lineRef}] @${c.author} (${c.severity.toUpperCase()})`, 1372, cy + 28);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 12.5px Inter, sans-serif';
    ctx.fillText(c.message.slice(0, 56), 1372, cy + 58);
    if (c.message.length > 56) {
      ctx.fillText(c.message.slice(56, 112), 1372, cy + 82);
    }
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS DIFF, CODE REVIEW & PATCH STUDIO (#027 PRO)  •  LCS SATIR KARŞILAŞTIRMA MOTORU',
    44,
    H - 18
  );
}
