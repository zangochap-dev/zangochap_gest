"use client";

import { ArrowLeft, ShieldCheck, UserRound, Save, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRiderPersonnel, saveRiderPersonnel } from "./actions";
import { personnelRoles, personnelSections, allowedPersonnelDocument, documentKinds, personnelCompletion, type DocumentKind, type PersonnelData } from "./types";
import "./personnel.css";

type Initial = Awaited<ReturnType<typeof getRiderPersonnel>>;
export default function RiderPersonnelForm({ initial }: { initial: Initial }) {
  const [readOnly, setReadOnly] = useState(true);
  const [data, setData] = useState<PersonnelData>(initial.data);
  const [savedData, setSavedData] = useState(initial.data);
  const dirty = JSON.stringify(data) !== JSON.stringify(savedData);
  const [version, setVersion] = useState(initial.version);
  const [documents, setDocuments] = useState(initial.documents);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const portrait = documents.find(document => document.kind === "portrait");
  const completion = personnelCompletion(data, documents, initial.role);
  const report = (text: string, failed = false) => { setMessage(text); setError(failed); };
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); report("");
    try {
      const result = await saveRiderPersonnel(initial.userId, data, version);
      if (!result.success) { report(result.error, true); return; }
      setVersion(result.version); setSavedData({ ...data }); report("Fiche enregistrée.");
    } catch { report("Enregistrement impossible. Vérifiez votre connexion.", true); }
    finally { setBusy(false); }
  }
  async function upload(kind: DocumentKind, file: File) {
    if (!version) { report("Enregistrez d’abord la fiche avant d’ajouter les documents.", true); return; }
    if (file.size > 5 * 1024 * 1024) { report("Chaque fichier doit faire au maximum 5 Mo.", true); return; }
    setBusy(true); report("");
    try {
      const body = new FormData(); body.set("kind", kind); body.set("file", file);
      const response = await fetch(`/api/personnel/riders/${encodeURIComponent(initial.userId)}/documents`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) { report(result.error || "Envoi impossible.", true); return; }
      setDocuments(current => [result.document, ...current]);
      report("Document ajouté. Les versions précédentes sont conservées.");
    } catch { report("Envoi interrompu. Rechargez la fiche pour vérifier si le document a été enregistré.", true); }
    finally { setBusy(false); }
  }
  return <div className="personnel-page">
    <Link className="personnel-back" href="/zangochap-manager/admin/settings/team"><ArrowLeft size={15} /> Équipe & personnel</Link>
    <header className="personnel-header">
      <div className="personnel-identity">
        {portrait ? <Image className="personnel-portrait" src={`/api/personnel/documents/${encodeURIComponent(portrait.id)}`} alt="Photo du membre du personnel" width={64} height={64} unoptimized /> : <div className="personnel-avatar"><UserRound size={28} /></div>}
        <div><span className="personnel-eyebrow">DOSSIER DU PERSONNEL</span><h1>{initial.accountName}</h1><p>{personnelRoles[initial.role]} <span className="personnel-badge">{data.status || "Statut à renseigner"}</span></p></div>
      </div>
      <div className="personnel-header-meta"><span><ShieldCheck size={14} /> Accès confidentiel</span><small>Identifiant : {initial.userId}</small></div>
      <div className="personnel-ring-card"><span>Profil complété</span><div className="personnel-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="33" /><circle cx="40" cy="40" r="33" pathLength="100" strokeDasharray={`${completion.percent} 100`} /></svg><strong>{completion.percent}%</strong></div><small>{completion.filled} sur {completion.total} éléments</small></div>
    </header>
    <div className="personnel-mode-switch" aria-label="Mode du dossier"><button type="button" aria-pressed={readOnly} disabled={busy} onClick={() => setReadOnly(true)}>Vue détaillée</button><button type="button" aria-pressed={!readOnly} disabled={busy} onClick={() => setReadOnly(false)}>Modifier la fiche</button><span>{readOnly ? "Consultation des informations saisies" : "Saisie et mise à jour du dossier"}</span></div>
    <div className="personnel-save"><div><strong>{dirty ? "Modifications non enregistrées" : version ? "Fiche enregistrée" : "Nouveau dossier"}</strong><span role="status" className={error ? "personnel-error" : ""}>{message || "La progression évolue avec les informations renseignées."}</span></div>{readOnly ? <button type="button" disabled={busy} onClick={() => setReadOnly(false)}>Modifier les informations</button> : <button form="personnel-form" type="submit" disabled={busy || (!dirty && version > 0)}><Save size={16} />{busy ? "Traitement…" : "Enregistrer la fiche"}</button>}</div>
    <div className="personnel-overview">
      <article><h2>Informations professionnelles</h2><dl><div><dt>Matricule</dt><dd>{data.matricule || "Non renseigné"}</dd></div><div><dt>Fonction</dt><dd>{data.job || personnelRoles[initial.role]}</dd></div><div><dt>Date d’entrée</dt><dd>{data.startDate ? data.startDate.split("-").reverse().join("/") : "Non renseignée"}</dd></div></dl><a href="#personnel-section-4">Consulter les informations →</a></article>
      <article><h2>Coordonnées & affectation</h2><dl><div><dt>Téléphone</dt><dd>{data.phone || "Non renseigné"}</dd></div><div><dt>Commune</dt><dd>{data.commune || "Non renseignée"}</dd></div><div><dt>Zone</dt><dd>{data.assignmentZone || "Non renseignée"}</dd></div></dl><a href="#personnel-section-1">Voir les coordonnées →</a></article>
      <article><h2>Documents du dossier</h2><dl><div><dt>Justificatifs présents</dt><dd>{new Set(documents.filter(doc => allowedPersonnelDocument(initial.role, doc.kind)).map(doc => doc.kind)).size}</dd></div><div><dt>Photo récente</dt><dd>{portrait ? "Disponible" : "À ajouter"}</dd></div><div><dt>Accès</dt><dd>Administration</dd></div></dl><a href="#personnel-documents">Consulter les documents →</a></article>
    </div>

    <div className="personnel-workspace">
    <aside className="personnel-sidebar">
      <div className="personnel-nav-title">Fiche du personnel</div>
      <nav aria-label="Rubriques de la fiche">{personnelSections(initial.role).map((section, index) => <a key={section.title} href={`#personnel-section-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}<a href="#personnel-documents"><FileText size={15} /> Photos & documents</a></nav>
      <p><ShieldCheck size={16} /> Informations réservées à l’administration.</p>
    </aside>
    <main className="personnel-main">
    <section className="personnel-completion" aria-label="Progression de la fiche">
      <div><strong>Complétude du dossier</strong><strong>{completion.percent} %</strong></div>
      <progress max={100} value={completion.percent} aria-label="Pourcentage de remplissage">{completion.percent} %</progress>
      <p>{completion.filled} / {completion.total} informations et justificatifs complétés. Pensez à enregistrer vos modifications.</p>
      <details><summary>{completion.missing.length ? "Voir les informations à compléter" : "Fiche complète — voir le calcul"}</summary>
        <p>Les téléphones secondaires et la photo du véhicule restent facultatifs, hors calcul. Les informations de départ comptent seulement pour le statut « Parti ». Pour les livreurs uniquement, permis, carte grise et assurance comptent pour une moto ou voiture, ou lorsqu’un numéro est renseigné. Les données invalides ne sont pas comptées comme complètes.</p>
        {completion.missing.length > 0 && <ul>{completion.missing.map((label, index) => <li key={`${label}-${index}`}>{label}</li>)}</ul>}
      </details>
    </section>
    <p className="personnel-info">Complétez le dossier à votre rythme. Les champs marqués * sont obligatoires.</p>
    <form id="personnel-form" onSubmit={save}>
      {personnelSections(initial.role).map((section, index) => <fieldset id={`personnel-section-${index}`} key={section.title} disabled={busy}><legend><span>{String(index + 1).padStart(2, "0")}</span> {section.title}</legend>
        <div className="personnel-fields">{section.fields.map(field => {
          const [key, label] = field;
          const type = field.length > 2 ? field[2] : "text";
          const required = ["lastName", "firstName"].includes(key) || (key === "departureDate" && data.status === "Parti");
          if (readOnly) return <div className="personnel-detail-field" key={key}><span>{label}</span><strong>{data[key] ? type === "date" ? data[key].split("-").reverse().join("/") : data[key] : "Non renseigné"}</strong></div>;
          return <label key={key} htmlFor={`personnel-${key}`}>{label}{required ? " *" : ""}
            {type === "select" ? <select id={`personnel-${key}`} value={data[key]} onChange={event => setData(current => ({ ...current, [key]: event.target.value }))}>
              {field.slice(3).map(option => <option key={option} value={option}>{option || "Non renseigné"}</option>)}
            </select> : <input id={`personnel-${key}`} type={type} value={data[key]} required={required} maxLength={type === "tel" ? 30 : 500} autoComplete="off"
              onChange={event => setData(current => ({ ...current, [key]: event.target.value }))} />}
          </label>;
        })}</div>
        {index === 4 && <p className="personnel-help">Le statut administratif sert au suivi du dossier. Les accès au compte se gèrent séparément dans l’équipe.</p>}
      </fieldset>)}
    </form>
    <section id="personnel-documents" className="personnel-documents"><h2><FileText size={20} /> Photos & justificatifs</h2><p>Images JPG, PNG ou WebP ; PDF pour les justificatifs. Maximum 5 Mo par fichier. Ajoutez uniquement les documents applicables.</p>
      {message && <p role="status" className={error ? "personnel-error" : ""}>{message}</p>}
      {!version && <p>Enregistrez la fiche pour activer l’ajout de documents.</p>}
      <div className="personnel-fields">{Object.entries(documentKinds).filter(([kind]) => allowedPersonnelDocument(initial.role, kind)).map(([kind, label]) => {
        const history = documents.filter(document => document.kind === kind);
        const latest = history[0];
        return <div className="personnel-document" key={kind}><h3>{label}</h3>
          {latest ? <a href={`/api/personnel/documents/${encodeURIComponent(latest.id)}`} target="_blank" rel="noreferrer">Consulter la dernière version</a> : <p>Aucun fichier</p>}
          {!readOnly && <label>Ajouter {latest ? "une nouvelle version" : "un fichier"}<input type="file" disabled={busy || !version} accept={kind === "portrait" || kind === "vehicle" ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf"}
            onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(kind as DocumentKind, file); }} /></label>}
          {history.length > 1 && <details><summary>Versions précédentes ({history.length - 1})</summary>{history.slice(1).map(document => <p key={document.id}><a href={`/api/personnel/documents/${encodeURIComponent(document.id)}`} target="_blank" rel="noreferrer">{new Date(document.createdAt).toLocaleString("fr-FR")}</a></p>)}</details>}
        </div>;
      })}</div>
    </section>
    </main></div>

  </div>;
}
