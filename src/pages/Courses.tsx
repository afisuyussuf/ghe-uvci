import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  Hash,
  X,
  Clock,
  ChevronRight,
  ChevronLeft,
  FileText,
  Type,
  List,
  Upload,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Cours, Filiere, Niveau, Ressource, Sequence, Semestre } from '../types';
import Pagination from '../components/Pagination';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../hooks/useAuth';
import { getThemedSwal } from '../lib/swal';

type ViewMode = 'courses' | 'resources' | 'sequences';

export default function CoursesPage() {
  const { profile } = useAuth();
  const { config } = useConfig();
  const [viewMode, setViewMode] = useState<ViewMode>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Cours | null>(null);
  const [selectedResource, setSelectedResource] = useState<Ressource | null>(null);

  const [courses, setCourses] = useState<Cours[]>([]);
  const [resources, setResources] = useState<Ressource[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    code: '',
    libelle: '',
    id_filiere: '',
    id_niveau: '',
    id_semestre: '',
    nb_heures: 0,
    credits: 0,
    description: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, fRes, nRes, sRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/filieres'),
          fetch('/api/niveaux'),
          fetch('/api/semestres')
        ]);
        setCourses(await cRes.json());
        setFilieres(await fRes.json());
        setNiveaux(await nRes.json());
        setSemestres(await sRes.json());
      } catch (err) {
        console.error("Failed to fetch courses data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (viewMode === 'resources' && selectedCourse) {
      fetch(`/api/ressources?id_cours=${selectedCourse.id}`)
        .then(res => res.json())
        .then(setResources);
    }
    if (viewMode === 'sequences' && selectedResource) {
      fetch(`/api/sequences?id_ressource=${selectedResource.id}`)
        .then(res => res.json())
        .then(setSequences);
    }
  }, [viewMode, selectedCourse, selectedResource]);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    if (viewMode === 'courses') {
      setFormData(item || { nb_heures: 0, nb_sequences: 0 });
    } else if (viewMode === 'resources') {
      setFormData(item || { id_cours: selectedCourse?.id, type: 'PDF' });
    } else if (viewMode === 'sequences') {
      setFormData(item || { id_ressource: selectedResource?.id, numero: sequences.length + 1 });
    }
    setIsModalOpen(true);
  };

  const handleHoursChange = (hours: number) => {
    setFormData({
      ...formData,
      nb_heures: hours,
      nb_sequences: hours * 4
    });
  };

  const handleDelete = async (id: string, resourceType: string) => {
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
        let endpoint = '/api/courses';
        if (resourceType === 'ressources') endpoint = '/api/ressources';
        if (resourceType === 'sequences') endpoint = '/api/sequences';

        const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          getThemedSwal().fire('Supprimé', 'L\'élément a été supprimé.', 'success');
          // Update local state
          if (resourceType === 'cours') setCourses(courses.filter(c => c.id !== id));
          if (resourceType === 'ressources') setResources(resources.filter(r => r.id !== id));
          if (resourceType === 'sequences') setSequences(sequences.filter(s => s.id !== id));
        }
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Impossible de supprimer.', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resourceType = viewMode === 'courses' ? 'cours' : viewMode === 'resources' ? 'ressources' : 'sequences';
    let endpoint = '/api/courses';
    if (viewMode === 'resources') endpoint = '/api/ressources';
    if (viewMode === 'sequences') endpoint = '/api/sequences';
    
    try {
      setIsUploading(true);
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(viewMode === 'courses' ? { id_annee_academique: config.defaultAnneeId || '2025-2026' } : {})
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        getThemedSwal().fire('Succès', 'Enregistré avec succès.', 'success');
        // Refresh appropriate list
        if (viewMode === 'courses') fetch('/api/courses').then(r => r.json()).then(setCourses);
        if (viewMode === 'resources' && selectedCourse) fetch(`/api/ressources?id_cours=${selectedCourse.id}`).then(r => r.json()).then(setResources);
        if (viewMode === 'sequences' && selectedResource) fetch(`/api/sequences?id_ressource=${selectedResource.id}`).then(r => r.json()).then(setSequences);
      }
    } catch (error) {
      console.error(error);
      getThemedSwal().fire('Erreur', 'Impossible d\'enregistrer.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const navigateToResources = (course: Cours) => {
    setSelectedCourse(course);
    setViewMode('resources');
  };

  const navigateToSequences = (resource: Ressource) => {
    setSelectedResource(resource);
    setViewMode('sequences');
  };

  const goBack = () => {
    if (viewMode === 'sequences') setViewMode('resources');
    else if (viewMode === 'resources') setViewMode('courses');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {viewMode !== 'courses' && (
            <button onClick={goBack} className="btn btn-ghost btn-circle">
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-display font-bold text-black">
              {viewMode === 'courses' ? 'Catalogue des Cours' : 
               viewMode === 'resources' ? `Ressources: ${selectedCourse?.intitule}` : 
               `Séquences: ${selectedResource?.titre}`}
            </h1>
            <p className="text-slate-500">
              {viewMode === 'courses' ? 'Gérez les maquettes pédagogiques et les crédits ECTS.' : 
               viewMode === 'resources' ? 'Gérez les supports de cours pour cette unité d\'enseignement.' : 
               'Gérez les séquences pédagogiques pour cette ressource.'}
            </p>
          </div>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-uvci-purple rounded-xl gap-2 shadow-lg shadow-uvci-purple/20"
          >
            <Plus size={20} />
            {viewMode === 'courses' ? 'Ajouter un cours' : viewMode === 'resources' ? 'Ajouter une ressource' : 'Ajouter une séquence'}
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      {viewMode !== 'courses' && (
        <div className="text-sm breadcrumbs text-slate-500">
          <ul>
            <li><button onClick={() => setViewMode('courses')}>Cours</button></li>
            {viewMode === 'resources' && <li className="font-bold text-uvci-purple">{selectedCourse?.intitule}</li>}
            {viewMode === 'sequences' && (
              <>
                <li><button onClick={() => setViewMode('resources')}>{selectedCourse?.intitule}</button></li>
                <li className="font-bold text-uvci-purple">{selectedResource?.titre}</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              {viewMode === 'courses' ? (
                <>
                  <th className="p-6">Code & Intitulé</th>
                  <th>Filière & Niveau</th>
                  <th>Semestre</th>
                  <th>Volume Horaire</th>
                  <th>Séquences</th>
                </>
              ) : viewMode === 'resources' ? (
                <>
                  <th className="p-6">Titre de la Ressource</th>
                  <th>Type</th>
                  <th>Support PDF</th>
                  <th>Description</th>
                </>
              ) : (
                <>
                  <th className="p-6">N°</th>
                  <th>Titre de la Séquence</th>
                  <th>Description</th>
                </>
              )}
              <th className="text-right p-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {viewMode === 'courses' && courses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((course) => (
              <tr key={course.id} className="hover:bg-uvci-purple/5 transition-colors border-b border-slate-50 last:border-0">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-black">{course.intitule}</div>
                      <div className="text-xs font-mono text-slate-400 uppercase">{course.code_cours}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Layers size={14} className="text-slate-400" />
                      {filieres.find(f => f.id === course.id_filiere)?.libelle || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <GraduationCap size={14} />
                      {niveaux.find(n => n.id === course.id_niveau)?.libelle || 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    {semestres.find(s => s.id === course.id_semestre)?.libelle || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Clock size={16} className="text-uvci-purple" />
                    {course.nb_heures}h
                    <span className="badge badge-sm badge-ghost font-normal">{course.nb_credits} ECTS</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Hash size={16} className="text-uvci-green" />
                    {course.nb_sequences}
                  </div>
                </td>
                <td className="text-right p-6 space-x-2">
                  <button 
                    onClick={() => navigateToResources(course)}
                    className="btn btn-ghost btn-sm text-uvci-purple hover:bg-uvci-purple/5 rounded-lg gap-2"
                    title="Gérer les ressources"
                  >
                    <Layers size={16} />
                    Ressources
                  </button>
                  {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                    <button 
                      onClick={() => handleOpenModal(course)}
                      className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(course.id, 'cours')}
                      className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {viewMode === 'resources' && resources.map((res) => (
              <tr key={res.id} className="hover:bg-uvci-purple/5 transition-colors border-b border-slate-50 last:border-0">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <FileText size={20} />
                    </div>
                    <div className="font-bold text-black">{res.titre}</div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-ghost font-bold">{res.type}</span>
                </td>
                <td>
                  {res.pdf_url ? (
                    <a 
                      href={res.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-xs text-uvci-purple gap-2"
                    >
                      <Eye size={14} />
                      Visualiser
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Aucun fichier</span>
                  )}
                </td>
                <td className="text-sm text-slate-500 max-w-xs truncate">{res.description || 'Aucune description'}</td>
                <td className="text-right p-6 space-x-2">
                  <button 
                    onClick={() => navigateToSequences(res)}
                    className="btn btn-ghost btn-sm text-uvci-green hover:bg-uvci-green/5 rounded-lg gap-2"
                    title="Gérer les séquences"
                  >
                    <List size={16} />
                    Séquences
                  </button>
                  {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                    <button 
                      onClick={() => handleOpenModal(res)}
                      className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                    <button 
                      onClick={() => handleDelete(res.id, 'ressources')}
                      className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {viewMode === 'sequences' && sequences.map((seq) => (
              <tr key={seq.id} className="hover:bg-uvci-purple/5 transition-colors border-b border-slate-50 last:border-0">
                <td className="p-6 font-mono font-bold text-uvci-purple">#{seq.numero}</td>
                <td>
                  <div className="font-bold text-black">{seq.titre}</div>
                </td>
                <td className="text-sm text-slate-500">{seq.description || 'Aucune description'}</td>
                <td className="text-right p-6 space-x-2">
                  {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                    <button 
                      onClick={() => handleOpenModal(seq)}
                      className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                    <button 
                      onClick={() => handleDelete(seq.id, 'sequences')}
                      className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {((viewMode === 'courses' && courses.length === 0) || 
              (viewMode === 'resources' && resources.length === 0) || 
              (viewMode === 'sequences' && sequences.length === 0)) && (
              <tr>
                <td colSpan={6} className="text-center p-12 text-slate-400 italic">
                  Aucun élément trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {viewMode === 'courses' && (
          <div className="p-4 border-t border-slate-100">
            <Pagination 
              currentPage={currentPage}
              totalItems={courses.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl rounded-3xl p-8 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-display font-bold text-uvci-purple">
              {editingItem ? 'Modifier' : 'Ajouter'} {viewMode === 'courses' ? 'un cours' : viewMode === 'resources' ? 'une ressource' : 'une séquence'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {viewMode === 'courses' ? (
              <>
                <div className="form-control col-span-1 md:col-span-2">
                  <label className="label font-bold text-black">Intitulé du Cours</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Programmation Web Avancée"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.intitule || ''}
                    onChange={(e) => setFormData({...formData, intitule: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Code Cours</label>
                  <input 
                    type="text" 
                    placeholder="Ex: INF301"
                    className="input input-bordered bg-slate-50 rounded-xl font-mono text-black"
                    value={formData.code_cours || ''}
                    onChange={(e) => setFormData({...formData, code_cours: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Crédits ECTS</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 6"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.nb_credits || ''}
                    onChange={(e) => setFormData({...formData, nb_credits: Number(e.target.value)})}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Nombre d'Heures</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 40"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.nb_heures || ''}
                    onChange={(e) => handleHoursChange(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Nombre de Séquences (Auto)</label>
                  <input 
                    type="number" 
                    className="input input-bordered bg-slate-100 rounded-xl font-bold text-uvci-purple"
                    value={formData.nb_sequences || 0}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Filière</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.id_filiere || ''}
                    onChange={(e) => setFormData({...formData, id_filiere: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une filière</option>
                    {filieres.map(f => <option key={f.id} value={f.id}>{f.libelle}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Niveau</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.id_niveau || ''}
                    onChange={(e) => setFormData({...formData, id_niveau: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un niveau</option>
                    {niveaux.map(n => <option key={n.id} value={n.id}>{n.libelle}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Semestre</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.id_semestre || ''}
                    onChange={(e) => setFormData({...formData, id_semestre: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un semestre</option>
                    {semestres.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                  </select>
                </div>
              </>
            ) : viewMode === 'resources' ? (
              <>
                <div className="form-control col-span-1 md:col-span-2">
                  <label className="label font-bold text-black">Titre de la Ressource</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Support de cours PDF"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.titre || ''}
                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Type</label>
                  <select 
                    className="select select-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.type || ''}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="PDF">PDF</option>
                    <option value="Video">Vidéo</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Interactive">Interactif</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Fichier PDF (Optionnel)</label>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="file-input file-input-bordered bg-slate-50 rounded-xl text-black"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="form-control col-span-1 md:col-span-2">
                  <label className="label font-bold text-black">Description</label>
                  <textarea 
                    className="textarea textarea-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-control">
                  <label className="label font-bold text-black">Numéro de Séquence</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 1"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.numero || ''}
                    onChange={(e) => setFormData({...formData, numero: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-black">Titre de la Séquence</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Introduction aux bases de données"
                    className="input input-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.titre || ''}
                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control col-span-1 md:col-span-2">
                  <label className="label font-bold text-black">Description / Objectifs</label>
                  <textarea 
                    className="textarea textarea-bordered bg-slate-50 rounded-xl text-black"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </>
            )}

            {isUploading && (
              <div className="col-span-1 md:col-span-2 space-y-2">
                <div className="flex justify-between text-xs font-bold text-uvci-purple">
                  <span>Téléchargement...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <progress className="progress progress-primary w-full h-2" value={uploadProgress} max="100"></progress>
              </div>
            )}

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
    </div>
  );
}
