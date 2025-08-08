# Birthday Game - Setup & Customization Instructions

## Quick Start

1. **Run Locally**:
   ```bash
   cd /Users/dmuddappa/Desktop/bday
   python3 -m http.server 8000
   ```
   Open http://localhost:8000

2. **Deploy Online**:
   - Upload to GitHub (public repository)
   - Enable GitHub Pages in Settings → Pages
   - Or use Netlify/Vercel for easier deployment

## Customizing the Game

### 🐕 Editing Dog Dialog

**Location**: `/js/core/Game.js` (lines ~51-79)

```javascript
this.dogDialogs = {
  'Roti': {
    portrait: 'roti',
    messages: [
      "English message (Vietnamese translation)",
      "Another message (Tin nhắn khác)",
      "Third message (Tin nhắn thứ ba)",
      "Fourth message (Tin nhắn thứ tư)"
    ]
  },
  'Khushi': {
    portrait: 'khushi', 
    messages: [
      "Different personality (Tính cách khác)",
      // Add more messages...
    ]
  }
}
```

**Notes**:
- Messages cycle in order (no randomization)
- Vietnamese text in parentheses appears smaller and italic
- Each dog remembers where they are in their sequence

### 📬 Adding Video Messages

**Location**: `/js/config/mailData.js`

```javascript
export const MAIL_DATA = [
  {
    sender: "Friend Name",
    icon: "🎂",
    src: "path/to/video.mp4",
    flipped: false  // Set true to rotate 180°
  },
  // Add more videos...
];
```

**Video Requirements**:
- Format: MP4 (recommended)
- Place files in `/assets/videos/` folder
- Use relative paths: `assets/videos/birthday.mp4`

### 🎮 Game Settings

**Location**: `/js/config/gameConfig.js`

```javascript
PLAYER: {
  SPEED: 2,           // Movement speed (pixels per frame)
  INITIAL_X: 465,     // Starting X position  
  INITIAL_Y: 210,     // Starting Y position
},

DOGS: {
  ROTI: {
    x: 300, y: 400,   // Dog position
    scale: 0.12,      // Size multiplier
    // ... other settings
  }
}
```

### 🎨 Portrait Images

**Location**: `/assets/images/`

Required files:
- `roti_portrait.png` - Roti's dialog portrait
- `khushi_portrait.png` - Khushi's dialog portrait  
- `me_portrait.png` - Me's dialog portrait

**Image Specs**:
- Format: PNG with transparency
- Size: 128x128 pixels (will be scaled by CSS)
- Style: Should match game's pixel art aesthetic

### 🔊 Audio Files

**Location**: `/assets/audio/`

Current files:
- `bg.mp3` - Background music (loops)
- `roti.mp3` - Roti's bark sound
- `khushi.mp3` - Khushi's bark sound
- `me.m4a` - Special birthday song

**Adding New Sounds**:
1. Place audio file in `/assets/audio/`
2. Update `/js/config/gameConfig.js` ASSETS.AUDIO section
3. Modify AudioManager loading in `/js/systems/AudioManager.js`

### 🎯 Collision Areas

**Location**: `/js/config/gameConfig.js`

```javascript
COLLISION_BOXES: [
  { x: 0, y: 0, width: 1094, height: 30 },    // Top border
  { x: 0, y: 0, width: 10, height: 1112 },    // Left border
  // Add more collision rectangles...
]
```

**Testing Collisions**:
- Press semicolon (`;`) in-game to see collision boxes
- Red boxes = obstacles, Blue box = player

## Advanced Customization

### 🖼️ Changing Background

Replace `/assets/images/background.png` with your image:
- Size: 1094x1112 pixels
- Format: PNG or JPG
- Style: Pixel art recommended for consistency

### 👤 Player Sprites

Replace player sprite files in `/assets/images/`:
- `player2.png` - Front facing
- `player2side.png` - Side view (will be flipped for right movement)
- `playerback.png` - Back view

### 🐕 Dog Sprites

Replace dog sprite files:
- `roti.png`, `khushi.png`, `me.png`
- These are sprite sheets - check existing files for layout
- Update frame coordinates in `gameConfig.js` if needed

### 🎨 UI Styling

**Location**: `/css/styles.css`

Key sections:
- `.dialog-box` - Dialog appearance
- `.dialog-text` - Text styling
- `.vietnamese-text` - Vietnamese translation styling
- `.video-nav-arrow` - Video navigation arrows

**TV Optimization**:
- All text sizes are already 2x larger for 70" TV viewing
- Vietnamese text: 32px, English text: 36px
- Dialog boxes: 1600px max width

## Troubleshooting

### Game Won't Load
- Check browser console for errors (F12)
- Ensure you're running a local server (not opening index.html directly)
- Verify all asset files exist in correct locations

### Videos Won't Play
- Check video file paths in `mailData.js`
- Ensure video files are in correct format (MP4 recommended)
- Some browsers require user interaction before playing audio/video

### Audio Issues
- Check browser audio permissions
- Verify audio file paths in `gameConfig.js`
- Some browsers block autoplay - click anywhere to enable audio

### Dialog Not Showing
- Check that portrait images exist: `*_portrait.png`
- Verify dog names match exactly in `dogDialogs` object
- Check browser console for JavaScript errors

### Performance Issues
- Game runs at uncapped framerate (60fps+)
- Reduce browser zoom if performance is poor
- Close other browser tabs to free up memory

## File Permissions

When deploying online, ensure:
- All files have proper read permissions
- Directory structure is preserved
- Case-sensitive file names match exactly (important for Linux servers)

## Browser Support

**Supported**:
- Chrome 60+
- Firefox 55+  
- Safari 10+
- Edge 16+

**Not Supported**:
- Internet Explorer (uses ES6 modules)
- Very old mobile browsers

**Recommended for 70" TV**:
- Chrome or Firefox on desktop computer
- HDMI connection to TV
- Browser in fullscreen mode (F11)