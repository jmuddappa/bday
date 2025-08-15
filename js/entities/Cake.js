/**
 * Cake Entity
 * Interactive rotating cake that can be investigated
 */

import { CONFIG } from '../config/gameConfig.js';
import { GameObject } from './GameObject.js';

export class Cake extends GameObject {
  constructor() {
    super(
      CONFIG.CAKE.X,
      CONFIG.CAKE.Y,
      64, // width
      64  // height
    );
    
    this.sprite = null;
    this.isRotating = false;
    this.rotation = 0;
    this.rotationSpeed = CONFIG.CAKE.ROTATION_SPEED;
    this.scale = CONFIG.CAKE.SCALE;
    this.isPlayerNear = false;
    
    // Hidden state system (starts hidden like Madeline)
    this.isHidden = true;
    this.hasBeenRevealed = false;
    this.isGrowing = false;
    
    // Arc animation system (ninja-like entrance)
    this.isArcing = false;
    this.arcStartTime = 0;
    this.arcDuration = 750; // 0.75 seconds
    this.arcStartX = CONFIG.CAKE.X + 50; // 50px to the right
    this.arcStartY = CONFIG.CAKE.Y - 100; // Start higher up
    this.arcTargetX = CONFIG.CAKE.X;
    this.arcTargetY = CONFIG.CAKE.Y;
    this.currentArcX = this.arcStartX;
    this.currentArcY = this.arcStartY;
    
    // Investigation prompt
    this.showPrompt = false;
    
    // Bounce animation when player is near (ready to eat)
    this.bounceOffset = 0;
    this.isPlayerNearForEating = false;
    
    // Fade out system (when eaten)
    this.isFading = false;
    this.fadeOpacity = 1.0;
    this.fadeSpeed = 0.01; // Fade speed per frame
    this.isEaten = false;
  }

  /**
   * Set the cake sprite
   * @param {HTMLImageElement} sprite - Cake sprite image
   */
  setSprite(sprite) {
    this.sprite = sprite;
    if (sprite) {
      // Update dimensions based on sprite size and scale
      this.width = sprite.naturalWidth * this.scale;
      this.height = sprite.naturalHeight * this.scale;
    }
  }

  /**
   * Update cake behavior based on player proximity
   * @param {Player} player - Player entity
   */
  update(player) {
    // Update arc animation if active
    if (this.isArcing) {
      this.updateArcAnimation();
    }
    
    // Update fade animation if active
    if (this.isFading) {
      this.updateFadeAnimation();
    }
    
    const distance = this.distanceTo(player);
    const threshold = CONFIG.CAKE.INTERACTION_DISTANCE;
    
    this.isPlayerNear = distance < threshold;
    
    // Update bounce animation state
    if (this.hasBeenRevealed && !this.isArcing && !this.isFading && !this.isEaten) {
      this.isPlayerNearForEating = this.isPlayerNear;
    } else {
      this.isPlayerNearForEating = false;
    }
    
    // Update bounce animation
    if (this.isPlayerNearForEating) {
      // Small bounce animation - 3px up and down
      this.bounceOffset = Math.sin(Date.now() * 0.008) * 3; // Gentle bounce
    } else {
      this.bounceOffset = 0; // No bounce when player is away
    }
    
    // Show different prompts based on cake state
    if (this.isHidden && !this.hasBeenRevealed) {
      this.showPrompt = this.isPlayerNear;
    } else if (this.hasBeenRevealed && !this.isArcing && !this.isFading && !this.isEaten) {
      // Show "eat" prompt after cake has landed and not eaten
      this.showPrompt = this.isPlayerNear;
    } else {
      this.showPrompt = false;
    }
  }

  /**
   * Update the arc animation
   */
  updateArcAnimation() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.arcStartTime;
    const progress = Math.min(elapsed / this.arcDuration, 1);
    
    if (progress >= 1) {
      // Animation complete - land at final position
      this.isArcing = false;
      this.x = this.arcTargetX;
      this.y = this.arcTargetY;
      console.log('🎂 Cake landed!');
      return;
    }
    
    // Easing function for smooth arc (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Calculate arc position (parabolic path)
    const linearX = this.arcStartX + (this.arcTargetX - this.arcStartX) * easeOut;
    const linearY = this.arcStartY + (this.arcTargetY - this.arcStartY) * easeOut;
    
    // Add arc height (parabolic curve)
    const arcHeight = 80 * Math.sin(progress * Math.PI); // Peak at middle of arc
    
    this.currentArcX = linearX;
    this.currentArcY = linearY - arcHeight;
    
