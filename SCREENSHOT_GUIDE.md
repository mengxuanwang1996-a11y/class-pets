# App Store Screenshots Guide

## Required Screenshot Sizes

You need to provide screenshots for the following device sizes:

### iPhone (App Store Display)

| Device | Size (pixels) | Required |
|--------|--------------|----------|
| iPhone 16 Pro Max (6.9") | 1318 x 2868 | Yes |
| iPhone 16 Pro (6.3") | 1206 x 2622 | Yes |
| iPhone 16 (6.1") | 1206 x 2622 | Yes |
| iPhone 15 Pro Max (6.7") | 1290 x 2796 | Yes |
| iPhone SE (4.7") | 750 x 1334 | Optional |

### iPad

| Device | Size (pixels) | Required |
|--------|--------------|----------|
| iPad Pro 13" (M4) | 2064 x 2752 | Optional |
| iPad Pro 11" (M4) | 1668 x 2420 | Optional |

---

## Screenshot Requirements

1. **File Format:** PNG or JPEG
2. **Color Space:** sRGB
3. **72 DPI**
4. **No status bar** (optional, but recommended)
5. **Device frame optional** - Apple shows them without frames

---

## Recommended Screenshots to Capture

For Class Pets app, capture these screens:

1. **Login/Registration Screen**
   - Show the clean login UI
   - Language switcher visible

2. **Home Page (Student Grid)**
   - Show the pet cards with student names
   - Show point badges

3. **Student Detail/Interaction Modal**
   - Show point awarding interface
   - Show pet feeding/growth

4. **Leaderboard**
   - Show individual rankings with medals

5. **Group Management**
   - Show group creation or random grouping

6. **Store**
   - Show the reward store items

---

## How to Capture Screenshots

### Option 1: Use Xcode Simulator
1. Open `ios/App.xcworkspace` in Xcode
2. Select a simulator (iPhone 16 Pro)
3. Run the app
4. Press Cmd+S to capture

### Option 2: Use Capacitor
```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then use Xcode's screenshot tools.

### Option 3: Use Browser DevTools
For web/PWA screenshots, use Chrome DevTools device emulation.

---

## App Preview Video (Optional)

App Store also accepts video previews (not required but recommended).

- **Length:** 15-30 seconds
- **Format:** MP4
- **Size:** 1080 x 1920 or 1920 x 1080

---

## Notes

- Screenshots should accurately represent the app
- Don't include placeholder or misleading content
- Keep text readable at small sizes
- Consider showing the best features
