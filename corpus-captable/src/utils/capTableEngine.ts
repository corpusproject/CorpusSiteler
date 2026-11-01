// ============================================================================
// CORPUS CAPTABLE — Startup Valuation, Equity Dilution, SAFE & Exit Waterfall
// #038 PRO | Pre-Seed to Exit Liquidation Preference (1x/2x) & MOIC Engine
// ============================================================================

export type StakeholderRole =
  | 'FOUNDER'
  | 'ESOP_POOL'
  | 'ANGEL_SAFE'
  | 'SEED_VC'
  | 'SERIES_A_VC'
  | 'SERIES_B_VC';

export interface StakeholderEntry {
  id: string;
  name: string;
  role: StakeholderRole;
  initialFounderShares: number;
  investedCapitalUsd: number;
  roundEntered: 'FOUNDING' | 'SAFE_NOTE' | 'SEED' | 'SERIES_A' | 'SERIES_B';
  liquidationPrefMultiple: number; // 1.0x, 1.5x, 2.0x
  isParticipatingPreferred: boolean;
  vestingMonths: number;
  cliffMonths: number;
  badgeColor: string;
}

export interface FundingRoundSpec {
  id: string;
  roundName: 'SAFE Conversion' | 'Seed Round' | 'Series A' | 'Series B';
  preMoneyValuationUsd: number;
  newCapitalRaisedUsd: number;
  esopTopUpTargetPct: number;
  safeValuationCapUsd?: number;
  safeDiscountPct?: number;
}

export interface CapTableProject {
  companyName: string;
  sectorTag: string;
  incorporationJurisdiction: string;
  initialAuthorizedShares: number;
  exitEnterpriseValueUsd: number;
  mAndATransactionFeePct: number;
  stakeholders: StakeholderEntry[];
  rounds: FundingRoundSpec[];
  accentColor: string;
}

export interface StakeholderExitResult {
  stakeholder: StakeholderEntry;
  finalShares: number;
  ownershipPct: number;
  FoundingDilutionDropPct: number;
  liquidationPreferencePayoutUsd: number;
  proRataCommonPayoutUsd: number;
  totalExitPayoutUsd: number;
  moicMultiple: number;
}

export interface CapTableSummary {
  totalPostRoundShares: number;
  latestPostMoneyValuationUsd: number;
   latestSharePriceUsd: number;
  founderCombinedOwnershipPct: number;
  esopCombinedOwnershipPct: number;
  investorCombinedOwnershipPct: number;
  totalCapitalRaisedUsd: number;
  netExitProceedsUsd: number;
  stakeholderResults: StakeholderExitResult[];
}

