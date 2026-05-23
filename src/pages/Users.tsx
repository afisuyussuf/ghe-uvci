import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Building2,
  ShieldCheck,
  Check,
  X,
  Lock,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Download,
  FileText,
  Table as TableIcon,
  Filter,
  Users as UsersIcon,
  Key,
  Eye,
  EyeOff,
  Layout as LayoutIcon
} from 'lucide-react';
import { UserProfile, Departement, Contrat, Role, UserRole } from '../types';
import { logAction } from '../lib/audit';
import { useAuth } from '../hooks/useAuth';
import Pagination from '../components/Pagination';
import { getThemedSwal } from '../lib/swal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addLogoToDoc } from '../lib/pdfLogo';
import * as XLSX from 'xlsx';

const menuItems = [
  { path: '/', label: 'Tableau de bord' },
  { path: '/enseignants', label: 'Enseignants' },
  { path: '/cours', label: 'Cours' },
  { path: '/activites', label: 'Activités' },
  { path: '/etats', label: 'États d\'heures' },
  { path: '/paiements', label: 'Paiements' },
  { path: '/historique', label: 'Historique' },
  { path: '/utilisateurs', label: 'Utilisateurs' },
  { path: '/parametres', label: 'Paramètres' },
  { path: '/guide', label: 'Guide d\'utilisateurs' },
];

type PageTab = 'list' | 'permissions';

