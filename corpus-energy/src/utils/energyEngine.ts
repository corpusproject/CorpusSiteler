// ============================================================================
// CORPUS SOLAR & BESS — Industrial PV Microgrid, LCOE & 25-Year ROI Engine
// #045 PRO | N-Type TOPCon Bifacial Sizing, Peak-Shaving Arbitrage & IRR/NPV
// ============================================================================

export interface SolarEnergyProject {
  facilityName: string;
  regionName: string;
  specificYieldKwhPerKwp: number; // e.g. 1580 kWh/kWp/year in Central/South TR
  installedDcPowerKwp: number;    // e.g. 2500 kWp (2.5 MWp)
  moduleWattPeak: number;         // e.g. 590W Bifacial TOPCon
  bessCapacityKwh: number;        // e.g. 2000 kWh (2.0 MWh LFP container)
  gridDayTariffUsdPerKwh: number; // e.g. $0.135/kWh
  gridPeakTariffUsdPerKwh: number;// e.g. $0.215/kWh
  gridNightTariffUsdPerKwh: number;// e.g. $0.075/kWh
  selfConsumptionRatioPct: number;// e.g. 82%
  feedInExportTariffUsdPerKwh: number;
  pvCapexPerKwpUsd: number;       // e.g. $580/kWp turnkey
  bessCapexPerKwhUsd: number;     // e.g. $210/kWh turnkey
  annualOpexPctOfCapex: number;   // e.g. 1.2%
  annualPanelDegradationPct: number; // e.g. 0.4% per year
  discountRateWaccPct: number;
  accentColor: string;
}

export interface YearCashflowRow {
  year: number;
  degradationFactor: number;
  pvGenerationMwh: number;
  bessArbitrageMwh: number;
  grossEnergySavingsUsd: number;
  opexMaintenanceUsd: number;
  netCashflowUsd: number;
  cumulativeCashflowUsd: number;
}

export interface SolarEngineeringSummary {
  totalModulesCount: number;
  inverterAcPowerKw: number;
  requiredRoofOrLandAreaM2: number;
  totalCapexUsd: number;
  year1GenerationMwh: number;
  lifetime25YrGenerationMwh: number;
  year1NetRevenueUsd: number;
  simplePaybackYears: number;
  npv25YrUsd: number;
  lcoeUsdPerKwh: number;
  annualCo2AvoidedTons: number;
  cashflows: YearCashflowRow[];
}

