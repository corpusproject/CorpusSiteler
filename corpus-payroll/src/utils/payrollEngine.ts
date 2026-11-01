// ============================================================================
// CORPUS PAYROLL — Global EOR Employer Cost, Tax Brackets & Salary Band Engine
// #042 PRO | Gross-to-Net, R&D Technopark Incentives, Compa-Ratio & EOR Matrix
// ============================================================================

export type CountryHubCode = 'TR' | 'DE' | 'UK' | 'US' | 'AE';

export interface RoleCompensationRow {
  id: string;
  levelCode: string; // e.g. IC3, IC4, IC5, M2
  roleTitle: string;
  headcount: number;
  monthlyGrossUsd: number;
  bandMidpointP50Usd: number;
  annualEquityRsuUsd: number;
  monthlyBenefitsPerHeadUsd: number;
  isRdTechnoparkExempt: boolean;
}

export interface CountryEmployerProfile {
  code: CountryHubCode;
  name: string;
  employerSocialSecurityPct: number;
  effectiveIncomeTaxAvgPct: number;
  employeeSocialSecurityPct: number;
  eorPlatformFeeMonthlyUsd: number;
  rdTaxExemptionDiscountPct: number;
  statutorySeveranceAccrualPct: number;
  badgeColor: string;
}

export interface PayrollProject {
  companyName: string;
  primaryHub: CountryHubCode;
  annualBonusTargetPct: number;
  roles: RoleCompensationRow[];
  accentColor: string;
}

export interface RoleCostBreakdown {
  role: RoleCompensationRow;
  compaRatioPct: number;
  monthlyNetTakeHomeUsd: number;
  monthlyEmployerTaxesUsd: number;
  monthlyTotalEmployerCostPerHeadUsd: number;
  annualTotalDepartmentCostUsd: number;
}

export interface CountryComparisonRow {
  profile: CountryEmployerProfile;
  totalAnnualGrossPayrollUsd: number;
  totalAnnualEmployerTaxesUsd: number;
  totalAnnualNetTakeHomeUsd: number;
  totalAnnualFullyLoadedCostUsd: number;
  taxWedgePct: number;
}

export const COUNTRY_PROFILES: CountryEmployerProfile[] = [
  {
    code: 'TR',
    name: 'Türkiye (SGK + Gelir Vergisi / Teknopark 5746)',
    employerSocialSecurityPct: 22.75,
    effectiveIncomeTaxAvgPct: 24.5,
    employeeSocialSecurityPct: 15.0,
    eorPlatformFeeMonthlyUsd: 0,
    rdTaxExemptionDiscountPct: 82.0,
    statutorySeveranceAccrualPct: 8.33,
    badgeColor: '#ef4444',
  },
  {
    code: 'DE',
    name: 'Germany (GKV / RV / AV Social Contributions)',
    employerSocialSecurityPct: 20.8,
    effectiveIncomeTaxAvgPct: 31.0,
    employeeSocialSecurityPct: 20.2,
    eorPlatformFeeMonthlyUsd: 499,
    rdTaxExemptionDiscountPct: 15.0,
    statutorySeveranceAccrualPct: 4.5,
    badgeColor: '#f59e0b',
  },
  {
    code: 'UK',
    name: 'United Kingdom (Employer NIC 13.8% + PAYE)',
    employerSocialSecurityPct: 13.8,
    effectiveIncomeTaxAvgPct: 27.5,
    employeeSocialSecurityPct: 8.0,
    eorPlatformFeeMonthlyUsd: 499,
    rdTaxExemptionDiscountPct: 20.0,
    statutorySeveranceAccrualPct: 3.0,
    badgeColor: '#3b82f6',
  },
  {
    code: 'US',
    name: 'United States (FICA + FUTA + SUTA + 401k Match)',
    employerSocialSecurityPct: 9.65,
    effectiveIncomeTaxAvgPct: 26.0,
    employeeSocialSecurityPct: 7.65,
    eorPlatformFeeMonthlyUsd: 599,
    rdTaxExemptionDiscountPct: 12.0,
    statutorySeveranceAccrualPct: 2.0,
    badgeColor: '#10b981',
  },
  {
    code: 'AE',
    name: 'UAE Dubai (0% Personal Income Tax + EOSB Gratuity)',
    employerSocialSecurityPct: 2.5,
    effectiveIncomeTaxAvgPct: 0.0,
    employeeSocialSecurityPct: 0.0,
    eorPlatformFeeMonthlyUsd: 549,
    rdTaxExemptionDiscountPct: 0.0,
    statutorySeveranceAccrualPct: 8.33,
    badgeColor: '#a855f7',
  },
];

