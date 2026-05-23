import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Layers,
  Building2,
  Settings2,
  Check,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Database,
  Bell,
  Volume2,
  Briefcase,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Layout,
  Percent,
  Clock,
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';
import { Departement, Filiere, Niveau, AnneeAcademique, TypeContrat, Grade, Statut, UserRole, Coefficient, Semestre, UserProfile, Cours } from '../types';
import Pagination from '../components/Pagination';
import { getThemedSwal } from '../lib/swal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useConfig } from '../contexts/ConfigContext';
import { Moon, Sun } from 'lucide-react';

type TabType = 'departements' | 'filieres' | 'niveaux' | 'annees' | 'systeme' | 'contrats' | 'grades' | 'statuts' | 'roles' | 'coefficients' | 'semestres' | 'maintenance' | null;

export default function SettingsPage() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { config: globalConfig } = useConfig();
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [typesContrat, setTypesContrat] = useState<TypeContrat[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [coefficients, setCoefficients] = useState<Coefficient[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    libelle: '',
    code: '',
    valeur: 0,
    description: '',
    actif: true
  });

  // System Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notifications_enabled') !== 'false');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('sound_enabled') !== 'false');
  const [appConfig, setAppConfig] = useState({
    appName: 'GHE UVCI',
    defaultAnneeId: '',
    chargeHoraireAnnuelle: 192,
    signatureUrl: ''
  });

  useEffect(() => {
    if (globalConfig) {
      setAppConfig(globalConfig);
    }
  }, [globalConfig]);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'admin' && profile.role !== 'secretaire') return;

    const fetchData = async () => {
      try {
        fetch('/api/departements').then(res => res.json()).then(setDepartements);
        fetch('/api/filieres').then(res => res.json()).then(setFilieres);
        fetch('/api/niveaux').then(res => res.json()).then(setNiveaux);
        fetch('/api/annees').then(res => res.json()).then(setAnnees);
        fetch('/api/contrats').then(res => res.json()).then(setTypesContrat);
        fetch('/api/grades').then(res => res.json()).then(setGrades);
        fetch('/api/statuts').then(res => res.json()).then(setStatuts);
        fetch('/api/roles').then(res => res.json()).then(setUserRoles);
        fetch('/api/coefficients').then(res => res.json()).then(setCoefficients);
        fetch('/api/semestres').then(res => res.json()).then(setSemestres);
        fetch('/api/users').then(res => res.json()).then(setUsers);
        fetch('/api/courses').then(res => res.json()).then(setCours);
      } catch (err) {
        console.error("Failed to fetch settings data:", err);
      }
    };

    fetchData();
  }, [profile]);

  const saveAppConfig = async () => {
    try {
      const payload = {
        ...appConfig,
        signatureUrl: signaturePreview || appConfig.signatureUrl
      };
      
      const res = await fetch('/api/config/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAppConfig(payload);
        getThemedSwal().fire('Succès', 'Configuration mise à jour.', 'success');
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      console.error(error);
      getThemedSwal().fire('Erreur', 'Impossible de sauvegarder la configuration.', 'error');
    }
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notifications_enabled', String(newValue));
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('sound_enabled', String(newValue));
  };

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      if (activeTab === 'coefficients') {
        setFormData({
          type_action: 'Conception',
          niveau_complexite: 'N1',
          valeur: 0,
          description: ''
        });
      } else {
        setFormData({});
      }
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let apiPath = '';
    switch(activeTab) {
      case 'annees': apiPath = 'annees'; break;
      case 'contrats': apiPath = 'contrats'; break;
      case 'grades': apiPath = 'grades'; break;
      case 'statuts': apiPath = 'statuts'; break;
      case 'roles': apiPath = 'roles'; break;
      case 'coefficients': apiPath = 'coefficients'; break;
      case 'semestres': apiPath = 'semestres'; break;
      default: apiPath = activeTab || '';
    }

    try {
      const dataToSave = { ...formData };
      const id = dataToSave.id;
      delete dataToSave.id;

      if (editingItem) {
        await fetch(`/api/${apiPath}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
        getThemedSwal().fire('Succès', 'Élément mis à jour.', 'success');
      } else {
        await fetch(`/api/${apiPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
        getThemedSwal().fire('Succès', 'Nouvel élément ajouté.', 'success');
      }
      setIsModalOpen(false);
      // Reload current tab data
      fetch(`/api/${apiPath}`).then(res => res.json()).then(data => {
        if (activeTab === 'departements') setDepartements(data);
        if (activeTab === 'filieres') setFilieres(data);
        if (activeTab === 'niveaux') setNiveaux(data);
        if (activeTab === 'annees') setAnnees(data);
        if (activeTab === 'contrats') setTypesContrat(data);
        if (activeTab === 'grades') setGrades(data);
        if (activeTab === 'statuts') setStatuts(data);
        if (activeTab === 'roles') setUserRoles(data);
        if (activeTab === 'coefficients') setCoefficients(data);
        if (activeTab === 'semestres') setSemestres(data);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    let apiPath = '';
    let dependencyFound = false;
    let dependencyMessage = '';

    switch(activeTab) {
      case 'departements': 
        apiPath = 'departements';
        if (users.some(u => u.id_departement === id)) {
          dependencyFound = true;
          dependencyMessage = "Ce département est utilisé par un ou plusieurs enseignants.";
        }
        break;
      case 'filieres':
        apiPath = 'filieres';
        if (cours.some(c => c.id_filiere === id)) {
          dependencyFound = true;
          dependencyMessage = "Cette filière est liée à un ou plusieurs cours.";
        }
        break;
      case 'niveaux':
        apiPath = 'niveaux';
        if (cours.some(c => c.id_niveau === id)) {
          dependencyFound = true;
          dependencyMessage = "Ce niveau est lié à un ou plusieurs cours.";
        }
        break;
      case 'contrats':
        apiPath = 'contrats';
        if (users.some(u => u.id_contrat === id)) {
          dependencyFound = true;
          dependencyMessage = "Ce type de contrat est utilisé par un ou plusieurs enseignants.";
        }
        break;
      case 'grades':
        apiPath = 'grades';
        const gradeLibelle = grades.find(g => g.id === id)?.libelle;
        if (users.some(u => u.grade === gradeLibelle)) {
          dependencyFound = true;
          dependencyMessage = "Ce grade est utilisé par un ou plusieurs enseignants.";
        }
        break;
      case 'semestres':
        apiPath = 'semestres';
        if (cours.some(c => c.id_semestre === id)) {
          dependencyFound = true;
          dependencyMessage = "Ce semestre est lié à un ou plusieurs cours.";
        }
        break;
      case 'annees': apiPath = 'annees'; break;
      case 'statuts': apiPath = 'statuts'; break;
      case 'roles': apiPath = 'roles'; break;
      case 'coefficients': apiPath = 'coefficients'; break;
      default: apiPath = activeTab || '';
    }

    if (dependencyFound) {
      getThemedSwal().fire({
        title: 'Suppression impossible',
        text: dependencyMessage,
        icon: 'error'
      });
      return;
    }

    const result = await getThemedSwal().fire({
      title: 'Supprimer ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/${apiPath}/${id}`, { method: 'DELETE' });
        getThemedSwal().fire('Supprimé', 'L\'élément a été supprimé.', 'success');
        // Update local state
        if (activeTab === 'departements') setDepartements(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'filieres') setFilieres(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'niveaux') setNiveaux(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'annees') setAnnees(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'contrats') setTypesContrat(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'grades') setGrades(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'statuts') setStatuts(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'roles') setUserRoles(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'coefficients') setCoefficients(prev => prev.filter(i => i.id !== id));
        if (activeTab === 'semestres') setSemestres(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleAnneeStatus = async (annee: AnneeAcademique) => {
    try {
      await fetch(`/api/annees/${annee.id}/toggle`, { method: 'POST' });
      fetch('/api/annees').then(res => res.json()).then(setAnnees);
      getThemedSwal().fire('Succès', 'Statut de l\'année mis à jour.', 'success');
    } catch (error) {
      console.error(error);
      getThemedSwal().fire('Erreur', 'Impossible de mettre à jour le statut.', 'error');
    }
  };

  const seedDefaultUsers = async () => {
    const result = await getThemedSwal().fire({
      title: 'Initialiser les comptes ?',
      text: "Cela va créer les comptes par défaut s'ils n'existent pas.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, initialiser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'users' })
        });
        getThemedSwal().fire('Succès', 'Comptes initialisés.', 'success');
        fetch('/api/users').then(res => res.json()).then(setUsers);
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Impossible d\'initialiser les comptes.', 'error');
      }
    }
  };

  const seedFormations = async () => {
    const result = await getThemedSwal().fire({
      title: 'Initialiser les formations ?',
      text: "Cela va créer les filières, niveaux et semestres par défaut.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, initialiser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'formations' })
        });
        getThemedSwal().fire('Succès', 'Filières, Niveaux et Semestres initialisés.', 'success');
        fetch('/api/filieres').then(res => res.json()).then(setFilieres);
        fetch('/api/niveaux').then(res => res.json()).then(setNiveaux);
        fetch('/api/semestres').then(res => res.json()).then(setSemestres);
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Impossible d\'initialiser les formations.', 'error');
      }
    }
  };

  const seedReferentiels = async () => {
    const result = await getThemedSwal().fire({
      title: 'Initialiser les référentiels ?',
      text: "Cela va créer les Grades, Statuts, Profils et Barèmes par défaut.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, initialiser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'referentiels' })
        });
        getThemedSwal().fire('Succès', 'Référentiels et Barèmes initialisés.', 'success');
        fetch('/api/grades').then(res => res.json()).then(setGrades);
        fetch('/api/statuts').then(res => res.json()).then(setStatuts);
        fetch('/api/roles').then(res => res.json()).then(setUserRoles);
        fetch('/api/coefficients').then(res => res.json()).then(setCoefficients);
      } catch (error) {
        console.error("Error seeding referentiels:", error);
        getThemedSwal().fire('Erreur', 'Impossible d\'initialiser les référentiels.', 'error');
      }
    }
  };

  const seedCourses = async () => {
    const result = await getThemedSwal().fire({
      title: 'Initialiser les cours ?',
      text: "Cela va créer des cours de démonstration.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, initialiser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'courses' })
        });
        getThemedSwal().fire('Succès', `Cours créés.`, 'success');
        fetch('/api/courses').then(res => res.json()).then(setCours);
      } catch (error: any) {
        console.error(error);
        getThemedSwal().fire('Erreur', error.message || 'Impossible d\'initialiser les cours.', 'error');
      }
    }
  };

  const seedActivities = async () => {
    const result = await getThemedSwal().fire({
      title: 'Initialiser les activités ?',
      text: "Cela va créer des activités de démonstration pour les enseignants.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, initialiser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'activities' })
        });
        getThemedSwal().fire('Succès', 'Activités de démonstration créées.', 'success');
      } catch (error: any) {
        console.error(error);
        getThemedSwal().fire('Erreur', error.message || 'Impossible d\'initialiser les activités.', 'error');
      }
    }
  };

  const currentItems = activeTab === 'departements' 
    ? departements 
    : activeTab === 'filieres' 
      ? filieres 
      : activeTab === 'niveaux' 
        ? niveaux 
        : activeTab === 'annees'
          ? annees
          : activeTab === 'contrats'
            ? typesContrat
            : activeTab === 'grades'
              ? grades
              : activeTab === 'statuts'
                ? statuts
                : activeTab === 'roles'
                  ? userRoles
                  : activeTab === 'coefficients'
                    ? coefficients
                    : activeTab === 'semestres'
                      ? semestres
                      : [];

  const paginatedItems = currentItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const refactorUsers = async () => {
    const result = await getThemedSwal().fire({
      title: 'Refactoriser les utilisateurs ?',
      text: "Cette action va synchroniser les rôles, nettoyer les noms, supprimer les doublons et réinitialiser les permissions par défaut.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, refactoriser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/users/refactor', { method: 'POST' });
        getThemedSwal().fire('Succès', `Refactorisation terminée.`, 'success');
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Erreur lors de la refactorisation.', 'error');
      }
    }
  };

  const resetDatabase = async () => {
    const result = await getThemedSwal().fire({
      title: 'RÉINITIALISATION COMPLÈTE ?',
      text: "ATTENTION : Toutes les données (utilisateurs, cours, activités, etc.) seront supprimées et réinitialisées aux valeurs par défaut. Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'OUI, TOUT RÉINITIALISER',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/maintenance/reset', { method: 'POST' });
        getThemedSwal().fire('Succès', 'Base de données vidée.', 'success');
        setActiveTab('systeme');
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Erreur lors de la réinitialisation.', 'error');
      }
    }
  };

  const seedDatabase = async () => {
    const result = await getThemedSwal().fire({
      title: 'ALIMENTER AVEC DES DONNÉES FICTIVES ?',
      text: "Cela va vider l'ancienne base de données et insérer les cours, filières, enseignants et activités de démonstration UVCI de manière ordonnée.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#5A2D82',
      confirmButtonText: 'OUI, ALIMENTER LA BASE',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          getThemedSwal().fire('Succès', data.message || 'La base de données a été alimentée avec succès.', 'success');
          // Reload options
          window.location.reload();
        } else {
          getThemedSwal().fire('Erreur', data.error || 'Échec du seed.', 'error');
        }
      } catch (err: any) {
        getThemedSwal().fire('Erreur', 'Erreur de connexion lors du seed.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Paramètres du Système</h1>
          <p className="text-slate-500 dark:text-slate-400">Configurez les référentiels de base de l'application.</p>
        </div>
        {activeTab && ['departements', 'filieres', 'niveaux', 'annees', 'contrats', 'grades', 'statuts', 'coefficients', 'semestres'].includes(activeTab) && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-uvci-purple rounded-xl gap-2"
          >
            <Plus size={20} />
            Ajouter {
              activeTab === 'departements' ? 'un département' : 
              activeTab === 'filieres' ? 'une filière' : 
              activeTab === 'niveaux' ? 'un niveau' : 
              activeTab === 'annees' ? 'une année' :
              activeTab === 'contrats' ? 'un contrat' :
              activeTab === 'grades' ? 'un grade' :
              activeTab === 'statuts' ? 'un statut' :
              activeTab === 'coefficients' ? 'un barème' :
              activeTab === 'semestres' ? 'un semestre' :
              'un élément'
            }
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto flex-nowrap">
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'systeme' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('systeme')}
        >
          <Database size={18} />
          Système
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'departements' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('departements')}
        >
          <Building2 size={18} />
          Départements
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'filieres' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('filieres')}
        >
          <Layers size={18} />
          Filières
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'niveaux' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('niveaux')}
        >
          <Settings2 size={18} />
          Niveaux
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'annees' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('annees')}
        >
          <Calendar size={18} />
          Années
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'contrats' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('contrats')}
        >
          <Briefcase size={18} />
          Contrats
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'grades' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('grades')}
        >
          <GraduationCap size={18} />
          Grades
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'statuts' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('statuts')}
        >
          <UserCheck size={18} />
          Statuts
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'roles' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('roles')}
        >
          <ShieldCheck size={18} />
          Profils
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'coefficients' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('coefficients')}
        >
          <Percent size={18} />
          Barèmes
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'semestres' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('semestres')}
        >
          <Clock size={18} />
          Semestres
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'maintenance' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Database size={18} />
          Maintenance
        </button>
      </div>

      {/* Content Table */}
      {!activeTab ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 bg-white rounded-3xl shadow-sm border border-slate-100 text-center space-y-4"
        >
          <div className="w-20 h-20 bg-uvci-purple/10 rounded-full flex items-center justify-center mx-auto text-uvci-purple">
            <Settings2 size={40} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-black">Configuration du Système</h3>
            <p className="text-slate-500 mt-2">
              Veuillez sélectionner une catégorie pour configurer le système.
            </p>
          </div>
        </motion.div>
      ) : activeTab === 'systeme' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Layout className="text-uvci-purple" size={20} />
                Configuration Générale
              </h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label font-bold text-slate-700">Nom de l'application</label>
                  <input 
                    type="text" 
                    placeholder="Ex: GHE UVCI"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={appConfig.appName || ''}
                    onChange={(e) => setAppConfig({...appConfig, appName: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-slate-700">Année Académique par Défaut</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={appConfig.defaultAnneeId || ''}
                    onChange={(e) => setAppConfig({...appConfig, defaultAnneeId: e.target.value})}
                  >
                    <option value="">Sélectionner une année</option>
                    {annees.map(a => (
                      <option key={a.id} value={a.id}>{a.libelle}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-slate-700">Charge Horaire Annuelle (h)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 192"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={appConfig.chargeHoraireAnnuelle || ''}
                    onChange={(e) => setAppConfig({...appConfig, chargeHoraireAnnuelle: Number(e.target.value)})}
                  />
                  <label className="label">
                    <span className="label-text-alt text-slate-400 italic">Utilisée pour le calcul des heures complémentaires.</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label font-bold text-slate-700">Signature Numérique (Admin/Directeur)</label>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-32 h-20 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white flex items-center justify-center p-2 flex-shrink-0 relative group">
                      {(signaturePreview || appConfig.signatureUrl) ? (
                        <img 
                          src={signaturePreview || appConfig.signatureUrl} 
                          alt="Signature" 
                          className="max-w-full max-h-full object-contain" 
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1">
                          <ImageIcon size={24} />
                          <span className="text-[10px]">Aucune</span>
                        </div>
                      )}
                      {signaturePreview && (
                        <div className="absolute inset-0 bg-uvci-purple/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-uvci-purple bg-white px-2 py-1 rounded-full shadow-sm">Aperçu</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="file-input file-input-bordered file-input-sm w-full bg-white rounded-lg text-black"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSignatureFile(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setSignaturePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setSignaturePreview(null);
                          }
                        }}
                      />
                      <p className="text-[10px] text-slate-500 leading-tight">
                        PNG/JPG (fond transparent recommandé).<br/>
                        La signature sera apposée sur les documents officiels.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={saveAppConfig}
                  className={`btn btn-uvci-purple rounded-xl w-full gap-2 ${isUploadingSignature ? 'loading' : ''}`}
                  disabled={isUploadingSignature}
                >
                  {!isUploadingSignature && <Save size={20} />}
                  {isUploadingSignature ? 'Chargement...' : 'Sauvegarder la configuration'}
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Settings2 className="text-uvci-purple" size={20} />
                Préférences Système
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-black">Notifications</p>
                      <p className="text-xs text-slate-500">Activer les alertes système</p>
                    </div>
                  </div>
                  <button onClick={toggleNotifications} className="text-uvci-purple">
                    {notificationsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <Volume2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-black">Effets Sonores</p>
                      <p className="text-xs text-slate-500">Bip sonore sur les actions</p>
                    </div>
                  </div>
                  <button onClick={toggleSound} className="text-uvci-purple">
                    {soundEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-uvci-purple">
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-black">Mode Sombre</p>
                      <p className="text-xs text-slate-500">Activer le thème sombre</p>
                    </div>
                  </div>
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-uvci-purple">
                    {theme === 'dark' ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-black mb-2">Initialisation des Données</h3>
            <p className="text-slate-500 mb-6">
              Utilisez ces outils pour configurer rapidement votre environnement de démonstration.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple">
                    <Database size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Comptes par défaut</h4>
                    <p className="text-sm text-slate-500">Crée les profils Admin, Secrétaire et Enseignant.</p>
                  </div>
                </div>
                <button 
                  onClick={seedDefaultUsers}
                  className="btn btn-uvci-purple rounded-xl"
                >
                  Initialiser
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-uvci-green/10 flex items-center justify-center text-uvci-green">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Formations UVCI</h4>
                    <p className="text-sm text-slate-500">Initialise les filières et niveaux officiels.</p>
                  </div>
                </div>
                <button 
                  onClick={seedFormations}
                  className="btn btn-uvci-green text-white rounded-xl"
                >
                  Initialiser
                </button>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Référentiels de Base</h4>
                    <p className="text-sm text-slate-500">Initialise les Grades, Statuts et Profils.</p>
                  </div>
                </div>
                <button 
                  onClick={seedReferentiels}
                  className="btn btn-info text-white rounded-xl"
                >
                  Initialiser
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Cours & Activités</h4>
                    <p className="text-sm text-slate-500">Crée des exemples de cours et d'activités.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={seedCourses}
                    className="btn btn-warning text-white rounded-xl"
                  >
                    Cours
                  </button>
                  <button 
                    onClick={seedActivities}
                    className="btn btn-error text-white rounded-xl"
                  >
                    Activités
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'maintenance' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Maintenance des Données</h3>
              <p className="text-slate-500">Outils pour corriger les incohérences et optimiser la base de données.</p>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Refactoriser les Utilisateurs</h4>
                    <p className="text-sm text-slate-500">Synchronise les rôles et supprime les doublons.</p>
                  </div>
                </div>
                <button 
                  onClick={refactorUsers}
                  className="btn btn-info text-white rounded-xl"
                >
                  Exécuter
                </button>
              </div>

              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-uvci-purple">
                    <UserCheck size={24} stroke="#5A2D82" />
                  </div>
                  <div>
                    <h4 className="font-bold text-uvci-purple">Alimenter Données Fictives (Seed)</h4>
                    <p className="text-sm text-slate-500">Insère un jeu complet d'enseignants, cours, filières et séances.</p>
                  </div>
                </div>
                <button 
                  onClick={seedDatabase}
                  className="btn bg-uvci-purple hover:bg-uvci-purple/90 border-0 text-white rounded-xl"
                >
                  Alimenter
                </button>
              </div>

              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-600">Réinitialisation Totale</h4>
                    <p className="text-sm text-red-400">Efface tout et repart à zéro.</p>
                  </div>
                </div>
                <button 
                  onClick={resetDatabase}
                  className="btn btn-error text-white rounded-xl"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-black mb-4">Statistiques de la Base</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Utilisateurs</p>
                <p className="text-2xl font-bold text-uvci-purple">{users.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Départements</p>
                <p className="text-2xl font-bold text-uvci-purple">{departements.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Cours</p>
                <p className="text-2xl font-bold text-uvci-purple">{cours.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Filières</p>
                <p className="text-2xl font-bold text-uvci-purple">{filieres.length}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="table w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
              <th className="p-6">Libellé</th>
              {['departements', 'filieres', 'roles'].includes(activeTab as string) && <th>Code</th>}
              {activeTab === 'coefficients' && (
                <>
                  <th>Action</th>
                  <th>Complexité</th>
                  <th>Valeur</th>
                </>
              )}
              {activeTab === 'annees' && <th>Période</th>}
              {activeTab === 'annees' && <th>Statut</th>}
              <th className="text-right p-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                <td className="p-6 font-medium text-black">
                  {activeTab === 'coefficients' ? (item as Coefficient).description : (item as any).libelle}
                </td>
                {['departements', 'filieres', 'roles'].includes(activeTab as string) && (
                  <td className="font-mono text-slate-500">
                    {activeTab === 'roles' ? (item as UserRole).code : (item as any).code}
                  </td>
                )}
                {activeTab === 'coefficients' && (
                  <>
                    <td>
                      <span className={`badge ${(item as Coefficient).type_action === 'Conception' ? 'badge-primary' : 'badge-secondary'} badge-sm font-bold`}>
                        {(item as Coefficient).type_action}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-700">{(item as Coefficient).niveau_complexite}</span>
                    </td>
                    <td className="font-mono text-uvci-purple font-bold">{(item as Coefficient).valeur}</td>
                  </>
                )}
                {activeTab === 'annees' && (
                  <td className="text-sm text-slate-500">
                    {formatDate((item as AnneeAcademique).date_debut)} - {formatDate((item as AnneeAcademique).date_fin)}
                  </td>
                )}
                {activeTab === 'annees' && (
                  <td>
                    <button 
                      onClick={() => toggleAnneeStatus(item as AnneeAcademique)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        (item as AnneeAcademique).actif 
                          ? 'bg-uvci-green/10 text-uvci-green' 
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {(item as AnneeAcademique).actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      {(item as AnneeAcademique).actif ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                )}
                <td className="text-right p-6 space-x-2">
                  <button 
                    onClick={() => handleOpenModal(item)}
                    className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                  Aucun élément trouvé dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {paginatedItems.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination 
              currentPage={currentPage}
              totalItems={currentItems.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box rounded-3xl p-8 bg-white">
          <h3 className="text-2xl font-display font-bold text-uvci-purple mb-6">
            {editingItem ? 'Modifier' : 'Ajouter'} {
              activeTab === 'departements' ? 'un département' : 
              activeTab === 'filieres' ? 'une filière' : 
              activeTab === 'niveaux' ? 'un niveau' : 
              activeTab === 'annees' ? 'une année académique' :
              activeTab === 'contrats' ? 'un type de contrat' :
              activeTab === 'grades' ? 'un grade' :
              activeTab === 'statuts' ? 'un statut' :
              activeTab === 'coefficients' ? 'un barème' :
              activeTab === 'semestres' ? 'un semestre' :
              'un profil'
            }
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label font-bold text-slate-700">
                {activeTab === 'coefficients' ? 'Description' : 'Libellé'}
              </label>
              <input 
                type="text" 
                placeholder={
                  activeTab === 'coefficients' ? "Ex: Contenus simples + quizz" : 
                  activeTab === 'niveaux' ? "Ex: Licence 1, Master 1" : 
                  activeTab === 'annees' ? "Ex: 2025-2026" :
                  activeTab === 'contrats' ? "Ex: CDI, CDD" :
                  activeTab === 'grades' ? "Ex: Assistant, Maître-Assistant" :
                  activeTab === 'statuts' ? "Ex: Permanent, Vacataire" :
                  activeTab === 'roles' ? "Ex: Administrateur, Enseignant" :
                  activeTab === 'semestres' ? "Ex: Semestre 1" :
                  activeTab === 'departements' ? "Ex: Informatique et Sciences du Numérique" :
                  activeTab === 'filieres' ? "Ex: DAS, RSI" :
                  "Ex: Libellé"
                }
                className="input input-bordered bg-slate-50 rounded-xl text-black"
                value={activeTab === 'coefficients' ? (formData.description || '') : (formData.libelle || '')}
                onChange={(e) => setFormData({...formData, [activeTab === 'coefficients' ? 'description' : 'libelle']: e.target.value})}
                required
              />
            </div>
            {activeTab === 'coefficients' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label font-bold text-slate-700">Type d'Action</label>
                    <select 
                      className="select select-bordered bg-slate-50 rounded-xl text-black"
                      value={formData.type_action || 'Conception'}
                      onChange={(e) => setFormData({...formData, type_action: e.target.value})}
                      required
                    >
                      <option value="Conception">Conception</option>
                      <option value="MAJ">MAJ</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-slate-700">Niveau de Complexité</label>
                    <select 
                      className="select select-bordered bg-slate-50 rounded-xl text-black"
                      value={formData.niveau_complexite || 'N1'}
                      onChange={(e) => setFormData({...formData, niveau_complexite: e.target.value})}
                      required
                    >
                      <option value="N1">N1</option>
                      <option value="N2">N2</option>
                      <option value="N3">N3</option>
                    </select>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-slate-700">Valeur (Coefficient)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    placeholder="Ex: 0.4"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.valeur || ''}
                    onChange={(e) => setFormData({...formData, valeur: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </>
            )}
            {['departements', 'filieres', 'roles'].includes(activeTab as string) && (
              <div className="form-control">
                <label className="label font-bold text-slate-700">
                  {activeTab === 'roles' ? 'Code (admin, secretaire, enseignant)' : 'Code'}
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: ISN"
                  className="input input-bordered bg-slate-50 rounded-xl font-mono text-black"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
            )}
            {activeTab === 'annees' && (
              <>
                <div className="form-control">
                  <label className="label font-bold text-slate-700">Date de début</label>
                  <input 
                    type="date" 
                    className="input input-bordered bg-slate-50 rounded-xl"
                    value={formData.date_debut || ''}
                    onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-slate-700">Date de fin</label>
                  <input 
                    type="date" 
                    className="input input-bordered bg-slate-50 rounded-xl"
                    value={formData.date_fin || ''}
                    onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                    required
                  />
                </div>
              </>
            )}
            <div className="modal-action gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost rounded-xl">Annuler</button>
              <button type="submit" className="btn btn-uvci-purple rounded-xl px-8 gap-2">
                <Save size={20} />
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}
