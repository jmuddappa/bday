/**
 * Game Configuration
 * Central location for all game constants and settings
 */

export const CONFIG = {
  // Canvas settings
  CANVAS: {
    WIDTH: 1094,
    HEIGHT: 1112
  },
  
  // Player configuration
  PLAYER: {
    INITIAL_X: 465,
    INITIAL_Y: 210,
    SPEED: 2,
    WIDTH: 16,
    HEIGHT: 32,
    SPRITE_WIDTH: 80,
    SPRITE_HEIGHT: 120,
    SPRITE_HEIGHT_UP: 135,
    // Walking animation config
    WALK_FRAME_WIDTH: 475,
    WALK_FRAME_HEIGHT: 637,
    WALK_ANIMATION_SPEED: 15, // frames between animation changes (slower)
    UP_ANIMATION_SPEED: 15, // frames between up animation changes (same as horizontal)
    DOWN_ANIMATION_SPEED: 15, // frames between down animation changes
    // Shadow config
    SHADOW_WIDTH: 60,
    SHADOW_HEIGHT: 20,
    SHADOW_OFFSET_Y: 8
  },

  // Mailbox configuration
  MAILBOX: {
    X: 750,
    Y: 330,
    INTERACTION_DISTANCE: 120,
    PROMPT_OFFSET_X: -5,
    PROMPT_OFFSET_Y: -180
  },

  // Jukebox configuration
  JUKEBOX: {
    X: 595, 
    Y: 220, // 50px down  
    INTERACTION_DISTANCE: 120,
    PROMPT_OFFSET_X: -5,
    PROMPT_OFFSET_Y: -100, 
    WIGGLE_SPEED: 0.01,
    WIGGLE_AMPLITUDE: 3,
    SCALE: 0.13
  },

  // Cake configuration
  CAKE: {
    X: 900,
    Y: 700,
    INTERACTION_DISTANCE: 120,
    PROMPT_OFFSET_X: 200,
    PROMPT_OFFSET_Y: 50,
    ROTATION_SPEED: 0.02,
    SCALE: 0.07
  },

  // Dog behavior settings
  DOGS: {
    INTERACTION_DISTANCE: 100,
    ME_INTERACTION_DISTANCE: 100, // Same as others instead of 150
    NAT_INTERACTION_DISTANCE: 120, // 20px larger hitbox for earlier animation
    KHOA_INTERACTION_DISTANCE: 130, // 30px larger hitbox for Khoa
    NOLAN_INTERACTION_DISTANCE: 140, // 40px larger hitbox for Nolan
    ROTI: {
      x: 300, y: 400, scale: 0.12,
      width: 450, height: 800,
      sitFrame: { sx: 1064, sy: 321 },
      jumpFrame: { sx: 417, sy: 175 },
      jumpOffsetY: -20,
      shadowWidth: 40, shadowHeight: 15, shadowOffsetY: 20
    },
    KHUSHI: {
      x: 150, y: 250, scale: 0.1,
      width: 700, height: 740,
      sitFrame: { sx: 789, sy: 186 },
      jumpFrame: { sx: 55, sy: 177 },
      shadowWidth: 50, shadowHeight: 18, shadowOffsetY: 8
    },
    ME: {
      x: 860, y: 405, scale: 0.55,
      width: 200, height: 300, // Much smaller hitbox dimensions
      // 3-frame animation system
      totalWidth: 1800, // Total sprite width (600px per frame * 3 frames)
      frameHeight: 879, // Source frame height
      sitFrame: { sx: 1200, sy: 0 },      // Frame 1: 1200-1800px (static)
      transitionFrame: { sx: 600, sy: 0 }, // Frame 2: 600-1200px
      jumpFrame: { sx: 0, sy: 0 },         // Frame 3: 0-600px
      animationSpeed: 8, // frames between transitions
      shadowWidth: 70, shadowHeight: 25, shadowOffsetY: 10
    },
    //raza
    FRIEND2: {
      x: 900, y: 150, scale: 1.5,
      width: 80, height: 120,
      sitFrame: { sx: 0, sy: 0 },
      jumpFrame: { sx: 0, sy: 0 }, // Same as sit - no animation
      shadowWidth: 40, shadowHeight: 15, shadowOffsetY: 8
    },
    //madeline
    FRIEND6: {
      x: 470, y: 720, scale: 0.22, // Moved left 5px and up 10px
      width: 400, height: 650, // Source dimensions for each frame (correct 400px width)
      // 3-frame animation system
      totalWidth: 1200, // Total sprite width (300px per frame * 4 frames)
      frameHeight: 650, // Source frame height
      sitFrame: { sx: 300, sy: 0 },      // Frame 1 at 300px
      transitionFrame: { sx: 600, sy: 0 }, // Frame 2 at 600px  
      jumpFrame: { sx: 900, sy: 0 },      // Frame 3 at 900px
      animationSpeed: 14, // 15% slower than 12 (12 * 1.15 ≈ 14)
      // Frame position offsets - all frames render at exact same position (centered in sprite)
      sitFrameOffset: { x: 0, y: 0 },        // Frame 1 - no offset
      transitionFrameOffset: { x: 0, y: 0 }, // Frame 2 - no offset  
      jumpFrameOffset: { x: 0, y: 0 },       // Frame 3 - no offset
      shadowWidth: 20, shadowHeight: 8, shadowOffsetY: 4, // Smaller shadow
      // Special behavior - starts hidden
      startsHidden: true
    },
    //Nolan
    FRIEND5: {
      x: 720, y: 720, scale: 0.25,
      width: 400, height: 460, // Source dimensions for each frame (400x460 each)
      // 3-frame animation system for eating sequence
      totalWidth: 1200, // Total sprite width (400px per frame * 3 frames)
      frameHeight: 460, // Source frame height
      sitFrame: { sx: 0, sy: 0 },        // Frame 1: 0-400px (normal)
      transitionFrame: { sx: 400, sy: 0 }, // Frame 2: 400-800px (eating)
      jumpFrame: { sx: 800, sy: 0 },    // Frame 3: 800-1200px (finished eating)
      animationSpeed: 30, // Much slower animation to see each frame clearly
      // Frame position offsets - all frames render at exact same position
      sitFrameOffset: { x: 0, y: 0 },        // Frame 1 - no offset
      transitionFrameOffset: { x: 0, y: 0 }, // Frame 2 - no offset  
      jumpFrameOffset: { x: 0, y: 0 },       // Frame 3 - no offset
      shadowWidth: 25, shadowHeight: 10, shadowOffsetY: 5,
      // Special behavior - starts hidden and needs investigation
      startsHidden: true,
      needsInvestigation: true
    },
    //Khoa
    FRIEND8: {
      x: 900, y: 850, scale: 0.35, // Reduced by another 30% (0.56 * 0.7 ≈ 0.39)
      width: 500, height: 527, // Source dimensions for each frame (500x527 each)
      // 3-frame animation system
      totalWidth: 1500, // Total sprite width (500px per frame * 3 frames)
      frameHeight: 527, // Source frame height
      sitFrame: { sx: 0, sy: 0 },        // Frame 1: 0-500px
      transitionFrame: { sx: 500, sy: 0 }, // Frame 2: 500-1000px  
      jumpFrame: { sx: 1000, sy: 0 },    // Frame 3: 1000-1500px
      animationSpeed: 12, // Animation timing
      // Frame position offsets - frame 2 and 3 offset left by 5px
      sitFrameOffset: { x: 0, y: 0 },        // Frame 1 - no offset
      transitionFrameOffset: { x: -5, y: 0 }, // Frame 2 - 5px left
      jumpFrameOffset: { x: -5, y: 0 },       // Frame 3 - 5px left
      shadowWidth: 0, shadowHeight: 0, shadowOffsetY: 0
    },
    //Anne
    FRIEND7: {
      x: 33, y: 320, scale: 0.6,
      width: 256, height: 256,
      sitFrame: { sx: 0, sy: 0 },      // Frame 1: 0-256px
      jumpFrame: { sx: 256, sy: 0 },   // Frame 2: 256-512px
      shadowWidth: 40, shadowHeight: 15, shadowOffsetY: 8
    },
    //Friend9
    FRIEND9: {
      x: 10, y: 480, scale: 0.33,
      width: 350, height: 512,
      sitFrame: { sx: 0, sy: 0 },      // Frame 1: 0-350px
      jumpFrame: { sx: 350, sy: 0 },   // Frame 2: 350-700px
      shadowWidth: 40, shadowHeight: 15, shadowOffsetY: 8
    },
    //Mom
    MOM: {
      x: 120, y: 655, scale: 0.3,
      width: 350, height: 512,
      sitFrame: { sx: 0, sy: 0 },      // Frame 1: 0-350px
      jumpFrame: { sx: 350, sy: 0 },   // Frame 2: 350-700px
      shadowWidth: 40, shadowHeight: 15, shadowOffsetY: 8
    },
    //Nat
    FRIEND10: {
      x: 940, y: 250, scale: 0.5,
      width: 300, height: 500, // Source dimensions for each frame (300x500 each)
      // 3-frame animation system like Khoa
      totalWidth: 900, // Total sprite width (300px per frame * 3 frames)
      frameHeight: 500, // Source frame height
      sitFrame: { sx: 0, sy: 0 },        // Frame 1: 0-300px (static)
      transitionFrame: { sx: 300, sy: 0 }, // Frame 2: 300-600px  
      jumpFrame: { sx: 600, sy: 0 },    // Frame 3: 600-900px
      animationSpeed: 18, // 40% slower than 12 (12 * 1.4 = 16.8 ≈ 17)
      // Frame position offsets - all frames render at exact same position
      sitFrameOffset: { x: 0, y: 0 },        // Frame 1 - no offset
      transitionFrameOffset: { x: 0, y: 0 }, // Frame 2 - no offset
      jumpFrameOffset: { x: 0, y: 0 },       // Frame 3 - no offset
      shadowWidth: 45, shadowHeight: 15, shadowOffsetY: 8
    }
  },

  // Asset paths
  ASSETS: {
    IMAGES: {
      BACKGROUND: 'assets/images/background.png',
      PLAYER_FRONT: 'assets/images/player2.png',
      PLAYER_SIDE: 'assets/images/player2side.png',
      PLAYER_MOVEMENT: 'assets/images/movement.png',
      PLAYER_UP: 'assets/images/up.png',
      PLAYER_DOWN: 'assets/images/down.png',
      ROTI: 'assets/images/roti.png',
      KHUSHI: 'assets/images/khushi.png',
      ME: 'assets/images/me.png',
      ME_FRAMES: 'assets/images/me_frames.png',
      FRIEND2: 'assets/images/friends/friend2.png',
      FRIEND5: 'assets/images/friends/friend5.png',
      FRIEND6: 'assets/images/friends/friend6.png',
      FRIEND7: 'assets/images/friends/friend7.png',
      FRIEND8: 'assets/images/friends/friend8.png',
      FRIEND9: 'assets/images/friends/friend9.png',
      FRIEND10: 'assets/images/friends/friend10.png',
      MOM: 'assets/images/friends/mom.png',
      DANUNDIE: 'assets/images/danundie.png',
      JUKEBOX: 'assets/images/jukebox.png',
      DANINJA: 'assets/images/daninja.png',
      CAKE: 'assets/images/cake.png'
    },
    AUDIO: {
      BG_MUSIC: 'assets/audio/bg.mp3',
      BARK_ROTI: 'assets/audio/roti.mp3',
      BARK_KHUSHI: 'assets/audio/khushi.mp3',
      HAPPY_BDAY: 'assets/audio/me.m4a',
      MAIL_SOUND: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+zPDTgjMGHm7A7+OZURE'
    }
  },

  // Game physics and collision
  COLLISION_BOXES: [
    { x: 0, y: 0, width: 1094, height: 30 },
    { x: 0, y: 0, width: 10, height: 1112 },
    { x: 1030, y: 0, width: 30, height: 1112 },
    { x: 0, y: 860, width: 600, height: 300 },
    { x: 0, y: 950, width: 1200, height: 300 },
    { x: 0, y: 170, width: 1200, height: 10 },
    { x: 550, y: 0, width: 10, height: 300 },
    { x: 700, y: 0, width: 10, height: 300 },
    { x: 560, y: 300, width: 225, height: 10 },
    { x: 200, y: 0, width: 10, height: 300 },
    { x: 380, y: 260, width: 5, height: 50 },
    { x: 930, y: 450, width: 130, height: 350 },
    { x: 0, y: 300, width: 370, height: 10 },
    { x: 0, y: 260, width: 370, height: 10 }
  ],

  // Performance settings
  PERFORMANCE: {
    TARGET_FPS: 60,
    BUMP_SOUND_COOLDOWN: 150
  },

  // Audio settings
  AUDIO: {
    DEFAULT_VOLUME: 0.6,
    BUMP_VOLUME: 0.4,
    MAIL_VOLUME: 0.5
  }
};