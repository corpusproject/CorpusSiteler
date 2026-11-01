export interface FleetTCOInput {
  fleetName: string;
  vehicleCount: number;
  annualKmPerVehicle: number;
  holdingYears: number;
  // EV Specs
  evPurchasePrice: number;
  evSubsidyGrant: number;
  evKwhPer100Km: number;
  electricityCostPerKwh: number;
  evMaintenancePerKm: number;
  evResidualPct: number;
  // Diesel Specs
  dieselPurchasePrice: number;
  dieselLitersPer100Km: number;
  dieselCostPerLiter: number;
  adBlueAndCarbonTaxPerKm: number;
  dieselMaintenancePerKm: number;
  dieselResidualPct: number;
}

export interface ColdChainProbeReading {
  id: string;
  timeStamp: string;
  locationZone: string;
  tempCelsius: number;
}

export interface FleetEngineResult {
  evTotal5YrPerVehicle: number;
  dieselTotal5YrPerVehicle: number;
  evFleetTotalCost: number;
  dieselFleetTotalCost: number;
  totalFleetSavings: number;
  evCostPerKm: number;
  dieselCostPerKm: number;
  breakEvenMonths: number;
  co2SavedTonnesTotal: number;
  yearlyCumulativeComparison: {
    year: number;
    evCumulative: number;
    dieselCumulative: number;
  }[];
  // Cold Chain USP <1079> Mean Kinetic Temperature (MKT)
  mktCelsius: number;
  arithmeticMeanTemp: number;
  minTemp: number;
  maxTemp: number;
  excursionCount: number;
  coldChainStatus: 'USP <1079> UYUMLU (2°C - 8°C)' | 'KRİTİK SICAKLIK İHLALİ (EXCURSION)' | 'DİKKAT: MKT EŞİK SINIRINDA';
  // EU EC 561/2006 Tachograph
  totalRouteKm: number;
  avgSpeedKmh: number;
  pureDrivingHours: number;
  mandatory45MinBreaks: number;
  dailyRestPeriods11h: number;
  totalElapsedTripHours: number;
}

export const DEFAULT_FLEET_INPUT: FleetTCOInput = {
  fleetName: 'Anadolu Cold-Chain & Lojistik Filosu (25 Araç)',
  vehicleCount: 25,
  annualKmPerVehicle: 95000,
  holdingYears: 5,
  evPurchasePrice: 145000,
  evSubsidyGrant: 15000,
  evKwhPer100Km: 78,
  electricityCostPerKwh: 0.14,
  evMaintenancePerKm: 0.045,
  evResidualPct: 32,
  dieselPurchasePrice: 108000,
  dieselLitersPer100Km: 26.5,
  dieselCostPerLiter: 1.42,
  adBlueAndCarbonTaxPerKm: 0.035,
  dieselMaintenancePerKm: 0.088,
  dieselResidualPct: 28,
};

export const DEFAULT_COLD_CHAIN_PROBES: ColdChainProbeReading[] = [
  { id: 'P-01', timeStamp: '08:00', locationZone: 'İstanbul Tuzla Depo Çıkışı', tempCelsius: 4.2 },
  { id: 'P-02', timeStamp: '10:00', locationZone: 'Gebze - İzmit Otoyolu', tempCelsius: 4.6 },
  { id: 'P-03', timeStamp: '12:00', locationZone: 'Bolu Dağı Tünel Geçişi', tempCelsius: 5.1 },
  { id: 'P-04', timeStamp: '14:00', locationZone: 'Kapı Açılışı - Ankara Aktarma', tempCelsius: 7.8 },
  { id: 'P-05', timeStamp: '16:00', locationZone: 'Aksaray - Niğde Koridoru', tempCelsius: 5.4 },
  { id: 'P-06', timeStamp: '18:00', locationZone: 'Pozantı Geçidi', tempCelsius: 4.9 },
  { id: 'P-07', timeStamp: '20:00', locationZone: 'Mersin Liman Gümrük Sahası', tempCelsius: 5.8 },
  { id: 'P-08', timeStamp: '22:00', locationZone: 'Mersin Soğuk Hava Teslimat', tempCelsius: 4.5 },
];

/**
 * Calculates EV vs Diesel 5-Year TCO, USP <1079> Arrhenius Mean Kinetic Temperature (MKT),
 * and EU 561/2006 Tachograph Rest/Driving Compliance.
 */
