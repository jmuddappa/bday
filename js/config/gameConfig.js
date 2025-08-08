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
    SPRITE_HEIGHT_UP: 135
  },

  // Mailbox configuration
  MAILBOX: {
    X: 750,
    Y: 330,
    INTERACTION_DISTANCE: 120,
    PROMPT_OFFSET_X: -5,
    PROMPT_OFFSET_Y: -180
  },

  // Dog behavior settings
  DOGS: {
    INTERACTION_DISTANCE: 100,
    ME_INTERACTION_DISTANCE: 150,
    ROTI: {
      x: 300, y: 400, scale: 0.12,
      width: 450, height: 800,
      sitFrame: { sx: 1064, sy: 321 },
      jumpFrame: { sx: 417, sy: 175 },
      jumpOffsetY: -20
    },
    KHUSHI: {
      x: 150, y: 250, scale: 0.1,
      width: 700, height: 740,
      sitFrame: { sx: 789, sy: 186 },
      jumpFrame: { sx: 55, sy: 177 }
    },
    ME: {
      x: 860, y: 432, scale: 0.19,
      width: 550, height: 900,
      sitFrame: { sx: 541, sy: 77 },
      jumpFrame: { sx: 2, sy: 62 },
      jumpOffsetX: -15,
      jumpOffsetY: -3
    }
  },

  // Asset paths
  ASSETS: {
    IMAGES: {
      BACKGROUND: 'assets/images/background.png',
      PLAYER_FRONT: 'assets/images/player2.png',
      PLAYER_SIDE: 'assets/images/player2side.png',
      PLAYER_BACK: 'assets/images/playerback.png',
      ROTI: 'assets/images/roti.png',
      KHUSHI: 'assets/images/khushi.png',
      ME: 'assets/images/me.png'
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
    { x: 560, y: 300, width: 270, height: 10 },
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
    DEFAULT_VOLUME: 1.0,
    BUMP_VOLUME: 0.4,
    MAIL_VOLUME: 0.5
  }
};