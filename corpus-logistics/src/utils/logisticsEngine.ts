// ============================================================================
// CORPUS LOGISTICS — Container Bin-Packing, EOQ Inventory & Incoterms Engine
// #037 PRO | 20ft/40ft HC Pallet Load, Safety Stock & Landed Cost Duty Studio
// ============================================================================

export type ContainerTypeId = '20ft_dry' | '40ft_dry' | '40ft_hc' | 'eu_megatrailer';

export type IncotermRule = 'EXW' | 'FOB' | 'CIF' | 'DAP' | 'DDP';

export interface ContainerSpec {
  id: ContainerTypeId;
  name: string;
  internalLengthCm: number;
  internalWidthCm: number;
  internalHeightCm: number;
  maxVolumeCbm: number;
  maxPayloadKg: number;
  maxEuroPalletsSingleTier: number;
  freightBaseRateUsd: number;
}

export interface CargoSkuItem {
  id: string;
  skuCode: string;
  productName: string;
  hsCode: string;
  abcClass: 'A (Fast Mover)' | 'B (Regular)' | 'C (Slow Mover)';
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  cartonGrossWeightKg: number;
  unitsPerCarton: number;
  cartonQuantity: number;
  unitFobPriceUsd: number;
  customsDutyRatePct: number;
  annualDemandUnits: number;
  orderingCostUsd: number;
  holdingCostPct: number;
  leadTimeDays: number;
}

export interface LogisticsProject {
  shipmentCode: string;
  originPort: string;
  destinationPort: string;
  incoterm: IncotermRule;
  containerType: ContainerTypeId;
  oceanFreightUsd: number;
  marineInsuranceUsd: number;
  portHandlingThcUsd: number;
  inlandTruckingUsd: number;
  vatRatePct: number;
  serviceLevelZScore: number; // 1.65 (95%), 2.05 (98%), 2.33 (99%)
  skus: CargoSkuItem[];
  accentColor: string;
}

export interface SkuSupplyMetrics {
  sku: CargoSkuItem;
  totalCartonVolumeCbm: number;
  totalGrossWeightKg: number;
  totalUnits: number;
  totalFobValueUsd: number;
  allocatedFreightInsuranceUsd: number;
  cifValueUsd: number;
  customsDutyUsd: number;
  totalLandedCostUsd: number;
  unitLandedCostUsd: number;
  eoqUnits: number;
  safetyStockUnits: number;
  reorderPointUnits: number;
}

export interface ShipmentSummary {
  containerSpec: ContainerSpec;
  skuMetrics: SkuSupplyMetrics[];
  totalVolumeCbm: number;
  totalGrossWeightKg: number;
  totalCartons: number;
  totalPalletsEstimated: number;
  containersRequired: number;
  primaryContainerVolumeUtilPct: number;
  primaryContainerWeightUtilPct: number;
  limitingFactor: 'VOLUME (CBM)' | 'WEIGHT (PAYLOAD TONNAGE)';
  totalFobUsd: number;
  totalCifUsd: number;
  totalDutyUsd: number;
  totalLandedCostUsd: number;
  landedCostMultiplier: number;
}

export const CONTAINER_SPECS: ContainerSpec[] = [
  {
    id: '20ft_dry',
    name: "20' Standard Dry Container (TEU)",
    internalLengthCm: 589,
    internalWidthCm: 235,
    internalHeightCm: 239,
    maxVolumeCbm: 33.2,
    maxPayloadKg: 28200,
    maxEuroPalletsSingleTier: 11,
    freightBaseRateUsd: 2450,
  },
  {
    id: '40ft_dry',
    name: "40' Standard Dry Container (FEU)",
    internalLengthCm: 1203,
    internalWidthCm: 235,
    internalHeightCm: 239,
    maxVolumeCbm: 67.7,
    maxPayloadKg: 26600,
    maxEuroPalletsSingleTier: 25,
    freightBaseRateUsd: 3850,
  },
  {
    id: '40ft_hc',
    name: "40' High Cube Container (40' HC)",
    internalLengthCm: 1203,
    internalWidthCm: 235,
    internalHeightCm: 269,
    maxVolumeCbm: 76.4,
    maxPayloadKg: 26460,
    maxEuroPalletsSingleTier: 25,
    freightBaseRateUsd: 4100,
  },
  {
    id: 'eu_megatrailer',
    name: 'EU Road Mega Trailer (13.6m Tır)',
    internalLengthCm: 1360,
    internalWidthCm: 248,
    internalHeightCm: 295,
    maxVolumeCbm: 96.0,
    maxPayloadKg: 24000,
    maxEuroPalletsSingleTier: 33,
    freightBaseRateUsd: 3400,
  },
];

