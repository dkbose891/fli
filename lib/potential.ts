// Indicative development potential — arithmetic on published planning
// controls. The EPI map layers publish *bands* (e.g. FSR "0-0.39", min lot
// "800-899 square metres"), so results are ranges, not point values.

export interface Band { lo: number; hi: number }

// "0-0.39" -> {0, 0.39} · "9-9.9 metres" -> {9, 9.9} · "K" / junk -> null
export function parseBand(s: unknown): Band | null {
  if (typeof s === 'string') {
    const nums = (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (nums.length > 0) return { lo: nums[0], hi: nums[nums.length - 1] };
    return null;
  }
  if (typeof s === 'number' && Number.isFinite(s)) return { lo: s, hi: s };
  return null;
}

export interface PotentialInput {
  areaM2?: number | null;
  fsr?: Band | null;       // ratio
  heightM?: Band | null;   // metres
  minLotM2?: Band | null;  // square metres
}

const STOREY_M = 3; // rule-of-thumb metres per storey

export function developmentPotential({ areaM2, fsr, heightM, minLotM2 }: PotentialInput) {
  const notes: string[] = ['Indicative arithmetic on published planning controls (which are banded ranges) — not planning advice.'];

  let max_gfa_m2: { min: number; max: number } | null = null;
  if (areaM2 && fsr) {
    max_gfa_m2 = { min: Math.round(areaM2 * fsr.lo), max: Math.round(areaM2 * fsr.hi) };
  } else {
    notes.push(areaM2 ? 'No FSR control mapped here — GFA not computable.' : 'Lot area unknown — GFA not computable.');
  }

  let est_max_storeys: number | null = null;
  if (heightM) {
    est_max_storeys = Math.max(1, Math.floor(heightM.hi / STOREY_M));
  } else {
    notes.push('No height control mapped here.');
  }

  let subdivision: string | null = null;
  if (areaM2 && minLotM2) {
    const lots = Math.floor(areaM2 / minLotM2.hi);
    subdivision =
      lots >= 2
        ? `potentially ${lots} lots (area ${Math.round(areaM2)} m² vs minimum lot size ~${minLotM2.hi} m²) — subject to frontage, services and council`
        : `unlikely — area ${Math.round(areaM2)} m² is below 2× the minimum lot size (~${minLotM2.hi} m²)`;
  } else if (areaM2) {
    notes.push('No minimum lot size control mapped here — subdivision potential not computable.');
  }

  return { lot_area_m2: areaM2 ? Math.round(areaM2) : null, max_gfa_m2, est_max_storeys, subdivision, notes };
}
