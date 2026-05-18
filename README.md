# ZangoChap Gest

Application Next.js de gestion ZangoChap: commandes, produits, stock,
logistique, CRM, marketing, comptes et tableaux de bord.

Ce README definit les conventions d'architecture et de code du projet. Il sert
de reference avant d'ajouter une fonctionnalite, corriger un bug ou refactorer
un module.

## Commandes Utiles

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit --incremental false
```

Note: si `npm run lint` echoue a cause d'un plugin ESLint manquant, corriger les
dependances avant de considerer le lint comme fiable.

## Architecture Generale

```text
app/          Routes Next.js, pages, layouts, route handlers
components/   Composants UI transverses reutilisables
lib/          Infrastructure et utilitaires globaux
modules/      Domaines metier independants
prisma/       Schema, migrations et seed
public/       Assets publics
scripts/      Scripts de maintenance ou import
```

Regle principale: `app/` orchestre, `modules/` contient le metier, `lib/`
contient uniquement l'infrastructure partagee.

## Responsabilites Des Dossiers

### `app/`

- Contient les routes, pages, layouts, loading/error states et route handlers.
- Charge les donnees necessaires a une page.
- Ne doit pas contenir de grosse logique metier.
- Peut appeler les server actions publiques d'un module.
- Peut composer plusieurs modules pour construire un ecran.

### `modules/`

Chaque module represente un domaine metier: `orders`, `products`, `logistics`,
`auth`, `crm`, `settings`, `marketing`, `media`.

Structure cible:

```text
modules/<domain>/
  actions/      Server actions et mutations du domaine
  components/   Composants React propres au domaine
  helpers/      Fonctions pures du domaine
  types/        Types TypeScript et schemas de validation
```

Les petits modules peuvent rester plats temporairement, mais tout nouveau code
doit aller vers cette structure.

### `lib/`

`lib/` est reserve au transversal:

- client Prisma
- auth primitive et session helpers generiques
- upload/media infrastructure
- constantes globales
- formatters et helpers generiques
- moteurs partages, si vraiment cross-domain

Ne pas mettre dans `lib/` une logique qui appartient clairement a un module.

### `components/`

Reserve aux composants reutilisables hors domaine: layout, modal, toast,
sidebar, composants UI generiques.

Un composant utilise uniquement par les commandes va dans
`modules/orders/components`, pas dans `components/`.

## Regles D'Import

Utiliser les facades publiques:

```ts
import { createOrder } from "@/modules/orders/actions";
import { createProduct } from "@/modules/products/actions";
import { getWarehouses } from "@/modules/logistics/warehouses";
```

Eviter depuis l'exterieur d'un module:

```ts
import { createOrder } from "@/modules/orders/actions/order-actions";
import { createProduct } from "@/modules/products/actions/actions";
```

Les imports profonds sont acceptables seulement a l'interieur du meme module.

## Server Actions

Les server actions sont la frontiere d'autorite du systeme.

Regles:

- Toujours verifier l'authentification et le role avant une mutation.
- Toujours valider les donnees entrantes cote serveur.
- Ne jamais faire confiance aux valeurs calculees par le client: totaux,
  remises, frais, statuts, roles, stocks.
- Garder les actions groupees par responsabilite.
- Retourner des erreurs utilisateur claires.
- Eviter `any`; si temporaire, l'isoler et planifier son remplacement.
- Ne pas mettre de `console.log` permanent dans les actions.

Exemple de repartition:

```text
modules/orders/actions/
  order-actions.ts       CRUD commandes
  status-actions.ts      changements de statut
  delivery-actions.ts    assignation livreurs
  settlement-actions.ts  reglements livreurs
  analytics-actions.ts   stats et dashboard
  stock.ts               impact stock des commandes
  index.ts               API publique du module
