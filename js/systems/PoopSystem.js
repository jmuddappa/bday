/**
 * Poop System
 * Manages poop spawning when Roti jumps and cleanup interactions
 */

import { ErrorHandler } from '../utils/ErrorHandler.js';

export class PoopSystem {
  constructor() {
    this.poops = []; // Array of {x, y, cleaned, timestamp}
    this.lastRotiJumpState = false; // Track state changes
    this.poopCleanupDistance = 30; // How close player needs to be to clean
    
    console.log('💩 PoopSystem initialized');
  }

  /**
   * Update poop system - check for new poops and cleanup
   * @param {Dog} rotiDog - Roti dog entity
   * @param {Player} player - Player entity
   */
  update(rotiDog, player) {
    try {
      // Check if Roti just entered jump state (poop time!)
      const isCurrentlyJumping = rotiDog.state === 'jump';
      
      if (isCurrentlyJumping && !this.lastRotiJumpState) {
        // Roti just started jumping - spawn poop!
        this.spawnPoop(rotiDog.x, rotiDog.y);
      }
      
      this.lastRotiJumpState = isCurrentlyJumping;
      
      // Check for cleanup interactions
      this.checkCleanup(player);
      
    } catch (error) {
      ErrorHandler.handleError(error, 'PoopSystem.update');
    }
  }

  /**
   * Spawn a new poop at the given location
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  spawnPoop(x, y) {
    // Add some randomness to poop position around Roti
    const offsetX = (Math.random() - 0.5) * 40; // ±20px
    const offsetY = (Math.random() - 0.5) * 20; // ±10px
    
    const poop = {
      x: x + offsetX,
      y: y + 60 + offsetY, // Below Roti
      cleaned: false,
      timestamp: Date.now()
    };
    
    this.poops.push(poop);
    console.log('💩 Poop spawned at', poop.x, poop.y);
  }

  /**
   * Check if player can clean any nearby poops
   * @param {Player} player - Player entity
   */
  checkCleanup(player) {
    this.poops.forEach(poop => {
      if (!poop.cleaned) {
        const distance = Math.sqrt(
          Math.pow(player.x + player.width/2 - poop.x, 2) + 
          Math.pow(player.y + player.height/2 - poop.y, 2)
        );
        
        if (distance < this.poopCleanupDistance) {
          // Player walked over poop - clean it!
          poop.cleaned = true;
          console.log('💩 Poop cleaned!');
          
          // Optional: Add cleanup sound here later
        }
      }
    });
  }

  /**
   * Get all visible (uncleaned) poops for rendering
   * @returns {Array} Array of uncleaned poop objects
   */
  getVisiblePoops() {
    return this.poops.filter(poop => !poop.cleaned);
  }

  /**
   * Get total poop count (for stats)
   * @returns {Object} Poop statistics
   */
  getStats() {
    const total = this.poops.length;
    const cleaned = this.poops.filter(poop => poop.cleaned).length;
    const remaining = total - cleaned;
    
    return { total, cleaned, remaining };
  }

  /**
   * Clean up old cleaned poops to prevent memory bloat
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30000; // Keep cleaned poops for 30 seconds
    
    this.poops = this.poops.filter(poop => {
      if (poop.cleaned && now - poop.timestamp > maxAge) {
        return false; // Remove old cleaned poop
      }
      return true; // Keep poop
    });
  }

  /**
   * Reset all poops (for debugging or game reset)
   */
  reset() {
    this.poops = [];
    console.log('💩 All poops cleared');
  }
}