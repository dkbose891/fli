import { describe, it, expect } from 'vitest';
import { areaM2, isInNSW, representativePoint } from '../lib/geo';

describe('isInNSW', () => {
  it('accepts a Sydney point', () => {
    expect(isInNSW(151.2093, -33.8688)).toBe(true);
  });
  it('rejects a Brisbane (QLD) point', () => {
    expect(isInNSW(153.0251, -27.4698)).toBe(false);
  });
  it('rejects a Melbourne (VIC) point', () => {
    expect(isInNSW(144.9631, -37.8136)).toBe(false);
  });
});

describe('representativePoint', () => {
  it('returns the first ring vertex of a Polygon', () => {
    expect(representativePoint({ type: 'Polygon', coordinates: [[[151, -33], [151.1, -33], [151.1, -33.1], [151, -33]]] } as any))
      .toEqual({ lng: 151, lat: -33 });
  });
  it('handles a MultiPolygon', () => {
    expect(representativePoint({ type: 'MultiPolygon', coordinates: [[[[151, -33], [151.1, -33], [151, -33]]]] } as any))
      .toEqual({ lng: 151, lat: -33 });
  });
  it('handles a Point', () => {
    expect(representativePoint({ type: 'Point', coordinates: [151, -33] } as any)).toEqual({ lng: 151, lat: -33 });
  });
  it('returns null for null geometry', () => {
    expect(representativePoint(null)).toBeNull();
  });
});

describe('areaM2', () => {
  // The real 48//DP6050 boundary (26 Calvert Ave Killara) — cadastre reports
  // planlotarea = null for this 1900s plan, which is why we compute it.
  const calvert: import('geojson').Geometry = { type: 'Polygon', coordinates: [[
    [151.15006778773997, -33.765702159011056],
    [151.14999069769098, -33.76552546014919],
    [151.14941555020746, -33.76570284885372],
    [151.14943285063694, -33.76574378760055],
    [151.14949080320173, -33.76587681318866],
    [151.15006778773997, -33.765702159011056],
  ]] };

  it('computes a plausible suburban lot area for 48//DP6050', () => {
    const a = areaM2(calvert)!;
    expect(a).toBeGreaterThan(700);
    expect(a).toBeLessThan(1600);
  });

  it('~12.4k m2 for a 0.001 deg square at the equator', () => {
    const d = 0.001;
    const sq: import('geojson').Geometry = { type: 'Polygon', coordinates: [[[0,0],[d,0],[d,d],[0,d],[0,0]]] };
    expect(areaM2(sq)!).toBeGreaterThan(12000);
    expect(areaM2(sq)!).toBeLessThan(12800);
  });

  it('subtracts holes and handles MultiPolygon', () => {
    const d = 0.001;
    const outer = [[0,0],[d,0],[d,d],[0,d],[0,0]];
    const hole = [[d*0.25,d*0.25],[d*0.75,d*0.25],[d*0.75,d*0.75],[d*0.25,d*0.75],[d*0.25,d*0.25]];
    const withHole = areaM2({ type:'Polygon', coordinates:[outer, hole] } as any)!;
    const solid = areaM2({ type:'Polygon', coordinates:[outer] } as any)!;
    expect(withHole).toBeCloseTo(solid * 0.75, -2);
    const multi = areaM2({ type:'MultiPolygon', coordinates:[[outer],[outer]] } as any)!;
    expect(multi).toBeCloseTo(solid * 2, -2);
  });

  it('returns null for points and null geometry', () => {
    expect(areaM2({ type:'Point', coordinates:[151,-33] } as any)).toBeNull();
    expect(areaM2(null)).toBeNull();
  });
});
