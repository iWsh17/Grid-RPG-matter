/**
 * content.js - Static game content (grids, items, tools, recipes)
 * Data-driven, immutable, no side effects
 */

// ============ Grids ============

export const GRIDS = Object.freeze({
  meadow_01: Object.freeze({
    id: 'meadow_01',
    name: 'Lakeside Forest',
    width: 10,
    height: 10,
    biome: 'lakeside_forest',
    blockedCells: Object.freeze([
      [3, 3], [3, 4], [4, 3],
      [7, 7], [7, 8], [8, 7]
    ])
  })
});

// ============ Items ============

export const ITEMS = Object.freeze({
  // Resources
  wood: Object.freeze({
    id: 'wood',
    name: 'Wood',
    icon: '🪵',
    stackSize: 999,
    category: 'material',
    tier: 1
  }),
  stone: Object.freeze({
    id: 'stone',
    name: 'Stone',
    icon: '🪨',
    stackSize: 999,
    category: 'material',
    tier: 1
  }),
  plant_fibers: Object.freeze({
    id: 'plant_fibers',
    name: 'Plant Fibers',
    icon: '🌾',
    stackSize: 999,
    category: 'material',
    tier: 1
  }),
  minnow: Object.freeze({
    id: 'minnow',
    name: 'Minnow',
    icon: '🐟',
    stackSize: 999,
    category: 'material',
    tier: 1
  }),
  copper_ore: Object.freeze({
    id: 'copper_ore',
    name: 'Copper Ore',
    icon: '🟠',
    stackSize: 999,
    category: 'material',
    tier: 1
  }),
  iron_ore: Object.freeze({
    id: 'iron_ore',
    name: 'Iron Ore',
    icon: '⬜',
    stackSize: 999,
    category: 'material',
    tier: 2
  }),
  // Tools
  fishing_rod_basic: Object.freeze({
    id: 'fishing_rod_basic',
    name: 'Fishing Rod',
    icon: '🎣',
    stackSize: 1,
    category: 'tool',
    tier: 1,
    durability: 50,
    gatherSpeedMultiplier: 1.0
  }),
  pickaxe_basic: Object.freeze({
    id: 'pickaxe_basic',
    name: 'Pickaxe',
    icon: '⛏️',
    stackSize: 1,
    category: 'tool',
    tier: 1,
    durability: 50,
    gatherSpeedMultiplier: 1.0
  }),
  axe_basic: Object.freeze({
    id: 'axe_basic',
    name: 'Axe',
    icon: '🪓',
    stackSize: 1,
    category: 'tool',
    tier: 1,
    durability: 50,
    gatherSpeedMultiplier: 1.0
  }),
  fishing_rod_advanced: Object.freeze({
    id: 'fishing_rod_advanced',
    name: 'Advanced Fishing Rod',
    icon: '🎣✨',
    stackSize: 1,
    category: 'tool',
    tier: 2,
    durability: 100,
    gatherSpeedMultiplier: 1.5
  }),
  pickaxe_advanced: Object.freeze({
    id: 'pickaxe_advanced',
    name: 'Advanced Pickaxe',
    icon: '⛏️✨',
    stackSize: 1,
    category: 'tool',
    tier: 2,
    durability: 100,
    gatherSpeedMultiplier: 1.5
  }),
  axe_advanced: Object.freeze({
    id: 'axe_advanced',
    name: 'Advanced Axe',
    icon: '🪓✨',
    stackSize: 1,
    category: 'tool',
    tier: 2,
    durability: 100,
    gatherSpeedMultiplier: 1.5
  })
});

// ============ Tools ============

export const TOOLS = Object.freeze([
  {
    id: 'fishing_rod_basic',
    name: 'Fishing Rod',
    icon: '🎣',
    category: 'tool',
    tier: 1,
    durability: 50,
    gatherSpeedMultiplier: 1.0,
    unlocksNodes: ['shoreline', 'reed_bed'],
    craftingRecipe: {
      ingredients: {
        wood: 3,
        plant_fibers: 2
      },
      craftTime: 1000
    }
  },
  {
    id: 'pickaxe_basic',
    name: 'Pickaxe',
    icon: '⛏️',
    category: 'tool',
    tier: 1,
    durability: 50,
    gatherSpeedMultiplier: 1.0,
    unlocksNodes: ['surface_rock', 'copper_vein'],
    craftingRecipe: {
      ingredients: {
        wood: 2,
        stone: 3
      },
      craftTime: 1000
    }
  },
  {
    id: 'axe_basic',
    name: 'Axe',
    icon: '🪓',
    category: 'tool',
    tier: 1,
    durability: 50,
    gatherSpeedMultiplier: 1.0,
    unlocksNodes: ['sapling', 'pine_tree'],
    craftingRecipe: {
      ingredients: {
        wood: 3,
        stone: 2
      },
      craftTime: 1000
    }
  }
]);

