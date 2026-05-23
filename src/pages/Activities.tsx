import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Calculator,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Table as TableIcon,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../contexts/ConfigContext';
import { ActivitePedagogique, Coefficient, Cours, UserProfile, Ressource } from '../types';
import Pagination from '../components/Pagination';
import { getThemedSwal } from '../lib/swal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addLogoToDoc } from '../lib/pdfLogo';
import * as XLSX from 'xlsx';

export default function Activities() {
  const { profile } = useAuth();
  const { config } = useConfig();
  const [activities, setActivities] = useState<ActivitePedagogique[]>([]);
  const [coefficients, setCoefficients] = useState<Coefficient[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivitePedagogique | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [selectedCours, setSelectedCours] = useState('');
  const [selectedRessource, setSelectedRessource] = useState('');
  const [typeAction, setTypeAction] = useState<'Conception' | 'MAJ'>('Conception');
  const [niveauComplexite, setNiveauComplexite] = useState<'N1' | 'N2' | 'N3'>('N1');
  const [nbSequences, setNbSequences] = useState(0);
  const [volumeHoraire, setVolumeHoraire] = useState(0);

  const fetchActivities = async () => {
    try {
      const url = profile?.role === 'admin' || profile?.role === 'secretaire' 
        ? '/api/activities' 
        : `/api/activities?userId=${profile?.id}`;
      const res = await fetch(url);
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  useEffect(() => {
    // Fetch coefficients
    fetch('/api/coefficients').then(res => res.json()).then(setCoefficients);
    
    // Fetch cours
    fetch('/api/courses').then(res => res.json()).then(setCours);

    // Fetch users for admins/secretaries
    if (profile?.role === 'admin' || profile?.role === 'secretaire') {
      fetch('/api/users').then(res => res.json()).then(setUsers);
    } else if (profile) {
      setUsers([profile]);
    }

    if (profile) {
      fetchActivities();
    }
  }, [profile]);

  // Auto-calculate nbSequences when cours changes
  useEffect(() => {
    const c = cours.find(item => item.id === selectedCours);
    if (c) {
      setNbSequences((c as any).nb_sequences || ((c as any).nb_heures * 4) || 0);
    }
  }, [selectedCours, cours]);

  // Auto-calculate volumeHoraire based on PDF Barème
  // Conception: N1: 0.4, N2: 0.75, N3: 1.5
  // MAJ: N1: 0.2, N2: 0.375, N3: 0.75
  useEffect(() => {
    const factors = {
      Conception: { N1: 0.4, N2: 0.75, N3: 1.5 },
      MAJ: { N1: 0.2, N2: 0.375, N3: 0.75 }
    };
    const factor = factors[typeAction][niveauComplexite];
    setVolumeHoraire(nbSequences * factor);
  }, [typeAction, niveauComplexite, nbSequences]);

  const handleValidate = async (id: string, newStatut: 'valide' | 'rejete') => {
    try {
      const activity = activities.find(a => a.id === id);
      if (!activity) return;

      const result = await getThemedSwal().fire({
        title: newStatut === 'valide' ? 'Valider l\'activité ?' : 'Rejeter l\'activité ?',
        text: newStatut === 'valide' ? 'Cette activité sera comptabilisée dans les heures.' : 'Cette activité ne sera pas comptabilisée.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Confirmer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: newStatut === 'valide' ? '#10b981' : '#ef4444',
      });

      if (result.isConfirmed) {
        let updateData: any = { statut: newStatut };

        if (newStatut === 'rejete') {
          const { value: reason } = await getThemedSwal().fire({
            title: 'Motif du rejet',
            input: 'textarea',
            inputLabel: 'Expliquez pourquoi cette activité est rejetée',
            inputPlaceholder: 'Ex: Volume horaire incorrect, justificatif manquant...',
            showCancelButton: true,
            confirmButtonText: 'Rejeter',
            cancelButtonText: 'Annuler',
            inputValidator: (value) => {
              if (!value) return 'Vous devez fournir un motif !';
            }
          });

          if (!reason) return;
          updateData.motif_rejet = reason;
        }

        if (newStatut === 'valide') {
          const teacher = users.find(u => u.id === (activity as any).id_user || activity.id_utilisateur);
          const rate = teacher?.taux_horaire || 10000;
          updateData.montant = activity.volume_horaire * rate;
        }

        const res = await fetch(`/api/activities/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (res.ok) {
          fetchActivities();
          getThemedSwal().fire('Succès', `Activité ${newStatut === 'valide' ? 'validée' : 'rejetée'}.`, 'success');
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  const handleOpenModal = (activity: ActivitePedagogique | null = null) => {
    setEditingActivity(activity);
    if (activity) {
      setSelectedCours(activity.id_cours);
      setSelectedRessource(activity.id_ressource || '');
      setTypeAction(activity.type_action);
      setNbSequences(activity.nb_sequences);
      setVolumeHoraire(activity.volume_horaire);
      const coeff = coefficients.find(c => c.id === activity.id_coefficient);
      if (coeff) setNiveauComplexite(coeff.niveau_complexite as any);
    } else {
      setSelectedCours('');
      setSelectedRessource('');
      setTypeAction('Conception');
      setNiveauComplexite('N1');
      setNbSequences(0);
      setVolumeHoraire(0);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await getThemedSwal().fire({
      title: 'Supprimer cette activité ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchActivities();
          getThemedSwal().fire('Supprimé', 'L\'activité a été supprimée.', 'success');
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    
    try {
      const coeff = coefficients.find(c => c.type_action === typeAction && c.niveau_complexite === niveauComplexite);
      const data = {
        id_user: editingActivity ? (editingActivity as any).id_user || editingActivity.id_utilisateur : profile.id,
        id_cours: selectedCours,
        id_annee_academique: config.defaultAnneeId,
        id_coefficient: coeff?.id,
        type_action: typeAction,
        nb_sequences: nbSequences,
        volume_horaire: volumeHoraire,
        date_saisie: editingActivity ? editingActivity.date_saisie : new Date().toISOString(),
        statut: editingActivity ? editingActivity.statut : 'en_attente',
        paye: editingActivity ? editingActivity.paye : false
      };

      const url = editingActivity ? `/api/activities/${editingActivity.id}` : '/api/activities';
      const method = editingActivity ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        fetchActivities();
        setIsModalOpen(false);
        getThemedSwal().fire('Succès', editingActivity ? 'Activité mise à jour.' : 'Activité enregistrée.', 'success');
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header: UVCI Branding Logo
      await addLogoToDoc(doc, 14, 8, 15, 15);

      doc.setFontSize(20);
      doc.setTextColor(90, 45, 130); // UVCI Purple
      doc.text('UNIVERSITÉ VIRTUELLE DE CÔTE D\'IVOIRE', pageWidth / 2 + 10, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('GHE - Gestion des Heures des Enseignants', pageWidth / 2 + 10, 25, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text('RELEVÉ D\'ACTIVITÉS PÉDAGOGIQUES', 14, 45);
      
      // Separator
      doc.setDrawColor(90, 45, 130);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 80, 48);

      // Info Section
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Enseignant: ${profile?.prenom} ${profile?.nom}`, 14, 58);
      doc.text(`Email: ${profile?.email}`, 14, 63);
      doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, 68);
      
      const tableData = activities.map(a => {
        const statusLabel = a.statut === 'en_attente' ? 'Brouillon' : a.statut === 'valide' ? 'Validé' : a.statut === 'rejete' ? 'Rejeté' : a.statut;
        return [
          a.date_saisie ? new Date(a.date_saisie).toLocaleDateString('fr-FR') : '',
          cours.find(c => c.id === a.id_cours)?.intitule || 'N/A',
          a.type_action || '',
          a.niveau_complexite || 'N1',
          a.nb_sequences || 0,
          (a.volume_horaire || 0) + 'h',
          statusLabel
        ];
      });

      autoTable(doc, {
        head: [['Date', 'Cours', 'Action', 'Compl.', 'Séquences', 'Vol. Horaire', 'Statut']],
        body: tableData,
        startY: 75,
        theme: 'striped',
        headStyles: { fillColor: [90, 45, 130], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { top: 75 },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text('UVCI - GHE | Document officiel généré automatiquement', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
      });

      doc.save(`Activites_${profile?.nom}_${Date.now()}.pdf`);
      getThemedSwal().fire('Succès', 'Le relevé PDF a été généré.', 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      getThemedSwal().fire('Erreur', 'Impossible de générer le rapport PDF.', 'error');
    }
  };

  const exportExcel = () => {
    const data = activities.map(a => {
      const teacher = users.find(u => u.id === a.id_utilisateur);
      return {
        Date: a.date_saisie,
        Enseignant: teacher ? `${teacher.nom} ${teacher.prenom}` : 'N/A',
        Type: a.type_action,
        Sequences: a.nb_sequences,
        Volume_Horaire: a.volume_horaire,
        Statut: a.statut,
        Paye: a.paye ? 'Oui' : 'Non'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activités');
    XLSX.writeFile(wb, 'activites_pedagogiques.xlsx');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Activités Pédagogiques</h1>
          <p className="text-slate-500">Gérez vos saisies d'heures et suivez leur validation.</p>
        </div>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-outline rounded-xl gap-2 border-slate-200 text-black">
              <Download size={20} />
              Exporter
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-2xl w-52 border border-slate-100 mt-2">
              <li><button onClick={exportPDF} className="gap-2 text-black"><FileText size={18} className="text-red-500" /> Format PDF</button></li>
              <li><button onClick={exportExcel} className="gap-2 text-black"><TableIcon size={18} className="text-green-600" /> Format Excel</button></li>
            </ul>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-uvci-purple rounded-xl gap-2 shadow-lg shadow-uvci-purple/20"
          >
            <Plus size={20} />
            Saisir une activité
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par enseignant, type ou statut..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-uvci-purple text-sm text-black"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost bg-slate-50 rounded-xl gap-2 text-slate-600">
            <Filter size={18} />
            Filtrer
          </button>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost bg-slate-50 rounded-xl gap-2 text-slate-600">
              <Download size={18} />
              Exporter
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-2xl w-52 border border-slate-100 mt-2">
              <li><button onClick={exportPDF} className="gap-2 text-black"><FileText size={18} className="text-red-500" /> Format PDF</button></li>
              <li><button onClick={exportExcel} className="gap-2 text-black"><TableIcon size={18} className="text-green-600" /> Format Excel</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <th className="p-6">Date</th>
                {(profile?.role === 'admin' || profile?.role === 'secretaire') && <th>Enseignant</th>}
                <th>Cours & Ressource</th>
                <th>Type</th>
                <th>Complexité</th>
                <th>Séquences</th>
                <th>Vol. Horaire</th>
                <th>Montant (CFA)</th>
                <th>Statut</th>
                <th className="text-right p-6">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {activities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((activity) => {
                const teacher = users.find(u => u.id === activity.id_utilisateur);
                return (
                  <tr key={activity.id} className="hover:bg-uvci-purple/5 transition-colors border-b border-slate-50 last:border-0">
                    <td className="p-6 font-medium text-slate-600">{activity.date_saisie}</td>
                    {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                            {teacher?.photo_url ? (
                              <img src={teacher.photo_url} alt={teacher.nom} className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} />
                            )}
                          </div>
                          <span className="font-bold text-slate-700">{teacher ? `${teacher.prenom} ${teacher.nom}` : 'Inconnu'}</span>
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-black">{cours.find(c => c.id === activity.id_cours)?.intitule || 'Cours inconnu'}</span>
                        <span className="text-[10px] text-slate-400">{ressources.find(r => r.id === activity.id_ressource)?.titre || 'Ressource non liée'}</span>
                      </div>
                    </td>
                    <td>
                    <span className={`badge ${activity.type_action === 'Conception' ? 'badge-primary' : 'badge-secondary'} badge-sm font-bold`}>
                      {activity.type_action}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-slate-700">{activity.id_coefficient ? coefficients.find(c => c.id === activity.id_coefficient)?.niveau_complexite : 'N/A'}</span>
                  </td>
                  <td className="font-mono">{activity.nb_sequences}</td>
                  <td className="font-bold text-uvci-purple">{activity.volume_horaire}h</td>
                  <td className="font-mono text-uvci-green">
                    {activity.montant ? activity.montant.toLocaleString() : '-'}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {activity.statut === 'soumise' && <Clock size={16} className="text-blue-500" />}
                      {activity.statut === 'valide' && <CheckCircle2 size={16} className="text-uvci-green" />}
                      {activity.statut === 'rejete' && <XCircle size={16} className="text-red-500" />}
                      {activity.statut === 'en_attente' && <Clock size={16} className="text-slate-400" />}
                      <div className="flex flex-col">
                        <span className={`capitalize font-medium ${
                          activity.statut === 'valide' ? 'text-uvci-green' : 
                          activity.statut === 'soumise' ? 'text-blue-500' :
                          activity.statut === 'rejete' ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {activity.statut === 'en_attente' ? 'Brouillon' : activity.statut.replace('_', ' ')}
                        </span>
                        {activity.statut === 'rejete' && activity.motif_rejet && (
                          <span className="text-[10px] text-red-400 italic max-w-[150px] truncate" title={activity.motif_rejet}>
                            Motif: {activity.motif_rejet}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-6">
                    <div className="flex justify-end gap-2">
                      {/* Teacher Actions */}
                      {activity.id_utilisateur === profile?.id && activity.statut === 'en_attente' && (
                        <button 
                          onClick={() => handleValidate(activity.id, 'soumise' as any)}
                          className="btn btn-ghost btn-xs text-blue-500 hover:bg-blue-50"
                          title="Soumettre pour validation"
                        >
                          <CheckCircle2 size={16} />
                          <span className="ml-1">Soumettre</span>
                        </button>
                      )}

                      {/* Admin/Secretary Actions */}
                      {(profile?.role === 'admin' || profile?.role === 'secretaire') && activity.statut === 'soumise' && (
                        <>
                          <button 
                            onClick={() => handleValidate(activity.id, 'valide')}
                            className="btn btn-ghost btn-xs text-uvci-green hover:bg-uvci-green/10"
                            title="Valider"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleValidate(activity.id, 'rejete')}
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                            title="Rejeter"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {(profile?.role === 'admin' || activity.id_utilisateur === profile?.id) && (activity.statut === 'en_attente' || activity.statut === 'rejete') && (
                        <>
                          <button 
                            onClick={() => handleOpenModal(activity)}
                            className="btn btn-ghost btn-xs text-blue-500 hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(activity.id)}
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button className="btn btn-ghost btn-xs rounded-lg">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center p-12 text-slate-400 italic">
                    Aucune activité enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <Pagination 
            currentPage={currentPage}
            totalItems={activities.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <dialog id="modal_saisie" className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl rounded-3xl p-8 bg-white border border-slate-100 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-uvci-purple/10 flex items-center justify-center text-uvci-purple">
                {editingActivity ? <Edit2 size={24} /> : <Plus size={24} />}
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900">
                  {editingActivity ? 'Modifier la Saisie' : 'Nouvelle Saisie'}
                </h3>
                <p className="text-sm text-slate-500">
                  {editingActivity ? 'Mettez à jour votre activité pédagogique' : 'Enregistrez vos activités pédagogiques'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm btn-circle text-slate-400">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label font-bold text-slate-700">Cours</label>
                <select 
                  className="select select-bordered bg-slate-50 border-slate-200 rounded-xl text-black focus:border-uvci-purple focus:ring-uvci-purple"
                  value={selectedCours}
                  onChange={(e) => setSelectedCours(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un cours</option>
                  {cours.map(c => (
                    <option key={c.id} value={c.id}>{c.intitule}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label font-bold text-slate-700">Ressource</label>
                <select 
                  className="select select-bordered bg-slate-50 border-slate-200 rounded-xl text-black focus:border-uvci-purple focus:ring-uvci-purple"
                  value={selectedRessource}
                  onChange={(e) => setSelectedRessource(e.target.value)}
                  required
                  disabled={!selectedCours}
                >
                  <option value="">Sélectionner une ressource</option>
                  {ressources.filter(r => r.id_cours === selectedCours).map(r => (
                    <option key={r.id} value={r.id}>{r.titre} ({r.type})</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label font-bold text-slate-700">Type d'Action</label>
                <select 
                  className="select select-bordered bg-slate-50 border-slate-200 rounded-xl text-black focus:border-uvci-purple focus:ring-uvci-purple"
                  value={typeAction}
                  onChange={(e) => setTypeAction(e.target.value as any)}
                >
                  <option value="Conception">Conception</option>
                  <option value="MAJ">Mise à Jour (MAJ)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label font-bold text-slate-700">Niveau de Complexité</label>
                <select 
                  className="select select-bordered bg-slate-50 border-slate-200 rounded-xl text-black focus:border-uvci-purple focus:ring-uvci-purple"
                  value={niveauComplexite}
                  onChange={(e) => setNiveauComplexite(e.target.value as any)}
                >
                  <option value="N1">Niveau 1 (Simple)</option>
                  <option value="N2">Niveau 2 (Intermédiaire)</option>
                  <option value="N3">Niveau 3 (Complexe)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label font-bold text-slate-700">Nombre de Séquences</label>
                <input 
                  type="number" 
                  className="input input-bordered bg-slate-100 border-slate-200 rounded-xl font-mono text-slate-600 cursor-not-allowed"
                  value={nbSequences}
                  readOnly
                />
                <label className="label">
                  <span className="label-text-alt text-slate-400 italic">Calculé: Heures x 4</span>
                </label>
              </div>
            </div>

            {/* Result Card */}
            <div className="bg-uvci-purple/5 p-6 rounded-2xl border border-uvci-purple/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-uvci-purple rounded-xl flex items-center justify-center text-white shadow-lg shadow-uvci-purple/20">
                  <Calculator size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Volume Horaire Attribué</p>
                  <p className="text-3xl font-display font-bold text-uvci-purple">{volumeHoraire.toFixed(2)}h</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400 max-w-[150px] leading-tight">
                Basé sur le barème officiel de l'UVCI pour la {typeAction} en {niveauComplexite}.
              </div>
            </div>

            <div className="modal-action gap-4 pt-4 border-t border-slate-50">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost rounded-xl text-slate-500 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={loading || !selectedCours}
                className="btn btn-uvci-purple rounded-xl px-10 gap-2 shadow-lg shadow-uvci-purple/20"
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <Save size={20} />
                    {editingActivity ? 'Mettre à jour' : 'Enregistrer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
