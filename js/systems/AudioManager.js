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
    this.lastPlayedTimes = new Map(); // Track when each audio was last played
    this.originalBgVolume = CONFIG.AUDIO.DEFAULT_VOLUME; // Store original bg volume
    this.activeAudioElements = new Set(); // Track currently playing audio
    this.isMobile = this.detectMobile();
    
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
      this.audioElements.set('friend2Sound', document.getElementById('friend2Sound'));
      this.audioElements.set('friend6Sound', document.getElementById('friend6Sound'));
      this.audioElements.set('anneSound', document.getElementById('anneSound'));
      this.audioElements.set('khoaSound', document.getElementById('khoaSound'));
      this.audioElements.set('boSound', document.getElementById('boSound'));
      this.audioElements.set('friend3Sound', document.getElementById('friend3Sound'));
      this.audioElements.set('nolanInitSound', document.getElementById('nolanInitSound'));
      this.audioElements.set('nolanEatSound', document.getElementById('nolanEatSound'));
      this.audioElements.set('khushiByeSound', document.getElementById('khushiByeSound'));
      this.audioElements.set('natSound', document.getElementById('natSound'));
      this.audioElements.set('danundieSound', document.getElementById('danundieSound'));
      this.audioElements.set('daninjaSound', document.getElementById('daninjaSound'));
      this.audioElements.set('daninjaIntSound', document.getElementById('daninjaIntSound'));
      this.audioElements.set('fadeSound', document.getElementById('fadeSound'));
      
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

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  }

  setupMusicTrigger() {
    // Start music on first user interaction
    const startMusic = () => {
      this.tryStartAudio();
    };

    // Multiple trigger points for better UX, especially for mobile
    window.addEventListener('keydown', startMusic, { once: true });
    window.addEventListener('click', startMusic, { once: true });
    window.addEventListener('touchstart', startMusic, { once: true });
    window.addEventListener('touchend', startMusic, { once: true });
    
    // Additional mobile-specific triggers
    if (this.isMobile) {
      window.addEventListener('touchmove', startMusic, { once: true });
      window.addEventListener('gesturestart', startMusic, { once: true });
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
        })
        .catch(e => {
          console.log('🔇 Music play failed, retrying...', e);
          // For mobile, try again after a short delay
          if (this.isMobile) {
            setTimeout(() => {
              bgMusic.play().then(() => {
                console.log('🎵 Background music started on retry');
                this.musicStarted = true;
              }).catch(retryError => {
                console.log('🔇 Music retry failed:', retryError);
              });
            }, 500);
          }
        });
    };

    if (bgMusic.readyState >= 2) {
      playAudio();
    } else {
      bgMusic.addEventListener('canplay', playAudio, { once: true });
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

      // Define exceptions that bypass cooldown
      const cooldownExceptions = ['bgMusic', 'fadeSound', 'plantGrowSound'];
      const bypassCooldown = cooldownExceptions.includes(audioKey) || options.restart;
      
      // Check cooldown (5 seconds = 5000ms) unless bypassed
      if (!bypassCooldown) {
        const lastPlayed = this.lastPlayedTimes.get(audioKey);
        const now = Date.now();
        const cooldownPeriod = 5000; // 5 seconds
        
        if (lastPlayed && (now - lastPlayed) < cooldownPeriod) {
          const remainingCooldown = Math.ceil((cooldownPeriod - (now - lastPlayed)) / 1000);
          console.log(`🔇 Audio '${audioKey}' is on cooldown. ${remainingCooldown}s remaining.`);
          return;
        }
        
        // Update last played time for non-exception audio
        this.lastPlayedTimes.set(audioKey, now);
      }

      if (options.restart) {
        audio.currentTime = 0;
      }

      // Apply custom volume adjustments for specific audio keys
      let targetVolume = options.volume;
      if (audioKey === 'boSound') {
        // Reduce Bo's sound by 30% (multiply by 0.7)
        const baseVolume = targetVolume !== undefined ? targetVolume : audio.volume || 1.0;
        targetVolume = baseVolume * 0.7;
        console.log(`🔊 Reducing Bo's audio volume by 30%: ${baseVolume.toFixed(2)} → ${targetVolume.toFixed(2)}`);
      }
      
      if (targetVolume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, targetVolume));
      }

      // Duck background music when other audio plays (except bg music itself and system sounds)
      const noDuckingExceptions = ['bgMusic', 'fadeSound', 'plantGrowSound'];
      if (!noDuckingExceptions.includes(audioKey)) {
        this.duckBackgroundMusic();
        
        // Track this audio element and set up restoration when it ends
        this.activeAudioElements.add(audioKey);
        
        // Set up event listener to restore bg music when audio ends
        const restoreOnEnd = () => {
          this.activeAudioElements.delete(audioKey);
          if (this.activeAudioElements.size === 0) {
            this.restoreBackgroundMusic();
          }
          audio.removeEventListener('ended', restoreOnEnd);
        };
        
        audio.addEventListener('ended', restoreOnEnd);
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
        // Clean up tracking if this was ducking bg music
        this.activeAudioElements.delete(audioKey);
        if (this.activeAudioElements.size === 0) {
          this.restoreBackgroundMusic();
        }
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
        // Clean up tracking if this was ducking bg music
        this.activeAudioElements.delete(audioKey);
        if (this.activeAudioElements.size === 0) {
          this.restoreBackgroundMusic();
        }
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
   * Duck background music volume (reduce by 80%)
   */
  duckBackgroundMusic() {
    const bgMusic = this.audioElements.get('bgMusic');
    if (bgMusic && this.musicStarted) {
      const duckedVolume = this.originalBgVolume * 0.2; // 80% reduction
      bgMusic.volume = duckedVolume;
      console.log(`🔉 Background music ducked to ${Math.round(duckedVolume * 100)}% volume`);
    }
  }

  /**
   * Restore background music to original volume
   */
  restoreBackgroundMusic() {
    const bgMusic = this.audioElements.get('bgMusic');
    if (bgMusic && this.musicStarted) {
      bgMusic.volume = this.originalBgVolume;
      console.log(`🔊 Background music restored to ${Math.round(this.originalBgVolume * 100)}% volume`);
    }
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
    this.activeAudioElements.clear();
  }
}