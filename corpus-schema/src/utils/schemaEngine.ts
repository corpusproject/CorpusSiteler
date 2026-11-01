export type SqlColumnType =
  | 'UUID'
  | 'BIGSERIAL'
  | 'VARCHAR(255)'
  | 'TEXT'
  | 'NUMERIC(14,2)'
  | 'BOOLEAN'
  | 'TIMESTAMPTZ'
  | 'JSONB';

export interface DbColumn {
  id: string;
  name: string;
  type: SqlColumnType;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  referencesTable?: string; // tableName.columnName
}

export interface DbTable {
  id: string;
  name: string;
  description: string;
  color: string;
  x: number;
  y: number;
  columns: DbColumn[];
}

export interface SchemaProject {
  id: string;
  title: string;
  engine: 'PostgreSQL 17' | 'MySQL 8.4' | 'CockroachDB';
  author: string;
  tables: DbTable[];
}

export const SCHEMA_PRESETS: Record<string, SchemaProject> = {
  'saas-multitenant-erd': {
    id: 'saas-multitenant-erd',
    title: 'Multi-Tenant B2B SaaS, Faturalama & RBAC Veritabanı Mimarisi',
    engine: 'PostgreSQL 17',
    author: 'Baş Veri Mimarisi Ofisi',
    tables: [
      {
        id: 'tb1',
        name: 'organizations',
        description: 'Kurumsal kiracı (Tenant) ana tablosu',
        color: '#8b5cf6',
        x: 90,
        y: 170,
        columns: [
          { id: 'c1', name: 'id', type: 'UUID', isPrimaryKey: true, isNullable: false, isUnique: true },
          { id: 'c2', name: 'slug', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'c3', name: 'plan_tier', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'c4', name: 'settings', type: 'JSONB', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'c5', name: 'created_at', type: 'TIMESTAMPTZ', isPrimaryKey: false, isNullable: false, isUnique: false },
        ],
      },
      {
        id: 'tb2',
        name: 'users',
        description: 'Sıfır güven kimlik & oturum kullanıcıları',
        color: '#06b6d4',
        x: 720,
        y: 170,
        columns: [
          { id: 'u1', name: 'id', type: 'UUID', isPrimaryKey: true, isNullable: false, isUnique: true },
          {
            id: 'u2',
            name: 'org_id',
            type: 'UUID',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            referencesTable: 'organizations',
          },
          { id: 'u3', name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'u4', name: 'role', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'u5', name: 'mfa_enabled', type: 'BOOLEAN', isPrimaryKey: false, isNullable: false, isUnique: false },
        ],
      },
      {
        id: 'tb3',
        name: 'subscriptions',
        description: 'Stripe abonelik ve kullanım kotaları',
        color: '#10b981',
        x: 1350,
        y: 170,
        columns: [
          { id: 's1', name: 'id', type: 'UUID', isPrimaryKey: true, isNullable: false, isUnique: true },
          {
            id: 's2',
            name: 'org_id',
            type: 'UUID',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: true,
            referencesTable: 'organizations',
          },
          { id: 's3', name: 'mrr_amount', type: 'NUMERIC(14,2)', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 's4', name: 'is_active', type: 'BOOLEAN', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 's5', name: 'renews_at', type: 'TIMESTAMPTZ', isPrimaryKey: false, isNullable: false, isUnique: false },
        ],
      },
      {
        id: 'tb4',
        name: 'audit_logs',
        description: 'SOC2 değiştirilemez işlem izleri',
        color: '#f59e0b',
        x: 420,
        y: 590,
        columns: [
          { id: 'a1', name: 'id', type: 'BIGSERIAL', isPrimaryKey: true, isNullable: false, isUnique: true },
          {
            id: 'a2',
            name: 'actor_user_id',
            type: 'UUID',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            referencesTable: 'users',
          },
          { id: 'a3', name: 'action_event', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'a4', name: 'metadata', type: 'JSONB', isPrimaryKey: false, isNullable: true, isUnique: false },
          { id: 'a5', name: 'logged_at', type: 'TIMESTAMPTZ', isPrimaryKey: false, isNullable: false, isUnique: false },
        ],
      },
      {
        id: 'tb5',
        name: 'invoices',
        description: 'Otomatik kesilen e-Fatura kayıtları',
        color: '#ec4899',
        x: 1080,
        y: 590,
        columns: [
          { id: 'i1', name: 'id', type: 'UUID', isPrimaryKey: true, isNullable: false, isUnique: true },
          {
            id: 'i2',
            name: 'subscription_id',
            type: 'UUID',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            referencesTable: 'subscriptions',
          },
          { id: 'i3', name: 'total_amount', type: 'NUMERIC(14,2)', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'i4', name: 'paid', type: 'BOOLEAN', isPrimaryKey: false, isNullable: false, isUnique: false },
        ],
      },
    ],
  },
};

