/**
 * Mobile Touch Controls System
 * Handles virtual D-pad and touch interactions for mobile devices
 */

import { EventEmitter } from '../utils/EventEmitter.js';

export class MobileControls extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.currentDirection = null;
    this.touchStartTime = 0;
    
    // DOM elements
    this.mobileControls = document.getElementById('mobileControls');
    this.dpadUp = document.getElementById('dpadUp');
    this.dpadDown = document.getElementById('dpadDown');
    this.dpadLeft = document.getElementById('dpadLeft');
    this.dpadRight = document.getElementById('dpadRight');
    this.interactBtn = document.getElementById('interactBtn');
    
    this.detectMobileDevice();
    this.setupEventListeners();
  }

  /**
   * Detect if this is a mobile/touch device
   */
  detectMobileDevice() {
    // Check for touch support and mobile user agent
    const isTouchDevice = (('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) || 
                          (navigator.msMaxTouchPoints > 0));
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Also check CSS media query for coarse pointer
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    
    this.isActive = isTouchDevice && (isMobile || mediaQuery.matches);
    
    if (this.isActive) {
      console.log('📱 Mobile device detected - touch controls enabled');
      this.enableControls();
    } else {
      console.log('🖥️ Desktop device detected - touch controls disabled');
      this.disableControls();
    }
  }

  /**
   * Enable mobile controls
   */
  enableControls() {
    if (this.mobileControls) {
      this.mobileControls.style.display = 'block';
    }
  }

  /**
   * Disable mobile controls
   */
  disableControls() {
    if (this.mobileControls) {
      this.mobileControls.style.display = 'none';
    }
  }

  /**
   * Setup touch event listeners for all controls
   */
  setupEventListeners() {
    if (!this.isActive) return;

    // D-pad buttons
    this.setupDirectionButton(this.dpadUp, 'up');
    this.setupDirectionButton(this.dpadDown, 'down');
    this.setupDirectionButton(this.dpadLeft, 'left');
    this.setupDirectionButton(this.dpadRight, 'right');

    // Interact button
    this.setupInteractButton();

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleOrientationChange(), 500);
    });

    // Handle resize events
    window.addEventListener('resize', () => {
      this.handleOrientationChange();
    });
  }

  /**
   * Setup touch events for a directional button
   */
  setupDirectionButton(button, direction) {
    if (!button) return;

    // Touch events
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startMovement(direction);
    }, { passive: false });

    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopMovement(direction);
    }, { passive: false });

    button.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.stopMovement(direction);
    }, { passive: false });

    // Prevent context menu on long press
    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Mouse events as fallback (for testing on desktop)
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startMovement(direction);
    });

    button.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.stopMovement(direction);
    });

    button.addEventListener('mouseleave', (e) => {
      e.preventDefault();
      this.stopMovement(direction);
    });
  }

  /**
   * Setup touch events for interact button
   */
  setupInteractButton() {
    if (!this.interactBtn) return;

    // Touch events
    this.interactBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchStartTime = Date.now();
    }, { passive: false });

    this.interactBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touchDuration = Date.now() - this.touchStartTime;
      
      // Only register as tap if touch was brief (not a long press)
      if (touchDuration < 500) {
        this.handleInteract();
      }
    }, { passive: false });

    this.interactBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Prevent context menu
    this.interactBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Mouse events as fallback
    this.interactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleInteract();
    });
  }

  /**
   * Start movement in a direction
   */
  startMovement(direction) {
    if (this.currentDirection === direction) return;
    
    this.currentDirection = direction;
    this.emit('movementStart', direction);
    
    // Visual feedback
    const button = this.getDirectionButton(direction);
    if (button) {
      button.classList.add('active');
    }
  }

  /**
   * Stop movement in a direction
   */
  stopMovement(direction) {
    if (this.currentDirection !== direction) return;
    
    this.currentDirection = null;
    this.emit('movementStop', direction);
    
    // Remove visual feedback
    const button = this.getDirectionButton(direction);
    if (button) {
      button.classList.remove('active');
    }
  }

  /**
   * Handle interact button press
   */
  handleInteract() {
    this.emit('interact');
    
    // Visual feedback
    if (this.interactBtn) {
      this.interactBtn.classList.add('pressed');
      setTimeout(() => {
        this.interactBtn.classList.remove('pressed');
      }, 150);
    }
  }

  /**
   * Get directional button element
   */
  getDirectionButton(direction) {
    switch (direction) {
      case 'up': return this.dpadUp;
      case 'down': return this.dpadDown;
      case 'left': return this.dpadLeft;
      case 'right': return this.dpadRight;
      default: return null;
    }
  }

  /**
   * Handle orientation/resize changes
   */
  handleOrientationChange() {
    // Re-detect mobile device state
    this.detectMobileDevice();
    
    // Force layout recalculation
    if (this.mobileControls) {
      this.mobileControls.style.display = 'none';
      setTimeout(() => {
        if (this.isActive) {
          this.mobileControls.style.display = 'block';
        }
      }, 100);
    }
  }

  /**
   * Get current movement state
   */
  getCurrentMovement() {
    if (!this.currentDirection) {
      return { dx: 0, dy: 0, direction: null };
    }

    const movement = { dx: 0, dy: 0, direction: this.currentDirection };
    
    switch (this.currentDirection) {
      case 'up':
        movement.dy = -1;
        break;
      case 'down':
        movement.dy = 1;
        break;
      case 'left':
        movement.dx = -1;
        break;
      case 'right':
        movement.dx = 1;
        break;
    }

    return movement;
  }

  /**
   * Check if mobile controls are active
   */
  isMobileDevice() {
    return this.isActive;
  }

  /**
   * Force enable/disable (for testing)
   */
  setActive(active) {
    this.isActive = active;
    if (active) {
      this.enableControls();
    } else {
      this.disableControls();
    }
  }

  /**
   * Clean up mobile controls
   */
  destroy() {
    this.currentDirection = null;
    this.disableControls();
  }
}