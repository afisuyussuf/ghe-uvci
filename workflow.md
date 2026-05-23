# Workflow de l'Application G-Vacataires UVCI

Ce document décrit les actions et responsabilités de chaque profil d'utilisateur au sein de la plateforme.

## 1. Administrateurs (Super-Utilisateurs)
L'administrateur assure la configuration globale et la supervision finale.
- **Configuration Système** : Gestion des années académiques, départements, grades et taux horaires.
- **Gestion des Utilisateurs** : Création, suspension et modification des comptes (Enseignants, Secrétaires, Admins).
- **Validation Finale** : Approuve les états de paiement globaux générés par les secrétaires.
- **Audit & Statistiques** : Visualise les KPI de l'université (coût total, volume horaire par département).
- **Maintenance** : Gestion des sauvegardes et logs d'audit.

## 2. Secrétaires (Gestionnaires de Département)
Le secrétaire est le pivot entre les enseignants et l'administration.
- **Gestion des Cours** : Attribution des cours et volumes horaires aux enseignants.
- **Validation des Activités** : Vérifie et valide les séances saisies par les enseignants.
- **Gestion des Documents** : Dépôt des bulletins de paie et récapitulatifs officiels pour les enseignants.
- **Génération des États** : Exportation des bordereaux de paiement et états périodiques par département.
- **Communication** : Envoi de notifications aux enseignants en cas de rejet d'activité ou de dossier incomplet.

## 3. Enseignants (Intervenants)
L'enseignant est l'utilisateur final qui déclare son service.
- **Gestion de Profil** : Mise à jour des informations personnelles, académiques (niveaux, spécialité) et bancaires (RIB).
- **Saisie des Heures** : Déclaration quotidienne ou hebdomadaire des activités réalisées (Cours, TDE, Surveillance, Jury).
- **Dossier Numérique** : Téléchargement du contrat, des diplômes et consultation des bulletins de paie.
- **Suivi Analytique** : Visualisation du récapitulatif des heures validées et prévisions de gains.
- **Disponibilités** : Déclaration des créneaux horaires libres pour la planification des cours.

---

## Processus de Validation d'une Activité
1. **Saisie** : L'Enseignant saisit une activité sur son tableau de bord.
2. **Revue** : Le Secrétaire reçoit une notification, vérifie la conformité (volume, date).
3. **Action** : 
   - Si valide : L'activité passe au statut "Validée".
   - Si invalide : Le secrétaire rejette avec un motif, l'enseignant est notifié pour modification.
4. **Calcul** : Les activités "Validées" sont automatiquement comptabilisées dans le prochain état de paiement.
