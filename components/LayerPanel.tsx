'use client';
import type { LayerName } from '@/types/nsw';
const LAYERS: LayerName[] = ['parcels','zoning','bushfire','flood','suburbs'];
export default function LayerPanel({ active, onToggle }: { active: Set<LayerName>; onToggle: (l: LayerName) => void }) {
  return (
    <div className="layer-panel">
      {LAYERS.map((l) => (
        <label key={l}><input type="checkbox" checked={active.has(l)} onChange={() => onToggle(l)} /> {l}</label>
      ))}
      <style jsx>{`.layer-panel{position:absolute;top:12px;right:12px;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;font-size:13px;z-index:2;text-transform:capitalize}`}</style>
    </div>
  );
}
