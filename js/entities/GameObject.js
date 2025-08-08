/**
 * Base GameObject Class
 * Common functionality for all game entities
 */

import { CONFIG } from '../config/gameConfig.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';

export class GameObject {
  constructor(x, y, width, height) {
    this.x = ValidationUtils.clamp(x, 0, CONFIG.CANVAS.WIDTH - width);
    this.y = ValidationUtils.clamp(y, 0, CONFIG.CANVAS.HEIGHT - height);
    this.width = width;
    this.height = height;
    this.id = GameObject.generateId();
  }

  /**
   * Generate unique ID for game objects
   * @returns {string} Unique ID
   */
  static generateId() {
    return 'obj_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get bounding rectangle for collision detection
   * @returns {Object} Bounds object {x, y, width, height}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Get center point of the object
   * @returns {Object} Center point {x, y}
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  /**
   * Calculate distance to another game object
   * @param {GameObject} other - Other game object
   * @returns {number} Distance between objects
   */
  distanceTo(other) {
    const center1 = this.getCenter();
    const center2 = other.getCenter();
    return ValidationUtils.calculateDistance(center1.x, center1.y, center2.x, center2.y);
  }

  /**
   * Check if this object is colliding with another
   * @param {GameObject} other - Other game object
   * @returns {boolean} True if objects are colliding
   */
  isCollidingWith(other) {
    return ValidationUtils.isColliding(this.getBounds(), other.getBounds());
  }

  /**
   * Check if a point is inside this object
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is inside
   */
  containsPoint(x, y) {
    return ValidationUtils.isPointInRect(x, y, this.getBounds());
  }

  /**
   * Set position of the object
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.x = ValidationUtils.clamp(x, 0, CONFIG.CANVAS.WIDTH - this.width);
    this.y = ValidationUtils.clamp(y, 0, CONFIG.CANVAS.HEIGHT - this.height);
  }

  /**
   * Move the object by offset
   * @param {number} dx - X offset
   * @param {number} dy - Y offset
   */
  moveBy(dx, dy) {
    this.setPosition(this.x + dx, this.y + dy);
  }

  /**
   * Get object as a JSON serializable object
   * @returns {Object} Serializable object data
   */
  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      type: this.constructor.name
    };
  }

  /**
   * Update object state (to be overridden by subclasses)
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Override in subclasses
  }

  /**
   * Render object (to be overridden by subclasses)
   * @param {CanvasRenderingContext2D} ctx - Rendering context
   */
  render(ctx) {
    // Override in subclasses
  }

  /**
   * Clean up object resources
   */
  destroy() {
    // Override in subclasses if cleanup is needed
  }
}