// ============================================================================
// CORPUS MANUFACTURING — OEE (Availability × Performance × Quality) & Six Sigma
// #046 PRO | Cp/Cpk Process Capability, DPMO, Takt vs Cycle Time & SMED ROI
// ============================================================================

export interface ProductionWorkcenter {
  id: string;
  lineCode: string;
  machineName: string;
  shiftMinutesPlanned: number;    // e.g. 480 min (8h shift)
  plannedBreakMinutes: number;    // e.g. 30 min
  unplannedDowntimeMinutes: number;// e.g. 42 min breakdown/changeover
  idealCycleTimeSec: number;      // e.g. 12.5 sec/unit
  totalUnitsProduced: number;     // e.g. 1720 units
  defectiveScrapUnits: number;    // e.g. 28 units
  hourlyMachineCostUsd: number;
  unitContributionMarginUsd: number;
  // SPC Six Sigma Tolerance Parameters (mm orbar/grams)
  nominalSpecTarget: number;
  lowerSpecLimitLsl: number;
  upperSpecLimitUsl: number;
  measuredMeanMu: number;
  measuredStdDevSigma: number;
}

export interface OeeProject {
  plantName: string;
  shiftLabel: string;
  customerDailyDemandUnits: number;
  shiftsPerDay: number;
  workcenters: ProductionWorkcenter[];
  accentColor: string;
}

export interface ComputedWorkcenterOee {
  wc: ProductionWorkcenter;
  plannedProductionTimeMin: number;
  runTimeMin: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;
  worldClassGapPct: number; // Benchmark vs 85% World-Class OEE
  goodUnits: number;
  actualCycleTimeSec: number;
  cpIndex: number;
  cpkIndex: number;
  dpmoEstimate: number;
  sigmaLevel: number;
  annualFinancialLossFromDowntimeAndScrapUsd: number;
}

export interface OeePlantSummary {
  computedLines: ComputedWorkcenterOee[];
  plantAvgOeePct: number;
  plantAvgAvailabilityPct: number;
  plantAvgPerformancePct: number;
  plantAvgQualityPct: number;
  taktTimeSec: number;
  bottleneckLineName: string;
  bottleneckCycleTimeSec: number;
  totalDailyGoodOutput: number;
  totalAnnualRecoverableLossUsd: number;
}

export function calculatePlantOeeAndSixSigma(
  project: OeeProject
): OeePlantSummary {
  const totalAvailableMinPerDay =
    project.shiftsPerDay *
    (project.workcenters[0]
      ? project.workcenters[0].shiftMinutesPlanned -
        project.workcenters[0].plannedBreakMinutes
      : 450);

  const taktTimeSec =
    project.customerDailyDemandUnits > 0
      ? Number(
          (
            (totalAvailableMinPerDay * 60) /
            project.customerDailyDemandUnits
          ).toFixed(2)
        )
      : 15;

  let bottleneckLineName = 'N/A';
  let bottleneckCycleTimeSec = 0;

  const computedLines: ComputedWorkcenterOee[] = project.workcenters.map(
    (wc) => {
      const plannedProductionTimeMin = Math.max(
        1,
        wc.shiftMinutesPlanned - wc.plannedBreakMinutes
      );
      const runTimeMin = Math.max(
        1,
        plannedProductionTimeMin - wc.unplannedDowntimeMinutes
      );

      const availabilityPct = Number(
        ((runTimeMin / plannedProductionTimeMin) * 100).toFixed(1)
      );

      const idealTotalTimeMin =
        (wc.totalUnitsProduced * wc.idealCycleTimeSec) / 60;
      const performancePct = Math.min(
        100,
        Number(((idealTotalTimeMin / runTimeMin) * 100).toFixed(1))
      );

      const goodUnits = Math.max(0, wc.totalUnitsProduced - wc.defectiveScrapUnits);
      const qualityPct =
        wc.totalUnitsProduced > 0
          ? Number(((goodUnits / wc.totalUnitsProduced) * 100).toFixed(2))
          : 100;

      const oeePct = Number(
        (
          (availabilityPct / 100) *
          (performancePct / 100) *
          (qualityPct / 100) *
          100
        ).toFixed(1)
      );

      const worldClassGapPct = Number((85.0 - oeePct).toFixed(1));
      const actualCycleTimeSec =
        wc.totalUnitsProduced > 0
          ? Number(((runTimeMin * 60) / wc.totalUnitsProduced).toFixed(2))
          : wc.idealCycleTimeSec;

      if (actualCycleTimeSec > bottleneckCycleTimeSec) {
        bottleneckCycleTimeSec = actualCycleTimeSec;
        bottleneckLineName = `${wc.lineCode} (${wc.machineName})`;
      }

      // Six Sigma Process Capability: Cp & Cpk
      const sixSigmaSpread = Math.max(0.0001, 6 * wc.measuredStdDevSigma);
      const cpIndex = Number(
        ((wc.upperSpecLimitUsl - wc.lowerSpecLimitLsl) / sixSigmaSpread).toFixed(2)
      );

      const cpu =
        (wc.upperSpecLimitUsl - wc.measuredMeanMu) /
        Math.max(0.0001, 3 * wc.measuredStdDevSigma);
      const cpl =
        (wc.measuredMeanMu - wc.lowerSpecLimitLsl) /
        Math.max(0.0001, 3 * wc.measuredStdDevSigma);
      const cpkIndex = Number(Math.max(0, Math.min(cpu, cpl)).toFixed(2));

      const sigmaLevel = Number(Math.min(6.0, cpkIndex * 3 + 1.5).toFixed(2));
      const dpmoEstimate =
        cpkIndex >= 1.67
          ? 3.4
          : cpkIndex >= 1.33
          ? 63
          : cpkIndex >= 1.0
          ? 2700
          : cpkIndex >= 0.67
          ? 45500
          : 158000;

      // Annual Financial Loss (300 working days * shiftsPerDay)
      const shiftsPerYear = 300 * project.shiftsPerDay;
      const downtimeLossPerShiftUsd =
        (wc.unplannedDowntimeMinutes / 60) * wc.hourlyMachineCostUsd;
      const scrapLossPerShiftUsd =
        wc.defectiveScrapUnits * wc.unitContributionMarginUsd;
      const annualFinancialLossFromDowntimeAndScrapUsd = Math.round(
        (downtimeLossPerShiftUsd + scrapLossPerShiftUsd) * shiftsPerYear
      );

      return {
        wc,
        plannedProductionTimeMin,
        runTimeMin,
        availabilityPct,
        performancePct,
        qualityPct,
        oeePct,
        worldClassGapPct,
        goodUnits,
        actualCycleTimeSec,
        cpIndex,
        cpkIndex,
        dpmoEstimate,
        sigmaLevel,
        annualFinancialLossFromDowntimeAndScrapUsd,
      };
    }
  );

  const count = computedLines.length || 1;
  const plantAvgAvailabilityPct = Number(
    (
      computedLines.reduce((a, b) => a + b.availabilityPct, 0) / count
    ).toFixed(1)
  );
  const plantAvgPerformancePct = Number(
    (
      computedLines.reduce((a, b) => a + b.performancePct, 0) / count
    ).toFixed(1)
  );
  const plantAvgQualityPct = Number(
    (computedLines.reduce((a, b) => a + b.qualityPct, 0) / count).toFixed(1)
  );
  const plantAvgOeePct = Number(
    (computedLines.reduce((a, b) => a + b.oeePct, 0) / count).toFixed(1)
  );

  const totalDailyGoodOutput =
    computedLines.reduce((a, b) => a + b.goodUnits, 0) * project.shiftsPerDay;

  const totalAnnualRecoverableLossUsd = computedLines.reduce(
    (a, b) => a + b.annualFinancialLossFromDowntimeAndScrapUsd,
    0
  );

  return {
    computedLines,
    plantAvgOeePct,
    plantAvgAvailabilityPct,
    plantAvgPerformancePct,
    plantAvgQualityPct,
    taktTimeSec,
    bottleneckLineName,
    bottleneckCycleTimeSec,
    totalDailyGoodOutput,
    totalAnnualRecoverableLossUsd,
  };
}

