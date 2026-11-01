// ============================================================================
// CORPUS PATENT & IP — ISO 10668 Relief-from-Royalty NPV & FTO Claim Engine
// #044 PRO | Patent Portfolio Valuation, Prior-Art Overlap & Licensing Studio
// ============================================================================

export type PatentJurisdiction = 'USPTO (US)' | 'EPO (EU)' | 'TÜRKPATENT (TR)' | 'WIPO (PCT)';

export interface PatentAssetItem {
  id: string;
  patentNumber: string;
  title: string;
  jurisdiction: PatentJurisdiction;
  ipcClass: string;
  remainingLifeYears: number;
  attributableAnnualRevenueUsd: number;
  annualRevenueGrowthPct: number;
  fairRoyaltyRatePct: number;
  priorArtOverlapRiskPct: number;
  annualMaintenanceFeeUsd: number;
}

export interface PatentProject {
  portfolioName: string;
  ownerEntity: string;
  waccDiscountRatePct: number;
  corporateTaxRatePct: number;
  rdReplacementCostUsd: number;
  patents: PatentAssetItem[];
  accentColor: string;
}

export interface PatentValuationResult {
  asset: PatentAssetItem;
  grossRoyaltyStreamTotalUsd: number;
  discountedNpvUsd: number;
  riskAdjustedFairValueUsd: number;
  ftoClearanceStatus: 'CLEAR (LOW RISK)' | 'CAUTION (DESIGN AROUND)' | 'HIGH LITIGATION RISK';
}

export interface PatentPortfolioSummary {
  results: PatentValuationResult[];
  totalPortfolioFairValueUsd: number;
  totalAnnualRoyaltyYear1Usd: number;
  avgRemainingLifeYears: number;
  costToIncomeMultiple: number;
}

export function calculatePatentPortfolioValuation(
  project: PatentProject
): PatentPortfolioSummary {
  const r = project.waccDiscountRatePct / 100;
  const taxRate = project.corporateTaxRatePct / 100;

  let totalPortfolioFairValueUsd = 0;
  let totalAnnualRoyaltyYear1Usd = 0;
  let lifeSum = 0;

  const results: PatentValuationResult[] = project.patents.map((asset) => {
    lifeSum += asset.remainingLifeYears;
    const g = asset.annualRevenueGrowthPct / 100;
    const royaltyRate = asset.fairRoyaltyRatePct / 100;

    let grossRoyaltyStreamTotalUsd = 0;
    let discountedNpvUsd = 0;

    const year1Royalty = asset.attributableAnnualRevenueUsd * royaltyRate;
    totalAnnualRoyaltyYear1Usd += year1Royalty;

    for (let yr = 1; yr <= asset.remainingLifeYears; yr++) {
      const projectedRev =
        asset.attributableAnnualRevenueUsd * Math.pow(1 + g, yr - 1);
      const grossRoyalty = projectedRev * royaltyRate;
      const netAfterTaxAndMaint =
        (grossRoyalty - asset.annualMaintenanceFeeUsd) * (1 - taxRate);

      grossRoyaltyStreamTotalUsd += grossRoyalty;
      discountedNpvUsd += netAfterTaxAndMaint / Math.pow(1 + r, yr);
    }

    // Apply FTO / Prior-Art Validity Discount
    const validityFactor =
      1 - Math.min(80, Math.max(0, asset.priorArtOverlapRiskPct)) / 100;
    const riskAdjustedFairValueUsd = Math.round(
      discountedNpvUsd * validityFactor
    );

    totalPortfolioFairValueUsd += riskAdjustedFairValueUsd;

    const ftoClearanceStatus =
      asset.priorArtOverlapRiskPct <= 15
        ? 'CLEAR (LOW RISK)'
        : asset.priorArtOverlapRiskPct <= 35
        ? 'CAUTION (DESIGN AROUND)'
        : 'HIGH LITIGATION RISK';

    return {
      asset,
      grossRoyaltyStreamTotalUsd: Math.round(grossRoyaltyStreamTotalUsd),
      discountedNpvUsd: Math.round(discountedNpvUsd),
      riskAdjustedFairValueUsd,
      ftoClearanceStatus,
    };
  });

  const avgRemainingLifeYears =
    project.patents.length > 0
      ? Number((lifeSum / project.patents.length).toFixed(1))
      : 0;

  const costToIncomeMultiple =
    project.rdReplacementCostUsd > 0
      ? Number(
          (totalPortfolioFairValueUsd / project.rdReplacementCostUsd).toFixed(2)
        )
      : 1;

  return {
    results,
    totalPortfolioFairValueUsd,
    totalAnnualRoyaltyYear1Usd: Math.round(totalAnnualRoyaltyYear1Usd),
    avgRemainingLifeYears,
    costToIncomeMultiple,
  };
}

