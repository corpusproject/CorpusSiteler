// ============================================================================
// CORPUS POSTMORTEM — SIEM Log Parser, SRE Outage Timeline & SLA Penalty Engine
// #035 PRO | 100% Client-Side Incident Response, 5-Whys RCA & 4K Report Studio
// ============================================================================

export type IncidentSeverity = 'SEV-1 (CRITICAL)' | 'SEV-2 (MAJOR)' | 'SEV-3 (MINOR)';

export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  level: 'FATAL' | 'ERROR' | 'WARN' | 'INFO';
  service: string;
  statusCode: number;
  latencyMs: number;
  traceId: string;
  message: string;
}

export interface TimelineEvent {
  id: string;
  timeUtc: string;
  phase: 'DETECTION' | 'ESCALATION' | 'DIAGNOSIS' | 'MITIGATION' | 'RECOVERY';
  actor: string;
  summary: string;
  isKeyMilestone: boolean;
}

export interface CorrectiveAction {
  id: string;
  jiraKey: string;
  category: 'PREVENT' | 'DETECT' | 'MITIGATE';
  priority: 'P0' | 'P1' | 'P2';
  owner: string;
  dueDate: string;
  title: string;
  completed: boolean;
}

export interface IncidentPostmortemProject {
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  incidentCommander: string;
  leadSre: string;
  dateIso: string;
  affectedServices: string[];
  affectedRegions: string[];
  // Timestamps in HH:MM format (same UTC day or sequential minutes) for TTD/TTM/TTR calculation
  outageStartTime: string;      // e.g. "14:12"
  alertFiredTime: string;       // e.g. "14:16" -> TTD = 4m
  mitigationAppliedTime: string;// e.g. "14:44" -> TTM = 32m
  fullRecoveryTime: string;     // e.g. "15:09" -> TTR = 57m
  // Traffic & SLA Financial Impact Parameters
  ContractedSlaPct: number;     // e.g. 99.99
  monthlyArrAtRiskUsd: number;  // e.g. 850000
  totalRequestsDuringWindow: number;
  failedRequestsCount: number;
  peakErrorRatePct: number;
  // Root Cause Analysis (5-Whys)
  executiveSummary: string;
  triggeringChange: string;
  fiveWhys: string[];
  rawLogDump: string;
  timeline: TimelineEvent[];
  actionItems: CorrectiveAction[];
  accentColor: string;
}

export interface SreMetricsSummary {
  ttdMinutes: number;           // Time to Detect
  ttmMinutes: number;           // Time to Mitigate
  ttrMinutes: number;           // Time to Resolve (Total Outage Duration)
  monthlyAllowedDowntimeMin: number;
  errorBudgetConsumedPct: number;
  actualMonthlyUptimePct: number;
  slaBreached: boolean;
  slaCreditTierPct: number;     // 10%, 25%, 50%, 100% service credit
  financialPenaltyUsd: number;
  customerErrorRatioPct: number;
}

function parseHmToMinutes(hm: string): number {
  const parts = hm.trim().split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
}

