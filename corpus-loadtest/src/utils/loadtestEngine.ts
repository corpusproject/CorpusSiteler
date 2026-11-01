// ============================================================================
// CORPUS CHAOS & LOADTEST — Little's Law, USL Scalability & k6/Locust Studio
// #043 PRO | P50/P95/P99 Latency Saturation, DB Pool Bottleneck & Script Gen
// ============================================================================

export type LoadTestProfile = 'RAMP_UP_STEP' | 'SPIKE_FLASH_SALE' | 'SOAK_24H' | 'STRESS_BREAKPOINT';

export interface EndpointScenario {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  trafficWeightPct: number;
  baseLatencyMs: number;
  dbQueriesPerCall: number;
  payloadSizeKb: number;
  slaP95ThresholdMs: number;
}

export interface LoadTestProject {
  testSuiteName: string;
  targetBaseUrl: string;
  profileType: LoadTestProfile;
  peakVirtualUsers: number;
  userThinkTimeMs: number;
  rampUpDurationSec: number;
  steadyStateDurationSec: number;
  appServerReplicas: number;
  vCpuPerReplica: number;
  dbConnectionPoolMax: number;
  uslContentionAlpha: number; // Universal Scalability Law contention (e.g. 0.035)
  uslCoherencyBeta: number;   // USL coherency delay (e.g. 0.0015)
  endpoints: EndpointScenario[];
  accentColor: string;
}

export interface StressStepPoint {
  stepLabel: string;
  virtualUsers: number;
  achievedRps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  dbPoolUtilizationPct: number;
  errorRate5xxPct: number;
}

export interface LoadTestSummary {
  weightedBaseLatencyMs: number;
  estimatedPeakRps: number;
  breakingPointVu: number;
  breakingPointRps: number;
  peakP95LatencyMs: number;
  peakP99LatencyMs: number;
  peakDbConnectionsUsed: number;
  dbBottleneckTriggered: boolean;
  bandwidthMbps: number;
  curveSteps: StressStepPoint[];
}

export function simulateLoadAndCapacity(
  project: LoadTestProject
): LoadTestSummary {
  const totalWeight =
    project.endpoints.reduce((a, b) => a + b.trafficWeightPct, 0) || 100;

  let weightedBaseLatencyMs = 0;
  let weightedDbQueries = 0;
  let weightedPayloadKb = 0;

  for (const ep of project.endpoints) {
    const w = ep.trafficWeightPct / totalWeight;
    weightedBaseLatencyMs += ep.baseLatencyMs * w;
    weightedDbQueries += ep.dbQueriesPerCall * w;
    weightedPayloadKb += ep.payloadSizeKb * w;
  }

  const totalClusterCores = project.appServerReplicas * project.vCpuPerReplica;
  // Max theoretical linear throughput before contention (~420 RPS per vCPU core)
  const theoreticalClusterMaxRps = totalClusterCores * 420;

  const ratios = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25];
  let breakingPointVu = Math.round(project.peakVirtualUsers * 1.35);
  let breakingPointRps = Math.round(theoreticalClusterMaxRps * 0.85);

  const curveSteps: StressStepPoint[] = ratios.map((r) => {
    const vu = Math.max(10, Math.round(project.peakVirtualUsers * r));
    // Little's Law: Throughput = VU / (ResponseTime + ThinkTime)
    const cycleSec =
      (weightedBaseLatencyMs + project.userThinkTimeMs) / 1000;
    const rawRpsDemand = vu / Math.max(0.05, cycleSec);

    const loadLoadFactor = rawRpsDemand / Math.max(100, theoreticalClusterMaxRps);

    // Universal Scalability Law + M/M/c Queueing amplification
    const queueAmplification =
      loadLoadFactor < 0.7
        ? 1 + 0.35 * Math.pow(loadLoadFactor, 2)
        : 1 +
          Math.pow(loadLoadFactor / 0.7, 3.4) *
            (1 + project.uslContentionAlpha * 10);

    const p50LatencyMs = Math.round(
      weightedBaseLatencyMs * Math.min(18, queueAmplification * 0.92)
    );
    const p95LatencyMs = Math.round(p50LatencyMs * 2.15);
    const p99LatencyMs = Math.round(p50LatencyMs * 3.6);

    const effectiveCycleSec =
      (p50LatencyMs + project.userThinkTimeMs * 0.65) / 1000;
    const achievedRps = Math.round(
      Math.min(theoreticalClusterMaxRps * 1.08, vu / Math.max(0.05, effectiveCycleSec))
    );

    // Active DB connections held = RPS * DB_Queries * Avg_Query_Time_Sec (8ms)
    const activeDbConns =
      achievedRps * weightedDbQueries * (0.008 * Math.min(6, queueAmplification));
    const dbPoolUtilizationPct = Math.min(
      100,
      Number(((activeDbConns / project.dbConnectionPoolMax) * 100).toFixed(1))
    );

    const errorRate5xxPct =
      dbPoolUtilizationPct >= 98 || loadLoadFactor >= 0.95
        ? Number(
            Math.min(
              65,
              (loadLoadFactor - 0.85) * 90 +
                Math.max(0, dbPoolUtilizationPct - 92) * 2.2
            ).toFixed(1)
          )
        : 0;

    if (
      (p95LatencyMs > 500 || errorRate5xxPct > 2.0) &&
      vu < breakingPointVu
    ) {
      breakingPointVu = vu;
      breakingPointRps = achievedRps;
    }

    return {
      stepLabel: `${Math.round(r * 100)}% Load`,
      virtualUsers: vu,
      achievedRps,
      p50LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      dbPoolUtilizationPct,
      errorRate5xxPct,
    };
  });

  const peakStep = curveSteps[4]; // 100% Peak VU step
  const bandwidthMbps = Number(
    ((peakStep.achievedRps * weightedPayloadKb * 8) / 1000).toFixed(1)
  );

  return {
    weightedBaseLatencyMs: Math.round(weightedBaseLatencyMs),
    estimatedPeakRps: peakStep.achievedRps,
    breakingPointVu,
    breakingPointRps,
    peakP95LatencyMs: peakStep.p95LatencyMs,
    peakP99LatencyMs: peakStep.p99LatencyMs,
    peakDbConnectionsUsed: Math.round(
      (peakStep.dbPoolUtilizationPct / 100) * project.dbConnectionPoolMax
    ),
    dbBottleneckTriggered: peakStep.dbPoolUtilizationPct >= 88,
    bandwidthMbps,
    curveSteps,
  };
}

