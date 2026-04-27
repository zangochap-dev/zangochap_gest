"use client";

import React, { useState } from "react";
import Topbar from "@/components/Topbar";
import { TableCard } from "@/components/UI";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState("products");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStep(2);
    }
  };

  return (
    <>
      <Topbar title="Outil d'" subtitle="importation" />

      <div className="content animate-fade-in">
        <div className="tabs">
          <button 
            className={`tab ${importType === "products" ? "active" : ""}`}
            onClick={() => setImportType("products")}
          >
            Produits
          </button>
          <button 
            className={`tab ${importType === "orders" ? "active" : ""}`}
            onClick={() => setImportType("orders")}
          >
            Commandes
          </button>
          <button 
            className={`tab ${importType === "customers" ? "active" : ""}`}
            onClick={() => setImportType("customers")}
          >
            Clients
          </button>
        </div>

        {step === 1 && (
          <div className="upload-zone">
            <div className="upload-icon"><FileSpreadsheet size={48} /></div>
            <h3>Sélectionnez un fichier à importer</h3>
            <p>Formats supportés : CSV, Excel (.xlsx, .xls)</p>
            <label className="btn-orange" style={{ cursor: 'pointer', marginTop: '20px' }}>
              Parcourir les fichiers
              <input type="file" hidden onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
            </label>
            <div className="import-tips">
              <div className="tip-item">
                <CheckCircle2 size={14} /> Le mapping des colonnes se fera à l'étape suivante.
              </div>
              <div className="tip-item">
                <CheckCircle2 size={14} /> Les doublons seront ignorés automatiquement.
              </div>
            </div>
          </div>
        )}

        {step === 2 && file && (
          <div className="mapping-container">
            <TableCard title={`Configuration de l'import : ${file.name}`} meta={`${importType.toUpperCase()}`}>
              <div style={{ padding: '20px' }}>
                <div className="mapping-grid">
                  {[
                    { label: "Nom du produit", key: "name", required: true },
                    { label: "Prix de vente", key: "price", required: true },
                    { label: "Catégorie", key: "category", required: false },
                    { label: "Stock initial", key: "stock", required: false },
                  ].map((field) => (
                    <div key={field.key} className="mapping-row">
                      <label className="field-label">
                        {field.required && <span style={{ color: 'var(--orange)' }}>● </span>}
                        {field.label}
                      </label>
                      <select className="field-input">
                        <option>— Ne pas importer —</option>
                        <option selected>{field.label}</option>
                        <option>Colonne B</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn-secondary" onClick={() => setStep(1)}>Annuler</button>
                  <button className="btn-orange" onClick={() => setStep(3)}>Lancer l'importation</button>
                </div>
              </div>
            </TableCard>
          </div>
        )}

        {step === 3 && (
          <div className="result-container animate-fade-in">
            <div className="result-card success">
              <CheckCircle2 size={40} color="var(--green)" />
              <h2>Importation réussie !</h2>
              <p><strong>124 rapports</strong> ont été ajoutés à la base de données.</p>
              <div className="result-details">
                <span>✓ 124 lignes importées</span>
                <span>⚠️ 0 erreur</span>
              </div>
              <button className="btn-primary" onClick={() => setStep(1)} style={{ width: 'auto' }}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .content { padding: 24px 28px; }
        .tabs { display: flex; gap: 4px; background: var(--cream-2); padding: 4px; border-radius: 10px; margin-bottom: 24px; width: fit-content; }
        .tab { padding: 8px 16px; border-radius: 7px; font-size: 12px; font-weight: 600; color: var(--brown-soft); }
        .tab.active { background: white; color: var(--ink); box-shadow: var(--shadow-sm); }

        .upload-zone { 
          background: white; border: 2px dashed var(--line-2); border-radius: 20px; 
          padding: 60px 40px; text-align: center; display: flex; flex-direction: column; align-items: center;
        }
        .upload-icon { color: var(--line-2); margin-bottom: 20px; }
        .upload-zone h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 8px; }
        .upload-zone p { color: var(--brown-soft); font-size: 14px; }
        .import-tips { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; }
        .tip-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--brown-soft); }
        .tip-item :global(svg) { color: var(--green); }

        .mapping-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        
        .result-container { display: flex; justify-content: center; padding-top: 40px; }
        .result-card { background: white; border-radius: 24px; padding: 40px; text-align: center; box-shadow: var(--shadow-lg); max-width: 400px; width: 100%; border: 1px solid var(--line); }
        .result-card h2 { font-family: var(--font-display); font-size: 24px; margin: 16px 0 8px; }
        .result-card p { color: var(--brown-soft); margin-bottom: 24px; }
        .result-details { background: var(--cream); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left; margin-bottom: 24px; }
        .result-details span { font-size: 13px; font-weight: 600; }
      `}</style>
    </>
  );
}
