"use client";

import React, { useState, useTransition, useRef } from "react";
import Topbar from "@/components/Topbar";
import { TableCard, EmptyState, InfoBanner, SectionLabel } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { Upload, FileText, AlertCircle } from "lucide-react";

export default function ImportPage() {
  return (
    <>
      <Topbar title="Importer" subtitle="données" />
      <ImportClient />
    </>
  );
}

function ImportClient() {
  const [type, setType] = useState<'products' | 'orders'>('products');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    // Parse CSV or JSON
    const text = await f.text();
    try {
      if (f.name.endsWith('.json')) {
        const data = JSON.parse(text);
        setPreview(Array.isArray(data) ? data.slice(0, 10) : [data]);
      } else if (f.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1, 11).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => { obj[h] = values[i] || ''; });
          return obj;
        });
        setPreview(rows);
      } else {
        showToast('Format non supporté. Utilisez CSV ou JSON.', 'error');
        setPreview([]);
      }
    } catch {
      showToast('Erreur de lecture du fichier', 'error');
      setPreview([]);
    }
  };

  const handleImport = () => {
    if (!file || !preview.length) {
      showToast('Ajoutez un fichier valide', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const text = await file.text();
        let data: any[];
        if (file.name.endsWith('.json')) {
          data = JSON.parse(text);
          if (!Array.isArray(data)) data = [data];
        } else {
          const lines = text.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i] || ''; });
            return obj;
          });
        }

        const res = await fetch(`/api/import?type=${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Erreur serveur');
        const result = await res.json();
        showToast(`${result.count} élément(s) importé(s) ✓`, 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur d\'importation', 'error');
      }
    });
  };

  return (
    <div className="content animate-fade-in">
      <InfoBanner variant="blue">
        Importez des produits ou commandes depuis un fichier CSV ou JSON. Les fichiers doivent respecter le format attendu.
      </InfoBanner>

      <div className="form-grid" style={{ maxWidth: 500, marginBottom: 18 }}>
        <div className="form-row">
          <label className="field-label">Type d'import</label>
          <select className="field-input" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="products">Produits</option>
            <option value="orders">Commandes</option>
          </select>
        </div>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed var(--line)',
          borderRadius: 14,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          background: 'white',
          marginBottom: 18,
          transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {file ? file.name : 'Cliquer pour sélectionner un fichier'}
        </div>
        <div className="cell-muted" style={{ marginTop: 6 }}>CSV, JSON — Max 10 Mo</div>
      </div>
      <input type="file" ref={fileRef} accept=".csv,.json" style={{ display: 'none' }} onChange={handleFileChange} />

      {preview.length > 0 && (
        <>
          <SectionLabel spaced>Aperçu ({preview.length} ligne(s))</SectionLabel>
          <TableCard title="Aperçu des données">
            <div className="table-wrap">
              <table style={{ fontSize: 11 }}>
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v: any, j) => (
                        <td key={j}>{typeof v === 'object' ? JSON.stringify(v) : String(v).slice(0, 50)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-orange" onClick={handleImport} disabled={isPending}>
              <Upload size={14} /> {isPending ? 'Importation...' : 'Lancer l\'importation'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
