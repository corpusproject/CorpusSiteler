// ============================================================================
// CORPUS ESG & CARBON — Scope 1-2-3 GHG Protocol & EU CBAM Tax Engine
// #041 PRO | ISO 14064-1, DEFRA/IPCC Factors, CBAM Certificate & Net-Zero ROI
// ============================================================================

export type EmissionScope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';

export interface EmissionActivityItem {
  id: string;
  scope: EmissionScope;
  category: string;
  sourceName: string;
  unit: string;
  annualConsumption: number;
  emissionFactorKgCo2ePerUnit: number; // kg CO2e per unit
  abatablePctWithInvestment: number;
  abatementCapexEur: number;
}

export interface CarbonProject {
  organizationName: string;
  facilityLocation: string;
  reportingYear: number;
  cbamSector: 'Iron & Steel' | 'Aluminum' | 'Cement' | 'Fertilizers' | 'Electricity & SaaS';
  annualProductionTons: number;
  euExportSharePct: number;
  euEtsCarbonPriceEurPerTon: number;
  domesticCarbonTaxCreditEurPerTon: number;
  irecRenewableSharePct: number;
  activities: EmissionActivityItem[];
  accentColor: string;
}

export interface ComputedActivityEmission {
  item: EmissionActivityItem;
  grossTonsCo2e: number;
  netTonsCo2eAfterIrec: number;
  potentialAbatedTonsCo2e: number;
  annualCarbonTaxSavedEur: number;
  paybackYears: number;
}

export interface CarbonSummary {
  computedActivities: ComputedActivityEmission[];
  scope1Tons: number;
  scope2LocationBasedTons: number;
  scope2MarketBasedTons: number;
  scope3Tons: number;
  totalGrossTonsCo2e: number;
  totalNetTonsCo2e: number;
  emissionIntensityPerTonProduct: number;
  euExportEmbeddedTonsCo2e: number;
  netCbamLiabilityEur: number;
  totalAbatementPotentialTons: number;
  postAbatementResidualTons: number;
  esgRatingGrade: string;
}