export default function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  
  const [activeTab, setActiveTab] = useState<PageTab>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    actif: true,
    role: 'enseignant',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    id_departement: '',
    id_contrat: '',
    grade: '',
    statut: 'Vacataire'
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Permissions state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role>('enseignant');

  const [selectedUserForDocs, setSelectedUserForDocs] = useState<UserProfile | null>(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [userDocs, setUserDocs] = useState<any[]>([]);

  const fetchUserDocs = async (userId: string) => {
    try {
      const res = await fetch(`/api/documents/${userId}`);
      const data = await res.json();
      setUserDocs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenDocsModal = (user: UserProfile) => {
    setSelectedUserForDocs(user);
    setIsDocsModalOpen(true);
    fetchUserDocs(user.id);
  };

  const handleUploadDoc = async (type: string) => {
    if (!selectedUserForDocs) return;
    const { value: file } = await getThemedSwal().fire({
      title: `Uploader un ${type}`,
      input: 'file',
      inputAttributes: {
        'accept': 'application/pdf,image/*',
        'aria-label': 'Choisir le document'
      },
      showCancelButton: true,
      cancelButtonText: 'Annuler'
    });

    if (file) {
      try {
        await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_user: selectedUserForDocs.id,
            nom: (file as any).name || `Document_${type}`,
            type: type,
            file_url: 'https://example.com/mock-doc.pdf'
          })
        });
        getThemedSwal().fire('Succès', 'Document ajouté.', 'success');
        fetchUserDocs(selectedUserForDocs.id);
      } catch (err) {
        getThemedSwal().fire('Erreur', 'Echec de l\'upload.', 'error');
      }
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    const result = await getThemedSwal().fire({
      title: 'Supprimer ce document ?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (selectedUserForDocs) fetchUserDocs(selectedUserForDocs.id);
    }
  };

  useEffect(() => {
    const roles_list: Role[] = ['admin', 'secretaire', 'enseignant'];
    const fetchAllPerms = async () => {
      const perms: Record<string, string[]> = {};
      for (const r of roles_list) {
        try {
          const res = await fetch(`/api/permissions/${r}`);
          const data = await res.json();
          perms[r] = data.visible_paths || [];
        } catch (e) {}
      }
      setRolePermissions(perms);
    };
    fetchAllPerms();
  }, []);

  const handleToggleMenuPerm = async (role: string, path: string) => {
    const currentPerms = rolePermissions[role] || [];
    let newPerms;
    if (currentPerms.includes(path)) {
      newPerms = currentPerms.filter(p => p !== path);
    } else {
      newPerms = [...currentPerms, path];
    }

    try {
      await fetch(`/api/permissions/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible_paths: newPerms })
      });
      setRolePermissions(prev => ({ ...prev, [role]: newPerms }));
    } catch (error) {
      console.error(error);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'admin' && profile.role !== 'secretaire') return;

    const fetchData = async () => {
      fetch('/api/users').then(res => res.json()).then(setUsers);
      fetch('/api/departements').then(res => res.json()).then(setDepartements);
      fetch('/api/contrats').then(res => res.json()).then(setContrats);
      fetch('/api/roles').then(res => res.json()).then(setRoles);
    };

    fetchData();
  }, [profile]);

  const handleOpenModal = (user: UserProfile | null = null) => {
    setEditingUser(user);
    setFormData(user || { actif: true, role: 'enseignant' });
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let photo_url = formData.photo_url || '';

      if (photoFile) {
        try {
          photo_url = await convertToBase64(photoFile);
        } catch (err) {
          console.error("Base64 representation failure:", err);
          photo_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nom}`;
        }
      }

      const finalData = { ...formData, photo_url };

      if (editingUser) {
        await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });
        await logAction('UPDATE_USER', `Utilisateur mis à jour: ${finalData.prenom} ${finalData.nom} (${finalData.role})`, editingUser.id);
        getThemedSwal().fire('Succès', 'Utilisateur mis à jour.', 'success');
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...finalData } : u));
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });
        const data = await res.json();
        await logAction('CREATE_USER', `Nouvel utilisateur créé: ${finalData.prenom} ${finalData.nom} (${finalData.role})`, data.id);
        getThemedSwal().fire('Succès', 'Nouvel utilisateur ajouté.', 'success');
        setUsers(prev => [...prev, data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await getThemedSwal().fire({
      title: 'Supprimer ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const userToDelete = users.find(u => u.id === id);
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        await logAction('DELETE_USER', `Utilisateur supprimé: ${userToDelete?.prenom} ${userToDelete?.nom} (${userToDelete?.email})`, id);
        getThemedSwal().fire('Supprimé', 'L\'utilisateur a été supprimé.', 'success');
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add Logo
      await addLogoToDoc(doc, 14, 8, 15, 15);
      
      // Add Title
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text('Liste des Utilisateurs UVCI', 35, 18);
      
      // Add Date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 35, 25);
      
      const tableData = filteredUsers.map(u => [
        `${u.nom} ${u.prenom}`,
        u.email,
        u.role,
        departements.find(d => d.id === u.id_departement)?.libelle || 'N/A',
        u.actif ? 'Actif' : 'Inactif'
      ]);

      autoTable(doc, {
        head: [['Nom & Prénom', 'Email', 'Rôle', 'Département', 'Statut']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [106, 27, 154], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 35 }
      });

      doc.save('utilisateurs_uvci.pdf');
      getThemedSwal().fire({
        title: 'Succès',
        text: 'Le fichier PDF a été généré avec succès.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      getThemedSwal().fire('Erreur', 'Impossible de générer le PDF.', 'error');
    }
  };

  const exportExcel = () => {
    const data = filteredUsers.map(u => ({
      Nom: u.nom,
      Prenom: u.prenom,
      Email: u.email,
      Role: u.role,
      Departement: departements.find(d => d.id === u.id_departement)?.libelle,
      Contrat: contrats.find(c => c.id === u.id_contrat)?.libelle,
      Taux_Horaire: u.taux_horaire,
      Actif: u.actif ? 'Oui' : 'Non'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    XLSX.writeFile(wb, 'utilisateurs_uvci.xlsx');
  };

  const filteredUsers = users.filter(u => {
    const nom = u.nom || '';
    const prenom = u.prenom || '';
    const email = u.email || '';
    
    const matchesSearch = nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = !filterDept || u.id_departement === filterDept;
    const matchesRole = !filterRole || u.role === filterRole;

    return matchesSearch && matchesDept && matchesRole;
  });

  const totalItems = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      getThemedSwal().fire('Succès', 'Rôle mis à jour.', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-black">Gestion des Utilisateurs</h1>
          <p className="text-slate-500">Gérez les profils des enseignants, secrétaires et administrateurs.</p>
        </div>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-outline rounded-xl gap-2 border-slate-200 text-black">
              <Download size={20} />
              Exporter
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-2xl w-52 border border-slate-100 mt-2">
              <li><button onClick={exportPDF} className="gap-2"><FileText size={18} className="text-red-500" /> Format PDF</button></li>
              <li><button onClick={exportExcel} className="gap-2"><TableIcon size={18} className="text-green-600" /> Format Excel</button></li>
            </ul>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-uvci-purple rounded-xl gap-2 shadow-lg shadow-uvci-purple/20"
          >
            <UserPlus size={20} />
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white p-2 rounded-2xl shadow-sm border border-slate-100 inline-flex">
        <button 
          className={`tab gap-2 rounded-xl transition-all ${activeTab === 'list' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('list')}
        >
          <UsersIcon size={18} />
          Liste des Utilisateurs
        </button>
        <button 
          className={`tab gap-2 rounded-xl transition-all ${activeTab === 'permissions' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Key size={18} />
          Gestion des Permissions
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Search & Filters */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher un utilisateur (Nom, Email...)" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-uvci-purple text-sm text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-uvci-purple' : 'text-slate-400'}`}
                >
                  <List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-uvci-purple' : 'text-slate-400'}`}
                >
                  <LayoutGrid size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase">Filtres :</span>
              </div>
              <select 
                className="select select-sm select-bordered rounded-xl bg-slate-50 text-black border-slate-200"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="">Tous les départements</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.libelle}</option>)}
              </select>
              <select 
                className="select select-sm select-bordered rounded-xl bg-slate-50 text-black border-slate-200"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="secretaire">Secrétaire</option>
                <option value="enseignant">Enseignant</option>
              </select>
              {(filterDept || filterRole || searchTerm) && (
                <button 
                  onClick={() => {
                    setFilterDept('');
                    setFilterRole('');
                    setSearchTerm('');
                  }}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Users Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple font-bold text-xl overflow-hidden">
                        {user.photo_url ? (
                          <img 
                            src={user.photo_url} 
                            alt={user.nom} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                              e.currentTarget.parentElement!.innerHTML = `${user.nom[0]}${user.prenom[0]}`;
                            }}
                          />
                        ) : (
                          `${user.nom[0]}${user.prenom[0]}`
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-black">{user.prenom} {user.nom}</h3>
                        <span className={`badge badge-sm font-bold ${
                          user.role === 'admin' ? 'badge-error text-white' : 
                          user.role === 'secretaire' ? 'badge-warning text-white' : 'badge-primary text-white'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenDocsModal(user)}
                        className="btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-uvci-purple"
                        title="Documents"
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-uvci-purple"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-black">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      {user.email}
                    </div>
                    {user.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        {user.telephone}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      {departements.find(d => d.id === user.id_departement)?.libelle || 'Aucun département'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-slate-400" />
                      {contrats.find(c => c.id === user.id_contrat)?.libelle || 'Aucun contrat'}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.actif ? 'bg-uvci-green' : 'bg-red-500'}`} />
                      <span className="text-xs font-bold text-slate-400 uppercase">{user.actif ? 'Actif' : 'Inactif'}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Taux: <span className="font-bold text-uvci-purple">{user.taux_horaire || 0} FCFA/h</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="table w-full">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <th className="p-6">Utilisateur</th>
                    <th>Rôle</th>
                    <th>Département</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th className="text-right p-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-uvci-purple/5 transition-colors border-b border-slate-50 last:border-0">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple font-bold overflow-hidden">
                            {user.photo_url ? (
                              <img src={user.photo_url} className="w-full h-full object-cover" />
                            ) : (
                              `${user.nom[0]}${user.prenom[0]}`
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-black">{user.prenom} {user.nom}</p>
                            <p className="text-xs text-slate-500">{user.telephone || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm font-bold ${
                          user.role === 'admin' ? 'badge-error text-white' : 
                          user.role === 'secretaire' ? 'badge-warning text-white' : 'badge-primary text-white'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="text-sm text-black">
                        {departements.find(d => d.id === user.id_departement)?.code || 'N/A'}
                      </td>
                      <td className="text-sm text-black">{user.email}</td>
                      <td>
                        <span className={`badge badge-sm font-bold ${user.actif ? 'badge-success text-white' : 'badge-error text-white'}`}>
                          {user.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="text-right p-6 space-x-2">
                        <button 
                          onClick={() => handleOpenDocsModal(user)}
                          className="btn btn-ghost btn-sm text-uvci-purple hover:bg-purple-50 rounded-lg"
                          title="Documents"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
            <Pagination 
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Selection */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-fit">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-black flex items-center gap-2">
                <UsersIcon size={18} className="text-uvci-purple" />
                Sélectionner un utilisateur
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                    selectedUserId === user.id ? 'bg-uvci-purple/5 border-l-4 border-l-uvci-purple' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple font-bold">
                    {user.nom[0]}{user.prenom[0]}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-sm ${selectedUserId === user.id ? 'text-uvci-purple' : 'text-black'}`}>
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Management */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-bold text-black">Visibilité du Menu par Rôle</h3>
                <p className="text-xs text-slate-500">Définissez quels modules sont visibles pour chaque type d'utilisateur.</p>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                  {roles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoleForPerms(r.code)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedRoleForPerms === r.code 
                          ? 'bg-white text-uvci-purple shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {r.libelle}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menuItems.map(item => {
                    const isVisible = rolePermissions[selectedRoleForPerms]?.includes(item.path);
                    return (
                      <label 
                        key={item.path}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isVisible ? 'border-uvci-purple bg-uvci-purple/5' : 'border-slate-50 hover:border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isVisible ? 'bg-uvci-purple text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </div>
                          <span className={`text-sm font-bold ${isVisible ? 'text-uvci-purple' : 'text-slate-600'}`}>
                            {item.label}
                          </span>
                        </div>
                        <input 
                          type="checkbox" 
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={isVisible}
                          onChange={() => handleToggleMenuPerm(selectedRoleForPerms, item.path)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {selectedUserId ? (
                <>
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-black">Rôle de l'Utilisateur</h3>
                      <p className="text-xs text-slate-500">Modifiez le rôle de l'utilisateur sélectionné.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-uvci-green/10 flex items-center justify-center text-uvci-green font-bold">
                        {users.find(u => u.id === selectedUserId)?.nom[0]}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-black">
                          {users.find(u => u.id === selectedUserId)?.prenom} {users.find(u => u.id === selectedUserId)?.nom}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">ID: {selectedUserId.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roles.map(role => (
                        <div 
                          key={role.id}
                          onClick={() => handleUpdateRole(selectedUserId, role.code)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            users.find(u => u.id === selectedUserId)?.role === role.code
                              ? 'border-uvci-purple bg-uvci-purple/5'
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              users.find(u => u.id === selectedUserId)?.role === role.code
                                ? 'bg-uvci-purple text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              <ShieldCheck size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-black">{role.libelle}</p>
                              <p className="text-xs text-slate-500">Code: {role.code}</p>
                            </div>
                          </div>
                          {users.find(u => u.id === selectedUserId)?.role === role.code && (
                            <div className="w-6 h-6 rounded-full bg-uvci-purple flex items-center justify-center text-white">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <UsersIcon size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">Aucun utilisateur sélectionné</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                      Veuillez choisir un utilisateur dans la liste de gauche pour gérer son rôle.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl rounded-3xl p-8 bg-white">
          <h3 className="text-2xl font-display font-bold text-uvci-purple mb-6">
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label font-bold text-black">Nom</label>
              <input 
                type="text" 
                placeholder="Ex: KONAN"
                className="input input-bordered bg-slate-50 rounded-xl text-black"
                value={formData.nom || ''}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                required
              />
            </div>
            <div className="form-control">
              <label className="label font-bold text-black">Prénom</label>
              <input 
                type="text" 
                placeholder="Ex: Koffi"
                className="input input-bordered bg-slate-50 rounded-xl text-black"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                required
              />
            </div>
            <div className="form-control">
              <label className="label font-bold text-black">Email</label>
              <input 
                type="email" 
                placeholder="Ex: koffi.konan@uvci.edu.ci"
                className="input input-bordered bg-slate-50 rounded-xl text-black"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-control">
              <label className="label font-bold text-black">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  placeholder="Ex: +225 0707070707"
                  className="input input-bordered w-full pl-10 bg-slate-50 rounded-xl text-black"
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label font-bold text-black">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Définir un mot de passe"
                  className="input input-bordered w-full pl-10 bg-slate-50 rounded-xl text-black"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="form-control md:col-span-2">
              <label className="label font-bold text-black">Photo de profil</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                  {photoFile ? (
                    <img src={URL.createObjectURL(photoFile)} className="w-full h-full object-cover" />
                  ) : formData.photo_url ? (
                    <img src={formData.photo_url} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="file-input file-input-bordered w-full bg-slate-50 rounded-xl text-black"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Format: JPG, PNG. Max 2MB.</p>
                </div>
              </div>
            </div>
            <div className="form-control">
              <label className="label font-bold text-black">Rôle</label>
              <select 
                className="select select-bordered bg-slate-50 rounded-xl text-black"
                value={formData.role || ''}
                onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
              >
                {roles.map(r => <option key={r.id} value={r.code}>{r.libelle}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label font-bold text-black">Département</label>
              <select 
                className="select select-bordered bg-slate-50 rounded-xl text-black"
                value={formData.id_departement || ''}
                onChange={(e) => setFormData({...formData, id_departement: e.target.value})}
              >
                <option value="">Sélectionner un département</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.libelle}</option>)}
              </select>
            </div>
            
            {formData.role === 'enseignant' && (
              <>
                <div className="form-control">
                  <label className="label font-bold text-black">Grade</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un grade</option>
                    <option value="Assistant">Assistant</option>
                    <option value="Maître-Assistant">Maître-Assistant</option>
                    <option value="Professeur">Professeur</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Statut Enseignant</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.statut || 'Vacataire'}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    required
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Vacataire">Vacataire</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Type de Contrat</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.id_contrat || ''}
                    onChange={(e) => setFormData({...formData, id_contrat: e.target.value})}
                  >
                    <option value="">Sélectionner un contrat (Optionnel)</option>
                    {contrats.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Taux Horaire (FCFA)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 5000"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.taux_horaire || ''}
                    onChange={(e) => setFormData({...formData, taux_horaire: Number(e.target.value)})}
                    required
                  />
                </div>
              </>
            )}
            <div className="form-control flex flex-row items-center gap-4 mt-8">
              <input 
                type="checkbox" 
                className="checkbox checkbox-primary"
                checked={!!formData.actif}
                onChange={(e) => setFormData({...formData, actif: e.target.checked})}
              />
              <span className="font-bold text-black">Compte Actif</span>
            </div>

            <div className="col-span-1 md:col-span-2 modal-action gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost rounded-xl">Annuler</button>
              <button 
                type="submit" 
                className={`btn btn-uvci-purple rounded-xl px-8 gap-2 ${isUploading ? 'loading' : ''}`}
                disabled={isUploading}
              >
                {!isUploading && <Save size={20} />}
                {isUploading ? 'Chargement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* User Documents Modal */}
      <dialog className={`modal ${isDocsModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/22 max-w-4xl bg-white rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-2xl text-black">Documents de l'enseignant</h3>
              <p className="text-slate-500">{selectedUserForDocs?.prenom} {selectedUserForDocs?.nom}</p>
            </div>
            <button onClick={() => setIsDocsModalOpen(false)} className="btn btn-ghost btn-circle">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 uppercase p-2 border-l-4 border-uvci-purple">Ajouter un document</h4>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleUploadDoc('Contrat')}
                  className="btn btn-outline border-slate-200 text-slate-700 rounded-xl justify-start gap-3 hover:bg-slate-50"
                >
                  <FileText className="text-blue-500" size={20} />
                  Déposer un Contrat
                </button>
                <button 
                  onClick={() => handleUploadDoc('Bulletin de Paie')}
                  className="btn btn-outline border-slate-200 text-slate-700 rounded-xl justify-start gap-3 hover:bg-slate-50"
                >
                  <FileText className="text-green-500" size={20} />
                  Déposer un Bulletin de Paie
                </button>
                <button 
                  onClick={() => handleUploadDoc('Autre')}
                  className="btn btn-outline border-slate-200 text-slate-700 rounded-xl justify-start gap-3 hover:bg-slate-50"
                >
                  <Plus className="text-slate-400" size={20} />
                  Autre document
                </button>
              </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 uppercase p-2 border-l-4 border-uvci-green">Documents existants</h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {userDocs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Aucun document déposé.
                  </div>
                ) : (
                  userDocs.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.type === 'Bulletin de Paie' ? 'bg-green-100 text-green-600' :
                          doc.type === 'Contrat' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-uvci-purple'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-black truncate" title={doc.nom}>{doc.nom}</p>
                          <p className="text-[10px] text-slate-500">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs text-slate-400 hover:text-uvci-purple">
                          <Download size={14} />
                        </a>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn-ghost btn-xs text-slate-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
