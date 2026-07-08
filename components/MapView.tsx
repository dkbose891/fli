'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Layer, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';
import type { LayerName, ParcelRef } from '@/types/nsw';
import { areaM2, isInNSW, representativePoint } from '@/lib/geo';
import 'maplibre-gl/dist/maplibre-gl.css';

const BASEMAP = 'https://tiles.openfreemap.org/styles/liberty';
const COLOURS: Record<string, string> = { parcels:'#4f9cff', zoning:'#7f77dd', bushfire:'#d85a30', flood:'#1d9e75', suburbs:'#888780' };

export default function MapView({ layers, activeLayers, selectedGeo, onSelectParcel }:{
  layers: Record<string, FeatureCollection>;
  activeLayers: Set<LayerName>;
  selectedGeo: FeatureCollection | null;
  onSelectParcel: (p: ParcelRef, g: FeatureCollection) => void;
}) {
  const mapRef = useRef<MapRef | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [is3D, setIs3D] = useState(false);

  // The Liberty basemap already contains a `building-3d` fill-extrusion layer
  // (zoom >= 14), so "3D" is just a camera pitch — no extra layers or sources.
  const toggle3D = useCallback(() => {
    setIs3D((v) => {
      mapRef.current?.easeTo({ pitch: v ? 0 : 55, duration: 600 });
      return !v;
    });
  }, []);

  // MapLibre can initialise before the flex layout gives its container full
  // height, freezing the canvas small. Observe the wrapper and resize the map
  // whenever its box changes (the observer also fires once on attach).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const onLoad = useCallback(() => {
    requestAnimationFrame(() => mapRef.current?.resize());
  }, []);

  // Fly to a newly selected parcel.
  useEffect(() => {
    const f = selectedGeo?.features?.[0];
    if (!f || !mapRef.current) return;
    const c = representativePoint(f.geometry);
    if (c) mapRef.current.flyTo({ center: [c.lng, c.lat], zoom: Math.max(16, mapRef.current.getZoom() ?? 11), duration: 800 });
  }, [selectedGeo]);

  const onClick = useCallback(async (e: MapLayerMouseEvent) => {
    const { lng, lat } = e.lngLat;
    if (!isInNSW(lng, lat)) return; // only NSW is covered by these datasets
    try {
      const r = await fetch(`/api/layer/parcels?point=${lng},${lat}`);
      const d = await r.json();
      const f = d.geojson?.features?.[0];
      if (!f) return;
      const p = f.properties ?? {};
      const area = p.planlotarea ?? (areaM2(f.geometry) ? Math.round(areaM2(f.geometry)!) : null);
      onSelectParcel(
        { lotidstring: p.lotidstring, planlabel: p.planlabel, planlotarea: area, point: { lng, lat } },
        d.geojson,
      );
    } catch { /* ignore click misses */ }
  }, [onSelectParcel]);

  return (
    <div ref={wrapRef} style={{ position:'absolute', inset:0 }}>
      <button
        onClick={toggle3D}
        title={is3D ? 'Back to 2D' : 'Tilt to 3D (right-click-drag to rotate)'}
        style={{
          position:'absolute', top:12, left:12, zIndex:2,
          background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)',
          borderRadius:10, padding:'8px 12px', fontSize:13, fontWeight:600, cursor:'pointer',
        }}
      >
        {is3D ? '2D' : '3D'}
      </button>
      <Map ref={mapRef} initialViewState={{ longitude:151.2093, latitude:-33.8688, zoom:11 }}
           style={{ position:'absolute', inset:0 }} mapStyle={BASEMAP} cursor="pointer" onClick={onClick} onLoad={onLoad}>
        {[...activeLayers].map((name) => layers[name] && (
          <Source key={name} id={name} type="geojson" data={layers[name]}>
            <Layer id={`${name}-fill`} type="fill" paint={{ 'fill-color': COLOURS[name], 'fill-opacity': 0.28 }} />
            <Layer id={`${name}-line`} type="line" paint={{ 'line-color': COLOURS[name], 'line-width': 1.4 }} />
          </Source>
        ))}
        {selectedGeo && (
          <Source id="selected" type="geojson" data={selectedGeo}>
            <Layer id="selected-line" type="line" paint={{ 'line-color':'#ffd166', 'line-width':3 }} />
          </Source>
        )}
      </Map>
    </div>
  );
}
