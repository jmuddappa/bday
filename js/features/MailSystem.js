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
    
    // DOM elements
    this.mailContainer = document.getElementById('mailContainer');
    this.mailList = document.getElementById('mailList');
    this.videoModal = document.getElementById('videoModal');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.videoTitle = document.getElementById('videoTitle');
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

      // Close video modal
      const videoCloseBtn = this.videoModal?.querySelector('.close-btn');
      if (videoCloseBtn) {
        videoCloseBtn.addEventListener('click', () => this.closeVideo());
      }

      // Click outside video to close
      if (this.videoModal) {
        this.videoModal.addEventListener('click', (e) => {
          if (e.target.id === 'videoModal' || e.target.classList.contains('video-modal')) {
            this.closeVideo();
          }
        });

        // Prevent clicks inside video container from closing modal
        const videoContainer = this.videoModal.querySelector('.video-container');
        if (videoContainer) {
          videoContainer.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      }

      // Click handlers for navigation arrows
      if (this.videoNavLeft) {
        this.videoNavLeft.addEventListener('click', () => {
          this.navigateVideo(-1);
        });
      }

      if (this.videoNavRight) {
        this.videoNavRight.addEventListener('click', () => {
          this.navigateVideo(1);
        });
      }

      // Two-step escape key behavior
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          // If video modal is open, close it first (goes back to mail list)
          if (this.videoModal && this.videoModal.style.display === 'flex') {
            e.preventDefault();
            this.closeVideo();
            return;
          }
          // If only mailbox is open, close it completely
          else if (this.mailContainer && this.mailContainer.style.display === 'block') {
            e.preventDefault();
            this.closeMailbox();
            return;
          }
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
        <span class="icon">${mail.icon}</span>
        <span class="sender">${this.escapeHtml(mail.sender)}</span>
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
      if (index < 0 || index >= MAIL_DATA.length) {
        throw new Error(`Invalid mail index: ${index}`);
      }

      const mail = MAIL_DATA[index];
      this.currentVideoIndex = index; // Track current video
      this.viewedMessages.add(index);

      if (!this.videoPlayer || !this.videoModal || !this.videoTitle) {
        throw new Error('Video elements not found');
      }

      // Set video properties
      this.videoTitle.textContent = `Message from ${mail.sender} (${index + 1}/${MAIL_DATA.length})`;
      this.videoPlayer.style.transform = mail.flipped ? 'rotate(180deg)' : '';
      this.videoPlayer.src = mail.src;

      // Show modal and manage audio
      this.videoModal.style.display = 'flex';
      
      if (this.audioManager.musicStarted) {
        this.audioManager.setVolume('bgMusic', 0);
      }
      
      // Play video
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
        if (this.audioManager.musicStarted) {
          this.audioManager.setVolume('bgMusic', 1);
        }
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
   * Close the video modal
   */
  closeVideo() {
    try {
      if (this.videoModal && this.videoPlayer) {
        this.videoModal.style.display = 'none';
        this.videoPlayer.pause();
        this.videoPlayer.src = '';
        
        if (this.audioManager.musicStarted) {
          this.audioManager.setVolume('bgMusic', 1);
        }
        
        // Clean up event handler
        this.videoPlayer.onended = null;
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
      if (this.currentVideoIndex === -1) return;
      
      const newIndex = this.currentVideoIndex + direction;
      
      // Wrap around if at boundaries
      let targetIndex;
      if (newIndex < 0) {
        targetIndex = MAIL_DATA.length - 1; // Go to last video
      } else if (newIndex >= MAIL_DATA.length) {
        targetIndex = 0; // Go to first video
      } else {
        targetIndex = newIndex;
      }
      
      // Play the new video
      this.playVideo(targetIndex);
      
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.navigateVideo');
    }
  }

  /**
   * Update navigation arrow visibility based on current video
   */
  updateNavigationArrows() {
    try {
      if (!this.videoNavLeft || !this.videoNavRight) return;
      
      const isFirstVideo = this.currentVideoIndex === 0;
      const isLastVideo = this.currentVideoIndex === MAIL_DATA.length - 1;
      const hasMultipleVideos = MAIL_DATA.length > 1;
      
      // Show/hide left arrow
      if (isFirstVideo || !hasMultipleVideos) {
        this.videoNavLeft.classList.add('hidden');
      } else {
        this.videoNavLeft.classList.remove('hidden');
      }
      
      // Show/hide right arrow  
      if (isLastVideo || !hasMultipleVideos) {
        this.videoNavRight.classList.add('hidden');
      } else {
        this.videoNavRight.classList.remove('hidden');
      }
      
    } catch (error) {
      ErrorHandler.handleError(error, 'MailSystem.updateNavigationArrows');
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