export function calculatePayrollAndBands(project: PayrollProject): {
  roleBreakdowns: RoleCostBreakdown[];
  countryComparisons: CountryComparisonRow[];
  totalHeadcount: number;
  selectedHubAnnualCostUsd: number;
  selectedHubMonthlyBurnUsd: number;
  avgCompaRatioPct: number;
} {
  const activeProfile =
    COUNTRY_PROFILES.find((c) => c.code === project.primaryHub) ||
    COUNTRY_PROFILES[0];

  const bonusMultiplier = 1 + project.annualBonusTargetPct / 100;

  let totalHeadcount = 0;
  let compaSum = 0;

  const roleBreakdowns: RoleCostBreakdown[] = project.roles.map((r) => {
    totalHeadcount += r.headcount;
    const compaRatioPct =
      r.bandMidpointP50Usd > 0
        ? Number(((r.monthlyGrossUsd / r.bandMidpointP50Usd) * 100).toFixed(1))
        : 100;
    compaSum += compaRatioPct;

    const rdFactor = r.isRdTechnoparkExempt
      ? 1 - activeProfile.rdTaxExemptionDiscountPct / 100
      : 1.0;

    const empSgk =
      r.monthlyGrossUsd * (activeProfile.employeeSocialSecurityPct / 100);
    const taxableBase = r.monthlyGrossUsd - empSgk;
    const incomeTax =
      taxableBase *
      (activeProfile.effectiveIncomeTaxAvgPct / 100) *
      rdFactor;

    const monthlyNetTakeHomeUsd = Math.round(
      r.monthlyGrossUsd - empSgk - incomeTax
    );

    const employerSocial =
      r.monthlyGrossUsd *
      (activeProfile.employerSocialSecurityPct / 100) *
      (r.isRdTechnoparkExempt ? 0.45 : 1.0);

    const severanceAccrual =
      r.monthlyGrossUsd * (activeProfile.statutorySeveranceAccrualPct / 100);

    const monthlyEmployerTaxesUsd = Math.round(
      employerSocial + severanceAccrual + activeProfile.eorPlatformFeeMonthlyUsd
    );

    const monthlyTotalEmployerCostPerHeadUsd = Math.round(
      r.monthlyGrossUsd * bonusMultiplier +
        monthlyEmployerTaxesUsd +
        r.monthlyBenefitsPerHeadUsd +
        r.annualEquityRsuUsd / 12
    );

    const annualTotalDepartmentCostUsd = Math.round(
      monthlyTotalEmployerCostPerHeadUsd * 12 * r.headcount
    );

    return {
      role: r,
      compaRatioPct,
      monthlyNetTakeHomeUsd,
      monthlyEmployerTaxesUsd,
      monthlyTotalEmployerCostPerHeadUsd,
      annualTotalDepartmentCostUsd,
    };
  });

  const countryComparisons: CountryComparisonRow[] = COUNTRY_PROFILES.map(
    (prof) => {
      let totalAnnualGrossPayrollUsd = 0;
      let totalAnnualEmployerTaxesUsd = 0;
      let totalAnnualNetTakeHomeUsd = 0;
      let totalAnnualFullyLoadedCostUsd = 0;

      for (const r of project.roles) {
        const rdFactor = r.isRdTechnoparkExempt
          ? 1 - prof.rdTaxExemptionDiscountPct / 100
          : 1.0;

        const annualGrossPerHead = r.monthlyGrossUsd * 12 * bonusMultiplier;
        const empSocial =
          annualGrossPerHead * (prof.employeeSocialSecurityPct / 100);
        const empTax =
          (annualGrossPerHead - empSocial) *
          (prof.effectiveIncomeTaxAvgPct / 100) *
          rdFactor;
        const netTakeHome = annualGrossPerHead - empSocial - empTax;

        const erSocial =
          annualGrossPerHead *
          (prof.employerSocialSecurityPct / 100) *
          (r.isRdTechnoparkExempt ? 0.5 : 1.0);
        const erSeverance =
          annualGrossPerHead * (prof.statutorySeveranceAccrualPct / 100);
        const erEor = prof.eorPlatformFeeMonthlyUsd * 12;
        const erTaxes = erSocial + erSeverance + erEor;

        const fullCostPerHead =
          annualGrossPerHead +
          erTaxes +
          r.monthlyBenefitsPerHeadUsd * 12 +
          r.annualEquityRsuUsd;

        totalAnnualGrossPayrollUsd += annualGrossPerHead * r.headcount;
        totalAnnualEmployerTaxesUsd += erTaxes * r.headcount;
        totalAnnualNetTakeHomeUsd += netTakeHome * r.headcount;
        totalAnnualFullyLoadedCostUsd += fullCostPerHead * r.headcount;
      }

      const taxWedgePct =
        totalAnnualFullyLoadedCostUsd > 0
          ? Number(
              (
                ((totalAnnualFullyLoadedCostUsd - totalAnnualNetTakeHomeUsd) /
                  totalAnnualFullyLoadedCostUsd) *
                100
              ).toFixed(1)
            )
          : 0;

      return {
        profile: prof,
        totalAnnualGrossPayrollUsd: Math.round(totalAnnualGrossPayrollUsd),
        totalAnnualEmployerTaxesUsd: Math.round(totalAnnualEmployerTaxesUsd),
        totalAnnualNetTakeHomeUsd: Math.round(totalAnnualNetTakeHomeUsd),
        totalAnnualFullyLoadedCostUsd: Math.round(
          totalAnnualFullyLoadedCostUsd
        ),
        taxWedgePct,
      };
    }
  );

  const selectedHubAnnualCostUsd = roleBreakdowns.reduce(
    (a, b) => a + b.annualTotalDepartmentCostUsd,
    0
  );

  return {
    roleBreakdowns,
    countryComparisons,
    totalHeadcount,
    selectedHubAnnualCostUsd,
    selectedHubMonthlyBurnUsd: Math.round(selectedHubAnnualCostUsd / 12),
    avgCompaRatioPct:
      project.roles.length > 0
        ? Number((compaSum / project.roles.length).toFixed(1))
        : 100,
  };
}

