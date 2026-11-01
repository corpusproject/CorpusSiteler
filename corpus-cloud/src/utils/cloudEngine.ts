// ============================================================================
// CORPUS CLOUD — Multi-Cloud FinOps, Kubernetes HPA & Terraform HCL Studio
// #036 PRO | AWS vs GCP vs Azure vs Hetzner Bare-Metal TCO & IaC Generator
// ============================================================================

export type CloudProviderId = 'aws' | 'gcp' | 'azure' | 'hetzner';

export type WorkloadTier =
  | 'COMPUTE_K8S'
  | 'MANAGED_DB'
  | 'CACHE_REDIS'
  | 'OBJECT_STORAGE'
  | 'NETWORKING_LB';

export interface CloudResourceNode {
  id: string;
  name: string;
  tier: WorkloadTier;
  serviceRole: string;
  vCpuPerInstance: number;
  ramGbPerInstance: number;
  storageGb: number;
  minReplicas: number;
  maxReplicas: number;
  avgUtilizationPct: number;
  multiAzHa: boolean;
  spotEligible: boolean;
  monthlyEgressTb: number;
}

export interface ProviderPricingProfile {
  id: CloudProviderId;
  name: string;
  regionName: string;
  vCpuHourlyUsd: number;
  ramGbHourlyUsd: number;
  managedDbMultiplier: number;
  redisMultiplier: number;
  ssdGbMonthlyUsd: number;
  objectStorageGbMonthlyUsd: number;
  egressTbMonthlyUsd: number;
  natGatewayBaseMonthlyUsd: number;
  controlPlaneMonthlyUsd: number;
  reserved1YrDiscountPct: number;
  reserved3YrDiscountPct: number;
  spotDiscountPct: number;
  slaUptime: string;
  badgeColor: string;
}

export interface ProviderCostResult {
  provider: ProviderPricingProfile;
  onDemandMonthlyUsd: number;
  reserved1YrMonthlyUsd: number;
  reserved3YrMonthlyUsd: number;
  optimizedBlendedMonthlyUsd: number;
  computeCostUsd: number;
  databaseCostUsd: number;
  storageAndCacheCostUsd: number;
  networkEgressAndNatUsd: number;
  controlPlaneCostUsd: number;
  annualSavingsWithFinOpsUsd: number;
}

export interface CloudArchitectureProject {
  projectName: string;
  environment: 'production' | 'staging' | 'dr-multi-region';
  kubernetesVersion: string;
  selectedProvider: CloudProviderId;
  commitmentStrategy: 'ON_DEMAND' | 'RESERVED_1YR' | 'RESERVED_3YR' | 'HYBRID_SPOT_RI';
  targetPeakRps: number;
  enableServiceMeshIstio: boolean;
  enableWafCloudflare: boolean;
  enableMultiAzNat: boolean;
  nodes: CloudResourceNode[];
  accentColor: string;
}

export const CLOUD_PROVIDERS: ProviderPricingProfile[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services (AWS EKS)',
    regionName: 'eu-central-1 (Frankfurt)',
    vCpuHourlyUsd: 0.0416,
    ramGbHourlyUsd: 0.0052,
    managedDbMultiplier: 1.85,
    redisMultiplier: 1.55,
    ssdGbMonthlyUsd: 0.095,
    objectStorageGbMonthlyUsd: 0.023,
    egressTbMonthlyUsd: 87.0,
    natGatewayBaseMonthlyUsd: 98.0,
    controlPlaneMonthlyUsd: 73.0,
    reserved1YrDiscountPct: 36,
    reserved3YrDiscountPct: 58,
    spotDiscountPct: 68,
    slaUptime: '99.99%',
    badgeColor: '#f59e0b',
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform (GKE)',
    regionName: 'europe-west3 (Frankfurt)',
    vCpuHourlyUsd: 0.0385,
    ramGbHourlyUsd: 0.0049,
    managedDbMultiplier: 1.75,
    redisMultiplier: 1.48,
    ssdGbMonthlyUsd: 0.088,
    objectStorageGbMonthlyUsd: 0.020,
    egressTbMonthlyUsd: 82.0,
    natGatewayBaseMonthlyUsd: 64.0,
    controlPlaneMonthlyUsd: 73.0,
    reserved1YrDiscountPct: 37,
    reserved3YrDiscountPct: 57,
    spotDiscountPct: 72,
    slaUptime: '99.99%',
    badgeColor: '#3b82f6',
  },
  {
    id: 'azure',
    name: 'Microsoft Azure (AKS)',
    regionName: 'Germany West Central',
    vCpuHourlyUsd: 0.0405,
    ramGbHourlyUsd: 0.0051,
    managedDbMultiplier: 1.80,
    redisMultiplier: 1.52,
    ssdGbMonthlyUsd: 0.092,
    objectStorageGbMonthlyUsd: 0.021,
    egressTbMonthlyUsd: 85.0,
    natGatewayBaseMonthlyUsd: 79.0,
    controlPlaneMonthlyUsd: 73.0,
    reserved1YrDiscountPct: 35,
    reserved3YrDiscountPct: 56,
    spotDiscountPct: 65,
    slaUptime: '99.95%',
    badgeColor: '#06b6d4',
  },
  {
    id: 'hetzner',
    name: 'Hetzner Cloud & Bare-Metal K8s',
    regionName: 'eu-central (Falkenstein DE)',
    vCpuHourlyUsd: 0.0095,
    ramGbHourlyUsd: 0.0014,
    managedDbMultiplier: 1.25,
    redisMultiplier: 1.15,
    ssdGbMonthlyUsd: 0.044,
    objectStorageGbMonthlyUsd: 0.006,
    egressTbMonthlyUsd: 1.15,
    natGatewayBaseMonthlyUsd: 6.5,
    controlPlaneMonthlyUsd: 0.0,
    reserved1YrDiscountPct: 12,
    reserved3YrDiscountPct: 22,
    spotDiscountPct: 25,
    slaUptime: '99.90%',
    badgeColor: '#10b981',
  },
];

