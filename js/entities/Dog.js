/**
 * Dog Entity
 * Represents interactive pet characters in the game
 */

import { CONFIG } from '../config/gameConfig.js';
import { GameObject } from './GameObject.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class Dog extends GameObject {
  constructor(name, config) {
    super(
      config.x, 
      config.y, 
      config.width * config.scale, 
      config.height * config.scale
    );
    
    this.name = name;
    this.originalWidth = config.width;
    this.originalHeight = config.height;
    this.scale = config.scale;
    this.sprite = null;
    this.framesSprite = null; // New sprite for 3-frame animation (Me dog only)
    this.sitFrame = config.sitFrame;
    this.jumpFrame = config.jumpFrame;
    this.jumpOffsetX = config.jumpOffsetX || 0;
    this.jumpOffsetY = config.jumpOffsetY || 0;
    this.state = 'sit';
    this.barked = false;
    this.audio = null;
    
    // Animation and timing
    this.stateChangeTime = 0;
    this.animationDuration = 500; // ms
    
    // 3-frame animation system for Me dog
    this.useFrameAnimation = this.name === 'Me';
    this.animationFrame = 0;
    this.frameCounter = 0;
    this.animationSpeed = config.animationSpeed || 30;
    this.frameSequence = [0, 1, 2]; // sit → transition → jump
    this.animationDirection = 1; // 1 for forward, -1 for reverse
    this.isAnimating = false;
    
    // Interaction bob animation (only when player is nearby)
    this.interactionBobOffset = 0;
    this.isPlayerNearForBob = false;
    
  }


  /**
   * Set the sprite image for this dog
   * @param {HTMLImageElement} sprite - Dog sprite image
   */
  setSprite(sprite) {
    this.sprite = sprite;
  }

  /**
   * Set the frames sprite for 3-frame animation (Me dog only)
   * @param {HTMLImageElement} framesSprite - Frames sprite image
   */
  setFramesSprite(framesSprite) {
    this.framesSprite = framesSprite;
  }

  /**
   * Set the audio element for this dog's sounds
   * @param {HTMLAudioElement} audio - Audio element
   */
  setAudio(audio) {
    this.audio = audio;
  }

  /**
   * Update dog behavior based on player proximity
   * @param {Player} player - Player entity
   * @param {HTMLAudioElement} specialAudio - Special audio for 'Me' dog
   * @param {HTMLAudioElement} bgAudio - Background music audio
   */
  update(player, specialAudio = null, bgAudio = null) {
    const distance = this.distanceTo(player);
    const threshold = this.name === 'Me' ? 
      CONFIG.DOGS.ME_INTERACTION_DISTANCE : 
      CONFIG.DOGS.INTERACTION_DISTANCE;

    // Update interaction state for bob animation
    this.isPlayerNearForBob = distance < threshold;

    if (distance < threshold) {
      this.activate(specialAudio, bgAudio);
    } else {
      this.deactivate(specialAudio, bgAudio);
    }
    
    // Update 3-frame animation for Me dog
    if (this.useFrameAnimation && this.isAnimating) {
      this.frameCounter++;
      if (this.frameCounter >= this.animationSpeed) {
        this.frameCounter = 0;
        
        // Move animation frame forward or backward
        this.animationFrame += this.animationDirection;
        
        // Check bounds and stop animation when complete
        if (this.animationDirection === 1) { // Forward
          if (this.animationFrame >= this.frameSequence.length - 1) {
            this.animationFrame = this.frameSequence.length - 1; // Stay at jump frame
            this.isAnimating = false;
          }
        } else { // Reverse
          if (this.animationFrame <= 0) {
            this.animationFrame = 0; // Stay at sit frame
            this.isAnimating = false;
          }
        }
      }
    }
    
    // Update interaction bob animation for friends only
    if (this.name.startsWith('Friend')) {
      if (this.isPlayerNearForBob) {
        // Gentle bob when player is nearby (can press E)
        this.interactionBobOffset = Math.sin(Date.now() * 0.004) * 1.5; // Very small 1.5px bob
      } else {
        this.interactionBobOffset = 0; // No bob when player is away
      }
    }
  }

  /**
   * Activate dog (player is nearby)
   * @param {HTMLAudioElement} specialAudio - Special audio for 'Me' dog
   * @param {HTMLAudioElement} bgAudio - Background music audio
   */
  activate(specialAudio = null, bgAudio = null) {
    if (this.name === 'Me' && this.state !== 'jump') {
      this.setState('jump');
      this.barked = true;
      
      // Start forward animation
      if (this.useFrameAnimation) {
        this.animationDirection = 1;
        this.isAnimating = true;
        this.frameCounter = 0;
      }
      
      if (bgAudio) {
        bgAudio.volume = 0;
      }
      
      if (specialAudio) {
        specialAudio.currentTime = 0;
        specialAudio.play().then(() => {
          console.log(`🎵 Playing special audio for ${this.name}`);
        }).catch(e => {
          ErrorHandler.handleError(e, `Dog.activate(${this.name})`);
        });
        
        specialAudio.onended = () => {
          if (this.state === 'jump' && bgAudio) {
            bgAudio.volume = 1;
          }
        };
      }
    } else if (this.name !== 'Me' && !this.barked) {
      this.setState('jump');
      this.barked = true;
      
      if (this.audio) {
        this.audio.play().then(() => {
          console.log(`🐕 Playing bark audio for ${this.name}`);
        }).catch(e => {
          ErrorHandler.handleError(e, `Dog.activate(${this.name})`);
        });
      }
    }
  }

  /**
   * Deactivate dog (player moved away)
   * @param {HTMLAudioElement} specialAudio - Special audio for 'Me' dog
   * @param {HTMLAudioElement} bgAudio - Background music audio
   */
  deactivate(specialAudio = null, bgAudio = null) {
    if (this.name === 'Me' && this.state !== 'sit') {
      this.setState('sit');
      this.barked = false;
      
      // Start reverse animation
      if (this.useFrameAnimation) {
        this.animationDirection = -1;
        this.isAnimating = true;
        this.frameCounter = 0;
      }
      
      if (specialAudio) {
        specialAudio.pause();
        specialAudio.currentTime = 0;
      }
      
      if (bgAudio) {
        bgAudio.volume = 1;
      }
    } else if (this.name !== 'Me') {
      this.setState('sit');
      this.barked = false;
    }
  }

  /**
   * Set dog state with animation timing
   * @param {string} newState - New state ('sit' or 'jump')
   */
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeTime = Date.now();
    }
  }

  /**
   * Get current animation progress (0-1)
   * @returns {number} Animation progress
   */
  getAnimationProgress() {
    const elapsed = Date.now() - this.stateChangeTime;
    return Math.min(elapsed / this.animationDuration, 1);
  }

  /**
   * Get draw data for rendering
   * @returns {Object} Drawing data for renderer
   */
  getDrawData() {
    // Use 3-frame animation system for Me dog if frames sprite is available
    if (this.useFrameAnimation && this.framesSprite && this.name === 'Me') {
      const config = CONFIG.DOGS.ME;
      const currentFrameIndex = this.frameSequence[this.animationFrame];
      
      let sourceX;
      let frameWidth;
      switch (currentFrameIndex) {
        case 0: // sit frame (1058-end)
          sourceX = 1058;
          frameWidth = config.totalWidth - 1058; // Remaining width after 1058
          break;
        case 1: // transition frame (512-1058px)
          sourceX = 512;
          frameWidth = 546; // 1058 - 512
          break;
        case 2: // jump frame (0-512px)
          sourceX = 0;
          frameWidth = 512;
          break;
        default:
          sourceX = 1058;
          frameWidth = config.totalWidth - 1058;
      }
      
      let offsetX = 0;
      let offsetY = 0;
      
      switch (currentFrameIndex) {
        case 0: // sit frame - no offset needed
          offsetX = 0;
          offsetY = 0;
          break;
        case 1: // transition frame - adjust position to align with sit frame
          offsetX = -1;
          offsetY = 3;
          break;
        case 2: // jump frame - use original jump offsets
          offsetX = this.jumpOffsetX - 1; // Account for transition offset too
          offsetY = this.jumpOffsetY + 3;
          break;
      }

      return {
        sprite: this.framesSprite,
        sourceX: sourceX,
        sourceY: 0,
        sourceWidth: frameWidth,
        sourceHeight: config.frameHeight,
        destX: this.x + offsetX,
        destY: this.y + offsetY + this.interactionBobOffset,
        destWidth: this.originalWidth * this.scale,
        destHeight: this.originalHeight * this.scale
      };
    }
    
    // Fallback to original 2-frame system for other dogs or if frames sprite not available
    const frame = this.state === 'jump' ? this.jumpFrame : this.sitFrame;
    const offsetX = this.state === 'jump' ? this.jumpOffsetX : 0;
    const offsetY = this.state === 'jump' ? this.jumpOffsetY : 0;

    // For simple friends, use full image dimensions
    const isFriend = this.name.startsWith('Friend') && this.sprite;
    const sourceWidth = isFriend ? this.sprite.naturalWidth : this.originalWidth;
    const sourceHeight = isFriend ? this.sprite.naturalHeight : this.originalHeight;

    return {
      sprite: this.sprite,
      sourceX: frame.sx,
      sourceY: frame.sy,
      sourceWidth: sourceWidth,
      sourceHeight: sourceHeight,
      destX: this.x + offsetX,
      destY: this.y + offsetY + this.interactionBobOffset,
      destWidth: this.originalWidth * this.scale,
      destHeight: this.originalHeight * this.scale
    };
  }

  /**
   * Get dog's interaction area (larger than physical bounds)
   * @returns {Object} Interaction bounds
   */
  getInteractionBounds() {
    const threshold = this.name === 'Me' ? 
      CONFIG.DOGS.ME_INTERACTION_DISTANCE : 
      CONFIG.DOGS.INTERACTION_DISTANCE;
    
    const center = this.getCenter();
    return {
      x: center.x - threshold,
      y: center.y - threshold,
      width: threshold * 2,
      height: threshold * 2
    };
  }

  /**
   * Check if player is within interaction range
   * @param {Player} player - Player entity
   * @returns {boolean} True if player is in range
   */
  isPlayerInRange(player) {
    const distance = this.distanceTo(player);
    const threshold = this.name === 'Me' ? 
      CONFIG.DOGS.ME_INTERACTION_DISTANCE : 
      CONFIG.DOGS.INTERACTION_DISTANCE;
    
    return distance < threshold;
  }

  /**
   * Get dog status information
   * @returns {Object} Dog status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      barked: this.barked,
      animationProgress: this.getAnimationProgress(),
      hasAudio: !!this.audio,
      hasSprite: !!this.sprite
    };
  }

  /**
   * Reset dog to initial state
   */
  reset() {
    this.setState('sit');
    this.barked = false;
    this.stateChangeTime = 0;
  }

  /**
   * Get dog data for serialization
   * @returns {Object} Serializable dog data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      state: this.state,
      barked: this.barked,
      originalWidth: this.originalWidth,
      originalHeight: this.originalHeight,
      scale: this.scale
    };
  }

  /**
   * Clean up dog resources
   */
  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.sprite = null;
    super.destroy();
  }
}