export const PRESET_PAYROLL_PROJECT: PayrollProject = {
  companyName: 'Corpus Engineering & Product Organization',
  primaryHub: 'TR',
  annualBonusTargetPct: 12,
  accentColor: '#ec4899',
  roles: [
    {
      id: 'rl-1',
      levelCode: 'IC5 (Staff)',
      roleTitle: 'Staff Distributed Systems Engineer',
      headcount: 4,
      monthlyGrossUsd: 7200,
      bandMidpointP50Usd: 7000,
      annualEquityRsuUsd: 18000,
      monthlyBenefitsPerHeadUsd: 380,
      isRdTechnoparkExempt: true,
    },
    {
      id: 'rl-2',
      levelCode: 'IC4 (Senior)',
      roleTitle: 'Senior Full-Stack & AI Engineer',
      headcount: 12,
      monthlyGrossUsd: 5400,
      bandMidpointP50Usd: 5500,
      annualEquityRsuUsd: 9500,
      monthlyBenefitsPerHeadUsd: 340,
      isRdTechnoparkExempt: true,
    },
    {
      id: 'rl-3',
      levelCode: 'IC3 (Mid)',
      roleTitle: 'Product Designer & Frontend Engineer',
      headcount: 8,
      monthlyGrossUsd: 3600,
      bandMidpointP50Usd: 3500,
      annualEquityRsuUsd: 4000,
      monthlyBenefitsPerHeadUsd: 310,
      isRdTechnoparkExempt: true,
    },
    {
      id: 'rl-4',
      levelCode: 'M2 (Director)',
      roleTitle: 'Engineering Director & Product Lead',
      headcount: 2,
      monthlyGrossUsd: 9200,
      bandMidpointP50Usd: 9000,
      annualEquityRsuUsd: 32000,
      monthlyBenefitsPerHeadUsd: 520,
      isRdTechnoparkExempt: false,
    },
  ],
};
