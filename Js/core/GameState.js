/**
 * GameState - Save/Load system with validation and versioning
 * Pure functions, no internal state
 */

const SAVE_KEY = 'gridRPG_save_v3';
const SAVE_VERSION = 3;

/**
 * Validate save data structure
 * @param {any} data - Data to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateSave(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Save data must be an object');
    return { valid: false, errors };
  }

  // Required fields
  const required = ['player', 'inventory', 'skills'];
  for (const field of required) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Player validation
  if (data.player && typeof data.player !== 'object') {
    errors.push('Player must be an object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Migrate save data between versions
 * @param {any} data - Save data
 * @param {number} fromVersion - Source version
 * @returns {any} Migrated data
 */
function migrateSave(data, fromVersion) {
  // Example migration: v2 -> v3
  if (fromVersion < 3) {
    // Add new fields if needed
    if (!data.capabilities) {
      data.capabilities = {};
    }
  }
  
  return data;
}

export const GameState = {
  /**
   * Save game state to localStorage
   * @param {Object} state - Game state to save
   * @returns {boolean} Success status
   */
  save(state) {
    if (!state || typeof state !== 'object') {
      console.error('[GameState] Invalid state to save');
      return false;
    }

    try {
      const saveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        state
      };
      
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('[GameState] Saved successfully');
      return true;
    } catch (error) {
      console.error('[GameState] Save failed:', error);
      return false;
    }
  },

  /**
   * Load game state from localStorage
   * @returns {Object|null} Loaded state or null if no save exists
   */
  load() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      
      if (!data) {
        console.log('[GameState] No save found');
        return null;
      }

      const parsed = JSON.parse(data);
      
      // Handle old save format (no version)
      const version = parsed.version || 1;
      const state = parsed.state || parsed; // Support old format

      // Validate
      const validation = validateSave(state);
      if (!validation.valid) {
        console.error('[GameState] Save validation failed:', validation.errors);
        console.warn('[GameState] Attempting to load anyway...');
      }

      // Migrate if needed
      const migrated = migrateSave(state, version);

      console.log(`[GameState] Loaded save v${version} (timestamp: ${parsed.timestamp || 'unknown'})`);
      return migrated;
    } catch (error) {
      console.error('[GameState] Load failed:', error);
      return null;
    }
  },

  /**
   * Clear saved game
   */
  clear() {
    localStorage.removeItem(SAVE_KEY);
    console.log('[GameState] Cleared');
  },

  /**
   * Check if a save exists
   * @returns {boolean}
   */
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  /**
   * Get save metadata without loading full state
   * @returns {Object|null} Save metadata or null
   */
  getMetadata() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return {
        version: parsed.version || 1,
        timestamp: parsed.timestamp || null,
        hasState: !!parsed.state
      };
    } catch {
      return null;
    }
  }
};

export default GameState;