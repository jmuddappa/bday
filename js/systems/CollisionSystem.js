/**
 * Collision Detection System
 * Handles collision detection between game entities and world boundaries
 */

import { ValidationUtils } from '../utils/ValidationUtils.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class CollisionSystem {
  constructor() {
    this.collisionBoxes = [];
  }

  /**
   * Set collision boxes for the world
   * @param {Array} collisionBoxes - Array of collision box objects
   */
  setCollisionBoxes(collisionBoxes) {
    this.collisionBoxes = collisionBoxes || [];
  }

  /**
   * Check if a rectangle collides with world collision boxes
   * @param {Object} bounds - Rectangle bounds {x, y, width, height}
   * @param {Array} collisionBoxes - Optional collision boxes to check against
   * @returns {boolean} True if collision detected
   */
  checkCollision(bounds, collisionBoxes = null) {
    const boxes = collisionBoxes || this.collisionBoxes;
    
    try {
      return boxes.some(box => ValidationUtils.isColliding(bounds, box));
    } catch (error) {
      ErrorHandler.handleError(error, 'CollisionSystem.checkCollision');
      return false;
    }
  }

  /**
   * Check if a point is inside any collision box
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} collisionBoxes - Optional collision boxes to check against
   * @returns {boolean} True if point is inside a collision box
   */
  checkPointCollision(x, y, collisionBoxes = null) {
    const boxes = collisionBoxes || this.collisionBoxes;
    
    return boxes.some(box => {
      return x >= box.x && x <= box.x + box.width &&
             y >= box.y && y <= box.y + box.height;
    });
  }

  /**
   * Get all collision boxes that intersect with given bounds
   * @param {Object} bounds - Rectangle bounds to check
   * @param {Array} collisionBoxes - Optional collision boxes to check against
   * @returns {Array} Array of intersecting collision boxes
   */
  getIntersectingBoxes(bounds, collisionBoxes = null) {
    const boxes = collisionBoxes || this.collisionBoxes;
    
    return boxes.filter(box => ValidationUtils.isColliding(bounds, box));
  }

  /**
   * Check collision between two entities
   * @param {Object} entity1 - First entity with getBounds() method
   * @param {Object} entity2 - Second entity with getBounds() method
   * @returns {boolean} True if entities are colliding
   */
  checkEntityCollision(entity1, entity2) {
    try {
      const bounds1 = entity1.getBounds();
      const bounds2 = entity2.getBounds();
      return ValidationUtils.isColliding(bounds1, bounds2);
    } catch (error) {
      ErrorHandler.handleError(error, 'CollisionSystem.checkEntityCollision');
      return false;
    }
  }

  /**
   * Find the closest collision box to a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} collisionBoxes - Optional collision boxes to check against
   * @returns {Object|null} Closest collision box or null
   */
  getClosestCollisionBox(x, y, collisionBoxes = null) {
    const boxes = collisionBoxes || this.collisionBoxes;
    
    let closestBox = null;
    let closestDistance = Infinity;
    
    boxes.forEach(box => {
      // Calculate distance to box center
      const boxCenterX = box.x + box.width / 2;
      const boxCenterY = box.y + box.height / 2;
      const distance = ValidationUtils.calculateDistance(x, y, boxCenterX, boxCenterY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestBox = box;
      }
    });
    
    return closestBox;
  }

  /**
   * Check if movement from one position to another would cause collision
   * @param {number} fromX - Starting X position
   * @param {number} fromY - Starting Y position
   * @param {number} toX - Target X position
   * @param {number} toY - Target Y position
   * @param {number} width - Entity width
   * @param {number} height - Entity height
   * @param {Array} collisionBoxes - Optional collision boxes to check against
   * @returns {boolean} True if movement would cause collision
   */
  wouldCollide(fromX, fromY, toX, toY, width, height, collisionBoxes = null) {
    const targetBounds = {
      x: toX,
      y: toY,
      width: width,
      height: height
    };
    
    return this.checkCollision(targetBounds, collisionBoxes);
  }

  /**
   * Get collision response for entity movement
   * @param {Object} entity - Entity attempting to move
   * @param {number} deltaX - Attempted X movement
   * @param {number} deltaY - Attempted Y movement
   * @param {Array} collisionBoxes - Optional collision boxes to check against
   * @returns {Object} Movement response {canMove, adjustedX, adjustedY}
   */
  getMovementResponse(entity, deltaX, deltaY, collisionBoxes = null) {
    const currentBounds = entity.getBounds();
    const targetX = currentBounds.x + deltaX;
    const targetY = currentBounds.y + deltaY;
    
    // Check if target position would collide
    const wouldCollide = this.wouldCollide(
      currentBounds.x, currentBounds.y,
      targetX, targetY,
      currentBounds.width, currentBounds.height,
      collisionBoxes
    );
    
    if (!wouldCollide) {
      return {
        canMove: true,
        adjustedX: targetX,
        adjustedY: targetY
      };
    }
    
    // Try moving only on X axis
    const canMoveX = !this.wouldCollide(
      currentBounds.x, currentBounds.y,
      targetX, currentBounds.y,
      currentBounds.width, currentBounds.height,
      collisionBoxes
    );
    
    // Try moving only on Y axis
    const canMoveY = !this.wouldCollide(
      currentBounds.x, currentBounds.y,
      currentBounds.x, targetY,
      currentBounds.width, currentBounds.height,
      collisionBoxes
    );
    
    return {
      canMove: false,
      adjustedX: canMoveX ? targetX : currentBounds.x,
      adjustedY: canMoveY ? targetY : currentBounds.y,
      canMoveX: canMoveX,
      canMoveY: canMoveY
    };
  }

  /**
   * Add a new collision box
   * @param {Object} collisionBox - Collision box {x, y, width, height}
   */
  addCollisionBox(collisionBox) {
    if (collisionBox && typeof collisionBox === 'object') {
      this.collisionBoxes.push(collisionBox);
    }
  }

  /**
   * Remove a collision box
   * @param {number} index - Index of collision box to remove
   */
  removeCollisionBox(index) {
    if (index >= 0 && index < this.collisionBoxes.length) {
      this.collisionBoxes.splice(index, 1);
    }
  }

  /**
   * Clear all collision boxes
   */
  clearCollisionBoxes() {
    this.collisionBoxes = [];
  }

  /**
   * Get all collision boxes
   * @returns {Array} Array of collision boxes
   */
  getCollisionBoxes() {
    return [...this.collisionBoxes];
  }
}