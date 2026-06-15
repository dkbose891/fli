'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { FeatureCollection } from 'geojson';
import type { LayerName, ParcelRef } from '@/types/nsw';
import Chat from '@/components/Chat';
import LayerPanel from '@/components/LayerPanel';
const MapView = dynamic(() => import('@/components/MapView'), { ssr:false });

// Overlay layers fetched in parallel on parcel select (parcels = the selection itself).
const OVERLAY_LAYERS: LayerName[] = ['zoning', 'bushfire', 'flood', 'suburbs'];

export default function Page() {
  const [layers, setLayers] = useState<Record<string, FeatureCollection>>({});
  const [active, setActive] = useState<Set<LayerName>>(new Set(['parcels']));
  const [selected, setSelected] = useState<ParcelRef | null>(null);
  const [selectedGeo, setSelectedGeo] = useState<FeatureCollection | null>(null);

  const toggle = useCallback((l: LayerName) => setActive((s) => { const n = new Set(s); n.has(l) ? n.delete(l) : n.add(l); return n; }), []);
  const onAgentLayers = useCallback((l: Record<string, FeatureCollection>) => {
    if (!l || Object.keys(l).length === 0) return;
    setLayers((p) => ({ ...p, ...l }));
    setActive((s) => new Set([...s, ...(Object.keys(l) as LayerName[])]));
  }, []);
  // On selecting a parcel, eagerly fetch ALL overlay layers at that point in
  // parallel (0 tokens, via the deterministic proxy). Display stays gated by the
  // toggle panel, so flipping a checkbox is instant — the data is already loaded.
  const onSelectParcel = useCallback(async (p: ParcelRef, g: FeatureCollection) => {
    setSelected(p); setSelectedGeo(g);
    setLayers((prev) => ({ ...prev, parcels: g }));
    setActive((s) => new Set([...s, 'parcels']));
    if (!p.point) return;
    const { lng, lat } = p.point;
    const results = await Promise.all(
      OVERLAY_LAYERS.map(async (name) => {
        try {
          const r = await fetch(`/api/layer/${name}?point=${lng},${lat}`);
          if (!r.ok) return [name, null] as const;
          const d = await r.json();
          return [name, (d.geojson ?? null) as FeatureCollection | null] as const;
        } catch {
          return [name, null] as const;
        }
      }),
    );
    setLayers((prev) => {
      const next = { ...prev };
      for (const [name, gj] of results) if (gj) next[name] = gj;
      return next;
    });
  }, []);

  return (
    <main style={{ display:'flex', height:'100vh' }}>
      <section style={{ width:'40%', maxWidth:460, minWidth:320, height:'100%' }}>
        <Chat selectedParcel={selected} onAgentLayers={onAgentLayers} />
      </section>
      <section style={{ flex:1, position:'relative', height:'100%' }}>
        <LayerPanel active={active} onToggle={toggle} />
        <MapView layers={layers} activeLayers={active} selectedGeo={selectedGeo} onSelectParcel={onSelectParcel} />
      </section>
    </main>
  );
}
