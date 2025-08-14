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
import { Jukebox } from '../entities/Jukebox.js';
import { Cake } from '../entities/Cake.js';
import { DanundieStreak } from '../entities/DanundieStreak.js';
import { DaninjaReveal } from '../entities/DaninjaReveal.js';
import { JukeboxSystem } from '../features/JukeboxSystem.js';
import { PoopSystem } from '../systems/PoopSystem.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { language } from '../utils/Language.js';

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
    this.jukeboxSystem = new JukeboxSystem(this.audioManager);
    this.poopSystem = new PoopSystem();
    
    // Set jukebox reference in AudioManager for background music control
    this.audioManager.setJukeboxSystem(this.jukeboxSystem);
    
    // Game entities
    this.player = new Player();
    this.dogs = [];
    this.mailbox = new Mailbox();
    this.jukebox = new Jukebox();
    
    // Set jukebox system reference in jukebox entity for animation control
    this.jukebox.setJukeboxSystem(this.jukeboxSystem);
    this.cake = new Cake();
    this.danundieStreak = new DanundieStreak();
    this.daninjaReveal = new DaninjaReveal();
    
    // UI elements
    this.prompt = document.getElementById('prompt');
    this.talkPrompt = document.getElementById('talkPrompt');
    this.speechBubble = document.getElementById('speechBubble');
    this.speechBubbleDaninja = document.getElementById('speechBubbleDaninja');
    this.dialogContainer = document.getElementById('dialogContainer');
    this.dialogBackdrop = document.getElementById('dialogBackdrop');
    this.choiceModal = document.getElementById('choiceModal');
    
    // Game state
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.isSpeechBubbleActive = false;
    this.isSpeechBubbleDaninjaActive = false;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Daninja dialog state
    this.isDaninjaDialogOpen = false;
    
    // Collision sound system
    this.lastBumpTime = 0;
    this.bumpCooldown = 150;
    
    // Dialog data for each dog
    this.dogDialogs = {
      'Roti': {
        portrait: 'roti',
        messages: [
          'dialog_roti_1',
          'dialog_roti_2',
          'dialog_roti_3',
          'dialog_roti_4'
        ]
      },
      'Khushi': {
        portrait: 'khushi',
        messages: [
          'dialog_khushi_1',
          'dialog_khushi_2',
          'dialog_khushi_3',
          'dialog_khushi_4'
        ]
      },
      'Danoonie': {
        portrait: 'me',
        messages: [
          'dialog_danoonie_1',
          'dialog_danoonie_2',
          'dialog_danoonie_3',
          'dialog_danoonie_4'
        ]
      },
      //raza
      'Raza': {
        portrait: 'friend2_portrait',
        messages: [
          'dialog_raza_1'
        ]
      },
      //daninja
      'Daninja': {
        portrait: 'daninja_portrait',
        messages: [
          'dialog_daninja_1'
        ]
      },
      //madeline
      'Madeline': {
        portrait: 'friend6_portrait',
        messages: [
          'dialog_madeline_1'
        ]
      },
      //Nolan (friend5)
      'Nolan': {
        portrait: 'friend5_portrait',
        messages: [
          'dialog_nolan_1'
        ]
      },
      //Anne (friend7)
      'Anne': {
        portrait: 'friend7_portrait',
        messages: [
          'dialog_anne_1'
        ]
      },
      //bố (friend9)
      'bố': {
        portrait: 'friend9_portrait',
        messages: [
          'dialog_bo_1'
        ]
      },
      //mẹ (mom)
      'mẹ': {
        portrait: 'mom_portrait',
        messages: [
          'dialog_me_1'
        ]
      },
      'Nat': {
        portrait: 'friend10_portrait',
        messages: [
          'dialog_nat_1'
        ]
      },
      //Khoa (friend8)
      'Khoa': {
        portrait: 'friend8_portrait',
        messages: [
          'dialog_khoa_1'
        ]
      }
    };
    
    // Track current message index for each dog
    this.dogMessageIndex = {
      'Roti': 0,
      'Khushi': 0,
      'Danoonie': 0,
      'Raza': 0,
      'Daninja': 0,
      'Madeline': 0,
      'Nolan': 0,
      'Anne': 0,
      'bố': 0,
      'mẹ': 0,
      'Nat': 0,
      'Khoa': 0
    };
    
    // Track choice interactions (character -> choice made)
    this.characterChoices = {};
    
    // Track interaction counts for special behaviors
    this.dogInteractionCounts = {
      'Khushi': 0,
      'Danoonie': 0
    };
    
    this.setupEventListeners();
  }

  async initialize() {
    try {
      this.setupLanguageToggle();
      this.setupHoverSounds();
      
      console.log('📦 Loading game assets...');
      const sprites = await this.loadAssets();
      
      console.log('🎭 Creating game entities...');
      await this.createEntities(sprites);
      
      console.log('🚀 Starting game loop...');
      this.start();
      
      // For mobile devices, ensure audio context is resumed after user interaction
      if (this.audioManager.isMobile) {
        console.log('📱 Mobile device detected - audio will start on first interaction');
      }
      
    } catch (error) {
      ErrorHandler.handleError(error, 'Game.initialize');
      throw error;
    }
  }

  async loadAssets() {
    const { IMAGES } = CONFIG.ASSETS;
    
    // Load all images in parallel
    const [backgroundImage, playerFront, playerSide, playerMovement, playerUp, playerDown, rotiSprite, khushiSprite, meFramesSprite, friend2Sprite, friend5Sprite, friend6Sprite, friend7Sprite, friend8Sprite, friend9Sprite, friend10Sprite, momSprite, danundieSprite, jukeboxSprite, cakeSprite, daninjaSprite] = await Promise.all([
      this.assetLoader.loadImage(IMAGES.BACKGROUND),
      this.assetLoader.loadImage(IMAGES.PLAYER_FRONT),
      this.assetLoader.loadImage(IMAGES.PLAYER_SIDE),
      this.assetLoader.loadImage(IMAGES.PLAYER_MOVEMENT),
      this.assetLoader.loadImage(IMAGES.PLAYER_UP),
      this.assetLoader.loadImage(IMAGES.PLAYER_DOWN),
      this.assetLoader.loadImage(IMAGES.ROTI),
      this.assetLoader.loadImage(IMAGES.KHUSHI),
      this.assetLoader.loadImage(IMAGES.ME_FRAMES),
      this.assetLoader.loadImage(IMAGES.FRIEND2),
      this.assetLoader.loadImage(IMAGES.FRIEND5),
      this.assetLoader.loadImage(IMAGES.FRIEND6),
      this.assetLoader.loadImage(IMAGES.FRIEND7),
      this.assetLoader.loadImage(IMAGES.FRIEND8),
      this.assetLoader.loadImage(IMAGES.FRIEND9),
      this.assetLoader.loadImage(IMAGES.FRIEND10),
      this.assetLoader.loadImage(IMAGES.MOM),
      this.assetLoader.loadImage(IMAGES.DANUNDIE),
      this.assetLoader.loadImage(IMAGES.JUKEBOX),
      this.assetLoader.loadImage(IMAGES.CAKE),
      this.assetLoader.loadImage(IMAGES.DANINJA)
    ]);

    // Store loaded assets
    this.backgroundImage = backgroundImage;
    this.player.setSprites(playerFront, playerSide, playerUp, playerMovement, playerUp, playerDown);
    
    
    // Set danundie sprite
    this.danundieStreak.setSprite(danundieSprite);
    
    // Set jukebox sprite
    this.jukebox.setSprite(jukeboxSprite);
    
    // Set cake sprite
    this.cake.setSprite(cakeSprite);
    
    // Set daninja sprite
    this.daninjaReveal.setSprite(daninjaSprite);
    
    return { rotiSprite, khushiSprite, meFramesSprite, friend2Sprite, friend5Sprite, friend6Sprite, friend7Sprite, friend8Sprite, friend9Sprite, friend10Sprite, momSprite };
  }

  async createEntities(sprites) {
    const { rotiSprite, khushiSprite, meFramesSprite, friend2Sprite, friend5Sprite, friend6Sprite, friend7Sprite, friend8Sprite, friend9Sprite, friend10Sprite, momSprite } = sprites;
    
    // Create dogs with their sprites and audio
    const rotiDog = new Dog('Roti', CONFIG.DOGS.ROTI);
    rotiDog.setSprite(rotiSprite);
    rotiDog.setAudio(this.audioManager.getAudio('barkRoti'), 'barkRoti');
    
    const khushiDog = new Dog('Khushi', CONFIG.DOGS.KHUSHI);
    khushiDog.setSprite(khushiSprite);
    khushiDog.setAudio(this.audioManager.getAudio('barkKhushi'), 'barkKhushi');
    
    const meDog = new Dog('Danoonie', CONFIG.DOGS.ME);
    meDog.setSprite(meFramesSprite); // Main sprite
    meDog.setFramesSprite(meFramesSprite); // Use me_frames.png for frame animation
    meDog.setAudio(this.audioManager.getAudio('happybday'), 'happybday');
    
    // Create friend2 as simple dog entity
    const friend2 = new Dog('Raza', CONFIG.DOGS.FRIEND2);
    friend2.setSprite(friend2Sprite);
    friend2.setAudio(this.audioManager.getAudio('friend2Sound'), 'friend2Sound');
    
    
    // Create friend5 (Nolan) with 3-frame eating animation
    const friend5 = new Dog('Nolan', CONFIG.DOGS.FRIEND5);
    friend5.setSprite(friend5Sprite); // Set main sprite
    friend5.setFramesSprite(friend5Sprite); // Use same sprite for frames
    friend5.setAudio(this.audioManager.getAudio('friend5Sound'), 'friend5Sound');
    
    // Create friend6 (Madeline) with 3-frame animation
    const friend6 = new Dog('Madeline', CONFIG.DOGS.FRIEND6);
    friend6.setSprite(friend6Sprite); // Set main sprite
    friend6.setFramesSprite(friend6Sprite); // Use same sprite for frames
    friend6.setAudio(this.audioManager.getAudio('friend6Sound'), 'friend6Sound');
    // Note: Madeline's audio also plays during dialog interactions now
    
    // Create friend7 (Anne) with 2-frame animation
    const friend7 = new Dog('Anne', CONFIG.DOGS.FRIEND7);
    friend7.setSprite(friend7Sprite);
    friend7.setAudio(this.audioManager.getAudio('anneSound'), 'anneSound');
    
    // Create friend8 (Khoa) with 3-frame animation
    const friend8 = new Dog('Khoa', CONFIG.DOGS.FRIEND8);
    friend8.setSprite(friend8Sprite); // Set main sprite
    friend8.setFramesSprite(friend8Sprite); // Use same sprite for frames
    friend8.setAudio(this.audioManager.getAudio('khoaSound'), 'khoaSound');
    
    // Create friend9 (bố) with 2-frame animation
    const friend9 = new Dog('bố', CONFIG.DOGS.FRIEND9);
    friend9.setSprite(friend9Sprite);
    friend9.setAudio(this.audioManager.getAudio('boSound'), 'boSound');
    
    // Create mom (mẹ) with 2-frame animation
    const mom = new Dog('mẹ', CONFIG.DOGS.MOM);
    mom.setSprite(momSprite);
    mom.setAudio(this.audioManager.getAudio('friend3Sound'), 'friend3Sound');
    
    // Create friend10 (Nat) with 3-frame animation like Khoa
    const friend10 = new Dog('Nat', CONFIG.DOGS.FRIEND10);
    friend10.setSprite(friend10Sprite);
    friend10.setFramesSprite(friend10Sprite); // Use same sprite for frames
    friend10.setAudio(this.audioManager.getAudio('natSound'), 'natSound');
    
    console.log('🖼️ Friend2 sprite source:', friend2Sprite?.src);
    console.log('🖼️ Friend5 sprite source:', friend5Sprite?.src);
    console.log('🖼️ Friend6 sprite source:', friend6Sprite?.src);
    console.log('🖼️ Friend7 sprite source:', friend7Sprite?.src);
    console.log('🖼️ Friend8 sprite source:', friend8Sprite?.src);
    console.log('🖼️ Friend9 sprite source:', friend9Sprite?.src);
    console.log('🖼️ Mom sprite source:', momSprite?.src);
    
    
    this.dogs = [rotiDog, khushiDog, meDog, friend2, friend5, friend6, friend7, friend8, friend9, mom, friend10];
    console.log('🎮 Total dogs in array:', this.dogs.length);
    console.log('🎮 Dog names:', this.dogs.map(dog => dog.name));
  }

  setupEventListeners() {
    // Input system events
    this.inputManager.on('interact', () => {
      // Check for investigation interaction first (Nolan)
      const investigationDog = this.getNearbyInvestigationDog();
      if (investigationDog) {
        this.hidePromptSmooth(this.prompt);
        investigationDog.startInvestigation(this.audioManager);
        return;
      }
      
      // Check for hidden character interaction (Madeline)
      const hiddenDog = this.getNearbyHiddenDog();
      if (hiddenDog) {
        this.hidePromptSmooth(this.prompt);
        hiddenDog.reveal(this.audioManager);
        // Don't open dialog immediately - wait for growth animation to complete
        return;
      }

      // Then check for hidden cake
      if (this.isNearbyHiddenCake()) {
        this.hidePromptSmooth(this.prompt);
        this.cake.reveal();
        return;
      }

      // Check for dialog with any visible dog
      const nearbyDog = this.getNearbyDog();
      if (nearbyDog) {
        // If dialog is already open with the same character, check if they have only one message
        if (this.dialogContainer && this.dialogContainer.classList.contains('visible')) {
          const currentDialogName = document.getElementById('dialogName')?.textContent;
          if (currentDialogName === nearbyDog.name) {
            // Check if this character has only one message
            const dialogData = this.dogDialogs[nearbyDog.name];
            if (dialogData && dialogData.messages.length === 1) {
              // Close dialog for single-message characters when E is pressed again
              this.closeDialog();
              
              // Special case: Show choice modal for specific characters after dialog closes
              if (nearbyDog.name === 'Nolan' && !this.characterChoices[nearbyDog.name] && !nearbyDog.isEating && !nearbyDog.eatingComplete) {
                setTimeout(() => {
                  this.showChoiceModal({
                    character: 'Nolan',
                    title: language.t('nolan_request'),
                    question: language.t('let_nolan_eat'),
                    yesText: language.t('yes_eat_it'),
                    noText: language.t('no_dont_eat'),
                    onYes: () => {
                      console.log('Player chose: Let Nolan eat the mushroom');
                      nearbyDog.startEatingSequence(this.audioManager);
                    },
                    onNo: () => {
                      console.log('Player chose: Don\'t let Nolan eat the mushroom');
                      // Nolan stays normal, can be talked to again
                    }
                  });
                }, 350); // Wait for dialog close animation to complete (300ms + buffer)
              }
              // Anne's video choice modal
              else if (nearbyDog.name === 'Anne' && !this.characterChoices[nearbyDog.name]) {
                setTimeout(() => {
                  this.showChoiceModal({
                    character: 'Anne',
                    title: language.t('anne_video'),
                    question: language.t('watch_anne_video'),
                    yesText: language.t('yes_watch'),
                    noText: language.t('no_skip'),
                    onYes: () => {
                      console.log('Player chose: Watch Anne\'s video');
                      // Play friend21.mov directly (not through mail system)
                      this.playDirectVideo('videos/friend21.mov', 'Anne\'s Video');
                    },
                    onNo: () => {
                      console.log('Player chose: Skip Anne\'s video');
                      // Nothing happens, Anne stays normal
                    }
                  });
                }, 350); // Wait for dialog close animation to complete (300ms + buffer)
              }
              
              return;
            }
          }
        }
        
        this.openDialog(nearbyDog);
        return;
      }
      
      // Check for Daninja interaction (revealed)
      if (this.daninjaReveal.canTalkToDaninja(this.player)) {
        // If Daninja dialog is already open, pressing E again opens the letter modal
        if (this.isDaninjaDialogOpen) {
          this.closeDialog();
          this.openLetterModal();
          return;
        }
        
        const daninjaCharacter = { name: 'Daninja' };
        this.openDialog(daninjaCharacter);
        return;
      }
      
      // Check for tree search (hidden Daninja)
      if (this.daninjaReveal.canInteractWithTrees(this.player)) {
        this.hidePromptSmooth(this.prompt);
        this.daninjaReveal.startReveal(this.audioManager);
        // Show speech bubble when daninja appears
        this.showSpeechBubbleDaninja();
        return;
      }
      
      // Then check mailbox
      if (this.mailbox.isPlayerNearby(this.player)) {
        this.hidePromptSmooth(this.prompt);
        this.mailSystem.openMailbox();
        return;
      }
      
      // Then check jukebox
      if (this.jukebox.isPlayerInRange(this.player)) {
        this.hidePromptSmooth(this.prompt);
        this.jukeboxSystem.openJukebox();
        return;
      }
      
      // Then check revealed cake for eating
      if (this.cake.isPlayerInRange(this.player) && this.cake.isVisible() && !this.cake.isArcing) {
        this.hidePromptSmooth(this.prompt);
        const result = this.cake.eat();
        console.log('🎂 Eating cake:', result.message);
        
        // Play nolan eating sound
        const eatSound = this.audioManager.getAudio('linhEatSound');
        if (eatSound) {
          eatSound.currentTime = 0;
          eatSound.play().then(() => {
            console.log('🎵 Playing cake eating sound!');
          }).catch(e => {
            console.log('Could not play eating sound:', e);
          });
        }
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
      // Close dialog and letter modal here
      this.closeDialog();
      this.closeLetterModal();
    });

    // Secret danundie streak trigger
    this.inputManager.on('danundieStreak', () => {
      this.triggerDanundieStreak();
    });

    // Language toggle (L key)
    this.inputManager.on('toggleLanguage', () => {
      language.toggle();
      this.updateUITranslations();
      console.log(`🌐 Language switched to: ${language.getCurrentLanguage() === 'en' ? 'English' : 'Vietnamese'}`);
    });

    // Audio system events
    this.inputManager.on('audioRequested', () => {
      this.audioManager.tryStartAudio();
    });

    // Mobile touch events - close dialogs when tapping anywhere
    this.canvas.addEventListener('touchstart', (e) => {
      // Only close dialog if one is open and it's NOT a choice dialog
      if (this.dialogContainer && this.dialogContainer.classList.contains('visible')) {
        const dialogBox = document.getElementById('dialogBox');
        const hasChoices = dialogBox && dialogBox.classList.contains('has-choices');
        // Don't close if it's a choice dialog - let the choice buttons handle it
        if (!hasChoices) {
          e.preventDefault();
          this.closeDialog();
        }
      }
    });

    // Also handle clicks for desktop
    this.canvas.addEventListener('click', (e) => {
      // Only close dialog if one is open and it's NOT a choice dialog
      if (this.dialogContainer && this.dialogContainer.classList.contains('visible')) {
        const dialogBox = document.getElementById('dialogBox');
        const hasChoices = dialogBox && dialogBox.classList.contains('has-choices');
        // Don't close if it's a choice dialog - let the choice buttons handle it
        if (!hasChoices) {
          this.closeDialog();
        }
      }
    });

    // Add dialog touch/click interaction for mobile
    if (this.dialogContainer) {
      // Touch/click on dialog box to continue
      const dialogBox = this.dialogContainer.querySelector('.dialog-box');
      if (dialogBox) {
        dialogBox.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Only continue if dialog is visible and not a choice dialog
          if (this.dialogContainer.classList.contains('visible')) {
            const hasChoices = dialogBox.classList.contains('has-choices');
            if (!hasChoices) {
              // Simulate E key press to continue dialog
              this.inputManager.emit('interact');
              console.log('📱 Dialog tap - continuing conversation');
            }
          }
        });
      }
      
      // Touch/click outside dialog (on backdrop) to close
      this.dialogBackdrop.addEventListener('click', (e) => {
        if (e.target === this.dialogBackdrop) {
          this.closeDialog();
          console.log('📱 Dialog backdrop tap - closing dialog');
        }
      });
    }

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
      if (this.prompt && this.prompt.classList.contains('visible')) {
        this.updatePromptPosition();
      }
      if (this.talkPrompt && this.talkPrompt.classList.contains('visible')) {
        this.updateTalkPromptPosition();
      }
    });
  }

  setupLanguageToggle() {
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      // Update button text based on current language
      this.updateLanguageButton();
      
      langBtn.addEventListener('click', () => {
        language.toggle();
        this.updateLanguageButton();
        this.updateUITranslations();
        console.log(`🌐 Language switched to: ${language.getCurrentLanguage()}`);
        
        // Also try to start audio on mobile when user interacts with language button
        if (!this.audioManager.musicStarted) {
          this.audioManager.tryStartAudio();
        }
      });
    }
  }

  updateLanguageButton() {
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      // Show the opposite language (what it will switch TO)
      langBtn.textContent = language.getCurrentLanguage() === 'vi' ? 'EN' : 'VN';
    }
  }

  setupHoverSounds() {
    // Add hover sounds to all close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.2 });
      });
    });

    // Add hover sound to language toggle button
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      langBtn.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.2 });
      });
    }

    // Add hover sounds to video navigation arrows
    const videoNavLeft = document.getElementById('videoNavLeft');
    const videoNavRight = document.getElementById('videoNavRight');
    if (videoNavLeft) {
      videoNavLeft.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.2 });
      });
    }
    if (videoNavRight) {
      videoNavRight.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.2 });
      });
    }

    // Add hover sounds to volume controls
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
      volumeSlider.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.15 });
      });
    }

    // Add hover sound to play/pause button
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.2 });
      });
    }

    // Add hover sound to floating play/pause button
    const floatingPlayPauseBtn = document.getElementById('floatingPlayPauseBtn');
    if (floatingPlayPauseBtn) {
      floatingPlayPauseBtn.addEventListener('mouseenter', () => {
        this.audioManager.play('hoverClickSound', { volume: 0.2 });
      });
    }

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
      this.lastFrameTime = performance.now(); // Reset frame time to prevent speed-up
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    let deltaTime = currentTime - this.lastFrameTime;
    
    // Cap deltaTime to prevent speed-up after tab switching (max 33ms = ~30fps)
    deltaTime = Math.min(deltaTime, 33);
    
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
      this.updateDaninja();
      this.updateJukebox();
      this.updateCake();
      this.updatePoops();
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
      if (dog.name === 'Danoonie') {
        dog.update(this.player, happybdayAudio, bgAudio, this.audioManager);
      } else {
        dog.update(this.player, null, null, this.audioManager);
      }
    });
  }

  updateDanundie() {
    this.danundieStreak.update();
  }

  updateDaninja() {
    this.daninjaReveal.update(this.player);
  }

  updateJukebox() {
    this.jukebox.update(this.player);
  }

  updateCake() {
    this.cake.update(this.player);
  }

  updatePoops() {
    // Find Roti dog and update poop system
    const rotiDog = this.dogs.find(dog => dog.name === 'Roti');
    if (rotiDog) {
      this.poopSystem.update(rotiDog, this.player);
    }
    
    // Periodic cleanup of old poops
    if (Math.random() < 0.01) { // 1% chance each frame
      this.poopSystem.cleanup();
    }
  }

  updateUI() {
    // Update speech bubble positions if active
    if (this.isSpeechBubbleActive) {
      this.updateSpeechBubblePosition();
    }
    if (this.isSpeechBubbleDaninjaActive) {
      this.updateSpeechBubbleDaninjaPosition();
    }
    
    // Handle talk prompt for any nearby dog
    const nearbyDog = this.getNearbyDog();
    
    if (nearbyDog) {
      this.showTalkPrompt(nearbyDog);
      this.hidePrompt();
    } else if (this.daninjaReveal.canTalkToDaninja(this.player)) {
      // Show talk prompt for revealed Daninja
      this.showDaninjaTalkPrompt();
      this.hidePrompt();
    } else {
      // If no visible dog is nearby, close any open dialog
      this.closeDialog();
      this.hideTalkPrompt();
      
      // Check for investigation interaction (Nolan)
      const investigationDog = this.getNearbyInvestigationDog();
      if (investigationDog) {
        this.showInvestigationPrompt(investigationDog);
      }
      // Check for hidden character interaction (Madeline) 
      else if (this.getNearbyHiddenDog()) {
        const hiddenDog = this.getNearbyHiddenDog();
        this.showHiddenCharacterPrompt(hiddenDog);
      }
      // Check for hidden cake interaction
      else if (this.isNearbyHiddenCake()) {
        this.showHiddenCakePrompt();
      }
      // Check for tree interaction (hidden Daninja)
      else if (this.daninjaReveal.canInteractWithTrees(this.player)) {
        this.showTreeSearchPrompt();
      } else if (this.mailbox.isPlayerNearby(this.player)) {
        this.showPrompt();
      } else if (this.jukebox.isPlayerInRange(this.player)) {
        // Show prompt for jukebox
        this.showJukeboxPrompt();
      } else if (this.cake.isPlayerInRange(this.player) && this.cake.isVisible() && !this.cake.isArcing) {
        // Show prompt for eating cake
        this.showCakeEatPrompt();
      } else {
        this.hidePrompt();
      }
    }
  }

  showPrompt() {
    if (this.prompt) {
      this.prompt.textContent = language.t('press_e_check_mail');
      this.updatePromptPosition();
      this.showPromptSmooth(this.prompt);
    }
  }

  hidePrompt() {
    if (this.prompt) {
      this.hidePromptSmooth(this.prompt);
    }
  }

  updatePromptPosition() {
    const pos = this.mailbox.getPromptPosition(this.canvas);
    this.prompt.style.left = `${pos.x}px`;
    this.prompt.style.top = `${pos.y}px`;
  }

  showJukeboxPrompt() {
    if (this.prompt) {
      this.prompt.textContent = language.t('press_e_jukebox');
      this.updateJukeboxPromptPosition();
      this.showPromptSmooth(this.prompt);
    }
  }

  updateJukeboxPromptPosition() {
    const pos = this.jukebox.getPromptPosition(this.canvas);
    this.prompt.style.left = `${pos.x}px`;
    this.prompt.style.top = `${pos.y}px`;
  }

  showCakePrompt() {
    if (this.prompt) {
      this.prompt.textContent = language.t('press_e_investigate');
      this.updateCakePromptPosition();
      this.showPromptSmooth(this.prompt);
    }
  }

  updateCakePromptPosition() {
    const pos = this.cake.getPromptPosition();
    this.prompt.style.left = `${pos.x}px`;
    this.prompt.style.top = `${pos.y}px`;
  }

  showHiddenCakePrompt() {
    if (this.prompt) {
      this.prompt.textContent = language.t('press_e_investigate');
      this.updateCakePromptPosition();
      this.showPromptSmooth(this.prompt);
    }
  }

  showCakeEatPrompt() {
    if (this.prompt) {
      this.prompt.textContent = language.t('press_e_eat_cake');
      this.updateCakePromptPosition();
      this.showPromptSmooth(this.prompt);
    }
  }

  showHiddenCharacterPrompt(hiddenDog) {
    if (this.prompt && hiddenDog) {
      this.prompt.textContent = language.t('press_e_dig');
      this.updateHiddenCharacterPromptPosition(hiddenDog);
      this.showPromptSmooth(this.prompt);
    }
  }

  updateHiddenCharacterPromptPosition(hiddenDog) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (hiddenDog.x + hiddenDog.width / 2) * canvasScale;
    const y = rect.top + (hiddenDog.y - 50) * canvasScale;
    
    this.prompt.style.left = `${x}px`;
    this.prompt.style.top = `${y}px`;
  }
  
  showInvestigationPrompt(investigationDog) {
    if (this.prompt && investigationDog) {
      this.prompt.textContent = language.t('press_e_investigate');
      this.updateInvestigationPromptPosition(investigationDog);
      this.showPromptSmooth(this.prompt);
    }
  }
  
  updateInvestigationPromptPosition(investigationDog) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (investigationDog.x + investigationDog.width / 2) * canvasScale;
    const y = rect.top + (investigationDog.y - 50) * canvasScale;
    
    this.prompt.style.left = `${x}px`;
    this.prompt.style.top = `${y}px`;
  }

  showTreeSearchPrompt() {
    if (this.prompt) {
      this.prompt.textContent = language.t('press_e_search_trees');
      this.updateTreeSearchPromptPosition();
      this.showPromptSmooth(this.prompt);
    }
  }

  updateTreeSearchPromptPosition() {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + 252 * canvasScale; // Center on interaction zone
    const y = rect.top + (983 - 50) * canvasScale; // Above interaction zone
    
    this.prompt.style.left = `${x}px`;
    this.prompt.style.top = `${y}px`;
  }

  showDaninjaTalkPrompt() {
    if (this.talkPrompt) {
      this.talkPrompt.textContent = language.t('press_e_talk');
      this.updateDaninjaTalkPromptPosition();
      this.showPromptSmooth(this.talkPrompt);
    }
  }

  updateDaninjaTalkPromptPosition() {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + 317 * canvasScale; // Above Daninja
    const y = rect.top + (830 - 162 - 60) * canvasScale; // Above sprite top (moved 10px up)
    
    this.talkPrompt.style.left = `${x}px`;
    this.talkPrompt.style.top = `${y}px`;
  }

  render() {
    try {
      this.renderer.clear();
      this.renderer.drawBackground(this.backgroundImage);
      
      this.dogs.forEach(dog => {
        this.renderer.drawDog(dog);
      });
      
      // Draw jukebox
      this.renderer.drawJukebox(this.jukebox);
      
      // Draw cake (only if visible)
      if (this.cake.isVisible()) {
        this.renderer.drawCake(this.cake);
      }
      
      // Draw poops (before player so player walks over them)
      this.renderer.drawPoops(this.poopSystem);
      
      this.renderer.drawPlayer(this.player);
      
      // Draw Danundie streak on top of everything
      this.renderer.drawDanundieStreak(this.danundieStreak);
      
      // Draw Daninja reveal animation
      this.renderer.drawDaninjaReveal(this.daninjaReveal);
      
      this.renderer.drawDebugInfo(this.player, this.dogs);
      this.renderer.drawDebugCollisions(CONFIG.COLLISION_BOXES, this.player);
      
      // Debug hitboxes for hidden character interactions (only in debug mode)
      this.renderer.drawHiddenCharacterHitboxes(this.dogs);
      
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
    
    // Show speech bubble over player
    this.showSpeechBubble();
    
    console.log('🏃‍♂️ DANUNDIE STREAK TRIGGERED WITH SOUND!');
  }

  /**
   * Show speech bubble over player character
   */
  showSpeechBubble() {
    if (!this.speechBubble) return;
    
    // Mark bubble as active so it follows player
    this.isSpeechBubbleActive = true;
    
    // Position speech bubble over player
    this.updateSpeechBubblePosition();
    
    // Show the speech bubble
    this.speechBubble.style.display = 'block';
    
    // Hide it after 2 seconds
    setTimeout(() => {
      if (this.speechBubble) {
        this.speechBubble.style.display = 'none';
        this.isSpeechBubbleActive = false;
      }
    }, 2000);
  }

  /**
   * Update speech bubble position to follow player
   */
  updateSpeechBubblePosition() {
    if (!this.speechBubble) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    // Position above player character (center of player + offset above)
    const x = rect.left + (this.player.x + this.player.width / 2) * canvasScale;
    const y = rect.top + (this.player.y - 60) * canvasScale; // 60px above player
    
    this.speechBubble.style.left = `${x}px`;
    this.speechBubble.style.top = `${y}px`;
  }

  /**
   * Show Daninja speech bubble over player character
   */
  showSpeechBubbleDaninja() {
    if (!this.speechBubbleDaninja) return;
    
    // Mark bubble as active so it follows player
    this.isSpeechBubbleDaninjaActive = true;
    
    // Position speech bubble over player
    this.updateSpeechBubbleDaninjaPosition();
    
    // Show the speech bubble
    this.speechBubbleDaninja.style.display = 'block';
    
    // Hide it after 2 seconds
    setTimeout(() => {
      if (this.speechBubbleDaninja) {
        this.speechBubbleDaninja.style.display = 'none';
        this.isSpeechBubbleDaninjaActive = false;
      }
    }, 2000);
  }

  /**
   * Update Daninja speech bubble position to follow player
   */
  updateSpeechBubbleDaninjaPosition() {
    if (!this.speechBubbleDaninja) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    // Position above player character (center of player + offset above)
    const x = rect.left + (this.player.x + this.player.width / 2) * canvasScale;
    const y = rect.top + (this.player.y - 60) * canvasScale; // 60px above player
    
    this.speechBubbleDaninja.style.left = `${x}px`;
    this.speechBubbleDaninja.style.top = `${y}px`;
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
    return this.dogs.find(dog => dog.isPlayerInRange(this.player) && dog.canTalk());
  }

  getNearbyHiddenDog() {
    return this.dogs.find(dog => dog.isPlayerInRangeForHidden(this.player));
  }
  
  getNearbyInvestigationDog() {
    return this.dogs.find(dog => dog.isPlayerInRangeForInvestigation(this.player));
  }

  isNearbyHiddenCake() {
    return this.cake.isPlayerInRangeForHidden(this.player);
  }


  showTalkPrompt(character) {
    if (this.talkPrompt && character) {
      this.talkPrompt.textContent = language.t('press_e_talk');
      this.updateTalkPromptPosition(character);
      this.showPromptSmooth(this.talkPrompt);
    }
  }

  hideTalkPrompt() {
    if (this.talkPrompt) {
      this.hidePromptSmooth(this.talkPrompt);
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
    
    const x = rect.left + (character.x + character.width / 2) * canvasScale;
    const y = rect.top + (character.y + yOffset) * canvasScale;
    
    this.talkPrompt.style.left = `${x}px`;
    this.talkPrompt.style.top = `${y}px`;
  }

  openDialog(character) {
    if (this.dialogContainer && character) {
      // Hide all prompts when opening dialog
      this.hidePromptSmooth(this.prompt);
      this.hidePromptSmooth(this.talkPrompt);
      
      this.showDialogSmooth();
      
      // Special handling for Daninja - auto-open letter modal after 5 seconds
      if (character.name === 'Daninja') {
        this.isDaninjaDialogOpen = true;
        
        // Play Daninja interaction sound
        this.audioManager.play('daninjaIntSound');
        
        setTimeout(() => {
          // Only open letter modal if dialog is still open (user hasn't closed it)
          if (this.dialogContainer.classList.contains('visible') && this.isDaninjaDialogOpen) {
            this.closeDialog();
            this.openLetterModal();
          }
        }, 5000);
      }
      
      // Special audio handling for Danoonie (Me) - only on first interaction
      if (character.name === 'Danoonie' && this.dogInteractionCounts.Danoonie === 0) {
        const happybdayAudio = this.audioManager.getAudio('happybday');
        const bgAudio = this.audioManager.getAudio('bgMusic');
        
        if (bgAudio) {
          bgAudio.volume = 0; // Mute background music
        }
        
        if (happybdayAudio) {
          happybdayAudio.currentTime = 0;
          
          // Restore background music when Danoonie's audio ends
          happybdayAudio.onended = () => {
            if (bgAudio) {
              bgAudio.volume = 0.6; // Restore background music volume
            }
          };
          
          happybdayAudio.play().then(() => {
            console.log(`🎵 Playing special audio for ${character.name} (first interaction)`);
          }).catch(e => {
            console.log('Could not play Danoonie audio:', e);
          });
        }
      } 
      // Play sound for all other characters, respecting cooldown
      else if (character.audioKey && this.audioManager) {
        // Use AudioManager to respect cooldown system
        this.audioManager.play(character.audioKey);
        console.log(`🎭 Playing dialog sound for ${character.name} via AudioManager`);
      } else if (character.audio) {
        // Fallback to direct audio play (legacy support)
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

        // Calculate and display dialog counter
        const dialogCounterElement = document.getElementById('dialogCounter');
        if (dialogCounterElement) {
          const totalMessages = this.getTotalMessagesForCharacter(character.name);
          const currentPosition = this.getCurrentDialogPosition(character.name);
          dialogCounterElement.textContent = `${currentPosition}/${totalMessages}`;
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
        let currentIndex = this.dogMessageIndex[character.name];
        let messageKey;
        
        // Special conditional logic for Nat based on cake state
        if (character.name === 'Nat') {
          if (this.cake.isEaten) {
            // Cake has been eaten - use the "you ate the whole cake" message
            messageKey = 'dialog_nat_2';
          } else {
            // Cake hasn't been found/eaten yet - use original message  
            messageKey = 'dialog_nat_1';
          }
        } else {
          // Regular dialog cycling for other characters
          messageKey = dialogData.messages[currentIndex];
        }
        
        const currentMessage = language.t(messageKey);
        
        // Advance to next message for next interaction
        this.dogMessageIndex[character.name] = (currentIndex + 1) % dialogData.messages.length;
        
        // Track interactions for special behaviors
        if (character.name === 'Khushi') {
          this.dogInteractionCounts.Khushi++;
          console.log(`🐱 Khushi interaction count: ${this.dogInteractionCounts.Khushi}`);
          
          // If player previously chose "No" and this is their next interaction, make her disappear
          if (this.characterChoices['Khushi'] === 'no' && !character.isVanished && !character.isFading) {
            console.log('Player chose No before - Khushi disappearing on next interaction');
            this.audioManager.play('khushiByeSound');
            character.startFadeOut(this.audioManager);
            return;
          }
          
          // Show choice modal at 5th interaction instead of auto-fading
          if (this.dogInteractionCounts.Khushi >= 5 && !character.isVanished && !character.isFading) {
            setTimeout(() => {
              this.showChoiceModal({
                character: 'Khushi',
                title: language.t('bothering_khushi'),
                question: language.t('bother_khushi_question'),
                yesText: language.t('yes_keep_bothering'),
                noText: language.t('no_leave_alone'),
                onYes: () => {
                  console.log('Player chose: Keep bothering Khushi - starting disappearance');
                  // Play goodbye sound and make Khushi disappear
                  this.audioManager.play('khushiByeSound');
                  character.startFadeOut(this.audioManager);
                },
                onNo: () => {
                  console.log('Player chose: Leave Khushi alone - will disappear on next interaction');
                  // Mark that player chose "No" - she'll disappear on next interaction
                  this.characterChoices['Khushi'] = 'no';
                  this.dogInteractionCounts.Khushi = 0;
                }
              });
            }, 100); // Small delay after dialog interaction
          }
        }
        
        if (character.name === 'Danoonie') {
          this.dogInteractionCounts.Danoonie++;
          console.log(`🎵 Danoonie interaction count: ${this.dogInteractionCounts.Danoonie}`);
        }
        
        
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
      this.hideDialogSmooth();
      // Reset Daninja dialog state when closing any dialog
      this.isDaninjaDialogOpen = false;
      
      // Clear choice dialog state when closing
      const dialogBox = document.getElementById('dialogBox');
      const dialogChoices = document.getElementById('dialogChoices');
      if (dialogBox) {
        dialogBox.classList.remove('has-choices');
      }
      if (dialogChoices) {
        dialogChoices.classList.remove('visible');
        dialogChoices.style.display = 'none';
      }
    }
  }

  /**
   * Show choice dialog integrated into the dialog system
   * @param {Object} options - Choice options
   * @param {string} options.character - Character name for tracking
   * @param {string} options.title - Dialog title (unused, character name is used)
   * @param {string} options.question - Question to ask
   * @param {string} options.yesText - Text for yes button (default: "Yes")
   * @param {string} options.noText - Text for no button (default: "No")
   * @param {Function} options.onYes - Callback for yes choice
   * @param {Function} options.onNo - Callback for no choice
   */
  showChoiceModal(options) {
    if (this.characterChoices[options.character]) {
      return; // Don't show if choice already made
    }


    // Set up dialog content for choice
    const dialogName = document.getElementById('dialogName');
    const dialogText = document.getElementById('dialogText');
    const dialogChoices = document.getElementById('dialogChoices');
    const dialogChoiceYes = document.getElementById('dialogChoiceYes');
    const dialogChoiceNo = document.getElementById('dialogChoiceNo');
    const dialogBox = document.getElementById('dialogBox');
    const dialogPortrait = document.getElementById('dialogPortrait');

    if (dialogName) dialogName.textContent = options.character;
    if (dialogText) dialogText.textContent = options.question || language.t('make_choice');
    if (dialogChoiceYes) dialogChoiceYes.textContent = options.yesText || language.t('yes');
    if (dialogChoiceNo) dialogChoiceNo.textContent = options.noText || language.t('no');

    // Update counter for choice dialog (this is the final message)
    const dialogCounterElement = document.getElementById('dialogCounter');
    if (dialogCounterElement) {
      const totalMessages = this.getTotalMessagesForCharacter(options.character);
      dialogCounterElement.textContent = `${totalMessages}/${totalMessages}`; // Show final position
    }

    // Set character portrait using existing dialog system
    if (dialogPortrait && options.character) {
      const dialogData = this.dogDialogs[options.character];
      if (dialogData && dialogData.portrait) {
        // Remove existing portrait classes
        dialogPortrait.className = 'dialog-portrait';
        // Add the specific portrait class (this uses the existing CSS portrait system)
        dialogPortrait.classList.add(dialogData.portrait);
        // Clear any background image that might be set
        dialogPortrait.style.backgroundImage = '';
      }
    }

    // Dialog should already be open, just ensure it's visible
    if (this.dialogContainer && this.dialogContainer.style.display === 'none') {
      this.showDialogSmooth();
    }

    // Show choice buttons with delay for smooth transition
    if (dialogChoices && dialogBox) {
      // Add has-choices class immediately to protect from clicks
      dialogBox.classList.add('has-choices');
      dialogChoices.style.display = 'flex';
      setTimeout(() => {
        dialogChoices.classList.add('visible');
      }, 300); // Delay for smooth text-to-choices transition
    }

    // Set up event handlers (remove old ones first)
    const newYesButton = dialogChoiceYes.cloneNode(true);
    const newNoButton = dialogChoiceNo.cloneNode(true);
    dialogChoiceYes.parentNode.replaceChild(newYesButton, dialogChoiceYes);
    dialogChoiceNo.parentNode.replaceChild(newNoButton, dialogChoiceNo);

    newYesButton.addEventListener('click', () => {
      this.characterChoices[options.character] = 'yes';
      this.closeChoiceDialog();
      if (options.onYes) options.onYes();
    });

    newNoButton.addEventListener('click', () => {
      this.characterChoices[options.character] = 'no';
      this.closeChoiceDialog();
      if (options.onNo) options.onNo();
    });
    
    // Add hover sound effects to choice buttons
    newYesButton.addEventListener('mouseenter', () => {
      this.audioManager.play('hoverClickSound', { volume: 0.2 });
    });

    newNoButton.addEventListener('mouseenter', () => {
      this.audioManager.play('hoverClickSound', { volume: 0.2 });
    });
  }


  /**
   * Close the choice dialog and reset state
   */
  closeChoiceDialog() {
    const dialogChoices = document.getElementById('dialogChoices');
    const dialogBox = document.getElementById('dialogBox');

    if (dialogChoices) {
      dialogChoices.classList.remove('visible');
      setTimeout(() => {
        dialogChoices.style.display = 'none';
        if (dialogBox) {
          dialogBox.classList.remove('has-choices');
        }
        this.closeDialog();
      }, 300); // Match transition timing
    }
  }

  /**
   * Get total number of messages for a character (including choice dialogs)
   * @param {string} characterName - Character name
   * @returns {number} Total message count
   */
  getTotalMessagesForCharacter(characterName) {
    const dialogData = this.dogDialogs[characterName];
    if (!dialogData) return 1;

    let total = dialogData.messages.length;
    
    // Add 1 for choice dialogs (Anne, Nolan)
    if ((characterName === 'Anne' || characterName === 'Nolan') && !this.characterChoices[characterName]) {
      total += 1; // Choice dialog counts as additional message
    }
    
    return total;
  }

  /**
   * Get current dialog position for a character
   * @param {string} characterName - Character name
   * @returns {number} Current position (1-based)
   */
  getCurrentDialogPosition(characterName) {
    const currentIndex = this.dogMessageIndex[characterName] || 0;
    return currentIndex + 1; // Convert to 1-based
  }

  /**
   * Close the choice modal (legacy compatibility)
   */
  closeChoiceModal() {
    this.closeChoiceDialog();
  }

  /**
   * Play a video directly (bypassing mail system)
   * @param {string} videoSrc - Path to video file
   * @param {string} title - Video title
   */
  playDirectVideo(videoSrc, title) {
    try {
      const videoModal = document.getElementById('videoModal');
      const videoPlayer = document.getElementById('videoPlayer');
      const videoSenderName = document.getElementById('videoSenderName');
      const videoProgress = document.getElementById('videoProgress');

      if (!videoModal || !videoPlayer || !videoSenderName || !videoProgress) {
        console.error('Video elements not found');
        return;
      }

      // Set video properties
      videoSenderName.textContent = title;
      videoProgress.textContent = ''; // No progress for direct videos
      videoPlayer.style.transform = ''; // No rotation for direct videos
      videoPlayer.src = videoSrc;

      // Hide navigation arrows for direct videos
      const leftArrow = document.getElementById('videoNavLeft');
      const rightArrow = document.getElementById('videoNavRight');
      if (leftArrow) {
        leftArrow.classList.add('hidden');
        leftArrow.style.display = '';  // Clear inline style
      }
      if (rightArrow) {
        rightArrow.classList.add('hidden');
        rightArrow.style.display = '';  // Clear inline style
      }

      // Show modal and manage audio
      videoModal.style.display = 'flex';
      
      if (this.audioManager.musicStarted) {
        this.audioManager.setVolume('bgMusic', 0);
      }
      
      // Play video
      const playPromise = videoPlayer.play();
      if (playPromise) {
        playPromise
          .then(() => {
            console.log(`🎬 Playing direct video: ${title}`);
          })
          .catch(e => {
            console.error('Error playing direct video:', e);
          });
      }

      // Setup video end handler
      videoPlayer.onended = () => {
        if (this.audioManager.musicStarted) {
          this.audioManager.setVolume('bgMusic', 0.6);
        }
      };

    } catch (error) {
      console.error('Error in playDirectVideo:', error);
    }
  }

  /**
   * Open the letter modal
   */
  openLetterModal() {
    const letterModal = document.getElementById('letterModal');
    if (letterModal) {
      letterModal.style.display = 'flex';
      
      // Setup close button functionality - be specific to letter modal only
      const closeBtn = letterModal.querySelector('.letter-header .close-btn');
      if (closeBtn) {
        closeBtn.onclick = () => this.closeLetterModal();
      }
      
      // Setup backdrop click to close - use addEventListener instead of onclick
      const backdropHandler = (e) => {
        const letterContainer = letterModal.querySelector('.letter-container');
        if (letterContainer && !letterContainer.contains(e.target)) {
          this.closeLetterModal();
        }
      };
      letterModal.addEventListener('click', backdropHandler, { once: true });
      
      console.log('📝 Letter modal opened!');
    }
  }

  /**
   * Close the letter modal
   */
  closeLetterModal() {
    const letterModal = document.getElementById('letterModal');
    if (letterModal) {
      letterModal.style.display = 'none';
      console.log('📝 Letter modal closed!');
    }
  }

  drawHiddenCharacterHitboxes() {
    // Draw interaction hitboxes for hidden characters only
    this.dogs.forEach(dog => {
      if (dog.isHidden && !dog.hasBeenRevealed && !dog.isGrowing) {
        const ctx = this.renderer.ctx;
        const threshold = CONFIG.DOGS.INTERACTION_DISTANCE;
        
        // Calculate hitbox bounds
        const centerX = dog.x + dog.width / 2;
        const centerY = dog.y + dog.height / 2;
        const hitboxX = centerX - threshold;
        const hitboxY = centerY - threshold;
        const hitboxWidth = threshold * 2;
        const hitboxHeight = threshold * 2;
        
        // Draw hitbox
        ctx.save();
        ctx.strokeStyle = '#FF00FF'; // Bright magenta
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
        
        // Draw center point
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
        
        // Draw character name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.fillText(dog.name, hitboxX, hitboxY - 5);
        
        ctx.restore();
      }
    });
  }

  /**
   * Update UI translations when language is toggled
   */
  updateUITranslations() {
    // Update Birthday Mailbox header
    const mailboxHeaderSpan = document.querySelector('.mail-container .mail-header span:first-child');
    if (mailboxHeaderSpan) {
      mailboxHeaderSpan.textContent = language.t('birthday_mailbox');
    }
    
    // Update letter title "30 Things I Love About You"
    const letterTitle = document.querySelector('.letter-title');
    if (letterTitle) {
      letterTitle.textContent = language.t('letter_title_30_things');
    }
    
    // Update any visible talk prompts
    if (this.talkPrompt && this.talkPrompt.classList.contains('visible')) {
      this.talkPrompt.textContent = language.t('press_e_talk');
    }
  }

  /**
   * Show prompt with smooth fade transition
   */
  showPromptSmooth(element) {
    if (element) {
      element.style.display = 'block';
      // Force a repaint before adding the class
      element.offsetHeight;
      element.classList.add('visible');
    }
  }

  /**
   * Hide prompt with smooth fade transition
   */
  hidePromptSmooth(element) {
    if (element) {
      element.classList.remove('visible');
      // Wait for transition to complete before hiding
      setTimeout(() => {
        if (!element.classList.contains('visible')) {
          element.style.display = 'none';
        }
      }, 400); // Match CSS transition duration
    }
  }

  /**
   * Show dialog with smooth slide up animation
   */
  showDialogSmooth() {
    if (this.dialogContainer) {
      // Show backdrop first
      if (this.dialogBackdrop) {
        this.dialogBackdrop.style.display = 'block';
        this.dialogBackdrop.offsetHeight; // Force repaint
        this.dialogBackdrop.classList.add('visible');
      }
      
      this.dialogContainer.style.display = 'block';
      // Force a repaint before adding the class
      this.dialogContainer.offsetHeight;
      this.dialogContainer.classList.add('visible');
    }
  }

  /**
   * Hide dialog with smooth slide down animation
   */
  hideDialogSmooth() {
    if (this.dialogContainer) {
      // Hide backdrop
      if (this.dialogBackdrop) {
        this.dialogBackdrop.classList.remove('visible');
      }
      
      this.dialogContainer.classList.remove('visible');
      this.dialogContainer.classList.add('hiding');
      // Wait for animation to complete before hiding
      setTimeout(() => {
        if (this.dialogContainer.classList.contains('hiding')) {
          this.dialogContainer.style.display = 'none';
          this.dialogContainer.classList.remove('hiding');
          
          // Hide backdrop completely after dialog is hidden
          if (this.dialogBackdrop) {
            this.dialogBackdrop.style.display = 'none';
          }
        }
      }, 300); // Match CSS animation duration
    }
  }

  /**
   * Show jukebox with smooth slide up animation
   */
  showJukeboxSmooth() {
    const jukeboxContainer = document.getElementById('jukeboxContainer');
    if (jukeboxContainer) {
      jukeboxContainer.style.display = 'block';
      // Force a repaint before adding the class
      jukeboxContainer.offsetHeight;
      jukeboxContainer.classList.add('visible');
    }
  }

  /**
   * Hide jukebox with smooth slide down animation
   */
  hideJukeboxSmooth() {
    const jukeboxContainer = document.getElementById('jukeboxContainer');
    if (jukeboxContainer) {
      jukeboxContainer.classList.remove('visible');
      jukeboxContainer.classList.add('hiding');
      // Wait for animation to complete before hiding
      setTimeout(() => {
        if (jukeboxContainer.classList.contains('hiding')) {
          jukeboxContainer.style.display = 'none';
          jukeboxContainer.classList.remove('hiding');
        }
      }, 400); // Match CSS animation duration
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