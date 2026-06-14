'use client';

import { useCallback, useEffect, useRef } from 'react';
import Map, {
  Layer,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

const BASEMAP = 'https://tiles.openfreemap.org/styles/liberty';

const fillLayer = {
  id: 'parcels-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': '#4f9cff',
    'fill-opacity': 0.28,
  },
};

const lineLayer = {
  id: 'parcels-line',
  type: 'line' as const,
  paint: {
    'line-color': '#7cb6ff',
    'line-width': 1.6,
  },
};

function bboxOf(geojson: FeatureCollection): [number, number, number, number] | null {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const visit = (coords: any): void => {
    if (typeof coords?.[0] === 'number' && typeof coords?.[1] === 'number') {
      const [x, y] = coords as [number, number];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      return;
    }
    if (Array.isArray(coords)) coords.forEach(visit);
  };

  for (const f of geojson.features) {
    if (f.geometry && 'coordinates' in f.geometry) visit(f.geometry.coordinates);
  }

  if (!Number.isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

export default function MapView({ geojson }: { geojson: FeatureCollection | null }) {
  const mapRef = useRef<MapRef | null>(null);

  // Fit the map to new parcels whenever they arrive.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson || geojson.features.length === 0) return;
    const bbox = bboxOf(geojson);
    if (!bbox) return;
    map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
      padding: 80,
      maxZoom: 17,
      duration: 800,
    });
  }, [geojson]);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const p = feature.properties ?? {};
    const map = e.target;
    new maplibregl.Popup({ closeButton: true, offset: 8 })
      .setLngLat(e.lngLat)
      .setHTML(
        `<div style="font-family:sans-serif;font-size:12px;line-height:1.5;color:#0b0f17">
           <strong>${p.lotidstring ?? 'Parcel'}</strong><br/>
           Plan: ${p.planlabel ?? '—'}<br/>
           Area: ${p.planlotarea ?? '—'} ${p.planlotareaunits ?? 'm²'}
         </div>`,
      )
      .addTo(map);
  }, []);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 147.0, latitude: -33.0, zoom: 5.5 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={BASEMAP}
      interactiveLayerIds={['parcels-fill']}
      onClick={onClick}
    >
      {geojson && geojson.features.length > 0 && (
        <Source id="parcels" type="geojson" data={geojson}>
          <Layer {...fillLayer} />
          <Layer {...lineLayer} />
        </Source>
      )}
    </Map>
  );
}
