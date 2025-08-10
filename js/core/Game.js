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
import { DanundieStreak } from '../entities/DanundieStreak.js';
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
    this.danundieStreak = new DanundieStreak();
    
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
      },
      //khoa
      'Friend1': {
        portrait: 'friend1_portrait',
        messages: [
          "Khoa: Live, laugh, love! Anne: HOLY EFFIN SHIT BALLS GIRL ITS YOUR BDAY! (Khoa: Sống, cười, yêu! Anne: CHÚC MỪNG SINH NHẬT CẬU Ê! 🎉)"
        ]
      },
      //raza
      'Friend2': {
        portrait: 'friend2_portrait',
        messages: [
          "This isn't as nice as a river but I still appreciate the view. (Đây không đẹp bằng một dòng sông nhưng tôi vẫn thích cảnh này.)"
        ]
      },
      //bome
      'Friend3': {
        portrait: 'friend3_portrait',
        messages: [
          "Không thể chờ để ăn mừng với mọi người! 🥳"
        ]
      }
    };
    
    // Track current message index for each dog
    this.dogMessageIndex = {
      'Roti': 0,
      'Khushi': 0,
      'Me': 0,
      'Friend1': 0,
      'Friend2': 0,
      'Friend3': 0
    };
    
    this.setupEventListeners();
  }

  async initialize() {
    try {
      this.audioManager.updateStatus();
      
      console.log('📦 Loading game assets...');
      const sprites = await this.loadAssets();
      
      console.log('🎭 Creating game entities...');
      await this.createEntities(sprites);
      
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
    const [backgroundImage, playerFront, playerSide, playerMovement, playerUp, playerDown, rotiSprite, khushiSprite, meSprite, meFramesSprite, friend1Sprite, friend2Sprite, friend3Sprite, danundieSprite] = await Promise.all([
      this.assetLoader.loadImage(IMAGES.BACKGROUND),
      this.assetLoader.loadImage(IMAGES.PLAYER_FRONT),
      this.assetLoader.loadImage(IMAGES.PLAYER_SIDE),
      this.assetLoader.loadImage(IMAGES.PLAYER_MOVEMENT),
      this.assetLoader.loadImage(IMAGES.PLAYER_UP),
      this.assetLoader.loadImage(IMAGES.PLAYER_DOWN),
      this.assetLoader.loadImage(IMAGES.ROTI),
      this.assetLoader.loadImage(IMAGES.KHUSHI),
      this.assetLoader.loadImage(IMAGES.ME),
      this.assetLoader.loadImage(IMAGES.ME_FRAMES),
      this.assetLoader.loadImage(IMAGES.FRIEND1),
      this.assetLoader.loadImage(IMAGES.FRIEND2),
      this.assetLoader.loadImage(IMAGES.FRIEND3),
      this.assetLoader.loadImage(IMAGES.DANUNDIE)
    ]);

    // Store loaded assets
    this.backgroundImage = backgroundImage;
    this.player.setSprites(playerFront, playerSide, playerUp, playerMovement, playerUp, playerDown);
    
    
    // Set danundie sprite
    this.danundieStreak.setSprite(danundieSprite);
    
    return { rotiSprite, khushiSprite, meSprite, meFramesSprite, friend1Sprite, friend2Sprite, friend3Sprite };
  }

  async createEntities(sprites) {
    const { rotiSprite, khushiSprite, meSprite, meFramesSprite, friend1Sprite, friend2Sprite, friend3Sprite } = sprites;
    
    // Create dogs with their sprites and audio
    const rotiDog = new Dog('Roti', CONFIG.DOGS.ROTI);
    rotiDog.setSprite(rotiSprite);
    rotiDog.setAudio(this.audioManager.getAudio('barkRoti'));
    
    const khushiDog = new Dog('Khushi', CONFIG.DOGS.KHUSHI);
    khushiDog.setSprite(khushiSprite);
    khushiDog.setAudio(this.audioManager.getAudio('barkKhushi'));
    
    const meDog = new Dog('Me', CONFIG.DOGS.ME);
    meDog.setSprite(meSprite); // Keep original for fallback
    meDog.setFramesSprite(meFramesSprite); // Set new animation sprite
    
    // Create friend1 as simple dog entity
    const friend1 = new Dog('Friend1', CONFIG.DOGS.FRIEND1);
    friend1.setSprite(friend1Sprite);
    friend1.setAudio(this.audioManager.getAudio('friend1Sound'));
    
    // Create friend2 as simple dog entity
    const friend2 = new Dog('Friend2', CONFIG.DOGS.FRIEND2);
    friend2.setSprite(friend2Sprite);
    friend2.setAudio(this.audioManager.getAudio('friend2Sound'));
    
    // Create friend3 as simple dog entity
    const friend3 = new Dog('Friend3', CONFIG.DOGS.FRIEND3);
    friend3.setSprite(friend3Sprite);
    friend3.setAudio(this.audioManager.getAudio('friend3Sound'));
    
    console.log('🖼️ Friend1 sprite source:', friend1Sprite?.src);
    console.log('🖼️ Friend2 sprite source:', friend2Sprite?.src);
    console.log('🖼️ Friend3 sprite source:', friend3Sprite?.src);
    
    this.dogs = [rotiDog, khushiDog, meDog, friend1, friend2, friend3];
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

    // Secret danundie streak trigger
    this.inputManager.on('danundieStreak', () => {
      this.triggerDanundieStreak();
    });

    // Audio system events
    this.inputManager.on('audioRequested', () => {
      this.audioManager.tryStartAudio();
    });

    // Mobile touch events - close dialogs when tapping anywhere
    this.canvas.addEventListener('touchstart', (e) => {
      // Only close dialog if one is open
      if (this.dialogContainer && this.dialogContainer.style.display === 'block') {
        e.preventDefault();
        this.closeDialog();
      }
    });

    // Also handle clicks for desktop
    this.canvas.addEventListener('click', (e) => {
      // Only close dialog if one is open
      if (this.dialogContainer && this.dialogContainer.style.display === 'block') {
        this.closeDialog();
      }
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
      this.updateDanundie();
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
    } else {
      // No movement input - stop walking animations
      this.player.isWalkingHorizontally = false;
      this.player.isWalkingUp = false;
      this.player.isWalkingDown = false;
    }
    
    // Update player animations and state
    this.player.update();
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

  updateDanundie() {
    this.danundieStreak.update();
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
      
      // Draw Danundie streak on top of everything
      this.renderer.drawDanundieStreak(this.danundieStreak);
      
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

  /**
   * Trigger Danundie streak across screen
   */
  triggerDanundieStreak() {
    if (this.danundieStreak.isStreaking()) {
      console.log('🏃‍♂️ Danundie is already streaking!');
      return;
    }
    
    if (this.danundieStreak.isOnCooldown()) {
      console.log(`🏃‍♂️ Danundie is resting! ${this.danundieStreak.getCooldownRemaining()}s remaining`);
      return;
    }
    
    // Random Y position in playable area
    const randomY = Math.random() * (CONFIG.CANVAS.HEIGHT - 200) + 100;
    this.danundieStreak.startStreak(randomY);
    
    // Play silly sound effect
    const danundieAudio = this.audioManager.getAudio('danundieSound');
    if (danundieAudio) {
      danundieAudio.currentTime = 0; // Reset to start
      danundieAudio.play().catch(e => {
        console.log('Could not play danundie sound:', e);
      });
    }
    
    console.log('🏃‍♂️ DANUNDIE STREAK TRIGGERED WITH SOUND!');
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


  showTalkPrompt(character) {
    if (this.talkPrompt && character) {
      this.talkPrompt.style.display = 'block';
      this.updateTalkPromptPosition(character);
    }
  }

  hideTalkPrompt() {
    if (this.talkPrompt) {
      this.talkPrompt.style.display = 'none';
    }
  }

  updateTalkPromptPosition(character) {
    if (!character) {
      const nearbyDog = this.getNearbyDog();
      if (nearbyDog) character = nearbyDog;
      else return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    // Use smaller offset for friends since they're larger
    const friendOffsets = {
      'Friend1': -20,
      'Friend2': -30,
      'Friend3': -25
    };
    const yOffset = friendOffsets[character.name] || -80;
    
    const x = rect.left + (character.x + character.width / 2 - 70) * canvasScale;
    const y = rect.top + (character.y + yOffset) * canvasScale;
    
    this.talkPrompt.style.left = `${x}px`;
    this.talkPrompt.style.top = `${y}px`;
  }

  openDialog(character) {
    if (this.dialogContainer && character) {
      this.dialogContainer.style.display = 'block';
      
      // Play sound for all characters except Me
      if (character.name !== 'Me' && character.audio) {
        character.audio.currentTime = 0; // Reset to start
        character.audio.play().catch(e => {
          console.log('Could not play sound:', e);
        });
        
        // For simple sprites, call playSound method
        if (character.playSound && typeof character.playSound === 'function') {
          character.playSound();
        }
      }
      
      const dialogData = this.dogDialogs[character.name];
      if (dialogData) {
        // Set character name
        const dialogNameElement = document.getElementById('dialogName');
        if (dialogNameElement) {
          dialogNameElement.textContent = character.name;
        }
        
        // Set portrait
        const dialogPortraitElement = document.getElementById('dialogPortrait');
        if (dialogPortraitElement) {
          // Remove existing portrait classes
          dialogPortraitElement.className = 'dialog-portrait';
          // Add the specific portrait class
          dialogPortraitElement.classList.add(dialogData.portrait);
        }
        
        // Get current message and cycle to next
        const currentIndex = this.dogMessageIndex[character.name];
        const currentMessage = dialogData.messages[currentIndex];
        
        // Advance to next message for next interaction
        this.dogMessageIndex[character.name] = (currentIndex + 1) % dialogData.messages.length;
        
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