/**
 * Danundie Streak Entity
 * Handles the streaking animation across the screen
 */

import { CONFIG } from '../config/gameConfig.js';

export class DanundieStreak {
  constructor() {
    this.sprite = null;
    this.isActive = false;
    this.lastStreakTime = 0;
    this.cooldownDuration = 90000; // 1m30 seconds in milliseconds
    
    // Position and movement
    this.x = -100; // Start off-screen left
    this.y = 400; // Middle of screen
    this.speed = 7.68; // Fast horizontal movement (40% slower total)
    
    // Animation properties
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.animationSpeed = 3.84; // Change frame every 3.84 game ticks (40% slower total)
    this.frameWidth = 270; // Each frame is 270px wide
    this.frameHeight = 0; // Will be set when sprite loads
    
    // Sprite sheet frame positions
    this.frames = [
      { x: 0, y: 0 },     // Frame 1
      { x: 270, y: 0 },   // Frame 2  
      { x: 540, y: 0 }    // Frame 3
    ];
    
    // Scale and rendering (reduced by 60% = 40% of original size)
    this.scale = 0.32; // Was 0.8, now 0.8 * 0.4 = 0.32
    this.renderWidth = this.frameWidth * this.scale;
    this.renderHeight = 0; // Will be calculated
  }

  /**
   * Set the danundie sprite
   * @param {HTMLImageElement} sprite - Danundie sprite sheet
   */
  setSprite(sprite) {
    this.sprite = sprite;
    if (sprite) {
      this.frameHeight = sprite.naturalHeight;
      this.renderHeight = this.frameHeight * this.scale;
    }
  }

  /**
   * Check if streak is on cooldown
   * @returns {boolean} True if on cooldown
   */
  isOnCooldown() {
    const currentTime = Date.now();
    return (currentTime - this.lastStreakTime) < this.cooldownDuration;
  }

  /**
   * Get remaining cooldown time in seconds
   * @returns {number} Seconds remaining (0 if ready)
   */
  getCooldownRemaining() {
    if (!this.isOnCooldown()) return 0;
    const currentTime = Date.now();
    return Math.ceil((this.cooldownDuration - (currentTime - this.lastStreakTime)) / 1000);
  }

  /**
   * Start the streak animation
   * @param {number} startY - Y position to streak at (optional)
   */
  startStreak(startY = 400) {
    if (this.isActive) return; // Don't start if already streaking
    if (this.isOnCooldown()) {
      console.log(`🏃‍♂️ Danundie is resting! Cooldown: ${this.getCooldownRemaining()}s remaining`);
      return;
    }
    
    this.isActive = true;
    this.x = -this.renderWidth - 50; // Start off-screen left
    this.y = startY;
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.lastStreakTime = Date.now();
    
    console.log('🏃‍♂️ DANUNDIE STREAK ACTIVATED!');
  }

  /**
   * Update the streak animation
   */
  update() {
    if (!this.isActive) return;

    // Move horizontally across screen
    this.x += this.speed;
    
    // Update animation frame
    this.frameCounter++;
    if (this.frameCounter >= this.animationSpeed) {
      this.frameCounter = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }
    
    // Stop when off-screen right
    if (this.x > CONFIG.CANVAS.WIDTH + 100) {
      this.isActive = false;
      console.log('🏃‍♂️ Danundie streak completed!');
    }
  }

  /**
   * Get current frame data for rendering
   * @returns {Object} Frame rendering data
   */
  getFrameData() {
    if (!this.isActive || !this.sprite) return null;
    
    const frame = this.frames[this.currentFrame];
    
    return {
      sprite: this.sprite,
      sourceX: frame.x,
      sourceY: frame.y,
      sourceWidth: this.frameWidth,
      sourceHeight: this.frameHeight,
      destX: Math.round(this.x),
      destY: Math.round(this.y),
      destWidth: Math.round(this.renderWidth),
      destHeight: Math.round(this.renderHeight)
    };
  }

  /**
   * Check if streak is currently active
   * @returns {boolean} Is streaking
   */
  isStreaking() {
    return this.isActive;
  }

  /**
   * Stop the streak immediately
   */
  stopStreak() {
    this.isActive = false;
  }

  /**
   * Get streak progress (0-1)
   * @returns {number} Progress across screen
   */
  getProgress() {
    if (!this.isActive) return 0;
    
    const totalDistance = CONFIG.CANVAS.WIDTH + 200; // Include off-screen areas
    const currentDistance = this.x + 100; // Account for starting off-screen
    return Math.max(0, Math.min(1, currentDistance / totalDistance));
  }
}