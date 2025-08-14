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
    this.videoSenderName = null;
    this.videoProgress = null;
    this.isOpen = false;
    this.currentVideoIndex = 0;
    this.videos = JUKEBOX_DATA;
    this.wasJukeboxOpen = false;
    this.isTransitioning = false;
    
    this.setupElements();
    this.setupEventListeners();
    
    console.log(`🎵 JukeboxSystem initialized with ${this.videos.length} songs`);
  }

  setupElements() {
    // Use dedicated jukebox container
    this.jukeboxContainer = document.getElementById('jukeboxContainer');
    this.jukeboxBackdrop = document.getElementById('jukeboxBackdrop');
    this.jukeboxList = document.getElementById('jukeboxList');
    this.jukeboxSearch = document.getElementById('jukeboxSearch');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.nowPlaying = document.getElementById('nowPlaying');
    this.nowPlayingSong = document.getElementById('nowPlayingSong');
    this.queueSection = document.getElementById('queueSection');
    this.nextSong = document.getElementById('nextSong');
    
    // Get existing video modal elements
    this.videoModal = document.getElementById('videoModal');
    this.videoBackdrop = document.getElementById('videoBackdrop');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.videoSenderName = document.getElementById('videoSenderName');
    this.videoProgress = document.getElementById('videoProgress');
    
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
        e.preventDefault();
        e.stopPropagation();
        console.log('🎵 Jukebox handling video close - returning to jukebox');
        
        // Restore background music
        const bgMusic = this.audioManager.getAudio('bgMusic');
        if (bgMusic) {
          bgMusic.volume = 0.6;
        }
        
        // Hide video backdrop
        if (this.videoBackdrop) {
          this.videoBackdrop.classList.remove('visible');
          setTimeout(() => {
            this.videoBackdrop.style.display = 'none';
          }, 300);
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
        e.preventDefault();
        e.stopPropagation();
        console.log('🎵 Jukebox handling ESC - returning to jukebox');
        
        // Restore background music
        const bgMusic = this.audioManager.getAudio('bgMusic');
        if (bgMusic) {
          bgMusic.volume = 0.6;
        }
        
        // Hide video backdrop
        if (this.videoBackdrop) {
          this.videoBackdrop.classList.remove('visible');
          setTimeout(() => {
            this.videoBackdrop.style.display = 'none';
          }, 300);
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
    
    // Show backdrop first
    if (this.jukeboxBackdrop) {
      this.jukeboxBackdrop.style.display = 'block';
      this.jukeboxBackdrop.offsetHeight; // Force repaint
      this.jukeboxBackdrop.classList.add('visible');
    }
    
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
    
    // Hide backdrop
    if (this.jukeboxBackdrop) {
      this.jukeboxBackdrop.classList.remove('visible');
      setTimeout(() => {
        this.jukeboxBackdrop.style.display = 'none';
      }, 300); // Match CSS transition duration
    }
    
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
    if (this.videoPlayer && this.videoSenderName && this.videoModal) {
      // Stop any existing video playback first
      this.videoPlayer.pause();
      this.videoPlayer.currentTime = 0;
      
      // Pause background music during video playback
      const bgMusic = this.audioManager.getAudio('bgMusic');
      if (bgMusic) {
        bgMusic.volume = 0;
      }
      
      this.videoSenderName.textContent = video.title;
      this.videoProgress.textContent = `Song ${index + 1} of ${this.videos.length}`;
      this.videoPlayer.src = video.src;
      
      // Clean up any existing animation classes
      this.videoPlayer.classList.remove('video-slide-left', 'video-slide-right', 'video-slide-in-left', 'video-slide-in-right', 'video-transitioning');
      
      this.videoPlayer.load();
      
      // Show navigation arrows for jukebox videos to allow navigation between songs
      const leftArrow = document.getElementById('videoNavLeft');
      const rightArrow = document.getElementById('videoNavRight');
      if (leftArrow) {
        leftArrow.classList.remove('hidden');
        leftArrow.style.display = 'flex';  // Show the arrow
      }
      if (rightArrow) {
        rightArrow.classList.remove('hidden');
        rightArrow.style.display = 'flex';  // Show the arrow
      }

      // Setup navigation event listeners
      this.setupJukeboxNavigation();
      
      // Show video backdrop first
      if (this.videoBackdrop) {
        this.videoBackdrop.style.display = 'block';
        this.videoBackdrop.offsetHeight; // Force repaint
        this.videoBackdrop.classList.add('visible');
      }
      
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
   * Setup navigation for jukebox video modal
   */
  setupJukeboxNavigation() {
    const leftArrow = document.getElementById('videoNavLeft');
    const rightArrow = document.getElementById('videoNavRight');
    
    // Remove any existing event listeners
    const newLeftArrow = leftArrow.cloneNode(true);
    const newRightArrow = rightArrow.cloneNode(true);
    leftArrow.parentNode.replaceChild(newLeftArrow, leftArrow);
    rightArrow.parentNode.replaceChild(newRightArrow, rightArrow);
    
    // Add new event listeners for jukebox navigation
    newLeftArrow.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.navigateToPrevious();
    });
    
    newRightArrow.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.navigateToNext();
    });
  }

  /**
   * Navigate to previous video in jukebox
   */
  navigateToPrevious() {
    if (this.isTransitioning) return;
    
    const prevIndex = this.currentVideoIndex - 1;
    const targetIndex = prevIndex < 0 ? this.videos.length - 1 : prevIndex;
    console.log(`🎵 Navigating to previous: ${targetIndex}`);
    this.navigateWithTransition(targetIndex, -1);
  }

  /**
   * Navigate to next video in jukebox
   */
  navigateToNext() {
    if (this.isTransitioning) return;
    
    const nextIndex = this.currentVideoIndex + 1;
    const targetIndex = nextIndex >= this.videos.length ? 0 : nextIndex;
    console.log(`🎵 Navigating to next: ${targetIndex}`);
    this.navigateWithTransition(targetIndex, 1);
  }

  /**
   * Navigate with smooth transition animation
   * @param {number} targetIndex - Index to navigate to
   * @param {number} direction - Direction (-1 for previous, 1 for next)
   */
  navigateWithTransition(targetIndex, direction) {
    this.isTransitioning = true;
    
    // Start slide out animation
    const slideOutClass = direction > 0 ? 'video-slide-right' : 'video-slide-left';
    const slideInClass = direction > 0 ? 'video-slide-in-left' : 'video-slide-in-right';
    
    if (this.videoPlayer) {
      // Add slide out animation
      this.videoPlayer.classList.add(slideOutClass);
      
      // After slide out completes, change video and slide in
      setTimeout(() => {
        // Clean up old animation
        this.videoPlayer.classList.remove(slideOutClass);
        
        // Load new video
        this.loadVideoWithTransition(targetIndex, slideInClass);
      }, 300); // Match CSS animation duration
    }
  }

  /**
   * Load video with slide-in transition
   * @param {number} targetIndex - Index of video to load
   * @param {string} slideInClass - CSS class for slide-in animation
   */
  loadVideoWithTransition(targetIndex, slideInClass) {
    const video = this.videos[targetIndex];
    this.currentVideoIndex = targetIndex;

    // Update header information
    this.videoSenderName.textContent = video.title;
    this.videoProgress.textContent = `Song ${targetIndex + 1} of ${this.videos.length}`;
    this.videoPlayer.src = video.src;

    // Add slide in animation
    this.videoPlayer.classList.add(slideInClass);

    // Play video when loaded
    const onLoadedData = () => {
      this.videoPlayer.play().catch(e => {
        console.log('🎵 Video autoplay failed:', e);
      });
      
      // Clean up animation and reset transition flag after animation completes
      setTimeout(() => {
        this.videoPlayer.classList.remove(slideInClass);
        this.isTransitioning = false;
      }, 300);
      
      this.videoPlayer.removeEventListener('loadeddata', onLoadedData);
    };

    this.videoPlayer.addEventListener('loadeddata', onLoadedData);
    this.videoPlayer.load();
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