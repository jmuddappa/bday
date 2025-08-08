/**
 * Event Emitter Utility
 * Provides event-driven communication between game systems
 */

import { ErrorHandler } from './ErrorHandler.js';

export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this.events.has(event)) {
      return false;
    }

    const listeners = this.events.get(event);
    listeners.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        ErrorHandler.handleError(error, `EventEmitter.emit(${event})`);
      }
    });

    return true;
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.events.has(event)) {
      return false;
    }

    const listeners = this.events.get(event);
    const index = listeners.indexOf(callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
      
      // Clean up empty event arrays
      if (listeners.length === 0) {
        this.events.delete(event);
      }
      return true;
    }
    
    return false;
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get all listeners for an event
   * @param {string} event - Event name
   * @returns {Array} Array of listener functions
   */
  listeners(event) {
    return this.events.has(event) ? [...this.events.get(event)] : [];
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  /**
   * Get all event names
   * @returns {Array} Array of event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get maximum number of listeners (for memory leak detection)
   * @returns {number} Max listeners per event
   */
  getMaxListeners() {
    return this.maxListeners || 10;
  }

  /**
   * Set maximum number of listeners per event
   * @param {number} n - Maximum listeners
   */
  setMaxListeners(n) {
    this.maxListeners = n;
  }
}