/**
 * Main entry point for the Birthday Game
 * Minimal bootstrap file - all game logic is in separate modules
 */

import { Game } from './core/Game.js';
import { ErrorHandler } from './utils/ErrorHandler.js';

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🎮 Initializing Birthday Game...');
    
    const game = new Game();
    await game.initialize();
    
    // Expose game to global scope for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.game = game;
      console.log('🔧 Game instance available as window.game');
    }
    
    console.log('✅ Game initialized successfully!');
    
  } catch (error) {
    console.error('⚠️ Game initialization error:', error);
    ErrorHandler.handleError(error, 'Game initialization');
    // Don't show alert if game actually loads - just log the error
  }
});