export const PRESET_OEE_PROJECT: OeeProject = {
  plantName: 'Bursa Otomotiv Şasi & CNC İşleme Fabrikası (Endüstri 4.0)',
  shiftLabel: 'Vardiya A (08:00 - 16:00) • 3 Vardiya Rejimi',
  customerDailyDemandUnits: 4800,
  shiftsPerDay: 3,
  accentColor: '#10b981',
  workcenters: [
    {
      id: 'wc-1',
      lineCode: 'LINE-CNC-01',
      machineName: '5-Axis Mazak Integrex CNC Machining Cell',
      shiftMinutesPlanned: 480,
      plannedBreakMinutes: 30,
      unplannedDowntimeMinutes: 38,
      idealCycleTimeSec: 14.0,
      totalUnitsProduced: 1680,
      defectiveScrapUnits: 24,
      hourlyMachineCostUsd: 240,
      unitContributionMarginUsd: 18.5,
      nominalSpecTarget: 50.0,
      lowerSpecLimitLsl: 49.85,
      upperSpecLimitUsl: 50.15,
      measuredMeanMu: 50.02,
      measuredStdDevSigma: 0.036,
    },
    {
      id: 'wc-2',
      lineCode: 'LINE-WELD-02',
      machineName: 'KUKA Robotic Laser Welding & Vision Station',
      shiftMinutesPlanned: 480,
      plannedBreakMinutes: 30,
      unplannedDowntimeMinutes: 22,
      idealCycleTimeSec: 12.5,
      totalUnitsProduced: 1920,
      defectiveScrapUnits: 12,
      hourlyMachineCostUsd: 310,
      unitContributionMarginUsd: 22.0,
      nominalSpecTarget: 2.5,
      lowerSpecLimitLsl: 2.35,
      upperSpecLimitUsl: 2.65,
      measuredMeanMu: 2.505,
      measuredStdDevSigma: 0.031,
    },
    {
      id: 'wc-3',
      lineCode: 'LINE-PRESS-03',
      machineName: '1200-Ton Schuler Servo Stamping Press (SMED Target)',
      shiftMinutesPlanned: 480,
      plannedBreakMinutes: 30,
      unplannedDowntimeMinutes: 64,
      idealCycleTimeSec: 15.5,
      totalUnitsProduced: 1410,
      defectiveScrapUnits: 45,
      hourlyMachineCostUsd: 420,
      unitContributionMarginUsd: 26.0,
      nominalSpecTarget: 10.0,
      lowerSpecLimitLsl: 9.8,
      upperSpecLimitUsl: 10.2,
      measuredMeanMu: 10.05,
      measuredStdDevSigma: 0.052,
    },
  ],
};
