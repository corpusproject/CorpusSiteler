import * as XLSX from 'xlsx';

export type ControlStatus = 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';

export interface SecurityControl {
  id: string;
  code: string;
  domain: string;
  title: string;
  status: ControlStatus;
  likelihood: number; // 1..5
  impact: number; // 1..5
  owner: string;
  remediation: string;
}

export interface AuditProject {
  id: string;
  framework: 'ISO/IEC 27001:2022' | 'SOC2 Type II' | 'KVKK & GDPR Teknik Tedbirler';
  organization: string;
  leadAuditor: string;
  auditDate: string;
  controls: SecurityControl[];
}

export const AUDIT_PRESETS: Record<string, AuditProject> = {
  'iso27001-soc2': {
    id: 'iso27001-soc2',
    framework: 'ISO/IEC 27001:2022',
    organization: 'Corpus Cloud Global Holding A.Ş.',
    leadAuditor: 'Kaan Demir (CISO & Lead Auditor)',
    auditDate: '2026-10-17',
    controls: [
      {
        id: 'c1',
        code: 'A.8.24',
        domain: 'Kriptografi & KMS',
        title: 'Kriptografik Anahtar Yönetimi & AES-256-GCM Veri Şifreleme',
        status: 'COMPLIANT',
        likelihood: 1,
        impact: 5,
        owner: 'SecOps',
        remediation: 'HSM tabanlı otomatik 90 günlük anahtar rotasyonu aktif.',
      },
      {
        id: 'c2',
        code: 'A.5.15',
        domain: 'Erişim Kontrolü (IAM)',
        title: 'Sıfır Güven (Zero-Trust) Ayrıcalıklı Erişim & Donanım MFA',
        status: 'COMPLIANT',
        likelihood: 2,
        impact: 4,
        owner: 'IAM Team',
        remediation: 'FIDO2 / WebAuthn donanım anahtarları tüm yönetici hesaplarında zorunlu.',
      },
      {
        id: 'c3',
        code: 'A.8.8',
        domain: 'Zafiyet Yönetimi',
        title: 'Konteyner İmaj Tarama & Kritik CVE Yamalama Süreci (<24 Saat)',
        status: 'PARTIAL',
        likelihood: 3,
        impact: 4,
        owner: 'DevSecOps',
        remediation: 'Eski (Legacy) 2 mikroserviste Trivy CI/CD kapısı tamamlanıyor.',
      },
      {
        id: 'c4',
        code: 'A.5.30',
        domain: 'İş Sürekliliği & DR',
        title: 'Multi-Region Felaket Kurtarma (RPO < 5dk, RTO < 15dk) Tatbikatı',
        status: 'COMPLIANT',
        likelihood: 1,
        impact: 5,
        owner: 'SRE Team',
        remediation: 'Frankfurt -> İrlanda otomatik yük devretme (Failover) testi başarılı.',
      },
      {
        id: 'c5',
        code: 'A.8.16',
        domain: 'SIEM & Siber İzleme',
        title: 'Değiştirilemez (WORM) Denetim Logları & 7/24 SOC Anomali Tespiti',
        status: 'COMPLIANT',
        likelihood: 2,
        impact: 3,
        owner: 'SOC Team',
        remediation: 'Tüm API Gateway ve DB sorgu logları S3 Object Lock ile korunuyor.',
      },
      {
        id: 'c6',
        code: 'A.5.19',
        domain: 'Tedarikçi Güvenliği',
        title: '3. Parti Alt Yüklenici & SaaS API Güvenlik Değerlendirmesi',
        status: 'NON_COMPLIANT',
        likelihood: 4,
        impact: 4,
        owner: 'GRC & Legal',
        remediation: 'ACİL: 2 harici veri sağlayıcı ile ek DPA ve sızma testi raporu imzalanacak.',
      },
    ],
  },
  'kvkk-gdpr-audit': {
    id: 'kvkk-gdpr-audit',
    framework: 'KVKK & GDPR Teknik Tedbirler',
    organization: 'NovaPay Elektronik Para ve Ödeme Hizmetleri A.Ş.',
    leadAuditor: 'Av. Elif T. (DPO) & SecOps',
    auditDate: '2026-10-17',
    controls: [
      {
        id: 'k1',
        code: 'KVKK-T.01',
        domain: 'Veri Maskeleme',
        title: 'Üretim Dışı (Test/Staging) Ortamlarda Kişisel Veri Anonimleştirme',
        status: 'COMPLIANT',
        likelihood: 1,
        impact: 4,
        owner: 'Data Eng',
        remediation: 'Sentetik veri maskeleme boru hattı %100 devrede.',
      },
      {
        id: 'k2',
        code: 'GDPR-Art.17',
        domain: 'Unutulma Hakkı',
        title: 'Dağıtık Mikroservisler ve Yedeklerden Otomatik Veri İmha Motoru',
        status: 'PARTIAL',
        likelihood: 3,
        impact: 4,
        owner: 'Core Backend',
        remediation: 'Kafka olay kuyruklarında kriptografik silme (Crypto-shredding) devreye alınıyor.',
      },
      {
        id: 'k3',
        code: 'KVKK-T.09',
        domain: 'Sızma Testi (Pentest)',
        title: 'Yıllık Bağımsız Kara/Gri Kutu Sızma Testi & API Fuzzing',
        status: 'COMPLIANT',
        likelihood: 2,
        impact: 5,
        owner: 'Red Team',
        remediation: 'Q3 sızma testindeki tüm bulgular kapatıldı.',
      },
    ],
  },
};

