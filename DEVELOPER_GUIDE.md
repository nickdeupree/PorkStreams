# PorkStreams Developer Guide

## Architecture Overview

### Component Hierarchy

```
App (Context Provider)
└── AppContent (Theme Provider)
    ├── Navigation (AppBar)
    │   ├── Provider Selector
    │   ├── Channel Selector (Daddy Streams only)
    │   ├── Theme Toggle
    │   └── Category Tabs
    ├── StreamGrid (Main Content)
    │   └── StreamCard[] (Responsive Grid)
    └── StreamPlayer (Full-Screen Dialog)
        └── iframe (Stream Embed)
```

### Data Flow

```
1. App loads → AppContext initializes
2. AppContext fetches data from selected provider
3. Provider normalizes data → filters categories
4. Normalized data cached in localStorage
5. StreamGrid renders filtered streams
6. User clicks stream → StreamPlayer opens
7. StreamPlayer generates embed URL
8. Auto-refresh every 60 seconds
```

### Provider Architecture

Each provider follows the same interface:

```javascript
class Provider extends BaseProvider {
  constructor() {
    super('provider-id');
    this.apiUrl = 'API_ENDPOINT';
  }

  async fetchSchedule() {
    // Fetch raw data from API
    // Returns: Promise<Object>
  }

  getEmbedUrl(stream, channelId?) {
    // Generate embed URL for stream
    // Returns: string
  }

  normalizeCategories(rawData) {
    // Transform raw API data to app format
    // Returns: { Basketball: [], Women's Basketball: [], Football: [] }
  }
}
```

## Implementation Details

### Category Filtering

The filtering happens in two stages:

1. **Provider Mapping**: Each provider has specific category names mapped to app categories
2. **Normalization**: During normalization, only streams matching configured categories are included

Example for Daddy Streams:
```javascript
// Raw API category: "NBA"
// Mapped to: "Basketball" (APP_CATEGORIES.BASKETBALL)
// Result: Stream appears in Basketball tab
```

### Caching Strategy

**Cache Key Format**: `porkstreams_schedule_{provider_id}`

**Cache Structure**:
```json
{
  "data": {
    "Basketball": [...],
    "Women's Basketball": [...],
    "Football": [...]
  },
  "timestamp": 1234567890
}
```

**Cache Invalidation**:
- TTL: 24 hours
- Manual refresh every 60 seconds
- Fallback to expired cache on network error

### State Management

**Global State (AppContext)**:
- `provider`: Current provider ID
- `selectedCategory`: Current category tab
- `selectedChannel`: Preferred channel (Daddy Streams)
- `streamData`: Cached normalized data
- `loading`: Loading state
- `error`: Error message
- `currentStream`: Stream being played
- `themeMode`: 'dark' or 'light'

**Local Storage**:
- `porkstreams_theme_mode`: Theme preference
- `porkstreams_preferred_channel`: Channel preference
- `porkstreams_schedule_*`: Cached stream data

### Navigation System

**Keyboard Navigation**:
- Implemented via `useKeyboardNav` hook
- Calculates grid layout based on screen size
- Maps arrow keys to focus changes
- Handles Enter/Escape keys

**TV Remote Navigation**:
- Implemented via `useRemoteControl` hook
- Maps Android TV keycodes to keyboard events
- D-pad (19-22) → Arrow keys
- Center (23) → Enter
- Back (4) → Escape

**Focus Management**:
- All interactive elements have `tabindex="0"`
- Cards have `role="button"`
- Custom focus indicators via MUI theme
- Auto-focus first element on mount

## API Integration

### Daddy Streams API

**Endpoint**: `https://daddylivestream.com/schedule/schedule-generated.php`

**Response Structure**:
```json
{
  "2024-12-15": {
    "NBA": [
      {
        "id": "...",
        "name": "Lakers vs Celtics",
        "time": "2024-12-15T19:00:00",
        "poster": "...",
        "channels": [
          {
            "channel_id": "101",
            "channel_name": "ESPN"
          }
        ]
      }
    ]
  }
}
```

