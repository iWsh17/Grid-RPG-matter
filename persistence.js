export const SAVE_KEY = 'grid-rpg-foundation-save';
export const SAVE_VERSION = 2;

const clone = value => JSON.parse(JSON.stringify(value));

function defaultStats() {
  return { movesAttempted: 0, movesSuccessful: 0, resourcesGathered: 0 };
}

export function createSavePayload(state) {
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: clone({
      player: state.player,
      inventory: state.inventory,
      skills: state.skills,
      capabilities: state.capabilities,
      resources: state.resources,
      resourceRespawns: state.resourceRespawns ?? {},
      worldTime: state.worldTime ?? 0,
      stats: state.stats ?? defaultStats(),
      actionLog: state.actionLog ?? [],
      lastAction: state.lastAction ?? 'Saved'
    })
  };
}

function normalizeState(savedState) {
  return {
    player: clone(savedState.player),
    inventory: clone(savedState.inventory ?? {}),
    skills: clone(savedState.skills ?? {}),
    capabilities: clone(savedState.capabilities ?? {}),
    resources: clone(savedState.resources ?? {}),
    resourceRespawns: clone(savedState.resourceRespawns ?? {}),
    worldTime: Number.isFinite(savedState.worldTime) ? savedState.worldTime : 0,
    stats: clone(savedState.stats ?? defaultStats()),
    actionLog: clone(savedState.actionLog ?? []),
    lastAction: savedState.lastAction ?? 'Loaded save'
  };
}

export function validateSavePayload(payload) {
  if (!payload || typeof payload !== 'object') return { valid: false, code: 'INVALID_SAVE', message: 'Save is not an object.' };
  if (![1, SAVE_VERSION].includes(payload.version)) return { valid: false, code: 'SAVE_VERSION_MISMATCH', message: `Save version ${payload.version} is not supported.` };
  if (!payload.state || typeof payload.state !== 'object') return { valid: false, code: 'INVALID_SAVE', message: 'Save is missing state.' };
  if (!payload.state.player || !payload.state.resources) return { valid: false, code: 'INVALID_SAVE', message: 'Save is missing player or resource state.' };
  return { valid: true, code: 'SAVE_VALID', message: 'Save is valid.' };
}

export function saveGame(state) {
  const payload = createSavePayload(state);
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  return payload;
}

export function readSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { success: false, code: 'NO_SAVE', message: 'No save data exists.' };
  try {
    const payload = JSON.parse(raw);
    const validation = validateSavePayload(payload);
    if (!validation.valid) return { success: false, code: validation.code, message: validation.message };
    return { success: true, code: 'SAVE_READ', message: 'Save data read successfully.', savedAt: payload.savedAt, state: normalizeState(payload.state) };
  } catch (error) {
    return { success: false, code: 'INVALID_SAVE', message: `Save could not be read: ${error.message}` };
  }
}

export function applyLoadedState(state, savedState) {
  const normalized = normalizeState(savedState);
  Object.assign(state, normalized);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
