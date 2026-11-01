// ============================================================================
// CORPUS TREASURY & CREDIT — Altman Z-Score, Basel III ECL & DSCR Loan Engine
// #047 PRO | Corporate Bankruptcy Predictor, Covenant Stress & Amortization
// ============================================================================

export interface CorporateCreditProject {
  borrowerName: string;
  sector: string;
  // Balance Sheet & Income Statement Inputs ($M)
  totalAssetsUsd: number;
  currentAssetsUsd: number;
  currentLiabilitiesUsd: number;
  retainedEarningsUsd: number;
  ebitUsd: number;
  ebitdaUsd: number;
  marketValueEquityUsd: number;
  totalDebtLiabilitiesUsd: number;
  cashAndEquivalentsUsd: number;
  annualRevenueSalesUsd: number;
  // Commercial Loan & Basel III Facility Parameters
  loanPrincipalFacilityUsd: number;
  annualInterestRatePct: number;
  loanTermYears: number;
  lossGivenDefaultLgdPct: number; // Basel III LGD (e.g. 45% unsecured, 25% collateralized)
  accentColor: string;
}

export interface AmortizationYearRow {
  year: number;
  beginningBalanceUsd: number;
  totalDebtServicePaymentUsd: number;
  interestPaymentUsd: number;
  principalRepaymentUsd: number;
  endingBalanceUsd: number;
  dscrRatio: number;
}

export interface CreditRiskSummary {
  workingCapitalUsd: number;
  x1WorkingCapitalToAssets: number;
  x2RetainedEarningsToAssets: number;
  x3EbitToAssets: number;
  x4EquityToTotalLiabilities: number;
  x5SalesToAssets: number;
  altmanZScore: number;
  zScoreZone: 'SAFE ZONE (Z > 2.99)' | 'GREY ZONE (1.81 - 2.99)' | 'DISTRESS ZONE (Z < 1.81)';
  syntheticCreditRating: string;
  impliedProbabilityOfDefaultPdPct: number;
  baselExpectedCreditLossEclUsd: number;
  netDebtToEbitdaRatio: number;
  interestCoverageRatio: number;
  currentRatio: number;
  year1DscrRatio: number;
  covenantBreached: boolean;
  schedule: AmortizationYearRow[];
}

