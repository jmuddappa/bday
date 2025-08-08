/**
 * Main Game Controller
 * Coordinates all game systems and manages the game loop
 */

import { CONFIG } from '../config/gameConfig.js';
import { AssetLoader } from '../systems/AssetLoader.js';
import { AudioManager } from '../systems/AudioManager.js';
import { InputManager } from '../systems/InputManager.js';
import { Renderer } from '../systems/Renderer.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { MailSystem } from '../features/MailSystem.js';
import { Player } from '../entities/Player.js';
import { Dog } from '../entities/Dog.js';
import { Mailbox } from '../entities/Mailbox.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class Game {
  constructor() {
    // Core systems
    this.canvas = document.getElementById('game');
    this.assetLoader = new AssetLoader();
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    this.renderer = new Renderer(this.canvas);
    this.collisionSystem = new CollisionSystem();
    this.mailSystem = new MailSystem(this.audioManager);
    
    // Game entities
    this.player = new Player();
    this.dogs = [];
    this.mailbox = new Mailbox();
    
    // UI elements
    this.prompt = document.getElementById('prompt');
    this.talkPrompt = document.getElementById('talkPrompt');
    this.dialogContainer = document.getElementById('dialogContainer');
    this.audioStatus = document.getElementById('audioStatus');
    
    // Game state
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Collision sound system
    this.lastBumpTime = 0;
    this.bumpCooldown = 150;
    
    // Dialog data for each dog
    this.dogDialogs = {
      'Roti': {
        portrait: 'roti',
        messages: [
          "Thank you for adopting me, despite what papa said about my ugly nose! (Cảm ơn vì đã nhận nuôi con, mặc dù bố nói mũi con xấu!)",
          "I love you more than life itself (Con yêu bạn hơn cả mạng sống của mình)",
          "I would kill Khushi to save you! (Con sẽ giết Khushi để cứu bạn!)",
          "I just pissed and pooped on the rug inside! (Con vừa đi tiểu và đại tiện lên thảm trong nhà!)"
        ]
      },
      'Khushi': {
        portrait: 'khushi',
        messages: [
          "happy bday i guess lol (chúc mừng sinh nhật... chắc vậy lol)",
          "sup? (sao?)",
          "um can you give me some space (ừm... cho tôi chút không gian được không)",
          "... (...)"
        ]
      },
      'Me': {
        portrait: 'me',
        messages: [
          "Don't move or else I'll stop singing and we have to start this all over again & torture our guests. (Đừng di chuyển không thì tôi sẽ ngừng hát và chúng ta phải bắt đầu lại từ đầu & tra tấn khách của chúng ta.)",
          "I am your farm husband! I just stand here all day and watch you farm - realistic right? (Tôi là chồng nông trại của bạn! Tôi chỉ đứng đây cả ngày và xem bạn làm nông - thực tế đúng không?)",
          "Wanna see something cool? Press ; to see the collision boxes that prevent you from bumping into things! (Muốn thấy điều gì đó thú vị không? Nhấn ; để xem các hộp va chạm ngăn bạn đâm vào đồ vật!)",
          "I love you! Happy birthday Lindo. (Anh yêu em! Chúc mừng sinh nhật Lindo.)"
        ]
      }
    };
    
    // Track current message index for each dog
    this.dogMessageIndex = {
      'Roti': 0,
      'Khushi': 0,
      'Me': 0
    };
    
    this.setupEventListeners();
  }

  async initialize() {
    try {
      this.audioManager.updateStatus();
      
      console.log('📦 Loading game assets...');
      await this.loadAssets();
      
      console.log('🎭 Creating game entities...');
      this.createEntities();
      
      console.log('🚀 Starting game loop...');
      this.start();
      
    } catch (error) {
      ErrorHandler.handleError(error, 'Game.initialize');
      throw error;
    }
  }

  async loadAssets() {
    const { IMAGES } = CONFIG.ASSETS;
    
    // Load all images in parallel
    const [backgroundImage, playerFront, playerSide, playerBack, rotiSprite, khushiSprite, meSprite] = await Promise.all([
      this.assetLoader.loadImage(IMAGES.BACKGROUND),
      this.assetLoader.loadImage(IMAGES.PLAYER_FRONT),
      this.assetLoader.loadImage(IMAGES.PLAYER_SIDE),
      this.assetLoader.loadImage(IMAGES.PLAYER_BACK),
      this.assetLoader.loadImage(IMAGES.ROTI),
      this.assetLoader.loadImage(IMAGES.KHUSHI),
      this.assetLoader.loadImage(IMAGES.ME)
    ]);

    // Store loaded assets
    this.backgroundImage = backgroundImage;
    this.player.setSprites(playerFront, playerSide, playerBack);
    
    return { rotiSprite, khushiSprite, meSprite };
  }

  async createEntities() {
    const { rotiSprite, khushiSprite, meSprite } = await this.loadAssets();
    
    // Create dogs with their sprites and audio
    const rotiDog = new Dog('Roti', CONFIG.DOGS.ROTI);
    rotiDog.setSprite(rotiSprite);
    rotiDog.setAudio(this.audioManager.getAudio('barkRoti'));
    
    const khushiDog = new Dog('Khushi', CONFIG.DOGS.KHUSHI);
    khushiDog.setSprite(khushiSprite);
    khushiDog.setAudio(this.audioManager.getAudio('barkKhushi'));
    
    const meDog = new Dog('Me', CONFIG.DOGS.ME);
    meDog.setSprite(meSprite);
    
    this.dogs = [rotiDog, khushiDog, meDog];
  }

  setupEventListeners() {
    // Input system events
    this.inputManager.on('interact', () => {
      // Check for dialog with any dog first
      const nearbyDog = this.getNearbyDog();
      if (nearbyDog) {
        this.openDialog(nearbyDog);
        return;
      }
      
      // Then check mailbox
      if (this.mailbox.isPlayerNearby(this.player)) {
        this.mailSystem.openMailbox();
      }
    });

    this.inputManager.on('toggleDebug', () => {
      const debugMode = this.renderer.toggleDebugMode();
      console.log(`🐛 Debug mode: ${debugMode ? 'ON' : 'OFF'}`);
    });

    this.inputManager.on('toggleCollisions', () => {
      const collisionMode = this.renderer.toggleCollisionMode();
      console.log(`📦 Collision boxes: ${collisionMode ? 'ON' : 'OFF'}`);
    });

    this.inputManager.on('closeModals', () => {
      // Let MailSystem handle its own two-step escape behavior
      // Only close dialog here
      this.closeDialog();
    });

    // Audio system events
    this.inputManager.on('audioRequested', () => {
      this.audioManager.tryStartAudio();
    });

    // Window events
    window.addEventListener('beforeunload', () => this.destroy());
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // Prompt repositioning on resize
    window.addEventListener('resize', () => {
      if (this.prompt && this.prompt.style.display === 'block') {
        this.updatePromptPosition();
      }
      if (this.talkPrompt && this.talkPrompt.style.display === 'block') {
        this.updateTalkPromptPosition();
      }
    });
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  pause() {
    this.isRunning = false;
    this.audioManager.setVolume('bgMusic', 0.3);
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.audioManager.setVolume('bgMusic', 1.0);
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;
    
    // Run at full frame rate (no throttling)
    this.update(deltaTime);
    this.render();
    this.lastFrameTime = currentTime;
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    try {
      this.updatePlayer();
      this.updateDogs();
      this.updateUI();
    } catch (error) {
      ErrorHandler.handleError(error, 'Game.update');
    }
  }

  updatePlayer() {
    const movement = this.inputManager.getMovementInput();
    
    if (movement.dx !== 0 || movement.dy !== 0) {
      const speed = this.player.speed;
      const dx = movement.dx * speed;
      const dy = movement.dy * speed;
      
      const moved = this.player.move(dx, dy, CONFIG.COLLISION_BOXES);
      
      if (movement.direction) {
        this.player.setDirection(movement.direction);
      }
      
      // Play bump sound on collision
      if (!moved && this.audioManager.musicStarted) {
        this.playBumpSound();
      }
    }
  }

  updateDogs() {
    const bgAudio = this.audioManager.getAudio('bgMusic');
    const happybdayAudio = this.audioManager.getAudio('happybday');
    
    this.dogs.forEach(dog => {
      if (dog.name === 'Me') {
        dog.update(this.player, happybdayAudio, bgAudio);
      } else {
        dog.update(this.player);
      }
    });
  }

  updateUI() {
    // Handle talk prompt for any nearby dog
    const nearbyDog = this.getNearbyDog();
    if (nearbyDog) {
      this.showTalkPrompt(nearbyDog);
      this.hidePrompt();
    } else {
      // If no dog is nearby, close any open dialog
      this.closeDialog();
      this.hideTalkPrompt();
      
      // Check mailbox
      if (this.mailbox.isPlayerNearby(this.player)) {
        this.showPrompt();
      } else {
        this.hidePrompt();
      }
    }
  }

  showPrompt() {
    if (this.prompt) {
      this.prompt.style.display = 'block';
      this.updatePromptPosition();
    }
  }

  hidePrompt() {
    if (this.prompt) {
      this.prompt.style.display = 'none';
    }
  }

  updatePromptPosition() {
    const pos = this.mailbox.getPromptPosition(this.canvas);
    this.prompt.style.left = `${pos.x}px`;
    this.prompt.style.top = `${pos.y}px`;
  }

  render() {
    try {
      this.renderer.clear();
      this.renderer.drawBackground(this.backgroundImage);
      
      this.dogs.forEach(dog => {
        this.renderer.drawDog(dog);
      });
      
      this.renderer.drawPlayer(this.player);
      
      this.renderer.drawDebugInfo(this.player, this.dogs);
      this.renderer.drawDebugCollisions(CONFIG.COLLISION_BOXES, this.player);
      
    } catch (error) {
      ErrorHandler.handleError(error, 'Game.render');
    }
  }

  playBumpSound() {
    const currentTime = Date.now();
    
    if (currentTime - this.lastBumpTime < this.bumpCooldown) {
      return;
    }
    
    this.lastBumpTime = currentTime;
    this.audioManager.playBumpSound();
  }

  // Public API
  getGameState() {
    return {
      isRunning: this.isRunning,
      playerPosition: { x: this.player.x, y: this.player.y },
      viewedMessages: this.mailSystem.getViewedCount(),
      totalMessages: this.mailSystem.getTotalCount()
    };
  }

  setDebugMode(enabled) {
    this.renderer.setDebugMode(enabled);
  }

  // Dialog and interaction methods
  getNearbyDog() {
    return this.dogs.find(dog => dog.isPlayerInRange(this.player));
  }

  showTalkPrompt(dog) {
    if (this.talkPrompt && dog) {
      this.talkPrompt.style.display = 'block';
      this.updateTalkPromptPosition(dog);
    }
  }

  hideTalkPrompt() {
    if (this.talkPrompt) {
      this.talkPrompt.style.display = 'none';
    }
  }

  updateTalkPromptPosition(dog) {
    if (!dog) {
      const nearbyDog = this.getNearbyDog();
      if (nearbyDog) dog = nearbyDog;
      else return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (dog.x + dog.width / 2 - 70) * canvasScale;
    const y = rect.top + (dog.y - 80) * canvasScale;
    
    this.talkPrompt.style.left = `${x}px`;
    this.talkPrompt.style.top = `${y}px`;
  }

  openDialog(dog) {
    if (this.dialogContainer && dog) {
      this.dialogContainer.style.display = 'block';
      
      // Play bark sound for Roti and Khushi (not Me)
      if (dog.name === 'Roti' || dog.name === 'Khushi') {
        if (dog.audio) {
          dog.audio.currentTime = 0; // Reset to start
          dog.audio.play().catch(e => {
            console.log('Could not play bark sound:', e);
          });
        }
      }
      
      const dialogData = this.dogDialogs[dog.name];
      if (dialogData) {
        // Set dog name
        const dialogNameElement = document.getElementById('dialogName');
        if (dialogNameElement) {
          dialogNameElement.textContent = dog.name;
        }
        
        // Set portrait
        const dialogPortraitElement = document.getElementById('dialogPortrait');
        if (dialogPortraitElement) {
          // Remove existing portrait classes
          dialogPortraitElement.className = 'dialog-portrait';
          // Add the specific dog portrait class
          dialogPortraitElement.classList.add(dialogData.portrait);
        }
        
        // Get current message and cycle to next
        const currentIndex = this.dogMessageIndex[dog.name];
        const currentMessage = dialogData.messages[currentIndex];
        
        // Advance to next message for next interaction
        this.dogMessageIndex[dog.name] = (currentIndex + 1) % dialogData.messages.length;
        
        const dialogTextElement = document.getElementById('dialogText');
        if (dialogTextElement) {
          // Format the message to style Vietnamese text differently
          const formattedMessage = currentMessage.replace(/\(([^)]+)\)/g, '<span class="vietnamese-text">($1)</span>');
          dialogTextElement.innerHTML = formattedMessage;
        }
      }
    }
  }

  closeDialog() {
    if (this.dialogContainer) {
      this.dialogContainer.style.display = 'none';
    }
  }

  destroy() {
    this.isRunning = false;
    
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    
    if (this.audioManager) {
      this.audioManager.destroy();
    }
  }
}