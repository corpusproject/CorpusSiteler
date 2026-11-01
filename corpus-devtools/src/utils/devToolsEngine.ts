export type DevToolMode = 'regex' | 'cron' | 'jwt' | 'schema';

export interface RegexMatchItem {
  index: number;
  match: string;
  start: number;
  end: number;
  groups: { name: string; value: string }[];
}

export interface RegexTokenExplanation {
  token: string;
  desc: string;
}

export interface CronAnalysis {
  expression: string;
  isValid: boolean;
  humanReadable: string;
  fields: {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
  };
  nextRuns: string[];
  snippets: {
    crontab: string;
    githubActions: string;
    k8sCronJob: string;
  };
}

export interface JwtAnalysis {
  isValidStructure: boolean;
  headerRaw: string;
  payloadRaw: string;
  signatureRaw: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  algorithm: string;
  issuedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  ttlText: string;
  securityScore: number;
  securityFindings: { level: 'ok' | 'warn' | 'critical'; message: string }[];
}

export interface SchemaConversionResult {
  isValidJson: boolean;
  error?: string;
  typescriptInterface: string;
  postgresSql: string;
  zodSchema: string;
  fieldCount: number;
}

export interface DevToolsState {
  mode: DevToolMode;
  projectTitle: string;
  environmentTag: string;
  // Regex state
  regexPattern: string;
  regexFlags: string;
  regexTestString: string;
  // Cron state
  cronExpression: string;
  cronJobName: string;
  cronTimezone: string;
  // JWT state
  jwtToken: string;
  jwtSecret: string;
  // Schema & Crypto state
  jsonInput: string;
  schemaRootName: string;
  hashInput: string;
}

export const REGEX_PRESETS: {
  id: string;
  label: string;
  pattern: string;
  flags: string;
  sample: string;
}[] = [
  {
    id: 'tr-iban-email',
    label: 'TR IBAN & Kurumsal E-Posta Yakalayıcı',
    pattern: '(?<iban>TR\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2})|(?<email>[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
    flags: 'gm',
    sample: `Ödeme Bildirimi #2026-884:
Müşteri İletişim: finans@corpuscloud.io ve muhasebe@holding.com.tr
Ana Hesap IBAN: TR33 0006 1005 1978 6457 8413 26
Yedek Hesap IBAN: TR89 0001 5001 5800 7299 4411 09
Destek: destek@fintech.io`,
  },
  {
    id: 'nginx-access-log',
    label: 'API Gateway / Nginx Erişim Logu Analizi',
    pattern: '(?<ip>\\d{1,3}(?:\\.\\d{1,3}){3})\\s-\\s-\\s\\[(?<date>[^\\]]+)\\]\\s"(?<method>GET|POST|PUT|DELETE)\\s(?<path>[^\\s]+)\\sHTTP/[0-9.]+"\\s(?<status>\\d{3})\\s(?<latency>\\d+)ms',
    flags: 'gm',
    sample: `192.168.1.42 - - [17/Oct/2026:14:22:09 +0300] "POST /api/v2/payments/charge HTTP/1.1" 200 18ms
10.24.88.105 - - [17/Oct/2026:14:22:14 +0300] "GET /api/v2/ledger/balance HTTP/1.1" 200 7ms
172.16.0.19 - - [17/Oct/2026:14:22:19 +0300] "DELETE /api/v2/sessions/expired HTTP/1.1" 502 412ms
185.92.11.4 - - [17/Oct/2026:14:22:25 +0300] "POST /api/v2/auth/token HTTP/1.1" 401 34ms`,
  },
  {
    id: 'semver-release',
    label: 'SemVer Sürüm Etiketleri (vX.Y.Z-prerelease)',
    pattern: 'v(?<major>0|[1-9]\\d*)\\.(?<minor>0|[1-9]\\d*)\\.(?<patch>0|[1-9]\\d*)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?',
    flags: 'g',
    sample: `Dağıtım Geçmişi:
Core Engine: v4.2.0-rc.1 -> v4.2.0
Edge Worker: v2.14.8-beta.3
Legacy Adapter: v1.0.9`,
  },
];

