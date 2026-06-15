'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { FeatureCollection } from 'geojson';
import type { LayerName, ParcelRef } from '@/types/nsw';
import Chat from '@/components/Chat';
import LayerPanel from '@/components/LayerPanel';
const MapView = dynamic(() => import('@/components/MapView'), { ssr:false });

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
  const onSelectParcel = useCallback((p: ParcelRef, g: FeatureCollection) => {
    setSelected(p); setSelectedGeo(g);
    setLayers((prev) => ({ ...prev, parcels: g }));
    setActive((s) => new Set([...s, 'parcels']));
  }, []);

  // Fetch a single layer's data at a point via the deterministic proxy (0 tokens).
  const fetchLayerAt = useCallback(async (name: LayerName, lng: number, lat: number) => {
    try {
      const r = await fetch(`/api/layer/${name}?point=${lng},${lat}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.geojson) setLayers((p) => ({ ...p, [name]: d.geojson }));
    } catch { /* ignore layer fetch misses */ }
  }, []);

  // When a parcel is selected (or a layer is toggled on), load each active
  // overlay layer at the selected point. Cached per layer+point to avoid refetch.
  const fetchedRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const pt = selected?.point;
    if (!pt) return;
    const key = `${pt.lng},${pt.lat}`;
    active.forEach((name) => {
      if (name === 'parcels') return; // the selection itself is the parcel layer
      if (fetchedRef.current[name] === key) return;
      fetchedRef.current[name] = key;
      fetchLayerAt(name, pt.lng, pt.lat);
    });
  }, [selected, active, fetchLayerAt]);

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
