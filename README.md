# Birthday Game - Stardew Valley Style

A interactive birthday game built with HTML5 Canvas featuring a Stardew Valley-inspired aesthetic. Players can explore a cozy environment, interact with pets, and view birthday messages from friends and family.

## Features

- **Interactive gameplay** - Move around with WASD or arrow keys
- **Pet interactions** - Get close to pets to trigger animations and sounds
- **Birthday mailbox** - Press E near the mailbox to view video messages
- **Responsive design** - Works on desktop and mobile devices
- **Audio system** - Background music and interactive sound effects

## Project Structure

```
bday/
├── index.html          # Main game file (standalone version)
├── README.md           # This file
├── assets/
│   ├── images/         # Game sprites and backgrounds
│   │   ├── background.png
│   │   ├── player2.png
│   │   ├── player2side.png
│   │   ├── playerback.png
│   │   ├── roti.png
│   │   ├── khushi.png
│   │   ├── me.png
│   │   └── me2.png
│   └── audio/          # Game sounds and music
│       ├── bg.mp3
│       ├── roti.mp3
│       ├── khushi.mp3
│       └── me.m4a
├── videos/             # Birthday message videos
│   ├── friend1.mov
│   ├── friend2.mov
│   └── ... (friend20.mov)
├── css/
│   └── styles.css      # All styling
└── js/                 # Modular JavaScript (for development)
    ├── game.js         # Main game class
    ├── config.js       # Game configuration
    ├── entities.js     # Game entity classes
    ├── audioManager.js # Audio management
    ├── inputManager.js # Input handling
    ├── mailSystem.js   # Mail/video system
    ├── renderer.js     # Rendering engine
    ├── utils.js        # Utilities and helpers
    └── mailData.js     # Mail content data
```

## How to Run

### Simple Method (Recommended)
1. Open `index.html` directly in your browser
2. The game will load and work immediately

### Development Method
For the modular version, run with a local web server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server extension
```

## Controls

- **Movement**: WASD or Arrow Keys
- **Interact**: E (near mailbox)
- **Debug Mode**: F3
- **Audio Enable**: Click the audio status indicator or any key/click

## Game Features

### Audio System
- **Background Music**: Plays continuously during gameplay
- **Pet Sounds**: Each pet has unique bark/interaction sounds
- **Birthday Song**: Special music when near the "Me" character
- **UI Audio**: Mailbox notification sounds
- **Audio Status**: Visual indicator showing audio state

### Interactive Elements
- **Dogs**: Three pets (Roti, Khushi, Me) with unique behaviors
- **Mailbox**: Contains 20+ birthday video messages
- **Collision System**: Realistic movement with boundaries
- **Animation System**: Pet state changes and player direction sprites

## Architecture

The codebase follows modern JavaScript practices:

- **Object-Oriented Design** - Classes for all game entities
- **Modular Structure** - Separate files for different systems
- **Error Handling** - Robust error management throughout
- **Asset Management** - Efficient loading and caching
- **Event-Driven** - Input and game events properly handled

## Browser Support

Requires a modern browser supporting:
- HTML5 Canvas
- Web Audio API
- ES6 Classes
- CSS Grid/Flexbox

## Performance

- 60 FPS target with requestAnimationFrame
- Efficient collision detection
- Optimized asset loading
- Responsive canvas scaling
- Debug mode for performance monitoring

## Development Notes

The project includes both:
1. **Standalone version** (`index.html`) - All code in one file, works without server
2. **Modular version** (`js/` folder) - Separate files for development, requires server

Both versions are functionally identical and follow the same OOP architecture.