export function calculateSreMetrics(proj: IncidentPostmortemProject): SreMetricsSummary {
  const startMin = parseHmToMinutes(proj.outageStartTime);
  let detectMin = parseHmToMinutes(proj.alertFiredTime);
  let mitigateMin = parseHmToMinutes(proj.mitigationAppliedTime);
  let resolveMin = parseHmToMinutes(proj.fullRecoveryTime);

  if (detectMin < startMin) detectMin += 1440;
  if (mitigateMin < startMin) mitigateMin += 1440;
  if (resolveMin < startMin) resolveMin += 1440;

  const ttdMinutes = Math.max(1, detectMin - startMin);
  const ttmMinutes = Math.max(ttdMinutes, mitigateMin - startMin);
  const ttrMinutes = Math.max(ttmMinutes, resolveMin - startMin);

  const totalMinutesIn30Days = 30 * 24 * 60; // 43,200 min
  const monthlyAllowedDowntimeMin = Number(
    (totalMinutesIn30Days * ((100 - proj.ContractedSlaPct) / 100)).toFixed(2)
  );

  const errorBudgetConsumedPct =
    monthlyAllowedDowntimeMin > 0
      ? Number(((ttrMinutes / monthlyAllowedDowntimeMin) * 100).toFixed(1))
      : 100;

  const actualMonthlyUptimePct = Number(
    (((totalMinutesIn30Days - ttrMinutes) / totalMinutesIn30Days) * 100).toFixed(4)
  );

  const slaBreached = actualMonthlyUptimePct < proj.ContractedSlaPct;

  // Standard Enterprise SLA Credit Schedule
  let slaCreditTierPct = 0;
  if (slaBreached) {
    if (actualMonthlyUptimePct >= 99.9) slaCreditTierPct = 10;
    else if (actualMonthlyUptimePct >= 99.0) slaCreditTierPct = 25;
    else if (actualMonthlyUptimePct >= 95.0) slaCreditTierPct = 50;
    else slaCreditTierPct = 100;
  }

  const financialPenaltyUsd = Math.round(
    proj.monthlyArrAtRiskUsd * (slaCreditTierPct / 100)
  );

  const customerErrorRatioPct =
    proj.totalRequestsDuringWindow > 0
      ? Number(
          ((proj.failedRequestsCount / proj.totalRequestsDuringWindow) * 100).toFixed(2)
        )
      : 0;

  return {
    ttdMinutes,
    ttmMinutes,
    ttrMinutes,
    monthlyAllowedDowntimeMin,
    errorBudgetConsumedPct,
    actualMonthlyUptimePct,
    slaBreached,
    slaCreditTierPct,
    financialPenaltyUsd,
    customerErrorRatioPct,
  };
}

// ----------------------------------------------------------------------------
// SIEM / Kubernetes / Nginx / Microservice Structured Log Parser
// ----------------------------------------------------------------------------
export function parseRawServerLogs(rawLogs: string): {
  entries: ParsedLogEntry[];
  fatalCount: number;
  errorCount: number;
  warnCount: number;
  p99LatencyMs: number;
  topFailingService: string;
} {
  const lines = rawLogs
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const entries: ParsedLogEntry[] = lines.map((line, idx) => {
    const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?|\d{2}:\d{2}:\d{2})/);
    const levelMatch = line.match(/\b(FATAL|ERROR|WARN|WARNING|INFO)\b/i);
    const serviceMatch = line.match(/\[([a-zA-Z0-9_-]+)\]/) || line.match(/service=([a-zA-Z0-9_-]+)/);
    const statusMatch = line.match(/\b(500|502|503|504|429|408|200)\b/) || line.match(/status=(\d{3})/);
    const latencyMatch = line.match(/(\d+)ms\b/) || line.match(/latency=(\d+)/);
    const traceMatch = line.match(/trace_id=([a-zA-Z0-9-]+)/) || line.match(/req-[a-zA-Z0-9]+/);

    const rawLvl = (levelMatch ? levelMatch[1].toUpperCase() : 'ERROR') as string;
    const level: ParsedLogEntry['level'] =
      rawLvl === 'FATAL'
        ? 'FATAL'
        : rawLvl === 'WARN' || rawLvl === 'WARNING'
        ? 'WARN'
        : rawLvl === 'INFO'
        ? 'INFO'
        : 'ERROR';

    return {
      id: `log-${idx}`,
      timestamp: timeMatch ? timeMatch[1] : `14:${12 + (idx % 45)}:09Z`,
      level,
      service: serviceMatch ? serviceMatch[1] : 'payment-gateway-svc',
      statusCode: statusMatch ? Number(statusMatch[1]) : level === 'INFO' ? 200 : 503,
      latencyMs: latencyMatch ? Number(latencyMatch[1]) : level === 'FATAL' ? 15000 : 4200,
      traceId: traceMatch ? traceMatch[0].replace('trace_id=', '') : `trc-998${idx}`,
      message: line.slice(0, 160),
    };
  });

  const fatalCount = entries.filter((e) => e.level === 'FATAL').length;
  const errorCount = entries.filter((e) => e.level === 'ERROR').length;
  const warnCount = entries.filter((e) => e.level === 'WARN').length;

  const sortedLatencies = [...entries].map((e) => e.latencyMs).sort((a, b) => b - a);
  const p99LatencyMs = sortedLatencies[0] || 0;

  const serviceCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.level === 'FATAL' || e.level === 'ERROR') {
      serviceCounts[e.service] = (serviceCounts[e.service] || 0) + 1;
    }
  }
  const topFailingService =
    Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'pgbouncer-pool';

  return {
    entries,
    fatalCount,
    errorCount,
    warnCount,
    p99LatencyMs,
    topFailingService,
  };
}

