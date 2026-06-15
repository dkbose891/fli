import { describe, it, expect } from 'vitest';
import { isInNSW, representativePoint } from '../lib/geo';

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
