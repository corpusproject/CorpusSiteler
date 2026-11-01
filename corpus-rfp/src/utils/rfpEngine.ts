export interface RFPCriterionWeights {
  technicalArchitecture: number; // %
  securityCompliance: number; // %
  slaSupport: number; // %
  commercialTco: number; // %
  implementationSpeed: number; // %
}

export interface VendorBid {
  id: string;
  vendorName: string;
  tierTag: string;
  // Raw Scores (1 - 100)
  techScore: number;
  securityScore: number;
  slaScore: number;
  speedScore: number;
  // 5-Year Commercial TCO Inputs ($)
  implementationFee: number;
  annualLicenseFee: number;
  annualSupportFee: number;
  annualEscalationPct: number;
  exitMigrationCost: number;
  // Kraljic Matrix Coordinates (1 - 10)
  supplyRiskScore: number;
  profitImpactScore: number;
}

export interface EvaluatedVendor extends VendorBid {
  fiveYearTco: number;
  commercialScoreNormalized: number;
  weightedAhpScore: number;
  costPerAhpPoint: number;
  kraljicQuadrant:
    | 'STRATEJİK ORTAK (Strategic)'
    | 'KALDIRAÇ TEDARİKÇİ (Leverage)'
    | 'DARBOĞAZ (Bottleneck)'
    | 'RUTİN / STANDART (Non-Critical)';
  rank: number;
}

export interface RFPEngineResult {
  totalWeightSum: number;
  evaluatedVendors: EvaluatedVendor[];
  winnerVendor: EvaluatedVendor;
  runnerUpVendor: EvaluatedVendor | null;
  tcoSpreadMaxMin: number;
  executiveAwardMemoMarkdown: string;
}

export const DEFAULT_RFP_WEIGHTS: RFPCriterionWeights = {
  technicalArchitecture: 30,
  securityCompliance: 25,
  slaSupport: 15,
  commercialTco: 20,
  implementationSpeed: 10,
};

export const DEFAULT_VENDORS: VendorBid[] = [
  {
    id: 'V-01',
    vendorName: 'AetherCloud Enterprise ERP',
    tierTag: 'Global Tier-1 SaaS',
    techScore: 94,
    securityScore: 96,
    slaScore: 92,
    speedScore: 84,
    implementationFee: 120000,
    annualLicenseFee: 165000,
    annualSupportFee: 28000,
    annualEscalationPct: 4,
    exitMigrationCost: 45000,
    supplyRiskScore: 7.8,
    profitImpactScore: 8.9,
  },
  {
    id: 'V-02',
    vendorName: 'NovaCore Modular Suite',
    tierTag: 'Challenger Cloud',
    techScore: 88,
    securityScore: 89,
    slaScore: 90,
    speedScore: 93,
    implementationFee: 65000,
    annualLicenseFee: 128000,
    annualSupportFee: 18000,
    annualEscalationPct: 3,
    exitMigrationCost: 25000,
    supplyRiskScore: 4.2,
    profitImpactScore: 8.1,
  },
  {
    id: 'V-03',
    vendorName: 'LegacyWorks On-Premise Plus',
    tierTag: 'Hybrid Integrator',
    techScore: 76,
    securityScore: 82,
    slaScore: 78,
    speedScore: 68,
    implementationFee: 195000,
    annualLicenseFee: 140000,
    annualSupportFee: 42000,
    annualEscalationPct: 6,
    exitMigrationCost: 85000,
    supplyRiskScore: 8.4,
    profitImpactScore: 4.5,
  },
];

