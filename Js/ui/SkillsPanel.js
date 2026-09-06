/**
 * SkillsPanel - Display skill levels and XP bars
 * 
 * Usage:
 *   SkillsPanel.initialize(document.getElementById('skills-container'));
 */

const SkillsPanel = {
  container: null,
  isOpen: true,

  /**
   * Initialize the panel
   * @param {HTMLElement} container - DOM element to render into
   */
  initialize(container) {
    console.log('[SkillsPanel] Initializing...');
    this.container = container;
    
    // Listen for skill updates
    window.EventBus.on('skill.xpGain', (data) => {
      SkillsPanel.updateSkill(data.skillId);
    });

    window.EventBus.on('skill.levelUp', (data) => {
      SkillsPanel.updateSkill(data.skillId);
      SkillsPanel.showLevelUpNotification(data);
    });

    // Initial render
    this.render();
    
    console.log('[SkillsPanel] Ready');
  },

  /**
   * Render the entire panel
   */
  render() {
    if (!this.container) return;

    const skills = window.SkillManager.getAllSkills();
    
    this.container.innerHTML = `
      <div class="skills-list">
        ${skills.map(skill => this.renderSkillBar(skill)).join('')}
      </div>
    `;
  },

  /**
   * Render a single skill bar
   * @param {Object} skill - Skill data
   * @returns {string} HTML string
   */
  renderSkillBar(skill) {
    const xpNeeded = window.SkillManager.getXpForNextLevel(skill.level, skill.id);
    const xpCurrent = skill.xp;
    const percentage = skill.xpPercentage;
    
    return `
      <div class="skill-bar" data-skill="${skill.id}">
        <div class="skill-header">
          <span class="skill-icon">${skill.icon}</span>
          <span class="skill-name">${skill.name}</span>
          <span class="skill-level">Lv. ${skill.level}</span>
        </div>
        <div class="xp-bar-container">
          <div class="xp-bar-fill" style="width: ${percentage}%; background: ${skill.color || '#4CAF50'};"></div>
          <span class="xp-bar-text">${xpCurrent} / ${xpNeeded} XP (${percentage}%)</span>
        </div>
      </div>
    `;
  },

  /**
   * Update a single skill bar
   * @param {string} skillId - Skill ID to update
   */
  updateSkill(skillId) {
    const skill = window.SkillManager.getAllSkills().find(s => s.id === skillId);
    if (!skill) return;

    const element = this.container.querySelector(`[data-skill="${skillId}"]`);
    if (!element) {
      // Re-render entire panel if element not found
      this.render();
      return;
    }

    element.outerHTML = this.renderSkillBar(skill);
  },

  /**
   * Show level up notification
   * @param {Object} data - Level up data
   */
  showLevelUpNotification(data) {
    // Simple console notification for now
    console.log(`🎉 ${data.skillName} reached level ${data.newLevel}!`);
    
    // Visual flash on the skill bar
    const element = this.container.querySelector(`[data-skill="${data.skillId}"]`);
    if (element) {
      element.style.animation = 'pulse 0.5s ease';
      setTimeout(() => {
        element.style.animation = '';
      }, 500);
    }
  },

  /**
   * Toggle panel open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
    
    if (this.container) {
      this.container.style.display = this.isOpen ? 'block' : 'none';
    }
  },

  /**
   * Cleanup
   */
  destroy() {
    this.container = null;
    console.log('[SkillsPanel] Destroyed');
  }
};

// Export for ES modules
export default SkillsPanel;

// Also make available globally
window.SkillsPanel = SkillsPanel;

console.log('[SkillsPanel] Module loaded');