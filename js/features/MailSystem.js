/**
 * Mail System Feature
 * Handles the mailbox UI, video playback, and message tracking
 */

import { MAIL_DATA } from '../config/mailData.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class MailSystem {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.viewedMessages = new Set();
    this.currentVideoIndex = -1; // Track current video for navigation
    this.isTransitioning = false; // Prevent double navigation
    this.wasMailOpen = false; // Track if mail was open when video started
    
    // DOM elements
    this.mailContainer = document.getElementById('mailContainer');
    this.mailBackdrop = document.getElementById('mailBackdrop');
    this.mailList = document.getElementById('mailList');
    this.videoModal = document.getElementById('videoModal');
    this.videoBackdrop = document.getElementById('videoBackdrop');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.videoSenderName = document.getElementById('videoSenderName');
    this.videoProgress = document.getElementById('videoProgress');
    this.videoWrapper = document.getElementById('videoWrapper');
    this.videoNavLeft = document.getElementById('videoNavLeft');
    this.videoNavRight = document.getElementById('videoNavRight');
    
    this.setupEventListeners();
  }

  /**
   * Set up DOM event listeners
   */
  setupEventListeners() {
    try {
      // Close mailbox
      const closeBtn = this.mailContainer?.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeMailbox());
      }

      // Close video modal (only handle if not opened by jukebox)
      const videoCloseBtn = this.videoModal?.querySelector('.close-btn');
      if (videoCloseBtn) {
        videoCloseBtn.addEventListener('click', (e) => {
          // Check if jukebox opened this video - if so, let jukebox handle it
          const jukebox = window.game?.jukeboxSystem;
          if (jukebox && jukebox.wasJukeboxOpen) {
            console.log('🎬 Jukebox video close - letting jukebox handle it');
            return; // Let jukebox system handle the close
          }
          
          e.preventDefault();
          e.stopPropagation();
          console.log('🎬 Mail video close button clicked');
          this.closeVideo();
        });
      }


      // Click handlers for navigation arrows
      if (this.videoNavLeft) {
        this.videoNavLeft.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🎬 Left arrow clicked, hidden?', this.videoNavLeft.classList.contains('hidden'));
          // Only navigate if arrows are not hidden (mail system videos)
          if (!this.videoNavLeft.classList.contains('hidden')) {
            this.navigateVideo(-1);
          }
        });
      }

      if (this.videoNavRight) {
        this.videoNavRight.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🎬 Right arrow clicked, hidden?', this.videoNavRight.classList.contains('hidden'));
          // Only navigate if arrows are not hidden (mail system videos)
          if (!this.videoNavRight.classList.contains('hidden')) {
            this.navigateVideo(1);
          }
        });
      }

      // Enhanced keyboard navigation
      document.addEventListener('keydown', (e) => {
        // Only handle keyboard shortcuts when video modal is open
        if (this.videoModal && this.videoModal.style.display === 'flex') {
          switch(e.key) {
            case 'Escape':
              e.preventDefault();
              // Check if jukebox opened this video - if so, let jukebox handle it
              const jukebox = window.game?.jukeboxSystem;
              if (jukebox && jukebox.wasJukeboxOpen) {
                console.log('🎬 Jukebox video ESC - letting jukebox handle it');
                return; // Let jukebox system handle the ESC
              }
              // Only close if this is a mail system video
              if (this.currentVideoIndex >= 0) {
                this.closeVideo();
              }
              return;
            case 'ArrowLeft':
              e.preventDefault();
              // Only navigate if arrows are visible (mail system videos)
              if (this.videoNavLeft && !this.videoNavLeft.classList.contains('hidden')) {
                this.navigateVideo(-1);
              }
              return;
            case 'ArrowRight':
              e.preventDefault();
              // Only navigate if arrows are visible (mail system videos)
              if (this.videoNavRight && !this.videoNavRight.classList.contains('hidden')) {
                this.navigateVideo(1);
              }
              return;
            case ' ':
              e.preventDefault();
              this.toggleVideoPlayback();
              return;
          }
        }
        // Handle escape key for mailbox when video is not open
        else if (e.key === 'Escape' && this.mailContainer && this.mailContainer.style.display === 'block') {
          e.preventDefault();
          this.closeMailbox();
          return;
        }
      });

    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.setupEventListeners');
    }
  }

  /**
   * Open the mailbox interface
   */
  openMailbox() {
    try {
      if (this.mailContainer) {
        // Show backdrop first
        if (this.mailBackdrop) {
          this.mailBackdrop.style.display = 'block';
          this.mailBackdrop.offsetHeight; // Force repaint
          this.mailBackdrop.classList.add('visible');
        }
        
        // Initialize mail list first to prevent size flicker
        this.initializeMailList();
        
        // Use requestAnimationFrame to ensure DOM is ready before showing
        requestAnimationFrame(() => {
          this.mailContainer.style.display = 'block';
        });
        
        this.audioManager.play('mailSound', { volume: 0.5 });
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.openMailbox');
    }
  }

  /**
   * Close the mailbox interface
   */
  closeMailbox() {
    try {
      if (this.mailContainer) {
        // Hide backdrop
        if (this.mailBackdrop) {
          this.mailBackdrop.classList.remove('visible');
          setTimeout(() => {
            this.mailBackdrop.style.display = 'none';
          }, 300); // Match CSS transition duration
        }
        
        this.mailContainer.style.display = 'none';
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.closeMailbox');
    }
  }

  /**
   * Initialize the mail list display
   */
  initializeMailList() {
    if (!this.mailList) return;

    try {
      this.mailList.innerHTML = '';
      
      MAIL_DATA.forEach((mail, index) => {
        const mailItem = this.createMailItem(mail, index);
        if (mailItem) {
          this.mailList.appendChild(mailItem);
        }
      });
      
      // Add spacer element at the end to ensure last items are fully visible
      const spacerElement = document.createElement('div');
      spacerElement.className = 'mail-list-spacer';
      spacerElement.style.height = '200px'; // Increased height to ensure #30 is visible
      spacerElement.style.flexShrink = '0';
      this.mailList.appendChild(spacerElement);
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.initializeMailList');
    }
  }

  /**
   * Create a mail item element
   * @param {Object} mail - Mail data object
   * @param {number} index - Mail index
   * @returns {HTMLElement|null} Mail item element
   */
  createMailItem(mail, index) {
    try {
      const mailItem = document.createElement('div');
      mailItem.className = 'mail-item';
      mailItem.setAttribute('data-index', index);
      mailItem.setAttribute('tabindex', '0'); // Accessibility
      
      const isNew = !this.viewedMessages.has(index);
      
      mailItem.innerHTML = `
        <span class="mail-icon">${mail.icon}</span>
        <span class="mail-sender">${this.escapeHtml(mail.sender)}</span>
        ${isNew ? '<span class="new-badge">NEW!</span>' : ''}
      `;
      
      // Event listeners
      mailItem.addEventListener('click', () => this.playVideo(index));
      mailItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.playVideo(index);
        }
      });
      
      // Hover sound effect
      mailItem.addEventListener('mouseenter', () => {
        if (this.audioManager) {
          this.audioManager.play('hoverClickSound', { volume: 0.2 });
        }
      });
      
      return mailItem;
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.createMailItem');
      return null;
    }
  }

  /**
   * Play a video message
   * @param {number} index - Video index
   */
  playVideo(index) {
    try {
      console.log('🎬 playVideo called with index:', index, 'MAIL_DATA.length:', MAIL_DATA.length, 'isTransitioning:', this.isTransitioning);
      
      if (index < 0 || index >= MAIL_DATA.length) {
        console.log('🎬 playVideo blocked - invalid index');
        return;
      }

      const mail = MAIL_DATA[index];
      const isNewVideo = this.currentVideoIndex !== index;
      
      this.currentVideoIndex = index;
      this.viewedMessages.add(index);

      if (!this.videoPlayer || !this.videoModal || !this.videoSenderName || !this.videoProgress) {
        throw new Error('Video elements not found');
      }


      // Update header information
      this.videoSenderName.textContent = `Message from ${mail.sender}`;
      this.videoProgress.textContent = `${index + 1} of ${MAIL_DATA.length}`;

      // Set video properties
      this.videoPlayer.style.transform = mail.flipped ? 'rotate(180deg)' : '';
      this.videoPlayer.src = mail.src;
      
      // Clean up any existing animation classes
      this.videoPlayer.classList.remove('video-slide-left', 'video-slide-right', 'video-slide-in-left', 'video-slide-in-right', 'video-transitioning');

      // Remember if mail was open and close it before showing video
      this.wasMailOpen = this.mailContainer && this.mailContainer.style.display === 'block';
      if (this.wasMailOpen) {
        this.closeMailbox();
      }

      // Show modal if not already open
      if (this.videoModal.style.display !== 'flex') {
        // Show video backdrop first
        if (this.videoBackdrop) {
          this.videoBackdrop.style.display = 'block';
          this.videoBackdrop.offsetHeight; // Force repaint
          this.videoBackdrop.classList.add('visible');
        }
        
        this.videoModal.style.display = 'flex';
        // Auto-focus video for keyboard controls
        setTimeout(() => {
          this.videoPlayer.focus();
        }, 100);
      }
      
      // Background music managed by jukebox system
      
      // Play video directly
      const playPromise = this.videoPlayer.play();
      if (playPromise) {
        playPromise
          .then(() => {
            console.log(`🎬 Playing video from ${mail.sender} (${index + 1}/${MAIL_DATA.length})`);
          })
          .catch(e => {
            ErrorHandler.handleError(e, 'MailSystem.playVideo');
          });
      }

      // Setup video end handler
      this.videoPlayer.onended = () => {
        console.log(`📧 Mail video ended: ${mail.sender}`);
        // Background music restoration handled by jukebox system
      };

      // Update mail list to remove NEW badge
      this.updateMailItem(index);
      
      // Update navigation arrow visibility
      this.updateNavigationArrows();
      
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.playVideo');
    }
  }

  /**
   * Update a mail item's display (remove NEW badge)
   * @param {number} index - Mail item index
   */
  updateMailItem(index) {
    try {
      const mailItem = this.mailList?.querySelector(`[data-index="${index}"]`);
      if (mailItem) {
        const newBadge = mailItem.querySelector('.new-badge');
        if (newBadge) {
          newBadge.remove();
        }
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.updateMailItem');
    }
  }

  /**
   * Close the video modal with cleanup
   */
  closeVideo() {
    try {
      console.log('🎬 MailSystem closeVideo called');
      if (this.videoModal && this.videoPlayer) {
        // Hide video backdrop
        if (this.videoBackdrop) {
          this.videoBackdrop.classList.remove('visible');
          setTimeout(() => {
            this.videoBackdrop.style.display = 'none';
          }, 300); // Match CSS transition duration
        }
        
        this.videoModal.style.display = 'none';
        this.videoPlayer.pause();
        this.videoPlayer.src = '';
        
        // Clean up transition state
        this.isTransitioning = false;
        
        // Background music restoration handled by jukebox system
        
        // Clean up event handlers
        this.videoPlayer.onended = null;
        
        // Reopen mail if it was open before video
        if (this.wasMailOpen) {
          console.log('🎬 Reopening mail after video close');
          this.openMailbox();
          this.wasMailOpen = false;
        }
        
        console.log('🎬 Video modal closed successfully');
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.closeVideo');
    }
  }

  /**
   * Close all mail system modals
   */
  closeAll() {
    this.closeVideo();
    this.closeMailbox();
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get number of viewed messages
   * @returns {number} Count of viewed messages
   */
  getViewedCount() {
    return this.viewedMessages.size;
  }

  /**
   * Get total number of messages
   * @returns {number} Total message count
   */
  getTotalCount() {
    return MAIL_DATA.length;
  }

  /**
   * Get mail system statistics
   * @returns {Object} Mail system stats
   */
  getStats() {
    return {
      totalMessages: this.getTotalCount(),
      viewedMessages: this.getViewedCount(),
      unviewedMessages: this.getTotalCount() - this.getViewedCount(),
      completionPercentage: Math.round((this.getViewedCount() / this.getTotalCount()) * 100)
    };
  }

  /**
   * Mark all messages as viewed
   */
  markAllAsViewed() {
    MAIL_DATA.forEach((_, index) => {
      this.viewedMessages.add(index);
    });
    this.initializeMailList();
  }

  /**
   * Reset all viewed messages
   */
  resetViewedMessages() {
    this.viewedMessages.clear();
    this.initializeMailList();
  }

  /**
   * Check if a specific message has been viewed
   * @param {number} index - Message index
   * @returns {boolean} True if message has been viewed
   */
  isMessageViewed(index) {
    return this.viewedMessages.has(index);
  }

  /**
   * Get list of unviewed message indices
   * @returns {Array} Array of unviewed message indices
   */
  getUnviewedMessages() {
    const unviewed = [];
    for (let i = 0; i < MAIL_DATA.length; i++) {
      if (!this.viewedMessages.has(i)) {
        unviewed.push(i);
      }
    }
    return unviewed;
  }

  /**
   * Export viewed messages data
   * @returns {Object} Exportable data
   */
  exportData() {
    return {
      viewedMessages: Array.from(this.viewedMessages),
      totalMessages: this.getTotalCount(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import viewed messages data
   * @param {Object} data - Imported data
   */
  importData(data) {
    if (data && Array.isArray(data.viewedMessages)) {
      this.viewedMessages = new Set(data.viewedMessages);
      this.initializeMailList();
    }
  }


  /**
   * Navigate to previous or next video
   * @param {number} direction - Direction to navigate (-1 for previous, 1 for next)
   */
  navigateVideo(direction) {
    try {
      console.log('🎬 navigateVideo called, direction:', direction, 'currentIndex:', this.currentVideoIndex, 'isTransitioning:', this.isTransitioning);
      
      if (this.currentVideoIndex === -1 || this.isTransitioning) {
        console.log('🎬 Navigation blocked - currentIndex:', this.currentVideoIndex, 'isTransitioning:', this.isTransitioning);
        return;
      }
      
      this.isTransitioning = true;
      
      const newIndex = this.currentVideoIndex + direction;
      console.log('🎬 newIndex calculated:', newIndex, 'MAIL_DATA.length:', MAIL_DATA.length);
      
      // Wrap around if at boundaries  
      let targetIndex;
      if (newIndex < 0) {
        targetIndex = MAIL_DATA.length - 1; // Go to last video
      } else if (newIndex >= MAIL_DATA.length) {
        targetIndex = 0; // Go to first video
      } else {
        targetIndex = newIndex;
      }
      
      console.log('🎬 targetIndex:', targetIndex);
      
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
      
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.navigateVideo');
      this.isTransitioning = false;
    }
  }

  /**
   * Load video with slide-in transition
   * @param {number} targetIndex - Index of video to load
   * @param {string} slideInClass - CSS class for slide-in animation
   */
  loadVideoWithTransition(targetIndex, slideInClass) {
    try {
      const mail = MAIL_DATA[targetIndex];
      this.currentVideoIndex = targetIndex;
      this.viewedMessages.add(targetIndex);

      // Update header information
      this.videoSenderName.textContent = `Message from ${mail.sender}`;
      this.videoProgress.textContent = `${targetIndex + 1} of ${MAIL_DATA.length}`;

      // Set video properties
      this.videoPlayer.style.transform = mail.flipped ? 'rotate(180deg)' : '';
      this.videoPlayer.src = mail.src;

      // Add slide in animation
      this.videoPlayer.classList.add(slideInClass);

      // Play video when loaded
      const onLoadedData = () => {
        this.videoPlayer.play().catch(e => {
          console.log('🎬 Video autoplay failed:', e);
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

    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.loadVideoWithTransition');
      this.isTransitioning = false;
    }
  }

  /**
   * Update navigation arrow visibility - Always show for wrap-around navigation
   */
  updateNavigationArrows() {
    try {
      if (!this.videoNavLeft || !this.videoNavRight) return;
      
      const hasMultipleVideos = MAIL_DATA.length > 1;
      
      // Show arrows if we have multiple videos (wrap-around navigation)
      if (hasMultipleVideos) {
        this.videoNavLeft.classList.remove('hidden');
        this.videoNavRight.classList.remove('hidden');
      } else {
        this.videoNavLeft.classList.add('hidden');
        this.videoNavRight.classList.add('hidden');
      }
      
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.updateNavigationArrows');
    }
  }


  /**
   * Toggle video playback (spacebar functionality)
   */
  toggleVideoPlayback() {
    try {
      if (!this.videoPlayer) return;
      
      if (this.videoPlayer.paused) {
        this.videoPlayer.play().catch(e => {
          ErrorHandler.handleError(e, 'MailSystem.toggleVideoPlayback');
        });
      } else {
        this.videoPlayer.pause();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.toggleVideoPlayback');
    }
  }

  /**
   * Clean up mail system resources
   */
  destroy() {
    this.closeAll();
    this.viewedMessages.clear();
  }
}