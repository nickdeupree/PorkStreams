import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard navigation
 * Handles arrow keys, Enter, Escape, and Tab
 */
export const useKeyboardNav = (enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, target } = event;
    
    // Let MUI components handle Tab navigation naturally
    if (key === 'Tab') {
      return;
    }

    // Handle Escape key
    if (key === 'Escape') {
      // MUI Dialog and other components will handle this
      return;
    }

    // Handle Enter key on focusable elements
    if (key === 'Enter') {
      if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
        target.click();
        event.preventDefault();
      }
      return;
    }

    // Handle arrow keys for card grid navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const focusableElements = document.querySelectorAll(
        '[role="button"], button, [tabindex="0"]'
      );
      
      const elements = Array.from(focusableElements).filter(
        el => el.offsetParent !== null // Only visible elements
      );

      const currentIndex = elements.indexOf(document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      // Calculate grid dimensions (approximate)
      const cardsPerRow = getCardsPerRow();

      switch (key) {
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex + 1, elements.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + cardsPerRow, elements.length - 1);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex - cardsPerRow, 0);
          break;
        default:
          break;
      }

      if (nextIndex !== currentIndex && elements[nextIndex]) {
        elements[nextIndex].focus();
        event.preventDefault();
      }
    }
  }, [enabled]);

  // Helper function to determine cards per row based on screen size
  const getCardsPerRow = () => {
    const width = window.innerWidth;
    if (width < 600) return 1; // xs
    if (width < 960) return 2; // sm
    if (width < 1280) return 3; // md
    return 4; // lg
  };

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  return null;
};
