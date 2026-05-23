# Documentation Technique - GHE UVCI
Gestion des Heures d'Enseignement - Université Virtuelle de Côte d'Ivoire

Ce document offre une vue détaillée de l'architecture, de la configuration de la base de données, des modèles Prisma et des principaux modules de l'application full-stack GHE UVCI.

## 1. Vue d'Ensemble & Architecture

L'application est construite sur une architecture full-stack robuste et performante :
* **Frontend (SPA)** : Développé en **React 18** avec **Vite**, stylisé à l'aide de **Tailwind CSS** (utilisant @import) et animé par **motion/react**.
* **Backend (API REST)** : Serveur **Express.js** en **TypeScript** qui expose les différentes routes métiers pour synchroniser et sécuriser l'ensemble des données.
* **Base de Données** : Base **PostgreSQL** hébergée et managée, avec le puissant client ORM **Prisma** pour les opérations de bases de données, la sécurité du typage et la migration de schémas.

---

## 2. Structure des Rôles & Sécurité

L'application intègre trois types d'utilisateurs distincts via le champ `role` du modèle `User` :
1. **Administrateur (`admin`)** : Accès global à tous les modules, configuration complète de la plateforme (Barèmes, Années de cours, Départements, Filières, Niveaux, Profils), et gestion de tous les comptes utilisateurs.
2. **Secrétaire (`secretaire`)** : Accompagne l'administrateur dans la gestion des cours, des affectations, de l'historique d'audit, des déclarations d'heures et du traitement comptable des règlements d'enseignants.
3. **Enseignant (`enseignant`)** : Déclare ses activités d'enseignement (Conception ou Mise à Jour (MAJ)), soumet ses disponibilités hebdomadaires, génère ses propres états d'heures, ajoute ses diplômes et justificatifs d'activité, et suit ses règlements directement depuis son tableau de bord.

---

## 3. Schéma de Base de Données (Prisma)

Voici la structure des entités de données gérées dans le fichier `/prisma/schema.prisma` :