export function calculateCarbonAndCbam(project: CarbonProject): CarbonSummary {
  let scope1Tons = 0;
  let scope2LocationBasedTons = 0;
  let scope2MarketBasedTons = 0;
  let scope3Tons = 0;
  let totalAbatementPotentialTons = 0;

  const netCbamRateEur = Math.max(
    0,
    project.euEtsCarbonPriceEurPerTon - project.domesticCarbonTaxCreditEurPerTon
  );

  const computedActivities: ComputedActivityEmission[] = project.activities.map(
    (item) => {
      const grossTonsCo2e = Number(
        (
          (item.annualConsumption * item.emissionFactorKgCo2ePerUnit) /
          1000
        ).toFixed(2)
      );

      // Apply I-REC / Green PPA deduction to Scope 2 electricity
      const irecMultiplier =
        item.scope === 'SCOPE_2'
          ? 1 - Math.min(100, Math.max(0, project.irecRenewableSharePct)) / 100
          : 1.0;

      const netTonsCo2eAfterIrec = Number(
        (grossTonsCo2e * irecMultiplier).toFixed(2)
      );

      if (item.scope === 'SCOPE_1') {
        scope1Tons += netTonsCo2eAfterIrec;
      } else if (item.scope === 'SCOPE_2') {
        scope2LocationBasedTons += grossTonsCo2e;
        scope2MarketBasedTons += netTonsCo2eAfterIrec;
      } else {
        scope3Tons += netTonsCo2eAfterIrec;
      }

      const potentialAbatedTonsCo2e = Number(
        (
          netTonsCo2eAfterIrec *
          (item.abatablePctWithInvestment / 100)
        ).toFixed(2)
      );
      totalAbatementPotentialTons += potentialAbatedTonsCo2e;

      const annualCarbonTaxSavedEur = Math.round(
        potentialAbatedTonsCo2e * netCbamRateEur
      );
      const paybackYears =
        annualCarbonTaxSavedEur > 0
          ? Number((item.abatementCapexEur / annualCarbonTaxSavedEur).toFixed(1))
          : 0;

      return {
        item,
        grossTonsCo2e,
        netTonsCo2eAfterIrec,
        potentialAbatedTonsCo2e,
        annualCarbonTaxSavedEur,
        paybackYears,
      };
    }
  );

  const totalGrossTonsCo2e = Number(
    (scope1Tons + scope2LocationBasedTons + scope3Tons).toFixed(1)
  );
  const totalNetTonsCo2e = Number(
    (scope1Tons + scope2MarketBasedTons + scope3Tons).toFixed(1)
  );

  const emissionIntensityPerTonProduct =
    project.annualProductionTons > 0
      ? Number((totalNetTonsCo2e / project.annualProductionTons).toFixed(3))
      : 0;

  const euExportEmbeddedTonsCo2e = Number(
    (totalNetTonsCo2e * (project.euExportSharePct / 100)).toFixed(1)
  );

  const netCbamLiabilityEur = Math.round(
    euExportEmbeddedTonsCo2e * netCbamRateEur
  );

  const postAbatementResidualTons = Number(
    Math.max(0, totalNetTonsCo2e - totalAbatementPotentialTons).toFixed(1)
  );

  const esgRatingGrade =
    emissionIntensityPerTonProduct < 0.8
      ? 'AA (EU TAXONOMY LEADER)'
      : emissionIntensityPerTonProduct < 1.6
      ? 'A (CBAM COMPLIANT)'
      : emissionIntensityPerTonProduct < 2.5
      ? 'BBB (TRANSITION PATH)'
      : 'B (HIGH CBAM TAX EXPOSURE)';

  return {
    computedActivities,
    scope1Tons: Number(scope1Tons.toFixed(1)),
    scope2LocationBasedTons: Number(scope2LocationBasedTons.toFixed(1)),
    scope2MarketBasedTons: Number(scope2MarketBasedTons.toFixed(1)),
    scope3Tons: Number(scope3Tons.toFixed(1)),
    totalGrossTonsCo2e,
    totalNetTonsCo2e,
    emissionIntensityPerTonProduct,
    euExportEmbeddedTonsCo2e,
    netCbamLiabilityEur,
    totalAbatementPotentialTons: Number(totalAbatementPotentialTons.toFixed(1)),
    postAbatementResidualTons,
    esgRatingGrade,
  };
}

export function generateCsrdMarkdownReport(
  project: CarbonProject,
  summary: CarbonSummary
): string {
  return `# OFFICIAL ISO 14064-1 GHG INVENTORY & EU CBAM COMPLIANCE REPORT
**Organization:** ${project.organizationName} (${project.facilityLocation})  
**Reporting Period:** FY ${project.reportingYear} | **CBAM Sector:** ${project.cbamSector}  
**ESG / Taxonomy Rating:** **${summary.esgRatingGrade}**

---

## 1. EXECUTIVE GHG EMISSIONS BALANCE (SCOPE 1, 2 & 3)
- **Scope 1 (Direct Combustion & Fleet):** ${summary.scope1Tons.toLocaleString()} $\\text{tCO}_2\\text{e}$
- **Scope 2 (Location-Based Grid Electricity):** ${summary.scope2LocationBasedTons.toLocaleString()} $\\text{tCO}_2\\text{e}$
- **Scope 2 (Market-Based after ${project.irecRenewableSharePct}% I-REC / Rooftop Solar):** ${summary.scope2MarketBasedTons.toLocaleString()} $\\text{tCO}_2\\text{e}$
- **Scope 3 (Upstream Raw Materials & Global Freight):** ${summary.scope3Tons.toLocaleString()} $\\text{tCO}_2\\text{e}$
- **Total Net Corporate Footprint:** **${summary.totalNetTonsCo2e.toLocaleString()} $\\text{tCO}_2\\text{e}$**
- **Specific Product Carbon Intensity:** **${summary.emissionIntensityPerTonProduct} $\\text{tCO}_2\\text{e}$ / ton output**

---

## 2. EU CBAM (CARBON BORDER ADJUSTMENT MECHANISM) EXPOSURE
- **Annual Production Volume:** ${project.annualProductionTons.toLocaleString()} Metric Tons
- **EU-27 Export Allocation:** ${project.euExportSharePct}% (${summary.euExportEmbeddedTonsCo2e.toLocaleString()} $\\text{tCO}_2\\text{e}$ embedded)
- **EU ETS Certificate Price:** €${project.euEtsCarbonPriceEurPerTon} / $\\text{tCO}_2\\text{e}$
- **Net Annual CBAM Certificate Liability:** **€${summary.netCbamLiabilityEur.toLocaleString()} / year**

---

## 3. DECARBONIZATION & ABATEMENT CAPEX ROADMAP
| Scope | Activity Source | Consumption | Net $\\text{tCO}_2\\text{e}$ | Abatement Potential | CapEx (€) |
| :--- | :--- | :--- | :--- | :--- | :--- |
${summary.computedActivities
  .map(
    (c) =>
      `| \`${c.item.scope}\` | **${c.item.sourceName}** | ${c.item.annualConsumption.toLocaleString()} ${c.item.unit} | ${c.netTonsCo2eAfterIrec} t | -${c.potentialAbatedTonsCo2e} t (${c.item.abatablePctWithInvestment}%) | €${c.item.abatementCapexEur.toLocaleString()} |`
  )
  .join('\n')}