export function generateIpLicenseAgreement(
  project: PatentProject,
  summary: PatentPortfolioSummary
): string {
  return `# ISO 10668 INTELLECTUAL PROPERTY VALUATION & ROYALTY LICENSE SCHEDULE
**Licensor / Owner:** ${project.ownerEntity}  
**IP Portfolio:** ${project.portfolioName}  
**Valuation Standard:** ISO 10668 Relief-from-Royalty Discounted Cash Flow (WACC: ${project.waccDiscountRatePct}%)  
**Risk-Adjusted Portfolio Fair Market Value:** **$${summary.totalPortfolioFairValueUsd.toLocaleString()} USD**

---

## 1. SCHEDULE OF LICENSED PATENTS & ROYALTY RATES
| Patent No | Jurisdiction | IPC Class | Remaining Life | Royalty Rate | Risk-Adjusted NPV ($) | FTO Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${summary.results
  .map(
    (r) =>
      `| \`${r.asset.patentNumber}\` | ${r.asset.jurisdiction} | \`${r.asset.ipcClass}\` | ${r.asset.remainingLifeYears} yrs | **${r.asset.fairRoyaltyRatePct}%** | **$${r.riskAdjustedFairValueUsd.toLocaleString()}** | ${r.ftoClearanceStatus} |`
  )
  .join('\n')}

---

## 2. COMMERCIAL ROYALTY & AUDIT CLAUSES
1. **Running Royalty Grant:** Licensee shall pay Licensor a quarterly running royalty calculated as the applicable **Fair Royalty Rate (%)** multiplied by Net Licensed Product Sales.
2. **Minimum Annual Guarantee:** Year-1 baseline royalty pool is projected at **$${summary.totalAnnualRoyaltyYear1Usd.toLocaleString()} USD/year**.
3. **R&D Replacement Value:** Historical R&D replacement cost of **$${project.rdReplacementCostUsd.toLocaleString()}** yields an IP value creation multiple of **${summary.costToIncomeMultiple}x**.
`;
}

export const PRESET_PATENT_PROJECT: PatentProject = {
  portfolioName: 'Solid-State LFP Cathode & Autonomous BMS Patent Family',
  ownerEntity: 'Corpus DeepTech R&D Labs Inc.',
  waccDiscountRatePct: 11.5,
  corporateTaxRatePct: 20.0,
  rdReplacementCostUsd: 4200000,
  accentColor: '#6366f1',
  patents: [
    {
      id: 'pat-1',
      patentNumber: 'US-11,948,201-B2',
      title: 'Silicon-Doped Nanostructured LFP Cathode Sintering Method',
      jurisdiction: 'USPTO (US)',
      ipcClass: 'H01M 4/58',
      remainingLifeYears: 15,
      attributableAnnualRevenueUsd: 28000000,
      annualRevenueGrowthPct: 14,
      fairRoyaltyRatePct: 5.5,
      priorArtOverlapRiskPct: 10,
      annualMaintenanceFeeUsd: 4500,
    },
    {
      id: 'pat-2',
      patentNumber: 'EP-4,109,882-B1',
      title: 'Predictive Thermal Runaway Impedance Spectroscopy BMS Algorithm',
      jurisdiction: 'EPO (EU)',
      ipcClass: 'G01R 31/392',
      remainingLifeYears: 16,
      attributableAnnualRevenueUsd: 19500000,
      annualRevenueGrowthPct: 18,
      fairRoyaltyRatePct: 6.8,
      priorArtOverlapRiskPct: 12,
      annualMaintenanceFeeUsd: 6200,
    },
    {
      id: 'pat-3',
      patentNumber: 'TR-2025/04918-B',
      title: 'Bi-Directional High-Frequency SiC Inverter Switching Topology',
      jurisdiction: 'TÜRKPATENT (TR)',
      ipcClass: 'H02M 7/5387',
      remainingLifeYears: 14,
      attributableAnnualRevenueUsd: 9200000,
      annualRevenueGrowthPct: 12,
      fairRoyaltyRatePct: 4.5,
      priorArtOverlapRiskPct: 22,
      annualMaintenanceFeeUsd: 1800,
    },
  ],
};
