/**
 * Input Management System
 * Handles keyboard input and dispatches game events
 */

import { EventEmitter } from '../utils/EventEmitter.js';

export class InputManager extends EventEmitter {
  constructor() {
    super();
    this.keys = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Prevent default behavior for game keys
    document.addEventListener('keydown', (e) => {
      if (this.isGameKey(e.key)) {
        e.preventDefault();
      }
    });
  }

  handleKeyDown(e) {
    if (!this.keys.has(e.key)) {
      this.keys.add(e.key);
      this.emit('keydown', e.key);
      
      // Handle specific key events
      this.handleSpecificKeys(e.key);
      
      // Signal that audio interaction is requested
      this.emit('audioRequested');
    }
  }

  handleKeyUp(e) {
    this.keys.delete(e.key);
    this.emit('keyup', e.key);
  }

  handleSpecificKeys(key) {
    switch (key) {
      case 'e':
      case 'E':
        this.emit('interact');
        break;
      case 'F3':
        this.emit('toggleDebug');
        break;
      case ';':
        this.emit('toggleCollisions');
        break;
      case 'Escape':
        this.emit('closeModals');
        break;
    }
  }

  isGameKey(key) {
    const gameKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'w', 'a', 's', 'd', 'e', 'E', 'F3', ';', 'Escape'
    ];
    return gameKeys.includes(key);
  }

  /**
   * Check if a key is currently pressed
   * @param {string} key - Key to check
   * @returns {boolean}
   */
  isKeyPressed(key) {
    return this.keys.has(key);
  }

  /**
   * Get current movement input as a normalized vector
   * @returns {Object} Movement input with dx, dy, and direction
   */
  getMovementInput() {
    const movement = { dx: 0, dy: 0, direction: null };

    if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a')) {
      movement.dx = -1;
      movement.direction = 'left';
    }
    if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('d')) {
      movement.dx = 1;
      movement.direction = 'right';
    }
    if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('w')) {
      movement.dy = -1;
      movement.direction = 'up';
    }
    if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s')) {
      movement.dy = 1;
      movement.direction = 'down';
    }

    return movement;
  }

  /**
   * Get all currently pressed keys
   * @returns {Set} Set of pressed keys
   */
  getPressedKeys() {
    return new Set(this.keys);
  }

  /**
   * Clear all pressed keys (useful for focus loss)
   */
  clearKeys() {
    this.keys.clear();
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}