/**
 * Mailbox Entity
 * Represents the interactive mailbox that opens the mail system
 */

import { CONFIG } from '../config/gameConfig.js';
import { GameObject } from './GameObject.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';

export class Mailbox extends GameObject {
  constructor() {
    super(CONFIG.MAILBOX.X, CONFIG.MAILBOX.Y, 50, 50);
    this.interactionDistance = CONFIG.MAILBOX.INTERACTION_DISTANCE;
    this.isActive = false;
    this.lastInteractionTime = 0;
  }

  /**
   * Check if player is nearby and can interact
   * @param {Player} player - Player entity
   * @returns {boolean} True if player can interact
   */
  isPlayerNearby(player) {
    return this.distanceTo(player) < this.interactionDistance;
  }

  /**
   * Get prompt position on screen
   * @param {HTMLCanvasElement} canvas - Canvas element for coordinate conversion
   * @returns {Object} Screen position {x, y}
   */
  getPromptPosition(canvas) {
    // Calculate mailbox center in world coordinates
    const mailboxCenterX = this.x + this.width / 2;
    const mailboxCenterY = this.y + this.height / 2;
    
    // Get canvas scaling and position
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / CONFIG.CANVAS.WIDTH;
    const scaleY = canvasRect.height / CONFIG.CANVAS.HEIGHT;
    
    // Convert world coordinates to screen coordinates
    const screenX = (mailboxCenterX * scaleX) + canvasRect.left + 
                   (CONFIG.MAILBOX.PROMPT_OFFSET_X * scaleX);
    const screenY = (mailboxCenterY * scaleY) + canvasRect.top + 
                   (CONFIG.MAILBOX.PROMPT_OFFSET_Y * scaleY);
    
    return {
      x: screenX,
      y: screenY
    };
  }

  /**
   * Get interaction area (larger than physical bounds)
   * @returns {Object} Interaction bounds
   */
  getInteractionBounds() {
    const center = this.getCenter();
    return {
      x: center.x - this.interactionDistance,
      y: center.y - this.interactionDistance,
      width: this.interactionDistance * 2,
      height: this.interactionDistance * 2
    };
  }

  /**
   * Activate mailbox interaction
   * @param {Player} player - Player entity
   * @returns {boolean} True if interaction was successful
   */
  interact(player) {
    const currentTime = Date.now();
    
    if (!this.isPlayerNearby(player)) {
      return false;
    }
    
    // Prevent spam interactions
    if (currentTime - this.lastInteractionTime < 500) {
      return false;
    }
    
    this.lastInteractionTime = currentTime;
    this.isActive = true;
    
    // Could add mailbox animation here
    setTimeout(() => {
      this.isActive = false;
    }, 200);
    
    return true;
  }

  /**
   * Get mailbox status
   * @returns {Object} Mailbox status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      interactionDistance: this.interactionDistance,
      lastInteractionTime: this.lastInteractionTime,
      position: this.getCenter()
    };
  }

  /**
   * Set interaction distance
   * @param {number} distance - New interaction distance
   */
  setInteractionDistance(distance) {
    this.interactionDistance = Math.max(0, distance);
  }

  /**
   * Check if mailbox is currently being interacted with
   * @returns {boolean} True if mailbox is active
   */
  isInteracting() {
    return this.isActive;
  }

  /**
   * Get distance to player with interaction threshold
   * @param {Player} player - Player entity
   * @returns {Object} Distance information
   */
  getPlayerDistance(player) {
    const distance = this.distanceTo(player);
    const isInRange = distance < this.interactionDistance;
    const percentage = Math.max(0, Math.min(1, 1 - (distance / this.interactionDistance)));
    
    return {
      distance: distance,
      isInRange: isInRange,
      percentage: percentage,
      threshold: this.interactionDistance
    };
  }

  /**
   * Update mailbox state (called each frame)
   * @param {number} deltaTime - Time since last update
   * @param {Player} player - Player entity
   */
  update(deltaTime, player) {
    // Could add mailbox animations, particle effects, etc.
    // For now, just track if player is nearby for potential optimizations
    const wasNearby = this.wasPlayerNearby;
    const isNearby = this.isPlayerNearby(player);
    
    if (isNearby !== wasNearby) {
      // Player entered or left interaction area
      this.onPlayerProximityChange(isNearby, player);
    }
    
    this.wasPlayerNearby = isNearby;
  }

  /**
   * Handle player proximity changes
   * @param {boolean} isNearby - Whether player is now nearby
   * @param {Player} player - Player entity
   */
  onPlayerProximityChange(isNearby, player) {
    if (isNearby) {
      console.log('📫 Player approached mailbox');
      // Could trigger entrance animation, sound, etc.
    } else {
      console.log('📫 Player left mailbox area');
      // Could trigger exit animation
    }
  }

  /**
   * Get mailbox configuration
   * @returns {Object} Mailbox configuration
   */
  getConfig() {
    return {
      position: { x: this.x, y: this.y },
      size: { width: this.width, height: this.height },
      interactionDistance: this.interactionDistance,
      promptOffset: {
        x: CONFIG.MAILBOX.PROMPT_OFFSET_X,
        y: CONFIG.MAILBOX.PROMPT_OFFSET_Y
      }
    };
  }

  /**
   * Reset mailbox to initial state
   */
  reset() {
    this.isActive = false;
    this.lastInteractionTime = 0;
    this.wasPlayerNearby = false;
  }

  /**
   * Get mailbox data for serialization
   * @returns {Object} Serializable mailbox data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      interactionDistance: this.interactionDistance,
      isActive: this.isActive,
      lastInteractionTime: this.lastInteractionTime
    };
  }
}