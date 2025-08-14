/**
 * Rendering System
 * Handles all canvas drawing operations and debug visualization
 */

import { CONFIG } from '../config/gameConfig.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.debugMode = false;
    this.collisionMode = false;
    
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = CONFIG.CANVAS.WIDTH;
    this.canvas.height = CONFIG.CANVAS.HEIGHT;
    
    // Improve pixel art rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
  }

  /**
   * Clear the entire canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the background image
   * @param {HTMLImageElement} backgroundImage - Background image to draw
   */
  drawBackground(backgroundImage) {
    if (!backgroundImage) return;
    
    try {
      this.ctx.drawImage(backgroundImage, 0, 0);
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawBackground');
    }
  }

  /**
   * Draw a Stardew Valley-style shadow
   * @param {number} x - X position for shadow center
   * @param {number} y - Y position for shadow center  
   * @param {number} width - Shadow width
   * @param {number} height - Shadow height
   * @param {number} opacity - Shadow opacity (0-1)
   */
  drawShadow(x, y, width, height, opacity = 0.3) {
    try {
      this.ctx.save();
      
      // Create radial gradient for soft shadow
      const gradient = this.ctx.createRadialGradient(
        x, y, 0,           // Inner circle (center)
        x, y, width / 2   // Outer circle
      );
      gradient.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${opacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      this.ctx.fillStyle = gradient;
      
      // Draw elliptical shadow
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, width / 2, height / 2, 0, 0, 2 * Math.PI);
      this.ctx.fill();
      
      this.ctx.restore();
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawShadow');
    }
  }

  /**
   * Draw the player character
   * @param {Player} player - Player entity to draw
   */
  drawPlayer(player) {
    if (!player) return;

    try {
      const sprite = player.getCurrentSprite();
      if (!sprite) return;

      const dimensions = player.getDrawDimensions();
      
      // Draw shadow first (behind player)
      const shadowX = player.x + dimensions.width / 2;
      const shadowY = player.y + dimensions.height - CONFIG.PLAYER.SHADOW_OFFSET_Y;
      this.drawShadow(shadowX, shadowY, CONFIG.PLAYER.SHADOW_WIDTH, CONFIG.PLAYER.SHADOW_HEIGHT);
      
      // Check if using walking animation sprites
      const isUsingWalkingSprite = player.isWalkingHorizontally && 
                                  (player.direction === 'left' || player.direction === 'right') &&
                                  sprite === player.sprites.get('movement');
      
      const isUsingUpWalkingSprite = player.direction === 'up' &&
                                    sprite === player.sprites.get('up');

      const isUsingDownWalkingSprite = player.isWalkingDown && 
                                      player.direction === 'down' &&
                                      sprite === player.sprites.get('down');
      
      if (isUsingWalkingSprite) {
        // Draw walking animation frame
        const frameCoords = player.getWalkingFrameCoords();
        
        if (player.direction === 'right') {
          // Flip sprite horizontally for right movement
          this.ctx.save();
          this.ctx.scale(-1, 1);
          this.ctx.drawImage(
            sprite,
            frameCoords.sx,
            frameCoords.sy,
            frameCoords.swidth,
            frameCoords.sheight,
            -player.x - dimensions.width,
            player.y,
            dimensions.width,
            dimensions.height
          );
          this.ctx.restore();
        } else {
          // Normal walking animation (left)
          this.ctx.drawImage(
            sprite,
            frameCoords.sx,
            frameCoords.sy,
            frameCoords.swidth,
            frameCoords.sheight,
            player.x,
            player.y,
            dimensions.width,
            dimensions.height
          );
        }
      } else if (isUsingUpWalkingSprite) {
        // Draw up walking animation frame
        const frameCoords = player.getUpWalkingFrameCoords();
        
        this.ctx.drawImage(
          sprite,
          frameCoords.sx,
          frameCoords.sy,
          frameCoords.swidth,
          frameCoords.sheight,
          player.x,
          player.y,
          dimensions.width,
          dimensions.height
        );
      } else if (isUsingDownWalkingSprite) {
        // Draw down walking animation frame
        const frameCoords = player.getDownWalkingFrameCoords();
        
        this.ctx.drawImage(
          sprite,
          frameCoords.sx,
          frameCoords.sy,
          frameCoords.swidth,
          frameCoords.sheight,
          player.x,
          player.y,
          dimensions.width,
          dimensions.height
        );
      } else {
        // Normal sprite drawing (non-walking)
        if (player.direction === 'right') {
          // Flip sprite horizontally for right movement
          this.ctx.save();
          this.ctx.scale(-1, 1);
          this.ctx.drawImage(
            sprite,
            -player.x - dimensions.width,
            player.y,
            dimensions.width,
            dimensions.height
          );
          this.ctx.restore();
        } else {
          this.ctx.drawImage(
            sprite,
            player.x,
            player.y,
            dimensions.width,
            dimensions.height
          );
        }
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawPlayer');
    }
  }


  /**
   * Draw a dog entity
   * @param {Dog} dog - Dog entity to draw
   */
  drawDog(dog) {
    if (!dog || !dog.sprite || !dog.isVisible()) return;

    try {
      const drawData = dog.getDrawData();
      
      // Map friend names to config keys
      let configKey = dog.name.toUpperCase();
      if (dog.name === 'Khoa & Anne') configKey = 'FRIEND1';
      if (dog.name === 'Raza') configKey = 'FRIEND2';
      if (dog.name === 'Anne') configKey = 'FRIEND7';
      if (dog.name === 'bố') configKey = 'FRIEND9';
      if (dog.name === 'mẹ') configKey = 'MOM';
      if (dog.name === 'Nat') configKey = 'FRIEND10';
      
      const config = CONFIG.DOGS[configKey];
      
      // Handle opacity for fading dogs
      const opacity = dog.getOpacity();
      if (opacity < 1.0) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
      }
      
      // Check if sprite loaded properly
      if (!drawData.sprite || drawData.sprite.naturalWidth === 0) {
        console.warn(`🚨 ${dog.name} sprite not loaded properly`);
        return;
      }
      
      // Draw shadow first (behind dog)
      if (config && config.shadowWidth) {
        const shadowX = drawData.destX + drawData.destWidth / 2;
        // For jump state, use original position (without jump offset) for shadow
        const baseY = dog.state === 'jump' ? 
          drawData.destY - (config.jumpOffsetY || 0) + drawData.destHeight - config.shadowOffsetY :
          drawData.destY + drawData.destHeight - config.shadowOffsetY;
        const shadowY = baseY;
        const opacity = dog.state === 'jump' ? 0.2 : 0.3; // Lighter shadow when jumping
        this.drawShadow(shadowX, shadowY, config.shadowWidth, config.shadowHeight, opacity);
      }
      
      this.ctx.drawImage(
        drawData.sprite,
        drawData.sourceX,
        drawData.sourceY,
        drawData.sourceWidth,
        drawData.sourceHeight,
        drawData.destX,
        drawData.destY,
        drawData.destWidth,
        drawData.destHeight
      );
      
      // Restore context if we modified opacity
      if (opacity < 1.0) {
        this.ctx.restore();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawDog');
    }
  }

  /**
   * Draw debug collision boxes
   * @param {Array} collisionBoxes - Array of collision box objects
   * @param {Player} player - Player entity for collision visualization
   */
  drawDebugCollisions(collisionBoxes, player) {
    if (!this.collisionMode) return;

    try {
      // Draw collision boxes in red
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      collisionBoxes.forEach(box => {
        this.ctx.fillRect(box.x, box.y, box.width, box.height);
      });

      // Draw player collision box in blue
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.4)';
      this.ctx.fillRect(player.x, player.y, player.width, player.height);
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawDebugCollisions');
    }
  }

  /**
   * Draw debug information text
   * @param {Player} player - Player entity
   * @param {Array} dogs - Array of dog entities
   */
  drawDebugInfo(player, dogs) {
    if (!this.debugMode) return;

    try {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px monospace';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 3;
      
      let y = 30;
      const lineHeight = 20;
      
      // Player info
      const playerInfo = `Player: (${Math.round(player.x)}, ${Math.round(player.y)}) - ${player.direction}`;
      this.ctx.strokeText(playerInfo, 10, y);
      this.ctx.fillText(playerInfo, 10, y);
      y += lineHeight;
      
      // Dog info
      dogs.forEach(dog => {
        const dogInfo = `${dog.name}: ${dog.state} - Distance: ${Math.round(dog.distanceTo(player))}`;
        this.ctx.strokeText(dogInfo, 10, y);
        this.ctx.fillText(dogInfo, 10, y);
        y += lineHeight;
      });
      
      // Performance info
      const fps = Math.round(1000 / (performance.now() - (this.lastFrameTime || performance.now())));
      const perfInfo = `FPS: ~${fps}`;
      this.ctx.strokeText(perfInfo, 10, y);
      this.ctx.fillText(perfInfo, 10, y);
      
      this.lastFrameTime = performance.now();
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawDebugInfo');
    }
  }

  /**
   * Draw text with outline for better visibility
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Text styling options
   */
  drawText(text, x, y, options = {}) {
    const {
      font = '16px Arial',
      fillStyle = 'white',
      strokeStyle = 'black',
      strokeWidth = 2,
      textAlign = 'left',
      textBaseline = 'top'
    } = options;

    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = fillStyle;
    this.ctx.textAlign = textAlign;
    this.ctx.textBaseline = textBaseline;

    if (strokeStyle && strokeWidth > 0) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeText(text, x, y);
    }

    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  /**
   * Draw a rectangle with optional fill and stroke
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {Object} options - Styling options
   */
  drawRectangle(x, y, width, height, options = {}) {
    const {
      fillStyle = null,
      strokeStyle = null,
      lineWidth = 1
    } = options;

    this.ctx.save();
    
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fillRect(x, y, width, height);
    }
    
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeRect(x, y, width, height);
    }
    
    this.ctx.restore();
  }

  /**
   * Toggle debug mode
   * @returns {boolean} New debug mode state
   */
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    return this.debugMode;
  }

  /**
   * Set debug mode state
   * @param {boolean} enabled - Debug mode state
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Toggle collision mode
   * @returns {boolean} New collision mode state
   */
  toggleCollisionMode() {
    this.collisionMode = !this.collisionMode;
    return this.collisionMode;
  }

  /**
   * Set collision mode state
   * @param {boolean} enabled - Collision mode state
   */
  setCollisionMode(enabled) {
    this.collisionMode = enabled;
  }

  /**
   * Get canvas size
   * @returns {Object} Canvas dimensions
   */
  getCanvasSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Get canvas element
   * @returns {HTMLCanvasElement}
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Draw jukebox with wiggle animation and music notes
   * @param {Jukebox} jukebox - Jukebox entity
   */
  drawJukebox(jukebox) {
    if (!jukebox) return;

    try {
      const drawData = jukebox.getDrawData();
      if (!drawData) return;

      // Draw shadow first (behind jukebox)
      const shadowX = drawData.destX + drawData.destWidth / 2;
      const shadowY = drawData.destY + drawData.destHeight - 5;
      this.drawShadow(shadowX, shadowY, 60, 20, 0.3);

      // Draw jukebox sprite with optional darkening when player is nearby
      this.ctx.save();
      
      // Apply gentle darkening when player is nearby for clean interaction feedback
      if (jukebox.isPlayerNearby) {
        this.ctx.filter = 'brightness(0.85)'; // Subtle darkening effect
      }
      
      this.ctx.drawImage(
        drawData.sprite,
        drawData.sourceX,
        drawData.sourceY,
        drawData.sourceWidth,
        drawData.sourceHeight,
        drawData.destX,
        drawData.destY,
        drawData.destWidth,
        drawData.destHeight
      );
      
      this.ctx.restore();

      // Draw floating music notes
      const musicNotes = jukebox.getMusicNotes();
      if (musicNotes.length > 0) {
        this.ctx.save();
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        musicNotes.forEach(note => {
          const alpha = Math.max(0, Math.min(1, note.life));
          this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
          this.ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
          this.ctx.lineWidth = 2;
          
          // Draw note with outline
          this.ctx.strokeText(note.symbol, note.x, note.y);
          this.ctx.fillText(note.symbol, note.x, note.y);
        });

        this.ctx.restore();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawJukebox');
    }
  }

  /**
   * Draw rotating cake
   * @param {Cake} cake - Cake entity
   */
  drawCake(cake) {
    if (!cake) return;

    try {
      const drawData = cake.getDrawData();
      if (!drawData) return;

      this.ctx.save();

      // Apply opacity for fade effect
      if (drawData.opacity !== undefined && drawData.opacity < 1) {
        this.ctx.globalAlpha = drawData.opacity;
      }

      // Apply rotation if cake is rotating
      if (drawData.rotation !== 0) {
        this.ctx.translate(drawData.centerX, drawData.centerY);
        this.ctx.rotate(drawData.rotation);
        this.ctx.translate(-drawData.centerX, -drawData.centerY);
      }

      // Draw shadow first
      const shadowX = drawData.destX + drawData.destWidth / 2;
      const shadowY = drawData.destY + drawData.destHeight - 5;
      this.drawShadow(shadowX, shadowY, 40, 15, 0.3);

      // Draw cake
      this.ctx.drawImage(
        drawData.sprite,
        drawData.sourceX,
        drawData.sourceY,
        drawData.sourceWidth,
        drawData.sourceHeight,
        drawData.destX,
        drawData.destY,
        drawData.destWidth,
        drawData.destHeight
      );

      this.ctx.restore();

      // Debug mode - show bounds and rotation center
      if (this.debugMode) {
        this.ctx.save();
        this.ctx.strokeStyle = 'orange';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(drawData.destX, drawData.destY, drawData.destWidth, drawData.destHeight);
        
        // Show rotation center
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(drawData.centerX - 2, drawData.centerY - 2, 4, 4);
        this.ctx.restore();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawCake');
    }
  }

  /**
   * Draw debug visualization for cake (always visible for debugging)
   * @param {Cake} cake - Cake entity
   */
  drawCakeDebug(cake) {
    if (!cake) return;

    try {
      this.ctx.save();
      
      // Draw interaction area
      this.ctx.strokeStyle = 'lime';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      const interactionSize = cake.constructor.name === 'Cake' ? 120 : 100; // Use cake's interaction distance
      this.ctx.strokeRect(
        cake.x - interactionSize/2, 
        cake.y - interactionSize/2, 
        cake.width + interactionSize, 
        cake.height + interactionSize
      );
      
      // Draw cake bounds
      this.ctx.strokeStyle = cake.isVisible() ? 'blue' : 'red';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);
      this.ctx.strokeRect(cake.x, cake.y, cake.width, cake.height);
      
      // Draw center point
      this.ctx.fillStyle = 'yellow';
      this.ctx.fillRect(cake.x + cake.width/2 - 3, cake.y + cake.height/2 - 3, 6, 6);
      
      // Draw status text
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1;
      this.ctx.font = '12px monospace';
      const statusText = `Cake: ${cake.isVisible() ? 'VISIBLE' : 'HIDDEN'} ${cake.hasBeenRevealed ? 'REVEALED' : 'NOT_REVEALED'}`;
      this.ctx.strokeText(statusText, cake.x, cake.y - 10);
      this.ctx.fillText(statusText, cake.x, cake.y - 10);
      
      this.ctx.restore();
    } catch (error) {
      console.log('Error in drawCakeDebug:', error);
    }
  }

  /**
   * Draw Danundie streak animation
   * @param {DanundieStreak} danundieStreak - Danundie streak entity
   */
  drawDanundieStreak(danundieStreak) {
    if (!danundieStreak || !danundieStreak.isStreaking()) return;

    try {
      const frameData = danundieStreak.getFrameData();
      if (!frameData) return;

      this.ctx.drawImage(
        frameData.sprite,
        frameData.sourceX,
        frameData.sourceY,
        frameData.sourceWidth,
        frameData.sourceHeight,
        frameData.destX,
        frameData.destY,
        frameData.destWidth,
        frameData.destHeight
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawDanundieStreak');
    }
  }

  /**
   * Draw poop emojis
   * @param {PoopSystem} poopSystem - Poop system with poop locations
   */
  drawPoops(poopSystem) {
    if (!poopSystem) return;

    try {
      const visiblePoops = poopSystem.getVisiblePoops();
      
      if (visiblePoops.length > 0) {
        this.ctx.save();
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        visiblePoops.forEach(poop => {
          // Draw poop emoji with slight shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.fillText('💩', poop.x + 1, poop.y + 1); // Shadow
          
          this.ctx.fillStyle = '#8B4513'; // Brown color
          this.ctx.fillText('💩', poop.x, poop.y);
        });
        
        this.ctx.restore();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawPoops');
    }
  }

  /**
   * Draw Daninja reveal animation
   * @param {DaninjaReveal} daninjaReveal - Daninja reveal entity
   */
  drawDaninjaReveal(daninjaReveal) {
    if (!daninjaReveal) return;

    try {
      const drawData = daninjaReveal.getDrawData();
      if (!drawData) return; // Hidden state

      this.ctx.save();
      
      // Handle rotation for spinning ball
      if (drawData.rotation && drawData.rotation !== 0) {
        const centerX = drawData.destX + drawData.destWidth / 2;
        const centerY = drawData.destY + drawData.destHeight / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(drawData.rotation);
        this.ctx.translate(-centerX, -centerY);
      }

      // Draw Daninja sprite
      this.ctx.drawImage(
        drawData.sprite,
        drawData.sourceX,
        drawData.sourceY,
        drawData.sourceWidth,
        drawData.sourceHeight,
        drawData.destX,
        drawData.destY,
        drawData.destWidth,
        drawData.destHeight
      );

      this.ctx.restore();
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawDaninjaReveal');
    }
  }

  /**
   * Draw debug hitboxes for Nolan investigation
   * @param {Array} dogs - Array of dog entities
   */
  drawHiddenCharacterHitboxes(dogs) {
    if (!this.debugMode) return;

    try {
      this.ctx.save();
      this.ctx.font = '12px monospace';
      
      // Find Nolan specifically and draw his hitbox
      const nolan = dogs.find(dog => dog.name === 'Nolan');
      if (nolan) {
        const threshold = CONFIG.DOGS.NOLAN_INTERACTION_DISTANCE || 140;
        
        // Calculate hitbox bounds
        const centerX = nolan.x + nolan.width / 2;
        const centerY = nolan.y + nolan.height / 2;
        const hitboxX = centerX - threshold;
        const hitboxY = centerY - threshold;
        const hitboxWidth = threshold * 2;
        const hitboxHeight = threshold * 2;
        
        // Draw hitbox - always visible for Nolan
        this.ctx.strokeStyle = '#FFA500'; // Orange
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
        
        // Draw center point
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillRect(centerX - 3, centerY - 3, 6, 6);
        
        // Draw prompt position indicator
        const promptX = nolan.x + nolan.width / 2 - 80;
        const promptY = nolan.y - 50;
        this.ctx.fillStyle = '#FFFF00'; // Yellow
        this.ctx.fillRect(promptX - 4, promptY - 4, 8, 8);
        
        // Draw text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeText(`NOLAN INVESTIGATE (${threshold}px)`, promptX + 12, promptY);
        this.ctx.fillText(`NOLAN INVESTIGATE (${threshold}px)`, promptX + 12, promptY);
      }
      
      this.ctx.restore();
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawHiddenCharacterHitboxes');
    }
  }

  /**
   * Get rendering context
   * @returns {CanvasRenderingContext2D}
   */
  getContext() {
    return this.ctx;
  }
}