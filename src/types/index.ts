export type Role = 'admin' | 'secretaire' | 'enseignant';

export interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  id_profil: string;
  id_departement?: string;
  id_contrat?: string;
  taux_horaire?: number;
  salaire_base?: number;
  grade?: string;
  statut?: string;
  niveaux?: string[];
  diplomes?: string[];
  specialisation?: string;
  iban?: string;
  banque?: string;
  telephone?: string;
  adresse?: string;
  sexe?: 'M' | 'F' | 'Autre';
  actif: boolean;
  uid: string;
  photo_url?: string;
  contrat_url?: string;
  password?: string;
  last_login?: string;
}

export interface Filiere {
  id: string;
  libelle: string;
  code: string;
  description?: string;
}

export interface Niveau {
  id: string;
  libelle: string;
}

export interface Semestre {
  id: string;
  libelle: string;
}

export interface Departement {
  id: string;
  libelle: string;
  code: string;
}

export interface Contrat {
  id: string;
  libelle: string;
  type_contrat: string;
  salaire: number;
  nb_heures_min: number;
  nb_heures_max: number;
}

export interface AnneeAcademique {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  actif: boolean;
}

export interface TypeContrat {
  id: string;
  libelle: string;
}

export interface Grade {
  id: string;
  libelle: string;
}

export interface Statut {
  id: string;
  libelle: string;
}

export interface UserRole {
  id: string;
  libelle: string;
  code: Role;
}

export interface Cours {
  id: string;
  intitule: string;
  code_cours: string;
  nb_heures: number;
  nb_credits?: number;
  nb_sequences: number;
  id_annee_academique: string;
  id_filiere: string;
  id_niveau: string;
  id_semestre: string;
}

export interface Sequence {
  id: string;
  id_ressource: string;
  numero: number;
  titre: string;
  description?: string;
}

export interface Ressource {
  id: string;
  id_cours: string;
  titre: string;
  type: string; // e.g., 'PDF', 'Video', 'Quiz'
  description?: string;
  pdf_url?: string;
}

export type Activite = ActivitePedagogique;

export interface ActivitePedagogique {
  id: string;
  id_utilisateur: string;
  id_ressource?: string;
  id_annee_academique: string;
  id_coefficient?: string;
  id_etat_heures?: string;
  type_action: 'Conception' | 'MAJ';
  niveau_complexite: 'N1' | 'N2' | 'N3';
  nb_sequences: number;
  volume_horaire: number;
  montant?: number;
  date_saisie: string;
  statut: 'en_attente' | 'soumise' | 'valide' | 'rejete';
  motif_rejet?: string;
  id_cours: string;
  paye?: boolean;
  date_paiement?: string;
  commentaire_validation?: string;
  libelle?: string;
  type_activite?: string;
  user?: { nom: string; prenom: string; id: string; role: string; photo_url?: string; taux_horaire?: number };
  cours?: { intitule: string; code_cours: string };
}

export interface Coefficient {
  id: string;
  type_action: 'Conception' | 'MAJ';
  niveau_complexite: 'N1' | 'N2' | 'N3';
  valeur: number;
  description: string;
}

export interface EtatHeures {
  id: string;
  id_utilisateur: string;
  id_annee_academique: string;
  periode: string;
  total_heures: number;
  heures_complementaires: number;
  nb_activites: number;
  montant_total: number;
  statut: 'brouillon' | 'finalise' | 'valide' | 'paye';
  date_generation: string;
  nom_enseignant?: string;
}

export interface Paiement {
  id: string;
  id_utilisateur: string;
  id_annee_academique: string;
  montant: number;
  mode_paiement: string;
  reference_paiement: string;
  periode: string;
  statut: 'en_attente' | 'paye' | 'annule' | 'effectue';
  date_paiement: string;
  nom_enseignant?: string;
}

export interface SessionLog {
  id: string;
  id_utilisateur: string;
  user_name: string;
  ip_address: string;
  user_agent: string;
  date_connexion: string;
  actif: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  targetId?: string;
  ip_address?: string;
  user_agent?: string;
  device?: string;
}

export interface AppNotification {
  id: string;
  id_utilisateur: string; // Target user
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  lu: boolean;
  date: string;
  lien?: string;
}

export interface UserDocument {
  id: string;
  id_user: string;
  nom: string;
  type: string;
  file_url: string;
  date_upload: string;
}
