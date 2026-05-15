'use client';
 
import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
 
export default function ManagerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service if needed
    console.error('Manager Error Boundary:', error);
  }, [error]);
 
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-fade-in">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      
      <h1 className="text-2xl font-black text-[#1C1C1E] mb-2">Oups ! Une erreur est survenue</h1>
      <p className="text-[#8E8E93] max-w-md mb-8 font-medium">
        L'interface a rencontré un problème inattendu. Ne vous inquiétez pas, vos données sont en sécurité.
      </p>
 
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="btn-orange px-8 py-3 flex items-center gap-2 justify-center"
        >
          <RefreshCw size={18} />
          Réessayer
        </button>
        
        <Link 
          href="/zangochap-manager"
          className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center"
        >
          <Home size={18} />
          Tableau de bord
        </Link>
      </div>

      <div className="mt-12 p-4 bg-gray-50 rounded-xl border border-gray-100 max-w-lg w-full">
        <p className="text-[10px] font-mono text-gray-400 break-all">
          ID Erreur : {error.digest || 'N/A'} <br />
          {error.message}
        </p>
      </div>
    </div>
  );
}
