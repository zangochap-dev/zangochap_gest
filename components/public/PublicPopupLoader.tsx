"use client";

import React from "react";
import PublicPopup from "./PublicPopup";
import { HomeCmsContent } from "@/modules/cms/types";

export default function PublicPopupLoader() {
  const [content, setContent] = React.useState<HomeCmsContent | null>(null);

  React.useEffect(() => {
    let active = true;

    fetch("/api/public/cms", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (active && payload?.content) setContent(payload.content);
      })
      .catch(() => {
        // The popup is optional; failures should never block public navigation.
      });

    return () => {
      active = false;
    };
  }, []);

  if (!content) return null;

  return <PublicPopup content={content} />;
}