// ----------------------------------------------------------------------------
// Multi-Cloud FinOps Cost & K8s Capacity Calculator
// ----------------------------------------------------------------------------
export function calculateCloudFinOps(project: CloudArchitectureProject): {
  results: ProviderCostResult[];
  totalVCpu: number;
  totalRamGb: number;
  totalStorageGb: number;
  totalEgressTb: number;
  estimatedMaxRpsCapacity: number;
} {
  const HOURS_PER_MONTH = 730;

  let totalVCpu = 0;
  let totalRamGb = 0;
  let totalStorageGb = 0;
  let totalEgressTb = 0;

  for (const node of project.nodes) {
    const effectiveReplicas =
      node.minReplicas +
      (node.maxReplicas - node.minReplicas) * (node.avgUtilizationPct / 100);
    const haMultiplier = node.multiAzHa && node.tier === 'MANAGED_DB' ? 2 : 1;
    totalVCpu += Math.round(node.vCpuPerInstance * effectiveReplicas * haMultiplier);
    totalRamGb += Math.round(node.ramGbPerInstance * effectiveReplicas * haMultiplier);
    totalStorageGb += Math.round(node.storageGb * haMultiplier);
    totalEgressTb += node.monthlyEgressTb;
  }

  const estimatedMaxRpsCapacity = totalVCpu * 850;

  const results: ProviderCostResult[] = CLOUD_PROVIDERS.map((provider) => {
    let computeCostUsd = 0;
    let databaseCostUsd = 0;
    let storageAndCacheCostUsd = 0;
    let spotSavingsPoolUsd = 0;

    for (const node of project.nodes) {
      const effectiveReplicas =
        node.minReplicas +
        (node.maxReplicas - node.minReplicas) * (node.avgUtilizationPct / 100);

      const baseInstanceMonthly =
        (node.vCpuPerInstance * provider.vCpuHourlyUsd +
          node.ramGbPerInstance * provider.ramGbHourlyUsd) *
        HOURS_PER_MONTH;

      if (node.tier === 'COMPUTE_K8S') {
        const nodeCost = baseInstanceMonthly * effectiveReplicas;
        const ssdCost = node.storageGb * provider.ssdGbMonthlyUsd * node.minReplicas;
        computeCostUsd += nodeCost + ssdCost;
        if (node.spotEligible) {
          spotSavingsPoolUsd += nodeCost * (provider.spotDiscountPct / 100) * 0.65;
        }
      } else if (node.tier === 'MANAGED_DB') {
        const haMult = node.multiAzHa ? 2.0 : 1.0;
        const dbCompute =
          baseInstanceMonthly *
          provider.managedDbMultiplier *
          node.minReplicas *
          haMult;
        const dbStorage =
          node.storageGb * provider.ssdGbMonthlyUsd * 1.45 * haMult;
        databaseCostUsd += dbCompute + dbStorage;
      } else if (node.tier === 'CACHE_REDIS') {
        const haMult = node.multiAzHa ? 1.8 : 1.0;
        const redisCost =
          baseInstanceMonthly * provider.redisMultiplier * node.minReplicas * haMult;
        storageAndCacheCostUsd += redisCost;
      } else if (node.tier === 'OBJECT_STORAGE') {
        storageAndCacheCostUsd +=
          node.storageGb * provider.objectStorageGbMonthlyUsd;
      } else if (node.tier === 'NETWORKING_LB') {
        computeCostUsd += 28.0 * node.minReplicas;
      }
    }

    const natZones = project.enableMultiAzNat ? 3 : 1;
    const networkEgressAndNatUsd =
      totalEgressTb * provider.egressTbMonthlyUsd +
      provider.natGatewayBaseMonthlyUsd * natZones +
      (project.enableWafCloudflare ? 45.0 : 0);

    const controlPlaneCostUsd =
      provider.controlPlaneMonthlyUsd +
      (project.enableServiceMeshIstio ? 38.0 : 0);

    const onDemandMonthlyUsd =
      computeCostUsd +
      databaseCostUsd +
      storageAndCacheCostUsd +
      networkEgressAndNatUsd +
      controlPlaneCostUsd;

    const discountableBase = computeCostUsd + databaseCostUsd + storageAndCacheCostUsd;
    const fixedInfraBase = networkEgressAndNatUsd + controlPlaneCostUsd;

    const reserved1YrMonthlyUsd =
      discountableBase * (1 - provider.reserved1YrDiscountPct / 100) + fixedInfraBase;

    const reserved3YrMonthlyUsd =
      discountableBase * (1 - provider.reserved3YrDiscountPct / 100) + fixedInfraBase;

    const hybridSpotRiMonthlyUsd =
      Math.max(
        discountableBase * 0.3,
        discountableBase * (1 - provider.reserved1YrDiscountPct / 100) -
          spotSavingsPoolUsd * 0.55
      ) + fixedInfraBase;

    let optimizedBlendedMonthlyUsd = onDemandMonthlyUsd;
    if (project.commitmentStrategy === 'RESERVED_1YR') {
      optimizedBlendedMonthlyUsd = reserved1YrMonthlyUsd;
    } else if (project.commitmentStrategy === 'RESERVED_3YR') {
      optimizedBlendedMonthlyUsd = reserved3YrMonthlyUsd;
    } else if (project.commitmentStrategy === 'HYBRID_SPOT_RI') {
      optimizedBlendedMonthlyUsd = hybridSpotRiMonthlyUsd;
    }

    const annualSavingsWithFinOpsUsd = Math.max(
      0,
      (onDemandMonthlyUsd - hybridSpotRiMonthlyUsd) * 12
    );

    return {
      provider,
      onDemandMonthlyUsd,
      reserved1YrMonthlyUsd,
      reserved3YrMonthlyUsd,
      optimizedBlendedMonthlyUsd,
      computeCostUsd,
      databaseCostUsd,
      storageAndCacheCostUsd,
      networkEgressAndNatUsd,
      controlPlaneCostUsd,
      annualSavingsWithFinOpsUsd,
    };
  });

  return {
    results,
    totalVCpu,
    totalRamGb,
    totalStorageGb,
    totalEgressTb: Number(totalEgressTb.toFixed(1)),
    estimatedMaxRpsCapacity,
  };
}

