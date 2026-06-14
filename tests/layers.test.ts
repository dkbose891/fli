import { describe, it, expect } from 'vitest';
import { LAYER_REGISTRY } from '../lib/layers';
it('exposes the 5 toggle layers with point queriers', () => {
  expect(Object.keys(LAYER_REGISTRY).sort()).toEqual(['bushfire','flood','parcels','suburbs','zoning']);
  for (const name of Object.keys(LAYER_REGISTRY)) expect(typeof LAYER_REGISTRY[name as keyof typeof LAYER_REGISTRY].atPoint).toBe('function');
});
