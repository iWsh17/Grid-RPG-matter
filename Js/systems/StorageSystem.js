/**
 * StorageSystem - Storage container management
 * Pure functions, no internal state, tracks open containers in state
 */

export const StorageSystem = {
  _storageData: null,
  _debug: false,

  /**
   * Initialize with storage configurations
   * @param {Object} storageData - Storage configs keyed by ID
   */
  initialize(storageData) {
    this._storageData = storageData || {};
    console.log(`[StorageSystem] Initialized with ${Object.keys(this._storageData).length} storage configs`);
  },

  /**
   * Get storage configuration
   * @param {string} configId 
   * @returns {Object|null}
   */
  getConfig(configId) {
    return this._storageData?.[configId] || null;
  },

  /**
   * Get container contents
   * @param {Object} state 
   * @param {string} containerId 
   * @returns {Object} Copy of container contents
   */
  getContents(state, containerId) {
    const container = state.storage?.[containerId] || {};
    return { ...container };
  },

  /**
   * Check if container exists
   * @param {Object} state 
   * @param {string} containerId 
   * @returns {boolean}
   */
  hasContainer(state, containerId) {
    return !!(state.storage?.[containerId]);
  },

  /**
   * Open a storage container
   * @param {Object} state 
   * @param {string} containerId 
   * @param {string} playerId 
   * @returns {{success: boolean, reason?: string}}
   */
  open(state, containerId, playerId) {
    // Validate inputs
    if (typeof containerId !== 'string' || !containerId) {
      return { success: false, reason: 'invalid_container_id' };
    }

    if (typeof playerId !== 'string' || !playerId) {
      return { success: false, reason: 'invalid_player_id' };
    }

    // Initialize storage if needed
    if (!state.storage) {
      state.storage = {};
    }

    // Initialize container if it doesn't exist
    if (!state.storage[containerId]) {
      state.storage[containerId] = {};
    }

    // Check if already open
    const openContainers = state._openContainers || {};
    if (openContainers[containerId]) {
      return {
        success: false,
        reason: 'already_open',
        openedBy: openContainers[containerId]
      };
    }

    // Open the container
    if (!state._openContainers) {
      state._openContainers = {};
    }
    state._openContainers[containerId] = playerId;

    const result = {
      success: true,
      containerId,
      playerId,
      contents: this.getContents(state, containerId)
    };

    if (this._debug) {
      console.log('[StorageSystem] open:', result);
    }

    return result;
  },

  /**
   * Close a storage container
   * @param {Object} state 
   * @param {string} containerId 
   * @param {string} playerId 
   * @returns {{success: boolean, reason?: string}}
   */
  close(state, containerId, playerId) {
    if (typeof containerId !== 'string' || !containerId) {
      return { success: false, reason: 'invalid_container_id' };
    }

    const openContainers = state._openContainers || {};
    
    if (!openContainers[containerId]) {
      return {
        success: false,
        reason: 'not_open'
      };
    }

    // Check if the right player is closing it
    if (playerId && openContainers[containerId] !== playerId) {
      return {
        success: false,
        reason: 'wrong_player',
        openedBy: openContainers[containerId]
      };
    }

    delete openContainers[containerId];

    // Clean up empty _openContainers
    if (Object.keys(openContainers).length === 0) {
      delete state._openContainers;
    }

    const result = {
      success: true,
      containerId,
      playerId: openContainers[containerId] || playerId
    };

    if (this._debug) {
      console.log('[StorageSystem] close:', result);
    }

    return result;
  },

  /**
   * Check if container is open
   * @param {Object} state 
   * @param {string} containerId 
   * @returns {{isOpen: boolean, openedBy?: string}}
   */
  isOpen(state, containerId) {
    const openContainers = state._openContainers || {};
    const openedBy = openContainers[containerId];

    return {
      isOpen: !!openedBy,
      openedBy: openedBy || null
    };
  },

  /**
   * Get all open containers
   * @param {Object} state 
   * @returns {Object} Map of containerId -> playerId
   */
  getOpenContainers(state) {
    return { ...state._openContainers };
  },

  /**
   * Deposit items into storage
   * @param {Object} state 
   * @param {string} containerId 
   * @param {string} itemId 
   * @param {number} amount 
   * @returns {{success: boolean, transferred: number, reason?: string}}
   */
  deposit(state, containerId, itemId, amount) {
    const openStatus = this.isOpen(state, containerId);
    
    if (!openStatus.isOpen) {
      return {
        success: false,
        transferred: 0,
        reason: 'container_not_open'
      };
    }

    // Delegate to InventorySystem
    return InventorySystem.transfer(
      state,
      'inventory',
      `storage.${containerId}`,
      itemId,
      amount
    );
  },

  /**
   * Withdraw items from storage
   * @param {Object} state 
   * @param {string} containerId 
   * @param {string} itemId 
   * @param {number} amount 
   * @returns {{success: boolean, transferred: number, reason?: string}}
   */
  withdraw(state, containerId, itemId, amount) {
    const openStatus = this.isOpen(state, containerId);
    
    if (!openStatus.isOpen) {
      return {
        success: false,
        transferred: 0,
        reason: 'container_not_open'
      };
    }

    // Delegate to InventorySystem
    return InventorySystem.transfer(
      state,
      `storage.${containerId}`,
      'inventory',
      itemId,
      amount
    );
  },

  /**
   * Get storage statistics
   * @param {Object} state 
   * @param {string} containerId 
   * @returns {{itemCount: number, totalItems: number, slots: number}}
   */
  getStats(state, containerId) {
    const contents = this.getContents(state, containerId);
    const entries = Object.entries(contents);

    return {
      itemCount: entries.length,
      totalItems: entries.reduce((sum, [, amount]) => sum + amount, 0),
      slots: entries.length
    };
  },

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this._debug = enabled;
  }
};

export default StorageSystem;