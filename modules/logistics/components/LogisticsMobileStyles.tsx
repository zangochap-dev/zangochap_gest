"use client";

import React from "react";

export default function LogisticsMobileStyles() {
  return (
    <style jsx global>{`
      .logistics-mobile-root {
        position: fixed;
        inset: 0;
        top: 0;
        background: #F5F5F7;
        z-index: 100;
        display: flex;
        flex-direction: column;
        font-family: 'Outfit', sans-serif;
        color: #1C1C1E;
        padding-top: 60px; /* Room for Sidebar top bar */
      }

      .logistics-responsive-pending {
        min-height: min(420px, calc(100vh - 120px));
        display: grid;
        place-items: center;
        color: var(--muted);
        font-weight: 700;
      }

      .logistics-view-desktop {
        transform-origin: top center;
      }

      .logistics-view-mobile {
        transform-origin: center bottom;
      }

      .logistics-mobile-header {
        background: white;
        padding: 16px 16px 12px;
        border-bottom: 1px solid #E5E5EA;
        flex-shrink: 0;
      }

      .logistics-mobile-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px 80px;
        -webkit-overflow-scrolling: touch;
      }

      .mobile-card {
        background: white;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 12px;
        border: 1px solid #E5E5EA;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      }

      .mobile-card:active {
        transform: scale(0.98);
        background: #F9F9F9;
      }

      .mobile-status-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        margin-bottom: 12px;
        scrollbar-width: none;
      }

      .mobile-status-tabs::-webkit-scrollbar {
        display: none;
      }

      .status-tab {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        background: #E5E5EA;
        color: #8E8E93;
        transition: all 0.2s;
      }

      .status-tab.active {
        background: #FF6B2C;
        color: white;
      }

      .mobile-search-bar {
        position: relative;
        margin-bottom: 12px;
      }

      .mobile-search-input {
        width: 100%;
        height: 40px;
        background: #F2F2F7;
        border: 1px solid transparent;
        border-radius: 10px;
        padding: 0 12px 0 36px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
      }

      .mobile-search-input:focus {
        background: white;
        border-color: #FF6B2C;
      }

      .mobile-fab {
        position: fixed;
        bottom: 24px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        background: #FF6B2C;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(255, 107, 44, 0.4);
        z-index: 200;
      }

      /* Transitions */
      .page-enter { opacity: 0; transform: translateY(10px); }
      .page-enter-active { opacity: 1; transform: translateY(0); transition: all 0.3s; }
      
      /* Checklist progress bar */
      .progress-bar-bg {
        height: 4px;
        background: #E5E5EA;
        border-radius: 2px;
        overflow: hidden;
      }
      .progress-bar-fill {
        height: 100%;
        background: #34C759;
        transition: width 0.4s ease;
      }
    `}</style>
  );
}
