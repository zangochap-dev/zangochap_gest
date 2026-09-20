# Journal de reprise

## 2026-09-20 — Lisibilité de la carte flottante

- TypeScript, lint ciblé et diff-check passent. Lint global : dette inchangée de 744 erreurs / 83 avertissements. Pas de déploiement effectué.

- Capture utilisateur : bouton et texte partageaient une ligne flex, comprimant le texte en colonne très étroite. Remplacement par une grille explicite icône/message/réduction, avec lien sur une seconde ligne indépendante. Texte raccourci, largeur responsive, états focus conservés et message réseau visible aussi sur mobile. Comportement métier inchangé ; rendu navigateur réel non vérifié pendant cette correction.

## 2026-09-20 — Rappel flottant des échanges en attente

- Vérifications finales : TypeScript, lint ciblé des nouveaux fichiers/layout et `git diff --check` passent. Lint global : 744 erreurs / 83 avertissements préexistants, inchangés.

- Rappel permanent sur les pages du manager commercial : petite carte flottante en bas à gauche, compteur et accès aux demandes, réductible en pastille sans masquer complètement le rappel. Aucun écran bloquant ni son. Disparaît quand le compteur serveur atteint zéro ; reste présent avec indication d’indisponibilité si l’actualisation échoue.
- Route GET en lecture seule, authentifiée, réservée au commercial ; compte uniquement ses demandes PENDING sous le préfixe échange, sans retourner les données client. Actualisation toutes les 20 s quand visible, navigation/focus/reconnexion et après soumission. Requêtes annulées au démontage, pas de chevauchement de polling.
- Test API simulé passe : session, rôles, isolation entre commerciaux, statuts/prefixes, compteur zéro après décision, no-store et erreur technique sans fuite. Aucun accès à une base réelle ni déploiement. Rendu navigateur réel non vérifié.

## 2026-09-18 — Messages précis pour les échecs d’échange

- Approbation : messages distincts pour original supprimé/archivé, réattribution, modification, commercial supprimé ou rôle changé, décision déjà prise et paramètres de décision invalides. Contrôle transactionnel des produits/variantes référencés avant création, avec numéro d’article en erreur. Les articles personnalisés restent hors catalogue.
- Validation finale : lint ciblé et `git diff --check` passent ; lint global : 744 erreurs / 83 avertissements préexistants, inchangés.
- Validation : champs/articles et limites indiqués en français, données persistées invalides expliquées. Les erreurs prévues du relais, des promotions et des cadeaux sont transmises sans détail SQL. Classification technique par code Prisma (unicité, relation, donnée supprimée, disponibilité, transaction, concurrence, structure) avec référence de diagnostic ; aucune cause précise inventée si le code manque.
- Tests simulés : suite étendue passe, dont 16 scénarios de refus et 13 classifications techniques ; aucune création et demande PENDING conservée dans les scénarios de blocage. Anciens originaux livrés/réglés, idempotence et correction admin toujours couverts. TypeScript passe. Aucun accès base ou production ; la référence d’incident transmise reste non diagnostiquée faute du log serveur correspondant.


## 2026-09-18 — Robustesse et correction admin des échanges

- Ajout d’un schéma de lecture des demandes persistées distinct des règles de soumission : les dates passées restent consultables, les anciennes adresses nulles deviennent des champs vides à compléter. Les JSON illisibles sont comptés et signalés sans suppression ni crash de la liste.
- L’admin peut corriger uniquement date/adresse à l’approbation. Validation serveur complète, droits et contrôle de l’original inchangés ; correction avant/après et validateur conservés dans la demande. Aucun changement de l’original hors historique. Les demandes obsolètes à cause d’un original modifié nécessitent toujours refus/recréation.
- `getExchangeRequestsForUi` gère les échecs de chargement ; diagnostics techniques avec référence UUID, étape et code Prisma autorisé, sans message d’exception/payload. La liste est relue après décision. WhatsApp et automatisations indépendants ; erreurs de revalidation après commit journalisées sans échec apparent de la décision.
- Vérifications : suites échanges étendue et stale-action passent, TypeScript passe, lint ciblé passe. Lint global exécuté : 744 erreurs / 83 avertissements, dette inchangée. Vérifications sans PostgreSQL réel, navigateur authentifié ou déploiement.
- Aucun accès base, migration, seed ou opération de production. Prochaines étapes : déployer dans le cadre autorisé et corréler un éventuel échec avec sa référence technique/build ; valider visuellement ; définir les règles financières puis traiter concurrence/pagination. Le problème de builds production n’est pas déclaré résolu.

