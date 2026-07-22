import type { CompactEquipmentSpec } from '../helpers';
import { SURFACE_TRUCKS } from './surface-trucks';
import { SURFACE_EXCAVATORS } from './surface-excavators';
import { SURFACE_LOADERS } from './surface-loaders';
import { SURFACE_DOZERS_GRADERS } from './surface-dozers-graders';
import { SURFACE_DRILLS_SUPPORT } from './surface-drills-support';
import { UNDERGROUND_EQUIPMENT } from './underground';
import { PROCESSING_EQUIPMENT } from './processing';

export { SURFACE_TRUCKS } from './surface-trucks';
export { SURFACE_EXCAVATORS } from './surface-excavators';
export { SURFACE_LOADERS } from './surface-loaders';
export { SURFACE_DOZERS_GRADERS } from './surface-dozers-graders';
export { SURFACE_DRILLS_SUPPORT } from './surface-drills-support';
export { UNDERGROUND_EQUIPMENT } from './underground';
export { PROCESSING_EQUIPMENT } from './processing';

export const ALL_COMPACT_EQUIPMENT: CompactEquipmentSpec[] = [
  ...SURFACE_TRUCKS,
  ...SURFACE_EXCAVATORS,
  ...SURFACE_LOADERS,
  ...SURFACE_DOZERS_GRADERS,
  ...SURFACE_DRILLS_SUPPORT,
  ...UNDERGROUND_EQUIPMENT,
  ...PROCESSING_EQUIPMENT,
];
