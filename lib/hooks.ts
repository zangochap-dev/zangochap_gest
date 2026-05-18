import { useState, useEffect } from 'react';

export function useResponsiveMode(breakpoint: number = 768) {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === "undefined") return { isMobile: false, isReady: false };
    return {
      isMobile: window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
      isReady: true,
    };
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const updateViewport = () => {
      setViewport((current) => {
        if (current.isReady && current.isMobile === mediaQuery.matches) return current;
        return { isMobile: mediaQuery.matches, isReady: true };
      });
    };

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);

    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, [breakpoint]);

  return viewport;
}

export function useIsMobile(breakpoint: number = 768) {
  return useResponsiveMode(breakpoint).isMobile;
}