export function generatePostgresDDL(project: SchemaProject): string {
  const lines: string[] = [
    `-- CORPUS SCHEMA ARCHITECT (#028 PRO)`,
    `-- Proje: ${project.title}`,
    `-- Hedef Motor: ${project.engine}`,
    '',
  ];

  project.tables.forEach((tb) => {
    lines.push(`-- ${tb.description}`);
    lines.push(`CREATE TABLE ${tb.name} (`);
    tb.columns.forEach((col, idx) => {
      const pk = col.isPrimaryKey ? ' PRIMARY KEY' : '';
      const notNull = !col.isNullable && !col.isPrimaryKey ? ' NOT NULL' : '';
      const uniq = col.isUnique && !col.isPrimaryKey ? ' UNIQUE' : '';
      const fk = col.referencesTable
        ? ` REFERENCES ${col.referencesTable}(id) ON DELETE CASCADE`
        : '';
      const comma = idx < tb.columns.length - 1 ? ',' : '';
      lines.push(`  ${col.name} ${col.type}${pk}${notNull}${uniq}${fk}${comma}`);
    });
    lines.push(');\n');
  });

  return lines.join('\n');
}

export function generatePrismaSchema(project: SchemaProject): string {
  const lines: string[] = [
    `datasource db {`,
    `  provider = "postgresql"`,
    `  url      = env("DATABASE_URL")`,
    `}\n`,
  ];

  const typeMap: Record<SqlColumnType, string> = {
    UUID: 'String @default(uuid())',
    BIGSERIAL: 'BigInt @default(autoincrement())',
    'VARCHAR(255)': 'String',
    TEXT: 'String',
    'NUMERIC(14,2)': 'Decimal',
    BOOLEAN: 'Boolean',
    TIMESTAMPTZ: 'DateTime @default(now())',
    JSONB: 'Json',
  };

  project.tables.forEach((tb) => {
    const modelName = tb.name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    lines.push(`model ${modelName} {`);
    tb.columns.forEach((col) => {
      const pk = col.isPrimaryKey ? ' @id' : '';
      const uniq = col.isUnique && !col.isPrimaryKey ? ' @unique' : '';
      const opt = col.isNullable ? '?' : '';
      lines.push(`  ${col.name} ${typeMap[col.type]}${opt}${pk}${uniq}`);
    });
    lines.push(`  @@map("${tb.name}")`);
    lines.push('}\n');
  });

  return lines.join('\n');
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

export function renderErdCanvas(
  canvas: HTMLCanvasElement,
  project: SchemaProject,
  selectedTableId: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Blueprint Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 40, 28, W - 80, 84, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8b5cf6';
  drawRoundedBox(ctx, 60, 46, 6, 48, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText(project.title, 82, 68);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `VERİTABANI MOTORU: ${project.engine}  •  MİMAR: ${project.author}  •  TABLO SAYISI: ${project.tables.length}`,
    82,
    92
  );

  // Draw Foreign Key Relationship Curves First
  const tableMap = new Map<string, DbTable>();
  project.tables.forEach((t) => tableMap.set(t.name, t));

  project.tables.forEach((srcTable) => {
    srcTable.columns.forEach((col, colIdx) => {
      if (!col.referencesTable) return;
      const targetTable = tableMap.get(col.referencesTable);
      if (!targetTable) return;

      const startX = srcTable.x + 230;
      const startY = srcTable.y + 84 + colIdx * 36;
      const endX = targetTable.x + 230;
      const endY = targetTable.y + 84;

      ctx.save();
      ctx.strokeStyle = srcTable.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const midY = (startY + endY) / 2;
      ctx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
      ctx.stroke();

      // Crow's foot dot
      ctx.fillStyle = targetTable.color;
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  });

  // Draw Entity Tables
  project.tables.forEach((tb) => {
    const w = 460;
    const h = 76 + tb.columns.length * 38 + 16;
    const isSel = tb.id === selectedTableId;

    ctx.save();
    ctx.shadowColor = isSel ? tb.color : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = isSel ? 24 : 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = isSel ? tb.color : 'rgba(71, 85, 105, 0.8)';
    ctx.lineWidth = isSel ? 3 : 1.5;
    drawRoundedBox(ctx, tb.x, tb.y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Table Header Bar
    ctx.fillStyle = tb.color + '28';
    drawRoundedBox(ctx, tb.x + 2, tb.y + 2, w - 4, 58, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`⊞ ${tb.name}`, tb.x + 20, tb.y + 28);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 11.5px Inter, sans-serif';
    ctx.fillText(tb.description.slice(0, 48), tb.x + 20, tb.y + 48);

    // Columns
    tb.columns.forEach((col, idx) => {
      const cy = tb.y + 72 + idx * 38;
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
      ctx.fillRect(tb.x + 8, cy - 14, w - 16, 32);

      // PK / FK Badge
      if (col.isPrimaryKey) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('🔑 PK', tb.x + 18, cy + 6);
      } else if (col.referencesTable) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('🔗 FK', tb.x + 18, cy + 6);
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13.5px monospace';
      ctx.fillText(col.name, tb.x + 76, cy + 6);

      ctx.fillStyle = tb.color;
      ctx.font = '600 12px monospace';
      ctx.fillText(col.type, tb.x + 245, cy + 6);

      const flags = [
        !col.isNullable ? 'NN' : 'NULL',
        col.isUnique ? 'UQ' : '',
      ]
        .filter(Boolean)
        .join(' ');
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(flags, tb.x + 390, cy + 6);
    });

    ctx.restore();
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS SCHEMA, SQL & ER DIAGRAM ARCHITECT (#028 PRO)  •  POSTGRESQL / PRISMA ORM GENERATOR',
    44,
    H - 18
  );
}
