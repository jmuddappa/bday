/**
 * Jukebox Entity
 * Interactive music player with wiggle animation and floating notes
 */

import { CONFIG } from '../config/gameConfig.js';
import { GameObject } from './GameObject.js';

export class Jukebox extends GameObject {
  constructor() {
    super(
      CONFIG.JUKEBOX.X,
      CONFIG.JUKEBOX.Y,
      80, // width - will be scaled
      120 // height - will be scaled  
    );

    this.sprite = null;
    this.scale = CONFIG.JUKEBOX.SCALE;
    this.isPlayerNearby = false;
    
    // Wiggle animation
    this.wiggleOffset = 0;
    this.wiggleSpeed = CONFIG.JUKEBOX.WIGGLE_SPEED;
    this.wiggleAmplitude = CONFIG.JUKEBOX.WIGGLE_AMPLITUDE;
    
    // Music notes system
    this.musicNotes = [];
    this.noteSpawnTimer = 0;
    this.noteSpawnInterval = 30; // frames between note spawns
    
    console.log(`🎵 Jukebox created at (${this.x}, ${this.y})`);
  }

  /**
   * Set the jukebox sprite
   * @param {HTMLImageElement} sprite - Jukebox sprite image
   */
  setSprite(sprite) {
    this.sprite = sprite;
    if (sprite) {
      // Update dimensions based on sprite
      this.width = sprite.naturalWidth * this.scale;
      this.height = sprite.naturalHeight * this.scale;
      console.log(`🎵 Jukebox sprite loaded: ${this.width}x${this.height}`);
    }
  }

  /**
   * Update jukebox behavior based on player proximity
   * @param {Player} player - Player entity
   */
  update(player) {
    const distance = this.distanceTo(player);
    const wasNearby = this.isPlayerNearby;
    this.isPlayerNearby = distance < CONFIG.JUKEBOX.INTERACTION_DISTANCE;
    
    // Start/stop animation based on proximity
    if (this.isPlayerNearby && !wasNearby) {
      console.log('🎵 Player approached jukebox - starting animation');
    } else if (!this.isPlayerNearby && wasNearby) {
      console.log('🎵 Player left jukebox - stopping animation');
    }
    
    // Update wiggle animation when player is nearby
    if (this.isPlayerNearby) {
      this.wiggleOffset = Math.sin(Date.now() * this.wiggleSpeed) * this.wiggleAmplitude;
      this.spawnMusicNotes();
    } else {
      this.wiggleOffset = 0;
    }
    
    // Update existing music notes
    this.updateMusicNotes();
  }

  /**
   * Spawn floating music notes above jukebox
   */
  spawnMusicNotes() {
    this.noteSpawnTimer++;
    
    if (this.noteSpawnTimer >= this.noteSpawnInterval) {
      this.noteSpawnTimer = 0;
      
      // Create new note
      const note = {
        x: this.x + this.width/2 + (Math.random() - 0.5) * 40, // Random x around jukebox center
        y: this.y - 10, // Start just above jukebox
        symbol: Math.random() > 0.5 ? '♪' : '♫', // Random music symbol
        life: 1.0, // Full opacity
        speed: 0.5 + Math.random() * 0.5, // Float speed
        drift: (Math.random() - 0.5) * 0.3 // Horizontal drift
      };
      
      this.musicNotes.push(note);
      
      // Limit total notes to prevent lag
      if (this.musicNotes.length > 8) {
        this.musicNotes.shift();
      }
    }
  }

  /**
   * Update floating music notes
   */
  updateMusicNotes() {
    for (let i = this.musicNotes.length - 1; i >= 0; i--) {
      const note = this.musicNotes[i];
      
      // Move note upward and sideways
      note.y -= note.speed;
      note.x += note.drift;
      
      // Fade out over time
      note.life -= 0.015;
      
      // Remove dead notes
      if (note.life <= 0) {
        this.musicNotes.splice(i, 1);
      }
    }
  }

  /**
   * Check if player is within interaction range
   * @param {Player} player - Player entity
   * @returns {boolean} True if player can interact
   */
  isPlayerInRange(player) {
    return this.isPlayerNearby;
  }

  /**
   * Get prompt position for "Press E" UI
   * @param {HTMLCanvasElement} canvas - Game canvas
   * @returns {Object} Position for prompt
   */
  getPromptPosition(canvas) {
    const rect = canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    return {
      x: rect.left + (this.x + this.width/2 + CONFIG.JUKEBOX.PROMPT_OFFSET_X) * canvasScale,
      y: rect.top + (this.y + CONFIG.JUKEBOX.PROMPT_OFFSET_Y) * canvasScale
    };
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
      destX: Math.round(this.x + this.wiggleOffset), // Apply wiggle to X position
      destY: Math.round(this.y),
      destWidth: Math.round(this.width),
      destHeight: Math.round(this.height)
    };
  }

  /**
   * Get music notes for rendering
   * @returns {Array} Array of note objects
   */
  getMusicNotes() {
    return this.musicNotes;
  }

  /**
   * Get jukebox status info
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      position: { x: this.x, y: this.y },
      isPlayerNearby: this.isPlayerNearby,
      wiggleOffset: this.wiggleOffset,
      activeNotes: this.musicNotes.length,
      hasSprite: !!this.sprite
    };
  }
}