### A. Référentiels d'Organisation Académique
* **`AnneeAcademique`** : Gère les périodes universitaires (ex : 2025-2026).
* **`Departement`** : Regroupement de filières (ex : Informatique, Sciences de l'Information).
* **`Filiere`** : Parcours d'études (ex : DAS - Data Science, RSI - Réseau Sécurité).
* **`Niveau`** : Cycles d'études (ex : Licence 1, Master 2).
* **`Cours`** : Unités d'Enseignement reliées à un niveau et une filière, avec calcul du volume d'heures et de séquences associées.

### B. Gestion des Utilisateurs & Prestations
* **`User`** : Comptes personnels (E-mail, Nom, Prénom, Rôle, taux horaire, spécialisation, photo profil encodée en Base64 pour persistance autonome).
* **`Disponibilite`** : Grille horaire des enseignants par jour (Lundi, Mardi...) et créneau (Matin, Après-midi...).
* **`UserDocument`** : Justificatifs professionnels (Contrats signés, Bulletins de Paie, Diplômes numérisés).
* **`Coefficient`** : Définition dynamique des barèmes de pondération de charge de travail académique basés sur le **Type d'Action** (`Conception` / `MAJ`) et la **Complexité** (`N1` / `N2` / `N3`).
* **`Activite`** : Déclaration individuelle de prestation par l'enseignant (Séquences rattachées, complexité déclarée, montant automatiquement calculé à partir du coefficient et du taux horaire).
* **`EtatHeures`** : Fiche récapitulative mensuelle/semestrielle regroupant l'ensemble des activités validées pour versement des honoraires.
* **`Paiement`** : Enregistrement de l'état financier (mode de paiement, montant versé, période, référence bancaire) pour décharge comptable.

---

## 4. Points Clés & Améliorations Récentes

1. **Dynamisation Complète du Module Settings** :
   Le backend dispose désormais d'un routeur hautement dynamique (`backend/routes/settings.ts`) qui fait correspondre automatiquement les collections frontend plurielles (ex : `/api/departements`, `/api/annees`, `/api/niveaux`) avec les tables singulières correspondantes de l'ORM Prisma (`prisma.departement`, `prisma.anneeAcademique`, `prisma.niveau`) pour assurer que tous les ajouts et modifications de configurations persistent instantanément et fidèlement dans PostgreSQL.

2. **Ajout Officiel du Profil Secrétaire** :
   Le rôle `secretaire` fait maintenant partie des rôles gérés nativement à l'API (`/api/roles`), et des comptes secrétaires réels peuvent être assignés pour assumer les fonctions administratives de second niveau en toute sécurité.

3. **Mise en Place du Module Photo Réel en Base64** :
   Plutôt que d'utiliser des avatars génériques ou de simples champs textes URL, le système accepte à présent de véritables téléversements de fichiers images (`JPG`, `PNG`) saisis par l'utilisateur. Ces images sont encodées au format de chaîne de caractères sécurisée **Base64** puis injectées dans le champ `photo_url` d'un seul bloc, assurant un affichage instantané et une liaison directe à la base PostgreSQL sans maintenance d'un serveur d'asset externe.

4. **Mini-Dashboard de Gestion des Règlements** :
   La page de paiements (`/paiements`) est agrémentée d'une barre statistique (bento-grid) calculant dynamiquement :
   * **Total Payé** : Somme cumulative des paiements d'honoraires exécutés.
   * **Règlements en cours** : Montants de prestations déjà validés administrativement restant à régulariser.
   * **Total Prestations** : Cumul global de toutes les charges de cours prises en compte.
   * **Taux d'Exécution Financière** : Jauge visuelle animée rapportant la part d'exécution réelle des règlements administratifs.

5. **Système de Repli de Base de Données Résilient (High-Availability Fallback)** :
   Afin de contrer les limitations de quota de transfert de données et de requêtes (par ex., quota de transfert mensuel de base PostgreSQL Neon dépassé), la passerelle de base de données (`backend/db.ts`) intercepte dynamiquement les erreurs de pooling de requêtes. Face à une indisponibilité ou un dépassement de quota d'écriture, l'application bascule automatiquement sur un moteur d'écriture de secours local sécurisé basé sur le système de fichiers (`backend/lib/local_db.ts`), garantissant ainsi la continuité opérationnelle complète de la plateforme (créations, modifications, authentifications) en toute transparence.

6. **Élimination complète de "require" au profit de modules ESM** :
   Pour soutenir le typage strict et le lancement sans accroc du serveur d'exécution backend, l'importation dynamique obsolète `require()` de module local de données a été migrée vers des `import` statiques conformes au standard ES Modules. Cela supprime définitivement les incidents d'exécution du type `ReferenceError: require is not defined`.

7. **Sécurisation de l'Export PDF et du Logo Universel** :
   Pour éviter les plantages lors de la génération d'états d'heures et de profils exportables au format PDF, l'appel classique `doc.addImage("/logo.png", ...)` a été encapsulé par un helper asynchrone ultra-robuste (`src/lib/pdfLogo.ts`). Ce helper télécharge le logo UVCI, le valide puis le convertit en Base64. En cas d'erreur réseau, de restriction de bac à sable (sandbox iframe/CORS) ou de format non conforme, il injecte de façon transparente un pixel neutre 1x1 valide en base64. Cela neutralise à 100% l'erreur classique de jsPDF `wrong PNG signature` et de chargement d'image.

---

## 5. Commandes de Maintenance utiles

* **Démarrer en Développement** : `npm run dev`
* **Générer le client Prisma** : `npx prisma generate`
* **Pousser des changements de Schémas SQL sans migration historique complexe** (Neon DB) : `npx prisma db push`
* **Réalimenter la Base de Données à zéro (Seed)** : `npx tsx prisma/seed.ts`
* **Compiler le projet de production** : `npm run build`
