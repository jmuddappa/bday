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
    
    // Expose game to global scope
    window.game = game;
    console.log('🔧 Game instance available as window.game');
    
    // Global helper functions for background music control
    window.disableBgMusicAutoPlay = () => {
      if (game.jukeboxSystem) {
        game.jukeboxSystem.disableBackgroundMusicAutoPlay();
        console.log('🎵 Background music auto-play DISABLED. Use enableBgMusicAutoPlay() to re-enable.');
      }
    };
    
    window.enableBgMusicAutoPlay = () => {
      if (game.jukeboxSystem) {
        game.jukeboxSystem.enableBackgroundMusicAutoPlay();
        console.log('🎵 Background music auto-play ENABLED.');
      }
    };
    
    console.log('🎵 Use disableBgMusicAutoPlay() or enableBgMusicAutoPlay() to control background music auto-resuming');
    
    console.log('✅ Game initialized successfully!');
    
  } catch (error) {
    console.error('⚠️ Game initialization error:', error);
    ErrorHandler.handleError(error, 'Game initialization');
    // Don't show alert if game actually loads - just log the error
  }
});