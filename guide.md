# Guide de l'Utilisateur - Gestion des Heures (GHE)

Ce guide contient des informations essentielles pour l'utilisation et la maintenance de l'application GHE.

## 1. Architecture Technique

### Vue d'ensemble
L'application GHE suit une architecture **Full-Stack (3-Tier)** :

```text
[ Client (Navigateur) ] <--- HTTP/JSON ---> [ Serveur API (Node.js/Express) ] <--- SQL ---> [ Base de Données (PostgreSQL) ]
      (Frontend)                                     (Backend)                                         (DB/Prisma)
```

### Stack Technologique
- **Frontend** : 
  - Framework : **React 19**
  - Build Tool : **Vite**
  - Styling : **Tailwind CSS** (Utilitaire-first)
  - Animations : **Framer Motion**
  - Charts : **Recharts**
  - Icons : **Lucide React**
- **Backend** : 
  - Runtime : **Node.js**
  - Framework : **Express.js**
  - Langage : **TypeScript** (via `tsx`)
- **Base de Données** : 
  - ORM : **Prisma**
  - Moteur : **PostgreSQL** avec un **système de repli de secours local automatique basé sur les fichiers JSON** (`backend/lib/local_db.ts`) si la base principale est indisponible ou si ses limites de transfert sont saturées.
  - Cela garantit une continuité de service absolue pour l'authentification, les déclarations et la configuration des paramètres.

## 2. Dépendances Externes
L'application dépend des services/bibliothèques externes suivants :
- **Google Fonts** : Chargement des polices *Inter* et *Outfit*.
- **Cloudflare/CDN** : Pour certains assets statiques.
- **jsPDF & autoTable** : Génération de rapports PDF côté client.
- **XLSX (SheetJS)** : Exportation Excel côté client.

## 3. Documentation de l'API (Swagger/REST)
Les routes API sont structurées sous le préfixe `/api`. 
- **Spécification** : [Lien vers la doc API (si déployée) ou description des endpoints ci-dessous]
- **Principaux Endpoints** :
  - `GET /api/users` : Liste des enseignants.
  - `GET /api/activities` : Activités pédagogiques.
  - `POST /api/activities` : Saisie d'une nouvelle activité.
  - `GET /api/stats/summary` : Données du tableau de bord.

---

## 4. Installation et Lancement Rapide

### Prérequis
- Node.js (v18+)
- npm ou yarn

### Lancement en Développement
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Préparer la base de données :
   ```bash
   npx prisma generate
   npm run db:push
   ```
3. Lancer le serveur (Vite + Express) :
   ```bash
   npm run dev
   ```
   *L'application sera accessible sur `http://localhost:3000`.*

### Lancement en Production
```bash
npm run build
npm start
```

## 2. Authentification
L'authentification est gérée par le serveur Express. En l'absence de base de données active, des comptes de test sont disponibles "en dur" :
- **Admin** : `yussuf.afisu@uvci.edu.ci` / `password`
- **Secrétaire** : `safi.moustapha@uvci.edu.ci` / `demo123`
- **Enseignant** : `seydou1.sangare@uvci.edu.ci` / `demo@demo`

## 3. Gestion des Activités
- Les enseignants peuvent saisir leurs activités de conception ou de mise à jour (MAJ).
- Les administrateurs et secrétaires valident ou rejettent ces activités.
- Le volume horaire est calculé automatiquement en fonction du nombre de séquences et des coefficients définis.

## 4. Maintenance Technique
### Mise à jour du schéma de base de données
Si vous modifiez le fichier `prisma/schema.prisma`, exécutez :
```bash
npm run db:push
```
Cela mettra à jour la structure de votre base de données locale sans effacer les données existantes.

### Variables d'environnement
Le fichier `.env` doit contenir la variable `DATABASE_URL` pour la connexion PostgreSQL.
Exemple : `DATABASE_URL="postgresql://user:password@localhost:5432/ghe_db"`

## 5. Exports
L'application permet l'export des données en PDF (via jsPDF) et Excel (via XLSX) pour les états d'heures et l'historique.
