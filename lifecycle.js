export function createResourceLifecycle({ resourceNodes, eventBus }) {
  function ensure(state) { if (!Number.isInteger(state.worldTime)) state.worldTime = 0; if (!state.resourceRespawns) state.resourceRespawns = {}; }
  function advanceTime(state, amount = 1) { ensure(state); state.worldTime += amount; const respawned = []; Object.values(resourceNodes).forEach(node => { const at = state.resourceRespawns[node.id]; if (at !== undefined && state.worldTime >= at) { state.resources[node.id] = node.maxQuantity; delete state.resourceRespawns[node.id]; respawned.push(node.id); eventBus.emit('resource_respawned', { node, quantity: node.maxQuantity }); } }); return respawned; }
  function consume(state, node) { ensure(state); if ((state.resources[node.id] ?? 0) <= 0) return false; state.resources[node.id] -= 1; if (state.resources[node.id] === 0 && node.respawnTime > 0) state.resourceRespawns[node.id] = state.worldTime + node.respawnTime; eventBus.emit('resource_quantity_changed', { node, quantity: state.resources[node.id], respawnAt: state.resourceRespawns[node.id] ?? null }); return true; }
  function refill(state) { ensure(state); Object.values(resourceNodes).forEach(node => { state.resources[node.id] = node.maxQuantity; delete state.resourceRespawns[node.id]; }); eventBus.emit('resources_refilled'); }
  return { ensure, advanceTime, consume, refill };
}
