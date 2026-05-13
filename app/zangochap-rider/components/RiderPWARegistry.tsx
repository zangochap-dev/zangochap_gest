"use client";

import { useEffect } from "react";

export default function RiderPWARegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Rider Service Worker Registered');
      }).catch((err) => {
        console.error('Rider Service Worker registration failed:', err);
      });
    }
  }, []);

  return null;
}