## 2026-09-18 — Audit complet de la page échanges

- Rapport : `docs/EXCHANGES_AUDIT.md`. Parcours, permissions, transactions, stockage JSON, interface, notifications et diagnostic de production examinés.
- Vérifié : les originaux anciens/livrés/réglés sont échangeables ; une modification de l’original ou une date de nouvelle livraison passée bloque l’approbation. Points sensibles : lecture JSON sans schéma, confiance dans le total proposé, diagnostics incomplets, références concurrentes, liste non paginée et rafraîchissement partiel.
- Deux suites locales passent : `node scripts/test-order-exchanges.mjs` et `node scripts/test-stale-server-action.mjs`. Base simulée uniquement ; aucune validation navigateur, PostgreSQL réel ou déploiement. Code applicatif inchangé ; TS/lint/build non relancés pour cet audit documentaire.
- Inconnues : build réellement servi, erreur exacte corrélée au clic admin, qualité des anciennes demandes, traitement financier et physique attendu de l’échange.
- Suite : corréler erreur/build, sécuriser lecture et diagnostics, définir les invariants financiers, améliorer le circuit de correction puis tester la concurrence sur une base de test autorisée. Aucun accès base ou production effectué.

## 2026-09-18 — Logs : action absente du build

- Pièce jointe utilisateur : 49 erreurs répétées « Failed to find Server Action » pour le même identifiant, entre 12:14:46 et 12:15:16 UTC. Échec de résolution avant exécution métier ; aucune erreur adresse/Zod/Prisma dans cet extrait. Action non identifiée dans le manifeste local, qui ne représente pas nécessairement le déploiement. Lien causal avec le clic d'approbation non établi.
- `ExchangeRequestsClient.tsx` utilise désormais le mécanisme existant `reloadOnStaleServerAction` pour chargement manuel/décision. Rechargement au plus une fois par session quand le message explicite est disponible ; ne rejoue pas automatiquement la mutation. `lib/stale-server-action.ts` protège le stockage navigateur et n'effectue aucun rechargement automatique si le garde-fou persistant est indisponible. Les erreurs génériques masquées ne déclenchent pas de rechargement spéculatif.
- Exploitation à vérifier : fermer les anciens onglets puis rouvrir ; si récidive, vérifier que toutes les instances servent le même build, que les anciens conteneurs ne reçoivent plus de trafic et que le proxy/CDN ne sert pas d'ancien HTML. Pas d'accès hébergeur/de déploiement effectué. Ces modifications locales ne corrigent pas à elles seules un mélange de builds en production.
- Suite isolée échanges et `scripts/test-stale-server-action.mjs` passent (rechargement unique, erreurs ordinaires inchangées, stockage bloqué sans boucle). TypeScript et lint ciblé passent ; lint global : dette inchangée, 744 erreurs / 83 avertissements.

## 2026-09-18 — Erreurs masquées lors de la décision administrateur

