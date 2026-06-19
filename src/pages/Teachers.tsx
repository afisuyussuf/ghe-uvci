import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  UserPlus,
  Eye,
  File,
  Mail,
  Phone,
  Briefcase,
  Building2,
  GraduationCap,
  DollarSign,
  Filter,
  Download,
  Lock,
  Image as ImageIcon,
  LayoutGrid,
  List,
  FileText,
  Table as TableIcon,
  X,
  AlertCircle,
  Info,
  CalendarDays,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { UserProfile, Departement, Contrat, Grade } from '../types';
import { getThemedSwal } from '../lib/swal';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addLogoToDoc } from '../lib/pdfLogo';
import * as XLSX from 'xlsx';

export default function Teachers() {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<UserProfile | null>(null);
  const [viewTab, setViewTab] = useState<'info' | 'disponibilites'>('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterDept, setFilterDept] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    actif: true,
    role: 'enseignant',
    id_profil: 'enseignant',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    id_departement: '',
    id_contrat: '',
    grade: '',
    taux_horaire: 0
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [teacherAvailability, setTeacherAvailability] = useState<any[]>([]);

  useEffect(() => {
    if (viewingTeacher?.id) {
      fetch(`/api/disponibilites?userId=${viewingTeacher.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTeacherAvailability(data);
          } else {
            setTeacherAvailability([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch teacher availability:", err);
          setTeacherAvailability([]);
        });
    } else {
      setTeacherAvailability([]);
    }
  }, [viewingTeacher]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'admin' && profile.role !== 'secretaire') return;

    const fetchData = async () => {
      try {
        const [uRes, dRes, cRes, gRes] = await Promise.all([
          fetch('/api/users?role=enseignant'),
          fetch('/api/departements'),
          fetch('/api/contrats'),
          fetch('/api/grades')
        ]);
        
        setTeachers(await uRes.json());
        setDepartements(await dRes.json());
        setContrats(await cRes.json());
        setGrades(await gRes.json());
      } catch (err) {
        console.error("Failed to fetch teachers data:", err);
      }
    };

    fetchData();
  }, [profile]);

  const handleOpenModal = (teacher: UserProfile | null = null) => {
    setEditingTeacher(teacher);
    setFormData(teacher || { actif: true, role: 'enseignant', id_profil: 'enseignant' });
    setPhotoFile(null);
    setContractFile(null);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (teacher: UserProfile) => {
    setViewingTeacher(teacher);
    setViewTab('info');
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const method = editingTeacher ? 'PUT' : 'POST';
      const url = editingTeacher ? `/api/users/${editingTeacher.id}` : '/api/users';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        getThemedSwal().fire('Succès', editingTeacher ? 'Profil mis à jour.' : 'Nouvel enseignant ajouté.', 'success');
        setIsModalOpen(false);
        // Refresh list
        fetch('/api/users?role=enseignant').then(r => r.json()).then(setTeachers);
      }
    } catch (error) {
      console.error(error);
      getThemedSwal().fire('Erreur', 'Impossible d\'enregistrer les données.', 'error');
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
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          getThemedSwal().fire('Supprimé', 'L\'enseignant a été supprimé.', 'success');
          setTeachers(teachers.filter(t => t.id !== id));
        }
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Impossible de supprimer.', 'error');
      }
    }
  };

  const generateIndividualSheet = async (teacher: UserProfile) => {
    try {
      const pdfDoc = new jsPDF();
      
      // Add Logo
      await addLogoToDoc(pdfDoc, 14, 8, 15, 15);
      
      // Header
      pdfDoc.setFontSize(20);
      pdfDoc.setTextColor(106, 27, 154);
      pdfDoc.text('FICHE INDIVIDUELLE ENSEIGNANT', 105, 18, { align: 'center' });
      
      pdfDoc.setDrawColor(106, 27, 154);
      pdfDoc.setLineWidth(0.5);
      pdfDoc.line(20, 25, 190, 25);

      // Teacher Info
      pdfDoc.setFontSize(12);
      pdfDoc.setTextColor(0);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Informations Personnelles', 20, 40);
      
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(`Nom & Prénom: ${teacher.nom} ${teacher.prenom}`, 20, 50);
      pdfDoc.text(`Email: ${teacher.email}`, 20, 57);
      pdfDoc.text(`Téléphone: ${teacher.telephone || 'N/A'}`, 20, 64);
      pdfDoc.text(`Grade: ${teacher.grade || 'N/A'}`, 20, 71);
      pdfDoc.text(`Département: ${departements.find(d => d.id === teacher.id_departement)?.libelle || 'N/A'}`, 20, 78);
      pdfDoc.text(`Taux Horaire: ${teacher.taux_horaire?.toLocaleString() || '0'} CFA/h`, 20, 85);

      // Fetch Activities from API
      const res = await fetch(`/api/activities?userId=${teacher.id}`);
      const activities = await res.json();

      // Activities Table
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Récapitulatif des Activités', 20, 100);
      
      const tableData = (activities || []).map((a: any) => [
        a.date_saisie,
        a.type_action,
        a.nb_sequences || 0,
        `${a.volume_horaire}h`,
        `${a.montant?.toLocaleString()} CFA`
      ]);

      autoTable(pdfDoc, {
        head: [['Date', 'Type', 'Séquences', 'Volume', 'Montant']],
        body: tableData,
        startY: 105,
        theme: 'striped',
        headStyles: { fillColor: [106, 27, 154] }
      });

      // Summary
      const finalY = ((pdfDoc as any).lastAutoTable && (pdfDoc as any).lastAutoTable.cursor && typeof (pdfDoc as any).lastAutoTable.cursor.y === 'number') 
        ? (pdfDoc as any).lastAutoTable.cursor.y + 20 
        : 150;
      const totalHours = (activities || []).reduce((sum: number, a: any) => sum + (a.volume_horaire || 0), 0);
      const totalAmount = (activities || []).reduce((sum: number, a: any) => sum + (a.montant || 0), 0);

      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('BILAN GLOBAL', 20, finalY);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(`Total Heures Validées: ${totalHours}h`, 20, finalY + 10);
      pdfDoc.text(`Montant Total à Percevoir: ${totalAmount.toLocaleString()} CFA`, 20, finalY + 17);

      pdfDoc.save(`Fiche_${teacher.nom}_${teacher.prenom}.pdf`);
      getThemedSwal().fire('Succès', 'Fiche individuelle générée.', 'success');
    } catch (error) {
      console.error(error);
      getThemedSwal().fire('Erreur', 'Impossible de générer la fiche.', 'error');
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add Logo
      await addLogoToDoc(doc, 14, 8, 15, 15);
      
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text('Liste des Enseignants - UVCI', 35, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 35, 25);
      
      const tableData = filteredTeachers.map(t => [
        `${t.nom || ''} ${t.prenom || ''}`,
        t.email || '',
        t.grade || 'N/A',
        departements.find(d => d.id === t.id_departement)?.libelle || 'N/A',
        (t.taux_horaire || 0).toLocaleString()
      ]);

      autoTable(doc, {
        head: [['Nom & Prénom', 'Email', 'Grade', 'Département', 'Taux (FCFA)']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [102, 51, 153] } // UVCI Purple
      });

      doc.save('enseignants_uvci.pdf');
      getThemedSwal().fire('Succès', 'Le fichier PDF a été généré.', 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      getThemedSwal().fire('Erreur', 'Impossible de générer le PDF. Vérifiez que toutes les données sont valides.', 'error');
    }
  };

  const exportExcel = () => {
    const data = filteredTeachers.map(t => ({
      Nom: t.nom,
      Prenom: t.prenom,
      Email: t.email,
      Grade: t.grade,
      Departement: departements.find(d => d.id === t.id_departement)?.libelle,
      Contrat: contrats.find(c => c.id === t.id_contrat)?.libelle,
      Taux_Horaire: t.taux_horaire,
      Actif: t.actif ? 'Oui' : 'Non'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enseignants');
    XLSX.writeFile(wb, 'enseignants_uvci.xlsx');
  };

  const filteredTeachers = teachers.filter(t => {
    const nom = t.nom || '';
    const prenom = t.prenom || '';
    const email = t.email || '';
    
    const matchesSearch = nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = !filterDept || t.id_departement === filterDept;
    const matchesGrade = !filterGrade || t.grade === filterGrade;

    return matchesSearch && matchesDept && matchesGrade;
  });

  const totalItems = filteredTeachers.length;
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-black">Gestion des Enseignants</h1>
          <p className="text-slate-500">Consultez et gérez les profils académiques et contractuels.</p>
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
          {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
            <button 
              onClick={() => handleOpenModal()}
              className="btn btn-uvci-purple rounded-xl gap-2 shadow-lg shadow-uvci-purple/20"
            >
              <UserPlus size={20} />
              Nouvel Enseignant
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un enseignant (Nom, Email...)" 
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
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
          >
            <option value="">Tous les grades</option>
            {grades.map(g => <option key={g.id} value={g.libelle}>{g.libelle}</option>)}
          </select>
          {(filterDept || filterGrade || searchTerm) && (
            <button 
              onClick={() => {
                setFilterDept('');
                setFilterGrade('');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Teachers Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTeachers.map((teacher) => (
            <motion.div
              key={teacher.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
            >
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rotate-45 flex items-end justify-center pb-2 ${teacher.actif ? 'bg-uvci-green' : 'bg-red-500'}`}>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{teacher.actif ? 'Actif' : 'Inactif'}</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple font-bold text-2xl overflow-hidden">
                  {teacher.photo_url ? (
                    <img 
                      src={teacher.photo_url} 
                      alt={teacher.nom} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.parentElement!.innerHTML = `${teacher.nom[0]}${teacher.prenom[0]}`;
                      }}
                    />
                  ) : (
                    `${teacher.nom[0]}${teacher.prenom[0]}`
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg">{teacher.prenom} {teacher.nom}</h3>
                  <div className="flex items-center gap-2 text-uvci-purple font-medium text-sm">
                    <GraduationCap size={14} />
                    {teacher.grade || 'Grade non défini'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Département</p>
                    <div className="flex items-center gap-2 text-sm text-black font-medium">
                      <Building2 size={14} className="text-slate-400" />
                      {departements.find(d => d.id === teacher.id_departement)?.code || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contrat</p>
                    <div className="flex items-center gap-2 text-sm text-black font-medium">
                      <Briefcase size={14} className="text-slate-400" />
                      {contrats.find(c => c.id === teacher.id_contrat)?.libelle?.split(' ')[0] || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3 text-sm text-black">
                    <Mail size={16} className="text-slate-400" />
                    {teacher.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-black">
                    <Phone size={16} className="text-slate-400" />
                    {teacher.telephone || 'Non renseigné'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-1 text-uvci-green font-bold">
                  <DollarSign size={16} />
                  <span>{teacher.taux_horaire?.toLocaleString() || 0}</span>
                  <span className="text-[10px] ml-1">FCFA/h</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenViewModal(teacher)}
                    className="btn btn-ghost btn-sm rounded-lg text-slate-400 hover:text-uvci-purple hover:bg-uvci-purple/5"
                  >
                    <Eye size={16} />
                  </button>
                  {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                    <button 
                      onClick={() => handleOpenModal(teacher)}
                      className="btn btn-ghost btn-sm rounded-lg text-slate-400 hover:text-uvci-purple hover:bg-uvci-purple/5"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(teacher.id)}
                      className="btn btn-ghost btn-sm rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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
                <th className="p-6">Enseignant</th>
                <th>Grade</th>
                <th>Département</th>
                <th>Contrat</th>
                <th>Taux (FCFA)</th>
                <th>Statut</th>
                <th className="text-right p-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-uvci-purple/5 transition-colors border-b border-slate-50 last:border-0">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple font-bold overflow-hidden">
                        {teacher.photo_url ? (
                          <img src={teacher.photo_url} className="w-full h-full object-cover" />
                        ) : (
                          `${teacher.nom[0]}${teacher.prenom[0]}`
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-black">{teacher.prenom} {teacher.nom}</p>
                        <p className="text-xs text-slate-500">{teacher.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm font-medium text-black">{teacher.grade || 'N/A'}</td>
                  <td className="text-sm text-black">
                    <span className="bg-slate-100 px-2 py-1 rounded-lg font-mono">
                      {departements.find(d => d.id === teacher.id_departement)?.code || 'N/A'}
                    </span>
                  </td>
                  <td className="text-sm text-black">{contrats.find(c => c.id === teacher.id_contrat)?.libelle || 'N/A'}</td>
                  <td className="font-bold text-uvci-green">{teacher.taux_horaire?.toLocaleString() || 0}</td>
                  <td>
                    <span className={`badge badge-sm font-bold ${teacher.actif ? 'badge-success text-white' : 'badge-error text-white'}`}>
                      {teacher.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="text-right p-6 space-x-2">
                    <button 
                      onClick={() => handleOpenViewModal(teacher)}
                      className="btn btn-ghost btn-sm text-slate-400 hover:text-uvci-purple hover:bg-uvci-purple/5 rounded-lg"
                    >
                      <Eye size={16} />
                    </button>
                    {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                      <button 
                        onClick={() => handleOpenModal(teacher)}
                        className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(teacher.id)}
                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedTeachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                    Aucun enseignant trouvé.
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

      {/* Modal Enseignant */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl rounded-[2rem] p-8 bg-white">
          <h3 className="text-2xl font-display font-bold text-uvci-purple mb-8">
            {editingTeacher ? 'Modifier le profil Enseignant' : 'Ajouter un Enseignant'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label font-bold text-black">Nom</label>
                <input 
                  type="text" 
                  placeholder="Ex: KOUASSI"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.nom || ''}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Prénom</label>
                <input 
                  type="text" 
                  placeholder="Ex: Jean-Marc"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.prenom || ''}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Email Académique</label>
                <input 
                  type="email" 
                  placeholder="enseignant@uvci.edu.ci"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Définir un mot de passe"
                    className="input input-bordered w-full pl-10 bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
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
                <label className="label font-bold text-black">Téléphone</label>
                <input 
                  type="tel" 
                  placeholder="Ex: +225 0707070707"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Genre</label>
                <select 
                  className="select select-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.sexe || ''}
                  onChange={(e) => setFormData({...formData, sexe: e.target.value as any})}
                >
                  <option value="">Sélectionner le genre</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="form-control md:col-span-2">
                <label className="label font-bold text-black">Adresse</label>
                <input 
                  type="text" 
                  placeholder="Ex: Abidjan, Cocody Angré"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Grade</label>
                <select 
                  className="select select-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.grade || ''}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                >
                  <option value="">Sélectionner un grade</option>
                  {grades.map(g => <option key={g.id} value={g.libelle}>{g.libelle}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Taux Horaire (FCFA)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 15000"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.taux_horaire || ''}
                  onChange={(e) => setFormData({...formData, taux_horaire: Number(e.target.value)})}
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Salaire de base (FCFA)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 500000"
                  className="input input-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.salaire_base || ''}
                  onChange={(e) => setFormData({...formData, salaire_base: Number(e.target.value)})}
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Département</label>
                <select 
                  className="select select-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.id_departement || ''}
                  onChange={(e) => setFormData({...formData, id_departement: e.target.value})}
                >
                  <option value="">Sélectionner un département</option>
                  {departements.map(d => <option key={d.id} value={d.id}>{d.libelle}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label font-bold text-black">Type de Contrat</label>
                <select 
                  className="select select-bordered bg-slate-50 rounded-xl focus:ring-2 focus:ring-uvci-purple text-black"
                  value={formData.id_contrat || ''}
                  onChange={(e) => setFormData({...formData, id_contrat: e.target.value})}
                >
                  <option value="">Sélectionner un contrat</option>
                  {contrats.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                </select>
              </div>
              <div className="form-control md:col-span-2">
                <label className="label font-bold text-black">Document du Contrat (PDF)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                    {contractFile ? (
                      <FileText className="text-uvci-purple" size={32} />
                    ) : formData.contrat_url ? (
                      <FileText className="text-green-500" size={32} />
                    ) : (
                      <File className="text-slate-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="application/pdf"
                      className="file-input file-input-bordered w-full bg-slate-50 rounded-xl text-black"
                      onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Format: PDF uniquement. Max 5MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
              <input 
                type="checkbox" 
                className="checkbox checkbox-primary"
                checked={!!formData.actif}
                onChange={(e) => setFormData({...formData, actif: e.target.checked})}
              />
              <span className="font-bold text-black">Compte actif et autorisé à saisir des heures</span>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-uvci-purple">
                  <span>Téléchargement des fichiers...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <progress className="progress progress-primary w-full h-2 rounded-full" value={uploadProgress} max="100"></progress>
              </div>
            )}

            <div className="modal-action gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost rounded-xl">Annuler</button>
              <button 
                type="submit" 
                className={`btn btn-uvci-purple rounded-xl px-12 gap-2 shadow-lg shadow-uvci-purple/20 ${isUploading ? 'loading' : ''}`}
                disabled={isUploading}
              >
                {!isUploading && <Save size={20} />}
                {isUploading ? 'Chargement...' : 'Enregistrer le Profil'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Modal Vue Enseignant */}
      <dialog className={`modal ${isViewModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-4xl rounded-[2rem] p-0 bg-white overflow-hidden">
          {/* Header violet */}
          <div className="bg-uvci-purple p-8 text-white relative">
            <button 
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-4xl font-bold overflow-hidden shadow-2xl">
                {viewingTeacher?.photo_url ? (
                  <img src={viewingTeacher.photo_url} className="w-full h-full object-cover" />
                ) : (
                  `${viewingTeacher?.nom?.[0]}${viewingTeacher?.prenom?.[0]}`
                )}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-display font-bold">{viewingTeacher?.prenom} {viewingTeacher?.nom}</h2>
                <p className="text-white/80 flex items-center justify-center md:justify-start gap-2 mt-2">
                  <GraduationCap size={18} />
                  {viewingTeacher?.grade || 'Grade non défini'}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                    {departements.find(d => d.id === viewingTeacher?.id_departement)?.libelle || 'N/A'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                    viewingTeacher?.actif ? 'bg-uvci-green/30 text-white' : 'bg-red-500/30 text-white'
                  }`}>
                    {viewingTeacher?.actif ? 'Compte Actif' : 'Compte Inactif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setViewTab('info')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  viewTab === 'info'
                    ? 'bg-white text-uvci-purple shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Info size={16} /> Informations
              </button>
              <button
                onClick={() => setViewTab('disponibilites')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  viewTab === 'disponibilites'
                    ? 'bg-white text-uvci-purple shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <CalendarDays size={16} />
                Disponibilités
                <span className="bg-uvci-green/30 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {teacherAvailability.filter(d => d.actif).length}
                </span>
              </button>
            </div>
          </div>

          {/* Contenu par onglet */}
          {viewTab === 'info' ? (
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} /> Informations Personnelles
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Email Académique</p>
                      <p className="font-bold text-black flex items-center gap-2">
                        <Mail size={16} className="text-uvci-purple" />
                        {viewingTeacher?.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Téléphone</p>
                      <p className="font-bold text-black flex items-center gap-2">
                        <Phone size={16} className="text-uvci-purple" />
                        {viewingTeacher?.telephone || 'Non renseigné'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Genre</p>
                      <p className="font-bold text-black capitalize">{viewingTeacher?.sexe || 'Non renseigné'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Adresse</p>
                      <p className="font-bold text-black">{viewingTeacher?.adresse || 'Non renseignée'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Briefcase size={14} /> Détails Professionnels
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Type de Contrat</p>
                      <p className="font-bold text-black">
                        {contrats.find(c => c.id === viewingTeacher?.id_contrat)?.libelle || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Taux Horaire</p>
                      <p className="text-2xl font-bold text-uvci-green">
                        {viewingTeacher?.taux_horaire?.toLocaleString() || 0} <span className="text-xs">FCFA/h</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Salaire de Base (Contrat)</p>
                      <p className="font-bold text-black">
                        {contrats.find(c => c.id === viewingTeacher?.id_contrat)?.salaire?.toLocaleString() || 0} FCFA
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Charge Horaire Min/Max</p>
                      <p className="font-bold text-black">
                        {contrats.find(c => c.id === viewingTeacher?.id_contrat)?.nb_heures_min || 0}h -{' '}
                        {contrats.find(c => c.id === viewingTeacher?.id_contrat)?.nb_heures_max || 0}h
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="bg-slate-900 text-white p-6 rounded-3xl">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14} /> Documents
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                      <p className="text-xs text-white/50 mb-2">Contrat de Travail</p>
                      {viewingTeacher?.contrat_url ? (
                        <a 
                          href={viewingTeacher.contrat_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-white btn-sm w-full rounded-xl gap-2"
                        >
                          <Eye size={16} />
                          Voir le PDF
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-white/30 italic">
                          <AlertCircle size={16} />
                          Aucun document
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <div className="p-6 border border-slate-100 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actions Rapides</h4>
                  <button 
                    onClick={() => viewingTeacher && generateIndividualSheet(viewingTeacher)}
                    className="btn btn-outline btn-uvci-purple btn-sm w-full rounded-xl gap-2"
                  >
                    <Download size={16} />
                    Fiche Individuelle
                  </button>
                  <button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenModal(viewingTeacher);
                    }}
                    className="btn btn-outline btn-sm w-full rounded-xl gap-2"
                  >
                    <Edit2 size={16} />
                    Modifier le profil
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Onglet Disponibilités */
            <div className="p-8">
              {teacherAvailability.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <CalendarDays size={40} />
                  </div>
                  <p className="font-bold text-slate-500">Aucune disponibilité enregistrée</p>
                  <p className="text-sm text-slate-400">Cet enseignant n'a pas encore renseigné ses créneaux.</p>
                </div>
              ) : (() => {
                const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                const CRENEAUX = ['Matin', 'Après-midi', 'Soir'];
                const isAvailable = (jour: string, creneau: string) =>
                  teacherAvailability.some(
                    d => d.jour === jour && d.creneau === creneau && d.actif !== false
                  );
                const totalSlots = teacherAvailability.filter(d => d.actif !== false).length;

                return (
                  <div className="space-y-6">
                    {/* Stats rapides */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-uvci-green/10 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-uvci-green">{totalSlots}</p>
                        <p className="text-xs text-slate-500 mt-1">Créneaux disponibles</p>
                      </div>
                      <div className="bg-uvci-purple/10 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-uvci-purple">
                          {new Set(teacherAvailability.filter(d => d.actif !== false).map((d: any) => d.jour)).size}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Jours disponibles</p>
                      </div>
                      <div className="bg-slate-100 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-slate-700">
                          {Math.round((totalSlots / 18) * 100)}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Disponibilité semaine</p>
                      </div>
                    </div>

                    {/* Grille hebdomadaire */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="w-28 p-3 text-left text-xs font-bold text-slate-400 uppercase">Créneau</th>
                            {JOURS.map(j => (
                              <th key={j} className="p-3 text-center text-xs font-bold text-slate-600">{j}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {CRENEAUX.map(creneau => (
                            <tr key={creneau}>
                              <td className="p-3">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                  {creneau}
                                </span>
                              </td>
                              {JOURS.map(jour => {
                                const available = isAvailable(jour, creneau);
                                return (
                                  <td key={jour} className="p-2 text-center">
                                    <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                      available
                                        ? 'bg-uvci-green/15 text-uvci-green'
                                        : 'bg-slate-50 text-slate-200'
                                    }`}>
                                      {available
                                        ? <CheckCircle2 size={20} strokeWidth={2.5} />
                                        : <XCircle size={20} strokeWidth={1.5} />
                                      }
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Légende */}
                    <div className="flex items-center gap-6 text-xs text-slate-500 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-uvci-green/15 flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-uvci-green" />
                        </div>
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-slate-50 flex items-center justify-center">
                          <XCircle size={12} className="text-slate-200" />
                        </div>
                        <span>Non disponible</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
