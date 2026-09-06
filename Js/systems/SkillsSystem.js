/**
 * SkillsSystem - Skill management with pure functions
 * No side effects, no event emissions, immutable-friendly
 */

/**
 * Default skill structure
 */
const DEFAULT_SKILL = {
  xp: 0,
  level: 0,
  totalXp: 0
};

/**
 * Calculate XP needed for next level
 * @param {number} level - Current level
 * @param {number} xpPerLevel - Base XP per level
 * @returns {number} XP needed
 */
function xpForLevel(level, xpPerLevel = 50) {
  return xpPerLevel * (level + 1);
}

export const SkillsSystem = {
  _skillData: null,

  /**
   * Initialize with skill definitions
   * @param {Object} skillData - Skill definitions
   * @param {Array} skillData.skills - Array of skill definitions
   */
  initialize(skillData) {
    if (!skillData || !Array.isArray(skillData.skills)) {
      throw new TypeError('SkillsSystem.initialize: skillData must have a skills array');
    }

    this._skillData = skillData;
    console.log(`[SkillsSystem] Initialized with ${skillData.skills.length} skills`);
  },

  /**
   * Get skill definition by ID
   * @param {string} skillId 
   * @returns {Object|null}
   */
  getSkillDefinition(skillId) {
    if (!this._skillData) {
      console.warn('[SkillsSystem] Not initialized');
      return null;
    }

    return this._skillData.skills.find(s => s.id === skillId) || null;
  },

  /**
   * Initialize a skill in state if it doesn't exist
   * @param {Object} state 
   * @param {string} skillId 
   */
  ensureSkill(state, skillId) {
    if (!state.skills[skillId]) {
      state.skills[skillId] = { ...DEFAULT_SKILL };
    }
  },

  /**
   * Add XP to a skill (pure function, returns changes)
   * @param {Object} state - Game state
   * @param {string} skillId - Skill ID
   * @param {number} amount - XP amount (must be positive)
   * @returns {Object} Result with levelUps array
   */
  addXP(state, skillId, amount) {
    const skillDef = this.getSkillDefinition(skillId);
    
    if (!skillDef) {
      console.warn(`[SkillsSystem] Unknown skill: ${skillId}`);
      return { success: false, reason: 'unknown_skill' };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      console.warn(`[SkillsSystem] Invalid XP amount: ${amount}`);
      return { success: false, reason: 'invalid_amount' };
    }

    this.ensureSkill(state, skillId);
    const skillState = state.skills[skillId];
    
    const oldLevel = skillState.level;
    const oldTotalXp = skillState.totalXp || 0;

    // Update XP
    skillState.totalXp = oldTotalXp + amount;
    skillState.xp = (skillState.xp || 0) + amount;

    // Calculate level ups
    const levelUps = [];
    let currentLevel = skillState.level;
    let xpRemaining = skillState.xp;

    while (currentLevel < skillDef.maxLevel) {
      const xpNeeded = xpForLevel(currentLevel, skillDef.xpPerLevel || 50);
      
      if (xpRemaining >= xpNeeded) {
        xpRemaining -= xpNeeded;
        currentLevel++;
        
        levelUps.push({
          skillId,
          skillName: skillDef.name,
          newLevel: currentLevel,
          xpRemaining
        });
      } else {
        break;
      }
    }

    // Apply final values
    skillState.level = currentLevel;
    skillState.xp = xpRemaining;

    // Return result (caller decides what to do with it)
    const result = {
      success: true,
      skillId,
      amount,
      totalXp: skillState.totalXp,
      level: skillState.level,
      levelUps,
      leveledUp: skillState.level > oldLevel
    };

    if (this._debug) {
      console.log('[SkillsSystem] addXP result:', result);
    }

    return result;
  },

  /**
   * Get skill level
   * @param {Object} state 
   * @param {string} skillId 
   * @returns {number}
   */
  getLevel(state, skillId) {
    return state.skills[skillId]?.level || 0;
  },

  /**
   * Get total XP in a skill
   * @param {Object} state 
   * @param {string} skillId 
   * @returns {number}
   */
  getTotalXP(state, skillId) {
    return state.skills[skillId]?.totalXp || 0;
  },

  /**
   * Get current XP toward next level
   * @param {Object} state 
   * @param {string} skillId 
   * @returns {number}
   */
  getCurrentXP(state, skillId) {
    return state.skills[skillId]?.xp || 0;
  },

  /**
   * Get XP needed for next level
   * @param {Object} state 
   * @param {string} skillId 
   * @returns {number|null}
   */
  getXPToNextLevel(state, skillId) {
    const skillDef = this.getSkillDefinition(skillId);
    const level = this.getLevel(state, skillId);
    
    if (!skillDef || level >= skillDef.maxLevel) {
      return null; // Max level or unknown skill
    }

    const currentXP = this.getCurrentXP(state, skillId);
    const needed = xpForLevel(level, skillDef.xpPerLevel || 50);
    
    return Math.max(0, needed - currentXP);
  },

  /**
   * Check if a skill is at max level
   * @param {Object} state 
   * @param {string} skillId 
   * @returns {boolean}
   */
  isMaxLevel(state, skillId) {
    const skillDef = this.getSkillDefinition(skillId);
    if (!skillDef) return false;
    
    return this.getLevel(state, skillId) >= skillDef.maxLevel;
  },

  /**
   * Evaluate a requirement against current state
   * @param {Object} state 
   * @param {Object} requirement - Requirement object
   * @returns {{met: boolean, reasons: string[]}}
   */
  evaluateRequirement(state, requirement) {
    if (!requirement) {
      return { met: true, reasons: [] };
    }

    // Handle compound requirements
    if (requirement.all) {
      const results = requirement.all.map(req => this.evaluateRequirement(state, req));
      const failures = results.filter(r => !r.met);
      
      if (failures.length === 0) {
        return { met: true, reasons: [] };
      }
      
      return {
        met: false,
        reasons: failures.flatMap(r => r.reasons)
      };
    }

    // Handle any requirements
    if (requirement.any) {
      const results = requirement.any.map(req => this.evaluateRequirement(state, req));
      const successes = results.filter(r => r.met);
      
      if (successes.length > 0) {
        return { met: true, reasons: [] };
      }
      
      return {
        met: false,
        reasons: ['None of the requirements are met']
      };
    }

    // Handle inventory requirement
    if (requirement.inventory) {
      const { itemId, min } = requirement.inventory;
      const actual = state.inventory?.[itemId] || 0;
      
      if (actual >= min) {
        return { met: true, reasons: [] };
      }
      
      return {
        met: false,
        reasons: [`Requires ${min} ${itemId}; you have ${actual}`]
      };
    }

    // Handle skill requirement
    if (requirement.skill) {
      const { skillId, minLevel } = requirement.skill;
      const actual = this.getLevel(state, skillId);
      
      if (actual >= minLevel) {
        return { met: true, reasons: [] };
      }
      
      return {
        met: false,
        reasons: [`Requires ${skillId} level ${minLevel}; you are level ${actual}`]
      };
    }

    // Handle capability requirement
    if (requirement.capability) {
      if (state.capabilities?.[requirement.capability]) {
        return { met: true, reasons: [] };
      }
      
      return {
        met: false,
        reasons: [`Requires capability: ${requirement.capability}`]
      };
    }

    // Unknown requirement type
    return {
      met: false,
      reasons: ['Unknown requirement type']
    };
  },

  /**
   * Reset a skill to level 0
   * @param {Object} state 
   * @param {string} skillId 
   * @returns {boolean}
   */
  resetSkill(state, skillId) {
    if (!state.skills[skillId]) {
      return false;
    }
    
    state.skills[skillId] = { ...DEFAULT_SKILL };
    return true;
  },

  /**
   * Get all skills for a state
   * @param {Object} state 
   * @returns {Object}
   */
  getAllSkills(state) {
    return { ...state.skills };
  },

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this._debug = enabled;
  }
};

export default SkillsSystem;