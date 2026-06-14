'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { FeatureCollection } from 'geojson';
import Chat from '@/components/Chat';

// MapLibre touches `window`, so load it only on the client.
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});

export default function Page() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);

  return (
    <main className="layout">
      <section className="pane-chat">
        <Chat onGeojson={(g) => setGeojson(g)} />
      </section>
      <section className="pane-map">
        <MapView geojson={geojson} />
      </section>

      <style jsx>{`
        .layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }
        .pane-chat {
          width: 40%;
          max-width: 460px;
          min-width: 320px;
          height: 100%;
        }
        .pane-map {
          flex: 1;
          height: 100%;
          position: relative;
        }
        .map-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--muted);
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}
