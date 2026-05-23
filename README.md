# GHE UVCI - Gestion des Heures Enseignants

## 🎯 Présentation du Projet
**GHE UVCI** est une application web complète développée pour l'Université Virtuelle de Côte d'Ivoire (UVCI). Elle permet la gestion automatisée, le suivi et le calcul des charges pédagogiques des enseignants.

L'objectif principal est de fiabiliser les calculs de volumes horaires, d'assurer la traçabilité des activités et de faciliter la génération des états de paiement.

## 🚀 Stack Technique
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Express.js (Node.js), TypeScript.
- **Base de Données**: Prisma ORM, PostgreSQL avec **système de repli de secours local automatique** (file database JSON fallback) si la base PostgreSQL est indisponible ou dépasse son quota de transfert.
- **Visualisation**: Recharts.
- **Exports**: jsPDF (sécurisé avec résolveur d'image robuste asynchrone pour éviter les plantages d'assets/CORS), XLSX.

## 🧩 Modules Principaux
1. **Tableau de Bord**: Statistiques globales, graphiques de volume horaire et activités récentes.
2. **Gestion des Activités**: Saisie assistée des activités pédagogiques avec calcul automatique du volume horaire.
3. **Gestion des Enseignants**: Suivi des profils, grades et contrats (CDI, Vacataire).
4. **Catalogue des Cours**: Gestion des maquettes pédagogiques par filière et niveau.
5. **États d'Heures**: Génération automatique des récapitulatifs par période.
6. **Suivi des Paiements**: Historique et statut des règlements.

## 🧮 Logique de Calcul
Le système applique les règles de gestion officielles de l'UVCI :
- **Nombre de Séquences** = Heures de cours × 4.
- **Volume Horaire** = Nombre de Séquences × Coefficient.
- **Coefficients**:
  - Conception N1: 0.400
  - Conception N2: 0.750
  - Conception N3: 1.500
  - MAJ N1: 0.200
  - MAJ N2: 0.375
  - MAJ N3: 0.750

## 🎨 Charte Graphique
L'application respecte l'identité visuelle de l'UVCI :
- **Violet UVCI**: `#5A2D82` (Utilisé pour les actions principales et la navigation).
- **Vert UVCI**: `#00A859` (Utilisé pour les validations et le succès).
- **Typographie**: Inter (Sans-serif) pour la lisibilité et Outfit pour les titres.

## 🛠️ Installation et Configuration
1. Cloner le projet.
2. Installer les dépendances : `npm install`.
3. Configurer `DATABASE_URL` dans le fichier `.env`.
4. Préparer la DB : `npx prisma db push`.
5. Lancer le serveur de développement : `npm run dev`.

## 🛡️ Sécurité
- Authentification par Email / Mot de passe.
- Règles d'accès (RBAC) pour protéger les données.
- Audit des actions via l'historique des activités.

## 📘 Bonnes Pratiques
- Utilisation de composants réutilisables.
- Typage strict avec TypeScript.
- Animations fluides avec Framer Motion pour une meilleure UX.
- Design responsive (Mobile First).

---
*Développé avec ❤️ pour l'UVCI.*
