"use client";

import { X } from "lucide-react";
import type { PreviewItemData } from "./types";

interface ImageLightboxProps {
  item: PreviewItemData;
  onClose: () => void;
}

export default function ImageLightbox({ item, onClose }: ImageLightboxProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ textAlign: "center" }}>
        <img
          src={item.url}
          alt={item.name}
          style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 4 }}
        />
        <div style={{ color: "#fff", marginTop: 12, fontSize: 14, fontWeight: 700 }}>
          {item.name}
          {item.size && <span style={{ marginLeft: 8, opacity: 0.7 }}>{item.size}</span>}
          {item.color && <span style={{ marginLeft: 8, opacity: 0.7 }}>{item.color}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <X size={22} />
      </button>
    </div>
  );
}