// ----------------------------------------------------------------------------
// IaC Generator: Terraform HCL (main.tf), Kubernetes YAML & docker-compose.yml
// ----------------------------------------------------------------------------
export function generateCloudIaC(
  project: CloudArchitectureProject,
  format: 'terraform' | 'k8s_yaml' | 'docker_compose'
): string {
  const k8sNodes = project.nodes.filter((n) => n.tier === 'COMPUTE_K8S');
  const dbNodes = project.nodes.filter((n) => n.tier === 'MANAGED_DB');
  const redisNodes = project.nodes.filter((n) => n.tier === 'CACHE_REDIS');

  if (format === 'terraform') {
    return `# ============================================================================
# Auto-Generated by Corpus Cloud & FinOps Terraform Studio (#036 PRO)
# Architecture: ${project.projectName} (${project.environment.toUpperCase()})
# Target Provider: ${project.selectedProvider.toUpperCase()} | K8s v${project.kubernetesVersion}
# ============================================================================

terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.65.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.32.0"
    }
  }
}

module "vpc_network" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.13.0"

  name = "${project.projectName.toLowerCase().replace(/\s+/g, '-')}-vpc"
  cidr = "10.40.0.0/16"

  azs             = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
  private_subnets = ["10.40.1.0/24", "10.40.2.0/24", "10.40.3.0/24"]
  public_subnets  = ["10.40.101.0/24", "10.40.102.0/24", "10.40.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = ${!project.enableMultiAzNat}
  one_nat_gateway_per_az = ${project.enableMultiAzNat}
}

module "eks_cluster" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24.0"

  cluster_name    = "${project.projectName.toLowerCase().replace(/\s+/g, '-')}-${project.environment}"
  cluster_version = "${project.kubernetesVersion}"

  vpc_id     = module.vpc_network.vpc_id
  subnet_ids = module.vpc_network.private_subnets

  eks_managed_node_groups = {
${k8sNodes
  .map(
    (n) => `    ${n.name.replace(/[^a-zA-Z0-9_]/g, '_')} = {
      min_size       = ${n.minReplicas}
      max_size       = ${n.maxReplicas}
      desired_size   = ${Math.ceil((n.minReplicas + n.maxReplicas) / 2)}
      capacity_type  = "${n.spotEligible ? 'SPOT' : 'ON_DEMAND'}"
      instance_types = ["c7i.${n.vCpuPerInstance <= 4 ? 'xlarge' : '2xlarge'}"]
      disk_size      = ${n.storageGb}
    }`
  )
  .join('\n')}
  }
}
${dbNodes
  .map(
    (db) => `
resource "aws_db_instance" "${db.name.replace(/[^a-zA-Z0-9_]/g, '_')}" {
  identifier        = "${db.name.toLowerCase()}-${project.environment}"
  engine            = "postgres"
  engine_version    = "16.4"
  instance_class    = "db.r7g.${db.vCpuPerInstance <= 4 ? 'xlarge' : '2xlarge'}"
  allocated_storage = ${db.storageGb}
  storage_type      = "gp3"
  multi_az          = ${db.multiAzHa}
  storage_encrypted = true
}`
  )
  .join('\n')}
`;
  }

  if (format === 'k8s_yaml') {
    return k8sNodes
      .map(
        (n) => `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${n.name}
  namespace: ${project.environment}
  labels:
    app: ${n.name}
    managed-by: corpus-cloud-studio
spec:
  replicas: ${n.minReplicas}
  selector:
    matchLabels:
      app: ${n.name}
  template:
    metadata:
      labels:
        app: ${n.name}
    spec:
      containers:
        - name: ${n.name}
          image: registry.corpus.cloud/${n.name}:stable
          resources:
            requests:
              cpu: "${Math.max(1, Math.floor(n.vCpuPerInstance * 0.7))}000m"
              memory: "${Math.max(1, Math.floor(n.ramGbPerInstance * 0.8))}Gi"
            limits:
              cpu: "${n.vCpuPerInstance}000m"
              memory: "${n.ramGbPerInstance}Gi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${n.name}-hpa
  namespace: ${project.environment}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${n.name}
  minReplicas: ${n.minReplicas}
  maxReplicas: ${n.maxReplicas}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${n.avgUtilizationPct}`
      )
      .join('\n---\n');
  }

  // docker_compose
  return `version: "3.9"
# Auto-Generated Local & Staging Compose Topology (${project.projectName})
services:
${k8sNodes
  .map(
    (n, i) => `  ${n.name}:
    image: registry.corpus.cloud/${n.name}:latest
    deploy:
      replicas: ${n.minReplicas}
      resources:
        limits:
          cpus: "${n.vCpuPerInstance}.0"
          memory: ${n.ramGbPerInstance}G
    ports:
      - "${8080 + i}:8080"`
  )
  .join('\n')}
${dbNodes
  .map(
    (db) => `  ${db.name}:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: enterprise_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - ${db.name}_data:/var/lib/postgresql/data`
  )
  .join('\n')}
${redisNodes
  .map(
    (r) => `  ${r.name}:
    image: redis:7.4-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "${r.ramGbPerInstance}gb"]`
  )
  .join('\n')}
`;
}

