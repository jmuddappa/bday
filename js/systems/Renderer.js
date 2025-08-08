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
   * Draw the player character
   * @param {Player} player - Player entity to draw
   */
  drawPlayer(player) {
    if (!player) return;

    try {
      const sprite = player.getCurrentSprite();
      if (!sprite) return;

      const dimensions = player.getDrawDimensions();
      
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
    } catch (error) {
      ErrorHandler.handleError(error, 'Renderer.drawPlayer');
    }
  }

  /**
   * Draw a dog entity
   * @param {Dog} dog - Dog entity to draw
   */
  drawDog(dog) {
    if (!dog || !dog.sprite) return;

    try {
      const drawData = dog.getDrawData();
      
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
   * Get rendering context
   * @returns {CanvasRenderingContext2D}
   */
  getContext() {
    return this.ctx;
  }
}