export function calculateCreditAndAltmanZ(
  project: CorporateCreditProject
): CreditRiskSummary {
  const assets = Math.max(1, project.totalAssetsUsd);
  const liabilities = Math.max(1, project.totalDebtLiabilitiesUsd);

  const workingCapitalUsd =
    project.currentAssetsUsd - project.currentLiabilitiesUsd;

  const x1WorkingCapitalToAssets = Number(
    (workingCapitalUsd / assets).toFixed(3)
  );
  const x2RetainedEarningsToAssets = Number(
    (project.retainedEarningsUsd / assets).toFixed(3)
  );
  const x3EbitToAssets = Number((project.ebitUsd / assets).toFixed(3));
  const x4EquityToTotalLiabilities = Number(
    (project.marketValueEquityUsd / liabilities).toFixed(3)
  );
  const x5SalesToAssets = Number(
    (project.annualRevenueSalesUsd / assets).toFixed(3)
  );

  // Classic Edward Altman Z-Score Formula:
  // Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 1.0*X5
  const altmanZScore = Number(
    (
      1.2 * x1WorkingCapitalToAssets +
      1.4 * x2RetainedEarningsToAssets +
      3.3 * x3EbitToAssets +
      0.6 * x4EquityToTotalLiabilities +
      1.0 * x5SalesToAssets
    ).toFixed(2)
  );

  const zScoreZone =
    altmanZScore >= 2.99
      ? 'SAFE ZONE (Z > 2.99)'
      : altmanZScore >= 1.81
      ? 'GREY ZONE (1.81 - 2.99)'
      : 'DISTRESS ZONE (Z < 1.81)';

  let syntheticCreditRating = 'BBB+ (Investment Grade)';
  let impliedProbabilityOfDefaultPdPct = 1.15;

  if (altmanZScore >= 3.8) {
    syntheticCreditRating = 'AA / A+ (Prime Grade)';
    impliedProbabilityOfDefaultPdPct = 0.25;
  } else if (altmanZScore >= 2.99) {
    syntheticCreditRating = 'BBB+ / BBB (Investment Grade)';
    impliedProbabilityOfDefaultPdPct = 0.95;
  } else if (altmanZScore >= 2.2) {
    syntheticCreditRating = 'BB+ / BB (High-Yield Crossover)';
    impliedProbabilityOfDefaultPdPct = 3.2;
  } else if (altmanZScore >= 1.81) {
    syntheticCreditRating = 'B+ / B (Speculative Watch)';
    impliedProbabilityOfDefaultPdPct = 7.8;
  } else {
    syntheticCreditRating = 'CCC / Default Warning';
    impliedProbabilityOfDefaultPdPct = 21.5;
  }

  // Basel III Expected Credit Loss: ECL = EAD * PD * LGD
  const baselExpectedCreditLossEclUsd = Math.round(
    project.loanPrincipalFacilityUsd *
      (impliedProbabilityOfDefaultPdPct / 100) *
      (project.lossGivenDefaultLgdPct / 100)
  );

  // Commercial Loan Annuity Amortization Schedule
  const r = project.annualInterestRatePct / 100;
  const n = Math.max(1, project.loanTermYears);
  const annualPayment =
    r > 0
      ? (project.loanPrincipalFacilityUsd * (r * Math.pow(1 + r, n))) /
        (Math.pow(1 + r, n) - 1)
      : project.loanPrincipalFacilityUsd / n;

  let balance = project.loanPrincipalFacilityUsd;
  const schedule: AmortizationYearRow[] = [];

  for (let yr = 1; yr <= n; yr++) {
    const interestPaymentUsd = Math.round(balance * r);
    const principalRepaymentUsd = Math.round(
      annualPayment - interestPaymentUsd
    );
    const endingBalanceUsd = Math.max(0, Math.round(balance - principalRepaymentUsd));
    const projectedEbitda = project.ebitdaUsd * Math.pow(1.05, yr - 1);
    const dscrRatio =
      annualPayment > 0
        ? Number((projectedEbitda / annualPayment).toFixed(2))
        : 9.99;

    schedule.push({
      year: yr,
      beginningBalanceUsd: Math.round(balance),
      totalDebtServicePaymentUsd: Math.round(annualPayment),
      interestPaymentUsd,
      principalRepaymentUsd,
      endingBalanceUsd,
      dscrRatio,
    });
    balance = endingBalanceUsd;
  }

  const netDebt = Math.max(
    0,
    project.totalDebtLiabilitiesUsd - project.cashAndEquivalentsUsd
  );
  const netDebtToEbitdaRatio =
    project.ebitdaUsd > 0
      ? Number((netDebt / project.ebitdaUsd).toFixed(2))
      : 0;

  const year1Interest = schedule[0]?.interestPaymentUsd || 1;
  const interestCoverageRatio = Number(
    (project.ebitUsd / Math.max(1, year1Interest)).toFixed(2)
  );

  const currentRatio =
    project.currentLiabilitiesUsd > 0
      ? Number(
          (project.currentAssetsUsd / project.currentLiabilitiesUsd).toFixed(2)
        )
      : 2.0;

  const year1DscrRatio = schedule[0]?.dscrRatio || 1.5;
  const covenantBreached =
    year1DscrRatio < 1.25 || netDebtToEbitdaRatio > 3.5 || currentRatio < 1.1;

  return {
    workingCapitalUsd,
    x1WorkingCapitalToAssets,
    x2RetainedEarningsToAssets,
    x3EbitToAssets,
    x4EquityToTotalLiabilities,
    x5SalesToAssets,
    altmanZScore,
    zScoreZone,
    syntheticCreditRating,
    impliedProbabilityOfDefaultPdPct,
    baselExpectedCreditLossEclUsd,
    netDebtToEbitdaRatio,
    interestCoverageRatio,
    currentRatio,
    year1DscrRatio,
    covenantBreached,
    schedule,
  };
}

export const PRESET_CREDIT_PROJECT: CorporateCreditProject = {
  borrowerName: 'Marmara Precision Steel & Logistics Holding A.Ş.',
  sector: 'Heavy Industrial Manufacturing & Port Export',
  totalAssetsUsd: 95000000,
  currentAssetsUsd: 38000000,
  currentLiabilitiesUsd: 21000000,
  retainedEarningsUsd: 29000000,
  ebitUsd: 16500000,
  ebitdaUsd: 21500000,
  marketValueEquityUsd: 68000000,
  totalDebtLiabilitiesUsd: 42000000,
  cashAndEquivalentsUsd: 9500000,
  annualRevenueSalesUsd: 118000000,
  loanPrincipalFacilityUsd: 25000000,
  annualInterestRatePct: 7.5,
  loanTermYears: 7,
  lossGivenDefaultLgdPct: 32,
  accentColor: '#3b82f6',
};
