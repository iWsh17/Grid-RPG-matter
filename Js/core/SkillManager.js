/**
 * SkillManager - Skill logic (XP, levels, requirements)
 * 
 * Usage:
 *   // Initialize with skill data
 *   SkillManager.initialize(skillData);
 *   
 *   // Add XP
 *   const levelUps = SkillManager.addXp('foraging', 50);
 *   
 *   // Check requirements
 *   const canGather = SkillManager.meetsRequirement('foraging', 10);
 *   
 *   // Get skill info
 *   const skill = SkillManager.getSkill('foraging');
 */

const SkillManager = {
  // Skill definitions from JSON
  _skillData: null,

  /**
   * Initialize with skill data
   * @param {Object} skillData - Loaded from skills.json
   */
  initialize(skillData) {
    console.log('[SkillManager] Initializing...');
    this._skillData = skillData;
    
    // Validate skill data
    if (!skillData || !skillData.skills || !Array.isArray(skillData.skills)) {
      console.error('[SkillManager] Invalid skill data');
      return false;
    }

    console.log(`[SkillManager] Loaded ${skillData.skills.length} skills`);
    return true;
  },

  /**
   * Get skill definition by ID
   * @param {string} skillId - Skill ID (e.g., 'foraging')
   * @returns {Object|null} Skill definition
   */
  getSkillDefinition(skillId) {
    if (!this._skillData) return null;
    
    return this._skillData.skills.find(s => s.id === skillId) || null;
  },

  /**
   * Calculate XP needed for next level
   * @param {number} currentLevel - Current skill level
   * @param {string} skillId - Skill ID (for skill-specific curves)
   * @returns {number} XP needed
   */
  getXpForNextLevel(currentLevel, skillId = null) {
    const skillDef = skillId ? this.getSkillDefinition(skillId) : null;
    const baseXp = skillDef ? skillDef.baseXpPerLevel : 50;
    
    // Linear curve: 50, 100, 150, 200...
    return baseXp * (currentLevel + 1);
  },

  /**
   * Calculate total XP needed to reach a level
   * @param {number} targetLevel - Target level
   * @param {string} skillId - Skill ID
   * @returns {number} Total XP
   */
  getTotalXpForLevel(targetLevel, skillId = null) {
    let total = 0;
    for (let i = 0; i < targetLevel; i++) {
      total += this.getXpForNextLevel(i, skillId);
    }
    return total;
  },

  /**
   * Add XP to a skill and return level-ups
   * @param {string} skillId - Skill ID
   * @param {number} amount - XP to add
   * @returns {Array} Array of level-up events
   */
  addXp(skillId, amount) {
    const skillState = GameState.get(`skills.${skillId}`);
    const skillDef = this.getSkillDefinition(skillId);
    
    if (!skillState || !skillDef) {
      console.error(`[SkillManager] Cannot add XP to "${skillId}": not found`);
      return [];
    }

    const levelUps = [];
    skillState.totalXp += amount;
    skillState.xp += amount;

    // Check for level-ups
    while (skillState.level < skillDef.maxLevel) {
      const xpNeeded = this.getXpForNextLevel(skillState.level, skillId);
      
      if (skillState.xp >= xpNeeded) {
        skillState.xp -= xpNeeded;
        skillState.level++;
        
        levelUps.push({
          skillId: skillId,
          skillName: skillDef.name,
          newLevel: skillState.level,
          icon: skillDef.icon
        });

        console.log(`[SkillManager] ${skillDef.name} reached level ${skillState.level}!`);
        
        // Emit event for UI to handle
        window.EventBus.emit('skill.levelUp', {
          skillId: skillId,
          skillName: skillDef.name,
          level: skillState.level,
          icon: skillDef.icon
        });
      } else {
        break;
      }
    }

    // Update state
    GameState.update(`skills.${skillId}`, skillState);

    // Emit XP gain event
    window.EventBus.emit('skill.xpGain', {
      skillId: skillId,
      amount: amount,
      totalXp: skillState.totalXp,
      level: skillState.level
    });

    return levelUps;
  },

  /**
   * Check if player meets a skill requirement
   * @param {string} skillId - Skill ID
   * @param {number} requiredLevel - Required level
   * @returns {boolean} Meets requirement
   */
  meetsRequirement(skillId, requiredLevel) {
    const skillState = GameState.get(`skills.${skillId}`);
    return skillState && skillState.level >= requiredLevel;
  },

  /**
   * Get XP percentage for current level progress
   * @param {string} skillId - Skill ID
   * @returns {number} XP percentage (0-100)
   */
  getXpPercentage(skillId) {
    const skillState = GameState.get(`skills.${skillId}`);
    const skillDef = this.getSkillDefinition(skillId);
    
    if (!skillState || !skillDef) return 0;

    const xpNeeded = this.getXpForNextLevel(skillState.level, skillId);
    if (xpNeeded === 0) return 100;

    return Math.min(100, Math.round((skillState.xp / xpNeeded) * 100));
  },

  /**
   * Get all skills with current state
   * @returns {Array} Array of skill info objects
   */
  getAllSkills() {
    if (!this._skillData) return [];

    return this._skillData.skills.map(skillDef => {
      const skillState = GameState.get(`skills.${skillDef.id}`);
      return {
        ...skillDef,
        level: skillState.level,
        xp: skillState.xp,
        totalXp: skillState.totalXp,
        xpPercentage: this.getXpPercentage(skillDef.id)
      };
    });
  },

  /**
   * Get resources unlocked by a skill level
   * @param {string} skillId - Skill ID
   * @param {number} level - Skill level
   * @returns {Array} Array of resource IDs
   */
  getUnlockedResources(skillId, level) {
    const skillDef = this.getSkillDefinition(skillId);
    if (!skillDef) return [];

    // For now, return all resources (could be filtered by tier based on level)
    return skillDef.unlocksResources || [];
  },

  /**
   * Check if a resource is unlocked by player's skills
   * @param {string} resourceId - Resource ID
   * @returns {boolean} Is unlocked
   */
  isResourceUnlocked(resourceId) {
    // Check each skill's unlocked resources
    const allSkills = this.getAllSkills();
    
    for (const skill of allSkills) {
      if (skill.unlocksResources.includes(resourceId)) {
        return true;
      }
    }

    return false;
  }
};

// Export for ES modules
export default SkillManager;

// Also make available globally for non-module scripts
window.SkillManager = SkillManager;

console.log('[SkillManager] Initialized');