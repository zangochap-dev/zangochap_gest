"use client";

import React from "react";
import Modal from "@/components/Modal";

interface VariantsEditorModalProps {
  product: any;
  variants: any[];
  onClose: () => void;
  onSave: (variants: any[]) => void;
}

export default function VariantsEditorModal({ product, variants: initialVariants, onClose, onSave }: VariantsEditorModalProps) {
  const [variants, setVariants] = React.useState(initialVariants);
  
  const updateVariant = (idx: number, field: string, value: any) => {
    const next = [...variants];
    next[idx] = {
      ...next[idx],
      [field]: field === 'stock' ? Math.max(0, parseInt(value) || 0) : value
    };
    setVariants(next);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Stock · ${product.name}`}
      large
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-orange" onClick={() => onSave(variants)}>Enregistrer</button>
        </>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600 }}>{product.name}</div>
        <div style={{ fontSize: 11, color: 'var(--brown-soft)' }}>ID: {product.id}</div>
      </div>
      <div className="table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 4px', fontSize: 12 }}>Taille</th>
              <th style={{ padding: '8px 4px', fontSize: 12 }}>Couleur</th>
              <th style={{ padding: '8px 4px', fontSize: 12 }}>Stock</th>
              <th style={{ padding: '8px 4px', fontSize: 12 }}>Emplacement</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--line-2)' }}>
                <td style={{ padding: '8px 4px' }}><span className="size-dot">{v.size}</span></td>
                <td style={{ padding: '8px 4px', fontSize: 12, fontWeight: 600 }}>{v.color}</td>
                <td style={{ padding: '8px 4px' }}>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={e => updateVariant(i, 'stock', e.target.value)}
                    style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)' }}
                  />
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <input
                    type="text"
                    value={v.location || ''}
                    onChange={e => updateVariant(i, 'location', e.target.value)}
                    style={{ width: '100%', minWidth: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
