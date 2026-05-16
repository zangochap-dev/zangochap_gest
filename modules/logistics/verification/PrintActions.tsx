"use client";

import React, { useEffect } from "react";

export default function PrintActions({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="no-print mb-6 flex justify-center">
      <button 
        onClick={() => window.print()}
        className="bg-black text-white px-8 py-3 rounded-md font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95 transition-transform"
      >
        Lancer l'impression
      </button>
    </div>
  );
}
