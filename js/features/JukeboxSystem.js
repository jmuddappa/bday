/**
 * Jukebox System
 * Handles jukebox modal interface and song selection
 */

import { JUKEBOX_DATA } from '../config/jukeboxData.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { language } from '../utils/Language.js';

export class JukeboxSystem {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.jukeboxContainer = null;
    this.jukeboxList = null;
    this.videoModal = null;
    this.videoPlayer = null;
    this.videoTitle = null;
    this.isOpen = false;
    this.currentVideoIndex = 0;
    this.videos = JUKEBOX_DATA;
    this.wasJukeboxOpen = false;
    
    this.setupElements();
    this.setupEventListeners();
    
    console.log(`🎵 JukeboxSystem initialized with ${this.videos.length} songs`);
  }

  setupElements() {
    // Use dedicated jukebox container
    this.jukeboxContainer = document.getElementById('jukeboxContainer');
    this.jukeboxList = document.getElementById('jukeboxList');
    this.jukeboxSearch = document.getElementById('jukeboxSearch');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.nowPlaying = document.getElementById('nowPlaying');
    this.nowPlayingSong = document.getElementById('nowPlayingSong');
    this.queueSection = document.getElementById('queueSection');
    this.nextSong = document.getElementById('nextSong');
    
    // Get existing video modal elements
    this.videoModal = document.getElementById('videoModal');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.videoTitle = document.getElementById('videoTitle');
    
    if (!this.jukeboxContainer) {
      console.warn('🎵 Jukebox container not found');
    }
    
    // Setup search functionality
    if (this.jukeboxSearch) {
      this.jukeboxSearch.addEventListener('input', (e) => {
        this.filterSongs(e.target.value);
      });
    }
    
    // Setup volume control
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value / 100);
      });
    }
  }

  setupEventListeners() {
    // Close button functionality for jukebox container
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-btn') && 
          e.target.closest('.jukebox-container') && this.isOpen) {
        this.closeJukebox();
      }
      
      // Handle video modal close - reopen jukebox if it was open
      if (e.target.classList.contains('close-btn') && 
          e.target.closest('.video-modal') && this.wasJukeboxOpen) {
        // Restore background music
        const bgMusic = this.audioManager.getAudio('bgMusic');
        if (bgMusic) {
          bgMusic.volume = 0.6;
        }
        
        // Close video modal
        this.videoModal.style.display = 'none';
        // Reopen jukebox
        this.openJukebox();
        this.wasJukeboxOpen = false;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeJukebox();
      }
      
      // Handle video modal escape - reopen jukebox if it was open
      if (e.key === 'Escape' && this.videoModal && 
          this.videoModal.style.display === 'flex' && this.wasJukeboxOpen) {
        // Restore background music
        const bgMusic = this.audioManager.getAudio('bgMusic');
        if (bgMusic) {
          bgMusic.volume = 0.6;
        }
        
        // Close video modal
        this.videoModal.style.display = 'none';
        // Reopen jukebox
        this.openJukebox();
        this.wasJukeboxOpen = false;
      }
    });
  }

  /**
   * Open the jukebox song selection modal (reusing mail container)
   */
  openJukebox() {
    if (!this.jukeboxContainer) {
      console.error('🎵 Jukebox container not found');
      return;
    }

    console.log('🎵 Opening jukebox');
    this.isOpen = true;
    
    // Use smooth animation from Game.js
    const game = window.game; // Assuming game instance is accessible
    if (game && game.showJukeboxSmooth) {
      game.showJukeboxSmooth();
    } else {
      this.jukeboxContainer.style.display = 'block';
      this.jukeboxContainer.classList.add('visible');
    }
    
    this.populateJukeboxList();
    
    // Request audio permission if needed
    this.audioManager.tryStartAudio();
  }

  /**
   * Close the jukebox modal
   */
  closeJukebox() {
    if (!this.jukeboxContainer) return;
    
    console.log('🎵 Closing jukebox');
    this.isOpen = false;
    
    // Use smooth animation from Game.js
    const game = window.game; // Assuming game instance is accessible
    if (game && game.hideJukeboxSmooth) {
      game.hideJukeboxSmooth();
    } else {
      this.jukeboxContainer.classList.remove('visible');
      this.jukeboxContainer.classList.add('hiding');
      setTimeout(() => {
        this.jukeboxContainer.style.display = 'none';
        this.jukeboxContainer.classList.remove('hiding');
      }, 400);
    }
  }

  /**
   * Populate the jukebox song list with enhanced styling
   */
  populateJukeboxList() {
    if (!this.jukeboxList) return;
    
    this.jukeboxList.innerHTML = '';
    
    this.videos.forEach((song, index) => {
      const songItem = document.createElement('div');
      songItem.className = 'jukebox-item';
      songItem.innerHTML = `
        <div class="jukebox-icon">${song.icon}</div>
        <div class="jukebox-content">
          <div class="jukebox-song-title">${song.title}</div>
          <div class="jukebox-artist">${song.artist || 'Unknown Artist'}</div>
        </div>
        <div class="playing-indicator" style="display: none;">
          <div class="equalizer">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
          </div>
        </div>
      `;
      
      // Add click handler
      songItem.addEventListener('click', () => {
        this.playVideo(index);
      });
      
      this.jukeboxList.appendChild(songItem);
    });
  }

  /**
   * Play selected video
   * @param {number} index - Video index
   */
  playVideo(index) {
    if (index < 0 || index >= this.videos.length) {
      console.error('🎵 Invalid video index:', index);
      return;
    }

    const video = this.videos[index];
    console.log(`🎵 Playing: ${video.title}`);
    
    this.currentVideoIndex = index;
    
    // Remember that jukebox was open
    this.wasJukeboxOpen = true;
    
    // Close jukebox and open video modal
    this.closeJukebox();
    
    // Set up video player
    if (this.videoPlayer && this.videoTitle && this.videoModal) {
      // Stop any existing video playback first
      this.videoPlayer.pause();
      this.videoPlayer.currentTime = 0;
      
      // Pause background music during video playback
      const bgMusic = this.audioManager.getAudio('bgMusic');
      if (bgMusic) {
        bgMusic.volume = 0;
      }
      
      this.videoTitle.textContent = video.title;
      this.videoPlayer.src = video.src;
      this.videoPlayer.load();
      
      // Hide navigation arrows for jukebox videos (single videos, no navigation needed)
      const leftArrow = document.getElementById('videoNavLeft');
      const rightArrow = document.getElementById('videoNavRight');
      if (leftArrow) leftArrow.style.display = 'none';
      if (rightArrow) rightArrow.style.display = 'none';
      
      // Show video modal with flex display for centering
      this.videoModal.style.display = 'flex';
      
      // Setup video end handler to restore background music
      this.videoPlayer.onended = () => {
        if (bgMusic) {
          bgMusic.volume = 0.6;
        }
      };
      
      // Auto-play when ready with a small delay to avoid conflicts
      this.videoPlayer.addEventListener('loadeddata', () => {
        setTimeout(() => {
          this.videoPlayer.play().catch(e => {
            console.log('🎵 Video autoplay failed:', e);
          });
        }, 100); // 100ms delay
      }, { once: true });
    }
  }

  /**
   * Check if jukebox is currently open
   * @returns {boolean}
   */
  isJukeboxOpen() {
    return this.isOpen;
  }

  /**
   * Get total number of songs
   * @returns {number}
   */
  getTotalSongs() {
    return this.videos.length;
  }

  /**
   * Filter songs based on search query
   * @param {string} query - Search query
   */
  filterSongs(query) {
    if (!this.jukeboxList) return;
    
    const items = this.jukeboxList.querySelectorAll('.jukebox-item');
    const searchTerm = query.toLowerCase();
    
    items.forEach(item => {
      const title = item.querySelector('.jukebox-song-title').textContent.toLowerCase();
      const artist = item.querySelector('.jukebox-artist').textContent.toLowerCase();
      
      if (title.includes(searchTerm) || artist.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Set volume for video playback
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    if (this.videoPlayer) {
      this.videoPlayer.volume = volume;
    }
    console.log(`🎵 Volume set to: ${Math.round(volume * 100)}%`);
  }

  /**
   * Add a new song to the jukebox
   * @param {Object} song - Song data {title, src, icon}
   */
  addSong(song) {
    this.videos.push(song);
    console.log(`🎵 Added song: ${song.title}`);
    
    if (this.isOpen) {
      this.populateJukeboxList();
    }
  }

  /**
   * Get jukebox status
   * @returns {Object}
   */
  getStatus() {
    return {
      isOpen: this.isOpen,
      totalSongs: this.videos.length,
      currentVideo: this.currentVideoIndex,
      hasVideoModal: !!this.videoModal
    };
  }

  /**
   * Clean up jukebox system
   */
  destroy() {
    this.closeJukebox();
    console.log('🎵 JukeboxSystem destroyed');
  }
}