**Important**:
- Only process first date key (current day)
- Multiple channels per event
- Channel selection required for playback

**Embed URL Format**:
`https://dlhd.dad/stream/stream-{channel_id}.php`

### PPTV API

**Endpoint**: `https://ppt.live/api/streams`

**Response Structure**:
```json
{
  "success": true,
  "streams": [
    {
      "category": "Basketball",
      "streams": [
        {
          "id": 123,
          "name": "Lakers vs Celtics",
          "starts_at": 1702677600,
          "ends_at": 1702688400,
          "iframe": "...",
          "uri_name": "nba/lal-bos"
        }
      ]
    }
  ]
}
```

**Important**:
- Use `iframe` field if present
- Fall back to constructing URL from `uri_name`
- Timestamps in Unix format
- Support for `always_live` flag

## Theme System

### Dark Mode (Default)
- Background: `#121212`
- Paper: `#1e1e1e`
- Text: White with opacity variants
- Focus: Blue outline (`#1976d2`)

### Light Mode
- Background: `#fafafa`
- Paper: `#ffffff`
- Text: Black with opacity variants
- Focus: Blue outline (`#1976d2`)

### TV Optimizations
- Larger focus indicators (3px)
- Enhanced contrast ratios
- TV-safe margins
- Hover effects disabled on touch devices

## Adding New Features

### Adding a New Category

1. Update `categoryMappings.js`:
```javascript
export const APP_CATEGORIES = {
  // ... existing
  HOCKEY: 'Hockey'
};

export const CATEGORY_MAPPINGS = {
  daddystreams: {
    // ... existing
    [APP_CATEGORIES.HOCKEY]: ['NHL', 'NHL Preseason']
  },
  pptv: {
    // ... existing
    [APP_CATEGORIES.HOCKEY]: ['Hockey', 'NHL']
  }
};
```

2. Update `Navigation.jsx`:
```javascript
const categories = [
  APP_CATEGORIES.BASKETBALL,
  APP_CATEGORIES.WOMENS_BASKETBALL,
  APP_CATEGORIES.FOOTBALL,
  APP_CATEGORIES.HOCKEY  // Add new category
];
```

3. Update `AppContext.jsx`:
```javascript
const [streamData, setStreamData] = useState({
  [APP_CATEGORIES.BASKETBALL]: [],
  [APP_CATEGORIES.WOMENS_BASKETBALL]: [],
  [APP_CATEGORIES.FOOTBALL]: [],
  [APP_CATEGORIES.HOCKEY]: []  // Add new category
});
```

### Adding a New Provider

1. Create provider file `src/providers/NewProvider.js`:
```javascript
import { BaseProvider } from './BaseProvider';
import { CATEGORY_MAPPINGS } from '../config/categoryMappings';

export class NewProvider extends BaseProvider {
  constructor() {
    super('newprovider');
    this.apiUrl = 'https://api.example.com/streams';
  }

  async fetchSchedule() {
    const response = await fetch(this.apiUrl);
    return response.json();
  }

  getEmbedUrl(stream) {
    return `https://player.example.com/${stream.id}`;
  }

  normalizeCategories(rawData) {
    const normalized = {
      [APP_CATEGORIES.BASKETBALL]: [],
      [APP_CATEGORIES.WOMENS_BASKETBALL]: [],
      [APP_CATEGORIES.FOOTBALL]: []
    };

    // Your normalization logic
    
    return normalized;
  }
}
```

2. Add to `categoryMappings.js`:
```javascript
export const PROVIDER_IDS = {
  DADDY_STREAMS: 'daddystreams',
  PPTV: 'pptv',
  NEW_PROVIDER: 'newprovider'  // Add new provider
};