export const CRON_PRESETS: { id: string; label: string; expr: string; job: string }[] = [
  {
    id: 'weekday-morning',
    label: 'Hafta İçi Her Sabah 09:00 (Finans Özeti)',
    expr: '0 9 * * 1-5',
    job: 'daily-cfo-executive-digest',
  },
  {
    id: 'every-15-min',
    label: 'Her 15 Dakikada Bir (Sağlık & SLA Kontrolü)',
    expr: '*/15 * * * *',
    job: 'cluster-health-heartbeat-probe',
  },
  {
    id: 'nightly-backup',
    label: 'Her Gece 03:30 (PostgreSQL Tam Yedekleme)',
    expr: '30 3 * * *',
    job: 'pg-encrypted-s3-snapshot',
  },
  {
    id: 'monthly-invoice',
    label: 'Her Ayın 1. Günü 06:00 (Faturalama Motoru)',
    expr: '0 6 1 * *',
    job: 'stripe-monthly-metered-billing',
  },
];

export const DEFAULT_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImNvcnB1cy1rbXMtMjAyNiJ9.eyJzdWIiOiJ1c3JfOThmMmE0MWMiLCJuYW1lIjoiS2FhbiBEZW1pciIsInJvbGUiOiJPRINCIPAL_ARCHITECTIiwib3JnIjoiQ29ycHVzIENsb3VkIEhvbGRpbmciLCJzY29wZXMiOlsidaultOnJlYWQiLCJrbXM6c2lnbiIsImJpbGxpbmc6YWRtaW4iXSwiaWF0IjoxNzYwNzAwMDAwLCJleHAiOjE3OTIyMzYwMDB9.c0ffee9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1';

export const DEFAULT_JSON_INPUT = `{
  "transactionId": "tx_9948102a",
  "merchantName": "Corpus Cloud Enterprise",
  "amount": 14850.75,
  "currency": "TRY",
  "isVerified": true,
  "riskScore": 12,
  "tags": ["enterprise", "annual-plan", "3d-secure"],
  "customer": {
    "id": 4092,
    "email": "cto@holding.com.tr",
    "taxNumber": "8120491820"
  },
  "createdAt": "2026-10-17T14:30:00Z"
}`;

export function evaluateRegex(
  pattern: string,
  flags: string,
  testStr: string
): { matches: RegexMatchItem[]; error: string | null; tokens: RegexTokenExplanation[] } {
  const tokens: RegexTokenExplanation[] = [];

  if (pattern.includes('(?<')) {
    tokens.push({ token: '(?<isim>...)', desc: 'İsimlendirilmiş Yakalama Grubu (Named Group)' });
  }
  if (pattern.includes('\\d')) {
    tokens.push({ token: '\\d', desc: 'Rakam Karakteri [0-9]' });
  }
  if (pattern.includes('\\s')) {
    tokens.push({ token: '\\s', desc: 'Boşluk / Sekme / Satır Sonu Karakteri' });
  }
  if (pattern.includes('+')) {
    tokens.push({ token: '+', desc: '1 veya Daha Fazla Tekrar (Greedy)' });
  }
  if (pattern.includes('*')) {
    tokens.push({ token: '*', desc: '0 veya Daha Fazla Tekrar' });
  }
  if (pattern.includes('?')) {
    tokens.push({ token: '?', desc: 'Opsiyonel (0 veya 1 Kez) / Lazy Nicelik' });
  }
  if (pattern.includes('|')) {
    tokens.push({ token: '|', desc: 'Mantıksal VEYA (Alternation) Operatörü' });
  }
  if (pattern.includes('^') || pattern.includes('$')) {
    tokens.push({ token: '^ / $', desc: 'Satır Başı / Satır Sonu Çapası (Anchor)' });
  }

  try {
    const safeFlags = flags.includes('g') ? flags : flags + 'g';
    const re = new RegExp(pattern, safeFlags);
    const matches: RegexMatchItem[] = [];
    let m: RegExpExecArray | null;
    let safety = 0;

    while ((m = re.exec(testStr)) !== null && safety < 200) {
      safety++;
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      const groupList: { name: string; value: string }[] = [];
      if (m.groups) {
        Object.entries(m.groups).forEach(([k, v]) => {
          if (v !== undefined) groupList.push({ name: k, value: v });
        });
      } else {
        for (let i = 1; i < m.length; i++) {
          if (m[i] !== undefined) {
            groupList.push({ name: `Grup #${i}`, value: m[i] });
          }
        }
      }

      matches.push({
        index: matches.length + 1,
        match: m[0],
        start: m.index,
        end: m.index + m[0].length,
        groups: groupList,
      });
    }

    return { matches, error: null, tokens };
  } catch (err) {
    return {
      matches: [],
      error: err instanceof Error ? err.message : 'Geçersiz Regex Sözdizimi',
      tokens,
    };
  }
}

