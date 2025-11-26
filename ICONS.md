# App Icons for Vibepoint

This document describes the app icons needed for Vibepoint's PWA functionality.

## Required Icons

The following icon files are referenced in the codebase and need to be created:

### 1. `/public/icon-192.png` (192x192 pixels)
- **Purpose**: Standard PWA icon, notification badge
- **Referenced in**:
  - `public/manifest.json` (line 4)
  - `lib/notifications.ts` (lines 43, 44)
- **Format**: PNG
- **Dimensions**: 192x192 pixels
- **Requirements**:
  - Should have transparent or white background
  - Simple, recognizable design that works at small sizes
  - Should represent mood/emotion tracking concept

### 2. `/public/icon-512.png` (512x512 pixels)
- **Purpose**: High-resolution PWA icon for install prompts and splash screens
- **Referenced in**: `public/manifest.json` (line 9)
- **Format**: PNG
- **Dimensions**: 512x512 pixels
- **Requirements**:
  - Should match 192px version but higher quality
  - Same design concept and color scheme
  - Used when user adds app to home screen

## Design Suggestions

### Brand Colors
- Primary Blue: `#2563EB` (from viewport themeColor)
- Gradient: Blue to Purple (matching app design)
- Background: Can use gradient or solid color

### Icon Concepts
1. **Simple Emoji-Based**: Large 😊 or 🌟 emoji on solid background
2. **Abstract**: Wavy line representing mood graph/spectrum
3. **Geometric**: Circle or square with gradient representing mood map
4. **Minimalist**: Single letter "V" in brand style

### Recommended Approach (Quick Placeholder)

For a quick prototype placeholder, you can:

1. Use a design tool like Figma, Canva, or Photoshop
2. Create a 512x512 canvas with blue gradient background
3. Add white text "VP" or emoji in center
4. Export as PNG
5. Resize to 192x192 for smaller version

### Tools for Icon Generation

**Online (No design skills needed):**
- [Favicon.io](https://favicon.io/) - Generate from text, image, or emoji
- [RealFaviconGenerator](https://realfavicongenerator.net/) - PWA icon generator
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - CLI tool

**Design Tools:**
- Figma (free)
- Canva (free tier available)
- GIMP (free, open source)

### Quick Command (if you have ImageMagick installed)

```bash
# Create a simple gradient icon with text
convert -size 512x512 gradient:blue-purple \
  -gravity center -pointsize 200 -fill white \
  -annotate +0+0 "VP" \
  public/icon-512.png

convert public/icon-512.png -resize 192x192 public/icon-192.png
```

## Testing Icons

After creating the icons:

1. **Visual Check**: View icons directly in browser
   - Navigate to `http://localhost:3000/icon-192.png`
   - Navigate to `http://localhost:3000/icon-512.png`

2. **PWA Install**: Test add to home screen functionality
   - Open app in Chrome/Edge
   - Look for install prompt
   - Verify icon appears correctly

3. **Notifications**: Test notification icon
   - Enable notifications in app
   - Verify icon appears in notification badge

## Current Status

⚠️ **Icons not yet created** - These files need to be added before deployment.

For development/testing, the app will work without icons, but:
- PWA install prompt may not appear
- Notifications may show default browser icon
- Add to home screen won't show proper branding

## Next Steps

1. Choose icon design approach (see suggestions above)
2. Create 512x512 version first
3. Scale down to 192x192
4. Place both files in `/public/` directory
5. Test in browser and PWA install flow
6. Commit icons with descriptive message
