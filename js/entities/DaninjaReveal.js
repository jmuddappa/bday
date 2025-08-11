/**
 * Daninja Reveal System
 * Hidden ninja that dramatically appears when player searches trees
 */

import { CONFIG } from '../config/gameConfig.js';
import { GameObject } from './GameObject.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class DaninjaReveal extends GameObject {
  constructor() {
    // Start at tree interaction zone
    super(500, 800, 60, 60); // Interaction zone size
    
    this.name = 'Daninja';
    this.sprite = null;
    
    // Sprite frame configuration (400px apart) - try full height
    this.frames = {
      standing: { sx: 0, sy: 0, sw: 400, sh: 800 }, // Double height to capture full sprite
      crouching: { sx: 400, sy: 0, sw: 400, sh: 800 },
      ball: { sx: 800, sy: 0, sw: 400, sh: 800 }
    };
    
    // Animation state
    this.state = 'hidden'; // hidden, spinning, landing, revealed
    this.isRevealed = false;
    this.currentFrame = 'standing';
    
    // Spinning animation
    this.ballRotation = 0;
    this.spinSpeed = 0.3; // Rotation speed
    this.ballX = 312; // Start position
    this.ballY = 983;
    this.targetX = 317; // Landing position much closer to trees
    this.targetY = 830;
    
    // Arc trajectory
    this.arcProgress = 0; // 0 to 1
    this.arcSpeed = 0.02; // How fast to move along arc
    this.arcHeight = 300; // Higher arc for more dramatic jump
    
    // Transformation timing
    this.landingTimer = 0;
    this.transformationPhase = 0; // 0: ball, 1: crouch, 2: stand
    this.phaseDelay = 30; // Frames between phases
    
    // Final positioning
    this.finalX = 317; // Same as landing position
    this.finalY = 830; // Same as landing position
    this.finalScale = 1.0; // Keep consistent size throughout
    
    // Consistent sprite size for all phases (scaled down 20%, squished 10%)
    this.spriteWidth = 87.5; // 108 * 0.9 * 0.9 (20% smaller + 10% squish)
    this.spriteHeight = 162; // 180 * 0.9 (10% smaller overall)
    
    console.log('🥷 Daninja hidden in the trees, waiting for discovery...');
  }

  /**
   * Set the daninja sprite
   * @param {HTMLImageElement} sprite - Sprite image
   */
  setSprite(sprite) {
    this.sprite = sprite;
    console.log('🥷 Daninja sprite loaded');
  }

  /**
   * Update the daninja reveal animation
   * @param {Player} player - Player entity
   */
  update(player) {
    try {
      if (this.state === 'spinning') {
        this.updateSpinning();
      } else if (this.state === 'landing') {
        this.updateLanding();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'DaninjaReveal.update');
    }
  }

  /**
   * Update spinning ball animation
   */
  updateSpinning() {
    // Rotate the ball
    this.ballRotation += this.spinSpeed;
    
    // Move along arc trajectory
    this.arcProgress += this.arcSpeed;
    
    if (this.arcProgress >= 1.0) {
      // Reached landing point
      this.arcProgress = 1.0;
      this.state = 'landing';
      this.landingTimer = 0;
      console.log('🥷 Daninja ball landed!');
    }
    
    // Calculate arc position
    const startX = 312;
    const startY = 983 - 100; // Start slightly above trees
    const endX = this.targetX;
    const endY = this.targetY;
    
    // Parabolic arc calculation
    const t = this.arcProgress;
    this.ballX = startX + (endX - startX) * t;
    
    // Y follows parabolic arc (up then down)
    const baseY = startY + (endY - startY) * t;
    const arcOffset = Math.sin(Math.PI * t) * this.arcHeight;
    this.ballY = baseY - arcOffset;
  }

  /**
   * Update landing and transformation
   */
  updateLanding() {
    this.landingTimer++;
    
    // Transformation phases
    if (this.landingTimer > this.phaseDelay * 0) { // 0-30 frames: ball
      this.transformationPhase = 0;
      this.currentFrame = 'ball';
    }
    if (this.landingTimer > this.phaseDelay * 1) { // 30-60 frames: crouch
      this.transformationPhase = 1;
      this.currentFrame = 'crouching';
    }
    if (this.landingTimer > this.phaseDelay * 2) { // 60+ frames: stand
      this.transformationPhase = 2;
      this.currentFrame = 'standing';
      
      if (this.landingTimer > this.phaseDelay * 3) {
        // Transformation complete
        this.state = 'revealed';
        this.isRevealed = true;
        this.x = this.finalX;
        this.y = this.finalY;
        console.log('🥷 Daninja fully revealed and ready for interaction!');
      }
    }
  }

  /**
   * Start the dramatic reveal sequence
   * @param {AudioManager} audioManager - For playing sound
   */
  startReveal(audioManager) {
    if (this.state === 'hidden') {
      console.log('🥷 DANINJA REVEAL INITIATED!');
      this.state = 'spinning';
      this.arcProgress = 0;
      this.ballRotation = 0;
      
      // Play dramatic ninja sound
      if (audioManager) {
        console.log('🥷 Attempting to play daninja sound...');
        const daninjaAudio = audioManager.getAudio('daninjaSound');
        console.log('🥷 Daninja audio element:', daninjaAudio);
        if (daninjaAudio) {
          daninjaAudio.currentTime = 0;
          daninjaAudio.volume = 0.7; // Set volume
          daninjaAudio.play().then(() => {
            console.log('🥷 Daninja sound playing successfully!');
          }).catch(e => {
            console.log('🥷 Could not play daninja sound:', e);
          });
        } else {
          console.log('🥷 Daninja audio element not found!');
        }
      } else {
        console.log('🥷 AudioManager not available!');
      }
    }
  }

  /**
   * Check if player can interact with trees
   * @param {Player} player - Player entity
   * @returns {boolean}
   */
  canInteractWithTrees(player) {
    if (this.state !== 'hidden') return false;
    
    const distance = Math.sqrt(
      Math.pow(player.x + player.width/2 - (this.x + this.width/2), 2) +
      Math.pow(player.y + player.height/2 - (this.y + this.height/2), 2)
    );
    
    return distance < 80; // Interaction range
  }

  /**
   * Check if player can talk to revealed Daninja
   * @param {Player} player - Player entity  
   * @returns {boolean}
   */
  canTalkToDaninja(player) {
    if (this.state !== 'revealed') return false;
    
    const distance = Math.sqrt(
      Math.pow(player.x + player.width/2 - (this.finalX), 2) +
      Math.pow(player.y + player.height/2 - (this.finalY - this.spriteHeight/2), 2)
    );
    
    return distance < 100; // Talk range
  }

  /**
   * Get draw data for rendering
   * @returns {Object|null} Draw data or null if not visible
   */
  getDrawData() {
    if (!this.sprite) return null;
    
    if (this.state === 'spinning') {
      // Draw spinning ball
      const frame = this.frames.ball;
      return {
        sprite: this.sprite,
        sourceX: frame.sx,
        sourceY: frame.sy,
        sourceWidth: frame.sw,
        sourceHeight: frame.sh,
        destX: this.ballX - this.spriteWidth/2, // Center the sprite
        destY: this.ballY - this.spriteHeight/2,
        destWidth: this.spriteWidth,
        destHeight: this.spriteHeight,
        rotation: this.ballRotation
      };
    } else if (this.state === 'landing') {
      // Draw transformation at landing spot - keep sprite grounded properly
      const frame = this.frames[this.currentFrame];
      return {
        sprite: this.sprite,
        sourceX: frame.sx,
        sourceY: frame.sy,
        sourceWidth: frame.sw,
        sourceHeight: frame.sh,
        destX: this.targetX - this.spriteWidth/2,
        destY: this.targetY - this.spriteHeight, // Bottom of sprite at target point
        destWidth: this.spriteWidth,
        destHeight: this.spriteHeight,
        rotation: 0
      };
    } else if (this.state === 'revealed') {
      // Draw final standing Daninja - maintain same size and proper grounding
      const frame = this.frames.standing;
      return {
        sprite: this.sprite,
        sourceX: frame.sx,
        sourceY: frame.sy,
        sourceWidth: frame.sw,
        sourceHeight: frame.sh,
        destX: this.finalX - this.spriteWidth/2,
        destY: this.finalY - this.spriteHeight, // Same positioning as landing
        destWidth: this.spriteWidth, // Same size as landing
        destHeight: this.spriteHeight,
        rotation: 0
      };
    }
    
    return null; // Hidden state
  }

  /**
   * Get current state
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Check if daninja is revealed and interactive
   * @returns {boolean}
   */
  isInteractive() {
    return this.isRevealed;
  }

  /**
   * Reset daninja to hidden state (for debugging)
   */
  reset() {
    this.state = 'hidden';
    this.isRevealed = false;
    this.arcProgress = 0;
    this.ballRotation = 0;
    this.landingTimer = 0;
    this.transformationPhase = 0;
    console.log('🥷 Daninja reset to hidden state');
  }
}