- Utilisateur confirme le déclenchement à la validation admin. L'écran appelait encore directement `reviewOrderExchange`, donc les erreurs levées étaient masquées en production malgré le correctif de l'envoi commercial.
- Nouvelle façade `reviewOrderExchangeForUi` dans `modules/orders/actions/index.ts`, utilisée par `ExchangeRequestsClient.tsx` : erreurs métier attendues retournées en données, validation Zod/date expirée expliquée, erreur inattendue générique avec journal technique sans payload. Droits et transaction inchangés ; pas de changement automatique de date.
- Suite isolée passe : commentaire requis pour refus, date expirée à l'approbation sans création et statut PENDING conservé, refus motivé toujours possible. Cause métier précise du cas utilisateur non confirmée ; déployer puis relever le message explicite. Aucun accès base ni déploiement effectué.
- TypeScript passe ; lint global terminé avec dette inchangée : 744 erreurs / 83 avertissements.

## 2026-09-17 — Adresse invalide lors d’un échange

- Utilisateur rapporte « adresse du client invalide ». Vérifié : `Order.customerLocation` est nullable, mais `ExchangeOrderSchema` exige un texte non vide (maximum 2000 caractères). Une ancienne commande sans adresse préremplit un champ vide ; absence réelle sur la commande utilisateur non auditée en base.
- `OrdersClient.tsx` : adresse d’échange marquée obligatoire, aide indiquant de compléter les données anciennes sans modifier l’original ; envoi avec adresse vide interrompu localement avec focus/scroll sur le champ et toast. Schéma serveur : message explicite pour adresse vide. Aucune adresse inventée et aucun assouplissement de validation.
- Suite isolée d’échange et TypeScript passent ; lint global conserve 744 erreurs / 83 avertissements préexistants. Aucune opération base ni déploiement, rendu navigateur réel non vérifié.

## 2026-09-17 — Erreurs d’échange masquées en production

- Réponse réseau fournie : digest `2626922034`, identique aux logs « Invalid input » précédents ; le champ/callstack précis reste inconnu et dépend du build déployé. Aucun blocage d’âge établi.
- `exchange-actions.ts` : première erreur de validation qualifiée par champ/article, sans valeur client ; erreur métier nommée ExchangeValidationError. Façade `duplicateOrderForUi` (`actions/index.ts`) retourne les erreurs attendues sous forme de données ; erreurs inattendues masquées. `OrdersClient.tsx` affiche l’explication et conserve le formulaire ouvert en cas de refus ; aucun assouplissement droits/date/paiement.
- Suite isolée `test-order-exchanges.mjs` passe, incluant retour UI adresse nulle/motif vide et demande valide sans mutation sur validation invalide. TypeScript passe. Lint ciblé des validations/suite passe ; lint global inchangé, 744 erreurs / 83 avertissements.
- À faire : déployer un build cohérent puis actualiser les navigateurs ; reproduire l’envoi et relever le champ signalé. Actions introuvables et livraison clôturée sont des incidents distincts. Aucun déploiement ou test en production effectué ici.

## 2026-09-17 — Bouton d’échange commercial grisé

- Vérifié dans `OrderFormModal` : envoi désactivé pendant une action, panier vide ou motif d’échange commercial vide ; aucune condition d’âge. Bouton Créer un échange de la liste accessible aux commerciaux propriétaires uniquement.
- `OrdersClient.tsx` : motif marqué obligatoire, aide dynamique sous le champ et près des actions, indication accessible liée au bouton. Règles de validation conservées, aucun changement base/serveur. Message/étape précis à recontrôler si le bouton reste grisé avec un motif et un article.
- TypeScript passe ; lint global reste à 744 erreurs / 83 avertissements préexistants. Validation navigateur réelle non effectuée.

## 2026-09-17 — Vérification des échanges sur commandes anciennes

