/**
 * Asset Loading System
 * Handles loading and caching of game assets
 */

import { ErrorHandler } from '../utils/ErrorHandler.js';

export class AssetLoader {
  constructor() {
    this.loadedImages = new Map();
    this.loadedAudio = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load an image with caching and error handling
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImage(src) {
    // Return cached image if already loaded
    if (this.loadedImages.has(src)) {
      return this.loadedImages.get(src);
    }

    // Return existing promise if currently loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Create new loading promise
    const loadingPromise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        const error = new Error(`Failed to load image: ${src}`);
        ErrorHandler.handleError(error, 'AssetLoader.loadImage');
        reject(error);
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, loadingPromise);
    return loadingPromise;
  }

  /**
   * Load audio element with caching
   * @param {string} src - Audio source URL
   * @param {string} elementId - Optional existing audio element ID
   * @returns {HTMLAudioElement}
   */
  loadAudio(src, elementId = null) {
    if (this.loadedAudio.has(src)) {
      return this.loadedAudio.get(src);
    }

    const audio = elementId ? document.getElementById(elementId) : new Audio();
    
    if (!elementId) {
      audio.src = src;
      audio.preload = 'auto';
    }
    
    this.loadedAudio.set(src, audio);
    return audio;
  }

  /**
   * Get cached image
   * @param {string} src - Image source URL
   * @returns {HTMLImageElement|null}
   */
  getImage(src) {
    return this.loadedImages.get(src) || null;
  }

  /**
   * Get cached audio
   * @param {string} src - Audio source URL
   * @returns {HTMLAudioElement|null}
   */
  getAudio(src) {
    return this.loadedAudio.get(src) || null;
  }

  /**
   * Preload multiple assets in parallel
   * @param {Array} imageSrcs - Array of image URLs to preload
   * @returns {Promise<Array>}
   */
  async preloadImages(imageSrcs) {
    const loadPromises = imageSrcs.map(src => this.loadImage(src));
    return Promise.all(loadPromises);
  }

  /**
   * Get loading progress
   * @returns {Object} Loading statistics
   */
  getLoadingStats() {
    return {
      imagesLoaded: this.loadedImages.size,
      audioLoaded: this.loadedAudio.size,
      currentlyLoading: this.loadingPromises.size
    };
  }

  /**
   * Clear all cached assets
   */
  clearCache() {
    this.loadedImages.clear();
    this.loadedAudio.clear();
    this.loadingPromises.clear();
  }
}