/**
 * Jukebox System
 * Handles jukebox modal interface and song selection
 */

import { JUKEBOX_DATA } from '../config/jukeboxData.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class JukeboxSystem {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.mailContainer = null;
    this.mailList = null;
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
    // Reuse existing mail modal elements
    this.mailContainer = document.getElementById('mailContainer');
    this.mailList = document.getElementById('mailList');
    
    // Get existing video modal elements
    this.videoModal = document.getElementById('videoModal');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.videoTitle = document.getElementById('videoTitle');
    
    if (!this.mailContainer) {
      console.warn('🎵 Mail container not found for jukebox');
    }
  }

  setupEventListeners() {
    // Close button functionality for mail container when used as jukebox
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-btn') && 
          e.target.closest('.mail-container') && this.isOpen) {
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
    if (!this.mailContainer) {
      console.error('🎵 Mail container not found');
      return;
    }

    console.log('🎵 Opening jukebox');
    this.isOpen = true;
    
    // Change mail header to jukebox header
    const mailHeader = this.mailContainer.querySelector('.mail-header span:first-child');
    if (mailHeader) {
      mailHeader.textContent = '🎵 Jukebox 🎵';
    }
    
    this.mailContainer.style.display = 'block';
    this.populateJukeboxList();
    
    // Request audio permission if needed
    this.audioManager.tryStartAudio();
  }

  /**
   * Close the jukebox modal
   */
  closeJukebox() {
    if (!this.mailContainer) return;
    
    console.log('🎵 Closing jukebox');
    this.isOpen = false;
    
    // Restore original mail header
    const mailHeader = this.mailContainer.querySelector('.mail-header span:first-child');
    if (mailHeader) {
      mailHeader.textContent = '🎂 Birthday Mailbox 🎂';
    }
    
    this.mailContainer.style.display = 'none';
  }

  /**
   * Populate the jukebox song list (reusing mail list)
   */
  populateJukeboxList() {
    if (!this.mailList) return;
    
    this.mailList.innerHTML = '';
    
    this.videos.forEach((song, index) => {
      const songItem = document.createElement('div');
      songItem.className = 'mail-item'; // Reuse mail-item class for styling
      songItem.innerHTML = `
        <div class="mail-icon">${song.icon}</div>
        <div class="mail-sender">${song.title}</div>
      `;
      
      // Add click handler
      songItem.addEventListener('click', () => {
        this.playVideo(index);
      });
      
      this.mailList.appendChild(songItem);
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