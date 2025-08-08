/**
 * Audio Management System
 * Handles all game audio including music, effects, and user interaction requirements
 */

import { CONFIG } from '../config/gameConfig.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class AudioManager {
  constructor() {
    this.audioElements = new Map();
    this.musicStarted = false;
    this.audioStatus = document.getElementById('audioStatus');
    
    this.setupAudioElements();
    this.setupMusicTrigger();
  }

  setupAudioElements() {
    try {
      // Load existing HTML audio elements
      this.audioElements.set('bgMusic', document.getElementById('bgMusic'));
      this.audioElements.set('barkRoti', document.getElementById('barkRoti'));
      this.audioElements.set('barkKhushi', document.getElementById('barkKhushi'));
      this.audioElements.set('happybday', document.getElementById('happybday'));
      
      // Set up background music properties
      const bgMusic = this.audioElements.get('bgMusic');
      if (bgMusic) {
        bgMusic.loop = true;
        bgMusic.volume = CONFIG.AUDIO.DEFAULT_VOLUME;
      }
      
    } catch (error) {
      ErrorHandler.handleError(error, 'AudioManager.setupAudioElements');
    }
  }

  setupMusicTrigger() {
    // Start music on first user interaction
    const startMusic = () => {
      this.tryStartAudio();
    };

    // Multiple trigger points for better UX
    window.addEventListener('keydown', startMusic, { once: true });
    window.addEventListener('click', startMusic, { once: true });
    window.addEventListener('touchstart', startMusic, { once: true });
    
    // Add click handler for audio status indicator
    if (this.audioStatus) {
      this.audioStatus.addEventListener('click', () => this.tryStartAudio());
      this.audioStatus.style.cursor = 'pointer';
    }
  }

  tryStartAudio() {
    if (this.musicStarted) return;
    
    const bgMusic = this.audioElements.get('bgMusic');
    if (!bgMusic) return;
    
    // Check if audio is ready to play
    const playAudio = () => {
      bgMusic.volume = CONFIG.AUDIO.DEFAULT_VOLUME;
      bgMusic.play()
        .then(() => {
          console.log('🎵 Background music started');
          this.musicStarted = true;
          this.updateStatus();
        })
        .catch(e => {
          console.log('🔇 Music play failed:', e);
          this.updateStatus();
        });
    };

    if (bgMusic.readyState >= 2) {
      playAudio();
    } else {
      bgMusic.addEventListener('canplay', playAudio, { once: true });
    }
  }

  updateStatus() {
    if (!this.audioStatus) return;
    
    if (this.musicStarted) {
      this.audioStatus.textContent = 'Audio: ON 🔊';
      this.audioStatus.style.background = 'rgba(0,100,0,0.7)';
    } else {
      this.audioStatus.textContent = 'Audio: Click to enable 🔇';
      this.audioStatus.style.background = 'rgba(100,0,0,0.7)';
    }
  }

  /**
   * Play audio with options
   * @param {string} audioKey - Audio element key
   * @param {Object} options - Playback options
   */
  play(audioKey, options = {}) {
    try {
      const audio = this.audioElements.get(audioKey);
      if (!audio) {
        console.warn(`Audio element '${audioKey}' not found`);
        return;
      }

      if (options.restart) {
        audio.currentTime = 0;
      }

      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }

      return audio.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          ErrorHandler.handleError(e, `Playing ${audioKey}`);
        }
      });
    } catch (error) {
      ErrorHandler.handleError(error, `AudioManager.play(${audioKey})`);
    }
  }

  /**
   * Pause audio
   * @param {string} audioKey - Audio element key
   */
  pause(audioKey) {
    try {
      const audio = this.audioElements.get(audioKey);
      if (audio) {
        audio.pause();
      }
    } catch (error) {
      ErrorHandler.handleError(error, `AudioManager.pause(${audioKey})`);
    }
  }

  /**
   * Stop audio and reset position
   * @param {string} audioKey - Audio element key
   */
  stop(audioKey) {
    try {
      const audio = this.audioElements.get(audioKey);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (error) {
      ErrorHandler.handleError(error, `AudioManager.stop(${audioKey})`);
    }
  }

  /**
   * Set audio volume
   * @param {string} audioKey - Audio element key
   * @param {number} volume - Volume (0-1)
   */
  setVolume(audioKey, volume) {
    try {
      const audio = this.audioElements.get(audioKey);
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume));
      }
    } catch (error) {
      ErrorHandler.handleError(error, `AudioManager.setVolume(${audioKey})`);
    }
  }

  /**
   * Get audio element
   * @param {string} audioKey - Audio element key
   * @returns {HTMLAudioElement|null}
   */
  getAudio(audioKey) {
    return this.audioElements.get(audioKey) || null;
  }

  /**
   * Play collision bump sound
   */
  playBumpSound() {
    try {
      this.generateBumpSound();
    } catch (error) {
      console.log('🔇 Bump sound failed:', error);
    }
  }

  /**
   * Generate bump sound using Web Audio API
   * @private
   */
  generateBumpSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create audio nodes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Connect: oscillator -> filter -> gain -> output
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure oscillator for deep bump sound
      oscillator.frequency.setValueAtTime(40, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(15, audioContext.currentTime + 0.15);
      oscillator.type = 'sawtooth';
      
      // Configure low-pass filter for muffled sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.1);
      filter.Q.setValueAtTime(1, audioContext.currentTime);
      
      // Configure envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(CONFIG.AUDIO.BUMP_VOLUME, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
    } catch (error) {
      console.log('🔇 Web Audio API not supported for bump sound');
    }
  }

  /**
   * Fade audio in/out
   * @param {string} audioKey - Audio element key
   * @param {number} duration - Fade duration in ms
   * @param {number} targetVolume - Target volume (0-1)
   */
  async fadeVolume(audioKey, duration = 1000, targetVolume = 0) {
    const audio = this.audioElements.get(audioKey);
    if (!audio) return;

    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const fadeStep = volumeDiff / (duration / 50);
    
    return new Promise((resolve) => {
      const fadeInterval = setInterval(() => {
        const newVolume = audio.volume + fadeStep;
        
        if ((fadeStep > 0 && newVolume >= targetVolume) || 
            (fadeStep < 0 && newVolume <= targetVolume)) {
          audio.volume = targetVolume;
          clearInterval(fadeInterval);
          resolve();
        } else {
          audio.volume = Math.max(0, Math.min(1, newVolume));
        }
      }, 50);
    });
  }

  /**
   * Clean up audio manager
   */
  destroy() {
    this.audioElements.forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
      }
    });
    this.audioElements.clear();
  }
}