export function calculateCapTableAndWaterfall(
  project: CapTableProject
): CapTableSummary {
  const totalCapitalRaisedUsd = project.stakeholders.reduce(
    (acc, s) => acc + s.investedCapitalUsd,
    0
  );

  // Latest round post-money valuation
  const lastRound = project.rounds[project.rounds.length - 1];
  const latestPostMoneyValuationUsd = lastRound
    ? lastRound.preMoneyValuationUsd + lastRound.newCapitalRaisedUsd
    : 25_000_000;

  // Compute dilution factors across rounds
  let cumulativeDilutionFactor = 1.0;
  for (const r of project.rounds) {
    const post = r.preMoneyValuationUsd + r.newCapitalRaisedUsd;
    const roundDilution = post > 0 ? r.newCapitalRaisedUsd / post : 0.2;
    cumulativeDilutionFactor *= 1 - roundDilution;
  }

  const baseShares = Math.max(1_000_000, project.initialAuthorizedShares);
  const totalPostRoundShares = Math.round(
    baseShares / Math.max(0.22, cumulativeDilutionFactor)
  );
  const latestSharePriceUsd = Number(
    (latestPostMoneyValuationUsd / totalPostRoundShares).toFixed(4)
  );

  // Assign shares to each stakeholder proportionally and normalize to 100%
  const rawWeights = project.stakeholders.map((s) => {
    if (s.role === 'FOUNDER' || s.role === 'ESOP_POOL') {
      return s.initialFounderShares * cumulativeDilutionFactor;
    }
    // Investor share allocation based on round valuation
    const roundMatch =
      s.roundEntered === 'SEED'
        ? project.rounds[1] || project.rounds[0]
        : s.roundEntered === 'SERIES_A'
        ? project.rounds[2] || project.rounds[0]
        : s.roundEntered === 'SERIES_B'
        ? project.rounds[3] || lastRound
        : project.rounds[0];

    const effectivePreMoney =
      s.roundEntered === 'SAFE_NOTE' && roundMatch?.safeValuationCapUsd
        ? roundMatch.safeValuationCapUsd
        : roundMatch
        ? roundMatch.preMoneyValuationUsd
        : 10_000_000;

    const ownershipBought =
      s.investedCapitalUsd /
      Math.max(1_000_000, effectivePreMoney + s.investedCapitalUsd);
    return ownershipBought * totalPostRoundShares;
  });

  const weightSum = rawWeights.reduce((a, b) => a + b, 0) || 1;

  // Net Exit Proceeds after M&A advisory fees
  const netExitProceedsUsd =
    project.exitEnterpriseValueUsd * (1 - project.mAndATransactionFeePct / 100);

  // Step 1 of Waterfall: Pay Senior Liquidation Preferences to Preferred Investors
  let remainingProceeds = netExitProceedsUsd;
  const prefPayouts: number[] = [];

  project.stakeholders.forEach((s, idx) => {
    const ownershipPct = (rawWeights[idx] / weightSum) * 100;
    if (s.investedCapitalUsd > 0 && s.liquidationPrefMultiple > 0) {
      const prefClaim = s.investedCapitalUsd * s.liquidationPrefMultiple;
      const proRataEquivalent = (ownershipPct / 100) * netExitProceedsUsd;

      // Non-participating preferred converts to common if pro-rata > preference claim
      if (!s.isParticipatingPreferred && proRataEquivalent > prefClaim) {
        prefPayouts.push(0);
      } else {
        const paid = Math.min(remainingProceeds, prefClaim);
        prefPayouts.push(paid);
        remainingProceeds = Math.max(0, remainingProceeds - paid);
      }
    } else {
      prefPayouts.push(0);
    }
  });

  // Step 2 of Waterfall: Distribute remaining common pool pro-rata to Common + Participating Preferred + Converted Preferred
  const eligibleCommonWeightSum = project.stakeholders.reduce((acc, s, idx) => {
    const tookNonPartPref =
      prefPayouts[idx] > 0 && !s.isParticipatingPreferred;
    return tookNonPartPref ? acc : acc + rawWeights[idx];
  }, 0);

  const stakeholderResults: StakeholderExitResult[] = project.stakeholders.map(
    (s, idx) => {
      const ownershipPct = Number(((rawWeights[idx] / weightSum) * 100).toFixed(2));
      const finalShares = Math.round((ownershipPct / 100) * totalPostRoundShares);

      const initialFoundingPct =
        s.initialFounderShares > 0
          ? (s.initialFounderShares / baseShares) * 100
          : ownershipPct;

      const FoundingDilutionDropPct = Number(
        Math.max(0, initialFoundingPct - ownershipPct).toFixed(2)
      );

      const tookNonPartPref =
        prefPayouts[idx] > 0 && !s.isParticipatingPreferred;

      const proRataCommonPayoutUsd =
        !tookNonPartPref && eligibleCommonWeightSum > 0
          ? remainingProceeds * (rawWeights[idx] / eligibleCommonWeightSum)
          : 0;

      const totalExitPayoutUsd = Math.round(
        prefPayouts[idx] + proRataCommonPayoutUsd
      );

      const moicMultiple =
        s.investedCapitalUsd > 0
          ? Number((totalExitPayoutUsd / s.investedCapitalUsd).toFixed(2))
          : 0;

      return {
        stakeholder: s,
        finalShares,
        ownershipPct,
        FoundingDilutionDropPct,
        liquidationPreferencePayoutUsd: Math.round(prefPayouts[idx]),
        proRataCommonPayoutUsd: Math.round(proRataCommonPayoutUsd),
        totalExitPayoutUsd,
        moicMultiple,
      };
    }
  );

  const founderCombinedOwnershipPct = Number(
    stakeholderResults
      .filter((r) => r.stakeholder.role === 'FOUNDER')
      .reduce((a, b) => a + b.ownershipPct, 0)
      .toFixed(2)
  );

  const esopCombinedOwnershipPct = Number(
    stakeholderResults
      .filter((r) => r.stakeholder.role === 'ESOP_POOL')
      .reduce((a, b) => a + b.ownershipPct, 0)
      .toFixed(2)
  );

  const investorCombinedOwnershipPct = Number(
    (100 - founderCombinedOwnershipPct - esopCombinedOwnershipPct).toFixed(2)
  );

  return {
    totalPostRoundShares,
    latestPostMoneyValuationUsd,
    latestSharePriceUsd,
    founderCombinedOwnershipPct,
    esopCombinedOwnershipPct,
    investorCombinedOwnershipPct,
    totalCapitalRaisedUsd,
    netExitProceedsUsd,
    stakeholderResults,
  };
}