export function calculateShipmentAndSupply(
  project: LogisticsProject
): ShipmentSummary {
  const containerSpec =
    CONTAINER_SPECS.find((c) => c.id === project.containerType) ||
    CONTAINER_SPECS[2];

  // Effective usable stacking efficiency (~86% of raw internal volume due to pallet/carton gaps)
  const usableContainerCbm = containerSpec.maxVolumeCbm * 0.86;

  let totalVolumeCbm = 0;
  let totalGrossWeightKg = 0;
  let totalCartons = 0;
  let totalFobUsd = 0;

  for (const s of project.skus) {
    const cbmPerCarton =
      (s.cartonLengthCm * s.cartonWidthCm * s.cartonHeightCm) / 1_000_000;
    totalVolumeCbm += cbmPerCarton * s.cartonQuantity;
    totalGrossWeightKg += s.cartonGrossWeightKg * s.cartonQuantity;
    totalCartons += s.cartonQuantity;
    totalFobUsd += s.cartonQuantity * s.unitsPerCarton * s.unitFobPriceUsd;
  }

  const totalSharedLogisticsUsd =
    project.oceanFreightUsd +
    project.marineInsuranceUsd +
    project.portHandlingThcUsd +
    project.inlandTruckingUsd;

  const skuMetrics: SkuSupplyMetrics[] = project.skus.map((sku) => {
    const cbmPerCarton =
      (sku.cartonLengthCm * sku.cartonWidthCm * sku.cartonHeightCm) / 1_000_000;
    const totalCartonVolumeCbm = Number(
      (cbmPerCarton * sku.cartonQuantity).toFixed(2)
    );
    const skuWeightKg = Number(
      (sku.cartonGrossWeightKg * sku.cartonQuantity).toFixed(1)
    );
    const totalUnits = sku.cartonQuantity * sku.unitsPerCarton;
    const totalFobValueUsd = totalUnits * sku.unitFobPriceUsd;

    const volumeShare =
      totalVolumeCbm > 0 ? totalCartonVolumeCbm / totalVolumeCbm : 0;
    const allocatedFreightInsuranceUsd = totalSharedLogisticsUsd * volumeShare;

    const cifValueUsd =
      totalFobValueUsd +
      (project.oceanFreightUsd + project.marineInsuranceUsd) * volumeShare;

    const customsDutyUsd = cifValueUsd * (sku.customsDutyRatePct / 100);
    const totalLandedCostUsd =
      totalFobValueUsd + allocatedFreightInsuranceUsd + customsDutyUsd;
    const unitLandedCostUsd =
      totalUnits > 0 ? totalLandedCostUsd / totalUnits : 0;

    // Wilson EOQ Formula: sqrt((2 * D * S) / H)
    const unitHoldingCostAnnual =
      Math.max(0.5, unitLandedCostUsd) * (sku.holdingCostPct / 100);
    const eoqUnits = Math.round(
      Math.sqrt(
        (2 * sku.annualDemandUnits * sku.orderingCostUsd) /
          unitHoldingCostAnnual
      )
    );

    const avgDailyDemand = sku.annualDemandUnits / 365;
    const demandStdDevDaily = avgDailyDemand * 0.28;
    const safetyStockUnits = Math.round(
      project.serviceLevelZScore *
        demandStdDevDaily *
        Math.sqrt(Math.max(1, sku.leadTimeDays))
    );
    const reorderPointUnits = Math.round(
      avgDailyDemand * sku.leadTimeDays + safetyStockUnits
    );

    return {
      sku,
      totalCartonVolumeCbm,
      totalGrossWeightKg: skuWeightKg,
      totalUnits,
      totalFobValueUsd,
      allocatedFreightInsuranceUsd,
      cifValueUsd,
      customsDutyUsd,
      totalLandedCostUsd,
      unitLandedCostUsd,
      eoqUnits,
      safetyStockUnits,
      reorderPointUnits,
    };
  });

  const cbmRatio = totalVolumeCbm / usableContainerCbm;
  const weightRatio = totalGrossWeightKg / containerSpec.maxPayloadKg;
  const containersRequired = Math.max(1, Math.ceil(Math.max(cbmRatio, weightRatio)));

  const primaryContainerVolumeUtilPct = Math.min(
    100,
    Number(((totalVolumeCbm / (usableContainerCbm * containersRequired)) * 100).toFixed(1))
  );
  const primaryContainerWeightUtilPct = Math.min(
    100,
    Number(
      (
        (totalGrossWeightKg /
          (containerSpec.maxPayloadKg * containersRequired)) *
        100
      ).toFixed(1)
    )
  );

  const limitingFactor =
    cbmRatio >= weightRatio ? 'VOLUME (CBM)' : 'WEIGHT (PAYLOAD TONNAGE)';

  const totalPalletsEstimated = Math.max(1, Math.ceil(totalVolumeCbm / 1.44));
  const totalCifUsd = skuMetrics.reduce((a, b) => a + b.cifValueUsd, 0);
  const totalDutyUsd = skuMetrics.reduce((a, b) => a + b.customsDutyUsd, 0);
  const totalLandedCostUsd = skuMetrics.reduce(
    (a, b) => a + b.totalLandedCostUsd,
    0
  );

  return {
    containerSpec,
    skuMetrics,
    totalVolumeCbm: Number(totalVolumeCbm.toFixed(2)),
    totalGrossWeightKg: Number(totalGrossWeightKg.toFixed(1)),
    totalCartons,
    totalPalletsEstimated,
    containersRequired,
    primaryContainerVolumeUtilPct,
    primaryContainerWeightUtilPct,
    limitingFactor,
    totalFobUsd,
    totalCifUsd,
    totalDutyUsd,
    totalLandedCostUsd,
    landedCostMultiplier:
      totalFobUsd > 0 ? Number((totalLandedCostUsd / totalFobUsd).toFixed(3)) : 1,
  };
}

