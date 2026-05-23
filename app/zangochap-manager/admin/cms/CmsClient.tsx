"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  ExternalLink,
  Eye,
  Grid3X3,
  Image as ImageIcon,
  LayoutTemplate,
  Megaphone,
  MousePointerClick,
  PackageOpen,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { saveHomeCmsContent, resetHomeCmsContent } from "@/modules/cms/actions";
import { uploadMediaFile } from "@/modules/media/actions";
import { processImageFile } from "@/lib/image-upload-helper";
import { HomeCmsContent } from "@/modules/cms/types";
import { reloadOnStaleServerAction } from "@/lib/stale-server-action";

type Field = {
  key: keyof HomeCmsContent;
  label: string;
  hint?: string;
  type?: "input" | "textarea" | "checkbox" | "categories" | "select" | "image" | "collectionsList" | "divider";
  options?: Array<{ label: string; value: string }>;
  span?: "full";
};

type CmsTab = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: Field[];
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
};

type MediaFile = {
  name: string;
  url: string;
  size: number;
  createdAt: string | Date;
};

const TABS: CmsTab[] = [
  {
    id: "hero",
    title: "Hero",
    description: "Premier ecran, bandeau et boutons principaux.",
    icon: <LayoutTemplate size={17} />,
    fields: [
      { key: "announcement", label: "Bandeau d'annonce", hint: "Texte court affiche au-dessus du hero.", span: "full" },
      { key: "div_hero1" as keyof HomeCmsContent, label: "Section Principale", type: "divider", span: "full" },
      { key: "heroImage", label: "Image de fond (Background)", type: "image", span: "full" },
      { key: "heroEyebrow", label: "Petit titre (Eyebrow)" },
      { key: "heroTitle", label: "Grand titre", type: "textarea", span: "full" },
      { key: "heroDescription", label: "Description", type: "textarea", span: "full" },
      { key: "div_hero2" as keyof HomeCmsContent, label: "Boutons & Actions", type: "divider", span: "full" },
      { key: "heroPrimaryLabel", label: "Bouton principal" },
      { key: "heroPrimaryHref", label: "Lien principal", hint: "Ex: /shop" },
      { key: "heroSecondaryLabel", label: "Bouton secondaire" },
      { key: "heroSecondaryHref", label: "Lien secondaire", hint: "Ex: /shop?category=Chaussures" },
    ],
  },
  {
    id: "trust",
    title: "Confiance",
    description: "Les trois arguments juste sous le hero.",
    icon: <ShieldCheck size={17} />,
    fields: [
      { key: "trustDelivery", label: "Livraison" },
      { key: "trustQuality", label: "Qualite" },
      { key: "trustPayment", label: "Paiement" },
    ],
  },
  {
    id: "categories",
    title: "Categories",
    description: "Raccourcis de navigation visibles sur la home.",
    icon: <Grid3X3 size={17} />,
    fields: [
      { key: "categoriesEnabled", label: "Afficher la section Rayons / Categories", type: "checkbox", span: "full" },
      { key: "categoriesEyebrow", label: "Petit titre" },
      { key: "categoriesTitle", label: "Titre" },
      { key: "categoriesDescription", label: "Description", type: "textarea", span: "full" },
      { key: "featuredCategoryIds", label: "Categories a afficher", type: "categories", span: "full" },
    ],
  },
  {
    id: "collections",
    title: "Collections",
    description: "Les trois univers visuels mis en avant.",
    icon: <ImageIcon size={17} />,
    fields: [
      { key: "collectionsEnabled", label: "Afficher les collections", type: "checkbox", span: "full" },
      { key: "collectionsEyebrow", label: "Petit titre", span: "full" },
      { key: "collectionsTitle", label: "Titre section", span: "full" },
      { key: "collectionsList", label: "Liste des collections", type: "collectionsList", span: "full" },
    ],
  },
  {
    id: "popup",
    title: "Popup",
    description: "Message marketing qui s'affiche sur le site public.",
    icon: <Megaphone size={17} />,
    fields: [
      { key: "popupEnabled", label: "Activer la popup", type: "checkbox", span: "full" },
      { key: "div_popup1" as keyof HomeCmsContent, label: "Comportement & Apparence", type: "divider", span: "full" },
      {
        key: "popupTheme", label: "Theme", type: "select", options: [
          { label: "Clair", value: "light" },
          { label: "Sombre", value: "dark" },
          { label: "Orange", value: "orange" },
        ]
      },
      {
        key: "popupPosition", label: "Position", type: "select", options: [
          { label: "Centre", value: "center" },
          { label: "Bas droite", value: "bottom-right" },
          { label: "Bas centre", value: "bottom-center" },
        ]
      },
      {
        key: "popupSize", label: "Taille", type: "select", options: [
          { label: "Compacte", value: "small" },
          { label: "Standard", value: "medium" },
          { label: "Large", value: "large" },
        ]
      },
      {
        key: "popupFrequency", label: "Frequence d'affichage", type: "select", options: [
          { label: "Une fois par session", value: "session" },
          { label: "Une fois par navigateur", value: "once" },
          { label: "A chaque visite", value: "always" },
        ]
      },
      { key: "popupDelayMs", label: "Delai d'apparition (ms)", hint: "900 = presque immediat, 3000 = apres 3 secondes." },

      { key: "div_popup2" as keyof HomeCmsContent, label: "Visuel", type: "divider", span: "full" },
      { key: "popupShowImage", label: "Afficher l'image", type: "checkbox", span: "full" },
      { key: "popupImage", label: "Image (Optionnelle)", type: "image", span: "full" },

      { key: "div_popup3" as keyof HomeCmsContent, label: "Contenu Textuel", type: "divider", span: "full" },
      { key: "popupEyebrow", label: "Surtitre (Eyebrow)" },
      { key: "popupTitle", label: "Titre principal" },
      { key: "popupDescription", label: "Message", type: "textarea", span: "full" },

      { key: "div_popup4" as keyof HomeCmsContent, label: "Actions", type: "divider", span: "full" },
      { key: "popupButtonLabel", label: "Bouton principal" },
      { key: "popupButtonHref", label: "Lien principal" },
      { key: "popupSecondaryLabel", label: "Bouton secondaire" },
      { key: "popupSecondaryHref", label: "Lien secondaire", hint: "Laissez vide pour fermer la popup." },
      { key: "popupCloseLabel", label: "Texte de fermeture", hint: "Texte discret en bas de popup" },
    ],
  },
  {
    id: "products",
    title: "Produits",
    description: "Ventes flash, nouveautes et bouton catalogue.",
    icon: <PackageOpen size={17} />,
    fields: [
      { key: "div_prod1" as keyof HomeCmsContent, label: "Ventes Flash", type: "divider", span: "full" },
      { key: "flashEnabled", label: "Afficher la section Ventes Flash", type: "checkbox", span: "full" },
      { key: "flashTitle", label: "Titre" },
      { key: "flashDescription", label: "Description", type: "textarea", span: "full" },

      { key: "div_prod2" as keyof HomeCmsContent, label: "Nouveautés", type: "divider", span: "full" },
      { key: "newArrivalsEnabled", label: "Afficher la section Nouveautes", type: "checkbox", span: "full" },
      { key: "newArrivalsLimit", label: "Nombre limite de produits", hint: "Ex: 24" },
      { key: "newArrivalsEyebrow", label: "Petit titre (Eyebrow)" },
      { key: "newArrivalsTitle", label: "Titre principal" },
      { key: "newArrivalsDescription", label: "Description", type: "textarea", span: "full" },
      { key: "catalogButtonLabel", label: "Texte du bouton catalogue", span: "full" },
    ],
  },
];

