# Fiches confidentielles du personnel

Implémentation locale du 22 septembre 2026, non déployée. Aucune migration ni opération sur une base réelle exécutée.

## Accès et contenu

Une barre de progression indique le pourcentage de remplissage en direct, le nombre d’éléments complétés et les manquants. Les informations invalides ne comptent pas comme complètes. Les règles d’inclusion des champs facultatifs et documents sont affichées sous la barre. Ce pourcentage ne signifie ni enregistrement automatique ni validation du dossier par une autorité.

Dans `/zangochap-manager/admin/settings/team`, le lien « Ouvrir la fiche du personnel » de chaque membre de l’équipe (hors CUSTOMER) ouvre `/zangochap-manager/admin/settings/team/[userId]`. Les administrateurs et développeurs peuvent lire/modifier ; les autres rôles, y compris le livreur concerné, sont exclus par défaut côté serveur.

Les six rubriques demandées sont définies dans `modules/personnel/types.ts` : identification, adresse, proche, justificatifs, informations professionnelles et véhicule. L’identifiant unique est celui du compte, déjà généré automatiquement ; le matricule interne est facultatif et unique lorsqu’il est renseigné. Nom et prénom obligatoires ; les autres champs sont facultatifs pour une saisie progressive. Les dates impossibles, naissance future, incohérences délivrance/expiration et entrée/départ sont refusées. Le statut Parti exige une date de départ.

Les coordonnées du compte préremplissent les téléphones d’une nouvelle fiche. Les autres informations ne sont pas devinées depuis le nom de compte. La fiche ne modifie pas automatiquement le nom, les numéros de connexion ou les droits du compte. Le statut Actif/Suspendu/Parti est administratif : il ne révoque pas les sessions ni les affectations. Définir ces effets dans une tâche explicite si souhaité.

## Stockage et sécurité

- `RiderPersonnelProfile` : relation un-à-un avec `User`, matricule unique nullable, données JSON validées, auteur et dates de mise à jour, compteur de version contre les écrasements concurrents.
- `RiderPersonnelDocument` : contenu binaire en base PostgreSQL, type de document, MIME, auteur et date. Pas d’utilisation du stockage d’images R2 public.
- Photos récentes/véhicule : JPG, PNG ou WebP, réencodés en JPEG avec Sharp (orientation, métadonnées supprimées, dimensions bornées). Justificatifs : mêmes images ou PDF. Maximum 5 Mo par fichier et limite réelle du corps reçu. Signature PDF vérifiée ; pas d’antivirus ou d’analyse complète du PDF. Les PDF sont téléchargés en pièce jointe, jamais affichés comme HTML.
- Routes `app/api/personnel/riders/[userId]/documents/route.ts` (POST authentifié, contrôle d’origine et de taille) et `app/api/personnel/documents/[id]/route.ts` (GET authentifié à chaque lecture). Réponses privées/no-store, nosniff ; contenu jamais inclus dans les réponses de liste.
- Nouvelle version de document = nouvelle ligne conservant l’ancienne. Pas de suppression automatique. Les clés étrangères RESTRICT empêchent la suppression physique accidentelle d’un compte doté d’un dossier.
- Les documents sont protégés par l’accès à la base et aux routes ; aucun chiffrement applicatif supplémentaire n’est ajouté. Inclure ces tables dans les sauvegardes privées et définir une politique de conservation/retrait avant généralisation. Leur stockage augmente la taille de la base et des sauvegardes.

## Activation à approuver

Fichier SQL préparé : `prisma/manual-migrations/20260922_rider_personnel.sql`. Il crée uniquement deux tables, leurs contraintes et un index. Il n’est pas idempotent et ne doit pas être exécuté une seconde fois. Aucun `db push` ni migration automatique dans le code.

Avant exécution : accord explicite du propriétaire conformément à `AGENT.md`, identification de la base cible, sauvegarde vérifiée, contrôle de l’absence des tables et application du fichier dans une transaction via l’outil d’exploitation autorisé. Déployer ensuite l’application avec le client Prisma généré. Vérifier le compte admin, un compte non autorisé, la sauvegarde d’une fiche fictive et un fichier fictif sur une base de test autorisée.

Avant toute écriture de dossier, le retour arrière peut conserver les tables vides et revenir à l’application précédente. Après saisie réelle, conserver tables/documents et sauvegardes : ne pas supprimer les données pour revenir au code précédent. Attention : la contrainte RESTRICT peut empêcher la suppression d’un compte même depuis une version antérieure de l’application.

## Vérifications

Le 22 septembre : serveur local démarré sur le port 3100 en isolant DATABASE_URL de la base distante. `/dev/personnel-preview` (développement et `PERSONNEL_PREVIEW=1` requis) rend le formulaire réel avec données fictives, HTTP 200, 42 champs et progression initiale 0 %. Upload/download sans session : 403 ; fiche privée sans session : redirection connexion. L’outil navigateur a perdu sa connexion : rendu interactif non vérifié. Aucun enregistrement réel ni migration appliquée.

- `node scripts/test-rider-personnel.mjs` : schémas, dates, téléphones, statut, formats/tailles de fichiers, contrôle des rôles avant lecture, conflit de version, création en doublon, téléchargement privé/no-store, origine de l’upload et ajout multipart simulé.
- `npx.cmd prisma generate` et `npx.cmd prisma validate` : client généré localement et schéma valide ; ces commandes n’appliquent pas de migration.
- TypeScript et lint ciblé passent ; lint global : dette existante de 744 erreurs / 83 avertissements.
- Pas de base PostgreSQL réelle, pas de test des contraintes SQL réelles, pas de navigateur authentifié, pas de test du proxy de production. Vérifier la transmission de l’en-tête Host/Origin lors de l’activation des uploads.

## Extension à toute l’équipe — 22 septembre 2026

Les commerciaux, administrateurs, comptables, préparateurs, collecte, stock, points relais et livreurs disposent de la fiche. Les comptes développeurs sont accessibles uniquement aux développeurs, conformément à la visibilité de l’équipe. Les clients sont exclus. Les autorisations de lecture/écriture restent administratives, sans accès personnel automatique pour les commerciaux.

`personnelSections(role)` affiche cinq rubriques communes et une sixième pour les livreurs. Les champs permis/carte grise/assurance et véhicule ainsi que leurs uploads sont réservés aux livreurs. `personnelCompletion` exclut ces champs et documents du calcul des autres rôles, même lorsqu’un historique existe. La sauvegarde conserve les anciennes valeurs de livraison en cas de changement de rôle ; les documents historiques ne sont pas supprimés.

Les noms techniques `RiderPersonnelProfile`, `RiderPersonnelDocument`, `getRiderPersonnel`, `saveRiderPersonnel`, `RiderPersonnelForm` et la route d’upload contenant `riders` sont conservés pour compatibilité. Cette extension ne change pas le schéma et ne nécessite aucun SQL supplémentaire ; la création initiale des tables reste non appliquée.

Aperçu commercial : `/dev/personnel-preview?role=commercial` ; aperçu livreur : `/dev/personnel-preview`. Même garde de développement, sans accès à la base réelle. Tests isolés ajoutés pour tous les rôles, exclusion clients, protection des comptes développeurs, progression spécifique et uploads restreints.

Accès direct dans le menu admin : « Équipe & personnel ». Le parcours « Settings » → « Équipe » reste disponible. Changements locaux non déployés.
