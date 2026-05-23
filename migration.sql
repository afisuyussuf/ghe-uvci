-- =========================================================================
-- SCRIPT DE MIGRATION SQL - GHE UVCI
-- Systèmes de Gestion des Heures d'Enseignement - Université Virtuelle de Côte d'Ivoire
-- Script correspondant aux définitions des tables complexes PostgresSQL
-- =========================================================================

-- 1. Table : AnneeAcademique
CREATE TABLE IF NOT EXISTS "AnneeAcademique" (
    "id" VARCHAR(255) NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT "AnneeAcademique_pkey" PRIMARY KEY ("id")
);

-- 2. Table : Departement
CREATE TABLE IF NOT EXISTS "Departement" (
    "id" VARCHAR(255) NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Departement_code_key" ON "Departement"("code");

-- 3. Table : User
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

-- 4. Table : Disponibilite
CREATE TABLE IF NOT EXISTS "Disponibilite" (
    "id" VARCHAR(255) NOT NULL,
    "id_utilisateur" VARCHAR(255) NOT NULL,
    "jour" VARCHAR(50) NOT NULL,
    "creneau" VARCHAR(50) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT TRUE,
    "date_maj" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disponibilite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Disponibilite_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Table : Filiere
CREATE TABLE IF NOT EXISTS "Filiere" (
    "id" VARCHAR(255) NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Filiere_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Filiere_code_key" ON "Filiere"("code");

-- 6. Table : Niveau
CREATE TABLE IF NOT EXISTS "Niveau" (
    "id" VARCHAR(255) NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,

    CONSTRAINT "Niveau_pkey" PRIMARY KEY ("id")
);

-- 7. Table : Cours
CREATE TABLE IF NOT EXISTS "Cours" (
    "id" VARCHAR(255) NOT NULL,
    "intitule" VARCHAR(255) NOT NULL,
    "code_cours" VARCHAR(100) NOT NULL,
    "nb_heures" DOUBLE PRECISION NOT NULL,
    "nb_credits" INTEGER,
    "nb_sequences" INTEGER NOT NULL,
    "id_filiere" VARCHAR(255) NOT NULL,
    "id_niveau" VARCHAR(255) NOT NULL,
    "id_semestre" VARCHAR(255) NOT NULL,
    "id_annee_academique" VARCHAR(255) NOT NULL,

    CONSTRAINT "Cours_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Cours_id_filiere_fkey" FOREIGN KEY ("id_filiere") REFERENCES "Filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cours_id_niveau_fkey" FOREIGN KEY ("id_niveau") REFERENCES "Niveau"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Cours_code_cours_key" ON "Cours"("code_cours");

-- 8. Table : Activite (Déclarations)
CREATE TABLE IF NOT EXISTS "Activite" (
    "id" VARCHAR(255) NOT NULL,
    "id_user" VARCHAR(255) NOT NULL,
    "id_cours" VARCHAR(255) NOT NULL,
    "id_ressource" VARCHAR(255),
    "type_action" VARCHAR(100) NOT NULL, -- 'Conception' / 'MAJ'
    "niveau_complexite" VARCHAR(50) NOT NULL DEFAULT 'N1', -- 'N1', 'N2', 'N3'
    "nb_sequences" INTEGER NOT NULL,
    "volume_horaire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION,
    "statut" VARCHAR(50) NOT NULL DEFAULT 'en_attente', -- 'en_attente', 'soumise', 'valide', 'rejete'
    "motif_rejet" TEXT,
    "id_etat_heures" VARCHAR(255),
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paye" BOOLEAN NOT NULL DEFAULT FALSE,
    "date_paiement" TIMESTAMP(3),

    CONSTRAINT "Activite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Activite_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activite_id_cours_fkey" FOREIGN KEY ("id_cours") REFERENCES "Cours"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. Table : Paiement
CREATE TABLE IF NOT EXISTS "Paiement" (
    "id" VARCHAR(255) NOT NULL,
    "id_user" VARCHAR(255) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "mode_paiement" VARCHAR(100) NOT NULL,
    "reference_paiement" VARCHAR(255) NOT NULL,
    "periode" VARCHAR(100) NOT NULL,
    "statut" VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    "date_paiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Paiement_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 10. Table : AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" VARCHAR(255) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255),
    "userEmail" VARCHAR(255),
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 11. Table : Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" VARCHAR(255) NOT NULL,
    "id_utilisateur" VARCHAR(255) NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lu" BOOLEAN NOT NULL DEFAULT FALSE,
    "type" VARCHAR(100) NOT NULL DEFAULT 'info',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- 12. Table : EtatHeures
CREATE TABLE IF NOT EXISTS "EtatHeures" (
    "id" VARCHAR(255) NOT NULL,
    "id_utilisateur" VARCHAR(255) NOT NULL,
    "periode" VARCHAR(100) NOT NULL,
    "total_heures" DOUBLE PRECISION NOT NULL,
    "heures_complementaires" DOUBLE PRECISION,
    "nb_activites" INTEGER NOT NULL,
    "montant_total" DOUBLE PRECISION NOT NULL,
    "statut" VARCHAR(100) NOT NULL DEFAULT 'brouillon', -- 'brouillon', 'valide', 'paye'
    "date_generation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nom_enseignant" VARCHAR(255),

    CONSTRAINT "EtatHeures_pkey" PRIMARY KEY ("id")
);

-- 13. Table : Ressource
CREATE TABLE IF NOT EXISTS "Ressource" (
    "id" VARCHAR(255) NOT NULL,
    "id_cours" VARCHAR(255) NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Ressource_pkey" PRIMARY KEY ("id")
);

-- 14. Table : Sequence
CREATE TABLE IF NOT EXISTS "Sequence" (
    "id" VARCHAR(255) NOT NULL,
    "id_ressource" VARCHAR(255) NOT NULL,
    "numero" INTEGER NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- 15. Table : UserDocument
CREATE TABLE IF NOT EXISTS "UserDocument" (
    "id" VARCHAR(255) NOT NULL,
    "id_user" VARCHAR(255) NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL, -- 'Contrat', 'Justificatif', etc.
    "file_url" TEXT NOT NULL,
    "date_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserDocument_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 16. Table : Coefficient
CREATE TABLE IF NOT EXISTS "Coefficient" (
    "id" VARCHAR(255) NOT NULL,
    "type_action" VARCHAR(100) NOT NULL, -- 'Conception' / 'MAJ'
    "niveau_complexite" VARCHAR(50) NOT NULL, -- 'N1', 'N2', 'N3'
    "valeur" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "Coefficient_pkey" PRIMARY KEY ("id")
);