export const CATEGORY_MAPPINGS = {
  // ... existing
  newprovider: {
    [APP_CATEGORIES.BASKETBALL]: ['Basketball', 'NBA'],
    [APP_CATEGORIES.WOMENS_BASKETBALL]: ['WNBA'],
    [APP_CATEGORIES.FOOTBALL]: ['NFL', 'Football']
  }
};
```

3. Register in `AppContext.jsx`:
```javascript
import { NewProvider } from '../providers/NewProvider';

const providers = {
  [PROVIDER_IDS.DADDY_STREAMS]: new DaddyStreamsProvider(),
  [PROVIDER_IDS.PPTV]: new PPTVProvider(),
  [PROVIDER_IDS.NEW_PROVIDER]: new NewProvider()
};
```

4. Add to UI in `Navigation.jsx`:
```javascript
<MenuItem value={PROVIDER_IDS.NEW_PROVIDER}>New Provider</MenuItem>
```

## Testing Guide

### Manual Testing

**Provider Switching**:
1. Load app with Daddy Streams
2. Switch to PPTV
3. Verify data updates
4. Switch back to Daddy Streams
5. Verify data persists (from cache)

**Category Filtering**:
1. Check each category has appropriate streams
2. Verify preseason games appear with regular season
3. Confirm other sports are excluded

**Caching**:
1. Load app → check Network tab (API call)
2. Refresh page → verify no API call (cached)
3. Clear localStorage → verify API call returns
4. Wait 24 hours → verify cache expires

**Navigation**:
1. Mouse: Click through all cards
2. Keyboard: Tab, Arrow keys, Enter, Escape
3. Focus indicators visible
4. Grid layout responsive

**Player**:
1. Click stream card → player opens
2. Stream loads correctly
3. For Daddy Streams: channel selector appears
4. Back button returns to grid
5. Switch channels (Daddy Streams)

### Browser Testing

**Desktop**:
- Chrome: ✓
- Firefox: ✓
- Safari: ✓
- Edge: ✓

**Mobile**:
- iOS Safari: ✓
- Android Chrome: ✓

**TV**:
- Android TV: ✓ (test on device)

## Performance Optimization

### Current Optimizations
- LocalStorage caching (reduces API calls)
- 60-second refresh interval (not too aggressive)
- Category filtering at normalization (not on render)
- Lazy image loading with error handling
- MUI's built-in optimizations

### Future Improvements
- Virtual scrolling for large lists
- Service Worker for offline support
- Progressive Web App (PWA) features
- Image CDN integration
- WebSocket for real-time updates

## Deployment

### Web (Static Hosting)
```bash
npm run build
# Deploy dist/ folder to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3
```

### Desktop (Electron)
```bash
npm run dist
# Outputs:
# - macOS: release/*.dmg, *.app
# - Windows: release/*.exe
# - Linux: release/*.AppImage
```

### Android TV (Capacitor)
```bash
npm run build
npx cap copy android
npx cap open android
# Build APK in Android Studio
# Sign and publish to Play Store
```

## Troubleshooting

### Common Issues

**Streams Not Loading**:
- Check CORS settings
- Verify API endpoints are accessible
- Check browser console for errors
- Try different provider

**Focus Not Working**:
- Ensure elements have proper attributes
- Check keyboard event listeners
- Verify no z-index issues
- Test with mouse first

**Cache Issues**:
- Clear localStorage
- Check cache timestamp
- Verify cache key format
- Test expiration logic

**Build Errors**:
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify all dependencies installed
- Check for syntax errors

## Resources

- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Vite Documentation](https://vitejs.dev)
- [Electron Documentation](https://www.electronjs.org)
- [Capacitor Documentation](https://capacitorjs.com)

## Code Standards

- Use ES6+ features
- Follow React Hooks best practices
- Use functional components only
- Implement proper error handling
- Add JSDoc comments for complex functions
- Use meaningful variable names
- Keep components small and focused
- Follow MUI theming patterns