- Aucune restriction d’âge trouvée dans `duplicateOrder`, `requestOrderExchange` ou `reviewOrderExchange`. Original livré/réglé autorisé pour créer une nouvelle commande d’échange ; la date de l’original n’est pas utilisée comme date du nouvel échange.
- Régression ajoutée à `scripts/test-order-exchanges.mjs` : original daté de 2020, livraison ancienne, statut DELIVERED et settlement renseigné, commercial avec approbation et admin direct. Suite passe, Prisma simulé uniquement ; lint ciblé lancé, résultat encore en attente à la rédaction.
- Restrictions effectivement présentes : commercial propriétaire, original non supprimé, motif/date future ou actuelle/champs client/articles valides, paiements hors Abidjan, une demande en attente par original, original inchangé depuis la demande, commercial toujours disponible et quotas cadeaux. À l’approbation, une date demandée passée entre-temps est également refusée.
- Cause de l’incident utilisateur non confirmée ; message exact et étape du blocage demandés. Aucune restriction métier supprimée ni donnée réelle examinée/modifiée.

## 2026-09-17 — Refonte de l’écran des demandes d’échange

- Ajustement demandé pendant la refonte : cartes compactées (espacements, en-tête, motif/date, détails et zone de décision), commentaire redimensionnable de 46 px initialement. Aucun contenu ou droit supprimé.
- Présentation en grille demandée : deux colonnes au-dessus de 1000 px, une colonne sur écrans plus étroits ; état vide sur toute la largeur et actions adaptées à la largeur des cartes.

- `ExchangeRequestsClient.tsx` et nouveau `exchanges.css` : compteurs/filtres de statut, recherche locale commande/commercial/client/téléphone/motif, cartes avec identité, statut, motif, date formatée Abidjan, détails articles/client/paiement et liens vers commandes. Zone décision séparée avec aide pour refus motivé, états vides/recherche et disposition mobile. CSS dédié, indépendant de l’écran historique de reprogrammation.
- Titre de route corrigé « Demandes d’échange » ; sous-titre déplacé dans le contenu pour éviter la ligne de titre surchargée. Actions/droits serveur inchangés.
- TypeScript et lint ciblé passent ; lint global conserve les 744 erreurs / 83 avertissements préexistants. Capture utilisateur examinée ; rendu navigateur après refonte non vérifié, aucune opération base ni déploiement.

## 2026-09-17 — Préparation d’une demande d’échange fictive

- `scripts/create-test-exchange-request.mjs` préparé : aperçu par défaut sans connexion base ; insertion explicite avec `--apply`, cible `--environment=test|production`, fichier `--env-file` et compte `--email`. Crée une commande originale fictive, une demande EXCHANGE PENDING, un message ADMIN et un repère CmsContent empêchant les doublons par compte. Aucun compte/commande existant modifié, aucun stock/CRM/externe sollicité par le script.
- Aperçu exécuté et lint ciblé passent. Insertion NON exécutée : environnement/base cible à confirmer conformément à AGENT.md. Aucun état du compte destinataire vérifié en base. Le retrait ultérieur des fixtures nécessite une opération distincte autorisée ; leur approbation via l’application déclenche le parcours métier normal.
- Contrôle TypeScript tenté : échec TS6053 sur fichiers générés `.next/types` disparus pendant la vérification (serveur Next actif possible, non confirmé), sans erreur signalée dans le nouveau script JavaScript. Lint global : dette existante de 744 erreurs / 83 avertissements ; lint du script passe.

## 2026-09-17 — Présentation du formulaire d’échange

- Capture utilisateur : bloc de paiement sur toute la largeur, champs peu visibles et catalogue repoussé. Dans `modules/orders/components/OrdersClient.tsx`, déplacement du bandeau et du paiement dans la colonne destinataire/logistique ; champs encadrés avec libellés et placeholders. Paiement affiché pour Hors Abidjan ou lorsqu’un moyen de paiement est renseigné, selon les contrôles existants. Aucun changement des règles serveur.
- TypeScript : passe. Lint global : dette inchangée de 744 erreurs / 83 avertissements. Présentation navigateur réelle après correction non vérifiée ; disposition et condition contrôlées dans le JSX. Motif vide : bouton commercial désactivé conformément à la validation.

## 2026-09-17 — Correction du périmètre : validation des échanges, reprogrammation directe

### État vérifié et travaux

