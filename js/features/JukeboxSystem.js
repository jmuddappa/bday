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
    this.pauseTimer = null; // Timer for auto-resume after pause
    this.isUserPaused = false; // Track if user manually paused
    this.backgroundMusicEnabled = true; // Master control for all bg music auto-play
    
    this.setupElements();
    this.setupEventListeners();
    this.setupGlobalVideoMonitoring();
    
    console.log(`🎵 JukeboxSystem initialized with ${this.videos.length} songs`);
    
    // Auto-start DISABLED - no background music on page load
    console.log('🎵 Background music auto-start DISABLED - user must manually start music');
  }

  setupElements() {
    // Use dedicated jukebox container
    this.jukeboxContainer = document.getElementById('jukeboxContainer');
    this.jukeboxBackdrop = document.getElementById('jukeboxBackdrop');
    this.jukeboxList = document.getElementById('jukeboxList');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.nowPlaying = document.getElementById('nowPlaying');
    this.nowPlayingSong = document.getElementById('nowPlayingSong');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.queueSection = document.getElementById('queueSection');
    this.nextSong = document.getElementById('nextSong');
    
    // Floating widget elements
    this.floatingNowPlaying = document.getElementById('floatingNowPlaying');
    this.floatingNowPlayingSong = document.getElementById('floatingNowPlayingSong');
    this.floatingPlayPauseBtn = document.getElementById('floatingPlayPauseBtn');
    
    // Get existing video modal elements
    this.videoModal = document.getElementById('videoModal');
    this.videoBackdrop = document.getElementById('videoBackdrop');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.videoSenderName = document.getElementById('videoSenderName');
    this.videoProgress = document.getElementById('videoProgress');
    
    if (!this.jukeboxContainer) {
      console.warn('🎵 Jukebox container not found');
    }
    
    
    // Setup volume control
    if (this.volumeSlider) {
      const handleVolumeChange = (e) => {
        this.setVolume(e.target.value / 100);
      };
      
      // Listen for multiple events to ensure mobile compatibility
      this.volumeSlider.addEventListener('input', handleVolumeChange);
      this.volumeSlider.addEventListener('change', handleVolumeChange);
      this.volumeSlider.addEventListener('touchend', handleVolumeChange);
      this.volumeSlider.addEventListener('mouseup', handleVolumeChange);
    }
    
    // Setup play/pause button
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }
    
    // Setup floating play/pause button
    if (this.floatingPlayPauseBtn) {
      this.floatingPlayPauseBtn.addEventListener('click', () => {
        this.togglePlayPause();
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
        
        // Background music stays muted - jukebox system manages all audio
        
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
      
      // Handle video modal close when jukebox was NOT open - show floating widget
      if (e.target.classList.contains('close-btn') && 
          e.target.closest('.video-modal') && !this.wasJukeboxOpen) {
        // If a song is currently selected, show floating widget
        if (this.currentVideoIndex >= 0) {
          setTimeout(() => {
            this.showFloatingWidget();
          }, 100);
        }
      }
    });

    // Add backdrop click to close functionality
    if (this.jukeboxBackdrop) {
      this.jukeboxBackdrop.addEventListener('click', (e) => {
        if (e.target === this.jukeboxBackdrop && this.isOpen) {
          this.closeJukebox();
          console.log('🎵 Jukebox backdrop clicked - closing jukebox');
        }
      });
    }

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
        
        // Background music stays muted - jukebox system manages all audio
        
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
   * Setup global video monitoring to mute background music during any video playback
   */
  setupGlobalVideoMonitoring() {
    if (!this.videoPlayer) return;
    
    // Monitor when ANY video starts playing (including mailbox videos, direct videos, etc.)
    this.videoPlayer.addEventListener('play', () => {
      console.log('🎵 Video started playing - muting background music');
      this.isUserPaused = false; // Reset user pause flag when video starts
      this.muteBackgroundMusic();
    });
    
    // Monitor when ANY video pauses
    this.videoPlayer.addEventListener('pause', () => {
      if (this.isUserPaused) {
        console.log('🎵 Video paused by user - respecting pause state');
        this.clearPauseTimer();
      } else {
        console.log('🎵 Video paused automatically - checking if video is still active');
        // On mobile, don't auto-resume if video modal is still open and video hasn't ended
        if (this.videoModal && this.videoModal.style.display === 'flex') {
          console.log('🎵 Video modal still open - keeping background music muted');
          this.clearPauseTimer();
        }
      }
    });
    
    // Monitor when ANY video ends
    this.videoPlayer.addEventListener('ended', () => {
      console.log('🎵 Video ended - NOT auto-resuming music (prevents mobile issues)');
      this.isUserPaused = false; // Reset user pause flag when video ends naturally
      this.clearPauseTimer(); // Clear any pause timer
      // Don't auto-resume music - let user manually control or wait for silence detection
    });
  }

  /**
   * Mute background music for any video playback
   */
  muteBackgroundMusic() {
    const bgMusic = this.audioManager.getAudio('bgMusic');
    if (bgMusic && !bgMusic.paused) {
      bgMusic.volume = 0;
      console.log('🎵 Background music muted for video playback');
    }
  }

  /**
   * Check if video modal is currently active (to prevent background music during video viewing)
   */
  isVideoModalActive() {
    return this.videoModal && this.videoModal.style.display === 'flex';
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
    
    // Hide floating widget when opening jukebox
    this.hideFloatingWidget();
    
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
    
    // Show floating widget if a song is playing and video modal is not open
    if (this.currentVideoIndex >= 0 && !this.videoModal?.style.display?.includes('flex')) {
      setTimeout(() => {
        this.showFloatingWidget();
      }, 350); // Show after jukebox closes
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
      
      // Hover sound effect
      songItem.addEventListener('mouseenter', () => {
        if (this.audioManager) {
          this.audioManager.play('hoverClickSound', { volume: 0.2 });
        }
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
    
    // Handle background music specially - don't show video modal, just play audio
    if (video.isBgMusic) {
      this.playBackgroundMusicTrack(video);
      return;
    }
    
    // Update Now Playing UI
    if (this.nowPlayingSong) {
      this.nowPlayingSong.textContent = video.title;
    }
    if (this.nowPlaying) {
      this.nowPlaying.classList.add('visible');
    }
    if (this.playPauseBtn) {
      this.playPauseBtn.style.display = 'flex';
      this.updatePlayPauseButton(false); // Video will be playing
    }
    
    // Update floating widget content (but don't show it yet since jukebox will close)
    if (this.floatingNowPlayingSong) {
      this.floatingNowPlayingSong.textContent = video.title;
    }
    
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
      
      // Setup video end handler - don't auto-resume music
      this.videoPlayer.onended = () => {
        this.clearPauseTimer(); // Clear any pause timer since video ended
        console.log('🎵 Jukebox video ended - NOT auto-resuming music (prevents issues)');
        
        // Don't auto-resume music - let user manually control
      };
      
      // Auto-play when ready with a small delay to avoid conflicts
      this.videoPlayer.addEventListener('loadeddata', () => {
        setTimeout(() => {
          this.videoPlayer.play().catch(e => {
            console.log('🎵 Video autoplay failed:', e);
          });
        }, 100); // 100ms delay
      }, { once: true });
      
      // Add play/pause event listeners to keep button in sync
      this.videoPlayer.addEventListener('play', () => {
        this.clearPauseTimer(); // Clear pause timer when playing
        this.updatePlayPauseButton(false);
      });
      
      this.videoPlayer.addEventListener('pause', () => {
        this.startPauseTimer(); // Start pause timer when paused
        this.updatePlayPauseButton(true);
      });
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

  /**
   * Set volume for background music only
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    // Only set background music volume - videos should keep their own volume
    const bgMusic = this.audioManager.getAudio('bgMusic');
    if (bgMusic) {
      bgMusic.volume = volume;
      console.log(`🎵 Background music volume set to: ${Math.round(volume * 100)}%`);
    }
    
    console.log(`🎵 Jukebox volume control set to: ${Math.round(volume * 100)}%`);
  }

  /**
   * Toggle play/pause for the currently playing video or background music
   */
  togglePlayPause() {
    if (this.currentVideoIndex >= 0) {
      const currentTrack = this.videos[this.currentVideoIndex];
      
      // Handle background music tracks differently
      if (currentTrack && currentTrack.isBgMusic) {
        const bgMusic = this.audioManager.getAudio('bgMusic');
        if (bgMusic) {
          if (bgMusic.paused) {
            this.isUserPaused = false; // User is resuming
            this.clearPauseTimer(); // Clear any existing pause timer
            bgMusic.play().catch(e => {
              console.log('🎵 Failed to resume background music:', e);
            });
            this.updatePlayPauseButton(false); // false = playing
          } else {
            this.isUserPaused = true; // User is pausing
            bgMusic.pause();
            this.updatePlayPauseButton(true); // true = paused
            // Don't auto-resume when user manually pauses - respect their choice
            this.clearPauseTimer();
          }
        }
        return;
      }
    }
    
    // Handle regular video tracks
    if (!this.videoPlayer) return;
    
    if (this.videoPlayer.paused) {
      this.isUserPaused = false; // User is resuming
      this.clearPauseTimer(); // Clear any existing pause timer
      this.videoPlayer.play().catch(e => {
        console.log('🎵 Failed to resume video:', e);
      });
      this.updatePlayPauseButton(false); // false = playing
    } else {
      this.isUserPaused = true; // User is pausing
      this.videoPlayer.pause();
      this.updatePlayPauseButton(true); // true = paused
      // Don't auto-resume when user manually pauses - respect their choice
      this.clearPauseTimer();
    }
  }

  /**
   * Update the play/pause button appearance
   * @param {boolean} isPaused - Whether the video is paused
   */
  updatePlayPauseButton(isPaused) {
    // Update main jukebox play/pause button
    if (this.playPauseBtn) {
      this.playPauseBtn.classList.remove('paused', 'playing');
      if (isPaused) {
        this.playPauseBtn.classList.add('paused');
        this.playPauseBtn.title = 'Play';
      } else {
        this.playPauseBtn.classList.add('playing');
        this.playPauseBtn.title = 'Pause';
      }
      this.playPauseBtn.textContent = '';
    }
    
    // Update floating play/pause button
    if (this.floatingPlayPauseBtn) {
      this.floatingPlayPauseBtn.classList.remove('paused', 'playing');
      if (isPaused) {
        this.floatingPlayPauseBtn.classList.add('paused');
        this.floatingPlayPauseBtn.title = 'Play';
      } else {
        this.floatingPlayPauseBtn.classList.add('playing');
        this.floatingPlayPauseBtn.title = 'Pause';
      }
      this.floatingPlayPauseBtn.textContent = '';
    }
  }

  /**
   * Play background music track through the audio manager
   * @param {Object} video - Video/audio data
   */
  playBackgroundMusicTrack(video) {
    console.log(`🎵 Playing background music track: ${video.title}`);
    
    // Update Now Playing UI (don't show video modal)
    if (this.nowPlayingSong) {
      this.nowPlayingSong.textContent = video.title;
    }
    if (this.nowPlaying) {
      this.nowPlaying.classList.add('visible');
    }
    if (this.playPauseBtn) {
      this.playPauseBtn.style.display = 'flex';
      this.updatePlayPauseButton(false); // Will be playing
    }
    
    // Update floating widget content
    if (this.floatingNowPlayingSong) {
      this.floatingNowPlayingSong.textContent = video.title;
    }
    
    // Play through the existing background music audio element
    const bgMusic = this.audioManager.getAudio('bgMusic');
    if (bgMusic) {
      bgMusic.volume = this.audioManager.originalBgVolume;
      
      // Try to play immediately, and set up retry mechanism for autoplay restrictions
      const attemptPlay = () => {
        bgMusic.play().then(() => {
          console.log(`🎵 Background music started playing: ${video.title}`);
          // Set up play/pause event listeners to keep button in sync
          bgMusic.addEventListener('play', () => {
            this.clearPauseTimer(); // Clear pause timer when playing
            this.updatePlayPauseButton(false);
          });
          
          bgMusic.addEventListener('pause', () => {
            this.startPauseTimer(); // Start pause timer when paused
            this.updatePlayPauseButton(true);
          });
        }).catch(e => {
          console.log('🎵 Autoplay blocked, will play on first user interaction:', e);
          // Set up listeners to play on first user interaction
          this.setupAutoplayFallback(bgMusic, video);
        });
      };
      
      // Try immediately
      attemptPlay();
    }
    
    // If jukebox is open, close it and show floating widget
    if (this.isOpen) {
      this.closeJukebox();
    } else {
      // If jukebox is already closed, show floating widget immediately
      setTimeout(() => {
        this.showFloatingWidget();
      }, 100);
    }
  }

  /**
   * Set up fallback for autoplay restrictions
   * @param {HTMLAudioElement} bgMusic - Background music audio element
   * @param {Object} video - Video/audio data
   */
  setupAutoplayFallback(bgMusic, video) {
    const playOnInteraction = () => {
      bgMusic.play().then(() => {
        console.log(`🎵 Background music started on user interaction: ${video.title}`);
        // Set up play/pause event listeners to keep button in sync
        bgMusic.addEventListener('play', () => {
          this.clearPauseTimer(); // Clear pause timer when playing
          this.updatePlayPauseButton(false);
        });
        
        bgMusic.addEventListener('pause', () => {
          this.startPauseTimer(); // Start pause timer when paused
          this.updatePlayPauseButton(true);
        });
        
        // Remove listeners after successful play
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('keydown', playOnInteraction);
        document.removeEventListener('touchstart', playOnInteraction);
      }).catch(e => {
        console.error('🎵 Failed to play background music on interaction:', e);
      });
    };
    
    // Listen for any user interaction to start playback
    document.addEventListener('click', playOnInteraction, { once: true });
    document.addEventListener('keydown', playOnInteraction, { once: true });
    document.addEventListener('touchstart', playOnInteraction, { once: true });
  }

  /**
   * Automatically start playing background music from jukebox
   */
  autoStartBackgroundMusic() {
    // Check if background music auto-play is disabled
    if (!this.backgroundMusicEnabled) {
      console.log(`🎵 Background music auto-start DISABLED - not starting`);
      return;
    }
    
    // Find the background music track (last in list)
    const bgMusicIndex = this.videos.findIndex(video => video.isBgMusic);
    if (bgMusicIndex >= 0) {
      console.log(`🎵 Auto-starting background music from jukebox: ${this.videos[bgMusicIndex].title}`);
      this.playVideo(bgMusicIndex);
    } else {
      console.warn(`🎵 Background music track not found in jukebox`);
    }
  }
  
  /**
   * Auto-play background music when songs end (keeps music playing continuously)
   */
  autoPlayBackgroundMusic() {
    // Check if background music auto-play is disabled
    if (!this.backgroundMusicEnabled) {
      console.log(`🎵 Background music auto-play DISABLED - not resuming`);
      return;
    }
    
    // Don't auto-play if video modal is still active (prevents mobile resume issues)
    if (this.isVideoModalActive()) {
      console.log(`🎵 Video modal still active - not auto-playing background music`);
      return;
    }
    
    // Find the background music track
    const bgMusicIndex = this.videos.findIndex(video => video.isBgMusic);
    if (bgMusicIndex >= 0) {
      console.log(`🎵 Auto-playing background music to maintain continuous audio: ${this.videos[bgMusicIndex].title}`);
      
      // Set the current track and play background music directly
      this.currentVideoIndex = bgMusicIndex;
      this.playBackgroundMusicTrack(this.videos[bgMusicIndex]);
      
      // Force update the floating widget to show the new song
      if (this.floatingNowPlaying && this.floatingNowPlaying.style.display !== 'none') {
        this.showFloatingWidget(); // Refresh the floating widget content
      }
    } else {
      console.warn(`🎵 Background music track not found for auto-play`);
    }
  }

  /**
   * Show the floating now playing widget
   */
  showFloatingWidget() {
    if (this.floatingNowPlaying && this.currentVideoIndex >= 0) {
      const video = this.videos[this.currentVideoIndex];
      if (this.floatingNowPlayingSong && video) {
        this.floatingNowPlayingSong.textContent = video.title;
      }
      this.floatingNowPlaying.style.display = 'block';
      // Trigger animation
      setTimeout(() => {
        this.floatingNowPlaying.classList.add('visible');
      }, 10);
    }
  }

  /**
   * Hide the floating now playing widget
   */
  hideFloatingWidget() {
    if (this.floatingNowPlaying) {
      this.floatingNowPlaying.classList.remove('visible');
      setTimeout(() => {
        this.floatingNowPlaying.style.display = 'none';
      }, 300); // Match CSS transition duration
    }
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
   * Start pause timer for auto-resume after 10 seconds - DISABLED
   */
  startPauseTimer() {
    // DISABLED - no more auto-resume timers
    console.log('🎵 Pause timer DISABLED - no auto-resume');
    return;
  }
  
  /**
   * Clear the pause timer
   */
  clearPauseTimer() {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
      console.log('🎵 Pause timer cleared');
    }
  }
  
  /**
   * Auto-resume background music through jukebox system
   */
  autoResumeBackgroundMusic() {
    // Check if background music auto-play is disabled
    if (!this.backgroundMusicEnabled) {
      console.log(`🎵 Background music auto-resume DISABLED - not resuming`);
      return;
    }
    
    // Find the background music track
    const bgMusicIndex = this.videos.findIndex(video => video.isBgMusic);
    if (bgMusicIndex >= 0) {
      console.log(`🎵 Auto-resuming background music: ${this.videos[bgMusicIndex].title}`);
      // Set current video index and play the background music
      this.currentVideoIndex = bgMusicIndex;
      this.playBackgroundMusicTrack(this.videos[bgMusicIndex]);
    } else {
      console.warn('🎵 Background music track not found for auto-resume');
    }
  }

  /**
   * Disable all background music auto-play/resume functionality
   */
  disableBackgroundMusicAutoPlay() {
    this.backgroundMusicEnabled = false;
    this.clearPauseTimer(); // Clear any active timers
    console.log('🎵 Background music auto-play/resume DISABLED');
  }

  /**
   * Enable background music auto-play/resume functionality
   */
  enableBackgroundMusicAutoPlay() {
    this.backgroundMusicEnabled = true;
    console.log('🎵 Background music auto-play/resume ENABLED');
  }

  /**
   * Check if background music auto-play is enabled
   * @returns {boolean}
   */
  isBackgroundMusicAutoPlayEnabled() {
    return this.backgroundMusicEnabled;
  }

  /**
   * Clean up jukebox system
   */
  destroy() {
    this.clearPauseTimer(); // Clear any active timer
    this.closeJukebox();
    console.log('🎵 JukeboxSystem destroyed');
  }
}