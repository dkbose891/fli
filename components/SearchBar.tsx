'use client';

import { useState } from 'react';
import type { FeatureCollection } from 'geojson';
import type { ParcelRef } from '@/types/nsw';
import { isInNSW } from '@/lib/geo';

interface Match { sla: string; pid: string }

export default function SearchBar({ onSelectParcel }: {
  onSelectParcel: (p: ParcelRef, g: FeatureCollection) => void;
}) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search fires on submit only (no per-keystroke autocomplete) — the Addressr
  // API quota is small, so every call has to be deliberate.
  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/address?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Search failed.');
        setMatches([]);
      } else {
        setMatches(data.results ?? []);
        setOpen(true);
        if ((data.results ?? []).length === 0) setError('No addresses matched.');
      }
    } catch {
      setError('Network error — could not search.');
    } finally {
      setLoading(false);
    }
  }

  async function pick(m: Match) {
    setOpen(false);
    setQuery(m.sla);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/address?id=${encodeURIComponent(m.pid)}`);
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Could not resolve that address.'); return; }
      const { lng, lat } = d as { lng: number; lat: number };
      if (!isInNSW(lng, lat)) { setError('That address is outside NSW.'); return; }
      const pr = await fetch(`/api/layer/parcels?point=${lng},${lat}`);
      const pd = await pr.json();
      const f = pd.geojson?.features?.[0];
      if (!pr.ok || !f) { setError('No parcel found at that address.'); return; }
      const p = f.properties ?? {};
      onSelectParcel(
        { lotidstring: p.lotidstring, planlabel: p.planlabel, planlotarea: p.planlotarea, point: { lng, lat }, address: m.sla },
        pd.geojson,
      );
    } catch {
      setError('Network error — could not resolve the address.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-bar">
      <form onSubmit={search}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a NSW address — e.g. 26 Calvert Avenue Killara"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !query.trim()}>{loading ? '…' : 'Search'}</button>
      </form>
      {open && matches.length > 0 && (
        <ul className="results">
          {matches.map((m) => (
            <li key={m.pid}>
              <button type="button" onClick={() => pick(m)}>{m.sla}</button>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="search-error">{error}</div>}
      <style jsx>{`
        .search-bar {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: min(440px, calc(100% - 220px));
          z-index: 3;
        }
        form {
          display: flex;
          gap: 6px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 6px;
        }
        input {
          flex: 1;
          background: var(--panel-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 11px;
          color: var(--text);
          font-size: 13px;
          outline: none;
        }
        input:focus { border-color: var(--accent); }
        button[type='submit'] {
          background: var(--accent);
          color: #06101f;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 13px;
          cursor: pointer;
        }
        button[type='submit']:disabled { opacity: 0.45; cursor: default; }
        .results {
          list-style: none;
          margin: 6px 0 0;
          padding: 4px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          max-height: 240px;
          overflow-y: auto;
        }
        .results li button {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          color: var(--text);
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 7px;
          cursor: pointer;
        }
        .results li button:hover { background: var(--accent-soft); }
        .search-error {
          margin-top: 6px;
          background: rgba(255, 107, 107, 0.12);
          border: 1px solid rgba(255, 107, 107, 0.4);
          color: var(--danger);
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 12.5px;
        }
      `}</style>
    </div>
  );
}
