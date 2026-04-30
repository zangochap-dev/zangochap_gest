"use client";

import { useLayoutEffect } from "react";

export default function RiderGlobalStyles() {
  useLayoutEffect(() => {
    const body = document.body;
    body.style.backgroundColor = "#F5F5F7";
    body.style.color = "#1C1C1E";
    body.style.overflowX = "hidden";

    return () => {
      body.style.backgroundColor = "";
      body.style.color = "";
      body.style.overflowX = "";
    };
  }, []);

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* ── Spacing Utilities ── */
      .p-1  { padding: 0.25rem; }
      .p-2  { padding: 0.5rem; }
      .p-3  { padding: 0.75rem; }
      .p-4  { padding: 1rem; }
      .p-5  { padding: 1.25rem; }
      .p-6  { padding: 1.5rem; }
      .p-8  { padding: 2rem; }

      .px-1  { padding-left: 0.25rem; padding-right: 0.25rem; }
      .px-2  { padding-left: 0.5rem; padding-right: 0.5rem; }
      .px-3  { padding-left: 0.75rem; padding-right: 0.75rem; }
      .px-4  { padding-left: 1rem; padding-right: 1rem; }
      .px-5  { padding-left: 1.25rem; padding-right: 1.25rem; }
      .px-6  { padding-left: 1.5rem; padding-right: 1.5rem; }

      .py-1  { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2  { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .py-3  { padding-top: 0.75rem; padding-bottom: 0.75rem; }
      .py-4  { padding-top: 1rem; padding-bottom: 1rem; }
      .py-6  { padding-top: 1.5rem; padding-bottom: 1.5rem; }

      .pt-2  { padding-top: 0.5rem; }
      .pt-3  { padding-top: 0.75rem; }
      .pt-6  { padding-top: 1.5rem; }
      .pb-2  { padding-bottom: 0.5rem; }
      .pb-4  { padding-bottom: 1rem; }
      .pb-10 { padding-bottom: 2.5rem; }
      .pb-28 { padding-bottom: 7rem; }
      .pb-36 { padding-bottom: 9rem; }

      .mb-0\\.5 { margin-bottom: 0.125rem; }
      .mb-1  { margin-bottom: 0.25rem; }
      .mb-2  { margin-bottom: 0.5rem; }
      .mb-3  { margin-bottom: 0.75rem; }
      .mb-4  { margin-bottom: 1rem; }
      .mb-5  { margin-bottom: 1.25rem; }
      .mb-6  { margin-bottom: 1.5rem; }

      .mt-2  { margin-top: 0.5rem; }
      .mt-3  { margin-top: 0.75rem; }

      .gap-1  { gap: 0.25rem; }
      .gap-1\\.5 { gap: 0.375rem; }
      .gap-2  { gap: 0.5rem; }
      .gap-3  { gap: 0.75rem; }
      .gap-4  { gap: 1rem; }
      .gap-6  { gap: 1.5rem; }

      .space-y-1 > :not(:first-child) { margin-top: 0.25rem; }
      .space-y-2 > :not(:first-child) { margin-top: 0.5rem; }
      .space-y-3 > :not(:first-child) { margin-top: 0.75rem; }
      .space-y-4 > :not(:first-child) { margin-top: 1rem; }
      .space-y-6 > :not(:first-child) { margin-top: 1.5rem; }
    `}} />
  );
}
