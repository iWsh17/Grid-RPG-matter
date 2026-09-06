/**
 * Utils - Helper functions
 */

export const Utils = {
  getNested(obj, path) {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value?.[key] === undefined) return undefined;
      value = value[key];
    }
    return value;
  },

  setNested(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  clamp(min, value, max) {
    return Math.max(min, Math.min(max, value));
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

export default Utils;