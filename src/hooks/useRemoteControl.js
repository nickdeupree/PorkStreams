import { useEffect, useCallback } from 'react';

/**
 * Custom hook for Android TV remote control navigation
 * Maps remote control buttons to standard keyboard events
 */
export const useRemoteControl = (enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { keyCode, key } = event;

    // Android TV remote key codes
    const REMOTE_KEYS = {
      // D-pad
      DPAD_UP: 19,
      DPAD_DOWN: 20,
      DPAD_LEFT: 21,
      DPAD_RIGHT: 22,
      DPAD_CENTER: 23,
      // Media controls
      BACK: 4,
      MENU: 82,
      // Additional buttons
      MEDIA_PLAY: 126,
      MEDIA_PAUSE: 127,
      MEDIA_PLAY_PAUSE: 85
    };

    // Map remote keys to standard keyboard events
    let mappedKey = null;

    switch (keyCode) {
      case REMOTE_KEYS.DPAD_UP:
        mappedKey = 'ArrowUp';
        break;
      case REMOTE_KEYS.DPAD_DOWN:
        mappedKey = 'ArrowDown';
        break;
      case REMOTE_KEYS.DPAD_LEFT:
        mappedKey = 'ArrowLeft';
        break;
      case REMOTE_KEYS.DPAD_RIGHT:
        mappedKey = 'ArrowRight';
        break;
      case REMOTE_KEYS.DPAD_CENTER:
        mappedKey = 'Enter';
        break;
      case REMOTE_KEYS.BACK:
        mappedKey = 'Escape';
        break;
      default:
        // If it's already a standard key, use it
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(key)) {
          return; // Let the keyboard nav hook handle it
        }
        break;
    }

    // If we have a mapped key, create a synthetic keyboard event
    if (mappedKey) {
      const syntheticEvent = new KeyboardEvent('keydown', {
        key: mappedKey,
        bubbles: true,
        cancelable: true
      });
      
      document.dispatchEvent(syntheticEvent);
      event.preventDefault();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      // Listen for both keydown (standard keyboard) and keyup (some TV remotes)
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // Focus management for TV
  useEffect(() => {
    if (enabled) {
      // Ensure first focusable element gets focus on mount
      const firstFocusable = document.querySelector('[role="button"], button, [tabindex="0"]');
      if (firstFocusable && !document.activeElement?.hasAttribute('tabindex')) {
        setTimeout(() => {
          firstFocusable.focus();
        }, 100);
      }
    }
  }, [enabled]);

  return null;
};
