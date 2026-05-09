"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Calendar, 
  HardDrive,
  Download,
  MoreVertical,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { deleteMediaFile } from "@/modules/media/actions";
import { useToast } from "@/components/Toast";
import Topbar from "@/components/Topbar";
import Link from "next/link";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: Date;
}

interface MediaClientProps {
  initialFiles: MediaFile[];
}

export default function MediaClient({ initialFiles }: MediaClientProps) {
  const { showToast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  const filteredFiles = useMemo(() => {
    return files.filter(f => 
      f.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [files, search]);

  const handleDelete = async (fileName: string) => {
    try {
      setDeleting(fileName);
      const res = await deleteMediaFile(fileName);
      if (res.success) {
        setFiles(prev => prev.filter(f => f.name !== fileName));
        if (selectedFile?.name === fileName) setSelectedFile(null);
        showToast("Fichier supprimé avec succès", "success");
      } else {
        showToast(res.error || "Erreur lors de la suppression", "error");
      }
    } catch (error) {
      showToast("Erreur réseau lors de la suppression", "error");
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="media-container">
      <Topbar 
        title="Médiathèque" 
        subtitle={`${files.length} fichiers stockés`}
      />

      <div className="media-content">
        {/* FILTERS & SEARCH */}
        <div className="media-toolbar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher un fichier..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="clear-search">
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="toolbar-stats">
            <div className="stat-item">
              <HardDrive size={14} />
              <span>{formatSize(files.reduce((acc, f) => acc + f.size, 0))} utilisés</span>
            </div>
          </div>
        </div>

        {/* GRID */}
        {filteredFiles.length > 0 ? (
          <div className="media-grid">
            <AnimatePresence mode="popLayout">
              {filteredFiles.map((file) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={file.name}
                  className={`media-card ${selectedFile?.name === file.name ? 'selected' : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="card-preview">
                    {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                      <img src={file.url} alt={file.name} loading="lazy" />
                    ) : (
                      <div className="file-icon-placeholder">
                        <FileText size={40} />
                      </div>
                    )}
                  </div>
                  <div className="card-info">
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <span className="file-meta">{formatSize(file.size)}</span>
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Supprimer ce fichier ?")) handleDelete(file.name);
                      }}
                      disabled={deleting === file.name}
                      className="btn-delete"
                    >
                      {deleting === file.name ? (
                        <div className="spinner-xs" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <ImageIcon size={48} />
            </div>
            <h3>Aucun fichier trouvé</h3>
            <p>Essayez une autre recherche ou vérifiez le dossier uploads.</p>
          </div>
        )}
      </div>

      {/* DETAIL SIDEBAR / MODAL */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="detail-panel"
          >
            <div className="panel-header">
              <h3>Détails du fichier</h3>
              <button onClick={() => setSelectedFile(null)} className="close-panel">
                <X size={20} />
              </button>
            </div>

            <div className="panel-scroll">
              <div className="panel-preview">
                <img src={selectedFile.url} alt={selectedFile.name} />
              </div>

              <div className="info-list">
                <div className="info-item">
                  <div className="info-label">Nom du fichier</div>
                  <div className="info-value truncate">{selectedFile.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Type</div>
                  <div className="info-value uppercase">{selectedFile.name.split('.').pop()}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Taille</div>
                  <div className="info-value">{formatSize(selectedFile.size)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Date d'ajout</div>
                  <div className="info-value">
                    {format(new Date(selectedFile.createdAt), "d MMMM yyyy HH:mm", { locale: fr })}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">URL publique</div>
                  <div className="info-value code-box">
                    <span>{selectedFile.url}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + selectedFile.url);
                        showToast("URL copiée !", "success");
                      }}
                      className="copy-btn"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel-actions">
                <a 
                  href={selectedFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-btn secondary"
                >
                  <ExternalLink size={16} />
                  Ouvrir
                </a>
                <button 
                  onClick={() => {
                    if (confirm("Supprimer définitivement ce fichier ?")) handleDelete(selectedFile.name);
                  }}
                  className="action-btn danger"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .media-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #FAF6F1;
          position: relative;
          overflow: hidden;
        }

        .media-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        /* TOOLBAR */
        .media-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #6B4838;
          opacity: 0.5;
        }

        .search-input {
          width: 100%;
          padding: 12px 40px;
          background: white;
          border: 1px solid #E8DDD0;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #D4541C;
          box-shadow: 0 0 0 3px rgba(212, 84, 28, 0.08);
        }

        .clear-search {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #6B4838;
          opacity: 0.5;
        }

        .toolbar-stats {
          display: flex;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #F4E4D7;
          color: #B33D0E;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
        }

        /* GRID */
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .media-card {
          background: white;
          border: 1px solid #E8DDD0;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .media-card:hover {
          transform: translateY(-4px);
          border-color: #D4541C;
          box-shadow: 0 10px 20px rgba(74, 46, 31, 0.08);
        }

        .media-card.selected {
          border-color: #D4541C;
          background: #FDF1D9;
          box-shadow: 0 0 0 2px #D4541C;
        }

        .card-preview {
          aspect-ratio: 1;
          width: 100%;
          background: #F2EBE0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-bottom: 1px solid #E8DDD0;
        }

        .card-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .media-card:hover .card-preview img {
          transform: scale(1.05);
        }

        .file-icon-placeholder {
          color: #6B4838;
          opacity: 0.3;
        }

        .card-info {
          padding: 10px 12px;
        }

        .file-name {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #1A1410;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-meta {
          font-size: 11px;
          color: #6B4838;
          font-weight: 600;
          margin-top: 2px;
        }

        .card-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .media-card:hover .card-actions {
          opacity: 1;
        }

        .btn-delete {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          color: #C73E1D;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(199, 62, 29, 0.2);
          transition: all 0.2s;
        }

        .btn-delete:hover {
          background: #C73E1D;
          color: white;
        }

        /* EMPTY STATE */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
          color: #6B4838;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: #F2EBE0;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          margin-bottom: 8px;
          color: #1A1410;
        }

        .empty-state p {
          font-size: 14px;
          max-width: 300px;
          line-height: 1.5;
        }

        /* DETAIL PANEL */
        .detail-panel {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 360px;
          background: white;
          box-shadow: -10px 0 30px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          z-index: 100;
          border-left: 1px solid #E8DDD0;
        }

        .panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid #E8DDD0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-header h3 {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 700;
        }

        .close-panel {
          color: #6B4838;
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .close-panel:hover {
          opacity: 1;
        }

        .panel-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .panel-preview {
          width: 100%;
          aspect-ratio: 16/9;
          background: #F2EBE0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #E8DDD0;
        }

        .panel-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .info-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6B4838;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1A1410;
          word-break: break-all;
        }

        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .code-box {
          background: #FAF6F1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #E8DDD0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .code-box span {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .copy-btn {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          background: white;
          border: 1px solid #E8DDD0;
          border-radius: 4px;
          color: #D4541C;
        }

        .panel-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s;
          text-decoration: none;
        }

        .action-btn.secondary {
          background: #F2EBE0;
          color: #1A1410;
        }

        .action-btn.secondary:hover {
          background: #E8DDD0;
        }

        .action-btn.danger {
          background: #FCE4DE;
          color: #C73E1D;
        }

        .action-btn.danger:hover {
          background: #C73E1D;
          color: white;
        }

        .spinner-xs {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(199, 62, 29, 0.3);
          border-top-color: #C73E1D;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .detail-panel {
            width: 100%;
            border-left: none;
          }
        }
      `}</style>
    </div>
  );
}
