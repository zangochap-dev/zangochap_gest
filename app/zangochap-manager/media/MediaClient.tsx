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
  ChevronLeft,
  Plus,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { deleteMediaFile, uploadMediaFile } from "@/modules/media/actions";
import { useToast } from "@/components/Toast";
import Topbar from "@/components/Topbar";
import Link from "next/link";
import "./media-client.css";

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
  const [isUploading, setIsUploading] = useState(false);

  const filteredFiles = useMemo(() => {
    return files.filter(f => 
      f.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [files, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("Seules les images sont autorisées", "error");
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const res = await uploadMediaFile(dataUrl, file.name);
        
        if (res.success) {
          showToast("Image ajoutée avec succès", "success");
          // Refresh list
          const newFile: MediaFile = {
            name: res.url!.split('/').pop()!,
            url: res.url!,
            size: file.size,
            createdAt: new Date()
          };
          setFiles(prev => [newFile, ...prev]);
        } else {
          showToast(res.error || "Erreur lors de l'upload", "error");
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast("Erreur lors de la lecture du fichier", "error");
      setIsUploading(false);
    }
  };

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
          <div className="toolbar-actions">
            <label className={`upload-btn ${isUploading ? 'loading' : ''}`}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                disabled={isUploading}
                style={{ display: 'none' }} 
              />
              {isUploading ? (
                <div className="spinner-xs" />
              ) : (
                <Plus size={18} />
              )}
              <span>{isUploading ? "Envoi..." : "Ajouter"}</span>
            </label>
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
                        const fullUrl = selectedFile.url.startsWith('http') 
                          ? selectedFile.url 
                          : window.location.origin + selectedFile.url;
                        navigator.clipboard.writeText(fullUrl);
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

      
    </div>
  );
}
