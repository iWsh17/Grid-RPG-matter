/**
 * ToolSystem - Tool equipping, durability, and validation
 * Pure functions, no side effects
 */

import { TOOLS, ITEMS } from '../../content.js';

export const ToolSystem = {
  _tools: null,

  /**
   * Initialize with tool data
   */
  initialize() {
    this._tools = TOOLS;
    console.log(`[ToolSystem] Loaded ${this._tools.length} tools`);
  },

  /**
   * Get tool definition by ID
   * @param {string} toolId 
   * @returns {Object|null}
   */
  getTool(toolId) {
    return this._tools?.find(t => t.id === toolId) || null;
  },

  /**
   * Get all tools
   * @returns {Array}
   */
  getAllTools() {
    return this._tools || [];
  },

  /**
   * Check if item is a tool
   * @param {string} itemId 
   * @returns {boolean}
   */
  isTool(itemId) {
    return this.getTool(itemId) !== null;
  },

  /**
   * Equip a tool
   * @param {Object} state 
   * @param {string} toolId 
   * @returns {{success: boolean, code: string, message: string}}
   */
  equipTool(state, toolId) {
    // Check if player has the tool
    if (!state.inventory?.[toolId] || state.inventory[toolId] <= 0) {
      return {
        success: false,
        code: 'NO_TOOL',
        message: `You don't have a ${ITEMS[toolId]?.name || toolId}`
      };
    }

    // Check if it's actually a tool
    if (!this.isTool(toolId)) {
      return {
        success: false,
        code: 'NOT_A_TOOL',
        message: `${ITEMS[toolId]?.name || toolId} is not a tool`
      };
    }

    // Equip it
    state.player.equippedTool = toolId;

    const tool = this.getTool(toolId);
    return {
      success: true,
      code: 'EQUIPPED',
      message: `Equipped ${tool?.name || ITEMS[toolId]?.name || toolId}`,
      tool: tool
    };
  },

  /**
   * Unequip current tool
   * @param {Object} state 
   * @returns {{success: boolean, code: string, message: string}}
   */
  unequipTool(state) {
    if (!state.player?.equippedTool) {
      return {
        success: false,
        code: 'NO_TOOL_EQUIPPED',
        message: 'No tool is equipped'
      };
    }

    const toolId = state.player.equippedTool;
    state.player.equippedTool = null;

    return {
      success: true,
      code: 'UNEQUIPPED',
      message: `Unequipped ${ITEMS[toolId]?.name || toolId}`
    };
  },

  /**
   * Check if player can use a node (has correct tool equipped)
   * @param {Object} state 
   * @param {Object} node 
   * @returns {{canUse: boolean, reason?: string, toolName?: string}}
   */
  canUseNode(state, node) {
    if (!node.requiredTool) {
      return { canUse: true }; // No tool required
    }

    const equippedTool = state.player?.equippedTool;

    if (!equippedTool) {
      const tool = this.getTool(node.requiredTool);
      return {
        canUse: false,
        reason: 'no_tool_equipped',
        toolName: tool?.name || node.requiredTool
      };
    }

    if (equippedTool !== node.requiredTool) {
      const requiredTool = this.getTool(node.requiredTool);
      const currentTool = this.getTool(equippedTool);
      return {
        canUse: false,
        reason: 'wrong_tool',
        toolName: requiredTool?.name || node.requiredTool,
        currentTool: currentTool?.name || equippedTool
      };
    }

    // Check durability
    const toolState = state.toolDurability?.[equippedTool] || this.getTool(equippedTool)?.durability || 0;
    if (toolState <= 0) {
      return {
        canUse: false,
        reason: 'tool_broken',
        toolName: ITEMS[equippedTool]?.name || equippedTool
      };
    }

    return { canUse: true };
  },

  /**
   * Consume tool durability
   * @param {Object} state 
   * @param {string} toolId 
   * @param {number} amount 
   * @returns {{success: boolean, remaining: number, broke: boolean}}
   */
  consumeDurability(state, toolId, amount = 1) {
    if (!state.toolDurability) {
      state.toolDurability = {};
    }

    // Initialize if not set
    if (!state.toolDurability[toolId]) {
      const tool = this.getTool(toolId);
      state.toolDurability[toolId] = tool?.durability || 50;
    }

    // Consume
    state.toolDurability[toolId] -= amount;
    const remaining = state.toolDurability[toolId];
    const broke = remaining <= 0;

    if (broke) {
      // Remove one tool from inventory
      if (state.inventory?.[toolId] > 0) {
        state.inventory[toolId]--;
        if (state.inventory[toolId] <= 0) {
          delete state.inventory[toolId];
        }
      }
      // Clear equipped if this was equipped
      if (state.player.equippedTool === toolId) {
        state.player.equippedTool = null;
      }
      // Reset durability for next tool
      state.toolDurability[toolId] = 0;
    }

    return {
      success: true,
      remaining: Math.max(0, remaining),
      broke,
      tool: this.getTool(toolId)
    };
  },

  /**
   * Get tool durability percentage
   * @param {Object} state 
   * @param {string} toolId 
   * @returns {number} 0-100
   */
  getDurabilityPercent(state, toolId) {
    const tool = this.getTool(toolId);
    if (!tool) return 0;

    const current = state.toolDurability?.[toolId] || tool.durability;
    return Math.round((current / tool.durability) * 100);
  },

  /**
   * Get gather time with tool modifier
   * @param {Object} state 
   * @param {Object} node 
   * @returns {number} milliseconds
   */
  getGatherTime(state, node) {
    const equippedTool = state.player?.equippedTool;
    if (!equippedTool) return node.gatherTime || 2000;

    const tool = this.getTool(equippedTool);
    const multiplier = tool?.gatherSpeedMultiplier || 1.0;

    return Math.round((node.gatherTime || 2000) / multiplier);
  }
};

export default ToolSystem;