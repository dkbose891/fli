'use client';
import { useState, useCallback } from 'react';
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
