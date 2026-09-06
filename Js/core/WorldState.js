/**
 * WorldState - Manage global world state including area buffs
 */

class WorldStateClass {
  constructor() {
    this.areaBuffs = new Map(); // position key -> array of buffs
    this.buffIdCounter = 0;
  }

  getBuffsAt(x, y) {
    const key = `${x},${y}`;
    return this.areaBuffs.get(key) || [];
  }

  addAreaBuff(playerId, skillId, effect, position, duration) {
    const buffId = `buff_${this.buffIdCounter++}`;
    const expiresAt = Date.now() + (duration * 1000);
    
    const buff = {
      id: buffId,
      playerId,
      skillId,
      effect,
      position: { ...position },
      expiresAt,
      radius: effect.radius
    };

    // Add to all cells in radius
    for (let dx = -effect.radius; dx <= effect.radius; dx++) {
      for (let dy = -effect.radius; dy <= effect.radius; dy++) {
        if (dx * dx + dy * dy <= effect.radius * effect.radius) {
          const x = position.x + dx;
          const y = position.y + dy;
          const key = `${x},${y}`;
          
          if (!this.areaBuffs.has(key)) {
            this.areaBuffs.set(key, []);
          }
          this.areaBuffs.get(key).push(buff);
        }
      }
    }

    console.log(`[WorldState] Added area buff ${buffId} (${effect.name}) at ${position.x},${position.y}`);
    return buffId;
  }

  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, buffs] of this.areaBuffs.entries()) {
      const active = buffs.filter(b => b.expiresAt > now);
      cleaned += buffs.length - active.length;
      
      if (active.length === 0) {
        this.areaBuffs.delete(key);
      } else {
        this.areaBuffs.set(key, active);
      }
    }

    if (cleaned > 0) {
      console.log(`[WorldState] Cleaned up ${cleaned} expired buffs`);
    }
  }
}

// Create and expose singleton
window.WorldState = new WorldStateClass();
console.log('[WorldState] Module loaded');