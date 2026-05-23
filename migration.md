# Guide de Migration de Base de Données Relos - GHE UVCI
Gestion des Heures d'Enseignement - Université Virtuelle de Côte d'Ivoire

Ce fichier regroupe les différentes requêtes SQL nécessaires pour la création manuelle et l'initialisation des tables dans votre base de données PostgreSQL de production.

---

## 1. Ordre d'Exécution Recommandé

Pour éviter des erreurs de clés étrangères (`FOREIGN KEY`), il est primordial de créer les tables dans l'ordre suivant :

1. **Tables indépendantes ou de premier niveau** :
   * `AnneeAcademique`
   * `Departement`
   * `Filiere`
   * `Niveau`
   * `Coefficient`
   * `AuditLog`
   * `Notification`
2. **Table Utilisateurs** (qui référence `Departement`, etc.) :
   * `User`
3. **Tables dépendantes de l'utilisateur** :
   * `Disponibilite`
   * `UserDocument`
4. **Table des cours** (qui référence `Filiere` et `Niveau`) :
   * `Cours`
5. **Tables d'activités et de suivi** :
   * `Activite` (déclarations des heures)
   * `Paiement` (versements d'honoraires comptables)
   * `EtatHeures` (fiches mensuelles recap)
   * `Ressource` / `Sequence`

---

## 2. Requetes SQL Complètes

Consultez le fichier adjacent `migration.sql` pour obtenir l'intégralité du script de création des tables, clés étrangères, et index uniques pour PostgreSQL.

### Exemple de Création de la Table Principal `User`

```sql
CREATE TABLE IF NOT EXISTS "User" (
    "id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "prenom" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'enseignant',
    "id_profil" VARCHAR(255),
    "id_departement" VARCHAR(255),
    "id_contrat" VARCHAR(255),
    "taux_horaire" DOUBLE PRECISION,
    "salaire_base" DOUBLE PRECISION,
    "grade" VARCHAR(100),
    "statut" VARCHAR(100) DEFAULT 'Vacataire',
    "telephone" VARCHAR(100),
    "adresse" VARCHAR(255),
    "iban" VARCHAR(255),
    "banque" VARCHAR(255),
    "sexe" VARCHAR(10),
    "actif" BOOLEAN NOT NULL DEFAULT TRUE,
    "photo_url" TEXT,
    "niveaux" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diplomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialisation" TEXT,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
```

---

## 3. Alimentation Initiale (Seed SQL)

Une fois les tables créées, vous pouvez insérer les coefficients par défaut dans la base de données :

```sql
INSERT INTO "Coefficient" ("id", "type_action", "niveau_complexite", "valeur", "description") VALUES
('coeff-1', 'Conception', 'N1', 1.5, 'Conception simple (cours magistral standard)'),
('coeff-2', 'Conception', 'N2', 2.0, 'Conception moyenne (cours magistral avec quiz)'),
('coeff-3', 'Conception', 'N3', 2.5, 'Conception complexe (cours avec labos interactifs)'),
('coeff-4', 'MAJ', 'N1', 0.5, 'Mise à jour mineure de ressource'),
('coeff-5', 'MAJ', 'N2', 0.8, 'Mise à jour moyenne de syllabus ou quiz'),
('coeff-6', 'MAJ', 'N3', 1.2, 'Mise à jour majeure avec refonte de structure');
```