export function calculateAuditMetrics(project: AuditProject) {
  const total = project.controls.length;
  const compliant = project.controls.filter((c) => c.status === 'COMPLIANT').length;
  const partial = project.controls.filter((c) => c.status === 'PARTIAL').length;
  const nonCompliant = project.controls.filter((c) => c.status === 'NON_COMPLIANT').length;

  const score =
    total > 0
      ? Math.round(((compliant * 100 + partial * 50) / (total * 100)) * 100)
      : 100;

  const highRisks = project.controls.filter(
    (c) => c.likelihood * c.impact >= 12
  ).length;

  return {
    total,
    compliant,
    partial,
    nonCompliant,
    score,
    highRisks,
  };
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

export function renderAuditCanvas(canvas: HTMLCanvasElement, project: AuditProject) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1920;
  const H = 1080;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const m = calculateAuditMetrics(project);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#09090b');
  bg.addColorStop(1, '#09191f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.85)';
  ctx.lineWidth = 1.5;
  drawRoundedBox(ctx, 44, 30, W - 88, 92, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  drawRoundedBox(ctx, 64, 48, 6, 56, 3);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText(
    `${project.framework}  —  SİBER GÜVENLİK & UYUMLULUK DENETİM RAPORU`,
    86,
    72
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `KURUM: ${project.organization}  •  BAŞ DENETÇİ: ${project.leadAuditor}  •  TARİH: ${project.auditDate}`,
    86,
    98
  );

  // Compliance Score Badge
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.strokeStyle = '#10b981';
  drawRoundedBox(ctx, W - 410, 44, 344, 64, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('GENEL UYUMLULUK SKORU (COMPLIANCE)', W - 390, 66);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`%${m.score} UYUMLU  (${m.compliant}/${m.total})`, W - 390, 96);

  // Left: 5x5 Risk Heatmap Matrix
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 44, 142, 740, 880, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('1. 5×5 SİBER RİSK ISI HARİTASI (OLASILIK × ETKİ MATRİSİ)', 72, 182);

  const gridStartX = 140;
  const gridStartY = 230;
  const cellSize = 112;

  for (let row = 0; row < 5; row++) {
    const impactVal = 5 - row; // 5 down to 1
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`Etki ${impactVal}`, 72, gridStartY + row * cellSize + 60);

    for (let col = 0; col < 5; col++) {
      const likeVal = col + 1; // 1 to 5
      const riskScore = impactVal * likeVal;
      const cx = gridStartX + col * cellSize;
      const cy = gridStartY + row * cellSize;

      let cellBg = 'rgba(16, 185, 129, 0.22)';
      let cellBorder = '#10b981';
      if (riskScore >= 15) {
        cellBg = 'rgba(244, 63, 94, 0.32)';
        cellBorder = '#f43f5e';
      } else if (riskScore >= 8) {
        cellBg = 'rgba(245, 158, 11, 0.26)';
        cellBorder = '#f59e0b';
      }

      ctx.fillStyle = cellBg;
      ctx.strokeStyle = cellBorder;
      ctx.lineWidth = 1.5;
      drawRoundedBox(ctx, cx, cy, cellSize - 8, cellSize - 8, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`R:${riskScore}`, cx + 10, cy + 20);

      // Plot matching controls in cell
      const matching = project.controls.filter(
        (c) => c.impact === impactVal && c.likelihood === likeVal
      );
      matching.forEach((mc, mIdx) => {
        ctx.fillStyle = '#09090b';
        drawRoundedBox(ctx, cx + 10, cy + 32 + mIdx * 28, cellSize - 28, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(mc.code, cx + 18, cy + 47 + mIdx * 28);
      });
    }
  }

  for (let col = 0; col < 5; col++) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(
      `Olasılık ${col + 1}`,
      gridStartX + col * cellSize + 18,
      gridStartY + 5 * cellSize + 24
    );
  }

  // Summary Legend under Heatmap
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 13.5px Inter, sans-serif';
  ctx.fillText(
    `Kritik/Yüksek Riskli Bulgu: ${m.highRisks} Adet  •  Tam Uyumlu Kontrol: ${m.compliant}  •  Kısmi Uyumlu: ${m.partial}`,
    72,
    955
  );

  // Right Panel: Control Scorecard & Remediation Table
  ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
  drawRoundedBox(ctx, 808, 142, 1068, 880, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('2. DENETİM KONTROL MADDELERİ & DÜZELTİCİ AKSİYON PLANI (POA&M)', 838, 182);

  project.controls.slice(0, 7).forEach((ctrl, idx) => {
    const ry = 208 + idx * 112;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
    ctx.strokeStyle =
      ctrl.status === 'COMPLIANT'
        ? 'rgba(16, 185, 129, 0.45)'
        : ctrl.status === 'PARTIAL'
        ? 'rgba(245, 158, 11, 0.5)'
        : 'rgba(244, 63, 94, 0.65)';
    drawRoundedBox(ctx, 836, ry, 1012, 98, 12);
    ctx.fill();
    ctx.stroke();

    const statusBadgeColor =
      ctrl.status === 'COMPLIANT'
        ? '#10b981'
        : ctrl.status === 'PARTIAL'
        ? '#f59e0b'
        : '#f43f5e';

    ctx.fillStyle = statusBadgeColor;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`[${ctrl.code}] ${ctrl.domain}`, 858, ry + 28);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14.5px Inter, sans-serif';
    ctx.fillText(ctrl.title.slice(0, 62), 1080, ry + 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12.5px Inter, sans-serif';
    ctx.fillText(`Kanıt / Aksiyon: ${ctrl.remediation.slice(0, 82)}`, 858, ry + 56);

    ctx.fillStyle = statusBadgeColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `DURUM: ${ctrl.status}  |  RİSK SKORU: ${ctrl.likelihood * ctrl.impact} (${ctrl.likelihood}x${
        ctrl.impact
      })  |  SORUMLU: @${ctrl.owner}`,
      858,
      ry + 82
    );
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillText(
    'CORPUS AUDIT, CYBERSECURITY & COMPLIANCE MATRIX (#030 PRO)  •  ISO 27001 / SOC2 / KVKK',
    44,
    H - 18
  );
}

export function exportAuditExcel(project: AuditProject) {
  const wb = XLSX.utils.book_new();
  const rows = project.controls.map((c) => ({
    'Kontrol Kodu': c.code,
    Alan: c.domain,
    'Kontrol Başlığı': c.title,
    Durum: c.status,
    'Olasılık (1-5)': c.likelihood,
    'Etki (1-5)': c.impact,
    'Risk Skoru': c.likelihood * c.impact,
    Sorumlu: c.owner,
    'Kanıt & Düzeltici Aksiyon': c.remediation,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Uyumluluk Denetimi');
  XLSX.writeFile(wb, `${project.id}-Siber-Denetim.xlsx`);
}
