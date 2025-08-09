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
    
    // Walking animation state
    this.walkAnimationFrame = 0; // Current frame in animation sequence
    this.walkFrameCounter = 0;   // Counter for timing animation frames
    this.isWalkingHorizontally = false;
    this.walkSequence = [0, 2, 1]; // Frame 1 → Frame 3 → Frame 2 (repeat)
    this.currentSequenceIndex = 0;
    
    // Up walking animation state
    this.upAnimationFrame = 0;
    this.upFrameCounter = 0;
    this.isWalkingUp = false;
    this.upSequence = [0, 1, 0, 2]; // Frame 1 → Frame 2 → Frame 1 → Frame 3 (repeat)
    this.currentUpSequenceIndex = 0;
    
    // Down walking animation state
    this.downAnimationFrame = 0;
    this.downFrameCounter = 0;
    this.isWalkingDown = false;
    this.downSequence = [0, 1, 0, 2]; // Frame 1 → Frame 2 → Frame 1 → Frame 3 (repeat)
    this.currentDownSequenceIndex = 0;
  }

  /**
   * Set player sprite images
   * @param {HTMLImageElement} frontSprite - Front-facing sprite
   * @param {HTMLImageElement} sideSprite - Side-facing sprite
   * @param {HTMLImageElement} backSprite - Back-facing sprite
   * @param {HTMLImageElement} movementSprite - Walking animation sprite sheet
   * @param {HTMLImageElement} upSprite - Up walking animation sprite sheet
   * @param {HTMLImageElement} downSprite - Down walking animation sprite sheet
   */
  setSprites(frontSprite, sideSprite, backSprite, movementSprite, upSprite, downSprite) {
    this.sprites.set('front', frontSprite);
    this.sprites.set('side', sideSprite);
    this.sprites.set('back', backSprite);
    this.sprites.set('movement', movementSprite);
    this.sprites.set('up', upSprite);
    this.sprites.set('down', downSprite);
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
      
      // Check if actually moved for walking animations
      this.isWalkingHorizontally = Math.abs(dx) > 0 && (this.x !== this.lastPosition.x);
      this.isWalkingUp = dy < 0 && (this.y !== this.lastPosition.y);
      this.isWalkingDown = dy > 0 && (this.y !== this.lastPosition.y);
      
      return true;
    }
    
    // No movement occurred
    this.isWalkingHorizontally = false;
    this.isWalkingUp = false;
    this.isWalkingDown = false;
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
   * Get the current sprite based on direction and animation state
   * @returns {HTMLImageElement|null} Current sprite
   */
  getCurrentSprite() {
    switch (this.direction) {
      case 'left':
      case 'right':
        // Use walking animation only when actually moving horizontally
        if (this.isWalkingHorizontally) {
          return this.sprites.get('movement');
        } else {
          return this.sprites.get('side');
        }
      case 'up':
        // Use up walking animation when actually moving up
        if (this.isWalkingUp) {
          return this.sprites.get('up');
        } else {
          return this.sprites.get('back');
        }
      case 'down':
        // Use down walking animation when actually moving down
        if (this.isWalkingDown) {
          return this.sprites.get('down');
        } else {
          return this.sprites.get('front');
        }
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
   * Get the current walking animation frame coordinates
   * @returns {Object} Frame source coordinates {sx, sy, swidth, sheight}
   */
  getWalkingFrameCoords() {
    const currentFrame = this.walkSequence[this.currentSequenceIndex];
    return {
      sx: currentFrame * CONFIG.PLAYER.WALK_FRAME_WIDTH,
      sy: 0,
      swidth: CONFIG.PLAYER.WALK_FRAME_WIDTH,
      sheight: CONFIG.PLAYER.WALK_FRAME_HEIGHT
    };
  }

  /**
   * Get the current up walking animation frame coordinates
   * @returns {Object} Frame source coordinates {sx, sy, swidth, sheight}
   */
  getUpWalkingFrameCoords() {
    const currentFrame = this.upSequence[this.currentUpSequenceIndex];
    return {
      sx: currentFrame * CONFIG.PLAYER.WALK_FRAME_WIDTH,
      sy: 0,
      swidth: CONFIG.PLAYER.WALK_FRAME_WIDTH,
      sheight: CONFIG.PLAYER.WALK_FRAME_HEIGHT
    };
  }

  /**
   * Get the current down walking animation frame coordinates
   * @returns {Object} Frame source coordinates {sx, sy, swidth, sheight}
   */
  getDownWalkingFrameCoords() {
    const currentFrame = this.downSequence[this.currentDownSequenceIndex];
    return {
      sx: currentFrame * CONFIG.PLAYER.WALK_FRAME_WIDTH + 1, // Add 1px offset to avoid edge bleeding
      sy: 1, // Add 1px offset from top
      swidth: CONFIG.PLAYER.WALK_FRAME_WIDTH - 2, // Reduce width by 2px to avoid bleeding
      sheight: CONFIG.PLAYER.WALK_FRAME_HEIGHT - 2 // Reduce height by 2px
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
    // Update walking animation when moving horizontally
    if (this.isWalkingHorizontally && (this.direction === 'left' || this.direction === 'right')) {
      this.walkFrameCounter++;
      
      if (this.walkFrameCounter >= CONFIG.PLAYER.WALK_ANIMATION_SPEED) {
        this.walkFrameCounter = 0;
        this.currentSequenceIndex = (this.currentSequenceIndex + 1) % this.walkSequence.length;
      }
    } else {
      // Reset animation when not walking horizontally
      this.walkFrameCounter = 0;
      this.currentSequenceIndex = 0;
    }

    // Update up walking animation when moving up
    if (this.isWalkingUp && this.direction === 'up') {
      this.upFrameCounter++;
      
      if (this.upFrameCounter >= CONFIG.PLAYER.UP_ANIMATION_SPEED) {
        this.upFrameCounter = 0;
        this.currentUpSequenceIndex = (this.currentUpSequenceIndex + 1) % this.upSequence.length;
      }
    } else {
      // Reset animation when not walking up
      this.upFrameCounter = 0;
      this.currentUpSequenceIndex = 0;
    }

    // Update down walking animation when moving down
    if (this.isWalkingDown && this.direction === 'down') {
      this.downFrameCounter++;
      
      if (this.downFrameCounter >= CONFIG.PLAYER.DOWN_ANIMATION_SPEED) {
        this.downFrameCounter = 0;
        this.currentDownSequenceIndex = (this.currentDownSequenceIndex + 1) % this.downSequence.length;
      }
    } else {
      // Reset animation when not walking down
      this.downFrameCounter = 0;
      this.currentDownSequenceIndex = 0;
    }
  }
}