`;
}

export const PRESET_CARBON_PROJECT: CarbonProject = {
  organizationName: 'Anadolu Precision Aluminum & Extrusion A.Ş.',
  facilityLocation: 'Kocaeli Gebze OSB — Integrated Foundry & Rolling Mill',
  reportingYear: 2026,
  cbamSector: 'Aluminum',
  annualProductionTons: 12500,
  euExportSharePct: 68,
  euEtsCarbonPriceEurPerTon: 88,
  domesticCarbonTaxCreditEurPerTon: 12,
  irecRenewableSharePct: 35,
  accentColor: '#10b981',
  activities: [
    {
      id: 'em-1',
      scope: 'SCOPE_1',
      category: 'Stationary Combustion',
      sourceName: 'Natural Gas Billet Melting Furnaces (BOTAŞ Pipeline)',
      unit: 'm3',
      annualConsumption: 2450000,
      emissionFactorKgCo2ePerUnit: 2.02,
      abatablePctWithInvestment: 38,
      abatementCapexEur: 420000,
    },
    {
      id: 'em-2',
      scope: 'SCOPE_1',
      category: 'Mobile Fleet & Forklifts',
      sourceName: 'Plant Diesel Logistics & Heavy Forklift Fleet',
      unit: 'Liters',
      annualConsumption: 185000,
      emissionFactorKgCo2ePerUnit: 2.68,
      abatablePctWithInvestment: 85,
      abatementCapexEur: 190000,
    },
    {
      id: 'em-3',
      scope: 'SCOPE_2',
      category: 'Purchased Grid Electricity',
      sourceName: 'TEİAŞ National Grid High-Voltage Extrusion Presses',
      unit: 'kWh',
      annualConsumption: 18400000,
      emissionFactorKgCo2ePerUnit: 0.44,
      abatablePctWithInvestment: 75,
      abatementCapexEur: 950000,
    },
    {
      id: 'em-4',
      scope: 'SCOPE_3',
      category: 'Purchased Goods (Cat. 1)',
      sourceName: 'Primary Aluminum Ingot Feedstock (Non-Recycled)',
      unit: 'Metric Tons',
      annualConsumption: 4200,
      emissionFactorKgCo2ePerUnit: 1650.0,
      abatablePctWithInvestment: 55,
      abatementCapexEur: 310000,
    },
    {
      id: 'em-5',
      scope: 'SCOPE_3',
      category: 'Downstream Transport (Cat. 9)',
      sourceName: 'Container & Ro-Ro Freight to Trieste / Hamburg Ports',
      unit: 'ton-km',
      annualConsumption: 14800000,
      emissionFactorKgCo2ePerUnit: 0.042,
      abatablePctWithInvestment: 30,
      abatementCapexEur: 65000,
    },
  ],
};
