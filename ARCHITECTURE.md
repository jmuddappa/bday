# 🏗️ Birthday Game - Modular Architecture

## 📁 Project Structure

```
bday/
├── index.html              # Single-file version (legacy)
├── index-modular.html      # Modular version entry point
├── ARCHITECTURE.md         # This file
├── README.md              # Project documentation
│
├── css/
│   └── styles.css         # All game styling
│
├── js/
│   ├── main.js            # 🚀 ENTRY POINT - Minimal bootstrap
│   │
│   ├── core/              # 🎮 Core Game Systems
│   │   └── Game.js        # Main game controller & loop
│   │
│   ├── config/            # ⚙️ Configuration
│   │   ├── gameConfig.js  # Game constants & settings
│   │   └── mailData.js    # Birthday message data
│   │
│   ├── systems/           # 🔧 Game Systems (Singletons)
│   │   ├── AssetLoader.js # Asset loading & caching
│   │   ├── AudioManager.js # Audio control & effects
│   │   ├── InputManager.js # Keyboard input handling
│   │   ├── Renderer.js    # Canvas rendering & debug
│   │   └── CollisionSystem.js # Physics & collision
│   │
│   ├── entities/          # 🎭 Game Objects (Instances)
│   │   ├── GameObject.js  # Base entity class
│   │   ├── Player.js      # Player character
│   │   ├── Dog.js         # Pet characters
│   │   └── Mailbox.js     # Interactive mailbox
│   │
│   ├── features/          # 🎯 Game Features
│   │   └── MailSystem.js  # Mail UI & video playback
│   │
│   └── utils/             # 🛠️ Utilities
│       ├── EventEmitter.js    # Event system
│       ├── ErrorHandler.js    # Error management
│       └── ValidationUtils.js # Math & validation helpers
│
├── assets/               # 📦 Game Assets
│   ├── images/          # Sprites & backgrounds
│   └── audio/           # Music & sound effects
│
└── videos/              # 🎬 Birthday messages
```

## 🎯 Architecture Principles

### **1. Separation of Concerns**
- **Systems** manage global state (audio, rendering, input)
- **Entities** represent game objects with behavior
- **Features** handle complex user interactions
- **Utils** provide reusable functionality

### **2. Dependency Injection**
```javascript
// Systems are passed to entities that need them
const mailSystem = new MailSystem(audioManager);
const game = new Game(renderer, audioManager, inputManager);
```

### **3. Event-Driven Architecture**
```javascript
// Loose coupling through events
inputManager.on('interact', () => mailSystem.openMailbox());
inputManager.on('toggleDebug', () => renderer.toggleDebugMode());
```

### **4. Single Responsibility**
- Each module has **one clear purpose**
- **Easy to test** individual components
- **Simple to maintain** and extend

## 📋 Module Responsibilities

### 🚀 **Entry Point (`main.js`)**
- **Minimal bootstrap** - only game initialization
- **Error boundary** for critical failures
- **Development helpers** (debug access)

### 🎮 **Core (`core/Game.js`)**
- **Game loop** management (60 FPS)
- **System coordination** and lifecycle
- **Entity management** and updates
- **State management** (pause/resume)

### ⚙️ **Configuration (`config/`)**
- **Centralized constants** - no magic numbers
- **Easy to modify** game behavior
- **Environment-specific** settings

### 🔧 **Systems (`systems/`)**
- **Singleton services** shared across game
- **Cross-cutting concerns** (audio, input, rendering)
- **Resource management** (assets, memory)

### 🎭 **Entities (`entities/`)**
- **Game object instances** with state
- **Behavior and logic** for characters
- **Collision and interaction** handling

### 🎯 **Features (`features/`)**
- **Complex user workflows** (mail system)
- **UI management** and modal handling
- **Feature-specific state** management

### 🛠️ **Utils (`utils/`)**
- **Pure functions** - no side effects
- **Reusable helpers** across modules
- **Math, validation, error handling**

## 🔄 Data Flow

```
User Input → InputManager → Game → Entities → Systems → Renderer → Canvas
                ↓
          EventEmitter → Features → DOM Updates
```

1. **Input** captured by InputManager
2. **Events** dispatched to interested systems
3. **Game loop** updates all entities
4. **Systems** process changes (audio, collision)
5. **Renderer** draws current state
6. **Features** handle UI interactions

## 🎛️ Easy Configuration

### **To Change Game Settings:**
```javascript
// config/gameConfig.js
export const CONFIG = {
  PLAYER: {
    SPEED: 3,        // Make player faster
    INITIAL_X: 400   // Change starting position
  }
};
```

### **To Add New Features:**
```javascript
// features/NewFeature.js
export class NewFeature {
  constructor(dependencies) {
    // Feature implementation
  }
}

// core/Game.js - inject into game
this.newFeature = new NewFeature(this.audioManager);
```

### **To Modify Behavior:**
```javascript
// entities/Player.js - easy to find and edit
class Player extends GameObject {
  move(dx, dy, collisionBoxes) {
    // Modify movement logic here
  }
}
```

## 🧪 Testing Strategy

### **Unit Tests** (Individual Modules)
```javascript
// Test individual systems
test('AudioManager.play() should start audio', () => {
  const audioManager = new AudioManager();
  expect(audioManager.play('bgMusic')).toBeTruthy();
});
```

### **Integration Tests** (System Interactions)
```javascript
// Test system coordination
test('Player collision should trigger bump sound', () => {
  const game = new Game();
  // Test collision → audio interaction
});
```

## 🚀 Development Workflow

### **To Add New Entity:**
1. Create in `entities/NewEntity.js`
2. Extend `GameObject` base class
3. Add to `Game.js` entities array
4. Update renderer if needed

### **To Add New System:**
1. Create in `systems/NewSystem.js`
2. Initialize in `Game.js` constructor
3. Wire up event listeners
4. Inject into entities that need it

### **To Modify Behavior:**
1. Find relevant module (clear naming)
2. Edit in isolation
3. Dependencies are explicit
4. Changes are localized

## 🎯 Benefits of This Architecture

### ✅ **For Development:**
- **Easy navigation** - know where to find code
- **Fast changes** - modify only what you need
- **Clear dependencies** - understand relationships
- **Reusable components** - systems can be shared

### ✅ **For Maintenance:**
- **Isolated bugs** - problems are contained
- **Easy testing** - mock dependencies easily  
- **Clear responsibilities** - each module has one job
- **Extensible** - add features without breaking existing

### ✅ **For Performance:**
- **Lazy loading** - load modules as needed
- **Tree shaking** - eliminate unused code
- **Cacheable modules** - browser can cache efficiently
- **Memory management** - clear cleanup paths

## 🎮 How to Use

### **For Development:**
```bash
# Serve with local web server (required for ES6 modules)
python -m http.server 8000
# Open: http://localhost:8000/index-modular.html
```

### **For Production:**
```bash
# Build with bundler (Vite, Webpack, etc.)
npm run build
# Outputs optimized single file
```

This architecture makes the codebase **professional, maintainable, and interview-ready** while preserving all game functionality!