// ----------------------------------------------------------------------------
// Preset Cloud Architecture Blueprints
// ----------------------------------------------------------------------------
export const PRESET_CLOUD_PROJECTS: Record<string, CloudArchitectureProject> = {
  fintech_high_scale: {
    projectName: 'Global FinTech Payment Switch & Multi-AZ EKS Cluster',
    environment: 'production',
    kubernetesVersion: '1.31',
    selectedProvider: 'aws',
    commitmentStrategy: 'HYBRID_SPOT_RI',
    targetPeakRps: 45000,
    enableServiceMeshIstio: true,
    enableWafCloudflare: true,
    enableMultiAzNat: true,
    accentColor: '#06b6d4',
    nodes: [
      {
        id: 'nd-1',
        name: 'api-gateway-envoy-pool',
        tier: 'COMPUTE_K8S',
        serviceRole: 'Edge mTLS & Rate Limiting Ingress Pods',
        vCpuPerInstance: 8,
        ramGbPerInstance: 16,
        storageGb: 100,
        minReplicas: 4,
        maxReplicas: 16,
        avgUtilizationPct: 60,
        multiAzHa: true,
        spotEligible: true,
        monthlyEgressTb: 18.5,
      },
      {
        id: 'nd-2',
        name: 'payment-ledger-core-workers',
        tier: 'COMPUTE_K8S',
        serviceRole: 'ISO-8583 / SWIFT Transaction Settlement Workers',
        vCpuPerInstance: 16,
        ramGbPerInstance: 32,
        storageGb: 200,
        minReplicas: 6,
        maxReplicas: 24,
        avgUtilizationPct: 65,
        multiAzHa: true,
        spotEligible: false,
        monthlyEgressTb: 6.0,
      },
      {
        id: 'nd-3',
        name: 'aurora-postgres-ledger-primary',
        tier: 'MANAGED_DB',
        serviceRole: 'ACID Financial Ledger (Multi-AZ Synchronous Standby)',
        vCpuPerInstance: 16,
        ramGbPerInstance: 128,
        storageGb: 2500,
        minReplicas: 2,
        maxReplicas: 2,
        avgUtilizationPct: 100,
        multiAzHa: true,
        spotEligible: false,
        monthlyEgressTb: 2.5,
      },
      {
        id: 'nd-4',
        name: 'redis-fraud-velocity-cluster',
        tier: 'CACHE_REDIS',
        serviceRole: 'Sub-millisecond Idempotency & Fraud Sliding Window',
        vCpuPerInstance: 8,
        ramGbPerInstance: 64,
        storageGb: 250,
        minReplicas: 3,
        maxReplicas: 3,
        avgUtilizationPct: 100,
        multiAzHa: true,
        spotEligible: false,
        monthlyEgressTb: 1.2,
      },
      {
        id: 'nd-5',
        name: 's3-immutable-audit-vault',
        tier: 'OBJECT_STORAGE',
        serviceRole: 'WORM Compliance Audit Logs & Parquet Lakehouse',
        vCpuPerInstance: 0,
        ramGbPerInstance: 0,
        storageGb: 18000,
        minReplicas: 1,
        maxReplicas: 1,
        avgUtilizationPct: 100,
        multiAzHa: true,
        spotEligible: false,
        monthlyEgressTb: 4.0,
      },
    ],
  },
  saas_ai_platform: {
    projectName: 'Multi-Tenant B2B AI SaaS & Vector Search Topology',
    environment: 'production',
    kubernetesVersion: '1.31',
    selectedProvider: 'gcp',
    commitmentStrategy: 'RESERVED_1YR',
    targetPeakRps: 18000,
    enableServiceMeshIstio: false,
    enableWafCloudflare: true,
    enableMultiAzNat: true,
    accentColor: '#3b82f6',
    nodes: [
      {
        id: 'ai-1',
        name: 'nextjs-ssr-edge-fleet',
        tier: 'COMPUTE_K8S',
        serviceRole: 'SSR Web App & WebSocket Streaming Gateway',
        vCpuPerInstance: 4,
        ramGbPerInstance: 8,
        storageGb: 80,
        minReplicas: 3,
        maxReplicas: 12,
        avgUtilizationPct: 50,
        multiAzHa: true,
        spotEligible: true,
        monthlyEgressTb: 12.0,
      },
      {
        id: 'ai-2',
        name: 'qdrant-vector-index-cluster',
        tier: 'COMPUTE_K8S',
        serviceRole: 'HNSW High-Memory Vector Embeddings Cluster',
        vCpuPerInstance: 8,
        ramGbPerInstance: 64,
        storageGb: 1200,
        minReplicas: 3,
        maxReplicas: 6,
        avgUtilizationPct: 70,
        multiAzHa: true,
        spotEligible: false,
        monthlyEgressTb: 3.5,
      },
      {
        id: 'ai-3',
        name: 'cloudsql-pgvector-primary',
        tier: 'MANAGED_DB',
        serviceRole: 'Tenant Metadata & Billing PostgreSQL',
        vCpuPerInstance: 8,
        ramGbPerInstance: 32,
        storageGb: 800,
        minReplicas: 1,
        maxReplicas: 1,
        avgUtilizationPct: 100,
        multiAzHa: true,
        spotEligible: false,
        monthlyEgressTb: 1.0,
      },
    ],
  },
};
