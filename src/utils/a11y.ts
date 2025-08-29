import { useEffect, useRef, useState } from 'react';

/**
 * Hook for managing roving tabindex in a grid
 */
export function useRovingTabIndex(
  items: HTMLElement[],
  initialFocusIndex = 0
) {
  const [focusedIndex, setFocusedIndex] = useState(initialFocusIndex);
  
  useEffect(() => {
    // Reset focus when items change
    setFocusedIndex(initialFocusIndex);
  }, [items.length, initialFocusIndex]);
  
  useEffect(() => {
    if (items.length > 0 && focusedIndex >= 0) {
      items[focusedIndex]?.focus();
    }
  }, [focusedIndex, items]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newIndex = focusedIndex;
    
    switch (e.key) {
      case 'ArrowUp':
        newIndex = Math.max(0, focusedIndex - 7);
        break;
      case 'ArrowDown':
        newIndex = Math.min(items.length - 1, focusedIndex + 7);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(0, focusedIndex - 1);
        break;
      case 'ArrowRight':
        newIndex = Math.min(items.length - 1, focusedIndex + 1);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    setFocusedIndex(newIndex);
  };
  
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };
  
  return { focusedIndex, handleKeyDown, handleFocus };
}

/**
 * Hook for live region announcements
 */
export function useLiveRegion() {
  const [announcement, setAnnouncement] = useState('');
  const announceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (announcement && announceRef.current) {
      // Clear previous announcement
      announceRef.current.textContent = '';
      
      // Set new announcement after a small delay to ensure it's read
      setTimeout(() => {
        announceRef.current!.textContent = announcement;
      }, 100);
    }
  }, [announcement]);
  
  const announce = (message: string) => {
    setAnnouncement(message);
  };
  
  return { announce, announceRef };
}