- Correction demandée et confirmée par le propriétaire : la validation administrateur concerne les échanges, pas la reprogrammation. Cette entrée remplace l'état fonctionnel de la précédente implémentation de reprogrammation avec approbation.
- `duplicateOrder` transmet les échanges commerciaux à `requestOrderExchange`. Commande/CRM/stock inchangés pendant l'attente ; motif obligatoire. `reviewOrderExchange` (admin/developer) crée une nouvelle commande CONFIRMED Echange attribuée au commercial après acceptation, ou refuse avec motif sans création. Verrous, idempotence et contrôle de version conservés ; notifications chat en transaction et effets externes après commit. Une demande à la fois par commande ; possibilité de demander à nouveau après traitement.
- Modules `exchange-actions.ts`, `types/exchange.ts`, `ExchangeRequestsClient.tsx`, route `/zangochap-manager/orders/exchanges`, navigation « Mes échanges / Échanges » et compteur `exchangePending`. Protection contre création directe/conversion vers Echange par un commercial. Le modal d'échange fixe le type et indique la validation requise ; admin/developer créent directement.
- `reprogramOrder` et REPRO_DISPO sont redevenus directs pour les commerciaux autorisés, sans suppression des protections métier préexistantes (livraison clôturée, règlement, droits). Anciennes demandes `order-reprogramming:` conservées et consultables à l'ancienne route ; refus motivé possible, nouvelle demande et approbation désactivées. Aucune conversion automatique en échanges.
- Échanges hors Abidjan : champs de paiement visibles/modifiables, préremplis depuis l'original ; contrôles de paiement maintenus côté serveur et dès la demande. Antidoublon d'expédition exempté pour les échanges staff autorisés ; reste actif pour les commandes ordinaires et publiques. L'approbation d'échange ne contourne pas les quotas cadeaux.

### Vérifications et limites

- `node scripts/test-order-exchanges.mjs` passe sur actions/service réels avec Prisma simulé : attente, droits, refus/acceptation, attribution, dates/motif/paiement, obsolescence, rollback, demandes/approbations concurrentes simulées, références, médias, quotas cadeaux, visibilité, échange direct admin, reprogrammation directe commercial/admin et REPRO_DISPO, expédition échange autorisée / expédition ordinaire identique refusée. Ancien script `test-order-reprogramming.mjs` devient point d'entrée compatible vers cette suite.
- Les six autres scripts de régression (alertes rider, expedition-day, rider-history, rider-tracking, rider-stream, rider-place) passent sans base/réseau réels.
- `npx.cmd tsc --noEmit --incremental false` : passe sur la version finale. Lint ciblé des nouveaux modules, de l'action historique modifiée et des suites : passe sans erreur ni avertissement. `npm.cmd run lint` : dette historique inchangée, 744 erreurs / 83 avertissements. Aucune correction applicative hors périmètre.
- Aucune migration, opération base réelle ni déploiement. Tests navigateur authentifiés et réception des notifications externes non effectués.

### Prochaines actions

1. Déployer puis vérifier commercial → demande d'échange → décision admin → retour commercial, y compris hors Abidjan et demande répétée après traitement.
2. Vérifier les reprogrammations directes commercial/admin et les alertes rider sur environnement de test.
3. Examiner les anciennes demandes de reprogrammation éventuelles et les refuser manuellement avec explication ; leur statut n'a pas été changé automatiquement.

## 2026-09-17 — Réception des alertes livreur par les commerciaux