export function calculateFleetMetrics(
  tco: FleetTCOInput,
  probes: ColdChainProbeReading[],
  routeDistanceKm: number,
  avgSpeedKmh: number
): FleetEngineResult {
  const totalKmPerVehicle = Math.max(1, tco.annualKmPerVehicle * tco.holdingYears);

  // EV TCO per vehicle
  const evNetCapex = tco.evPurchasePrice - tco.evSubsidyGrant;
  const evResaleValue = tco.evPurchasePrice * (tco.evResidualPct / 100);
  const evEnergyPerKm = (tco.evKwhPer100Km / 100) * tco.electricityCostPerKwh;
  const evOpexPerYear = tco.annualKmPerVehicle * (evEnergyPerKm + tco.evMaintenancePerKm);
  const evTotal5YrPerVehicle = evNetCapex + evOpexPerYear * tco.holdingYears - evResaleValue;

  // Diesel TCO per vehicle
  const dieselNetCapex = tco.dieselPurchasePrice;
  const dieselResaleValue = tco.dieselPurchasePrice * (tco.dieselResidualPct / 100);
  const dieselFuelPerKm = (tco.dieselLitersPer100Km / 100) * tco.dieselCostPerLiter;
  const dieselOpexPerYear =
    tco.annualKmPerVehicle * (dieselFuelPerKm + tco.adBlueAndCarbonTaxPerKm + tco.dieselMaintenancePerKm);
  const dieselTotal5YrPerVehicle =
    dieselNetCapex + dieselOpexPerYear * tco.holdingYears - dieselResaleValue;

  const evFleetTotalCost = evTotal5YrPerVehicle * tco.vehicleCount;
  const dieselFleetTotalCost = dieselTotal5YrPerVehicle * tco.vehicleCount;
  const totalFleetSavings = dieselFleetTotalCost - evFleetTotalCost;

  const evCostPerKm = evTotal5YrPerVehicle / totalKmPerVehicle;
  const dieselCostPerKm = dieselTotal5YrPerVehicle / totalKmPerVehicle;

  // Break-even months
  const capexPremium = Math.max(0, evNetCapex - dieselNetCapex);
  const annualOpexSaving = Math.max(1, dieselOpexPerYear - evOpexPerYear);
  const breakEvenMonths = Math.round((capexPremium / annualOpexSaving) * 12);

  // CO2 Saved (2.68 kg CO2 per liter of diesel vs 0.38 kg CO2 per kWh grid electricity)
  const dieselCo2PerKmKg = (tco.dieselLitersPer100Km / 100) * 2.68;
  const evCo2PerKmKg = (tco.evKwhPer100Km / 100) * 0.35;
  const co2SavedTonnesTotal =
    ((dieselCo2PerKmKg - evCo2PerKmKg) * totalKmPerVehicle * tco.vehicleCount) / 1000;

  const yearlyCumulativeComparison = Array.from({ length: tco.holdingYears }, (_, idx) => {
    const yr = idx + 1;
    const isLast = yr === tco.holdingYears;
    return {
      year: yr,
      evCumulative: Math.round(
        (evNetCapex + evOpexPerYear * yr - (isLast ? evResaleValue : 0)) * tco.vehicleCount
      ),
      dieselCumulative: Math.round(
        (dieselNetCapex + dieselOpexPerYear * yr - (isLast ? dieselResaleValue : 0)) * tco.vehicleCount
      ),
    };
  });

  // USP <1079> Mean Kinetic Temperature (MKT) Formula:
  // T_K = (DeltaH / R) / -ln( (sum(exp(-DeltaH / (R * T_i)))) / n )
  // DeltaH = 83.14472 kJ/mol, R = 0.008314472 kJ/(mol*K) => DeltaH / R = 10000 K
  const deltaHOverR = 10000;
  const validProbes = probes.length > 0 ? probes : DEFAULT_COLD_CHAIN_PROBES;
  let sumExp = 0;
  let sumTemp = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let excursionCount = 0;

  for (const p of validProbes) {
    const tk = p.tempCelsius + 273.15;
    sumExp += Math.exp(-deltaHOverR / tk);
    sumTemp += p.tempCelsius;
    if (p.tempCelsius < minTemp) minTemp = p.tempCelsius;
    if (p.tempCelsius > maxTemp) maxTemp = p.tempCelsius;
    if (p.tempCelsius < 2.0 || p.tempCelsius > 8.0) {
      excursionCount++;
    }
  }

  const meanExp = sumExp / validProbes.length;
  const mktKelvin = deltaHOverR / -Math.log(meanExp);
  const mktCelsius = mktKelvin - 273.15;
  const arithmeticMeanTemp = sumTemp / validProbes.length;

  let coldChainStatus: FleetEngineResult['coldChainStatus'] = 'USP <1079> UYUMLU (2°C - 8°C)';
  if (mktCelsius > 8.0 || mktCelsius < 2.0 || maxTemp > 10.0) {
    coldChainStatus = 'KRİTİK SICAKLIK İHLALİ (EXCURSION)';
  } else if (excursionCount > 0 || mktCelsius > 7.2) {
    coldChainStatus = 'DİKKAT: MKT EŞİK SINIRINDA';
  }

  // EU EC 561/2006 Tachograph Calculation
  // Max 4.5h continuous driving -> 45m (0.75h) break; Max 9h daily driving -> 11h daily rest
  const speed = Math.max(20, avgSpeedKmh);
  const pureDrivingHours = routeDistanceKm / speed;
  const mandatory45MinBreaks = Math.floor(pureDrivingHours / 4.5);
  const dailyRestPeriods11h = Math.floor(pureDrivingHours / 9.0);
  const totalElapsedTripHours =
    pureDrivingHours + mandatory45MinBreaks * 0.75 + dailyRestPeriods11h * 11;

  return {
    evTotal5YrPerVehicle,
    dieselTotal5YrPerVehicle,
    evFleetTotalCost,
    dieselFleetTotalCost,
    totalFleetSavings,
    evCostPerKm,
    dieselCostPerKm,
    breakEvenMonths,
    co2SavedTonnesTotal,
    yearlyCumulativeComparison,
    mktCelsius,
    arithmeticMeanTemp,
    minTemp,
    maxTemp,
    excursionCount,
    coldChainStatus,
    totalRouteKm: routeDistanceKm,
    avgSpeedKmh: speed,
    pureDrivingHours,
    mandatory45MinBreaks,
    dailyRestPeriods11h,
    totalElapsedTripHours,
  };
}
