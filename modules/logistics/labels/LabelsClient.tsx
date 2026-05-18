"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Printer, Check, CheckSquare, Square, Tag, RefreshCw, CheckCircle2, Repeat } from "lucide-react";
import { toggleLabelStatus, checkAllLabels } from "./actions";

interface OrderLabel {
  id: string;
  ref: string;
  isLabeled: boolean;
  labeledAt: Date | null;
  labeledByName: string | null;
  createdAt: Date;
}

interface LabelsClientProps {
  initialOrders: OrderLabel[];
  currentUser: {
    name: string;
    role: string;
  };
}

export default function LabelsClient({ initialOrders, currentUser }: LabelsClientProps) {
  const [orders, setOrders] = useState<OrderLabel[]>(initialOrders);
  const [isPending, startTransition] = useTransition();

  const totalCount = orders.length;
  const labeledCount = orders.filter((o) => o.isLabeled).length;
  const progressPercent = totalCount > 0 ? Math.round((labeledCount / totalCount) * 100) : 0;

  // Calculate frequencies of each ref
  const refCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.ref] = (counts[o.ref] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const getDisplayRef = (ref: string) => {
    if (ref.startsWith("REPROGRAMME")) {
      return {
        prefix: "REPROG",
        code: ref.replace("REPROGRAMME", ""),
      };
    }
    if (ref.startsWith("ECHANGE")) {
      return {
        prefix: "ECHANGE",
        code: ref.replace("ECHANGE", ""),
      };
    }
    if (ref.startsWith("[SUPPRIMÉ] ")) {
      return {
        prefix: "SUPPRIMÉ",
        code: ref.replace("[SUPPRIMÉ] ", ""),
      };
    }
    return {
      prefix: null,
      code: ref,
    };
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              isLabeled: nextStatus,
              labeledAt: nextStatus ? new Date() : null,
              labeledByName: nextStatus ? currentUser.name : null,
            }
          : o
      )
    );

    startTransition(async () => {
      try {
        await toggleLabelStatus(id, nextStatus);
      } catch (error) {
        // Revert on failure
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  isLabeled: currentStatus,
                  labeledAt: o.labeledAt,
                  labeledByName: o.labeledByName,
                }
              : o
          )
        );
      }
    });
  };

  const handleCheckAll = (status: boolean) => {
    const orderIds = orders.map((o) => o.id);
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        isLabeled: status,
        labeledAt: status ? new Date() : null,
        labeledByName: status ? currentUser.name : null,
      }))
    );

    startTransition(async () => {
      try {
        await checkAllLabels(orderIds, status);
      } catch (error) {
        // Refresh page or handle error
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="labels-module-container">
      {/* HEADER SECTION (Hidden during print) */}
      <div className="labels-no-print">
        <div className="labels-header">
          <div className="labels-title-area">
            <div className="labels-icon-box">
              <Tag size={24} className="text-[#FF6B2C]" />
            </div>
            <div>
              <h1 className="labels-title">Étiquettes du Jour</h1>
              <p className="labels-subtitle">
                Cochez les étiquettes imprimées ou vérifiées. Liste propre pour impression directe.
              </p>
            </div>
          </div>
          <div className="labels-actions">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => handleCheckAll(labeledCount < totalCount)}
              disabled={isPending || totalCount === 0}
              style={{ height: 42, borderRadius: 12, padding: "0 16px", fontSize: 13, fontWeight: 700 }}
            >
              {labeledCount < totalCount ? <CheckSquare size={18} /> : <Square size={18} />}
              {labeledCount < totalCount ? "Tout cocher" : "Tout décocher"}
            </button>
            <button
              className="btn-orange flex items-center gap-2"
              onClick={handlePrint}
              disabled={totalCount === 0}
              style={{
                height: 42,
                borderRadius: 12,
                padding: "0 20px",
                fontSize: 13,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(255, 107, 44, 0.2)",
              }}
            >
              <Printer size={18} />
              Imprimer les Étiquettes
            </button>
          </div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="labels-progress-card">
          <div className="labels-progress-header">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className={progressPercent === 100 ? "text-emerald-500" : "text-[#FF6B2C]"} />
              <span className="labels-progress-title">Progression de l'étiquetage</span>
            </div>
            <span className="labels-progress-stats">
              {labeledCount} / {totalCount} étiquetées ({progressPercent}%)
            </span>
          </div>
          <div className="labels-progress-track">
            <div
              className={`labels-progress-bar ${progressPercent === 100 ? "bg-emerald-500" : "bg-[#FF6B2C]"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* PRINTABLE CONTENT: ONLY REFERENCES */}
      {totalCount === 0 ? (
        <div className="labels-empty labels-no-print">
          <Tag size={48} className="text-gray-300 mb-3" />
          <p>Aucune commande enregistrée pour cette journée.</p>
        </div>
      ) : (
        <div className="labels-grid">
          {orders.map((order) => {
            const count = refCounts[order.ref] || 1;
            const isRepeat = count > 1;
            const display = getDisplayRef(order.ref);
            return (
              <div
                key={order.id}
                onClick={() => handleToggle(order.id, order.isLabeled)}
                className={`label-tile ${order.isLabeled ? "labeled" : ""} ${isRepeat ? "repeated" : ""}`}
              >
                <div className="label-ref-container">
                  {display.prefix ? (
                    <div className="label-ref-split">
                      <span className="label-prefix">{display.prefix}</span>
                      <span className="label-code">{display.code}</span>
                    </div>
                  ) : (
                    <div className="label-ref">{order.ref}</div>
                  )}
                  {isRepeat && (
                    <>
                      <span className="repeat-badge labels-no-print" title={`Cette référence apparaît ${count} fois aujourd'hui`}>
                        <Repeat size={12} /> x{count}
                      </span>
                      <span className="print-repeat-badge">[🔄 x{count}]</span>
                    </>
                  )}
                </div>
                <div className="label-check-indicator labels-no-print">
                  {order.isLabeled ? (
                    <div className="label-checked-badge">
                      <Check size={14} className="text-white" />
                    </div>
                  ) : (
                    <div className="label-unchecked-box" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STYLES FOR LABELS MODULE & PRINT */}
      <style jsx global>{`
        .labels-module-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .labels-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .labels-title-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .labels-icon-box {
          width: 48px;
          height: 48px;
          background: rgba(255, 107, 44, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .labels-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 4px;
        }

        .labels-subtitle {
          font-size: 13px;
          color: var(--brown-soft);
          margin: 0;
        }

        .labels-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .labels-progress-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .labels-progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .labels-progress-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--ink);
        }

        .labels-progress-stats {
          font-size: 13px;
          font-weight: 700;
          color: var(--brown-soft);
        }

        .labels-progress-track {
          width: 100%;
          height: 10px;
          background: var(--cream);
          border-radius: 999px;
          overflow: hidden;
        }

        .labels-progress-bar {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
        }

        .labels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .label-tile {
          background: white;
          border: 2px solid var(--line);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .label-tile:hover {
          border-color: var(--brown-soft);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .label-tile.labeled {
          border-color: var(--orange);
          background: var(--orange-soft);
        }

        .label-ref {
          font-size: 20px;
          font-weight: 900;
          color: var(--ink);
          letter-spacing: 0.05em;
        }

        .label-tile.labeled .label-ref,
        .label-tile.labeled .label-code {
          color: var(--orange);
        }

        .label-ref-split {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .label-prefix {
          font-size: 11px;
          font-weight: 800;
          color: var(--orange);
          background: var(--orange-soft);
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .label-code {
          font-size: 20px;
          font-weight: 900;
          color: var(--ink);
          letter-spacing: 0.05em;
          font-family: monospace;
        }

        .label-ref-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .repeat-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FFF0ED;
          color: #FF3B30;
          border: 1px solid #FFD1CC;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
        }

        .print-repeat-badge {
          display: none;
        }

        .label-check-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .label-unchecked-box {
          width: 24px;
          height: 24px;
          border: 2px solid var(--brown-soft);
          border-radius: 6px;
          opacity: 0.4;
          transition: all 0.2s;
        }

        .label-tile:hover .label-unchecked-box {
          opacity: 1;
          border-color: var(--ink);
        }

        .label-checked-badge {
          width: 24px;
          height: 24px;
          background: var(--orange);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .labels-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: white;
          border: 1px border var(--line);
          border-radius: 16px;
          text-align: center;
          color: var(--brown-soft);
          font-weight: 600;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* === PRINT STYLES === */
        @media print {
          @page { margin: 10mm; size: A4 portrait; }

          /* Hide all navigation, headers, sidebars, and non-printable elements */
          .labels-no-print, nav, aside, header, .topbar, .lg\:hidden {
            display: none !important;
          }

          /* Unlock ALL scroll containers for multi-page pagination */
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .app-container, .main-content, .main-scroll-area, .content {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
            padding: 0 !important;
            margin: 0 !important;
            position: static !important;
            width: 100% !important;
          }

          .labels-module-container {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
            height: auto !important;
          }

          .labels-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            height: auto !important;
          }

          .label-tile {
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            padding: 16px !important;
            text-align: center !important;
            background: transparent !important;
            box-shadow: none !important;
            transform: none !important;
            display: block !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .label-ref {
            font-size: 26px !important;
            font-weight: 900 !important;
            color: #000 !important;
            margin: 0 !important;
            text-align: center !important;
            font-family: monospace !important;
          }

          .label-ref-split {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            line-height: 1 !important;
          }

          .label-prefix {
            font-size: 11px !important;
            font-weight: bold !important;
            color: #000 !important;
            background: transparent !important;
            border: 1px solid #000 !important;
            padding: 1px 4px !important;
            border-radius: 0 !important;
            display: inline-block !important;
            margin-bottom: 2px !important;
          }

          .label-code {
            font-size: 26px !important;
            font-weight: 900 !important;
            color: #000 !important;
            font-family: monospace !important;
            display: block !important;
            margin: 0 !important;
            text-align: center !important;
          }

          .repeat-badge {
            display: none !important;
          }

          .print-repeat-badge {
            display: inline !important;
            font-size: 18px !important;
            font-weight: bold !important;
            color: #000 !important;
            margin-left: 6px !important;
            border: 1px solid #000 !important;
            padding: 2px 6px !important;
            border-radius: 0 !important;
            background: #eee !important;
          }
        }
      `}</style>
    </div>
  );
}