```

## Validation Des Donnees

La validation serveur est obligatoire. La validation client sert seulement a
ameliorer l'UX.

Convention:

- Placer les schemas dans `modules/<domain>/types`.
- Utiliser Zod pour les payloads entrants.
- Utiliser `safeParse` aux frontieres: server actions, route handlers, imports.
- Normaliser les donnees avant Prisma: `trim`, casse, telephone, nombres,
  dates.
- Refuser les donnees invalides au lieu de les convertir silencieusement en `0`.

A eviter:

```ts
const qty = parseInt(input.qty) || 1;
const total = Number(data.total);
status: data.status as any;
```

A preferer:

```ts
const parsed = CreateOrderSchema.safeParse(data);
if (!parsed.success) {
  throw new Error("Donnees de commande invalides.");
}
```

Regles metier importantes:

- `qty`, `stock`, `deliveryFee`, `price`, `discount`, `amount` doivent etre
  bornes.
- Les statuts doivent venir des enums Prisma ou schemas Zod.
- Les dates doivent etre verifiees avec `Number.isNaN(date.getTime())`.
- Les numeros de telephone doivent etre normalises avant recherche ou creation.
- Les totaux de commande doivent etre recalcules cote serveur.

## TypeScript

- Garder `strict: true`.
- Preferer des types explicites pour les payloads publics.
- Ne pas utiliser `as any` pour contourner Prisma ou les enums.
- Les types derives de Zod sont preferes pour les entrees validees.
- Ne pas creer de faux types ou champs qui n'existent pas dans Prisma.

## Prisma Et Base De Donnees

Regles:

- Toujours preferer les transactions pour les operations multi-etapes.
- Eviter les updates partiels non whitelistes.
- Utiliser `select` ou `include` de maniere volontaire.
- Eviter les requetes N+1.
- Garder les invariants importants cote serveur, pas dans le client.
- Ne pas supprimer physiquement une donnee sensible si un soft delete existe.

Pour les commandes et stocks:

- Toute operation qui modifie une commande emballee ou livree doit considerer
  l'impact stock.
- Ne jamais permettre un transfert de stock avec quantite negative.
- Verifier que l'entrepot source a assez de stock avant transfert.
- Synchroniser les stocks agreges apres modification des `StockLevel`.

## React Et Next.js

Regles:

- Utiliser les Server Components pour charger les donnees.
- Ajouter `"use client"` uniquement pour l'interactivite.
- Eviter de dupliquer le layout dans plusieurs pages.
- Garder les composants client centres sur l'UI et les interactions.
- Les mutations passent par des server actions ou route handlers valides.
- Gerer les etats vide, loading, erreur et succes.

Les gros composants doivent etre decoupes par responsabilite:

- liste
- filtre
- formulaire
- modal
- carte/ligne
- actions

## UI Et Design ZangoChap

Principes:

- Mobile first.
- Interface dense mais lisible pour les outils staff.
- Couleurs coherentes avec ZangoChap: orange, navy/dark, gris.
- Police Outfit quand disponible.
- Icons `lucide-react` pour les boutons et actions.
- Animations utiles avec `framer-motion`, pas decoratives.
- Pas de layout qui saute ou de texte qui deborde.
- Les composants repetes peuvent etre des cards; eviter les cards imbriquees.

## Gestion Des Erreurs

- Les erreurs serveur doivent etre comprehensibles pour l'utilisateur.
- Ne pas exposer d'informations sensibles.
- Logger seulement ce qui aide au diagnostic.
- Pour les imports batch, retourner un bilan: total, succes, erreurs.
- Pour les actions critiques, conserver un historique metier si le domaine le
  permet.

## Securite Et Permissions

- Toute mutation doit verifier la session.
- Toute action admin doit verifier le role admin.
- Ne pas accepter `role`, `creatorId`, `commercialId`, `status` ou autres champs
  sensibles depuis le client sans controle strict.
- Ne pas exposer les emails, telephones ou donnees client hors besoin metier.
- Ne jamais introduire de logique de privilege basee sur du texte libre.

## Organisation Des Refactors

Refactorer petit a petit:

1. Creer une facade publique stable.
2. Deplacer la logique interne.
3. Mettre a jour les imports externes vers la facade.
4. Lancer TypeScript.
5. Lancer le lint si disponible.
6. Supprimer les anciens fichiers seulement quand tous les imports sont propres.

Ne pas melanger refactor architecture et changement metier lourd dans la meme
modification.

## Checklist Avant Livraison

- La fonctionnalite respecte le besoin.
- Les validations serveur sont en place.
- Les erreurs utilisateur sont propres.
- Les roles et permissions sont verifies.
- Les totaux, stocks et statuts critiques sont recalcules ou bornes cote serveur.
- Les composants sont dans le bon module.
- Les imports passent par les facades publiques.
- `npx tsc --noEmit --incremental false` passe.
- `npm run lint` passe ou le blocage est documente.
- Aucun `console.log` de debug permanent.
- Aucun `any` ajoute sans raison claire.
- Aucun fichier hors scope n'a ete modifie volontairement.

## Migration Actuelle

Des facades publiques existent deja pour:

- `@/modules/orders/actions`
- `@/modules/products/actions`
- `@/modules/logistics/warehouses`
- `@/modules/crm/admin-actions`

Les prochains chantiers recommandes:

1. Ajouter des schemas Zod dans `modules/orders/types` et les utiliser dans les
   server actions.
2. Faire la meme chose pour `products`, `logistics`, `settings` et `marketing`.
3. Decouper les gros composants `OrdersClient`, `NewOrderClient` et
   `ProductForm`.
4. Migrer les modules plats restants vers la structure cible.
