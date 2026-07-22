export {
  DEMO_PROJECT_ID,
  DEMO_PROJECT_IDS,
  DEMO_STORAGE_KEYS,
  isDemoProjectId,
  type DemoProjectId,
} from './constants';
export {
  isWelcomeDismissed,
  dismissWelcomePermanently,
  getLastOpenedProjectId,
  setLastOpenedProjectId,
  getCreatedProjectIds,
  trackCreatedProjectId,
  untrackCreatedProjectId,
  filterDemoWorkspaceProjects,
} from './storage';
export type { DemoProjectDefinition, DemoAccent } from './types';
export {
  DEMO_PROJECTS,
  getDemoProjectById,
  COPPER_MINE_DEMO,
} from './catalog';
export {
  ensureDemoProject,
  ensureAllDemoProjects,
  ensureCopperMineDemo,
} from './ensure-demo-project';
