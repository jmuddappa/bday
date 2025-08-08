/**
 * Validation Utilities
 * Helper functions for validation, collision detection, and math operations
 */

import { CONFIG } from '../config/gameConfig.js';

export class ValidationUtils {
  /**
   * Check if a position is within canvas bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} canvas - Canvas object (optional)
   * @returns {boolean} True if position is valid
   */
  static isValidPosition(x, y, canvas = null) {
    const width = canvas ? canvas.width : CONFIG.CANVAS.WIDTH;
    const height = canvas ? canvas.height : CONFIG.CANVAS.HEIGHT;
    return x >= 0 && y >= 0 && x < width && y < height;
  }

  /**
   * Clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Calculate distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance between points
   */
  static calculateDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check collision between two rectangles
   * @param {Object} rect1 - First rectangle {x, y, width, height}
   * @param {Object} rect2 - Second rectangle {x, y, width, height}
   * @returns {boolean} True if rectangles are colliding
   */
  static isColliding(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * Check if a point is inside a rectangle
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @param {Object} rect - Rectangle {x, y, width, height}
   * @returns {boolean} True if point is inside rectangle
   */
  static isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  /**
   * Check if a circle and rectangle are colliding
   * @param {Object} circle - Circle {x, y, radius}
   * @param {Object} rect - Rectangle {x, y, width, height}
   * @returns {boolean} True if circle and rectangle are colliding
   */
  static isCircleRectColliding(circle, rect) {
    const closestX = this.clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = this.clamp(circle.y, rect.y, rect.y + rect.height);
    
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < circle.radius * circle.radius;
  }

  /**
   * Get the center point of a rectangle
   * @param {Object} rect - Rectangle {x, y, width, height}
   * @returns {Object} Center point {x, y}
   */
  static getRectCenter(rect) {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }

  /**
   * Get the overlap area between two rectangles
   * @param {Object} rect1 - First rectangle
   * @param {Object} rect2 - Second rectangle
   * @returns {Object|null} Overlap rectangle or null if no overlap
   */
  static getRectOverlap(rect1, rect2) {
    if (!this.isColliding(rect1, rect2)) {
      return null;
    }

    const left = Math.max(rect1.x, rect2.x);
    const top = Math.max(rect1.y, rect2.y);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  /**
   * Normalize a vector
   * @param {Object} vector - Vector {x, y}
   * @returns {Object} Normalized vector {x, y}
   */
  static normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (magnitude === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  }

  /**
   * Calculate angle between two points in radians
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Angle in radians
   */
  static calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Convert radians to degrees
   * @param {number} radians - Angle in radians
   * @returns {number} Angle in degrees
   */
  static radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  static degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Linear interpolation between two values
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  static lerp(start, end, t) {
    return start + (end - start) * this.clamp(t, 0, 1);
  }

  /**
   * Check if a number is within a range
   * @param {number} value - Value to check
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} True if value is in range
   */
  static isInRange(value, min, max) {
    return value >= min && value <= max;
  }

  /**
   * Round a number to specified decimal places
   * @param {number} value - Value to round
   * @param {number} decimals - Number of decimal places
   * @returns {number} Rounded value
   */
  static roundToDecimals(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Check if a value is a valid number
   * @param {any} value - Value to check
   * @returns {boolean} True if value is a valid number
   */
  static isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Generate a random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  static randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  static randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}