export const PRESET_CAPTABLE_PROJECTS: Record<string, CapTableProject> = {
  b2b_ai_unicorn_path: {
    companyName: 'Aethelgard AI Inc.',
    sectorTag: 'Enterprise Autonomous Security SaaS',
    incorporationJurisdiction: 'Delaware C-Corp / Istanbul R&D Subsidiary',
    initialAuthorizedShares: 10_000_000,
    exitEnterpriseValueUsd: 140_000_000,
    mAndATransactionFeePct: 2.0,
    accentColor: '#a855f7',
    stakeholders: [
      {
        id: 'st-1',
        name: 'Kaan Arslan (CEO & Co-Founder)',
        role: 'FOUNDER',
        initialFounderShares: 5_000_000,
        investedCapitalUsd: 0,
        roundEntered: 'FOUNDING',
        liquidationPrefMultiple: 0,
        isParticipatingPreferred: false,
        vestingMonths: 48,
        cliffMonths: 12,
        badgeColor: '#10b981',
      },
      {
        id: 'st-2',
        name: 'Derin Soylu (CTO & Co-Founder)',
        role: 'FOUNDER',
        initialFounderShares: 3_800_000,
        investedCapitalUsd: 0,
        roundEntered: 'FOUNDING',
        liquidationPrefMultiple: 0,
        isParticipatingPreferred: false,
        vestingMonths: 48,
        cliffMonths: 12,
        badgeColor: '#34d399',
      },
      {
        id: 'st-3',
        name: 'Employee Stock Option Pool (ESOP)',
        role: 'ESOP_POOL',
        initialFounderShares: 1_200_000,
        investedCapitalUsd: 0,
        roundEntered: 'FOUNDING',
        liquidationPrefMultiple: 0,
        isParticipatingPreferred: false,
        vestingMonths: 48,
        cliffMonths: 12,
        badgeColor: '#f59e0b',
      },
      {
        id: 'st-4',
        name: 'YC / Bosphorus Angel Syndicate (Post-Money SAFE)',
        role: 'ANGEL_SAFE',
        initialFounderShares: 0,
        investedCapitalUsd: 1_250_000,
        roundEntered: 'SAFE_NOTE',
        liquidationPrefMultiple: 1.0,
        isParticipatingPreferred: false,
        vestingMonths: 0,
        cliffMonths: 0,
        badgeColor: '#38bdf8',
      },
      {
        id: 'st-5',
        name: 'Northstar Seed Ventures LP',
        role: 'SEED_VC',
        initialFounderShares: 0,
        investedCapitalUsd: 4_500_000,
        roundEntered: 'SEED',
        liquidationPrefMultiple: 1.0,
        isParticipatingPreferred: false,
        vestingMonths: 0,
        cliffMonths: 0,
        badgeColor: '#6366f1',
      },
      {
        id: 'st-6',
        name: 'Sequoia / Index Tier-1 Growth Fund (Series A)',
        role: 'SERIES_A_VC',
        initialFounderShares: 0,
        investedCapitalUsd: 16_000_000,
        roundEntered: 'SERIES_A',
        liquidationPrefMultiple: 1.0,
        isParticipatingPreferred: true,
        vestingMonths: 0,
        cliffMonths: 0,
        badgeColor: '#a855f7',
      },
    ],
    rounds: [
      {
        id: 'rnd-1',
        roundName: 'SAFE Conversion',
        preMoneyValuationUsd: 10_000_000,
        newCapitalRaisedUsd: 1_250_000,
        esopTopUpTargetPct: 10,
        safeValuationCapUsd: 10_000_000,
        safeDiscountPct: 20,
      },
      {
        id: 'rnd-2',
        roundName: 'Seed Round',
        preMoneyValuationUsd: 18_000_000,
        newCapitalRaisedUsd: 4_500_000,
        esopTopUpTargetPct: 12,
      },
      {
        id: 'rnd-3',
        roundName: 'Series A',
        preMoneyValuationUsd: 64_000_000,
        newCapitalRaisedUsd: 16_000_000,
        esopTopUpTargetPct: 12,
      },
    ],
  },
};
