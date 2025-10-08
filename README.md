# PorkStreams - Sports Streaming Application

A cross-platform streaming application built with **Vite + React + Material-UI** that displays live sports streams from multiple providers. Supports web browsers, desktop (Electron), and Android TV (Capacitor).

## Features

- 🎯 **Multi-Provider Support**: Switch between Daddy Streams and PPTV
- 🏀 **Three Sport Categories**: Basketball, Women's Basketball, and Football
- 🎨 **Dark/Light Mode**: Toggle between themes optimized for TV viewing
- 📱 **Responsive Design**: Works on mobile, desktop, and TV screens
- ⌨️ **Keyboard Navigation**: Full arrow key support
- 🎮 **Android TV Remote**: D-pad navigation support
- 💾 **Smart Caching**: 24-hour cache with automatic refresh
- 🔄 **Auto-Refresh**: Updates stream data every 60 seconds

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev:vite

# Open browser to http://localhost:5173
```

## Technology Stack

- **Frontend**: React 19 + Vite 7
- **UI Library**: Material-UI (MUI) v7
- **State Management**: React Context API
- **Desktop**: Electron
- **Mobile**: Capacitor (Android TV)

## Navigation

### Mouse
- Click on stream cards to play
- Click provider/category selectors

### Keyboard
- **Arrow Keys**: Navigate between cards
- **Tab**: Move between elements
- **Enter**: Select/play stream
- **Escape**: Close player

### Android TV Remote
- **D-Pad**: Navigate grid
- **Center Button**: Select stream
- **Back Button**: Return to grid

## Building

```bash
# Build for web
npm run build

# Build desktop apps
npm run dist

# Build Android TV APK
npm run android
```

## Category Filtering

### Daddy Streams
- **Basketball**: NBA, NBA Preseason
- **Women's Basketball**: WNBA, WNBA Preseason
- **Football**: Am. Football (NFL), Am. Football Preseason (NFL)

### PPTV
- **Basketball**: Basketball, NBA
- **Women's Basketball**: WNBA, Women's Basketball, Womens Basketball
- **Football**: American Football, American Football (NFL), NFL

## API Endpoints

- **Daddy Streams**: `https://daddylivestream.com/schedule/schedule-generated.php`
- **PPTV**: `https://ppt.live/api/streams`

## License

Private project for personal use.

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
