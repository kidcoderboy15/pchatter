# Asset Conversion Guide

This guide explains how to convert the SVG designs to the PNG formats required for iOS and Android app stores.

## Required Output Files

After conversion, you need these PNG files in the `assets/` directory:

1. **icon.png** - 1024x1024px (App icon for iOS)
2. **adaptive-icon.png** - 1024x1024px (Android adaptive icon)
3. **splash-icon.png** - 2048x2732px (Splash screen for iPad Pro 12.9")
4. **favicon.png** - 48x48px (Web favicon, optional)

## Source Files

- `design-assets/app-icon.svg` - Source for icon.png and adaptive-icon.png
- `design-assets/splash-screen.svg` - Source for splash-icon.png

## Conversion Methods

### Method 1: Online Converter (Easiest)

1. Visit https://cloudconvert.com/svg-to-png
2. Upload `app-icon.svg`
3. Set width to 1024px, height to 1024px
4. Click "Convert"
5. Download and save as `assets/icon.png`
6. Repeat for `splash-screen.svg` (2048x2732px) → `assets/splash-icon.png`

### Method 2: Using Figma (Recommended for Designers)

1. Open https://figma.com
2. Create new file
3. Import SVG (File → Place Image)
4. Select the imported SVG frame
5. Export Settings:
   - Format: PNG
   - For icon: 1024w × 1024h
   - For splash: 2048w × 2732h
6. Export and save to `assets/` folder

### Method 3: Using Inkscape (Free Desktop Software)

Install Inkscape (https://inkscape.org/):

```bash
# On Mac with Homebrew
brew install inkscape

# On Ubuntu/Debian
sudo apt-get install inkscape

# On Windows
# Download from https://inkscape.org/release/
```

Convert using command line:

```bash
# Convert icon (1024x1024)
inkscape design-assets/app-icon.svg \
  --export-type=png \
  --export-filename=assets/icon.png \
  --export-width=1024 \
  --export-height=1024

# Convert splash screen (2048x2732)
inkscape design-assets/splash-screen.svg \
  --export-type=png \
  --export-filename=assets/splash-icon.png \
  --export-width=2048 \
  --export-height=2732

# Adaptive icon (same as icon.png)
cp assets/icon.png assets/adaptive-icon.png

# Favicon (48x48)
inkscape design-assets/app-icon.svg \
  --export-type=png \
  --export-filename=assets/favicon.png \
  --export-width=48 \
  --export-height=48
```

### Method 4: Using ImageMagick/rsvg-convert

Install ImageMagick with RSVG support:

```bash
# On Mac
brew install imagemagick librsvg

# On Ubuntu/Debian
sudo apt-get install imagemagick librsvg2-bin

# On Windows
# Download from https://imagemagick.org/
```

Convert:

```bash
# Convert icon
rsvg-convert -w 1024 -h 1024 design-assets/app-icon.svg -o assets/icon.png

# Convert splash
rsvg-convert -w 2048 -h 2732 design-assets/splash-screen.svg -o assets/splash-icon.png

# Adaptive icon
cp assets/icon.png assets/adaptive-icon.png

# Favicon
rsvg-convert -w 48 -h 48 design-assets/app-icon.svg -o assets/favicon.png
```

### Method 5: Using Node.js (For Developers)

Install sharp package:

```bash
npm install -g sharp-cli
```

Convert:

```bash
# Icon
sharp -i design-assets/app-icon.svg -o assets/icon.png resize 1024 1024

# Splash
sharp -i design-assets/splash-screen.svg -o assets/splash-icon.png resize 2048 2732

# Adaptive icon
cp assets/icon.png assets/adaptive-icon.png

# Favicon
sharp -i design-assets/app-icon.svg -o assets/favicon.png resize 48 48
```

## iOS Specific Requirements

### Icon Requirements
- **Size**: Exactly 1024×1024 pixels
- **Format**: PNG (no alpha/transparency for iOS)
- **Color Space**: sRGB or Display P3
- **No rounded corners**: iOS applies these automatically
- **No text overlay**: Icon should be recognizable at all sizes

To remove alpha channel (required for iOS):

```bash
# Using ImageMagick
convert assets/icon.png -background white -alpha remove -alpha off assets/icon-no-alpha.png
mv assets/icon-no-alpha.png assets/icon.png

# Or using sips (Mac only)
sips -s format png --setProperty formatOptions normal assets/icon.png
```

### Splash Screen Requirements
- **Size**: 2048×2732 pixels (iPad Pro 12.9" portrait)
- **Format**: PNG
- **Background**: Should match `splash.backgroundColor` in app.json (#ffffff)
- Keep important content in the center safe zone
- Test on different device sizes

## Android Specific Requirements

### Adaptive Icon
- **Size**: 1024×1024 pixels
- **Safe Zone**: Keep important content in center 66% (circular mask)
- **Background**: Can have transparency
- Outer 25% may be cropped on some devices

## Verification Checklist

After conversion, verify:

- [ ] `assets/icon.png` is exactly 1024×1024px
- [ ] `assets/icon.png` has no alpha channel (iOS requirement)
- [ ] `assets/adaptive-icon.png` is exactly 1024×1024px
- [ ] `assets/splash-icon.png` is exactly 2048×2732px
- [ ] `assets/favicon.png` is 48×48px (optional)
- [ ] All files are PNG format
- [ ] File sizes are reasonable (< 500KB for icon, < 2MB for splash)
- [ ] Colors look correct (not washed out or oversaturated)

Check file info:

```bash
# Check dimensions
file assets/*.png

# Check file size
ls -lh assets/*.png

# Check for alpha channel (should say "RGB" not "RGBA" for iOS icon)
identify -verbose assets/icon.png | grep -i alpha
```

## Optimization

Optimize PNGs to reduce file size without quality loss:

### Using ImageOptim (Mac)
1. Download from https://imageoptim.com/
2. Drag PNG files into ImageOptim
3. Wait for optimization to complete

### Using pngquant (Command Line)
```bash
# Install
brew install pngquant  # Mac
sudo apt-get install pngquant  # Linux

# Optimize (creates optimized version)
pngquant --quality=85-95 assets/icon.png --output assets/icon-optimized.png
pngquant --quality=85-95 assets/splash-icon.png --output assets/splash-optimized.png

# Replace originals
mv assets/icon-optimized.png assets/icon.png
mv assets/splash-optimized.png assets/splash-icon.png
```

### Using optipng
```bash
# Install
brew install optipng  # Mac
sudo apt-get install optipng  # Linux

# Optimize in place
optipng -o7 assets/icon.png
optipng -o7 assets/splash-icon.png
```

## Testing

### Test Icon Appearance

**iOS:**
```bash
# View in Preview (Mac)
open assets/icon.png

# Test in simulator
# Icon will be displayed with rounded corners automatically
```

**Android:**
```bash
# View how it looks with circular mask
# Upload to: https://icon.kitchen/
```

### Test Splash Screen

Build the app and test on actual devices or simulators:

```bash
# Build development version
eas build --platform ios --profile development

# Or run in simulator
npm run ios
```

## Customization

If you want to customize the designs before converting:

1. **Edit SVG in Code Editor**: Open `design-assets/app-icon.svg` in any text editor
2. **Edit in Inkscape**: Free vector graphics editor (https://inkscape.org/)
3. **Edit in Figma**: Import SVG into Figma (https://figma.com)
4. **Edit in Adobe Illustrator**: Professional vector editor

### Quick Color Changes

Edit the SVG files and change color values:

- Primary green: `#22c55e`
- Dark gray: `#111827`
- Medium gray: `#374151`
- Yellow ball: `#fef08a`
- White: `#ffffff`

## Troubleshooting

**"Image is too large"**
- Reduce dimensions or compress PNG
- Use optimization tools listed above

**"Icon has transparency" (iOS error)**
- Remove alpha channel using ImageMagick command above
- Or flatten with white background in Photoshop/Figma

**"Colors look wrong"**
- Ensure color space is sRGB
- Check monitor calibration
- Convert using: `convert input.png -colorspace sRGB output.png`

**"SVG won't convert"**
- Try different conversion method
- Check SVG is valid XML
- Remove any embedded fonts or complex filters

## Next Steps

After converting all assets:

1. ✅ Verify all files are in `assets/` directory
2. ✅ Check file sizes and dimensions
3. ✅ Optimize PNGs to reduce size
4. ✅ Test icon appearance on iOS simulator
5. ✅ Test splash screen on actual devices
6. ✅ Commit assets to git
7. ✅ Build test version with EAS
8. ✅ Submit to TestFlight for beta testing

## Resources

- [iOS Human Interface Guidelines - App Icon](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Expo Icon and Splash Guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [App Icon Generator](https://www.appicon.co/)
- [Icon Kitchen (Android Testing)](https://icon.kitchen/)
