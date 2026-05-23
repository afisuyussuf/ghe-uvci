import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Search, 
  Download, 
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileDown,
  User,
  Calendar,
  Table as TableIcon
} from 'lucide-react';
import { EtatHeures, UserProfile, Activite } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../contexts/ConfigContext';
import { getThemedSwal } from '../lib/swal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addLogoToDoc } from '../lib/pdfLogo';
import * as XLSX from 'xlsx';

export default function HoursStatesPage() {
  const { profile } = useAuth();
  const { config } = useConfig();
  const [states, setStates] = useState<EtatHeures[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    const fetchData = async () => {
      try {
        const [statesRes, usersRes] = await Promise.all([
          fetch(`/api/etats_heures${profile.role !== 'admin' && profile.role !== 'secretaire' ? `?userId=${profile.id}` : ''}`).then(r => r.json()),
          fetch('/api/users').then(r => r.json())
        ]);
        setStates(statesRes || []);
        setUsers(usersRes || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [profile]);

  const generateStates = async () => {
    setIsGenerating(true);
    try {
      const chargeAnnuelle = config.chargeHoraireAnnuelle || 192;
      await fetch('/api/etats_heures/generate', { method: 'POST' });
      const res = await fetch(`/api/etats_heures${profile?.role !== 'admin' && profile?.role !== 'secretaire' ? `?userId=${profile?.id}` : ''}`);
      setStates(await res.json());
      getThemedSwal().fire('Succès', 'États d\'heures générés avec succès.', 'success');
    } catch (error) {
      console.error(error);
      getThemedSwal().fire('Erreur', 'Impossible de générer.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = async (state: EtatHeures) => {
    const doc = new jsPDF();
    
    // Add Logo
    await addLogoToDoc(doc, 14, 8, 15, 15);
    
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text(`Etat d'Heures - ${state.periode}`, 35, 18);
    
    const user = users.find(u => u.id === state.id_utilisateur);
    const userName = state.nom_enseignant || `${user?.prenom} ${user?.nom}` || 'Inconnu';
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Enseignant: ${userName}`, 35, 25);
    
    autoTable(doc, {
      head: [['Détails', 'Heures', 'Montant']],
      body: [
        ['Total Heures', state.total_heures, `${state.montant_total} FCFA`]
      ],
      startY: 35
    });
    doc.save(`etat_heures_${userName}_${state.periode}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-black flex items-center gap-2">
            <FileText className="text-uvci-purple" />
            États d'heures
          </h1>
          <p className="text-slate-500">Gérez et téléchargez les relevés mensuels des prestations.</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
          <button 
            onClick={generateStates}
            disabled={isGenerating}
            className={`btn btn-uvci-purple rounded-xl gap-2 shadow-lg shadow-uvci-purple/20 ${isGenerating ? 'loading' : ''}`}
          >
            {!isGenerating && <RefreshCw size={20} />}
            {isGenerating ? 'Génération...' : 'Générer les états du mois'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              <th className="p-6">Période</th>
              <th>Enseignant</th>
              <th>Heures</th>
              <th>Montant</th>
              <th>Statut</th>
              <th className="text-right p-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {states.map((state) => {
               const user = users.find(u => u.id === state.id_utilisateur);
               const userName = state.nom_enseignant || `${user?.prenom} ${user?.nom}` || 'Inconnu';
               return (
                <tr key={state.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="p-6 text-sm font-bold text-black">{state.periode}</td>
                  <td className="text-sm text-black">{userName}</td>
                  <td className="text-sm text-black">{state.total_heures}h</td>
                  <td className="text-sm font-bold text-uvci-purple">{state.montant_total} FCFA</td>
                  <td>
                    <span className={`badge badge-sm font-bold ${
                      state.statut === 'valide' ? 'badge-success text-white' : 
                      state.statut === 'paye' ? 'badge-info text-white' : 'badge-warning text-white'
                    }`}>
                      {state.statut}
                    </span>
                  </td>
                  <td className="text-right p-6">
                    <button 
                      onClick={() => exportPDF(state)}
                      className="btn btn-ghost btn-sm text-uvci-purple hover:bg-uvci-purple/5 rounded-lg gap-2"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                  </td>
                </tr>
              );
            })}
            {states.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                  Aucun état d'heures trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