// ============ Resource Nodes ============

export const RESOURCE_NODES = Object.freeze([
  // Fishing Nodes
  {
    id: 'shoreline',
    name: 'Shoreline',
    icon: '🌊',
    x: 5,
    y: 8,
    type: 'fishing',
    skill: 'fishing',
    minLevel: 0,
    maxQuantity: 10,
    respawnTime: 10000,
    requiredTool: 'fishing_rod_basic',
    gatherTime: 2000,
    lootTable: [
      { resourceId: 'minnow', chance: 0.7, amountMin: 1, amountMax: 2 }
    ],
    xpReward: 10
  },
  {
    id: 'reed_bed',
    name: 'Reed Bed',
    icon: '🌾',
    x: 7,
    y: 8,
    type: 'fishing',
    skill: 'fishing',
    minLevel: 3,
    maxQuantity: 8,
    respawnTime: 20000,
    requiredTool: 'fishing_rod_basic',
    gatherTime: 3000,
    lootTable: [
      { resourceId: 'minnow', chance: 0.6, amountMin: 2, amountMax: 3 }
    ],
    xpReward: 15
  },
  // Mining Nodes
  {
    id: 'surface_rock',
    name: 'Surface Rock',
    icon: '🪨',
    x: 2,
    y: 3,
    type: 'mining',
    skill: 'mining',
    minLevel: 0,
    maxQuantity: 10,
    respawnTime: 15000,
    requiredTool: 'pickaxe_basic',
    gatherTime: 2000,
    lootTable: [
      { resourceId: 'stone', chance: 0.8, amountMin: 2, amountMax: 4 }
    ],
    xpReward: 10
  },
  {
    id: 'copper_vein',
    name: 'Copper Vein',
    icon: '🟠',
    x: 3,
    y: 3,
    type: 'mining',
    skill: 'mining',
    minLevel: 3,
    maxQuantity: 8,
    respawnTime: 25000,
    requiredTool: 'pickaxe_basic',
    gatherTime: 3000,
    lootTable: [
      { resourceId: 'copper_ore', chance: 0.7, amountMin: 2, amountMax: 3 },
      { resourceId: 'stone', chance: 0.3, amountMin: 1, amountMax: 2 }
    ],
    xpReward: 15
  },
  // Woodcutting Nodes
  {
    id: 'sapling',
    name: 'Sapling',
    icon: '🌱',
    x: 8,
    y: 2,
    type: 'woodcutting',
    skill: 'woodcutting',
    minLevel: 0,
    maxQuantity: 10,
    respawnTime: 10000,
    requiredTool: 'axe_basic',
    gatherTime: 2000,
    lootTable: [
      { resourceId: 'wood', chance: 0.6, amountMin: 1, amountMax: 2 },
      { resourceId: 'plant_fibers', chance: 0.4, amountMin: 1, amountMax: 2 }
    ],
    xpReward: 10
  },
  {
    id: 'pine_tree',
    name: 'Pine Tree',
    icon: '🌲',
    x: 8,
    y: 3,
    type: 'woodcutting',
    skill: 'woodcutting',
    minLevel: 3,
    maxQuantity: 8,
    respawnTime: 20000,
    requiredTool: 'axe_basic',
    gatherTime: 3000,
    lootTable: [
      { resourceId: 'wood', chance: 0.7, amountMin: 3, amountMax: 5 }
    ],
    xpReward: 15
  }
]);

// ============ Recipes ============

export const RECIPES = Object.freeze([
  {
    id: 'fishing_rod_basic',
    name: 'Fishing Rod',
    category: 'tool',
    ingredients: {
      wood: 3,
      plant_fibers: 2
    },
    output: {
      itemId: 'fishing_rod_basic',
      amount: 1
    }
  },
  {
    id: 'pickaxe_basic',
    name: 'Pickaxe',
    category: 'tool',
    ingredients: {
      wood: 2,
      stone: 3
    },
    output: {
      itemId: 'pickaxe_basic',
      amount: 1
    }
  },
  {
    id: 'axe_basic',
    name: 'Axe',
    category: 'tool',
    ingredients: {
      wood: 3,
      stone: 2
    },
    output: {
      itemId: 'axe_basic',
      amount: 1
    }
  }
]);

console.log('[content.js] Loaded', Object.keys(ITEMS).length, 'items,', TOOLS.length, 'tools,', RESOURCE_NODES.length, 'nodes,', RECIPES.length, 'recipes');