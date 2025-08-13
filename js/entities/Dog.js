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
    
    // Frame animation system for Me dog, Madeline, Nolan, Khoa, and Nat
    this.useFrameAnimation = this.name === 'Danoonie' || this.name === 'Madeline' || this.name === 'Nolan' || this.name === 'Khoa' || this.name === 'Nat';
    this.animationFrame = 0;
    this.frameCounter = 0;
    this.animationSpeed = config.animationSpeed || 30;
    
    // Set frame sequence based on character
    if (this.name === 'Khoa' || this.name === 'Nat') {
      this.frameSequence = [0, 1, 2]; // sit → transition → jump (3 frames)
      this.activeFrameSequence = [1, 2]; // When player nearby, cycle between frame 2 and 3
    } else {
      this.frameSequence = [0, 1, 2]; // sit → transition → jump (3 frames)
    }
    this.animationDirection = 1; // 1 for forward, -1 for reverse
    this.isAnimating = false;
    this.isCyclingActive = false; // For Friend8's special cycling behavior
    
    // Interaction bob animation (only when player is nearby)
    this.interactionBobOffset = 0;
    this.isPlayerNearForBob = false;
    
    // Fade out system
    this.isFading = false;
    this.fadeOpacity = 1.0;
    this.fadeSpeed = 0.005; // Much slower fade (per frame) - takes ~3.3 seconds at 60fps
    this.isVanished = false;
    
    // Hidden state system (for characters that start hidden)
    this.isHidden = config.startsHidden || false;
    this.hasBeenRevealed = false;
    this.isGrowing = false; // New state: currently playing growth animation
    
    // Investigation system (for Nolan)
    this.needsInvestigation = config.needsInvestigation || false;
    this.isPhasing = false;
    this.phaseOpacity = 0;
    this.phaseSpeed = 0.02; // Speed of phase-in animation
    
    // Eating system (for Nolan)
    this.isEating = false;
    this.eatingComplete = false;
    this.shouldDieAfterEating = false;
    
    // Audio tracking (prevent repeat sounds)
    this.hasPlayedRevealSound = false;
    
    
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
  setAudio(audio, audioKey = null) {
    this.audio = audio;
    this.audioKey = audioKey; // Store the key for AudioManager
  }

  /**
   * Update dog behavior based on player proximity
   * @param {Player} player - Player entity
   * @param {HTMLAudioElement} specialAudio - Special audio for 'Me' dog
   * @param {HTMLAudioElement} bgAudio - Background music audio
   * @param {AudioManager} audioManager - Audio manager for cooldown control
   */
  update(player, specialAudio = null, bgAudio = null, audioManager = null) {
    const distance = this.distanceTo(player);
    const threshold = this.name === 'Danoonie' ? 
      CONFIG.DOGS.ME_INTERACTION_DISTANCE : 
      this.name === 'Nat' ?
      CONFIG.DOGS.NAT_INTERACTION_DISTANCE :
      this.name === 'Khoa' ?
      CONFIG.DOGS.KHOA_INTERACTION_DISTANCE :
      this.name === 'Nolan' ?
      CONFIG.DOGS.NOLAN_INTERACTION_DISTANCE :
      CONFIG.DOGS.INTERACTION_DISTANCE;

    // Update interaction state for bob animation
    this.isPlayerNearForBob = distance < threshold;

    if (distance < threshold) {
      this.activate(specialAudio, bgAudio, audioManager);
    } else {
      this.deactivate(specialAudio, bgAudio);
    }
    
    // Update frame animation
    if (this.useFrameAnimation && this.isAnimating) {
      this.frameCounter++;
      if (this.frameCounter >= this.animationSpeed) {
        this.frameCounter = 0;
        
        if ((this.name === 'Khoa' || this.name === 'Nat') && this.isCyclingActive) {
          // Special cycling behavior for Khoa and Nat - bounce between frames 1 and 2 (indices 1 and 2)
          if (this.animationDirection === 1) {
            this.animationFrame++;
            if (this.animationFrame >= 2) { // Reached frame 3 (index 2)
              this.animationDirection = -1; // Start going back
            }
          } else {
            this.animationFrame--;
            if (this.animationFrame <= 1) { // Reached frame 2 (index 1) 
              this.animationDirection = 1; // Start going forward again
            }
          }
        } else if (this.name === 'Nolan' && this.isEating) {
          // Special eating animation - play frames 1->2->3 once and stop
          this.animationFrame++;
          if (this.animationFrame >= this.frameSequence.length - 1) {
            this.animationFrame = this.frameSequence.length - 1; // Stay at final frame
            this.isAnimating = false;
          }
        } else if (this.name !== 'Nolan') {
          // Normal animation logic for other characters (excluding Nolan)
          // Move animation frame forward or backward
          this.animationFrame += this.animationDirection;
          
          // Check bounds and stop animation when complete
          if (this.animationDirection === 1) { // Forward
            if (this.animationFrame >= this.frameSequence.length - 1) {
              this.animationFrame = this.frameSequence.length - 1; // Stay at jump frame
              this.isAnimating = false;
              
              // If this was a growth animation, mark as fully revealed
              if (this.isGrowing) {
                this.isGrowing = false;
                this.hasBeenRevealed = true;
                console.log(`🌸 ${this.name} growth complete - ready to talk!`);
              }
            }
          } else { // Reverse
            if (this.animationFrame <= 0) {
              this.animationFrame = 0; // Stay at sit frame
              this.isAnimating = false;
            }
          }
        } else if (this.name === 'Nolan' && this.isAnimating && !this.isEating) {
          // Nolan shouldn't be animating unless eating
          this.isAnimating = false;
          this.animationFrame = 0; // Keep him on frame 1
        }
      }
    }
    
    // Update interaction bob animation for simple friends only (not Nolan/Khoa which have special behaviors)
    const isSimpleFriend = (this.name.startsWith('Friend') && this.name !== 'Nolan' && this.name !== 'Khoa') || 
                          this.name === 'Raza';
    if (isSimpleFriend) {
      if (this.isPlayerNearForBob) {
        // River-like bobbing for Raza, gentle bob for others
        if (this.name === 'Raza') {
          this.interactionBobOffset = Math.sin(Date.now() * 0.004) * 1.95; // 30% increase: 1.5 * 1.3 = 1.95px bob
        } else {
          this.interactionBobOffset = Math.sin(Date.now() * 0.004) * 1.5; // Very small 1.5px bob
        }
      } else {
        this.interactionBobOffset = 0; // No bob when player is away
      }
    }
    
    // Update fade-out animation
    this.updateFadeOut();
    
    // Update phase-in animation (Nolan)
    this.updatePhaseIn();
    
    // Update eating sequence (Nolan)
    this.updateEatingSequence();
  }

  /**
   * Activate dog (player is nearby)
   * @param {HTMLAudioElement} specialAudio - Special audio for 'Me' dog
   * @param {HTMLAudioElement} bgAudio - Background music audio
   * @param {AudioManager} audioManager - Audio manager for cooldown control
   */
  activate(specialAudio = null, bgAudio = null, audioManager = null) {
    if (this.name === 'Danoonie' && this.state !== 'jump') {
      this.setState('jump');
      this.barked = true;
      
      // Start forward animation
      if (this.useFrameAnimation) {
        this.animationDirection = 1;
        this.isAnimating = true;
        this.frameCounter = 0;
      }
    } else if ((this.name === 'Khoa' || this.name === 'Nat') && this.state !== 'jump') {
      this.setState('jump');
      this.barked = true;
      
      // Start cycling animation for Khoa and Nat between frames 2 and 3
      if (this.useFrameAnimation) {
        this.isCyclingActive = true;
        this.animationFrame = 1; // Start at frame 2 (index 1)
        this.animationDirection = 1;
        this.isAnimating = true;
        this.frameCounter = 0;
      }
      
      if (this.audio) {
        this.audio.play().then(() => {
          console.log(`🎵 Playing audio for ${this.name}`);
        }).catch(e => {
          console.log('Could not play sound:', e);
        });
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
            bgAudio.volume = 0.6;
          }
        };
      }
    } else if (this.name === 'Nolan') {
      // Nolan stays on frame 1 when player approaches - no animation until eating sequence
      // Just mark as barked to prevent repeated activation
      this.barked = true;
    } else if (this.name !== 'Me' && !this.barked) {
      this.setState('jump');
      this.barked = true;
      
      if (audioManager && this.audioKey) {
        audioManager.play(this.audioKey);
        console.log(`🐕 Playing bark audio for ${this.name} via AudioManager`);
      } else if (this.audio) {
        this.audio.play().then(() => {
          console.log(`🐕 Playing bark audio for ${this.name} (fallback)`);
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
    if (this.name === 'Danoonie' && this.state !== 'sit') {
      this.setState('sit');
      this.barked = false;
      
      // Stop special audio and restore background music
      if (specialAudio) {
        specialAudio.pause();
        specialAudio.currentTime = 0;
      }
      
      if (bgAudio) {
        bgAudio.volume = 0.6;
      }
      
      // Start reverse animation
      if (this.useFrameAnimation) {
        this.animationDirection = -1;
        this.isAnimating = true;
        this.frameCounter = 0;
      }
    } else if ((this.name === 'Khoa' || this.name === 'Nat') && this.state !== 'sit') {
      this.setState('sit');
      this.barked = false;
      
      // Stop cycling and return to frame 1 for Khoa and Nat
      if (this.useFrameAnimation) {
        this.isCyclingActive = false;
        this.animationFrame = 0; // Return to frame 1 (index 0)
        this.isAnimating = false;
      }
      
      if (specialAudio) {
        specialAudio.pause();
        specialAudio.currentTime = 0;
      }
      
      if (bgAudio) {
        bgAudio.volume = 0.6;
      }
    } else if (this.name === 'Nolan') {
      // Nolan stays on frame 1 when player moves away - no animation changes
      // Only reset barked if not eating/dying
      if (!this.isEating && !this.eatingComplete) {
        this.barked = false;
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
    
    // Use frame animation system for Me dog, Madeline, Nolan, Khoa, and Nat if frames sprite is available
    if (this.useFrameAnimation && this.framesSprite && (this.name === 'Danoonie' || this.name === 'Madeline' || this.name === 'Nolan' || this.name === 'Khoa' || this.name === 'Nat')) {
      const config = this.name === 'Danoonie' ? CONFIG.DOGS.ME : 
                     this.name === 'Madeline' ? CONFIG.DOGS.FRIEND6 : 
                     this.name === 'Nolan' ? CONFIG.DOGS.FRIEND5 :
                     this.name === 'Nat' ? CONFIG.DOGS.FRIEND10 :
                     CONFIG.DOGS.FRIEND8;
      const currentFrameIndex = this.frameSequence[this.animationFrame];
      
      let sourceX;
      let frameWidth;
      
      if (this.name === 'Danoonie') {
        // Danoonie's 3-frame layout (me_frames.png)
        switch (currentFrameIndex) {
          case 0: // sit frame (1200-1800px)
            sourceX = 1200;
            frameWidth = 600;
            break;
          case 1: // transition frame (600-1200px)
            sourceX = 600;
            frameWidth = 600;
            break;
          case 2: // jump frame (0-600px)
            sourceX = 0;
            frameWidth = 600;
            break;
          default:
            sourceX = 1200;
            frameWidth = 600;
        }
      } else if (this.name === 'Madeline') {
        // Madeline's frame layout - exact 400px frames at correct positions
        switch (currentFrameIndex) {
          case 0: // Frame 1: 0-400px
            sourceX = 0;
            frameWidth = 400;
            break;
          case 1: // Frame 2: 400-800px
            sourceX = 400;
            frameWidth = 400;
            break;
          case 2: // Frame 3: 800-1200px
            sourceX = 800;
            frameWidth = 400;
            break;
          default:
            sourceX = 0;
            frameWidth = 400;
        }
      } else if (this.name === 'Nolan') {
        // Nolan's frame layout - exact 400px frames at correct positions
        switch (currentFrameIndex) {
          case 0: // Frame 1: 0-400px (normal)
            sourceX = 0;
            frameWidth = 400;
            break;
          case 1: // Frame 2: 400-800px (eating)
            sourceX = 400;
            frameWidth = 400;
            break;
          case 2: // Frame 3: 800-1200px (finished eating)
            sourceX = 800;
            frameWidth = 400;
            break;
          default:
            sourceX = 0;
            frameWidth = 400;
        }
      } else if (this.name === 'Khoa') {
        // Friend8's frame layout - exact 500px frames at correct positions
        switch (currentFrameIndex) {
          case 0: // Frame 1: 0-500px
            sourceX = 0;
            frameWidth = 500;
            break;
          case 1: // Frame 2: 500-1000px
            sourceX = 500;
            frameWidth = 500;
            break;
          case 2: // Frame 3: 1000-1500px
            sourceX = 1000;
            frameWidth = 500;
            break;
          default:
            sourceX = 0;
            frameWidth = 500;
        }
      } else if (this.name === 'Nat') {
        // Nat's frame layout - exact 300px frames at correct positions
        switch (currentFrameIndex) {
          case 0: // Frame 1: 0-300px
            sourceX = 0;
            frameWidth = 300;
            break;
          case 1: // Frame 2: 300-600px
            sourceX = 300;
            frameWidth = 300;
            break;
          case 2: // Frame 3: 600-900px
            sourceX = 600;
            frameWidth = 300;
            break;
          default:
            sourceX = 0;
            frameWidth = 300;
        }
      }
      
      let offsetX = 0;
      let offsetY = 0;
      
      if (this.name === 'Danoonie') {
        // Danoonie's 2-frame offsets
        switch (currentFrameIndex) {
          case 0: // sit frame
            offsetX = 0;
            offsetY = 0;
            break;
          case 1: // jump frame
            offsetX = 0;
            offsetY = 0;
            break;
        }
      } else if (this.name === 'Madeline') {
        // Madeline's offsets - use config offsets to keep frames in same position
        const frameOffsets = {
          0: config.sitFrameOffset || { x: 0, y: 0 },
          1: config.transitionFrameOffset || { x: 0, y: 0 },
          2: config.jumpFrameOffset || { x: 0, y: 0 }
        };
        const currentOffset = frameOffsets[currentFrameIndex] || { x: 0, y: 0 };
        offsetX = currentOffset.x;
        offsetY = currentOffset.y;
      } else if (this.name === 'Nolan') {
        // Nolan's offsets - use config offsets to keep frames grounded
        const frameOffsets = {
          0: config.sitFrameOffset || { x: 0, y: 0 },
          1: config.transitionFrameOffset || { x: 0, y: 0 },
          2: config.jumpFrameOffset || { x: 0, y: 0 }
        };
        const currentOffset = frameOffsets[currentFrameIndex] || { x: 0, y: 0 };
        offsetX = currentOffset.x;
        offsetY = currentOffset.y;
      } else if (this.name === 'Khoa') {
        // Khoa's offsets - use config offsets to keep frames grounded
        const frameOffsets = {
          0: config.sitFrameOffset || { x: 0, y: 0 },
          1: config.transitionFrameOffset || { x: 0, y: 0 },
          2: config.jumpFrameOffset || { x: 0, y: 0 }
        };
        const currentOffset = frameOffsets[currentFrameIndex] || { x: 0, y: 0 };
        offsetX = currentOffset.x;
        offsetY = currentOffset.y;
      } else if (this.name === 'Nat') {
        // Nat's offsets - use config offsets to keep frames grounded
        const frameOffsets = {
          0: config.sitFrameOffset || { x: 0, y: 0 },
          1: config.transitionFrameOffset || { x: 0, y: 0 },
          2: config.jumpFrameOffset || { x: 0, y: 0 }
        };
        const currentOffset = frameOffsets[currentFrameIndex] || { x: 0, y: 0 };
        offsetX = currentOffset.x;
        offsetY = currentOffset.y;
      }

      const renderData = {
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
      
      
      return renderData;
    }
    
    // Fallback to original 2-frame system for other dogs or if frames sprite not available
    
    const frame = this.state === 'jump' ? this.jumpFrame : this.sitFrame;
    const offsetX = this.state === 'jump' ? this.jumpOffsetX : 0;
    const offsetY = this.state === 'jump' ? this.jumpOffsetY : 0;

    // For simple friends (not Khoa), use full image dimensions
    const isSimpleFriend = ((this.name.startsWith('Friend') && this.name !== 'Khoa') || 
                           this.name === 'Raza') && this.sprite;
    const sourceWidth = isSimpleFriend ? this.sprite.naturalWidth : this.originalWidth;
    const sourceHeight = isSimpleFriend ? this.sprite.naturalHeight : this.originalHeight;

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
    const threshold = this.name === 'Danoonie' ? 
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
    // No interaction if fading or vanished
    if (this.isFading || this.isVanished) {
      return false;
    }
    
    const distance = this.distanceTo(player);
    const threshold = this.name === 'Danoonie' ? 
      CONFIG.DOGS.ME_INTERACTION_DISTANCE : 
      this.name === 'Nat' ?
      CONFIG.DOGS.NAT_INTERACTION_DISTANCE :
      this.name === 'Khoa' ?
      CONFIG.DOGS.KHOA_INTERACTION_DISTANCE :
      this.name === 'Nolan' ?
      CONFIG.DOGS.NOLAN_INTERACTION_DISTANCE :
      CONFIG.DOGS.INTERACTION_DISTANCE;
    
    return distance < threshold;
  }

  /**
   * Check if player can interact with hidden character (for prompt display)
   * @param {Player} player - Player entity
   * @returns {boolean} True if player is in range of hidden character
   */
  isPlayerInRangeForHidden(player) {
    // Only for hidden characters that haven't been revealed
    if (!this.isHidden || this.hasBeenRevealed) {
      return false;
    }
    
    const distance = this.distanceTo(player);
    const threshold = CONFIG.DOGS.INTERACTION_DISTANCE;
    
    
    return distance < threshold;
  }
  
  /**
   * Check if player can investigate (for Nolan)
   * @param {Player} player - Player entity
   * @returns {boolean} True if player is in range for investigation
   */
  isPlayerInRangeForInvestigation(player) {
    // Only for characters that need investigation and haven't been revealed
    if (!this.needsInvestigation || this.hasBeenRevealed) {
      return false;
    }
    
    const distance = this.distanceTo(player);
    const threshold = this.name === 'Nolan' ?
      CONFIG.DOGS.NOLAN_INTERACTION_DISTANCE :
      CONFIG.DOGS.INTERACTION_DISTANCE;
    
    return distance < threshold;
  }

  /**
   * Reveal a hidden character
   * @param {AudioManager} audioManager - Audio manager for playing reveal sound
   */
  reveal(audioManager) {
    if (this.isHidden && !this.hasBeenRevealed && !this.isGrowing) {
      console.log(`✨ ${this.name} is starting to grow!`);
      this.isHidden = false;
      this.isGrowing = true; // Enter growing state
      
      // Start animation for characters with 3-frame animation
      if (this.useFrameAnimation) {
        this.animationDirection = 1;
        this.isAnimating = true;
        this.frameCounter = 0;
        this.animationFrame = 0; // Reset to first frame
      }
      
      // Play plant growth sound and Madeline's voice for Madeline (only on first reveal)
      if (this.name === 'Madeline' && audioManager && !this.hasPlayedRevealSound) {
        const plantSound = audioManager.getAudio('plantGrowSound');
        if (plantSound) {
          plantSound.currentTime = 0;
          plantSound.volume = 0.3; // Gentle volume
          plantSound.play().catch(e => {
            console.log('Could not play plant growth sound:', e);
          });
        }
        
        // Play Madeline's voice audio (only once)
        const madelineSound = audioManager.getAudio('friend6Sound');
        if (madelineSound) {
          madelineSound.currentTime = 0;
          madelineSound.volume = 0.7; // Normal volume
          madelineSound.play().catch(e => {
            console.log('Could not play Madeline sound:', e);
          });
        }
        
        // Mark that reveal sound has been played
        this.hasPlayedRevealSound = true;
      }
    }
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
   * Start fading out the dog
   * @param {AudioManager} audioManager - Audio manager for playing fade sound
   */
  startFadeOut(audioManager) {
    if (!this.isFading && !this.isVanished) {
      console.log(`👻 ${this.name} is starting to fade away...`);
      this.isFading = true;
      // Enter jump state while fading
      this.setState('jump');
      
      // Play fade sound effect
      if (audioManager) {
        const fadeAudio = audioManager.getAudio('fadeSound');
        if (fadeAudio) {
          fadeAudio.currentTime = 0;
          fadeAudio.volume = 0.3; // Gentle volume
          fadeAudio.play().catch(e => {
            console.log('Could not play fade sound:', e);
          });
        }
      }
    }
  }

  /**
   * Update fade-out animation
   */
  updateFadeOut() {
    if (this.isFading && !this.isVanished) {
      this.fadeOpacity -= this.fadeSpeed;
      
      if (this.fadeOpacity <= 0) {
        this.fadeOpacity = 0;
        this.isVanished = true;
        this.isFading = false;
        console.log(`👻 ${this.name} has completely vanished!`);
      }
    }
  }

  /**
   * Check if dog is visible (not vanished and not hidden)
   * @returns {boolean}
   */
  isVisible() {
    // Special case for Nolan during phase-in
    if (this.name === 'Nolan' && this.isPhasing) {
      return true; // Visible during phase-in but with opacity
    }
    return !this.isVanished && !this.isHidden;
  }

  /**
   * Check if dog can be talked to (fully grown)
   * @returns {boolean}
   */
  canTalk() {
    // Hidden characters need to be revealed first, others are always available
    if (this.isHidden) {
      return this.hasBeenRevealed && !this.isGrowing;
    }
    
    // Investigation characters (Nolan) need to be revealed and not eating/dying
    if (this.needsInvestigation || (this.name === 'Nolan' && !this.hasBeenRevealed)) {
      return false;
    }
    
    // Nolan can't talk while eating or after eating (dying)
    if (this.name === 'Nolan' && (this.isEating || this.eatingComplete)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get current opacity for rendering
   * @returns {number} Opacity value 0-1
   */
  getOpacity() {
    if (this.isFading) {
      // Add subtle flicker effect while fading to make it more obvious
      const flicker = Math.sin(Date.now() * 0.01) * 0.1 + 0.9; // Gentle flicker between 0.8-1.0
      return Math.min(this.fadeOpacity * flicker, this.fadeOpacity);
    }
    
    // Handle phase-in for Nolan
    if (this.name === 'Nolan' && this.isPhasing) {
      return this.phaseOpacity;
    }
    
    return this.fadeOpacity;
  }
  
  /**
   * Start investigation sequence (for Nolan)
   * @param {AudioManager} audioManager - Audio manager for playing sounds
   */
  startInvestigation(audioManager) {
    if (this.needsInvestigation && !this.hasBeenRevealed && !this.isPhasing) {
      console.log(`🕵️ ${this.name} investigation started - beginning phase-in!`);
      this.needsInvestigation = false;
      this.isHidden = false;
      this.isPhasing = true;
      this.phaseOpacity = 0;
      // Mark as revealed immediately so he can be talked to during phase-in
      this.hasBeenRevealed = true;
      
      // Play Nolan init sound when he first appears
      if (this.name === 'Nolan' && audioManager) {
        audioManager.play('nolanInitSound');
      }
    }
  }
  
  /**
   * Update phase-in animation (for Nolan)
   */
  updatePhaseIn() {
    if (this.isPhasing && this.phaseOpacity < 1) {
      this.phaseOpacity += this.phaseSpeed;
      
      if (this.phaseOpacity >= 1) {
        this.phaseOpacity = 1;
        this.isPhasing = false;
        this.hasBeenRevealed = true;
        console.log(`🍄 ${this.name} phase-in complete - ready to talk!`);
      }
    }
  }
  
  /**
   * Start eating sequence (for Nolan)
   * @param {AudioManager} audioManager - Audio manager for playing sounds
   */
  startEatingSequence(audioManager) {
    if (this.name === 'Nolan' && !this.isEating && !this.eatingComplete) {
      console.log(`🍄 ${this.name} starting eating sequence!`);
      this.isEating = true;
      this.shouldDieAfterEating = true;
      
      // Play Nolan eating sound when he starts eating
      if (audioManager) {
        audioManager.play('nolanEatSound');
      }
      
      // Start eating animation (frame 1 -> 2 -> 3)
      if (this.useFrameAnimation) {
        this.animationDirection = 1;
        this.isAnimating = true;
        this.frameCounter = 0;
        this.animationFrame = 0; // Start at frame 1
      }
    }
  }
  
  /**
   * Update eating sequence (for Nolan)
   */
  updateEatingSequence() {
    if (this.name === 'Nolan' && this.isEating && this.useFrameAnimation) {
      // Check if eating animation is complete (reached frame 3)
      if (!this.isAnimating && this.animationFrame >= 2) {
        this.isEating = false;
        this.eatingComplete = true;
        console.log(`🍄 ${this.name} finished eating - starting death fade!`);
        
        // Start fade out after eating
        if (this.shouldDieAfterEating) {
          this.startFadeOut(null); // No audio manager needed
        }
      }
    }
  }
}