    // Update actual position during arc
    this.x = this.currentArcX;
    this.y = this.currentArcY;
  }

  /**
   * Update the fade animation
   */
  updateFadeAnimation() {
    if (this.isFading && !this.isEaten) {
      this.fadeOpacity -= this.fadeSpeed;
      
      if (this.fadeOpacity <= 0) {
        this.fadeOpacity = 0;
        this.isEaten = true;
        this.isFading = false;
        console.log('🎂 Cake has been completely eaten!');
      }
    }
  }

  /**
   * Get draw data for rendering
   * @returns {Object} Drawing data for renderer
   */
  getDrawData() {
    if (!this.sprite) return null;
    
    return {
      sprite: this.sprite,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: this.sprite.naturalWidth,
      sourceHeight: this.sprite.naturalHeight,
      destX: this.x,
      destY: this.y + this.bounceOffset, // Add bounce offset to Y position
      destWidth: this.width,
      destHeight: this.height,
      rotation: this.rotation,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2 + this.bounceOffset, // Also apply to center for rotation
      opacity: this.fadeOpacity
    };
  }

  /**
   * Check if player is within interaction range
   * @param {Player} player - Player entity
   * @returns {boolean} True if player is in range
   */
  isPlayerInRange(player) {
    const distance = this.distanceTo(player);
    return distance < CONFIG.CAKE.INTERACTION_DISTANCE;
  }

  /**
   * Check if player can interact with hidden cake (for prompt display)
   * @param {Player} player - Player entity
   * @returns {boolean} True if player is in range of hidden cake
   */
  isPlayerInRangeForHidden(player) {
    if (!this.isHidden || this.hasBeenRevealed) {
      return false;
    }
    
    const distance = this.distanceTo(player);
    return distance < CONFIG.CAKE.INTERACTION_DISTANCE;
  }

  /**
   * Check if cake is visible (not hidden and not eaten)
   * @returns {boolean}
   */
  isVisible() {
    return !this.isHidden && !this.isEaten;
  }

  /**
   * Reveal the hidden cake with ninja arc animation
   */
  reveal() {
    if (this.isHidden && !this.hasBeenRevealed) {
      console.log('🎂 Cake is arcing in ninja-style!');
      this.isHidden = false;
      this.hasBeenRevealed = true;
      
      // Start arc animation
      this.isArcing = true;
      this.arcStartTime = Date.now();
      
      // Set initial position to arc start
      this.x = this.arcStartX;
      this.y = this.arcStartY;
    }
  }

  /**
   * Handle investigation interaction (when hidden)
   */
  investigate() {
    console.log('🎂 Investigating the mysterious area!');
    return {
      type: 'cake_investigation',
      message: 'Something is about to appear! 🎂'
    };
  }

  /**
   * Handle eating interaction (when visible)
   */
  eat() {
    console.log('🎂 Nom nom nom! Delicious birthday cake!');
    
    // Start fade animation
    this.isFading = true;
    
    return {
      type: 'cake_eat',
      message: 'Yummy birthday cake! 🍰'
    };
  }

  /**
   * Get distance to another entity
   * @param {GameObject} other - Other entity
   * @returns {number} Distance in pixels
   */
  distanceTo(other) {
    const dx = (this.x + this.width/2) - (other.x + other.width/2);
    const dy = (this.y + this.height/2) - (other.y + other.height/2);
    return Math.sqrt(dx*dx + dy*dy);
  }

  /**
   * Get prompt position for UI
   * @param {HTMLCanvasElement} canvas - Canvas element for coordinate conversion
   * @returns {Object} Prompt position
   */
  getPromptPosition(canvas) {
    if (!canvas) {
      // Fallback for when canvas is not provided
      return {
        x: this.x + CONFIG.CAKE.PROMPT_OFFSET_X,
        y: this.y + CONFIG.CAKE.PROMPT_OFFSET_Y,
        show: this.showPrompt
      };
    }
    
    // Calculate cake center in world coordinates
    const cakeCenterX = this.x + this.width / 2;
    const cakeCenterY = this.y + this.height / 2;
    
    // Get canvas scaling and position
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / CONFIG.CANVAS.WIDTH;
    const scaleY = canvasRect.height / CONFIG.CANVAS.HEIGHT;
    
    // Convert world coordinates to screen coordinates with proper scaling
    const screenX = (cakeCenterX * scaleX) + canvasRect.left + 
                   (CONFIG.CAKE.PROMPT_OFFSET_X * scaleX);
    const screenY = (cakeCenterY * scaleY) + canvasRect.top + 
                   (CONFIG.CAKE.PROMPT_OFFSET_Y * scaleY);
    
    return {
      x: screenX,
      y: screenY,
      show: this.showPrompt
    };
  }

  /**
   * Reset cake to initial state
   */
  reset() {
    this.rotation = 0;
    this.isRotating = false;
    this.showPrompt = false;
  }

  /**
   * Get cake status information
   * @returns {Object} Cake status
   */
  getStatus() {
    return {
      isRotating: this.isRotating,
      rotation: this.rotation,
      isPlayerNear: this.isPlayerNear,
      showPrompt: this.showPrompt
    };
  }
}