// ----------------------------------------------------------------------------
// Official Blameless SRE Postmortem Markdown Generator
// ----------------------------------------------------------------------------
export function generatePostmortemMarkdown(
  proj: IncidentPostmortemProject,
  metrics: SreMetricsSummary
): string {
  return `# OFFICIAL INCIDENT POSTMORTEM & ROOT CAUSE ANALYSIS (${proj.incidentId})
**Title:** ${proj.title}  
**Severity:** ${proj.severity} | **Date:** ${proj.dateIso}  
**Incident Commander:** ${proj.incidentCommander} | **Lead SRE:** ${proj.leadSre}  
**Affected Services:** ${proj.affectedServices.join(', ')}  
**Regions:** ${proj.affectedRegions.join(', ')}

---

## 1. EXECUTIVE SUMMARY & CUSTOMER IMPACT
${proj.executiveSummary}

- **Triggering Change / Event:** ${proj.triggeringChange}
- **Total Outage Window (TTR):** ${metrics.ttrMinutes} minutes (${proj.outageStartTime} UTC → ${proj.fullRecoveryTime} UTC)
- **Time to Detect (TTD):** ${metrics.ttdMinutes} min | **Time to Mitigate (TTM):** ${metrics.ttmMinutes} min
- **Failed Customer Requests:** ${proj.failedRequestsCount.toLocaleString()} / ${proj.totalRequestsDuringWindow.toLocaleString()} (${metrics.customerErrorRatioPct}% Failure Rate)
- **Contracted SLA vs Actual Uptime:** ${proj.ContractedSlaPct}% target vs **${metrics.actualMonthlyUptimePct}%** actual (${metrics.errorBudgetConsumedPct}% of monthly error budget burned)
- **Estimated SLA Service Credit Liability:** $${metrics.financialPenaltyUsd.toLocaleString()} (${metrics.slaCreditTierPct}% SLA Credit Tier)

---

## 2. 5-WHYS ROOT CAUSE ANALYSIS (RCA)
${proj.fiveWhys.map((w, i) => `${i + 1}. **Why #${i + 1}:** ${w}`).join('\n')}

---

## 3. CHRONOLOGICAL INCIDENT TIMELINE (UTC)
| Time (UTC) | Phase | Actor / System | Event Summary |
| :--- | :--- | :--- | :--- |
${proj.timeline
  .map((t) => `| \`${t.timeUtc}\` | **${t.phase}** | ${t.actor} | ${t.summary} |`)
  .join('\n')}

---

## 4. CORRECTIVE & PREVENTATIVE ACTION ITEMS (CAPA)
| Ticket | Category | Priority | Owner | Due Date | Action Item | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${proj.actionItems
  .map(
    (a) =>
      `| \`${a.jiraKey}\` | ${a.category} | **${a.priority}** | ${a.owner} | ${a.dueDate} | ${a.title} | ${
        a.completed ? 'COMPLETED' : 'OPEN'
      } |`
  )
  .join('\n')}
`;
}

// ----------------------------------------------------------------------------
// Preset Incident Postmortem Projects
// ----------------------------------------------------------------------------
export const PRESET_INCIDENTS: Record<string, IncidentPostmortemProject> = {
  db_pool_exhaustion: {
    incidentId: 'INC-2026-0842',
    title: 'Primary PostgreSQL Connection Pool Exhaustion & Checkout API Cascading 503 Outage',
    severity: 'SEV-1 (CRITICAL)',
    incidentCommander: 'Kaan Demir (VP Engineering)',
    leadSre: 'Elif Yalçın (Principal SRE)',
    dateIso: '2026-10-18',
    affectedServices: ['checkout-orchestrator', 'pgbouncer-primary-eu', 'ledger-settlement-svc'],
    affectedRegions: ['eu-central-1 (Frankfurt)', 'tr-west-1 (Istanbul)'],
    outageStartTime: '14:12',
    alertFiredTime: '14:16',
    mitigationAppliedTime: '14:44',
    fullRecoveryTime: '15:09',
    ContractedSlaPct: 99.99,
    monthlyArrAtRiskUsd: 640000,
    totalRequestsDuringWindow: 1480000,
    failedRequestsCount: 412000,
    peakErrorRatePct: 68.4,
    accentColor: '#ef4444',
    executiveSummary:
      'At 14:12 UTC, a Helm chart deployment (v4.18.2) introduced an unindexed JSONB query inside the synchronous checkout webhook transaction block. Under peak afternoon flash-sale traffic (26,000 RPS), query execution times degraded from 4ms to 14,800ms, saturating all 1,200 PgBouncer backend connections within 190 seconds and causing HTTP 503 Gateway Timeouts across payment endpoints.',
    triggeringChange:
      'Helm Release v4.18.2 (PR #4912) — Unindexed JSONB containment filter inside active database transaction lock',
    fiveWhys: [
      'Why did Checkout API return HTTP 503? Because PgBouncer connection pools reached 100% saturation and rejected new client transactions after 5,000ms wait timeout.',
      'Why did PgBouncer saturate all 1,200 connections? Because active PostgreSQL transactions remained open for 14.8 seconds instead of the baseline 4.2ms.',
      'Why did transaction duration spike 3,500x? Because PR #4912 executed a full sequential table scan over 48M rows on `merchant_webhooks.payload_jsonb` without a GIN index.',
      'Why was the missing GIN index not caught in staging? Because the staging database only contained 45,000 synthetic rows where sequential scan completed in 3ms.',
      'Why did CI/CD allow an unindexed query into production? Because automated `EXPLAIN (ANALYZE, BUFFERS)` query plan gate checks were not enforced on migration PRs.',
    ],
    rawLogDump: `2026-10-18T14:12:19Z WARN [pgbouncer-primary-eu] status=200 latency=1840ms trace_id=trc-88101 pool_active_connections=980/1200 queue_wait_warning
2026-10-18T14:13:04Z ERROR [checkout-orchestrator] status=504 latency=5002ms trace_id=trc-88102 FATAL: query_wait_timeout exceeded acquiring connection from pgbouncer
2026-10-18T14:14:41Z FATAL [pgbouncer-primary-eu] status=503 latency=14890ms trace_id=trc-88103 max_client_conn reached (1200/1200) - dropping incoming TLS handshakes
2026-10-18T14:15:58Z FATAL [ledger-settlement-svc] status=503 latency=15000ms trace_id=trc-88104 circuit_breaker=OPEN upstream checkout-orchestrator healthcheck failed
2026-10-18T14:16:12Z ERROR [prometheus-alertmanager] status=500 latency=320ms trace_id=trc-88105 PagerDuty SEV-1 Triggered: HighErrorBudgetBurnRate (68.4% 5xx)
2026-10-18T14:38:20Z WARN [checkout-orchestrator] status=429 latency=410ms trace_id=trc-88106 Load-shedding rate limiter enabled for non-critical webhook retries
2026-10-18T14:44:05Z INFO [pgbouncer-primary-eu] status=200 latency=12ms trace_id=trc-88107 Helm rollback to v4.18.1 completed; CREATE INDEX CONCURRENTLY idx_webhook_gin started`,
    timeline: [
      {
        id: 'tl-1',
        timeUtc: '14:12 UTC',
        phase: 'DETECTION',
        actor: 'ArgoCD / GitOps',
        summary: 'Helm release v4.18.2 rolled out to 100% of checkout-orchestrator pods.',
        isKeyMilestone: true,
      },
      {
        id: 'tl-2',
        timeUtc: '14:16 UTC',
        phase: 'ESCALATION',
        actor: 'Datadog / PagerDuty',
        summary: 'Burn-rate alert fired (5xx > 15% over 3m). On-call SRE acknowledged within 45s.',
        isKeyMilestone: true,
      },
      {
        id: 'tl-3',
        timeUtc: '14:27 UTC',
        phase: 'DIAGNOSIS',
        actor: 'Elif Yalçın (SRE)',
        summary: 'Identified `pg_stat_activity` lock contention on unindexed JSONB query from v4.18.2.',
        isKeyMilestone: false,
      },
      {
        id: 'tl-4',
        timeUtc: '14:44 UTC',
        phase: 'MITIGATION',
        actor: 'Kaan Demir (IC)',
        summary: 'Executed atomic `helm rollback` to v4.18.1 and terminated stalled PIDs via pg_terminate_backend.',
        isKeyMilestone: true,
      },
      {
        id: 'tl-5',
        timeUtc: '15:09 UTC',
        phase: 'RECOVERY',
        actor: 'SRE Command Center',
        summary: 'Connection pool utilization stabilized at 14%, queued webhook backlog drained, SEV-1 resolved.',
        isKeyMilestone: true,
      },
    ],
    actionItems: [
      {
        id: 'ca-1',
        jiraKey: 'SRE-4102',
        category: 'PREVENT',
        priority: 'P0',
        owner: 'DB Platform Team',
        dueDate: '2026-10-22',
        title: 'Add mandatory CI gate running EXPLAIN Cost Estimator against production-sized anonymized clone.',
        completed: true,
      },
      {
        id: 'ca-2',
        jiraKey: 'SRE-4108',
        category: 'MITIGATE',
        priority: 'P0',
        owner: 'Checkout Squad',
        dueDate: '2026-10-25',
        title: 'Enforce strict `statement_timeout = 1500ms` at PostgreSQL role level for checkout-orchestrator.',
        completed: true,
      },
      {
        id: 'ca-3',
        jiraKey: 'SRE-4115',
        category: 'DETECT',
        priority: 'P1',
        owner: 'Observability Team',
        dueDate: '2026-10-30',
        title: 'Enforce progressive ArgoCD Canary rollout (5% -> 25% -> 100%) with automatic rollback on p99 > 500ms.',
        completed: false,
      },
    ],
  },
  bgp_dns_blackhole: {
    incidentId: 'INC-2026-0915',
    title: 'Edge Anycast DNSSEC Key Rollover Misconfiguration & Global API Resolution Failure',
    severity: 'SEV-1 (CRITICAL)',
    incidentCommander: 'Mert Soylu (Head of Infra)',
    leadSre: 'Zeynep Kaya (Staff Network Engineer)',
    dateIso: '2026-10-14',
    affectedServices: ['edge-anycast-dns', 'auth-oauth2-gateway', 'cdn-static-assets'],
    affectedRegions: ['Global Anycast Edge (38 PoPs)'],
    outageStartTime: '08:20',
    alertFiredTime: '08:23',
    mitigationAppliedTime: '08:52',
    fullRecoveryTime: '09:15',
    ContractedSlaPct: 99.99,
    monthlyArrAtRiskUsd: 920000,
    totalRequestsDuringWindow: 3200000,
    failedRequestsCount: 1180000,
    peakErrorRatePct: 84.0,
    accentColor: '#f59e0b',
    executiveSummary:
      'An automated ZSK (Zone Signing Key) DNSSEC rotation script published a new RRSIG record before the corresponding DNSKEY record finished propagating across secondary Anycast authoritative nameservers, causing validating resolvers (1.1.1.1 / 8.8.8.8) to return SERVFAIL for `api.corpus.cloud`.',
    triggeringChange: 'Automated Cron ZSK Rotation v2.1 without pre-publish verification wait window',
    fiveWhys: [
      'Why did clients fail to connect to api.corpus.cloud? Because public DNS resolvers returned SERVFAIL on DNSSEC signature validation.',
      'Why did DNSSEC validation fail? Because secondary edge PoPs served RRSIG signatures signed with Key ID 58102 while still serving the stale DNSKEY RRset.',
      'Why were secondary PoPs serving a stale DNSKEY RRset? Because IXFR zone transfer replication lagged by 14 minutes due to a locked control-plane worker.',
      'Why did the key signer proceed despite replication lag? Because the rotation script did not poll SOA serial parity across all Anycast PoPs before swapping RRSIGs.',
      'Why was negative-cache TTL so impactful? Because SOA minimum TTL was set to 1,800s instead of RFC-recommended 300s during key rollovers.',
    ],
    rawLogDump: `2026-10-14T08:20:02Z WARN [edge-anycast-dns] status=200 latency=110ms trace_id=dns-101 ZSK Key Rollover initiated key_tag=58102
2026-10-14T08:21:15Z ERROR [edge-anycast-dns] status=502 latency=4500ms trace_id=dns-102 IXFR transfer timeout to pop-fra-02 and pop-ist-01
2026-10-14T08:22:40Z FATAL [auth-oauth2-gateway] status=503 latency=9800ms trace_id=dns-103 Synthetic probe SERVFAIL: DNSSEC Bogus RRSIG on api.corpus.cloud`,
    timeline: [
      {
        id: 'dns-t1',
        timeUtc: '08:20 UTC',
        phase: 'DETECTION',
        actor: 'DNSSEC Signer Cron',
        summary: 'ZSK key rotation triggered; RRSIG records updated on primary hidden master.',
        isKeyMilestone: true,
      },
      {
        id: 'dns-t2',
        timeUtc: '08:23 UTC',
        phase: 'ESCALATION',
        actor: 'ThousandEyes / Catchpoint',
        summary: 'Global synthetic DNS probes alerted SERVFAIL across Cloudflare & Google Public DNS.',
        isKeyMilestone: true,
      },
      {
        id: 'dns-t3',
        timeUtc: '08:52 UTC',
        phase: 'MITIGATION',
        actor: 'Zeynep Kaya (NetEng)',
        summary: 'Forced AXFR zone push to all 38 PoPs and issued cache-purge API call to 1.1.1.1 and 8.8.8.8.',
        isKeyMilestone: true,
      },
      {
        id: 'dns-t4',
        timeUtc: '09:15 UTC',
        phase: 'RECOVERY',
        actor: 'Incident Commander',
        summary: 'Global DNS resolution success rate returned to 99.998%. Incident closed.',
        isKeyMilestone: true,
      },
    ],
    actionItems: [
      {
        id: 'dns-a1',
        jiraKey: 'NET-1904',
        category: 'PREVENT',
        priority: 'P0',
        owner: 'Core Edge Team',
        dueDate: '2026-10-20',
        title: 'Require 100% PoP SOA serial consensus gate before activating new DNSSEC RRSIG records.',
        completed: true,
      },
    ],
  },
};