export const PRESET_LOGISTICS_PROJECTS: Record<string, LogisticsProject> = {
  shenzhen_istanbul_40hc: {
    shipmentCode: 'SHP-2026-CN-TR-804',
    originPort: 'CNSHA (Shanghai / Ningbo)',
    destinationPort: 'TRAMR (Ambarlı / İstanbul)',
    incoterm: 'CIF',
    containerType: '40ft_hc',
    oceanFreightUsd: 4150,
    marineInsuranceUsd: 380,
    portHandlingThcUsd: 690,
    inlandTruckingUsd: 540,
    vatRatePct: 20,
    serviceLevelZScore: 2.33,
    accentColor: '#f59e0b',
    skus: [
      {
        id: 'sku-1',
        skuCode: 'IND-SERVO-400W',
        productName: 'AC Brushless CNC Servo Motor & Driver Kit',
        hsCode: '8501.51.00',
        abcClass: 'A (Fast Mover)',
        cartonLengthCm: 60,
        cartonWidthCm: 40,
        cartonHeightCm: 35,
        cartonGrossWeightKg: 24.5,
        unitsPerCarton: 4,
        cartonQuantity: 320,
        unitFobPriceUsd: 68.0,
        customsDutyRatePct: 6.5,
        annualDemandUnits: 14500,
        orderingCostUsd: 420,
        holdingCostPct: 22,
        leadTimeDays: 32,
      },
      {
        id: 'sku-2',
        skuCode: 'LFP-RACK-48V',
        productName: 'LiFePO4 48V 100Ah Telecom Rack Battery Pack',
        hsCode: '8507.60.00',
        abcClass: 'A (Fast Mover)',
        cartonLengthCm: 58,
        cartonWidthCm: 50,
        cartonHeightCm: 28,
        cartonGrossWeightKg: 42.0,
        unitsPerCarton: 1,
        cartonQuantity: 210,
        unitFobPriceUsd: 410.0,
        customsDutyRatePct: 8.0,
        annualDemandUnits: 3200,
        orderingCostUsd: 650,
        holdingCostPct: 24,
        leadTimeDays: 38,
      },
      {
        id: 'sku-3',
        skuCode: 'IOT-GW-MODBUS',
        productName: 'Industrial DIN-Rail 5G Edge Modbus Gateway',
        hsCode: '8517.62.00',
        abcClass: 'B (Regular)',
        cartonLengthCm: 48,
        cartonWidthCm: 36,
        cartonHeightCm: 30,
        cartonGrossWeightKg: 11.2,
        unitsPerCarton: 20,
        cartonQuantity: 190,
        unitFobPriceUsd: 34.0,
        customsDutyRatePct: 4.2,
        annualDemandUnits: 28000,
        orderingCostUsd: 310,
        holdingCostPct: 20,
        leadTimeDays: 21,
      },
    ],
  },
  izmir_hamburg_road: {
    shipmentCode: 'SHP-2026-TR-DE-319',
    originPort: 'TRIZM (İzmir AOSB Fabrika)',
    destinationPort: 'DEHAM (Hamburg Fulfillment Center)',
    incoterm: 'DDP',
    containerType: 'eu_megatrailer',
    oceanFreightUsd: 3350,
    marineInsuranceUsd: 210,
    portHandlingThcUsd: 180,
    inlandTruckingUsd: 420,
    vatRatePct: 19,
    serviceLevelZScore: 2.05,
    accentColor: '#10b981',
    skus: [
      {
        id: 'eu-1',
        skuCode: 'ALU-EXT-PRO60',
        productName: 'Anodized Solar Mounting Aluminum Rail Kit',
        hsCode: '7610.90.90',
        abcClass: 'A (Fast Mover)',
        cartonLengthCm: 120,
        cartonWidthCm: 40,
        cartonHeightCm: 30,
        cartonGrossWeightKg: 31.0,
        unitsPerCarton: 10,
        cartonQuantity: 480,
        unitFobPriceUsd: 19.5,
        customsDutyRatePct: 0.0,
        annualDemandUnits: 64000,
        orderingCostUsd: 280,
        holdingCostPct: 18,
        leadTimeDays: 9,
      },
    ],
  },
};
