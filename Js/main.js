/**
 * Main - Game initialization with tools
 */

import EventBus from './core/EventBus.js';
import GameState from './core/GameState.js';
import { SkillsSystem } from './systems/SkillsSystem.js';
import InventorySystem from './systems/InventorySystem.js';
import CraftingSystem from './systems/CraftingSystem.js';
import ToolSystem from './systems/ToolSystem.js';
import { RESOURCE_NODES } from '../content.js';

window.EventBus = EventBus;
window.GameState = GameState;
window.SkillsSystem = SkillsSystem;
window.InventorySystem = InventorySystem;
window.CraftingSystem = CraftingSystem;
window.ToolSystem = ToolSystem;

async function initialize() {
  console.log('[Main] Initializing...');
  
  SkillsSystem.initialize({ 
    skills: [
      { id: 'fishing', name: 'Fishing', xpPerLevel: 100, maxLevel: 10 },
      { id: 'mining', name: 'Mining', xpPerLevel: 100, maxLevel: 10 },
      { id: 'woodcutting', name: 'Woodcutting', xpPerLevel: 100, maxLevel: 10 }
    ] 
  });
  
  InventorySystem.initialize({ 
    resources: Object.values(window.ITEMS || {}).map(item => ({
      id: item.id,
      stackSize: item.stackSize || 999
    }))
  });
  
  CraftingSystem.initialize();
  ToolSystem.initialize();
  
  const state = {
    player: { x: 1, y: 1, id: 'player_1', equippedTool: null },
    inventory: {},
    storage: {},
    toolDurability: {},
    skills: {
      fishing: { xp: 0, level: 0, totalXp: 0 },
      mining: { xp: 0, level: 0, totalXp: 0 },
      woodcutting: { xp: 0, level: 0, totalXp: 0 }
    },
    capabilities: {},
    resourceNodes: RESOURCE_NODES.map(node => ({
      id: node.id,
      x: node.x,
      y: node.y,
      quantity: node.maxQuantity,
      lastDepleted: null
    }))
  };
  
  window.state = state;
  
  console.log('[Main] ✅ Ready');
  console.log('[Main] Resource nodes:', state.resourceNodes.length);
  
  EventBus.emit('game.initialized', { state });
  return { state };
}

window.showState = () => { console.log(window.state); return window.state; };
window.saveGame = () => GameState.save(window.state);
window.resetGame = () => { GameState.clear(); location.reload(); };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}