import { describe, it, expect } from 'vitest';
import { parseDollars, parseSaleDate } from '../lib/sources/valuation';
import { catchmentSql } from '../lib/sources/education';
import { lodgedSince } from '../lib/sources/da';
import { parseBand, developmentPotential } from '../lib/potential';

describe('valuation parsing', () => {
  it('parses VG dollar strings', () => {
    expect(parseDollars(' $3,150,000')).toBe(3150000);
    expect(parseDollars('$133,000,000')).toBe(133000000);
    expect(parseDollars(1234)).toBe(1234);
    expect(parseDollars(null)).toBeNull();
    expect(parseDollars('')).toBeNull();
  });
  it('parses "22 February 2019" sale dates', () => {
    expect(parseSaleDate('22 February 2019')!.toISOString()).toBe('2019-02-22T00:00:00.000Z');
    expect(parseSaleDate('6 November 2009')!.getUTCFullYear()).toBe(2009);
    expect(parseSaleDate('not a date')).toBeNull();
    expect(parseSaleDate(null)).toBeNull();
  });
});

describe('catchment SQL', () => {
  it('embeds the point and targets the catchments table', () => {
    const sql = catchmentSql(151.1497417, -33.76570143);
    expect(sql).toContain('ST_MakePoint(151.1497417, -33.76570143)');
    expect(sql).toContain('catchments_2020');
  });
});

describe('DA date floor', () => {
  it('builds a string date N years back', () => {
    expect(lodgedSince(2, new Date(Date.UTC(2026, 6, 8)))).toBe('20240101');
  });
});

describe('development potential', () => {
  it('parses EPI control bands', () => {
    expect(parseBand('0-0.39')).toEqual({ lo: 0, hi: 0.39 });
    expect(parseBand('9-9.9 metres')).toEqual({ lo: 9, hi: 9.9 });
    expect(parseBand('800-899 square metres')).toEqual({ lo: 800, hi: 899 });
    expect(parseBand(0.5)).toEqual({ lo: 0.5, hi: 0.5 });
    expect(parseBand('K')).toBeNull();
    expect(parseBand(undefined)).toBeNull();
  });

  it('computes GFA range, storeys and subdivision hint', () => {
    const r = developmentPotential({ areaM2: 1128, fsr: { lo: 0, hi: 0.39 }, heightM: { lo: 9, hi: 9.9 }, minLotM2: { lo: 800, hi: 899 } });
    expect(r.max_gfa_m2).toEqual({ min: 0, max: 440 });
    expect(r.est_max_storeys).toBe(3);
    expect(r.subdivision).toContain('unlikely');
    expect(r.notes[0]).toContain('not planning advice');
  });

  it('flags subdividable large lots', () => {
    const r = developmentPotential({ areaM2: 2000, minLotM2: { lo: 800, hi: 899 } });
    expect(r.subdivision).toContain('potentially 2 lots');
  });

  it('is honest about missing controls', () => {
    const r = developmentPotential({ areaM2: null, fsr: null, heightM: null, minLotM2: null });
    expect(r.max_gfa_m2).toBeNull();
    expect(r.est_max_storeys).toBeNull();
    expect(r.subdivision).toBeNull();
    expect(r.notes.join(' ')).toContain('area unknown');
  });
});
