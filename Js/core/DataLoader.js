/**
 * DataLoader - Load JSON data files with caching and error handling
 * Configurable base path, timeout support, cache management
 */

const DataLoader = {
  _cache: {},
  _basePath: 'data/',
  _timeout: 5000, // 5 second timeout

  /**
   * Configure loader settings
   * @param {Object} options
   * @param {string} [options.basePath] - Base path for data files
   * @param {number} [options.timeout] - Fetch timeout in ms
   */
  configure(options = {}) {
    if (options.basePath) {
      this._basePath = options.basePath;
    }
    if (typeof options.timeout === 'number') {
      this._timeout = options.timeout;
    }
    console.log(`[DataLoader] Configured: basePath="${this._basePath}", timeout=${this._timeout}ms`);
  },

  /**
   * Load a single JSON file
   * @param {string} name - Name of the data file (without .json)
   * @returns {Promise<any>} Loaded data
   */
  async load(name) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError(`DataLoader.load: name must be a non-empty string`);
    }

    // Return cached data if available
    if (this._cache[name]) {
      return this._cache[name];
    }

    const url = `${this._basePath}${name}.json`;
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this._timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this._cache[name] = data;

      console.log(`[DataLoader] Loaded "${name}" (${Object.keys(data).length} items)`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[DataLoader] Timeout loading "${name}" (> ${this._timeout}ms)`);
      } else {
        console.error(`[DataLoader] Failed to load "${name}":`, error.message);
      }
      throw error;
    }
  },

  /**
   * Load multiple JSON files at once
   * @param {string[]} names - Array of data file names
   * @returns {Promise<Object>} Object with loaded data keyed by name
   */
  async loadAll(names) {
    if (!Array.isArray(names)) {
      throw new TypeError(`DataLoader.loadAll: names must be an array`);
    }

    console.log(`[DataLoader] Loading ${names.length} files...`);

    const results = {};
    const errors = [];

    // Load all in parallel
    const promises = names.map(async (name) => {
      try {
        const data = await this.load(name);
        results[name] = data;
      } catch (error) {
        errors.push({ name, error: error.message });
      }
    });

    await Promise.all(promises);

    if (errors.length > 0) {
      console.warn(`[DataLoader] ${errors.length} file(s) failed to load:`, errors);
      throw new Error(`Failed to load ${errors.length} file(s): ${errors.map(e => e.name).join(', ')}`);
    }

    console.log(`[DataLoader] All ${names.length} files loaded successfully`);
    return results;
  },

  /**
   * Get cached data without loading
   * @param {string} name - Name of the data file
   * @returns {any|null} Cached data or null if not loaded
   */
  get(name) {
    return this._cache[name] || null;
  },

  /**
   * Check if data is cached
   * @param {string} name - Name of the data file
   * @returns {boolean}
   */
  isCached(name) {
    return name in this._cache;
  },

  /**
   * Clear the cache
   * @param {string} [name] - Specific cache to clear, or omit for all
   */
  clearCache(name) {
    if (name) {
      delete this._cache[name];
      console.log(`[DataLoader] Cleared cache for "${name}"`);
    } else {
      this._cache = {};
      console.log('[DataLoader] Cleared all caches');
    }
  },

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    const entries = Object.entries(this._cache);
    return {
      count: entries.length,
      entries: entries.map(([name, data]) => ({
        name,
        size: JSON.stringify(data).length,
        keys: Object.keys(data).length
      }))
    };
  }
};

export default DataLoader;