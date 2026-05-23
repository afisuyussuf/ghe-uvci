import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Save, 
  FileText, 
  Download, 
  Upload, 
  Trash2,
  FileCheck,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getThemedSwal } from '../lib/swal';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useConfig } from '../contexts/ConfigContext';
import { addLogoToDoc } from '../lib/pdfLogo';

interface UserDoc {
  id: string;
  nom: string;
  type: string;
  file_url: string;
  date_upload: string;
}

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { config } = useConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [documents, setDocuments] = useState<UserDoc[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    photo_url: '',
    password: '',
    iban: '',
    banque: '',
    id_departement: '',
    grade: '',
    statut: '',
    specialisation: '',
    niveaux: [] as string[],
    diplomes: [] as string[]
  });

  const [departements, setDepartements] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const availableNiveaux = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];

  useEffect(() => {
    if (profile) {
      setFormData({
        nom: profile.nom || '',
        prenom: profile.prenom || '',
        telephone: profile.telephone || '',
        adresse: profile.adresse || '',
        photo_url: profile.photo_url || '',
        password: '', // Keep empty for security, only change if user enters new value
        iban: profile.iban || '',
        banque: profile.banque || '',
        id_departement: profile.id_departement || '',
        grade: profile.grade || '',
        statut: profile.statut || '',
        specialisation: profile.specialisation || '',
        niveaux: profile.niveaux || [],
        diplomes: (profile as any).diplomes || []
      });
      fetchDocuments();
      fetchActivities();
      fetchReferenceData();
    }
  }, [profile]);

  const toggleNiveau = (niv: string) => {
    setFormData(prev => ({
      ...prev,
      niveaux: prev.niveaux.includes(niv) 
        ? prev.niveaux.filter(n => n !== niv)
        : [...prev.niveaux, niv]
    }));
  };

  const fetchReferenceData = async () => {
    try {
      const [dRes, gRes, sRes] = await Promise.all([
        fetch('/api/departements'),
        fetch('/api/grades'),
        fetch('/api/statuts')
      ]);
      setDepartements(await dRes.json());
      setGrades(await gRes.json());
      setStatuts(await sRes.json());
    } catch (error) {
      console.error("Failed to fetch ref data", error);
    }
  };

  const fetchActivities = async () => {
    if (!profile?.id) return;
    try {
      const res = await fetch(`/api/activities?userId=${profile.id}`);
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const exportPDFRecap = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header: UVCI Branding Logo
      await addLogoToDoc(doc, 14, 8, 15, 15);

      doc.setFontSize(20);
      doc.setTextColor(90, 45, 130);
      doc.text('UNIVERSITÉ VIRTUELLE DE CÔTE D\'IVOIRE', pageWidth / 2 + 10, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('RÉCAPITULATIF INDIVIDUEL DES ACTIVITÉS', pageWidth / 2 + 10, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Enseignant: ${profile?.prenom} ${profile?.nom}`, 14, 45);
      doc.text(`Grade: ${profile?.grade || 'N/A'}`, 14, 52);
      doc.text(`Période: Année Académique ${config.defaultAnneeId || ''}`, 14, 59);

      const tableData = activities.map((a: any) => [
        new Date(a.date_saisie).toLocaleDateString('fr-FR'),
        a.cours?.intitule || 'N/A',
        a.type_action,
        a.volume_horaire + 'h',
        a.statut
      ]);

      autoTable(doc, {
        head: [['Date', 'Cours', 'Action', 'Vol. Horaire', 'Statut']],
        body: tableData,
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: [90, 45, 130] }
      });

      doc.save(`Recapitulatif_${profile?.nom}_${Date.now()}.pdf`);
      getThemedSwal().fire('Succès', 'Votre récapitulatif a été généré.', 'success');
    } catch (error) {
      getThemedSwal().fire('Erreur', 'Impossible de générer le PDF.', 'error');
    }
  };

  const fetchDocuments = async () => {
    if (!profile?.id) return;
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`/api/documents/${profile.id}`);
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete (dataToSend as any).password;
      }

      const res = await fetch(`/api/users/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        getThemedSwal().fire('Succès', 'Profil mis à jour.', 'success');
        setIsEditing(false);
        setFormData(prev => ({ ...prev, password: '' })); // Clear password field
        if (updateProfile) updateProfile();
      }
    } catch (error) {
      getThemedSwal().fire('Erreur', 'Impossible de mettre à jour le profil.', 'error');
    }
  };

  const handlePhotoUpload = async () => {
    const result = await getThemedSwal().fire({
      title: 'Changer la photo de profil',
      text: 'Voulez-vous importer une photo depuis votre ordinateur ou saisir une URL ?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '📁 Importer un fichier',
      denyButtonText: '🔗 Saisir une URL',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#4f46e5',
      denyButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      const { value: file } = await getThemedSwal().fire({
        title: 'Sélectionner l\'image',
        input: 'file',
        inputAttributes: {
          'accept': 'image/*',
          'aria-label': 'Choisir l\'image de profil'
        },
        showCancelButton: true,
        cancelButtonText: 'Annuler'
      });

      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Url = e.target?.result as string;
          if (base64Url) {
            updatePhotoInDb(base64Url);
          }
        };
        reader.readAsDataURL(file);
      }
    } else if (result.isDenied) {
      const { value: url } = await getThemedSwal().fire({
        title: 'Saisir l\'URL de l\'image',
        input: 'url',
        inputPlaceholder: 'https://...',
        showCancelButton: true,
        cancelButtonText: 'Annuler'
      });

      if (url) {
        updatePhotoInDb(url);
      }
    }
  };

  const updatePhotoInDb = async (url: string) => {
    setFormData(prev => ({ ...prev, photo_url: url }));
    try {
      await fetch(`/api/users/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photo_url: url })
      });
      if (updateProfile) updateProfile();
      getThemedSwal().fire('Succès', 'Photo mise à jour.', 'success');
    } catch (err) {
      getThemedSwal().fire('Erreur', 'Echec de la mise à jour.', 'error');
    }
  };

  const handleUploadDoc = async (type: string) => {
    const { value: file } = await getThemedSwal().fire({
      title: `Déposer un ${type}`,
      input: 'file',
      inputAttributes: {
        'accept': 'application/pdf,image/*',
        'aria-label': 'Choisir le fichier'
      },
      showCancelButton: true,
      cancelButtonText: 'Annuler'
    });

    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileDataUrl = reader.result as string;
        try {
          const res = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_user: profile?.id,
              nom: file.name,
              type: type,
              file_url: fileDataUrl
            })
          });
          if (res.ok) {
            getThemedSwal().fire('Succès', 'Document déposé avec succès.', 'success');
            fetchDocuments();
          } else {
            getThemedSwal().fire('Erreur', 'Échec du dépôt du document.', 'error');
          }
        } catch (err) {
          getThemedSwal().fire('Erreur', 'Échec du dépôt lors de l\'envoi.', 'error');
        }
      };
      reader.onerror = () => {
        getThemedSwal().fire('Erreur', 'Impossible de lire le fichier.', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteDoc = async (id: string) => {
    const result = await getThemedSwal().fire({
      title: 'Supprimer ce document ?',
      text: 'Cette action effacera le document de votre espace personnel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Col: Info Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center"
          >
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-uvci-purple/20 mx-auto bg-slate-100">
                {profile?.photo_url || formData.photo_url ? (
                  <img src={profile?.photo_url || formData.photo_url} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-uvci-purple">
                    <User size={64} />
                  </div>
                )}
              </div>
              <button 
                onClick={handlePhotoUpload}
                className="absolute bottom-1 right-1 w-10 h-10 bg-uvci-purple text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Upload size={18} />
              </button>
            </div>
            
            <h2 className="text-2xl font-bold text-black">{profile?.prenom} {profile?.nom}</h2>
            <p className="text-uvci-purple font-semibold bg-uvci-purple/10 px-3 py-1 rounded-full inline-block mt-2 text-sm">
              {profile?.role === 'enseignant' ? (profile?.grade || 'Enseignant') : profile?.role}
            </p>
            
            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={18} className="text-slate-400" />
                <span className="text-sm truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={18} className="text-slate-400" />
                <span className="text-sm">{profile?.telephone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={18} className="text-slate-400" />
                <span className="text-sm">{profile?.adresse || 'Côte d\'Ivoire'}</span>
              </div>
              {profile?.role === 'enseignant' && (
                <>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Briefcase size={18} className="text-slate-400" />
                    <span className="text-sm">Statut: {profile?.statut || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <CreditCard size={18} className="text-slate-400" />
                    <span className="text-sm">Taux: {profile?.taux_horaire?.toLocaleString()} FCFA/h</span>
                  </div>
                  {profile?.specialisation && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <GraduationCap size={18} className="text-slate-400" />
                      <span className="text-sm italic">{profile.specialisation}</span>
                    </div>
                  )}
                  {profile?.niveaux && profile.niveaux.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.niveaux.map(n => (
                        <span key={n} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile?.diplomes && profile.diplomes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.diplomes.map(d => (
                        <span key={d} className="text-[10px] bg-uvci-green/10 text-uvci-green px-2 py-0.5 rounded-md font-bold border border-uvci-green/20">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {profile?.role === 'enseignant' && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={exportPDFRecap}
                  className="btn btn-outline btn-uvci-purple w-full gap-2 rounded-xl"
                >
                  <Download size={18} />
                  Télécharger Récapitulatif
                </button>
              </div>
            )}
          </motion.div>

          {/* Quick Stats for Teacher */}
          {profile?.role === 'enseignant' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-uvci-purple rounded-3xl p-6 text-white"
            >
              <h3 className="font-bold mb-4 opacity-80 uppercase text-xs tracking-wider">Résumé Carrière</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm opacity-80">Grade</span>
                  <span className="font-bold flex items-center gap-1">
                    <GraduationCap size={16} />
                    {profile?.grade}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm opacity-80">Années d'ancienneté</span>
                  <span className="font-bold">2 ans</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Col: Tabs */}
        <div className="flex-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setIsEditing(false)}
                className={`flex-1 p-6 font-bold text-sm uppercase tracking-wider transition-colors ${!isEditing ? 'text-uvci-purple border-b-2 border-uvci-purple' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Mes Documents
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className={`flex-1 p-6 font-bold text-sm uppercase tracking-wider transition-colors ${isEditing ? 'text-uvci-purple border-b-2 border-uvci-purple' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Modifier Profil
              </button>
            </div>

            <div className="p-8">
              {!isEditing ? (
                <div className="space-y-8">
                  {/* Upload Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleUploadDoc('Contrat')}
                      className="p-6 rounded-2xl border-2 border-dashed border-uvci-purple/30 bg-uvci-purple/5 hover:bg-uvci-purple/10 flex flex-col items-center gap-2 text-uvci-purple transition-colors"
                    >
                      <Upload size={24} />
                      <span className="font-bold">Déposer mon Contrat</span>
                      <span className="text-[10px] opacity-60">Format PDF ou Image</span>
                    </button>
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                      <p>Les bulletins de paie et récapitulatifs sont déposés par l'administration.</p>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div>
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                      <FileCheck className="text-uvci-green" size={20} />
                      Porte-documents personnel
                    </h4>
                    
                    {isLoadingDocs ? (
                      <div className="py-12 flex justify-center"><span className="loading loading-spinner text-uvci-purple"></span></div>
                    ) : documents.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Aucun document disponible pour le moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map(doc => (
                          <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                            <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                              doc.type === 'Bulletin de Paie' ? 'bg-green-100 text-green-600' :
                              doc.type === 'Contrat' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-uvci-purple'
                            }`}>
                              <FileText size={20} />
                            </div>
                            <h5 className="font-bold text-black text-sm truncate" title={doc.nom}>{doc.nom}</h5>
                            <p className="text-[10px] text-slate-500">{doc.type} • {new Date(doc.date_upload).toLocaleDateString('fr-FR')}</p>
                            
                            <div className="mt-4 flex gap-2">
                              <a 
                                href={doc.file_url} 
                                download={doc.nom}
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-ghost btn-xs text-uvci-purple bg-white shadow-sm"
                              >
                                <Download size={14} />
                                Télécharger
                              </a>
                              <button onClick={() => deleteDoc(doc.id)} className="btn btn-ghost btn-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-10 max-w-2xl mx-auto">
                  {/* Categorized Areas: Personal Info */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 border-l-4 border-uvci-purple pl-3 uppercase text-sm tracking-wider">
                      Informations Personnelles
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Nom</label>
                          <input 
                            type="text" 
                            className="input input-bordered bg-white rounded-xl text-black"
                            value={formData.nom}
                            onChange={(e) => setFormData({...formData, nom: e.target.value})}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Prénom</label>
                          <input 
                            type="text" 
                            className="input input-bordered bg-white rounded-xl text-black"
                            value={formData.prenom}
                            onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Téléphone</label>
                          <input 
                            type="tel" 
                            className="input input-bordered bg-white rounded-xl text-black"
                            value={formData.telephone}
                            onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Email (Lecture Seule)</label>
                          <input 
                            type="email" 
                            className="input input-bordered bg-slate-100 rounded-xl text-slate-500 cursor-not-allowed"
                            value={profile?.email || ''}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-slate-600 text-xs">Adresse</label>
                        <textarea 
                          className="textarea textarea-bordered bg-white rounded-xl text-black h-20"
                          value={formData.adresse}
                          onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categorized Areas: Academic Info */}
                  {profile?.role === 'enseignant' && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-800 border-l-4 border-uvci-purple pl-3 uppercase text-sm tracking-wider">
                        Informations Académiques
                      </h4>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Département Principal</label>
                          <select 
                            className="select select-bordered bg-white rounded-xl text-black w-full"
                            value={formData.id_departement}
                            onChange={(e) => setFormData({...formData, id_departement: e.target.value})}
                          >
                            <option value="">Sélectionner un département</option>
                            {departements.map(d => <option key={d.id} value={d.id}>{d.libelle}</option>)}
                          </select>
                        </div>

                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs mb-2">Niveaux d'intervention (Plusieurs choix possibles)</label>
                          <div className="flex flex-wrap gap-2">
                            {availableNiveaux.map(niv => (
                              <button
                                key={niv}
                                type="button"
                                onClick={() => toggleNiveau(niv)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                  formData.niveaux.includes(niv)
                                    ? 'bg-uvci-purple text-white border-uvci-purple shadow-md'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-uvci-purple/50'
                                }`}
                              >
                                {niv}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-control">
                            <label className="label font-bold text-slate-600 text-xs">Grade</label>
                            <select 
                              className="select select-bordered bg-white rounded-xl text-black"
                              value={formData.grade}
                              onChange={(e) => setFormData({...formData, grade: e.target.value})}
                            >
                              <option value="">Sélectionner un grade</option>
                              {grades.map(g => <option key={g.id || g.libelle} value={g.libelle}>{g.libelle}</option>)}
                            </select>
                          </div>
                          <div className="form-control">
                            <label className="label font-bold text-slate-600 text-xs">Statut</label>
                            <select 
                              className="select select-bordered bg-white rounded-xl text-black"
                              value={formData.statut}
                              onChange={(e) => setFormData({...formData, statut: e.target.value})}
                            >
                              <option value="">Sélectionner un statut</option>
                              {statuts.map(s => <option key={s.id || s.libelle} value={s.libelle}>{s.libelle}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Spécialisation / Domaines d'expertise</label>
                          <input 
                            type="text" 
                            placeholder="ex: Intelligence Artificielle, Cybersécurité..."
                            className="input input-bordered bg-white rounded-xl text-black"
                            value={formData.specialisation}
                            onChange={(e) => setFormData({...formData, specialisation: e.target.value})}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Diplômes & Certifications (séparés par des virgules)</label>
                          <input 
                            type="text" 
                            placeholder="ex: Master 2, Certification AWS, etc."
                            className="input input-bordered bg-white rounded-xl text-black"
                            value={formData.diplomes.join(', ')}
                            onChange={(e) => setFormData({...formData, diplomes: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Categorized Areas: Banking Info */}
                  {profile?.role === 'enseignant' && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-800 border-l-4 border-uvci-purple pl-3 uppercase text-sm tracking-wider">
                        Informations Bancaires
                      </h4>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">IBAN / RIB</label>
                          <input 
                            type="text" 
                            className="input input-bordered bg-white rounded-xl text-black" 
                            placeholder="CI00..." 
                            value={formData.iban}
                            onChange={(e) => setFormData({...formData, iban: e.target.value})}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-slate-600 text-xs">Banque</label>
                          <input 
                            type="text" 
                            className="input input-bordered bg-white rounded-xl text-black" 
                            placeholder="ex: NSIA, SGCI..." 
                            value={formData.banque}
                            onChange={(e) => setFormData({...formData, banque: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 border-l-4 border-uvci-purple pl-3 uppercase text-sm tracking-wider">
                      Sécurité
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <div className="form-control">
                        <label className="label font-bold text-slate-600 text-xs">Changer le mot de passe</label>
                        <input 
                          type="password" 
                          className="input input-bordered bg-white rounded-xl text-black"
                          placeholder="Laisser vide pour conserver l'actuel"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="submit" className="btn btn-uvci-purple rounded-xl w-full gap-2">
                      <Save size={20} />
                      Enregistrer les modifications
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 italic">
                      Note: Certaines informations critiques (Taux horaire, Email) ne peuvent être modifiées que par l'administration.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Guidelines / Tips */}
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Conseils de sécurité</h4>
              <p className="text-sm text-blue-800/70 mt-1">
                Assurez-vous que vos informations de contact sont à jour pour recevoir les notifications de validation de vos activités pédagogiques. Vos documents personnels sont stockés de manière sécurisée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
