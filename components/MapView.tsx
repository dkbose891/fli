'use client';
import { useCallback, useEffect, useRef } from 'react';
import Map, { Layer, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';
import type { LayerName, ParcelRef } from '@/types/nsw';
import { isInNSW } from '@/lib/geo';
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
    const g: any = f.geometry;
    const coords: number[] | undefined = g?.type === 'Polygon' ? g.coordinates?.[0]?.[0] : g?.type === 'MultiPolygon' ? g.coordinates?.[0]?.[0]?.[0] : g?.coordinates;
    if (coords) mapRef.current.flyTo({ center: [coords[0], coords[1]], zoom: Math.max(16, mapRef.current.getZoom() ?? 11), duration: 800 });
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
      onSelectParcel(
        { lotidstring: p.lotidstring, planlabel: p.planlabel, planlotarea: p.planlotarea, point: { lng, lat } },
        d.geojson,
      );
    } catch { /* ignore click misses */ }
  }, [onSelectParcel]);

  return (
    <div ref={wrapRef} style={{ position:'absolute', inset:0 }}>
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