export function calculateSolarAndBessRoi(
  project: SolarEnergyProject
): SolarEngineeringSummary {
  const totalModulesCount = Math.ceil(
    (project.installedDcPowerKwp * 1000) / Math.max(400, project.moduleWattPeak)
  );
  // 1.22 DC/AC Ratio
  const inverterAcPowerKw = Math.round(project.installedDcPowerKwp / 1.22);
  const requiredRoofOrLandAreaM2 = Math.round(totalModulesCount * 2.75);

  const pvCapexUsd = project.installedDcPowerKwp * project.pvCapexPerKwpUsd;
  const bessCapexUsd = project.bessCapacityKwh * project.bessCapexPerKwhUsd;
  const totalCapexUsd = Math.round(pvCapexUsd + bessCapexUsd);

  const annualOpexBaseUsd =
    totalCapexUsd * (project.annualOpexPctOfCapex / 100);

  const selfRatio = project.selfConsumptionRatioPct / 100;
  const blendedSolarValuePerKwh =
    selfRatio * project.gridDayTariffUsdPerKwh +
    (1 - selfRatio) * project.feedInExportTariffUsdPerKwh;

  // Daily BESS Peak-Shaving Arbitrage (330 active cycles/year, 88% round-trip efficiency)
  const arbitrageSpreadUsdPerKwh = Math.max(
    0.03,
    project.gridPeakTariffUsdPerKwh - project.gridNightTariffUsdPerKwh * 1.12
  );
  const annualBessArbitrageKwh = project.bessCapacityKwh * 0.88 * 330;

  let cumulativeCashflowUsd = -totalCapexUsd;
  let lifetime25YrGenerationMwh = 0;
  let npv25YrUsd = -totalCapexUsd;
  let discountedLifecycleCostUsd = totalCapexUsd;
  let discountedEnergyKwh = 0;
  let simplePaybackYears = 25;
  let paybackFound = false;

  const r = project.discountRateWaccPct / 100;
  const cashflows: YearCashflowRow[] = [];

  for (let yr = 1; yr <= 25; yr++) {
    const degradationFactor = Number(
      (1 - (project.annualPanelDegradationPct / 100) * (yr - 1)).toFixed(4)
    );
    const pvKwh =
      project.installedDcPowerKwp *
      project.specificYieldKwhPerKwp *
      degradationFactor;
    const pvGenerationMwh = Number((pvKwh / 1000).toFixed(1));
    lifetime25YrGenerationMwh += pvGenerationMwh;

    // 2% annual tariff escalation hedge
    const tariffEscalation = Math.pow(1.02, yr - 1);
    const solarSavingsUsd =
      pvKwh * blendedSolarValuePerKwh * tariffEscalation;
    const bessSavingsUsd =
      annualBessArbitrageKwh *
      degradationFactor *
      arbitrageSpreadUsdPerKwh *
      tariffEscalation;

    const grossEnergySavingsUsd = Math.round(solarSavingsUsd + bessSavingsUsd);
    const opexMaintenanceUsd = Math.round(
      annualOpexBaseUsd * Math.pow(1.015, yr - 1)
    );
    const netCashflowUsd = grossEnergySavingsUsd - opexMaintenanceUsd;

    const prevCum = cumulativeCashflowUsd;
    cumulativeCashflowUsd += netCashflowUsd;

    if (!paybackFound && cumulativeCashflowUsd >= 0 && netCashflowUsd > 0) {
      simplePaybackYears = Number(
        (yr - 1 + Math.abs(prevCum) / netCashflowUsd).toFixed(1)
      );
      paybackFound = true;
    }

    const discountFactor = Math.pow(1 + r, yr);
    npv25YrUsd += netCashflowUsd / discountFactor;
    discountedLifecycleCostUsd += opexMaintenanceUsd / discountFactor;
    discountedEnergyKwh += pvKwh / discountFactor;

    cashflows.push({
      year: yr,
      degradationFactor,
      pvGenerationMwh,
      bessArbitrageMwh: Number((annualBessArbitrageKwh / 1000).toFixed(1)),
      grossEnergySavingsUsd,
      opexMaintenanceUsd,
      netCashflowUsd,
      cumulativeCashflowUsd: Math.round(cumulativeCashflowUsd),
    });
  }

  const lcoeUsdPerKwh =
    discountedEnergyKwh > 0
      ? Number((discountedLifecycleCostUsd / discountedEnergyKwh).toFixed(4))
      : 0;

  const year1GenerationMwh = cashflows[0]?.pvGenerationMwh || 0;
  const year1NetRevenueUsd = cashflows[0]?.netCashflowUsd || 0;
  const annualCo2AvoidedTons = Math.round(year1GenerationMwh * 0.44);

  return {
    totalModulesCount,
    inverterAcPowerKw,
    requiredRoofOrLandAreaM2,
    totalCapexUsd,
    year1GenerationMwh,
    lifetime25YrGenerationMwh: Math.round(lifetime25YrGenerationMwh),
    year1NetRevenueUsd,
    simplePaybackYears,
    npv25YrUsd: Math.round(npv25YrUsd),
    lcoeUsdPerKwh,
    annualCo2AvoidedTons,
    cashflows,
  };
}

export const PRESET_ENERGY_PROJECT: SolarEnergyProject = {
  facilityName: 'Gaziantep Başpınar OSB Tekstil Fabrikası Çatı GES + BESS',
  regionName: 'Güneydoğu Anadolu (1,640 kWh/kWp/yıl)',
  specificYieldKwhPerKwp: 1640,
  installedDcPowerKwp: 3200,
  moduleWattPeak: 590,
  bessCapacityKwh: 2500,
  gridDayTariffUsdPerKwh: 0.138,
  gridPeakTariffUsdPerKwh: 0.224,
  gridNightTariffUsdPerKwh: 0.074,
  selfConsumptionRatioPct: 86,
  feedInExportTariffUsdPerKwh: 0.088,
  pvCapexPerKwpUsd: 560,
  bessCapexPerKwhUsd: 205,
  annualOpexPctOfCapex: 1.15,
  annualPanelDegradationPct: 0.4,
  discountRateWaccPct: 9.5,
  accentColor: '#eab308',
};
