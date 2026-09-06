/**
 * InventorySystem - Item management with pure functions
 * No side effects, immutable-friendly, validated inputs
 */

/**
 * Default resource definition
 */
const DEFAULT_RESOURCE = {
  stackSize: 999,
  name: 'Unknown Item'
};

export const InventorySystem = {
  _resourceData: null,
  _debug: false,

  /**
   * Initialize with resource definitions
   * @param {Object} resourceData - Resource definitions
   */
  initialize(resourceData) {
    this._resourceData = resourceData || { resources: [] };
    console.log(`[InventorySystem] Initialized with ${this._resourceData.resources?.length || 0} resources`);
  },

  /**
   * Get resource definition
   * @param {string} resourceId 
   * @returns {Object|null}
   */
  getResource(resourceId) {
    if (!this._resourceData) {
      return null;
    }

    return this._resourceData.resources?.find(r => r.id === resourceId) || null;
  },

  /**
   * Get amount of item in inventory
   * @param {Object} state 
   * @param {string} itemId 
   * @returns {number}
   */
  getAmount(state, itemId) {
    return state.inventory?.[itemId] || 0;
  },

  /**
   * Check if player has an item
   * @param {Object} state 
   * @param {string} itemId 
   * @param {number} [amount=1] 
   * @returns {boolean}
   */
  hasItem(state, itemId, amount = 1) {
    return this.getAmount(state, itemId) >= amount;
  },

  /**
   * Add item to inventory
   * @param {Object} state 
   * @param {string} itemId 
   * @param {number} amount 
   * @returns {{success: boolean, added: number, total: number, reason?: string}}
   */
  addItem(state, itemId, amount) {
    // Validate inputs
    if (typeof itemId !== 'string' || !itemId.trim()) {
      console.error('[InventorySystem] addItem: itemId must be a non-empty string');
      return { success: false, added: 0, total: 0, reason: 'invalid_item_id' };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      console.error('[InventorySystem] addItem: amount must be positive number');
      return { success: false, added: 0, total: 0, reason: 'invalid_amount' };
    }

    // Ensure inventory exists
    if (!state.inventory) {
      state.inventory = {};
    }

    const resource = this.getResource(itemId);
    const stackSize = resource?.stackSize || DEFAULT_RESOURCE.stackSize;
    const current = this.getAmount(state, itemId);
    
    // Calculate how much can actually be added
    const spaceAvailable = stackSize - current;
    const actualAdded = Math.min(amount, spaceAvailable);

    if (actualAdded <= 0) {
      return {
        success: false,
        added: 0,
        total: current,
        reason: 'inventory_full'
      };
    }

    // Add item
    state.inventory[itemId] = current + actualAdded;

    const result = {
      success: true,
      added: actualAdded,
      total: state.inventory[itemId],
      item: resource ? { id: itemId, name: resource.name } : { id: itemId }
    };

    if (this._debug) {
      console.log('[InventorySystem] addItem:', result);
    }

    return result;
  },

  /**
   * Remove item from inventory
   * @param {Object} state 
   * @param {string} itemId 
   * @param {number} amount 
   * @returns {{success: boolean, removed: number, remaining: number, reason?: string}}
   */
  removeItem(state, itemId, amount) {
    // Validate inputs
    if (typeof itemId !== 'string' || !itemId.trim()) {
      return { success: false, removed: 0, remaining: 0, reason: 'invalid_item_id' };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return { success: false, removed: 0, remaining: 0, reason: 'invalid_amount' };
    }

    const current = this.getAmount(state, itemId);

    if (current <= 0) {
      return {
        success: false,
        removed: 0,
        remaining: 0,
        reason: 'item_not_found'
      };
    }

    if (current < amount) {
      return {
        success: false,
        removed: 0,
        remaining: current,
        reason: 'insufficient_quantity'
      };
    }

    // Remove item
    const newAmount = current - amount;
    
    if (newAmount === 0) {
      delete state.inventory[itemId];
    } else {
      state.inventory[itemId] = newAmount;
    }

    const result = {
      success: true,
      removed: amount,
      remaining: newAmount,
      item: { id: itemId }
    };

    if (this._debug) {
      console.log('[InventorySystem] removeItem:', result);
    }

    return result;
  },

  /**
   * Transfer items between containers
   * @param {Object} state 
   * @param {string} fromContainer - Container path (e.g., 'inventory', 'storage.chest_1')
   * @param {string} toContainer - Container path
   * @param {string} itemId 
   * @param {number} amount 
   * @returns {{success: boolean, transferred: number, reason?: string}}
   */
  transfer(state, fromContainer, toContainer, itemId, amount) {
    // Validate inputs
    if (typeof fromContainer !== 'string' || !fromContainer) {
      return { success: false, transferred: 0, reason: 'invalid_from_container' };
    }

    if (typeof toContainer !== 'string' || !toContainer) {
      return { success: false, transferred: 0, reason: 'invalid_to_container' };
    }

    if (typeof itemId !== 'string' || !itemId) {
      return { success: false, transferred: 0, reason: 'invalid_item_id' };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return { success: false, transferred: 0, reason: 'invalid_amount' };
    }

    const from = this._getContainer(state, fromContainer);
    const to = this._getContainer(state, toContainer);

    // Check if source has enough
    const fromAmount = from[itemId] || 0;
    if (fromAmount < amount) {
      return {
        success: false,
        transferred: 0,
        reason: 'insufficient_source',
        available: fromAmount
      };
    }

    // Get stack size limit
    const resource = this.getResource(itemId);
    const stackSize = resource?.stackSize || DEFAULT_RESOURCE.stackSize;
    const toAmount = to[itemId] || 0;
    const spaceInTo = stackSize - toAmount;

    if (spaceInTo <= 0) {
      return {
        success: false,
        transferred: 0,
        reason: 'destination_full'
      };
    }

    // Calculate actual transfer amount
    const actualAmount = Math.min(amount, spaceInTo);

    // Perform transfer
    from[itemId] = fromAmount - actualAmount;
    if (from[itemId] === 0) {
      delete from[itemId];
    }
    
    to[itemId] = toAmount + actualAmount;

    const result = {
      success: true,
      transferred: actualAmount,
      from: fromContainer,
      to: toContainer,
      item: { id: itemId }
    };

    if (this._debug) {
      console.log('[InventorySystem] transfer:', result);
    }

    return result;
  },

  /**
   * Get container reference from path
   * @private
   * @param {Object} state 
   * @param {string} containerPath 
   * @returns {Object} Container object
   */
  _getContainer(state, containerPath) {
    const parts = containerPath.split('.');
    let current = state;

    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    return current;
  },

  /**
   * Get all items in inventory
   * @param {Object} state 
   * @returns {Object} Copy of inventory
   */
  getAll(state) {
    return { ...state.inventory };
  },

  /**
   * Get all items with details
   * @param {Object} state 
   * @returns {Array} Array of item details
   */
  getAllDetailed(state) {
    if (!state.inventory) {
      return [];
    }

    return Object.entries(state.inventory)
      .filter(([, amount]) => amount > 0)
      .map(([itemId, amount]) => ({
        itemId,
        amount,
        resource: this.getResource(itemId)
      }));
  },

  /**
   * Count total items in inventory
   * @param {Object} state 
   * @returns {number}
   */
  getTotalCount(state) {
    if (!state.inventory) {
      return 0;
    }

    return Object.values(state.inventory).reduce((sum, amount) => sum + amount, 0);
  },

  /**
   * Count unique item types
   * @param {Object} state 
   * @returns {number}
   */
  getUniqueCount(state) {
    if (!state.inventory) {
      return 0;
    }

    return Object.keys(state.inventory).length;
  },

  /**
   * Clear all items from inventory
   * @param {Object} state 
   */
  clear(state) {
    state.inventory = {};
  },

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this._debug = enabled;
  }
};

export default InventorySystem;