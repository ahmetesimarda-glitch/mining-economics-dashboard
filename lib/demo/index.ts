export { DEMO_PROJECT_ID, DEMO_STORAGE_KEYS, isDemoProjectId } from './constants';
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
export { COPPER_MINE_DEMO, type DemoProjectDefinition } from './copper-mine-demo';
export { ensureCopperMineDemo } from './ensure-demo-project';
