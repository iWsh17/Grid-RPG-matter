/**
 * WorldSystem - World management, resource respawn, area buffs (pure functions)
 */

export const WorldSystem = {
  advanceTime(state, amount = 1) {
    state.worldTime += amount;
    const respawned = [];

    Object.entries(state.resources).forEach(([nodeId, quantity]) => {
      const respawnAt = state.resourceRespawns[nodeId];
      if (respawnAt !== undefined && state.worldTime >= respawnAt) {
        state.resources[nodeId] = state.resourceNodes[nodeId]?.maxQuantity || quantity;
        delete state.resourceRespawns[nodeId];
        respawned.push(nodeId);
        
        window.EventBus.emit('resource.respawned', { nodeId, quantity: state.resources[nodeId] });
      }
    });

    return respawned;
  },

  consumeResource(state, nodeId) {
    const current = state.resources[nodeId] || 0;
    if (current <= 0) return false;

    state.resources[nodeId] = current - 1;
    
    const node = state.resourceNodes[nodeId];
    if (state.resources[nodeId] === 0 && node?.respawnTime > 0) {
      state.resourceRespawns[nodeId] = state.worldTime + node.respawnTime;
    }

    window.EventBus.emit('resource.consumed', { nodeId, quantity: state.resources[nodeId] });
    return true;
  },

  addAreaBuff(state, playerId, skillId, effect, position, duration) {
    const buffId = `buff_${Date.now()}`;
    const expiresAt = state.worldTime + duration;

    const buff = {
      id: buffId,
      playerId,
      skillId,
      effect,
      position: { ...position },
      expiresAt,
      radius: effect.radius
    };

    if (!state.buffs) state.buffs = [];
    state.buffs.push(buff);

    console.log(`[WorldSystem] Added area buff ${buffId} at ${position.x},${position.y}`);
    return buffId;
  },

  getBuffsAt(state, x, y) {
    if (!state.buffs) return [];
    const now = state.worldTime;
    
    return state.buffs.filter(buff => {
      const dx = buff.position.x - x;
      const dy = buff.position.y - y;
      const inRadius = dx * dx + dy * dy <= buff.radius * buff.radius;
      const active = buff.expiresAt > now;
      return inRadius && active;
    });
  },

  cleanupBuffs(state) {
    if (!state.buffs) return 0;
    const now = state.worldTime;
    const before = state.buffs.length;
    state.buffs = state.buffs.filter(b => b.expiresAt > now);
    return before - state.buffs.length;
  }
};

export default WorldSystem;
window.WorldSystem = WorldSystem;