- Vérifié : `Sidebar` dépendait du SSE pour afficher les alertes ; le secours basé sur les compteurs était désactivé par un chemin impossible. Les événements SSE du chat restent locaux au processus. Cela explique une perte possible entre instances ou après une déconnexion ; cause exacte en production non confirmée, sans accès aux logs ni test authentifié.
- Ajout de `getUnreadRiderAlerts` dans `modules/chat/actions.ts` : session/rôle vérifiés, messages non supprimés et non lus accessibles au destinataire, marqueur ALERTE LIVREUR, lots de 50 ordonnés par date/id avec curseur. Les alertes de groupe commercial sont exclues du rattrapage pour les commerciaux actuellement en pause.
- `components/Sidebar.tsx` récupère les alertes persistées toutes les 8 secondes et au focus/retour réseau, indépendamment des compteurs. SSE conservé et dédoublonnage commun. La page chat garde son propre affichage sans que Sidebar marque prématurément les alertes comme vues.
- `lib/client-alerts.ts` : stockage session protégé et dédoublonnage mémoire de secours. SSE : ajout de `X-Accel-Buffering: no` pour les proxies compatibles.
- Vérifications : `node scripts/test-rider-alerts.mjs` passe avec Prisma/session simulés (droits, filtres de visibilité/non-lus, curseur date/id, pause et stockage navigateur bloqué). TypeScript passe. Lint ciblé : aucune erreur, deux avertissements images existants de Sidebar. Lint global : 744 erreurs et 83 avertissements, dette préexistante inchangée.
- Limites : aucune connexion base réelle, migration, modification de données ou mise en production. Les tests isolés contrôlent les actions/filtres, pas la livraison réelle ni une navigation navigateur complète. Les confirmations commerciales vers le rider restent sur leur parcours existant.
- Prochaines actions : déployer la correction selon la procédure du projet ; tester une alerte rider → commercial attribué avec SSE connecté puis coupé, reprise réseau, plusieurs alertes, commercial en pause et ouverture du chat. Contrôler ensuite les logs/proxy si un incident persiste. L'affichage nécessite une session ouverte ; son et notification système restent soumis aux permissions navigateur.

## 2026-09-17 — Reprogrammation commerciale soumise à validation

### État actuel et travaux réalisés

- Une tentative de reprogrammation commerciale crée une demande avec date, motif et contenu proposé ; commande, CRM et stock restent inchangés pendant l'attente. Admin/developer peuvent accepter ou refuser dans `/zangochap-manager/orders/reprogramming`. Refus motivé et réponse privée au commercial.
- Fonctionnement existant conservé : NEW_ORDER crée une nouvelle commande CONFIRMED après approbation ; REPRO_DISPO reporte la livraison existante après approbation. Les parcours directs admin et terrain livreur restent disponibles. Aucun retour utilisateur à la clarification optionnelle sur le choix nouvelle/existante pendant l'implémentation ; conservation des deux parcours présents dans le projet.
- Stockage des demandes dans CmsContent existant, sans modification de schéma. Transactions/verrous préviennent doublons de demande et validation ; détection de commande modifiée depuis la demande. Commercial propriétaire uniquement ; décision réservée admin/developer ; protections contre les transitions/créations directes de reprogrammation commerciale.
- Création partagée extraite de `order-actions.ts` vers `modules/orders/actions/order-creation-service.ts` pour accepter un contexte transactionnel interne et préserver l'attribution au demandeur. Façades publiques inchangées ; notifications externes après commit. Les cadeaux restent soumis aux quotas et au parcours d'approbation cadeau existant.
- Nouveau module `reprogramming-actions.ts`, types/schémas `modules/orders/types/reprogramming.ts`, écran `ReprogrammingRequestsClient.tsx`, route serveur, CSS, badges Sidebar et retours UI adaptés. Images personnalisées envoyées à R2 hors transaction après contrôle d'appartenance, au moment de la demande.
- Cartographie et fichiers memory actualisés ; documentation préexistante de la session précédente préservée.

### Vérifications effectuées