export default function CmsClient({
  initialContent,
  categories,
  mediaFiles,
}: {
  initialContent: HomeCmsContent;
  categories: CategoryOption[];
  mediaFiles: MediaFile[];
}) {
  const [content, setContent] = useState<HomeCmsContent>(initialContent);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [files, setFiles] = useState<MediaFile[]>(mediaFiles);
  const [activeGalleryField, setActiveGalleryField] = useState<string | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const currentTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const selectedCategories = useMemo(
    () => categories.filter((category) => content.featuredCategoryIds.includes(category.id)),
    [categories, content.featuredCategoryIds],
  );
  const filteredMediaFiles = useMemo(
    () => files.filter((file) => file.name.toLowerCase().includes(gallerySearch.toLowerCase())),
    [files, gallerySearch],
  );

  const updateField = (key: keyof HomeCmsContent, value: any) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const toggleCategory = (id: string) => {
    setContent((current) => ({
      ...current,
      featuredCategoryIds: current.featuredCategoryIds.includes(id)
        ? current.featuredCategoryIds.filter((categoryId) => categoryId !== id)
        : [...current.featuredCategoryIds, id],
    }));
  };

  const handleImageUpload = async (file: File, fieldKey: string) => {
    if (!file.type.startsWith("image/")) {
      showToast("Seules les images sont autorisees", "error");
      return;
    }

    setIsUploading(true);

    try {
      const { dataUrl, fileName } = await processImageFile(file);
      const result = await uploadMediaFile(dataUrl, fileName);

      if (!result.success || !result.url) {
        showToast(result.error || "Erreur lors de l'upload", "error");
        return;
      }

      const uploaded: MediaFile = {
        name: result.url.split("/").pop() || fileName,
        url: result.url,
        size: file.size,
        createdAt: new Date(),
      };

      setFiles((current) => [uploaded, ...current]);

      if (fieldKey.startsWith("collectionsList:")) {
        const idx = parseInt(fieldKey.split(":")[1]);
        const currentList = [...(content.collectionsList || [])];
        if (currentList[idx]) {
          currentList[idx].image = result.url;
          updateField("collectionsList", currentList);
        }
      } else {
        updateField(fieldKey as keyof HomeCmsContent, result.url);
        if (fieldKey === "popupImage") {
          updateField("popupShowImage", true);
        }
      }
      showToast("Image ajoutee", "success");
    } catch (error) {
      if (reloadOnStaleServerAction(error)) return;
      showToast(error instanceof Error ? error.message : "Erreur lors de l'upload", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveHomeCmsContent(content);
        showToast("Contenu public enregistre", "success");
      } catch (error) {
        if (reloadOnStaleServerAction(error)) return;
        showToast(error instanceof Error ? error.message : "Erreur lors de l'enregistrement", "error");
      }
    });
  };

  const handleReset = () => {
    if (!confirm("Reinitialiser le contenu public par defaut ?")) return;

    startTransition(async () => {
      try {
        await resetHomeCmsContent();
        window.location.reload();
      } catch (error) {
        if (reloadOnStaleServerAction(error)) return;
        showToast(error instanceof Error ? error.message : "Erreur lors de la reinitialisation", "error");
      }
    });
  };

  return (
    <div className="content animate-fade-in">
      <style jsx>{`
        @media (max-width: 1180px) {
          .cms-workspace {
            grid-template-columns: 220px minmax(0, 1fr) !important;
          }

          .cms-preview {
            grid-column: 1 / -1;
            position: static !important;
          }
        }

        @media (max-width: 760px) {
          .cms-workspace {
            grid-template-columns: 1fr !important;
          }

          .cms-nav {
            position: static !important;
          }

          .cms-nav-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cms-nav-item {
            grid-template-columns: 1fr !important;
          }

          .cms-nav-item small {
            display: none;
          }
        }
      `}</style>
      <div style={styles.shellHeader}>
        <div>
          <div style={styles.kicker}>CMS PUBLIC</div>
          <h2 style={styles.pageTitle}>Accueil, categories et popup</h2>
          <p style={styles.pageMeta}>Organisez le contenu visible par les clients sans toucher au code.</p>
        </div>
        <div style={styles.actions}>
          <Link href="/" target="_blank" className="btn-secondary">
            <Eye size={14} /> Voir le site
          </Link>
          <button className="btn-secondary" onClick={handleReset} disabled={isPending}>
            <RotateCcw size={14} /> Reinitialiser
          </button>
          <button className="btn-orange" onClick={handleSave} disabled={isPending}>
            <Save size={14} /> {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="cms-workspace" style={styles.workspace}>
        <nav className="table-card cms-nav" style={styles.navPanel}>
          <div style={styles.navTitle}>Sections</div>
          <div className="cms-nav-list" style={styles.navList}>
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  className="cms-nav-item"
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.navItem,
                    ...(active ? styles.navItemActive : {}),
                  }}
                >
                  <span style={{ ...styles.navIcon, ...(active ? styles.navIconActive : {}) }}>{tab.icon}</span>
                  <span style={styles.navText}>
                    <strong>{tab.title}</strong>
                    <small>{tab.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="table-card" style={styles.editorPanel}>
          <div className="table-head" style={styles.editorHead}>
            <div>
              <div className="table-title">{currentTab.title}</div>
              <div className="table-meta">{currentTab.description}</div>
            </div>
            <StatusPill label={currentTab.id === "popup" && content.popupEnabled ? "Active" : "Edition"} />
          </div>

          <div style={styles.formGrid}>
            {currentTab.fields.map((field) => (
              <CmsField
                key={field.key}
                field={field}
                content={content}
                categories={categories}
                mediaFiles={filteredMediaFiles}
                galleryOpen={activeGalleryField === field.key}
                gallerySearch={gallerySearch}
                isUploading={isUploading}
                onChange={updateField}
                onToggleCategory={toggleCategory}
                onOpenGallery={(subfield) => setActiveGalleryField(subfield || field.key)}
                onCloseGallery={() => setActiveGalleryField(null)}
                onGallerySearch={setGallerySearch}
                onSelectImage={(url) => {
                  if (activeGalleryField?.startsWith("collectionsList:")) {
                    const idx = parseInt(activeGalleryField.split(":")[1]);
                    const currentList = [...(content.collectionsList || [])];
                    if (currentList[idx]) {
                      currentList[idx].image = url;
                      updateField("collectionsList", currentList);
                    }
                  } else {
                    updateField(field.key, url);
                    if (field.key === "popupImage") {
                      updateField("popupShowImage", true);
                    }
                  }
                  setActiveGalleryField(null);
                }}
                onUploadImage={(file, subfield) => handleImageUpload(file, subfield || activeGalleryField || field.key)}
              />
            ))}
          </div>
        </section>

        <aside className="table-card cms-preview" style={styles.previewPanel}>
          <div className="table-head" style={{ marginBottom: 0, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="table-title">Apercu en direct</div>
              <div className="table-meta">N'oubliez pas d'enregistrer pour voir vos modifications</div>
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <Eye size={14} /> Ouvrir
            </a>
          </div>

          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '0 0 12px 12px', overflow: 'hidden', height: 'calc(100vh - 120px)', minHeight: 600 }}>
            <iframe
              src="/"
              style={{ width: '100%', height: '90%', border: 'none', display: 'block' }}
              title="Apercu en direct"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function CmsField({
  field,
  content,
  categories,
  mediaFiles,
  galleryOpen,
  gallerySearch,
  isUploading,
  onChange,
  onToggleCategory,
  onOpenGallery,
  onCloseGallery,
  onGallerySearch,
  onSelectImage,
  onUploadImage,
}: {
  field: Field;
  content: HomeCmsContent;
  categories: CategoryOption[];
  mediaFiles: MediaFile[];
  galleryOpen: boolean;
  gallerySearch: string;
  isUploading: boolean;
  onChange: (key: keyof HomeCmsContent, value: any) => void;
  onToggleCategory: (id: string) => void;
  onOpenGallery: (subfield?: string) => void;
  onCloseGallery: () => void;
  onGallerySearch: (value: string) => void;
  onSelectImage: (url: string) => void;
  onUploadImage: (file: File, subfield?: string) => void;
}) {
  const spanFull = field.span === "full" || field.type === "textarea" || field.type === "categories" || field.type === "image" || field.type === "collectionsList";

  if (field.type === "divider") {
    return (
      <div style={{ gridColumn: "1 / -1", marginTop: 16, marginBottom: 0, paddingBottom: 8, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "var(--orange)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{field.label}</h3>
      </div>
    );
  }

  return (
    <label className="form-row" style={{ ...styles.field, ...(spanFull ? styles.fieldFull : {}) }}>
      <span className="field-label-sm">{field.label}</span>

      {field.type === "categories" ? (
        <div style={styles.categoryPicker}>
          {categories.map((category) => {
            const selected = content.featuredCategoryIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory(category.id)}
                style={{
                  ...styles.categoryChip,
                  ...(selected ? styles.categoryChipActive : {}),
                }}
              >
                {category.name}
                <span style={{ opacity: 0.7 }}>({category._count?.products || 0})</span>
                {selected && <Check size={12} />}
              </button>
            );
          })}
          {categories.length === 0 && <span className="table-meta">Aucune categorie disponible.</span>}
        </div>
      ) : field.type === "image" ? (
        <div style={styles.imagePicker}>
          <div style={styles.imagePickerPreview}>
            {String(content[field.key]) ? (
              <img src={String(content[field.key])} alt="" style={styles.imagePickerImg} />
            ) : (
              <div style={styles.imagePickerEmpty}>
                <ImageIcon size={24} />
                <span>Aucune image</span>
              </div>
            )}
          </div>
          <div style={styles.imagePickerControls}>
            <input
              className="field-input"
              value={String(content[field.key])}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder="/images/hero_banner.png ou URL"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label className={`btn-secondary ${isUploading ? "disabled" : ""}`} style={{ cursor: isUploading ? "not-allowed" : "pointer" }}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUploadImage(file);
                    event.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
                <Upload size={14} /> {isUploading ? "Upload..." : "Uploader"}
              </label>
              <button type="button" className="btn-secondary" onClick={() => onOpenGallery()}>
                <ImageIcon size={14} /> Galerie
              </button>
              {String(content[field.key]) && (
                <button type="button" className="btn-secondary" onClick={() => onChange(field.key, "")}>
                  <X size={14} /> Retirer
                </button>
              )}
            </div>
          </div>

          {galleryOpen && (
            <div style={styles.galleryOverlay}>
              <div style={styles.galleryPanel}>
                <div style={styles.galleryHeader}>
                  <div>
                    <div className="table-title">Choisir une image</div>
                    <div className="table-meta">{mediaFiles.length} image(s) disponible(s)</div>
                  </div>
                  <button type="button" className="btn-secondary" onClick={onCloseGallery}>
                    <X size={14} /> Fermer
                  </button>
                </div>
                <div style={styles.gallerySearch}>
                  <Search size={16} />
                  <input
                    value={gallerySearch}
                    onChange={(event) => onGallerySearch(event.target.value)}
                    placeholder="Rechercher dans la galerie..."
                    style={styles.gallerySearchInput}
                  />
                </div>
                <div style={styles.galleryGrid}>
                  {mediaFiles.map((file) => (
                    <button
                      key={file.url}
                      type="button"
                      onClick={() => onSelectImage(file.url)}
                      style={styles.galleryItem}
                      title={file.name}
                    >
                      <img src={file.url} alt={file.name} style={styles.galleryImg} />
                      <span>{file.name}</span>
                    </button>
                  ))}
                  {mediaFiles.length === 0 && (
                    <div style={styles.galleryEmpty}>Aucune image trouvee.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : field.type === "collectionsList" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(content.collectionsList || []).map((collection, index) => (
            <div key={index} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8, background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Collection {index + 1}</strong>
                <button type="button" onClick={() => {
                  const newList = [...(content.collectionsList || [])];
                  newList.splice(index, 1);
                  onChange("collectionsList", newList);
                }} className="btn-secondary" style={{ padding: "4px 8px", color: "red", borderColor: "rgba(255,0,0,0.2)" }}>
                  <X size={12} /> Retirer
                </button>
              </div>
              <input
                className="field-input"
                value={collection.title}
                onChange={(e) => {
                  const newList = [...(content.collectionsList || [])];
                  newList[index].title = e.target.value;
                  onChange("collectionsList", newList);
                }}
                placeholder="Titre (ex: CHAUSSURES)"
              />
              <input
                className="field-input"
                value={collection.href}
                onChange={(e) => {
                  const newList = [...(content.collectionsList || [])];
                  newList[index].href = e.target.value;
                  onChange("collectionsList", newList);
                }}
                placeholder="Lien (ex: /shop?category=Chaussures)"
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {collection.image && <img src={collection.image} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />}
                <input
                  className="field-input"
                  value={collection.image}
                  onChange={(e) => {
                    const newList = [...(content.collectionsList || [])];
                    newList[index].image = e.target.value;
                    onChange("collectionsList", newList);
                  }}
                  placeholder="Image URL"
                  style={{ flex: 1 }}
                />
                <label className={`btn-secondary ${isUploading ? "disabled" : ""}`} style={{ cursor: isUploading ? "not-allowed" : "pointer", padding: "4px 8px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onUploadImage(file, `collectionsList:${index}`);
                      event.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                  <Upload size={14} /> {isUploading ? "Upload..." : "Uploader"}
                </label>
                <button type="button" className="btn-secondary" style={{ padding: "4px 8px" }} onClick={() => onOpenGallery(`collectionsList:${index}`)}>
                  <ImageIcon size={14} /> Galerie
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" style={{ alignSelf: "flex-start" }} onClick={() => {
            const newList = [...(content.collectionsList || [])];
            newList.push({ id: Math.random().toString(36).substring(7), title: "NOUVELLE COLLECTION", href: "/shop", image: "" });
            onChange("collectionsList", newList);
          }}>
            + Ajouter une collection
          </button>
        </div>
      ) : field.type === "checkbox" ? (
        <span style={styles.switchRow}>
          <input
            type="checkbox"
            checked={Boolean(content[field.key])}
            onChange={(event) => onChange(field.key, event.target.checked)}
            style={styles.checkbox}
          />
          <span>{Boolean(content[field.key]) ? "Active" : "Inactive"}</span>
        </span>
      ) : field.type === "select" ? (
        <select
          className="field-input"
          value={String(content[field.key])}
          onChange={(event) => onChange(field.key, event.target.value)}
        >
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          className="field-input"
          rows={4}
          value={String(content[field.key])}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      ) : (
        <input
          className="field-input"
          value={String(content[field.key])}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      )}

      {field.hint && <small style={styles.hint}>{field.hint}</small>}
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return <span style={styles.statusPill}>{label}</span>;
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryIcon}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getPopupPreviewTheme(theme: string): React.CSSProperties {
  if (theme === "dark") {
    return { background: "#1A1614", color: "#fff" };
  }

  if (theme === "orange") {
    return { background: "var(--orange-soft)", color: "var(--ink)", borderTopColor: "rgba(212,84,28,0.22)", borderRightColor: "rgba(212,84,28,0.22)", borderBottomColor: "rgba(212,84,28,0.22)", borderLeftColor: "rgba(212,84,28,0.22)" };
  }

  return {};
}

const styles: Record<string, React.CSSProperties> = {
  shellHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.24em",
    color: "var(--orange)",
  },
  pageTitle: {
    margin: "6px 0 4px",
    fontSize: 26,
    lineHeight: 1.05,
    color: "var(--ink)",
  },
  pageMeta: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 13,
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  workspace: {
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr) 340px",
    gap: 16,
    alignItems: "start",
  },
  navPanel: {
    padding: 10,
    position: "sticky",
    top: 16,
  },
  navTitle: {
    padding: "8px 10px 10px",
    color: "var(--muted)",
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
  },
  navList: {
    display: "grid",
    gap: 6,
  },
  navItem: {
    display: "grid",
    gridTemplateColumns: "34px 1fr",
    gap: 10,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: 8,
    padding: 8,
    background: "transparent",
    color: "var(--brown)",
    textAlign: "left",
    cursor: "pointer",
  },
  navItemActive: {
    background: "var(--orange-soft)",
    borderColor: "rgba(212,84,28,0.22)",
    color: "var(--ink)",
  },
  navIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    color: "var(--muted)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
  },
  navIconActive: {
    background: "var(--orange)",
    color: "#fff",
    borderColor: "var(--orange)",
  },
  navText: {
    display: "grid",
    gap: 2,
  },
  editorPanel: {
    overflow: "hidden",
  },
  editorHead: {
    alignItems: "flex-start",
  },
  formGrid: {
    padding: 24,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: 20,
  },
  field: {
    minWidth: 0,
  },
  fieldFull: {
    gridColumn: "1 / -1",
  },
  hint: {
    marginTop: 6,
    color: "var(--muted)",
    fontSize: 11,
  },
  categoryPicker: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: 8,
    background: "#fff",
    maxHeight: 210,
    overflowY: "auto",
  },
  categoryChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    background: "#fff",
    color: "var(--ink)",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  categoryChipActive: {
    background: "var(--ink)",
    color: "#fff",
    borderColor: "var(--ink)",
  },
  imagePicker: {
    display: "grid",
    gap: 12,
  },
  imagePickerPreview: {
    minHeight: 180,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  imagePickerImg: {
    width: "100%",
    height: 220,
    objectFit: "cover",
    display: "block",
  },
  imagePickerEmpty: {
    minHeight: 180,
    display: "grid",
    placeItems: "center",
    gap: 8,
    color: "var(--muted)",
    fontSize: 12,
    fontWeight: 800,
  },
  imagePickerControls: {
    display: "grid",
    gap: 10,
  },
  galleryOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1300,
    background: "rgba(26,20,16,0.52)",
    backdropFilter: "blur(4px)",
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryPanel: {
    width: "min(980px, 100%)",
    maxHeight: "86vh",
    overflow: "hidden",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
    display: "grid",
    gridTemplateRows: "auto auto minmax(0, 1fr)",
  },
  galleryHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: 18,
    borderBottom: "1px solid var(--border)",
  },
  gallerySearch: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: 14,
    padding: "0 12px",
    height: 42,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: 8,
    color: "var(--muted)",
  },
  gallerySearchInput: {
    flex: 1,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "transparent",
    outline: "none",
    fontSize: 13,
    color: "var(--ink)",
  },
  galleryGrid: {
    padding: "0 14px 14px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10,
    overflowY: "auto",
  },
  galleryItem: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: 8,
    background: "#fff",
    overflow: "hidden",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
  },
  galleryImg: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    display: "block",
    background: "var(--cream)",
  },
  galleryEmpty: {
    gridColumn: "1 / -1",
    padding: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "var(--border)",
    borderRadius: 8,
    textAlign: "center",
    color: "var(--muted)",
    fontSize: 13,
    fontWeight: 800,
  },
  switchRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    color: "var(--ink)",
    fontSize: 13,
    fontWeight: 800,
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "var(--orange)",
  },
  previewPanel: {
    position: "sticky",
    top: 16,
    overflow: "hidden",
  },
  heroPreview: {
    padding: 18,
    background: "#1A1614",
    color: "white",
    minHeight: 260,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 12,
  },
  previewEyebrow: {
    color: "var(--orange)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
  },
  previewHeroTitle: {
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 900,
    margin: 0,
    textTransform: "uppercase",
  },
  previewText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
  },
  previewButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  previewDarkButton: {
    background: "rgba(255,255,255,0.08)",
    color: "white",
  },
  summaryStack: {
    display: "grid",
    gap: 8,
    padding: 14,
    borderBottom: "1px solid var(--border)",
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    color: "var(--muted)",
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "var(--orange-soft)",
    color: "var(--orange)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  popupPreview: {
    margin: 14,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--border)",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  popupImage: {
    width: "100%",
    height: 118,
    objectFit: "cover",
    display: "block",
  },
  popupBody: {
    padding: 14,
    display: "grid",
    gap: 8,
  },
  popupEyebrow: {
    color: "var(--orange)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  popupTitle: {
    fontSize: 18,
    lineHeight: 1.1,
    color: "var(--ink)",
  },
  popupText: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 12,
    lineHeight: 1.45,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "var(--orange-soft)",
    color: "var(--orange)",
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
};
