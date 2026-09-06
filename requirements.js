import { getInventoryAmount, getSkill } from './core.js';

export function evaluateRequirement(state, requirement) {
  if (!requirement) return { met: true, code: 'REQUIREMENTS_MET', reasons: [] };

  if (requirement.all) {
    const results = requirement.all.map(item => evaluateRequirement(state, item));
    const failures = results.filter(item => !item.met);
    if (failures.length === 0) return { met: true, code: 'REQUIREMENTS_MET', reasons: [] };
    if (failures.length === 1) return failures[0];
    return { met: false, code: 'REQUIREMENTS_MISSING', reasons: failures.flatMap(item => item.reasons) };
  }

  if (requirement.inventory) {
    const { itemId, min } = requirement.inventory;
    const actual = getInventoryAmount(state, itemId);
    if (actual >= min) return { met: true, code: 'REQUIREMENT_MET', reasons: [] };
    return { met: false, code: 'MISSING_ITEM', reasons: [`Requires ${min} ${itemId}; you have ${actual}.`] };
  }

  if (requirement.skill) {
    const { skillId, minLevel } = requirement.skill;
    const actual = getSkill(state, skillId).level;
    if (actual >= minLevel) return { met: true, code: 'REQUIREMENT_MET', reasons: [] };
    return { met: false, code: 'MISSING_SKILL_LEVEL', reasons: [`Requires ${skillId} level ${minLevel}; you are level ${actual}.`] };
  }

  if (requirement.capability) {
    if (state.capabilities[requirement.capability]) return { met: true, code: 'REQUIREMENT_MET', reasons: [] };
    return { met: false, code: 'MISSING_CAPABILITY', reasons: [`Requires capability: ${requirement.capability}.`] };
  }

  return { met: false, code: 'UNKNOWN_REQUIREMENT', reasons: ['This requirement type is not supported yet.'] };
}
