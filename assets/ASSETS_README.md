# Assets Guide

## Current Status

Placeholder assets are included in this directory. Before App Store submission, replace these with production-ready assets.

## Required Assets

### App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Content**: Pickle Chatter logo
- **Notes**: Should be simple, recognizable at small sizes

### Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels  
- **Format**: PNG with transparency
- **Content**: App icon optimized for Android adaptive icons
- **Notes**: Keep important content in center safe zone (66% diameter circle)

### Splash Icon (`splash-icon.png`)
- **Size**: 2048x2732 pixels (iPad Pro 12.9" portrait)
- **Format**: PNG
- **Content**: Full splash screen design
- **Background**: Should match `splash.backgroundColor` in app.json (#ffffff)

### Favicon (`favicon.png`)
- **Size**: 48x48 pixels minimum
- **Format**: PNG
- **Content**: Simplified app icon for web

## Design Guidelines

### Color Palette
- **Primary**: #22c55e (Pickle Green)
- **Background**: #ffffff (White)
- **Text**: #111827 (Dark Gray)

### Branding
- Icon should incorporate pickleball paddle or ball imagery
- Use clean, modern design
- Ensure good contrast for visibility
- Test at multiple sizes (16px to 1024px)

## iOS App Store Requirements

- Icon must NOT include alpha channel (iOS requirement)
- No rounded corners (iOS adds these automatically)
- No text that will be unreadable at small sizes
- Follow Apple Human Interface Guidelines

## Android Play Store Requirements

- Icon should work within circular mask
- Follow Material Design guidelines
- Test with different icon shapes (circle, square, rounded square)

## Before Submission Checklist

- [ ] Replace all placeholder images
- [ ] Test icon on actual devices (iOS and Android)
- [ ] Verify splash screen displays correctly
- [ ] Check icon in App Store/Play Store listings
- [ ] Ensure assets meet platform guidelines
- [ ] Compress assets for optimal file size
- [ ] Remove this README from production build

## Tools

Recommended tools for asset creation:
- **Figma**: Vector design and export
- **Sketch**: macOS design tool
- **Adobe Illustrator**: Professional vector graphics
- **ImageOptim**: PNG compression
- **Preview (macOS)**: Quick resizing and format conversion
