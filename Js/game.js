/**
 * game.js - Movement and gathering with resource nodes and action timers
 */


import { GRIDS, ITEMS, RESOURCE_NODES } from '../content.js';


// Grid management
let currentGridId = 'meadow_01';
let currentGrid = GRIDS[currentGridId];


// DOM elements
const elements = {
  grid: document.querySelector('#grid'),
  inspector: document.querySelector('#state-inspector'),
  consoleOutput: document.querySelector('#console-output'),
  consoleForm: document.querySelector('#console-form'),
  consoleInput: document.querySelector('#console-input'),
  resetButton: document.querySelector('#reset-button'),
  statusBadge: document.querySelector('#status-badge')
};


// Get systems from window
const SkillsSystem = window.SkillsSystem;
const InventorySystem = window.InventorySystem;


// State
let state = null;


// Action timer state
let currentAction = null; // { type: 'gathering', nodeId, startTime, duration, onComplete }


// ============ UI Functions ============


function setStatus(message) {
  elements.statusBadge.textContent = message;
}


function inventoryText() {
  if (!state?.inventory) return 'Empty';
  const entries = Object.entries(state.inventory)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => `${ITEMS[id]?.name ?? id}: ${amount}`);
  return entries.length ? entries.join(', ') : 'Empty';
}


function render() {
  if (!elements.grid) return;
  
  elements.grid.replaceChildren();
  for (let y = 0; y < currentGrid.height; y++) {
    for (let x = 0; x < currentGrid.width; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      
      const isBlocked = currentGrid.blockedCells?.some(([bx, by]) => bx === x && by === y);
      if (isBlocked) {
        cell.classList.add('blocked');
        cell.title = 'Blocked';
      }
      
      const nodeState = state.resourceNodes?.find(n => n.x === x && n.y === y);
      if (nodeState) {
        const nodeDef = RESOURCE_NODES.find(n => n.id === nodeState.id);
        cell.classList.add('resource-node');
        cell.textContent = nodeDef.icon;
        cell.title = `${nodeDef.name} (${nodeState.quantity}/${nodeDef.maxQuantity})`;
        
        if (nodeState.quantity <= 0) {
          cell.classList.add('depleted');
        }
      }
      
      if (state?.player?.x === x && state?.player?.y === y) {
        cell.classList.add('player');
        cell.title = 'Player';
      }
      
      elements.grid.append(cell);
    }
  }
  
  elements.grid.style.gridTemplateColumns = `repeat(${currentGrid.width}, 1fr)`;
  elements.grid.style.gridTemplateRows = `repeat(${currentGrid.height}, 1fr)`;
  
  const foragingSkill = state?.skills?.foraging || { level: 0, totalXp: 0 };
  const miningSkill = state?.skills?.mining || { level: 0, totalXp: 0 };
  
  if (elements.inspector) {
    elements.inspector.innerHTML = `
      <dt>Position</dt><dd>${state?.player?.x || 0}, ${state?.player?.y || 0}</dd>
      <dt>Foraging</dt><dd>Level ${foragingSkill.level} (${foragingSkill.totalXp || foragingSkill.xp || 0} XP)</dd>
      <dt>Mining</dt><dd>Level ${miningSkill.level} (${miningSkill.totalXp || miningSkill.xp || 0} XP)</dd>
      <dt>Inventory</dt><dd>${inventoryText()}</dd>
    `;
  }
  
  renderInventory();
  renderSkills();
  renderEquipped();
}


function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  if (!grid || !state?.inventory) return;
  
  grid.replaceChildren();
  
  const items = Object.entries(state.inventory)
    .filter(([, amount]) => amount > 0);
  
  if (items.length === 0) {
    grid.innerHTML = '<p style="color: var(--muted); font-size: 0.75rem; padding: 8px;">Empty</p>';
    return;
  }
  
  items.forEach(([itemId, amount]) => {
    const itemDef = ITEMS[itemId];
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.title = `${itemDef?.name || itemId} x${amount}`;
    
    slot.innerHTML = `
      <span class="item-icon">${itemDef?.icon || '📦'}</span>
      <span class="item-count">${amount}</span>
    `;
    
    // Make all inventory items clickable to equip
    slot.style.cursor = 'pointer';
    slot.onclick = (e) => {
      e.stopPropagation();
      const result = window.ToolSystem.equipTool(state, itemId);
      show(result);
    };
    
    grid.append(slot);
  });
}


