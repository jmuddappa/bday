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
  }

  /**
   * Set the sprite image for this dog
   * @param {HTMLImageElement} sprite - Dog sprite image
   */
  setSprite(sprite) {
    this.sprite = sprite;
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

    if (distance < threshold) {
      this.activate(specialAudio, bgAudio);
    } else {
      this.deactivate(specialAudio, bgAudio);
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
    const frame = this.state === 'jump' ? this.jumpFrame : this.sitFrame;
    const offsetX = this.state === 'jump' ? this.jumpOffsetX : 0;
    const offsetY = this.state === 'jump' ? this.jumpOffsetY : 0;

    return {
      sprite: this.sprite,
      sourceX: frame.sx,
      sourceY: frame.sy,
      sourceWidth: this.originalWidth,
      sourceHeight: this.originalHeight,
      destX: this.x + offsetX,
      destY: this.y + offsetY,
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