- Installation `npm.cmd ci --ignore-scripts` selon lock ; premier essai bloqué par le cache/réseau du sandbox, second réussi après autorisation. Aucun manifeste/lock changé. Génération `npx.cmd prisma generate` autorisée, avec DATABASE_URL factice locale : aucune connexion ni migration base.
- `npx.cmd tsc --noEmit --incremental false` : passe sur la version finale après corrections de typage.
- `node scripts/test-order-reprogramming.mjs` : passe, vraies actions/service de création avec Prisma simulé. Couvre attente sans mutations CRM/commande, droits et visibilité, dates/quantités invalides, champs sensibles ignorés, acceptation/refus, attribution, décision répétée, demande obsolète, rollback commande/CRM, demandes/approbations concurrentes simulées, collisions de références, images personnalisées sans upload en transaction, repro-dispo et créations staff/public/admin.
- Les cinq tests existants (`test-expedition-day.cjs`, `test-rider-history.mjs`, `test-rider-tracking.mjs`, `test-rider-stream.mjs`, `test-rider-place.mjs`) passent. Base et appels externes simulés, aucune donnée réelle touchée.
- ESLint des nouveaux fichiers TypeScript/TSX et du nouveau test : passe. Lint global : **744 erreurs, 83 avertissements**. Comparaison avec HEAD des sept fichiers modifiés : aucune augmentation finale ; OrdersClient revient à ses 111 erreurs/4 avertissements existants, création transférée et typée sans erreurs lint nouvelles.
- `git diff --check` : passe ; 103 chemins explicites de la cartographie contrôlés, tous présents. TypeScript/lint ne prouvent pas une validation fonctionnelle sur base ou navigateur réel ; aucun build, déploiement ou essai authentifié effectué.

### Limites et état Git à préserver

- Aucun accès DB, migration, seed, envoi WhatsApp réel, upload R2 réel ou déploiement. Validation manuelle du circuit commercial → admin → commercial et des verrous sur PostgreSQL réel encore à effectuer en environnement autorisé.
- Liste des demandes sans pagination/purge ; images envoyées lors d'une demande refusée susceptibles de rester inutilisées. Une demande devenue obsolète ou dont la date est passée doit être refusée et refaite.
- Dette lint globale préexistante ; ne pas la confondre avec les nouveaux fichiers vérifiés.
- Le contrôle final a détecté `.env.example` supprimé dans l'arbre de travail, alors qu'il était présent au début de session. Cette suppression ne provient pas des modifications réalisées pour cette tâche ; origine non déterminée, laissée intacte pour préserver les changements concurrents. Aucun contenu sensible copié.

### Prochaines actions

1. Tester sur une base de développement autorisée avec un commercial propriétaire, un autre commercial et un administrateur : demande, badge/message, acceptation, refus, doublon, commande modifiée, date passée, cadeau et repro-dispo.
2. Vérifier le parcours UI mobile/desktop authentifié et le rafraîchissement de la file ; confirmer le comportement PostgreSQL des validations concurrentes.
3. Déployer selon la procédure habituelle après cette validation ; aucune migration nécessaire pour cette fonctionnalité.
4. Clarifier la suppression concurrente de `.env.example` et traiter séparément les dettes déjà recensées ; ajouter pagination/indexation adaptée si le volume des demandes augmente.

## 2026-09-16 — Cartographie documentaire

### État actuel vérifié

- Dépôt initial sans modification signalée par `git status --short`.
- Monolithe Next.js 15.2.1 / React 19 / TypeScript strict, PostgreSQL et Prisma 7, boutique publique + manager multi-rôles + rider + relais.
- Code présent pour commandes, catalogue, préparation/contrôle/collecte, stock, livraisons, règlement, comptabilité, communication et GPS. **Disponibilité en production et validation fonctionnelle non établies par cette session.**
- `AGENT.md` et `memory/` préexistants ; aucun `AGENTS.md` trouvé dans le dépôt ou par la recherche sous `G:/projet reel`.
- Node local v24.21.0 et npm 11.19.0 ; Docker cible Node 20. `node_modules` absent.

### Travaux réalisés