function renderSkills() {
  const container = document.getElementById('skills-list');
  if (!container || !state?.skills) return;
  
  container.replaceChildren();
  
  const skillDefs = [
    { id: 'fishing', name: 'Fishing', icon: '🎣' },
    { id: 'mining', name: 'Mining', icon: '⛏️' },
    { id: 'foraging', name: 'Foraging', icon: '🌿' },
    { id: 'woodcutting', name: 'Woodcutting', icon: '🪓' }
  ];
  
  skillDefs.forEach(skillDef => {
    const skill = state.skills[skillDef.id] || { level: 0, totalXp: 0 };
    const xpForNextLevel = skill.level * 100 || 100;
    const xpInCurrentLevel = skill.totalXp % 100;
    const progress = (xpInCurrentLevel / xpForNextLevel) * 100;
    
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="skill-info">
        <span class="skill-name">${skillDef.icon} ${skillDef.name}</span>
        <span class="skill-level">Level ${skill.level}</span>
      </div>
      <div class="xp-bar">
        <div class="xp-fill" style="width: ${progress}%"></div>
        <span class="xp-text">${Math.floor(xpInCurrentLevel)}/${xpForNextLevel} XP</span>
      </div>
    `;
    
    container.append(row);
  });
}


function renderEquipped() {
  const container = document.getElementById('equipped-slot');
  if (!container || !state?.player) return;
  
  const equippedTool = state.player.equippedTool;
  
  if (!equippedTool) {
    container.innerHTML = '<p class="equipped-empty">Nothing equipped</p>';
    return;
  }
  
  // equippedTool is now a string (itemId), not an object
  const itemId = typeof equippedTool === 'string' ? equippedTool : equippedTool.itemId;
  const itemDef = ITEMS[itemId];
  
  container.innerHTML = `
    <div class="equipped-item" onclick="window.unequipTool()">
      <span class="item-icon">${itemDef?.icon || '📦'}</span>
      <span class="item-name">${itemDef?.name || itemId}</span>
      <span class="unequip-hint">Click to unequip</span>
    </div>
  `;
}


window.unequipTool = function() {
  if (!state?.player?.equippedTool) return;
  
  const result = ToolSystem.unequipTool(state);
  show(result);
};


function write(message, type = 'system') {
  if (!elements.consoleOutput) return;
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = message;
  elements.consoleOutput.append(line);
  elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}


function show(result) {
  setStatus(result.success ? 'Ready' : 'Failed');
  write(`${result.code}: ${result.message}`, result.success ? 'system' : 'error');
  render();
}


function showActionBar(duration) {
  const bar = document.getElementById('action-bar');
  const fill = document.querySelector('.action-bar-fill');
  const text = document.querySelector('.action-bar-text');
  
  if (bar && fill && text) {
    bar.style.display = 'flex';
    fill.style.width = '0%';
    text.textContent = `Gathering... (${(duration / 1000).toFixed(1)}s)`;
    
    const checkInterval = setInterval(() => {
      if (!currentAction) {
        clearInterval(checkInterval);
        bar.style.display = 'none';
        return;
      }
      
      const elapsed = Date.now() - currentAction.startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      fill.style.width = `${progress}%`;
      
      if (elapsed >= duration && currentAction.type === 'gathering') {
        clearInterval(checkInterval);
        currentAction.onComplete();
        currentAction = null;
        bar.style.display = 'none';
      }
    }, 100);
  }
}


function hideActionBar() {
  const bar = document.getElementById('action-bar');
  if (bar) {
    bar.style.display = 'none';
  }
}


// Auto-respawn resource nodes every second
setInterval(() => {
  if (!state?.resourceNodes) return;
  
  const now = Date.now();
  let needsRender = false;
  
  state.resourceNodes.forEach(nodeState => {
    if (nodeState.quantity <= 0 && nodeState.lastDepleted) {
      const nodeDef = RESOURCE_NODES.find(n => n.id === nodeState.id);
      const timeSince = now - nodeState.lastDepleted;
      
      if (timeSince >= nodeDef.respawnTime) {
        nodeState.quantity = nodeDef.maxQuantity;
        nodeState.lastDepleted = null;
        needsRender = true;
      }
    }
  });
  
  if (needsRender) {
    render();
  }
}, 1000);


// ============ Actions ============


function move(dx, dy) {
  if (currentAction) {
    currentAction = null;
    hideActionBar();
    show({ success: false, code: 'ACTION_CANCELLED', message: 'Gathering cancelled!' });
  }
  
  const newX = state.player.x + dx;
  const newY = state.player.y + dy;
  
  if (newX < 0 || newX >= currentGrid.width || newY < 0 || newY >= currentGrid.height) {
    show({ success: false, code: 'OUT_OF_BOUNDS', message: 'Cannot move there.' });
    return;
  }
  
  const isBlocked = currentGrid.blockedCells?.some(([bx, by]) => bx === newX && by === newY);
  if (isBlocked) {
    show({ success: false, code: 'BLOCKED', message: 'That cell is blocked.' });
    return;
  }
  
  state.player.x = newX;
  state.player.y = newY;
  show({ success: true, code: 'MOVED', message: `Moved to ${newX}, ${newY}` });
}


function teleport(x, y) {
  if (x < 0 || x >= currentGrid.width || y < 0 || y >= currentGrid.height) {
    show({ success: false, code: 'INVALID', message: 'Invalid position.' });
    return;
  }
  state.player.x = x;
  state.player.y = y;
  render();
  show({ success: true, code: 'TELEPORTED', message: `Teleported to ${x},${y}` });
}


function gather() {
  if (currentAction) {
    if (currentAction.type === 'gathering') {
      const elapsed = Date.now() - currentAction.startTime;
      if (elapsed >= currentAction.duration) {
        currentAction.onComplete();
        currentAction = null;
        hideActionBar();
      }
      return;
    }
  }
  
  const nodeState = state.resourceNodes?.find(
    n => n.x === state.player.x && n.y === state.player.y
  );
  
  if (!nodeState) {
    show({ success: false, code: 'NO_NODE', message: 'Nothing to gather here. Move to a resource node.' });
    return;
  }
  
  const nodeDef = RESOURCE_NODES.find(n => n.id === nodeState.id);
  
  const toolCheck = ToolSystem.canUseNode(state, nodeDef);
  if (!toolCheck.canUse) {
    if (toolCheck.reason === 'no_tool_equipped') {
      show({ 
        success: false, 
        code: 'NO_TOOL_EQUIPPED', 
        message: `You need a ${toolCheck.toolName} to gather from this` 
      });
      return;
    }
    if (toolCheck.reason === 'wrong_tool') {
      show({ 
        success: false, 
        code: 'WRONG_TOOL', 
        message: `You need a ${toolCheck.toolName} (you have ${toolCheck.currentTool} equipped)` 
      });
      return;
    }
    if (toolCheck.reason === 'tool_broken') {
      show({ 
        success: false, 
        code: 'TOOL_BROKEN', 
        message: `Your ${toolCheck.toolName} broke! Craft a new one.` 
      });
      return;
    }
  }
  
  const skillLevel = state.skills[nodeDef.skill]?.level || 0;
  if (skillLevel < nodeDef.minLevel) {
    show({ 
      success: false, 
      code: 'SKILL_TOO_LOW', 
      message: `Need ${nodeDef.skill} level ${nodeDef.minLevel} (you are ${skillLevel})` 
    });
    return;
  }
  
  if (nodeState.quantity <= 0) {
    const timeSince = Date.now() - (nodeState.lastDepleted || 0);
    if (timeSince < nodeDef.respawnTime) {
      const remaining = Math.ceil((nodeDef.respawnTime - timeSince) / 1000);
      show({ 
        success: false, 
        code: 'DEPLETED', 
        message: `This node is depleted. Respawning in ${remaining}s` 
      });
      return;
    }
    nodeState.quantity = nodeDef.maxQuantity;
    nodeState.lastDepleted = null;
    show({ success: true, code: 'RESPAWNED', message: 'The node has respawned!' });
    render();
    return;
  }
  
  const gatherTime = nodeDef.gatherTime || 2000;
  currentAction = {
    type: 'gathering',
    nodeId: nodeDef.id,
    nodeState: nodeState,
    nodeDef: nodeDef,
    startTime: Date.now(),
    duration: gatherTime,
    onComplete: () => executeGather(nodeDef, nodeState)
  };
  
  showActionBar(gatherTime);
  show({ success: true, code: 'GATHERING', message: `Gathering ${nodeDef.name}... (Hold E)` });
}


function executeGather(nodeDef, nodeState) {
  if (state.player.equippedTool) {
    const durabilityResult = ToolSystem.consumeDurability(state, state.player.equippedTool, 1);
    if (durabilityResult.broke) {
      show({ success: false, code: 'TOOL_BROKEN', message: `Your ${durabilityResult.tool?.name} broke!` });
    }
  }
  
  const gathered = [];
  for (const loot of nodeDef.lootTable) {
    if (Math.random() <= loot.chance) {
      const amount = Math.floor(Math.random() * (loot.amountMax - loot.amountMin + 1)) + loot.amountMin;
      const result = InventorySystem.addItem(state, loot.resourceId, amount);
      if (result.success) {
        gathered.push(`${ITEMS[loot.resourceId]?.name || loot.resourceId} x${amount}`);
      }
    }
  }
  
  const xpResult = SkillsSystem.addXP(state, nodeDef.skill, nodeDef.xpReward);
  
  nodeState.quantity--;
  if (nodeState.quantity <= 0) {
    nodeState.lastDepleted = Date.now();
  }
  
  let msg = '';
  if (gathered.length > 0) {
    msg = `Gathered: ${gathered.join(', ')}`;
    if (xpResult.leveledUp) {
      msg += ` ⬆️ ${nodeDef.skill} reached level ${xpResult.level}!`;
    } else {
      msg += ` (+${nodeDef.xpReward} ${nodeDef.skill} XP)`;
    }
  } else {
    msg = 'Nothing gathered...';
  }
  
  show({ success: true, code: 'GATHERED', message: msg });
}


// ============ Commands ============


function executeCommand(raw) {
  const [command, ...args] = raw.trim().toLowerCase().split(/\s+/);
  if (!command) return;
  
  if (command === 'help') {
    write('Commands: help, state, teleport x y, gather, craft, recipes, craftable, equip, unequip, save, clear, reset', 'system');
    write('Debug: addxp <skill> <amount>, setlevel <skill> <level>, give <item> <amount>', 'system');
    write('Nodes: shoreline (5,8), reed_bed (7,8), surface_rock (2,3), copper_vein (3,3), sapling (8,2), pine_tree (8,3)', 'system');
  } else if (command === 'state') {
    write(JSON.stringify(state, null, 2));
  } else if (command === 'teleport') {
    teleport(Number(args[0]), Number(args[1]));
  } else if (command === 'gather') {
    gather();
  } else if (command === 'equip') {
    const toolId = args[0];
    if (!toolId) {
      write('Usage: equip <tool_id>. Example: equip fishing_rod_basic', 'error');
      return;
    }
    const result = ToolSystem.equipTool(state, toolId);
    show(result);
  } else if (command === 'unequip') {
    const result = ToolSystem.unequipTool(state);
    show(result);
  } else if (command === 'craft') {
    const recipeId = args[0];
    if (!recipeId) {
      write('Usage: craft <recipe_id>. Example: craft fishing_rod_basic', 'error');
      return;
    }
    const CraftingSystem = window.CraftingSystem;
    if (!CraftingSystem) {
      write('CraftingSystem not loaded', 'error');
      return;
    }
    write('Available recipes:', 'system');
    CraftingSystem.getAllRecipes().forEach(recipe => {
      const ingredients = Object.entries(recipe.ingredients)
        .map(([id, amt]) => `${id}: ${amt}`)
        .join(', ');
      write(`  ${recipe.id} - ${recipe.name} (${ingredients})`, 'system');
    });
  } else if (command === 'craftable') {
    const CraftingSystem = window.CraftingSystem;
    if (!CraftingSystem) {
      write('CraftingSystem not loaded', 'error');
      return;
    }
    const craftable = CraftingSystem.getCraftableRecipes(state);
    if (craftable.length === 0) {
      write('No recipes can be crafted yet. Gather more materials!', 'error');
    } else {
      write('You can craft:', 'system');
      craftable.forEach(r => write(`  ${r.name} (${r.id})`, 'system'));
    }
  } else if (command === 'save') {
    window.GameState.save(state);
    write('SAVED', 'system');
  } else if (command === 'addxp') {
    const [skill, amount] = args;
    if (!skill || !amount) {
      write('Usage: addxp <skill> <amount>. Example: addxp mining 100', 'error');
      return;
    }
    const result = SkillsSystem.addXP(state, skill, parseInt(amount));
    show({ success: true, code: 'XP_ADDED', message: `Added ${amount} XP to ${skill}. Level: ${result.level}` });
  } else if (command === 'setlevel') {
    const [skill, level] = args;
    if (!skill || !level) {
      write('Usage: setlevel <skill> <level>. Example: setlevel mining 5', 'error');
      return;
    }
    state.skills[skill] = { xp: 0, level: parseInt(level), totalXp: 0 };
    show({ success: true, code: 'LEVEL_SET', message: `Set ${skill} to level ${level}` });
  } else if (command === 'give') {
    const [itemId, amount] = args;
    if (!itemId || !amount) {
      write('Usage: give <item_id> <amount>. Example: give iron_pickaxe 1', 'error');
      return;
    }
    const result = InventorySystem.addItem(state, itemId, parseInt(amount));
    show({ success: result.success, code: result.success ? 'ITEM_GIVEN' : 'GIVE_FAILED', message: result.success ? `Gave ${amount} ${itemId}` : result.reason });
  } else if (command === 'clear') {
    elements.consoleOutput?.replaceChildren();
  } else if (command === 'reset') {
    location.reload();
  } else {
    write(`Unknown: ${command}. Type help.`, 'error');
  }
}


// ============ Input ============


const directions = {
  ArrowUp: [0, -1], w: [0, -1],
  ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0]
};


document.addEventListener('keydown', event => {
  const dir = directions[event.key];
  if (dir && event.target !== elements.consoleInput) {
    event.preventDefault();
    move(...dir);
  }
});


document.addEventListener('keydown', event => {
  if (event.key === 'e' && event.target !== elements.consoleInput) {
    event.preventDefault();
    gather();
  }
});


elements.resetButton?.addEventListener('click', () => location.reload());


elements.consoleForm?.addEventListener('submit', event => {
  event.preventDefault();
  executeCommand(elements.consoleInput.value);
  elements.consoleInput.value = '';
});


// ============ Init ============


function init() {
  state = window.state;
  render();
  write('Foundation ready. Type help.', 'system');
  write(`Resource nodes loaded: ${RESOURCE_NODES.length}`, 'system');
  window.executeCommand = executeCommand;
  window.render = render;
  window.show = show;
  console.log('[game.js] Initialized');
}


if (window.state) {
  init();
} else {
  const check = () => {
    if (window.state) init();
    else setTimeout(check, 100);
  };
  check();
}