export function evaluateRFPMatrix(
  rfpTitle: string,
  weights: RFPCriterionWeights,
  vendors: VendorBid[]
): RFPEngineResult {
  const totalWeightSum =
    weights.technicalArchitecture +
    weights.securityCompliance +
    weights.slaSupport +
    weights.commercialTco +
    weights.implementationSpeed;

  const normFactor = totalWeightSum > 0 ? 100 / totalWeightSum : 1;

  // Step 1: Compute 5-Year TCO with annual compounding escalation for each vendor
  const withTco = vendors.map((v) => {
    let fiveYearRecurring = 0;
    for (let yr = 0; yr < 5; yr++) {
      const mult = Math.pow(1 + v.annualEscalationPct / 100, yr);
      fiveYearRecurring += (v.annualLicenseFee + v.annualSupportFee) * mult;
    }
    const fiveYearTco = Math.round(
      v.implementationFee + fiveYearRecurring + v.exitMigrationCost
    );
    return { ...v, fiveYearTco };
  });

  const minTco = Math.min(...withTco.map((v) => v.fiveYearTco), 1);
  const maxTco = Math.max(...withTco.map((v) => v.fiveYearTco), 1);

  // Step 2: Normalize Commercial Score (lowest TCO gets 100 points) & compute AHP Score
  const evaluatedUnsorted: EvaluatedVendor[] = withTco.map((v) => {
    const commercialScoreNormalized =
      v.fiveYearTco > 0 ? Math.min(100, (minTco / v.fiveYearTco) * 100) : 50;

    const weightedAhpScore =
      (v.techScore * (weights.technicalArchitecture * normFactor) +
        v.securityScore * (weights.securityCompliance * normFactor) +
        v.slaScore * (weights.slaSupport * normFactor) +
        commercialScoreNormalized * (weights.commercialTco * normFactor) +
        v.speedScore * (weights.implementationSpeed * normFactor)) /
      100;

    let kraljicQuadrant: EvaluatedVendor['kraljicQuadrant'] =
      'RUTİN / STANDART (Non-Critical)';
    if (v.supplyRiskScore >= 5 && v.profitImpactScore >= 5) {
      kraljicQuadrant = 'STRATEJİK ORTAK (Strategic)';
    } else if (v.supplyRiskScore < 5 && v.profitImpactScore >= 5) {
      kraljicQuadrant = 'KALDIRAÇ TEDARİKÇİ (Leverage)';
    } else if (v.supplyRiskScore >= 5 && v.profitImpactScore < 5) {
      kraljicQuadrant = 'DARBOĞAZ (Bottleneck)';
    }

    return {
      ...v,
      commercialScoreNormalized,
      weightedAhpScore,
      costPerAhpPoint: weightedAhpScore > 0 ? v.fiveYearTco / weightedAhpScore : 0,
      kraljicQuadrant,
      rank: 1,
    };
  });

  const evaluatedVendors = [...evaluatedUnsorted]
    .sort((a, b) => b.weightedAhpScore - a.weightedAhpScore)
    .map((v, idx) => ({ ...v, rank: idx + 1 }));

  const winnerVendor = evaluatedVendors[0];
  const runnerUpVendor = evaluatedVendors.length > 1 ? evaluatedVendors[1] : null;
  const tcoSpreadMaxMin = maxTco - minTco;

  const executiveAwardMemoMarkdown = `# SATINALMA KOMİTESİ İHALE KARAR TUTANAĞI (RFP AWARD MEMO)
**İhale / Proje Adı:** ${rfpTitle}
**Değerlendirme Metodolojisi:** Analitik Hiyerarşi Süreci (AHP) & 5 Yıllık Toplam Sahip Olma Maliyeti (TCO)

## 1. İHALE KAZANAN TEDARİKÇİ ÖZETİ
- **Birinci Seçilen Tedarikçi (Rank #1):** ${winnerVendor.vendorName} (${winnerVendor.tierTag})
- **Ağırlıklı AHP Puanı:** ${winnerVendor.weightedAhpScore.toFixed(2)} / 100
- **5 Yıllık Toplam TCO (Enflasyon/Eskalasyon Dahil):** $${winnerVendor.fiveYearTco.toLocaleString()}
- **Kraljic Portföy Konumu:** ${winnerVendor.kraljicQuadrant}

## 2. KARŞILAŞTIRMALI ADAY SIRALAMASI
${evaluatedVendors
  .map(
    (v) =>
      `- **#${v.rank} ${v.vendorName}**: AHP Skoru **${v.weightedAhpScore.toFixed(
        2
      )}** | 5-Yıl TCO: **$${v.fiveYearTco.toLocaleString()}** | Kraljic: *${v.kraljicQuadrant}*`
  )
  .join('\n')}

## 3. KOMİTE GEREKÇELİ KARARI
Teknik mimari (%${weights.technicalArchitecture}), bilgi güvenliği (%${
    weights.securityCompliance
  }) ve 5 yıllık TCO (%${
    weights.commercialTco
  }) kriterlerinde en yüksek birleşik faydayı sağlayan **${
    winnerVendor.vendorName
  }** ile sözleşme müzakerelerine başlanması oybirliğiyle tavsiye edilmiştir.`;

  return {
    totalWeightSum,
    evaluatedVendors,
    winnerVendor,
    runnerUpVendor,
    tcoSpreadMaxMin,
    executiveAwardMemoMarkdown,
  };
}