- Lecture des consignes `AGENT.md`, README racine/app/modules, mémoire existante ; analyse du manifeste npm, configuration Next/TS/ESLint/Prisma/PostCSS/UI, Docker/Compose/démarrage et schéma Prisma complet.
- Exploration des entrées publiques/staff/rider et principaux modules ; suivi statique checkout → création/CRM, préparation → stock → livraison → règlement/comptabilité, GPS → transaction → SSE → carte.
- Création de `docs/PROJECT_MAP.md` : modules, API, données, Mermaid, navigation par besoin, commandes, conventions, écarts et limites.
- Création de `AGENTS.md` concis, conservant `AGENT.md` et ses règles par référence ; repère vers les deux documents de reprise.
- Aucun code applicatif, configuration, dépendance ou fichier de données modifié. Aucun accès base, migration, seed, envoi WhatsApp, appel Geoapify réel ou déploiement.

### Vérifications et résultats

- Chemins et symboles documentés contrôlés par lectures/recherches source ; scripts npm contrôlés dans `package.json`. Contrôle automatique de 95 chemins explicites avant correction d'un chemin abrégé de composant rider ; chemin remplacé par son chemin complet existant. Handlers API recoupés avec l'inventaire et leurs exports. Symboles principaux des flux confirmés par recherche source.
- Contrôle final du périmètre Git : seulement trois nouveaux fichiers documentaires (`AGENTS.md`, `docs/PROJECT_MAP.md`, `docs/PROGRESS.md`) ; `git diff --check` sans erreur. Aucun fichier préexistant modifié.
- Les cinq commandes `node scripts/test-expedition-day.cjs`, `node scripts/test-rider-history.mjs`, `node scripts/test-rider-tracking.mjs`, `node scripts/test-rider-stream.mjs`, `node scripts/test-rider-place.mjs` ont été tentées. **Toutes échouent au chargement : module/package typescript introuvable. Aucune assertion exécutée ; cela ne démontre pas un défaut fonctionnel des tests.**
- Lint, TypeScript et build non lancés faute de dépendances locales ; installation non entreprise pour conserver une intervention uniquement documentaire.
- Les succès TS/tests et échecs lint de `memory/change-log.md` sont des résultats historiques, non des vérifications de cette session.

### Blocages et questions ouvertes

- Dépendances absentes : impossible de confirmer compilation/lint/tests actuels.
- Tables GPS/migrations manuelles : présence dans la base réelle inconnue ; ne pas appliquer de SQL automatiquement.
- Droits des actions entrepôts, confiance dans les montants de création commande et cookie client non signé : écarts confirmés à traiter dans des tâches de code distinctes.
- Injection WhatsApp en production, comportement multi-instance des automatisations et flux SSE, durée de conservation GPS, relation compte client/CRM : à clarifier.
- Documentation memory ancienne et doublons d'écrans : carte actuelle prioritaire pour orientation, sources à relire avant intervention.
- Pas de revue exhaustive de toutes les fonctions secondaires, ni audit complet des permissions ou validation UI/mobile/production.

### Prochaines actions, dans l'ordre

1. Lire `AGENTS.md`, `AGENT.md`, la cartographie et ce journal ; vérifier git et les sources liées à la tâche choisie.
2. Pour une prochaine tâche de code, installer les dépendances selon le lock dans un environnement de développement, générer Prisma puis lancer TS, lint et les cinq tests isolés. Consigner les résultats réellement obtenus.
3. Prioriser une revue des frontières serveur : actions entrepôts, contrat de création commande et authentification client ; préparer des corrections avec tests appropriés sans toucher la production.
4. Confirmer avec l'exploitant les migrations appliquées et l'injection des variables, puis valider GPS/SSE sur téléphone et proxy dans un environnement autorisé ; définir la conservation des positions.
5. Clarifier transitions/retours/reprogrammation, snapshots de règlement et concurrence des automatisations avant refonte de ces domaines.
6. Actualiser la carte après changement d'architecture et ajouter une entrée de journal après chaque tâche significative ; maintenir aussi les fichiers memory concernés selon `AGENT.md`.
