# Guide de l'Utilisateur - GHE UVCI
**Gestion des Heures d'Enseignement - Université Virtuelle de Côte d'Ivoire**

Bienvenue sur la plateforme **GHE UVCI** ! Ce guide est conçu pour vous accompagner pas-à-pas lors de votre première connexion, vous expliquer quelles données saisir et comment naviguer sur l'application selon votre profil.

---

## 1. Informations de Connexion par Défaut

Lors de la première initialisation de la base de données, trois démonstrateurs prédéfinis sont disponibles pour explorer toutes les facettes de l'application :

| Rôle | E-mail de connexion | Mot de passe | Description d'accès |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@uvci.edu.ci` | `demo123` | Accès universel (Configuration globale, Gestion des utilisateurs) |
| **Secrétaire** | `safi.moustapha@uvci.edu.ci` | `demo123` | Gestion opérationnelle et comptable (Cours, validations, paiements) |
| **Enseignant** | `kouassi.jean@uvci.edu.ci` | `demo123` | Enseignant du département Informatique (Déclarations d'heures, profil) |

> 🔒 **Recommandation de sécurité** : Dès votre première connexion, accédez à la rubrique **"Mon Profil"** pour personnaliser vos informations et sécuriser votre compte.

---

## 2. Guide de Navigation par Profil

### 🛠️ Profil : Administrateur (`admin`)
L'Administrateur configure les bases structurelles du système pour les semestres et les années d'études.

#### Étape 1 : Configurer la structure dans "Paramètres"
Avant de pouvoir inscrire des cours ou des enseignants, vous devez déclarer les référentiels de base dans la page **Administration > Paramètres** :
1. **Années Académiques** : Ajoutez l'année en cours (ex : `2025-2026`) avec ses dates de début/fin, et marquez-la comme active.
2. **Départements** : Enregistrez les UFR ou départements (ex : *Informatique et Sciences du Numérique - ISN*).
3. **Filières** : Associez-les à des codes uniques (ex : *DAS*, *RSI*, *STG*).
4. **Niveaux** : Précisez les cycles (ex : *Licence 1 (L1)*, *Master 2 (M2)*).
5. **Barèmes (Coefficients)** : Saisissez les taux multiplicateurs associés à la charge de travail (*Conception* vs *MAJ*) et la complexité d'un contenu (*N1*, *N2*, *N3*).

#### Étape 2 : Recruter et Configurer les Utilisateurs dans "Profils"
Dans l'onglet de gestion des utilisateurs :
1. Créez un compte pour chaque enseignant et secrétaire.
2. Spécifiez leur **taux horaire**, leur **contrat/statut**, et rattachés-les à un **département**.

---

### 💼 Profil : Secrétaire (`secretaire`)
Le Secrétaire gère le catalogue de formation et valide les performances et paiements.

#### Étape 1 : Insérer les cours
Dans **Cours** :
1. Ajoutez les cours du semestre en remplissant l'intitulé, le code, le nombre d'heures total et le volume de séquences prévues.
2. Liez chaque cours à un enseignant titulaire, à une filière et à un niveau d'études.

#### Étape 2 : Vérification des heures déclarées
Dans **Activités** :
1. Consultez les prestations déclarées par les enseignants.
2. Validez les activités conformes ou rejetez-les en ajoutant un motif de rejet clair.
3. Générez les **États d'heures** à la fin du mois.

---

### 👨‍🏫 Profil : Enseignant (`enseignant`)
L'Enseignant déclare ses actions de conception et perçoit ses honoraires.

#### Étape 1 : Mettre à jour son Profil et importer ses Justificatifs
1. Allez dans **Mon Profil** : changez votre photo (en important un fichier de votre appareil ou par URL), complétez vos coordonnées et ajoutez vos coordonnées bancaires (IBAN/Banque).
2. Toujours dans **Mon Profil**, accédez à l'onglet **Documents** pour déposer votre contrat de travail signé ou une copie de vos diplômes.

#### Étape 2 : Renseigner ses Disponibilités
Dans **Disponibilités** :
1. Déterminez vos créneaux d'enseignement hebdomadaires libres (Matin / Après-midi par jour de la semaine).

#### Étape 3 : Déclarer ses Activités d'Enseignement
Dans **Activités** :
1. Cliquez sur **Déclarer une activité**.
2. Indiquez le cours dispensé, le type d'acte d'enseignement (*Conception de ressources* ou *Mise à Jour (MAJ)*) et le niveau de complexité correspondants (*N1*, *N2*, *N3*).
3. Le montant estimé s'affiche automatiquement en fonction du coefficient et de votre taux horaire. Soumettez la déclaration à la validation !

---

## 3. Gestion des Règlements & Statistiques

À l'onglet **Paiements** :
* Les **administrateurs** et **secrétaires** disposent d'un **Mini-tableau de bord financier**.
* Ce tableau de bord permet de surveiller en temps réel le montant total réglé aux enseignants, les encours de règlements à effectuer, les cumuls totaux par département et le **Taux de règlement global** sous format de jauge de progression intelligente.
* Pour effectuer un paiement, il suffit de cocher l'activité validée correspondante et de cliquer sur "Confirmer le paiement".
