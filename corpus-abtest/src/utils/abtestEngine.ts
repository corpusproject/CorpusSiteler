export interface ABTestInput {
  experimentName: string;
  hypothesis: string;
  controlVisitors: number;
  controlConversions: number;
  variantVisitors: number;
  variantConversions: number;
  confidenceLevel: 90 | 95 | 99;
  // Sample Size & Power Planner
  targetMdePct: number;
  statisticalPower: 80 | 85 | 90 | 95;
  dailyTrafficTotal: number;
  // Revenue / ARR Uplift
  averageOrderValue: number;
  monthlyEligibleVisitors: number;
}

export interface ABTestResult {
  controlCr: number;
  variantCr: number;
  absoluteLift: number;
  relativeUpliftPct: number;
  pooledStandardError: number;
  zScore: number;
  pValueTwoTailed: number;
  isSignificant: boolean;
  ciLower: number;
  ciUpper: number;
  bayesianChanceToBeatControlPct: number;
  srmWarning: boolean;
  srmChiSquare: number;
  // Sample Size Planner
  requiredSamplePerVariant: number;
  estimatedDaysToComplete: number;
  // Financial Impact
  monthlyIncrementalConversions: number;
  annualArrUplift: number;
  verdictBadge: 'KAZANAN VARYANT B (ROLLOUT %100)' | 'İSTATİSTİKSEL ANLAMLILIK YOK (TESTE DEVAM)' | 'NEGATİF ETKİ (VARYANT B GERİ ÇEKİLMELİ)';
}

export const DEFAULT_ABTEST_INPUT: ABTestInput = {
  experimentName: 'EXP-2026-Q4: Tek Adımlı AI Checkout & Dinamik Fiyatlama Akışı',
  hypothesis: 'Ödeme adımındaki form alanlarını 8’den 3’e düşürmek dönüşüm oranını (CR) en az %12 artıracaktır.',
  controlVisitors: 48500,
  controlConversions: 1940,
  variantVisitors: 48750,
  variantConversions: 2295,
  confidenceLevel: 95,
  targetMdePct: 12,
  statisticalPower: 80,
  dailyTrafficTotal: 6500,
  averageOrderValue: 145,
  monthlyEligibleVisitors: 210000,
};

/**
 * Standard Normal CDF approximation (Abramowitz and Stegun 26.2.17)
 */
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014337 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + 1.330274429 * t))));
  return x > 0 ? 1 - prob : prob;
}

export function calculateABTestMetrics(input: ABTestInput): ABTestResult {
  const nA = Math.max(1, input.controlVisitors);
  const cA = Math.min(nA, Math.max(0, input.controlConversions));
  const nB = Math.max(1, input.variantVisitors);
  const cB = Math.min(nB, Math.max(0, input.variantConversions));

  const pA = cA / nA;
  const pB = cB / nB;

  const absoluteLift = pB - pA;
  const relativeUpliftPct = pA > 0 ? ((pB - pA) / pA) * 100 : 0;

  // Pooled proportion for two-proportion Z-test
  const pPool = (cA + cB) / (nA + nB);
  const pooledStandardError = Math.sqrt(Math.max(1e-12, pPool * (1 - pPool) * (1 / nA + 1 / nB)));
  const unpooledSE = Math.sqrt(Math.max(1e-12, (pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB));

  const zScore = absoluteLift / pooledStandardError;
  const pValueTwoTailed = Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.abs(zScore)))));

  const zAlphaMap: Record<90 | 95 | 99, number> = {
    90: 1.64485,
    95: 1.95996,
    99: 2.57583,
  };
  const zCrit = zAlphaMap[input.confidenceLevel];
  const alpha = 1 - input.confidenceLevel / 100;
  const isSignificant = pValueTwoTailed < alpha;

  const ciLower = (absoluteLift - zCrit * unpooledSE) * 100;
  const ciUpper = (absoluteLift + zCrit * unpooledSE) * 100;

  // Normal approximation of Beta-Binomial posterior P(theta_B > theta_A)
  const postMeanA = (cA + 1) / (nA + 2);
  const postVarA = ((cA + 1) * (nA - cA + 1)) / (Math.pow(nA + 2, 2) * (nA + 3));
  const postMeanB = (cB + 1) / (nB + 2);
  const postVarB = ((cB + 1) * (nB - cB + 1)) / (Math.pow(nB + 2, 2) * (nB + 3));

  const zBayes = (postMeanB - postMeanA) / Math.sqrt(Math.max(1e-12, postVarA + postVarB));
  const bayesianChanceToBeatControlPct = normalCDF(zBayes) * 100;

  // Sample Ratio Mismatch (SRM) Chi-Square check (50/50 expected split)
  const totalN = nA + nB;
  const expected = totalN / 2;
  const srmChiSquare =
    Math.pow(nA - expected, 2) / expected + Math.pow(nB - expected, 2) / expected;
  // Chi-square critical value for p < 0.001 (df=1) is 10.828
  const srmWarning = srmChiSquare > 10.828;

  // Sample Size per Variant for MDE & Statistical Power
  const zBetaMap: Record<80 | 85 | 90 | 95, number> = {
    80: 0.8416,
    85: 1.0364,
    90: 1.2816,
    95: 1.6449,
  };
  const zBeta = zBetaMap[input.statisticalPower];
  const p1 = Math.max(0.001, pA);
  const mdeFrac = Math.max(0.005, input.targetMdePct / 100);
  const p2 = Math.min(0.999, p1 * (1 + mdeFrac));
  const delta = Math.abs(p2 - p1);

  const numerator = Math.pow(
    zCrit * Math.sqrt(2 * p1 * (1 - p1)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
    2
  );
  const requiredSamplePerVariant = Math.ceil(numerator / Math.pow(delta, 2));
  const estimatedDaysToComplete = Math.ceil(
    (requiredSamplePerVariant * 2) / Math.max(1, input.dailyTrafficTotal)
  );

  // Annualized Revenue Impact (ARR Uplift)
  const monthlyIncrementalConversions = Math.round(
    input.monthlyEligibleVisitors * Math.max(0, absoluteLift)
  );
  const annualArrUplift =
    monthlyIncrementalConversions * input.averageOrderValue * 12;

  let verdictBadge: ABTestResult['verdictBadge'] = 'İSTATİSTİKSEL ANLAMLILIK YOK (TESTE DEVAM)';
  if (isSignificant && absoluteLift > 0) {
    verdictBadge = 'KAZANAN VARYANT B (ROLLOUT %100)';
  } else if (isSignificant && absoluteLift < 0) {
    verdictBadge = 'NEGATİF ETKİ (VARYANT B GERİ ÇEKİLMELİ)';
  }

  return {
    controlCr: pA * 100,
    variantCr: pB * 100,
    absoluteLift: absoluteLift * 100,
    relativeUpliftPct,
    pooledStandardError,
    zScore,
    pValueTwoTailed,
    isSignificant,
    ciLower,
    ciUpper,
    bayesianChanceToBeatControlPct,
    srmWarning,
    srmChiSquare,
    requiredSamplePerVariant,
    estimatedDaysToComplete,
    monthlyIncrementalConversions,
    annualArrUplift,
    verdictBadge,
  };
}
