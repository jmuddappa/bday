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
    
    // Game entities
    this.player = new Player();
    this.dogs = [];
    this.mailbox = new Mailbox();
    this.jukebox = new Jukebox();
    this.cake = new Cake();
    this.danundieStreak = new DanundieStreak();
    this.daninjaReveal = new DaninjaReveal();
    
    // UI elements
    this.prompt = document.getElementById('prompt');
    this.talkPrompt = document.getElementById('talkPrompt');
    this.speechBubble = document.getElementById('speechBubble');
    this.speechBubbleDaninja = document.getElementById('speechBubbleDaninja');
    this.dialogContainer = document.getElementById('dialogContainer');
    this.choiceModal = document.getElementById('choiceModal');
    this.audioStatus = document.getElementById('audioStatus');
    
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
          "Thank you for adopting me, despite what papa said about my ugly nose! (Cảm ơn vì đã nhận nuôi con, mặc dù bố nói mũi con xấu!)",
          "I'm sorry I dug up your vegetables. You should go check those empty spots out! (Con yêu bạn hơn cả mạng sống của mình)",
          "Can I crawl inside you?! (Con có thể chui vào trong người bạn không?!)",
          "I just pissed and pooped on the rug inside! (Con vừa đi tiểu và đại tiện lên thảm trong nhà!)"
        ]
      },
      'Khushi': {
        portrait: 'khushi',
        messages: [
          "hmm? is something special about today? (hmm? hôm nay có gì đặc biệt không?)",
          "sup? (sao?)",
          "um, can you give me some space? (ừm... cho tôi chút không gian được không)",
          "... (...)"
        ]
      },
      'Danoonie': {
        portrait: 'me',
        messages: [
          "Don't move or else I'll stop singing and we have to start this all over again & torture our guests. (Đừng di chuyển không thì tôi sẽ ngừng hát và chúng ta phải bắt đầu lại từ đầu & tra tấn khách của chúng ta.)",
          "I am your farm husband! I just stand here all day and watch you farm - realistic right? (Tôi là chồng nông trại của bạn! Tôi chỉ đứng đây cả ngày và xem bạn làm nông - thực tế đúng không?)",
          "Wanna see something cool? Press ; to see the collision boxes that prevent you from bumping into things! (Muốn thấy điều gì đó thú vị không? Nhấn ; để xem các hộp va chạm ngăn bạn đâm vào đồ vật!)",
          "I love you! Happy birthday Lindo. (Anh yêu em! Chúc mừng sinh nhật Lindo.)"
        ]
      },
      //raza
      'Raza': {
        portrait: 'friend2_portrait',
        messages: [
          "This isn't as nice as a river but I still appreciate the view. (Đây không đẹp bằng một dòng sông nhưng tôi vẫn thích cảnh này.)"
        ]
      },
      //daninja
      'Daninja': {
        portrait: 'daninja_portrait',
        messages: [
          "I trained in these very trees for years. Now I emerge for your special day to deliver this letter from Danoonie! (Đây, hãy lấy lá thư này! Tôi đã luyện tập trong những cây này nhiều năm. Giờ tôi xuất hiện trong ngày đặc biệt của bạn để gửi lá thư này từ Danoonie!)"
        ]
      },
      //madeline
      'Madeline': {
        portrait: 'friend6_portrait',
        messages: [
          "Despite you never watering me, I still somehow grew to be healthy, thank you for nothing & happy birthday!!"
        ]
      },
      //Nolan (friend5)
      'Nolan': {
        portrait: 'friend5_portrait',
        messages: [
          "I am going to eat this *gobble* *gobble*"
        ]
      },
      //Anne (friend7)
      'Anne': {
        portrait: 'friend7_portrait',
        messages: [
          "HOLY FUCK GIRL ITS YOUR BDAY! I MADE YOU SOMETHING REALLY COOL WANNA SEE?"
        ]
      },
      //bố (friend9)
      'bố': {
        portrait: 'friend9_portrait',
        messages: [
          "Thương con, mẹ gọt trái ngọt, trao từng miếng yêu thương."
        ]
      },
      //mẹ (mom)
      'mẹ': {
        portrait: 'mom_portrait',
        messages: [
          "Sinh nhật vui vẻ, nhớ ăn rau nhé con!"
        ]
      },
      'Nat': {
        portrait: 'friend10_portrait',
        messages: [
          "Happy Birthday!"
        ]
      },
      //Khoa (friend8)
      'Khoa': {
        portrait: 'friend8_portrait',
        messages: [
          "Hey sister! I've been working real hard on the right words to say to you and this is what I have so far: 'live, laugh, love!'"
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
    // Note: Madeline's audio plays only during reveal, not during regular interactions
    
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
        investigationDog.startInvestigation(this.audioManager);
        return;
      }
      
      // Check for hidden character interaction (Madeline)
      const hiddenDog = this.getNearbyHiddenDog();
      if (hiddenDog) {
        hiddenDog.reveal(this.audioManager);
        // Don't open dialog immediately - wait for growth animation to complete
        return;
      }

      // Then check for hidden cake
      if (this.isNearbyHiddenCake()) {
        this.cake.reveal();
        return;
      }

      // Check for dialog with any visible dog
      const nearbyDog = this.getNearbyDog();
      if (nearbyDog) {
        // If dialog is already open with the same character, check if they have only one message
        if (this.dialogContainer && this.dialogContainer.style.display === 'block') {
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
                    title: 'Nolan\'s Request',
                    question: 'Let Nolan eat the mushroom?',
                    yesText: 'Yes, eat it',
                    noText: 'No, don\'t eat it',
                    onYes: () => {
                      console.log('Player chose: Let Nolan eat the mushroom');
                      nearbyDog.startEatingSequence(this.audioManager);
                    },
                    onNo: () => {
                      console.log('Player chose: Don\'t let Nolan eat the mushroom');
                      // Nolan stays normal, can be talked to again
                    }
                  });
                }, 50); // Small delay to ensure dialog is fully closed
              }
              // Anne's video choice modal
              else if (nearbyDog.name === 'Anne' && !this.characterChoices[nearbyDog.name]) {
                setTimeout(() => {
                  this.showChoiceModal({
                    character: 'Anne',
                    title: 'Anne\'s Video',
                    question: 'Do you want to watch Anne\'s video?\n⚠️ WARNING: GRAPHIC CONTENT',
                    yesText: 'Yes, watch',
                    noText: 'No, skip',
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
                }, 50); // Small delay to ensure dialog is fully closed
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
        this.daninjaReveal.startReveal(this.audioManager);
        // Show speech bubble when daninja appears
        this.showSpeechBubbleDaninja();
        return;
      }
      
      // Then check mailbox
      if (this.mailbox.isPlayerNearby(this.player)) {
        this.mailSystem.openMailbox();
        return;
      }
      
      // Then check jukebox
      if (this.jukebox.isPlayerInRange(this.player)) {
        this.jukeboxSystem.openJukebox();
        return;
      }
      
      // Then check revealed cake for eating
      if (this.cake.isPlayerInRange(this.player) && this.cake.isVisible() && !this.cake.isArcing) {
        const result = this.cake.eat();
        console.log('🎂 Eating cake:', result.message);
        
        // Play nolan eating sound
        const eatSound = this.audioManager.getAudio('nolanEatSound');
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
      this.prompt.textContent = 'Press E to check mail';
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

  showJukeboxPrompt() {
    if (this.prompt) {
      this.prompt.textContent = 'Press E for jukebox';
      this.prompt.style.display = 'block';
      this.updateJukeboxPromptPosition();
    }
  }

  updateJukeboxPromptPosition() {
    const pos = this.jukebox.getPromptPosition(this.canvas);
    this.prompt.style.left = `${pos.x}px`;
    this.prompt.style.top = `${pos.y}px`;
  }

  showCakePrompt() {
    if (this.prompt) {
      this.prompt.textContent = 'Press E to investigate';
      this.prompt.style.display = 'block';
      this.updateCakePromptPosition();
    }
  }

  updateCakePromptPosition() {
    const pos = this.cake.getPromptPosition();
    this.prompt.style.left = `${pos.x}px`;
    this.prompt.style.top = `${pos.y}px`;
  }

  showHiddenCakePrompt() {
    if (this.prompt) {
      this.prompt.textContent = 'Press E to investigate';
      this.prompt.style.display = 'block';
      this.updateCakePromptPosition();
    }
  }

  showCakeEatPrompt() {
    if (this.prompt) {
      this.prompt.textContent = 'Press E to eat cake';
      this.prompt.style.display = 'block';
      this.updateCakePromptPosition();
    }
  }

  showHiddenCharacterPrompt(hiddenDog) {
    if (this.prompt && hiddenDog) {
      this.prompt.textContent = 'Press E to Dig';
      this.prompt.style.display = 'block';
      this.updateHiddenCharacterPromptPosition(hiddenDog);
    }
  }

  updateHiddenCharacterPromptPosition(hiddenDog) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (hiddenDog.x + hiddenDog.width / 2 - 70) * canvasScale;
    const y = rect.top + (hiddenDog.y - 50) * canvasScale;
    
    this.prompt.style.left = `${x}px`;
    this.prompt.style.top = `${y}px`;
  }
  
  showInvestigationPrompt(investigationDog) {
    if (this.prompt && investigationDog) {
      this.prompt.textContent = 'Press E to investigate';
      this.prompt.style.display = 'block';
      this.updateInvestigationPromptPosition(investigationDog);
    }
  }
  
  updateInvestigationPromptPosition(investigationDog) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (investigationDog.x + investigationDog.width / 2 - 80) * canvasScale;
    const y = rect.top + (investigationDog.y - 50) * canvasScale;
    
    this.prompt.style.left = `${x}px`;
    this.prompt.style.top = `${y}px`;
  }

  showTreeSearchPrompt() {
    if (this.prompt) {
      this.prompt.textContent = 'Press E to search trees';
      this.prompt.style.display = 'block';
      this.updateTreeSearchPromptPosition();
    }
  }

  updateTreeSearchPromptPosition() {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (252 - 70) * canvasScale; // Center on interaction zone (moved 60px left)
    const y = rect.top + (983 - 50) * canvasScale; // Above interaction zone
    
    this.prompt.style.left = `${x}px`;
    this.prompt.style.top = `${y}px`;
  }

  showDaninjaTalkPrompt() {
    if (this.talkPrompt) {
      this.talkPrompt.style.display = 'block';
      this.updateDaninjaTalkPromptPosition();
    }
  }

  updateDaninjaTalkPromptPosition() {
    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = Math.min(
      rect.width / CONFIG.CANVAS.WIDTH,
      rect.height / CONFIG.CANVAS.HEIGHT
    );
    
    const x = rect.left + (317 - 50) * canvasScale; // Above Daninja (moved 20px right)
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
      
      // Hidden character hitboxes removed for production
      
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
      
      // Special handling for Daninja - auto-open letter modal after 5 seconds
      if (character.name === 'Daninja') {
        this.isDaninjaDialogOpen = true;
        
        // Play Daninja interaction sound
        this.audioManager.play('daninjaIntSound');
        
        setTimeout(() => {
          // Only open letter modal if dialog is still open (user hasn't closed it)
          if (this.dialogContainer.style.display === 'block' && this.isDaninjaDialogOpen) {
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
      // Play sound for all other characters
      else if (character.audio) {
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
                title: 'Bothering Khushi',
                question: 'Are you sure you want to bother Khushi again?',
                yesText: 'Yes, keep bothering',
                noText: 'No, leave her alone',
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
        
        // Special behavior for Nolan - now handled in interaction logic with choice modal
        
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
      // Reset Daninja dialog state when closing any dialog
      this.isDaninjaDialogOpen = false;
    }
  }

  /**
   * Show choice modal with customizable options
   * @param {Object} options - Choice options
   * @param {string} options.character - Character name for tracking
   * @param {string} options.title - Modal title
   * @param {string} options.question - Question to ask
   * @param {string} options.yesText - Text for yes button (default: "Yes")
   * @param {string} options.noText - Text for no button (default: "No")
   * @param {Function} options.onYes - Callback for yes choice
   * @param {Function} options.onNo - Callback for no choice
   */
  showChoiceModal(options) {
    if (!this.choiceModal || this.characterChoices[options.character]) {
      return; // Don't show if choice already made
    }

    // Set modal content
    const titleElement = document.getElementById('choiceTitle');
    const questionElement = document.getElementById('choiceQuestion');
    const yesButton = document.getElementById('choiceYes');
    const noButton = document.getElementById('choiceNo');

    if (titleElement) titleElement.textContent = options.title || 'Make a Choice';
    if (questionElement) questionElement.textContent = options.question || 'What would you like to do?';
    if (yesButton) yesButton.textContent = options.yesText || 'Yes';
    if (noButton) noButton.textContent = options.noText || 'No';

    // Show modal
    this.choiceModal.classList.add('active');

    // Set up event handlers (remove old ones first)
    const newYesButton = yesButton.cloneNode(true);
    const newNoButton = noButton.cloneNode(true);
    yesButton.parentNode.replaceChild(newYesButton, yesButton);
    noButton.parentNode.replaceChild(newNoButton, noButton);

    newYesButton.addEventListener('click', () => {
      this.characterChoices[options.character] = 'yes';
      this.closeChoiceModal();
      if (options.onYes) options.onYes();
    });

    newNoButton.addEventListener('click', () => {
      this.characterChoices[options.character] = 'no';
      this.closeChoiceModal();
      if (options.onNo) options.onNo();
    });
  }

  /**
   * Close the choice modal
   */
  closeChoiceModal() {
    if (this.choiceModal) {
      this.choiceModal.classList.remove('active');
    }
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
      const videoTitle = document.getElementById('videoTitle');

      if (!videoModal || !videoPlayer || !videoTitle) {
        console.error('Video elements not found');
        return;
      }

      // Set video properties
      videoTitle.textContent = title;
      videoPlayer.style.transform = ''; // No rotation for direct videos
      videoPlayer.src = videoSrc;

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