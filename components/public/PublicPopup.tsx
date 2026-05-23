"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { HomeCmsContent } from "@/modules/cms/types";

export default function PublicPopup({ content }: { content: HomeCmsContent }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!content.popupEnabled) return;

    const storageKey = `zangochap_popup_seen_${popupSignature(content)}`;
    if (content.popupFrequency === "session" && sessionStorage.getItem(storageKey)) return;
    if (content.popupFrequency === "once" && localStorage.getItem(storageKey)) return;

    const delay = Math.max(0, Number.parseInt(content.popupDelayMs, 10) || 0);

    const timer = window.setTimeout(() => {
      setOpen(true);
      if (content.popupFrequency === "session") sessionStorage.setItem(storageKey, "1");
      if (content.popupFrequency === "once") localStorage.setItem(storageKey, "1");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [content.popupDelayMs, content.popupEnabled, content.popupFrequency, content.popupTitle]);

  if (!content.popupEnabled || !open) return null;

  const theme = getTheme(content.popupTheme);
  const shellClass = getShellClass(content.popupPosition);
  const sizeClass = getSizeClass(content.popupSize);
  const hasImage = content.popupShowImage && Boolean(content.popupImage);

  return (
    <div className={`fixed inset-0 z-[1200] flex bg-black/55 px-4 py-6 backdrop-blur-sm ${shellClass}`}>
      <div className={`relative w-full overflow-hidden rounded-lg shadow-2xl ${theme.card} ${sizeClass}`}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${theme.close}`}
          aria-label="Fermer la popup"
        >
          <X size={18} />
        </button>

        <div className={hasImage ? "grid md:grid-cols-[0.95fr_1.05fr]" : "grid"}>
          {hasImage && (
            <div className="relative min-h-[220px] bg-[#1A1614]">
              <img
                src={content.popupImage}
                alt={content.popupTitle}
                className="h-full min-h-[220px] w-full object-cover"
              />
            </div>
          )}

          <div className="flex min-h-[280px] flex-col justify-center p-7 md:p-10">
            {content.popupEyebrow && (
              <span className={`mb-3 text-[10px] font-extrabold uppercase tracking-[0.28em] ${theme.eyebrow}`}>
                {content.popupEyebrow}
              </span>
            )}
            <h2 className={`mb-4 font-display text-[28px] font-black uppercase leading-none md:text-[38px] ${theme.title}`}>
              {content.popupTitle}
            </h2>
            <p className={`mb-7 text-sm leading-relaxed md:text-[15px] ${theme.text}`}>
              {content.popupDescription}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {content.popupButtonLabel && (
                <Link
                  href={content.popupButtonHref || "/shop"}
                  onClick={() => setOpen(false)}
                  className={`inline-flex w-fit items-center justify-center rounded px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] transition ${theme.primary}`}
                >
                  {content.popupButtonLabel}
                </Link>
              )}
              {content.popupSecondaryLabel && (
                content.popupSecondaryHref ? (
                  <Link
                    href={content.popupSecondaryHref}
                    onClick={() => setOpen(false)}
                    className={`inline-flex w-fit items-center justify-center rounded px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] transition ${theme.secondary}`}
                  >
                    {content.popupSecondaryLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={`inline-flex w-fit items-center justify-center rounded px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] transition ${theme.secondary}`}
                  >
                    {content.popupSecondaryLabel}
                  </button>
                )
              )}
            </div>
            {content.popupCloseLabel && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`mt-5 w-fit text-[11px] font-bold underline-offset-4 hover:underline ${theme.closeText}`}
              >
                {content.popupCloseLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function popupSignature(content: HomeCmsContent) {
  const value = `${content.popupTitle}:${content.popupButtonHref}:${content.popupDescription}:${content.popupFrequency}`;
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function getShellClass(position: string) {
  if (position === "bottom-right") return "items-end justify-end";
  if (position === "bottom-center") return "items-end justify-center";
  return "items-center justify-center";
}

function getSizeClass(size: string) {
  if (size === "small") return "max-w-[520px]";
  if (size === "large") return "max-w-[920px]";
  return "max-w-[760px]";
}

function getTheme(theme: string) {
  if (theme === "dark") {
    return {
      card: "bg-[#1A1614] text-white",
      close: "bg-white/10 text-white hover:bg-white/20",
      eyebrow: "text-[#E8C07A]",
      title: "text-white",
      text: "text-white/70",
      primary: "bg-[#D4541C] text-white hover:bg-[#B33D0E]",
      secondary: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
      closeText: "text-white/55",
    };
  }

  if (theme === "orange") {
    return {
      card: "bg-[#F4E4D7] text-[#1A1614]",
      close: "bg-white/70 text-[#1A1614] hover:bg-white",
      eyebrow: "text-[#D4541C]",
      title: "text-[#1A1614]",
      text: "text-[#5f514a]",
      primary: "bg-[#D4541C] text-white hover:bg-[#B33D0E]",
      secondary: "border border-[#D4541C]/30 bg-white/50 text-[#1A1614] hover:bg-white",
      closeText: "text-[#7A6A61]",
    };
  }

  return {
    card: "bg-white text-[#1A1614]",
    close: "bg-white/90 text-[#1A1614] hover:bg-white",
    eyebrow: "text-[#D4541C]",
    title: "text-[#1A1614]",
    text: "text-[#666]",
    primary: "bg-[#1A1614] text-white hover:bg-[#D4541C]",
    secondary: "border border-[#1A1614]/15 bg-white text-[#1A1614] hover:border-[#D4541C] hover:text-[#D4541C]",
    closeText: "text-[#777]",
  };
}
