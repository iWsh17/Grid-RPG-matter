/**
 * HarvestingSystem - Resource gathering from nodes
 * 
 * Usage:
 *   // Initialize
 *   HarvestingSystem.initialize(resourceNodesData);
 *   
 *   // Gather from a node
 *   const result = HarvestingSystem.gather('berry_bush');
 *   
 *   // Get node info
 *   const node = HarvestingSystem.getNode('berry_bush');
 */

const HarvestingSystem = {
  // Resource node definitions from JSON
  _nodeData: null,

  /**
   * Initialize with resource node data
   * @param {Object} nodeData - Loaded from resourceNodes.json
   */
  initialize(nodeData) {
    console.log('[HarvestingSystem] Initializing...');
    this._nodeData = nodeData;
    
    // Validate node data
    if (!nodeData || !nodeData.resourceNodes || !Array.isArray(nodeData.resourceNodes)) {
      console.error('[HarvestingSystem] Invalid node data');
      return false;
    }

    console.log(`[HarvestingSystem] Loaded ${nodeData.resourceNodes.length} resource nodes`);
    return true;
  },

  /**
   * Get node definition by ID
   * @param {string} nodeId - Node ID
   * @returns {Object|null} Node definition
   */
  getNode(nodeId) {
    if (!this._nodeData) return null;
    
    return this._nodeData.resourceNodes.find(n => n.id === nodeId) || null;
  },

  /**
   * Get all nodes
   * @returns {Array} Array of node definitions
   */
  getAllNodes() {
    return this._nodeData ? this._nodeData.resourceNodes : [];
  },

  /**
   * Gather from a resource node
   * @param {string} nodeId - Node ID
   * @returns {Object} Gather result
   */
  gather(nodeId) {
    const node = this.getNode(nodeId);
    
    if (!node) {
      return {
        success: false,
        error: 'Node not found',
        nodeId: nodeId
      };
    }

    // Check skill requirement
    const skillLevel = GameState.get(`skills.${node.skill}.level`) || 1;
    
    if (skillLevel < node.minLevel) {
      return {
        success: false,
        error: `Requires ${node.skill} level ${node.minLevel}`,
        nodeId: nodeId,
        node: node,
        currentLevel: skillLevel,
        requiredLevel: node.minLevel
      };
    }

    // Roll on loot table
    const gathered = [];
    
    for (const loot of node.lootTable) {
      if (Math.random() <= loot.chance) {
        const amount = this.randomInRange(loot.amountMin, loot.amountMax);
        gathered.push({
          resourceId: loot.resourceId,
          amount: amount
        });
        
        // Add to inventory
        window.InventorySystem.addItem(loot.resourceId, amount);
      }
    }

    // Calculate XP gain
    const xpGained = this.calculateXpGained(node, skillLevel);
    const levelUps = window.SkillManager.addXp(node.skill, xpGained);

    // Emit event
    window.EventBus.emit('resource.gathered', {
      nodeId: nodeId,
      node: node,
      gathered: gathered,
      xpGained: xpGained,
      levelUps: levelUps
    });

    console.log(`[HarvestingSystem] Gathered from ${node.name}:`, gathered);

    return {
      success: true,
      nodeId: nodeId,
      node: node,
      gathered: gathered,
      xpGained: xpGained,
      levelUps: levelUps
    };
  },

  /**
   * Calculate XP gained from gathering
   * @param {Object} node - Node definition
   * @param {number} playerLevel - Player's skill level
   * @returns {number} XP gained
   */
  calculateXpGained(node, playerLevel) {
    // Base XP
    const baseXp = 10;
    
    // Tier multiplier based on node max level
    let tierMultiplier = 1;
    if (node.maxLevel <= 33) tierMultiplier = 1;
    else if (node.maxLevel <= 66) tierMultiplier = 2;
    else tierMultiplier = 3;

    // Level penalty if player is over-leveled
    const levelDiff = playerLevel - node.minLevel;
    const levelPenalty = levelDiff > 10 ? 0.5 : 1.0;

    return Math.floor(baseXp * tierMultiplier * levelPenalty);
  },

  /**
   * Random number in range [min, max]
   * @param {number} min - Minimum
   * @param {number} max - Maximum
   * @returns {number} Random number
   */
  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Check if player can gather from a node
   * @param {string} nodeId - Node ID
   * @returns {Object} { canGather: boolean, reason: string }
   */
  canGather(nodeId) {
    const node = this.getNode(nodeId);
    
    if (!node) {
      return {
        canGather: false,
        reason: 'Node not found'
      };
    }

    const skillLevel = GameState.get(`skills.${node.skill}.level`) || 1;
    
    if (skillLevel < node.minLevel) {
      return {
        canGather: false,
        reason: `Requires ${node.skill} level ${node.minLevel}`,
        currentLevel: skillLevel,
        requiredLevel: node.minLevel
      };
    }

    return {
      canGather: true,
      reason: 'OK'
    };
  },

  /**
   * Get nodes available to player's current level
   * @param {string} skillId - Skill ID to filter by
   * @returns {Array} Array of available nodes
   */
  getAvailableNodes(skillId) {
    const allNodes = this.getAllNodes();
    const playerLevel = GameState.get(`skills.${skillId}.level`) || 1;

    return allNodes.filter(node => {
      return node.skill === skillId && node.minLevel <= playerLevel;
    });
  }
};

// Export for ES modules
export default HarvestingSystem;

// Also make available globally for non-module scripts
window.HarvestingSystem = HarvestingSystem;

console.log('[HarvestingSystem] Initialized');