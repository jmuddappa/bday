/**
 * Player Entity
 * Represents the player character with movement and collision
 */

import { CONFIG } from '../config/gameConfig.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import { GameObject } from './GameObject.js';

export class Player extends GameObject {
  constructor() {
    super(
      CONFIG.PLAYER.INITIAL_X,
      CONFIG.PLAYER.INITIAL_Y,
      CONFIG.PLAYER.WIDTH,
      CONFIG.PLAYER.HEIGHT
    );
    
    this.speed = CONFIG.PLAYER.SPEED;
    this.direction = 'down';
    this.sprites = new Map();
    this.lastPosition = { x: this.x, y: this.y };
  }

  /**
   * Set player sprite images
   * @param {HTMLImageElement} frontSprite - Front-facing sprite
   * @param {HTMLImageElement} sideSprite - Side-facing sprite
   * @param {HTMLImageElement} backSprite - Back-facing sprite
   */
  setSprites(frontSprite, sideSprite, backSprite) {
    this.sprites.set('front', frontSprite);
    this.sprites.set('side', sideSprite);
    this.sprites.set('back', backSprite);
  }

  /**
   * Attempt to move the player
   * @param {number} dx - X movement delta
   * @param {number} dy - Y movement delta
   * @param {Array} collisionBoxes - Array of collision boxes to check against
   * @returns {boolean} True if movement was successful
   */
  move(dx, dy, collisionBoxes) {
    // Store current position
    this.lastPosition.x = this.x;
    this.lastPosition.y = this.y;
    
    const newX = this.x + dx;
    const newY = this.y + dy;

    if (this.canMoveTo(newX, newY, collisionBoxes)) {
      this.x = ValidationUtils.clamp(newX, 0, CONFIG.CANVAS.WIDTH - this.width);
      this.y = ValidationUtils.clamp(newY, 0, CONFIG.CANVAS.HEIGHT - this.height);
      return true;
    }
    
    return false; // Movement blocked by collision
  }

  /**
   * Check if the player can move to a specific position
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   * @param {Array} collisionBoxes - Array of collision boxes to check against
   * @returns {boolean} True if movement is possible
   */
  canMoveTo(x, y, collisionBoxes) {
    const playerBounds = { 
      x, 
      y, 
      width: this.width, 
      height: this.height 
    };
    
    // Check world boundaries
    if (x < 0 || y < 0 || 
        x + this.width > CONFIG.CANVAS.WIDTH || 
        y + this.height > CONFIG.CANVAS.HEIGHT) {
      return false;
    }
    
    // Check collision boxes
    return !collisionBoxes.some(box => ValidationUtils.isColliding(playerBounds, box));
  }

  /**
   * Set player movement direction
   * @param {string} direction - Movement direction ('up', 'down', 'left', 'right')
   */
  setDirection(direction) {
    const validDirections = ['up', 'down', 'left', 'right'];
    if (validDirections.includes(direction)) {
      this.direction = direction;
    }
  }

  /**
   * Get the current sprite based on direction
   * @returns {HTMLImageElement|null} Current sprite
   */
  getCurrentSprite() {
    switch (this.direction) {
      case 'left':
      case 'right':
        return this.sprites.get('side');
      case 'up':
        return this.sprites.get('back');
      default:
        return this.sprites.get('front');
    }
  }

  /**
   * Get drawing dimensions based on current direction
   * @returns {Object} Drawing dimensions {width, height}
   */
  getDrawDimensions() {
    const isUp = this.direction === 'up';
    return {
      width: CONFIG.PLAYER.SPRITE_WIDTH,
      height: isUp ? CONFIG.PLAYER.SPRITE_HEIGHT_UP : CONFIG.PLAYER.SPRITE_HEIGHT
    };
  }

  /**
   * Get player's current facing direction as a vector
   * @returns {Object} Direction vector {x, y}
   */
  getDirectionVector() {
    switch (this.direction) {
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Check if player is moving
   * @returns {boolean} True if player has moved since last frame
   */
  isMoving() {
    return this.x !== this.lastPosition.x || this.y !== this.lastPosition.y;
  }

  /**
   * Get movement speed
   * @returns {number} Current movement speed
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * Set movement speed
   * @param {number} speed - New movement speed
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed);
  }

  /**
   * Reset player to initial position
   */
  reset() {
    this.x = CONFIG.PLAYER.INITIAL_X;
    this.y = CONFIG.PLAYER.INITIAL_Y;
    this.direction = 'down';
    this.lastPosition = { x: this.x, y: this.y };
  }

  /**
   * Get player state for serialization
   * @returns {Object} Player state
   */
  getState() {
    return {
      ...this.toJSON(),
      direction: this.direction,
      speed: this.speed,
      lastPosition: { ...this.lastPosition }
    };
  }

  /**
   * Restore player state from serialized data
   * @param {Object} state - Player state data
   */
  setState(state) {
    this.x = state.x || this.x;
    this.y = state.y || this.y;
    this.direction = state.direction || this.direction;
    this.speed = state.speed || this.speed;
    this.lastPosition = state.lastPosition || { x: this.x, y: this.y };
  }

  /**
   * Update player (called each frame)
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Player update logic can be added here
    // For example: animation frame updates, status effects, etc.
  }
}