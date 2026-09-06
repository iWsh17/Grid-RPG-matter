/**
 * EventBus - Central event system for decoupled communication
 * Production-ready with validation, debug mode, and clean API
 */

const EventBus = {
  _events: {},
  _debug: false,

  /**
   * Enable/disable debug logging
   * @param {boolean} enabled 
   */
  setDebug(enabled) {
    this._debug = enabled;
  },

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'resource.gathered')
   * @param {Function} callback - Function to call when event fires
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof event !== 'string') {
      throw new TypeError(`EventBus.on: event must be a string, got ${typeof event}`);
    }
    if (typeof callback !== 'function') {
      throw new TypeError(`EventBus.on: callback must be a function, got ${typeof callback}`);
    }

    if (!this._events[event]) {
      this._events[event] = new Set();
    }
    this._events[event].add(callback);

    if (this._debug) {
      console.log(`[EventBus] Subscribed to "${event}" (${this._events[event].size} listeners)`);
    }

    // Return unsubscribe function for convenience
    return () => this.off(event, callback);
  },

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} [data] - Data to pass to callbacks
   */
  emit(event, data = {}) {
    if (typeof event !== 'string') {
      throw new TypeError(`EventBus.emit: event must be a string, got ${typeof event}`);
    }

    const callbacks = this._events[event];
    
    if (!callbacks) {
      if (this._debug) {
        console.warn(`[EventBus] No listeners for "${event}"`);
      }
      return;
    }

    if (this._debug) {
      console.log(`[EventBus] Emitting "${event}"`, data);
    }

    // Use Set iteration (safe even if callbacks are removed during iteration)
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in "${event}" callback:`, error);
        // Continue calling other callbacks (don't let one break the rest)
      }
    });
  },

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - The callback to remove
   */
  off(event, callback) {
    if (typeof event !== 'string') {
      throw new TypeError(`EventBus.off: event must be a string, got ${typeof event}`);
    }

    const callbacks = this._events[event];
    if (!callbacks) return;

    callbacks.delete(callback);

    if (this._debug) {
      console.log(`[EventBus] Unsubscribed from "${event}" (${callbacks.size} listeners)`);
    }

    // Clean up empty event
    if (callbacks.size === 0) {
      delete this._events[event];
    }
  },

  /**
   * Clear all listeners for an event (or all events)
   * @param {string} [event] - Event name to clear, or omit for all
   */
  clear(event) {
    if (event) {
      if (typeof event !== 'string') {
        throw new TypeError(`EventBus.clear: event must be a string, got ${typeof event}`);
      }
      delete this._events[event];
      if (this._debug) {
        console.log(`[EventBus] Cleared listeners for "${event}"`);
      }
    } else {
      this._events = {};
      if (this._debug) {
        console.log('[EventBus] Cleared all listeners');
      }
    }
  },

  /**
   * Get number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    const callbacks = this._events[event];
    return callbacks ? callbacks.size : 0;
  },

  /**
   * Get all event names with listeners
   * @returns {string[]} Array of event names
   */
  getEvents() {
    return Object.keys(this._events);
  }
};

export default EventBus;