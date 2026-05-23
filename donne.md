# Données Standardisées (Référentiel UVCI)

## 1. Grades des Enseignants
- Assistant
- Maître-Assistant
- Professeur

## 2. Statuts des Enseignants
- Permanent
- Vacataire

## 3. Niveaux d'Études
- Licence 1 (L1)
- Licence 2 (L2)
- Licence 3 (L3)
- Master 1 (M1)
- Master 2 (M2)
- Doctorat

## 4. Filières par Niveau

### Licence
1. Développement d'Application et e-Services (ISN-DAS)
2. Base de Données (ISN-BD)
3. Réseaux et Sécurité Informatique (ISN-RSI)
4. Multimédia Et Arts Numériques (ISN-MMX)
5. Communication Digitale (ISN-COM)
6. e-Commerce et Marketing Digital (ISN-CMD)
7. e-Administration et Transformations Digitales (ISN-ATD)
8. Sciences et Technologies Géospatiales (ISN-STG)

### Master
1. Blockchain (ISN-BC)
2. Cybersécurité et Internet des Objets (ISN-CIO)
3. Big Data Analytics (ISN-BDA)
4. Business et Communication Digitale (ISN-BCD)
5. Design 3D, Animation et Audiovisuel (ISN-D2A)

### Doctorat
1. Cybersécurité et Internet des Objets (ISN-CIO)
2. Blockchain (ISN-BC)
3. Big Data Analytics (ISN-BDA)
4. Business et Communication Digitale (ISN-BCD)
5. Design 3D, Animation et Audiovisuel (ISN-D2A)

## 5. Paramètres de Calcul (Matrice des Heures)

### Types d'Actions
- Conception de ressources
- Mise à jour de ressources

### Niveaux de Complexité
- **Niveau 1** : Contenus simples + quizz + évaluations
- **Niveau 2** : Niveau 1 + 25% d'activités interactives + quiz + évaluation
- **Niveau 3** : Serious games, simulations, haute qualité

### Matrice de Conversion (Volume Horaire Total)
| Crédits | Séquences | Niveau 1 | Niveau 2 | Niveau 3 |
| :--- | :--- | :--- | :--- | :--- |
| 1 Cr | 40 | 16h | 30h | 60h |
| 2 Cr | 80 | 32h | 60h | 120h |
| 3 Cr | 120 | 48h | 90h | 180h |
| 4 Cr | 160 | 64h | 120h | 240h |

*Note: Pour la Mise à Jour (MAJ), les valeurs sont réduites (voir page 1 du PDF).*

## 6. Statut de Standardisation
- [x] **Grades** : Implémenté (`Assistant`, `Maître-Assistant`, `Professeur`)
- [x] **Statuts** : Implémenté (`Permanent`, `Vacataire`)
- [x] **Calculs** : Implémenté (Volume Horaire x Taux Horaire automatisé au Backend)
- [x] **Flux de Validation** : Audité et Sécurisé (Brouillon -> Soumis -> Validé -> État d'heures)
- [x] **Départements** : Configurable via l'interface Admin.

## 7. Autres Référentiels à Standardiser
- **Coefficients de pondération** (si différents du barème PDF)
- **Motifs de rejet types** (pour uniformiser les feedbacks)
- **Codes budgétaires** (pour l'export financier)