function matchesCronField(field: string, value: number): boolean {
  const trimmed = field.trim();
  if (trimmed === '*') return true;

  const parts = trimmed.split(',');
  for (const part of parts) {
    if (part.startsWith('*/')) {
      const step = Number(part.slice(2));
      if (!Number.isNaN(step) && step > 0 && value % step === 0) return true;
    } else if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Number(startStr);
      const end = Number(endStr);
      if (!Number.isNaN(start) && !Number.isNaN(end) && value >= start && value <= end) {
        return true;
      }
    } else {
      const exact = Number(part);
      if (!Number.isNaN(exact) && exact === value) return true;
    }
  }
  return false;
}

export function analyzeCronExpression(
  expression: string,
  jobName: string,
  timezone: string
): CronAnalysis {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      expression,
      isValid: false,
      humanReadable: 'Geçersiz Cron İfadesi: 5 alan gereklidir (Dakika Saat Gün Ay HaftanınGünü)',
      fields: {
        minute: parts[0] || '*',
        hour: parts[1] || '*',
        dayOfMonth: parts[2] || '*',
        month: parts[3] || '*',
        dayOfWeek: parts[4] || '*',
      },
      nextRuns: [],
      snippets: { crontab: '', githubActions: '', k8sCronJob: '' },
    };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Build Turkish natural description
  const descParts: string[] = [];
  if (minute.startsWith('*/')) {
    descParts.push(`Her ${minute.slice(2)} dakikada bir`);
  } else if (minute === '0' && hour !== '*') {
    descParts.push(`Saat ${hour.padStart(2, '0')}:00'da`);
  } else if (hour !== '*' && minute !== '*') {
    descParts.push(`Saat ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}'da`);
  } else {
    descParts.push(`Dakika: ${minute}, Saat: ${hour}`);
  }

  if (dayOfMonth !== '*') {
    descParts.push(`ayın ${dayOfMonth}. günü`);
  }
  if (dayOfWeek === '1-5') {
    descParts.push('sadece hafta içi (Pazartesi–Cuma)');
  } else if (dayOfWeek !== '*') {
    descParts.push(`haftanın ${dayOfWeek}. günlerinde`);
  } else if (dayOfMonth === '*') {
    descParts.push('her gün');
  }

  const humanReadable = `${descParts.join(', ')} (${timezone})`;

  // Simulate next 8 occurrences starting from current time rounded to next minute
  const nextRuns: string[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  let iterations = 0;
  while (nextRuns.length < 8 && iterations < 50000) {
    iterations++;
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const dom = cursor.getDate();
    const mon = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    if (
      matchesCronField(minute, m) &&
      matchesCronField(hour, h) &&
      matchesCronField(dayOfMonth, dom) &&
      matchesCronField(month, mon) &&
      matchesCronField(dayOfWeek, dow)
    ) {
      nextRuns.push(
        cursor.toLocaleString('tr-TR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  const snippets = {
    crontab: `# ${jobName} (${humanReadable})\n${expression} /usr/local/bin/run-job.sh >> /var/log/${jobName}.log 2>&1`,
    githubActions: `name: ${jobName}\non:\n  schedule:\n    - cron: '${expression}'\njobs:\n  execute:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4`,
    k8sCronJob: `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: ${jobName}\nspec:\n  schedule: "${expression}"\n  timeZone: "${timezone}"`,
  };

  return {
    expression,
    isValid: true,
    humanReadable,
    fields: { minute, hour, dayOfMonth, month, dayOfWeek },
    nextRuns,
    snippets,
  };
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

export function analyzeJwtToken(token: string): JwtAnalysis {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return {
      isValidStructure: false,
      headerRaw: '{}',
      payloadRaw: '{}',
      signatureRaw: '',
      header: {},
      payload: {},
      algorithm: 'UNKNOWN',
      issuedAt: null,
      expiresAt: null,
      isExpired: false,
      ttlText: 'Geçersiz Token Formatı',
      securityScore: 0,
      securityFindings: [
        { level: 'critical', message: 'JWT 3 bölümden (Header.Payload.Signature) oluşmalıdır.' },
      ],
    };
  }

  try {
    const headerStr = decodeBase64Url(parts[0]);
    const payloadStr = decodeBase64Url(parts[1]);
    const header = JSON.parse(headerStr) as Record<string, unknown>;
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;

    const algorithm = String(header.alg || 'NONE');
    const nowSec = Math.floor(Date.now() / 1000);

    const iatNum = typeof payload.iat === 'number' ? payload.iat : null;
    const expNum = typeof payload.exp === 'number' ? payload.exp : null;

    const issuedAt = iatNum ? new Date(iatNum * 1000).toLocaleString('tr-TR') : null;
    const expiresAt = expNum ? new Date(expNum * 1000).toLocaleString('tr-TR') : null;
    const isExpired = expNum !== null ? expNum < nowSec : false;

    let ttlText = 'Süresiz (exp alanı yok)';
    if (expNum !== null) {
      const diff = expNum - nowSec;
      if (diff <= 0) {
        const daysAgo = Math.abs(Math.round(diff / 86400));
        ttlText = `SÜRESİ DOLDU (${daysAgo} gün önce)`;
      } else {
        const daysLeft = Math.floor(diff / 86400);
        const hoursLeft = Math.floor((diff % 86400) / 3600);
        ttlText = `${daysLeft} gün ${hoursLeft} saat geçerli`;
      }
    }

    const findings: { level: 'ok' | 'warn' | 'critical'; message: string }[] = [];
    let score = 100;

    if (algorithm.toLowerCase() === 'none') {
      score -= 60;
      findings.push({
        level: 'critical',
        message: 'KRİTİK: "alg: none" tespit edildi! İmza doğrulaması devre dışı.',
      });
    } else {
      findings.push({
        level: 'ok',
        message: `Kriptografik İmza Algoritması aktif (${algorithm}).`,
      });
    }

    if (!expNum) {
      score -= 25;
      findings.push({
        level: 'warn',
        message: 'Token içinde "exp" (son kullanma tarihi) alanı bulunmuyor.',
      });
    } else if (isExpired) {
      score -= 20;
      findings.push({
        level: 'warn',
        message: 'Token geçerlilik süresi (exp) sona ermiş.',
      });
    } else {
      findings.push({
        level: 'ok',
        message: `Token yaşam süresi (TTL) geçerli: ${ttlText}`,
      });
    }

    if (header.kid) {
      findings.push({
        level: 'ok',
        message: `KMS Anahtar Kimliği (kid) tanımlı: ${String(header.kid)}`,
      });
    }

    return {
      isValidStructure: true,
      headerRaw: JSON.stringify(header, null, 2),
      payloadRaw: JSON.stringify(payload, null, 2),
      signatureRaw: parts[2],
      header,
      payload,
      algorithm,
      issuedAt,
      expiresAt,
      isExpired,
      ttlText,
      securityScore: Math.max(0, score),
      securityFindings: findings,
    };
  } catch {
    return {
      isValidStructure: false,
      headerRaw: '{}',
      payloadRaw: '{}',
      signatureRaw: parts[2] || '',
      header: {},
      payload: {},
      algorithm: 'INVALID',
      issuedAt: null,
      expiresAt: null,
      isExpired: false,
      ttlText: 'Base64 / JSON Çözümleme Hatası',
      securityScore: 10,
      securityFindings: [
        { level: 'critical', message: 'Header veya Payload geçerli bir JSON/Base64Url değil.' },
      ],
    };
  }
}

export function convertJsonToSchemas(
  jsonText: string,
  rootName: string
): SchemaConversionResult {
  try {
    const parsed = JSON.parse(jsonText);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        isValidJson: false,
        error: 'Kök eleman bir JSON nesnesi ({ ... }) olmalıdır.',
        typescriptInterface: '',
        postgresSql: '',
        zodSchema: '',
        fieldCount: 0,
      };
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    const safeName = rootName.replace(/[^a-zA-Z0-9_]/g, '') || 'RootEntity';
    const tableName = safeName
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();

    const tsLines: string[] = [`export interface ${safeName} {`];
    const sqlLines: string[] = [`CREATE TABLE ${tableName} (`];
    const zodLines: string[] = [
      `import { z } from 'zod';\n\nexport const ${safeName}Schema = z.object({`,
    ];

    entries.forEach(([key, val], idx) => {
      const comma = idx < entries.length - 1 ? ',' : '';
      const colName = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

      if (typeof val === 'string') {
        const isIsoDate = /^\d{4}-\d{2}-\d{2}T/.test(val);
        tsLines.push(`  ${key}: string;`);
        sqlLines.push(
          `  ${colName} ${isIsoDate ? 'TIMESTAMPTZ NOT NULL' : 'VARCHAR(255) NOT NULL'}${comma}`
        );
        zodLines.push(
          `  ${key}: z.string()${isIsoDate ? '.datetime()' : ''},`
        );
      } else if (typeof val === 'number') {
        const isFloat = !Number.isInteger(val);
        tsLines.push(`  ${key}: number;`);
        sqlLines.push(
          `  ${colName} ${isFloat ? 'NUMERIC(14, 2) NOT NULL' : 'BIGINT NOT NULL'}${comma}`
        );
        zodLines.push(`  ${key}: z.number()${isFloat ? '' : '.int()'},`);
      } else if (typeof val === 'boolean') {
        tsLines.push(`  ${key}: boolean;`);
        sqlLines.push(`  ${colName} BOOLEAN NOT NULL DEFAULT FALSE${comma}`);
        zodLines.push(`  ${key}: z.boolean(),`);
      } else if (Array.isArray(val)) {
        const elemType = val.length > 0 ? typeof val[0] : 'string';
        tsLines.push(`  ${key}: ${elemType}[];`);
        sqlLines.push(`  ${colName} JSONB NOT NULL DEFAULT '[]'::jsonb${comma}`);
        zodLines.push(`  ${key}: z.array(z.${elemType === 'number' ? 'number' : 'string'}()),`);
      } else if (typeof val === 'object' && val !== null) {
        tsLines.push(`  ${key}: Record<string, unknown>;`);
        sqlLines.push(`  ${colName} JSONB NOT NULL DEFAULT '{}'::jsonb${comma}`);
        zodLines.push(`  ${key}: z.record(z.string(), z.unknown()),`);
      } else {
        tsLines.push(`  ${key}: unknown;`);
        sqlLines.push(`  ${colName} TEXT${comma}`);
        zodLines.push(`  ${key}: z.unknown(),`);
      }
    });

    tsLines.push('}');
    sqlLines.push(');');
    zodLines.push('});');

    return {
      isValidJson: true,
      typescriptInterface: tsLines.join('\n'),
      postgresSql: sqlLines.join('\n'),
      zodSchema: zodLines.join('\n'),
      fieldCount: entries.length,
    };
  } catch (e) {
    return {
      isValidJson: false,
      error: e instanceof Error ? e.message : 'JSON Ayrıştırma Hatası',
      typescriptInterface: '',
      postgresSql: '',
      zodSchema: '',
      fieldCount: 0,
    };
  }
}

export async function computeSha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function drawRoundedCard(
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

export function renderDevToolsCanvas(
  canvas: HTMLCanvasElement,
  state: DevToolsState,
  sha256Digest: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  // 1. Studio Dark Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle Matrix Grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
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

  // 2. Top Header Frame
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  ctx.lineWidth = 1.5;
  drawRoundedCard(ctx, 48, 36, W - 96, 86, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  drawRoundedCard(ctx, 68, 54, 6, 50, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText(state.projectTitle, 90, 74);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillText(
    `CORPUS DEVTOOLS WORKBENCH (#023 PRO)  •  AKTİF MODÜL: ${state.mode.toUpperCase()}  •  ORTAM: ${state.environmentTag}`,
    90,
    100
  );

  // 3. Mode-Specific 4K Technical Blueprint
  if (state.mode === 'regex') {
    const res = evaluateRegex(state.regexPattern, state.regexFlags, state.regexTestString);

    // Left Card: Pattern & Flags
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    drawRoundedCard(ctx, 48, 150, 880, 410, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('1. DÜZENLİ İFADE (REGEX) DESENİ & TOKEN ANALİZİ', 76, 190);

    ctx.fillStyle = '#09090b';
    drawRoundedCard(ctx, 76, 210, 824, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`/${state.regexPattern.slice(0, 58)}/${state.regexFlags}`, 94, 248);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('Algılanan Sözdizimi Atomları:', 76, 310);

    res.tokens.slice(0, 6).forEach((t, i) => {
      const y = 344 + i * 34;
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(t.token, 84, y);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 14px Inter, sans-serif';
      ctx.fillText(`→  ${t.desc}`, 230, y);
    });

    // Right Card: Matches & Named Groups
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    drawRoundedCard(ctx, 960, 150, 912, 850, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(
      `2. YAKALANAN EŞLEŞMELER & GRUPLAR (TOPLAM: ${res.matches.length} EŞLEŞME)`,
      990,
      190
    );

    res.matches.slice(0, 8).forEach((m, idx) => {
      const cardY = 216 + idx * 94;
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
      drawRoundedCard(ctx, 990, cardY, 852, 80, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        `#${m.index} [${m.start}..${m.end}]: "${m.match.slice(0, 65)}"`,
        1010,
        cardY + 30
      );

      const groupSummary =
        m.groups.length > 0
          ? m.groups.map((g) => `${g.name}: "${g.value}"`).join('  |  ')
          : 'Alt yakalama grubu yok';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px Inter, sans-serif';
      ctx.fillText(groupSummary.slice(0, 95), 1010, cardY + 58);
    });

    // Bottom Left: Test Corpus
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    drawRoundedCard(ctx, 48, 585, 880, 415, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('3. TEST METNİ (ÖRNEK VERİ HAVUZU)', 76, 625);

    const lines = state.regexTestString.split('\n').slice(0, 9);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line.slice(0, 78), 76, 665 + i * 32);
    });
  } else if (state.mode === 'cron') {
    const cron = analyzeCronExpression(
      state.cronExpression,
      state.cronJobName,
      state.cronTimezone
    );

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    drawRoundedCard(ctx, 48, 150, 1824, 240, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('CRON İFADESİ & DOĞAL DİL AÇIKLAMASI', 80, 190);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px monospace';
    ctx.fillText(cron.expression, 80, 255);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`→ ${cron.humanReadable}`, 80, 305);

    // 5 Field Breakdown Boxes
    const fList = [
      { l: 'DAKİKA', v: cron.fields.minute },
      { l: 'SAAT', v: cron.fields.hour },
      { l: 'AYIN GÜNÜ', v: cron.fields.dayOfMonth },
      { l: 'AY', v: cron.fields.month },
      { l: 'HAFTANIN GÜNÜ', v: cron.fields.dayOfWeek },
    ];
    fList.forEach((f, idx) => {
      const bx = 980 + idx * 170;
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#334155';
      drawRoundedCard(ctx, bx, 195, 155, 130, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(f.l, bx + 20, 230);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(f.v, bx + 20, 285);
    });

    // Next 8 Executions Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    drawRoundedCard(ctx, 48, 420, 880, 580, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('ÖNÜMÜZDEKİ 8 TETİKLENME ZAMANI (SİMÜLASYON)', 80, 462);

    cron.nextRuns.forEach((run, i) => {
      const ry = 495 + i * 58;
      ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
      drawRoundedCard(ctx, 80, ry, 816, 46, 8);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`Çalışma #${i + 1}:`, 100, ry + 28);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 15px Inter, sans-serif';
      ctx.fillText(run, 240, ry + 28);
    });

    // Kubernetes & GitHub Actions Manifest
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    drawRoundedCard(ctx, 960, 420, 912, 580, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('DEVOPS & KUBERNETES CRONJOB MANİFESTOSU', 992, 462);

    const yamlLines = (cron.snippets.k8sCronJob + '\n\n' + cron.snippets.githubActions).split('\n');
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    yamlLines.slice(0, 16).forEach((ln, idx) => {
      ctx.fillText(ln, 992, 505 + idx * 28);
    });
  } else if (state.mode === 'jwt') {
    const jwt = analyzeJwtToken(state.jwtToken);

    // Left: Decoded Header & Payload
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
    drawRoundedCard(ctx, 48, 150, 900, 850, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fb7185';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('1. JWT HEADER & PAYLOAD (BASE64URL ÇÖZÜMLENMİŞ)', 80, 192);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('HEADER (Algoritma & Anahtar Kimliği):', 80, 230);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    jwt.headerRaw.split('\n').forEach((l, i) => {
      ctx.fillText(l, 80, 260 + i * 26);
    });

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('PAYLOAD (Yetkiler, Kimlik & Zaman Damgaları):', 80, 420);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    jwt.payloadRaw
      .split('\n')
      .slice(0, 16)
      .forEach((l, i) => {
        ctx.fillText(l.slice(0, 75), 80, 452 + i * 26);
      });

    // Right: Security Audit & TTL
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    drawRoundedCard(ctx, 980, 150, 892, 850, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('2. KRİPTOGRAFİK GÜVENLİK DENETİMİ & YAŞAM SÜRESİ', 1012, 192);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillText(`Güvenlik Skoru: ${jwt.securityScore}/100`, 1012, 265);

    ctx.fillStyle = jwt.isExpired ? '#f43f5e' : '#34d399';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(`Durum: ${jwt.ttlText}`, 1012, 310);

    jwt.securityFindings.forEach((f, idx) => {
      const fy = 360 + idx * 72;
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      drawRoundedCard(ctx, 1012, fy, 828, 56, 10);
      ctx.fill();

      ctx.fillStyle =
        f.level === 'critical' ? '#f43f5e' : f.level === 'warn' ? '#f59e0b' : '#10b981';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(`[${f.level.toUpperCase()}] ${f.message}`, 1032, fy + 34);
    });
  } else {
    const sch = convertJsonToSchemas(state.jsonInput, state.schemaRootName);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    drawRoundedCard(ctx, 48, 150, 880, 850, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('1. TYPESCRIPT INTERFACE & ZOD ŞEMA ÇIKTISI', 80, 192);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    (sch.typescriptInterface + '\n\n' + sch.zodSchema)
      .split('\n')
      .slice(0, 24)
      .forEach((l, i) => {
        ctx.fillText(l.slice(0, 74), 80, 232 + i * 28);
      });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    drawRoundedCard(ctx, 960, 150, 912, 850, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('2. POSTGRESQL DDL TABLO ŞEMASI & SHA-256 ÖZETİ', 992, 192);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    sch.postgresSql
      .split('\n')
      .slice(0, 16)
      .forEach((l, i) => {
        ctx.fillText(l.slice(0, 76), 992, 232 + i * 28);
      });

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('Web Crypto SHA-256 İmza Özeti:', 992, 740);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(sha256Digest || 'Hesaplanıyor...', 992, 775);
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS DEVTOOLS WORKBENCH (#023 PRO)  •  100% İSTEMCİ TARAFLI SIFIR SUNUCU MÜHENDİSLİK ÜSSÜ',
    48,
    H - 22
  );
}
