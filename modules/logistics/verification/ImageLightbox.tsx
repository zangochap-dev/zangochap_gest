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
        inset: 0,
        zIndex: 110000,
        backgroundColor: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(15px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          position: "relative",
          maxWidth: "98vw", 
          maxHeight: "95vh", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          animation: "zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <img
          src={item.url}
          alt={item.name}
          style={{ 
            display: "block",
            maxWidth: "100%", 
            maxHeight: "80vh", 
            objectFit: "contain", 
            borderRadius: 16,
            boxShadow: "0 50px 100px rgba(0,0,0,0.8)",
            border: "2px solid rgba(255,255,255,0.2)"
          }}
        />
        
        {/* Infos de l'article en grand sous l'image */}
        <div style={{ marginTop: 24, textAlign: "center", color: "white" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em" }}>{item.name}</h2>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {item.size && <span style={{ background: "white", color: "black", padding: "6px 16px", borderRadius: 8, fontWeight: 900, fontSize: 18 }}>Taille {item.size}</span>}
            {item.color && <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "6px 16px", borderRadius: 8, fontWeight: 800, fontSize: 18, border: "1px solid rgba(255,255,255,0.3)" }}>{item.color}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            position: "fixed",
            top: 40,
            right: 40,
            background: "white",
            border: "none",
            color: "black",
            width: 60,
            height: 60,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            zIndex: 110001
          }}
        >
          <X size={36} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