// ----------------------------------------------------------------------------
// Production Load Testing Code Generator (Grafana k6 JS & Python Locust)
// ----------------------------------------------------------------------------
export function generateLoadTestScript(
  project: LoadTestProject,
  tool: 'k6' | 'locust'
): string {
  if (tool === 'k6') {
    return `/**
 * Auto-Generated by Corpus Chaos & LoadTest Studio (#043 PRO)
 * Suite: ${project.testSuiteName} | Profile: ${project.profileType}
 * Run command: k6 run --out influxdb=http://localhost:8086/k6 loadtest.k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '${project.rampUpDurationSec}s', target: ${Math.round(project.peakVirtualUsers * 0.5)} },
    { duration: '${project.steadyStateDurationSec}s', target: ${project.peakVirtualUsers} },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<350', 'p(99)<750'],
  },
};

const BASE_URL = '${project.targetBaseUrl}';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${__ENV.API_BEARER_TOKEN || 'loadtest-jwt-token'}\`,
  };

${project.endpoints
  .map(
    (ep, idx) => `  // Scenario ${idx + 1}: ${ep.name} (Weight: ${ep.trafficWeightPct}%)
  const res${idx} = http.${ep.method.toLowerCase()}(\`\${BASE_URL}${ep.path}\`, ${
      ep.method === 'POST' || ep.method === 'PUT'
        ? `JSON.stringify({ timestamp: Date.now() }), { headers }`
        : `{ headers }`
    });
  check(res${idx}, {
    '${ep.name} status is 2xx': (r) => r.status >= 200 && r.status < 300,
    '${ep.name} p95 SLA < ${ep.slaP95ThresholdMs}ms': (r) => r.timings.duration < ${ep.slaP95ThresholdMs},
  });`
  )
  .join('\n\n')}

  sleep(${(project.userThinkTimeMs / 1000).toFixed(2)});
}
`;
  }

  return `# Auto-Generated by Corpus Chaos & LoadTest Studio (#043 PRO)
# Suite: ${project.testSuiteName}
# Run command: locust -f locustfile.py --headless -u ${project.peakVirtualUsers} -r 50 --host ${project.targetBaseUrl}

from locust import HttpUser, task, between

class EnterpriseTrafficUser(HttpUser):
    wait_time = between(${((project.userThinkTimeMs * 0.7) / 1000).toFixed(2)}, ${((project.userThinkTimeMs * 1.3) / 1000).toFixed(2)})

${project.endpoints
  .map(
    (ep) => `    @task(${Math.max(1, Math.round(ep.trafficWeightPct / 5))})
    def ${ep.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}(self):
        self.client.${ep.method.toLowerCase()}("${ep.path}", name="${ep.path}")`
  )
  .join('\n\n')}
`;
}

export const PRESET_LOADTEST_PROJECT: LoadTestProject = {
  testSuiteName: 'Black Friday Flash-Sale Checkout & Order Ledger Stress Suite',
  targetBaseUrl: 'https://api-staging.corpus.cloud',
  profileType: 'SPIKE_FLASH_SALE',
  peakVirtualUsers: 8500,
  userThinkTimeMs: 650,
  rampUpDurationSec: 180,
  steadyStateDurationSec: 600,
  appServerReplicas: 12,
  vCpuPerReplica: 4,
  dbConnectionPoolMax: 600,
  uslContentionAlpha: 0.032,
  uslCoherencyBeta: 0.0012,
  accentColor: '#f97316',
  endpoints: [
    {
      id: 'ep-1',
      name: 'Product Catalog & Live Stock Redis Lookup',
      method: 'GET',
      path: '/v2/catalog/sku-availability',
      trafficWeightPct: 55,
      baseLatencyMs: 24,
      dbQueriesPerCall: 1,
      payloadSizeKb: 14,
      slaP95ThresholdMs: 120,
    },
    {
      id: 'ep-2',
      name: 'Shopping Cart Reservation & Promo Lock',
      method: 'POST',
      path: '/v2/cart/reserve-inventory',
      trafficWeightPct: 30,
      baseLatencyMs: 68,
      dbQueriesPerCall: 3,
      payloadSizeKb: 8,
      slaP95ThresholdMs: 250,
    },
    {
      id: 'ep-3',
      name: '3D-Secure Payment Tokenization & Ledger Commit',
      method: 'POST',
      path: '/v2/checkout/authorize-payment',
      trafficWeightPct: 15,
      baseLatencyMs: 145,
      dbQueriesPerCall: 5,
      payloadSizeKb: 12,
      slaP95ThresholdMs: 420,
    },
  ],
};
