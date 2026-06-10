import { mainCamp } from './mainCamp';
import { showerHouse } from './showerHouse';
import type { MapDefinition } from '../types';

export const maps: Record<string, MapDefinition> = {
  [mainCamp.id]: mainCamp,
  [showerHouse.id]: showerHouse,
};

export { mainCamp, showerHouse };
