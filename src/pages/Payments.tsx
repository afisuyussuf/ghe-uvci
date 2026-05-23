import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Search, 
  Download, 
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  User,
  Save,
  X,
  Filter,
  Calendar,
  FileText,
  Table as TableIcon,
  Check,
  Edit3
} from 'lucide-react';
import { Paiement, UserProfile, Activite } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { getThemedSwal } from '../lib/swal';
import Pagination from '../components/Pagination';
import { exportListToPDF } from '../lib/pdf';
import * as XLSX from 'xlsx';

type PaymentTab = 'history' | 'pending';

export default function PaymentsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<PaymentTab>('pending');
  const [payments, setPayments] = useState<Paiement[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activite[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchData = async () => {
    try {
      const [payRes, actRes, useRes] = await Promise.all([
        fetch(`/api/paiements${profile?.role !== 'admin' && profile?.role !== 'secretaire' ? `?userId=${profile?.id}` : ''}`).then(r => r.json()),
        fetch(`/api/activities?statut=valide&paye=false${profile?.role !== 'admin' && profile?.role !== 'secretaire' ? `&userId=${profile?.id}` : ''}`).then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);
      setPayments(payRes || []);
      setPendingActivities(actRes || []);
      setUsers(useRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  const handleProcessPayment = async (activity: Activite) => {
    const result = await getThemedSwal().fire({
      title: 'Confirmer le règlement ?',
      text: `Montant : ${activity.montant?.toLocaleString()} FCFA`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/paiements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_utilisateur: activity.id_utilisateur,
            id_activite: activity.id,
            montant: activity.montant,
            date_paiement: new Date().toISOString(),
            mode_paiement: 'Virement',
            statut: 'effectue',
            nom_enseignant: `${activity.user?.prenom} ${activity.user?.nom}`
          })
        });

        if (res.ok) {
          getThemedSwal().fire('Succès', 'Paiement effectué avec succès.', 'success');
          fetchData(); // reload data
        } else {
          getThemedSwal().fire('Erreur', 'Impossible de traiter le règlement.', 'error');
        }
      } catch (error) {
        console.error(error);
        getThemedSwal().fire('Erreur', 'Une erreur est survenue lors du paiement.', 'error');
      }
    }
  };

  const handleExportPDF = () => {
    try {
      if (activeTab === 'pending') {
        const headers = ['Enseignant', 'Intitulé Cours / Activité', 'Volume Horaire', 'Montant'];
        const rows = pendingActivities.map(act => [
          `${act.user?.prenom || ''} ${act.user?.nom || ''}`,
          `${act.cours?.intitule || 'Inconnu'} (${act.type_action})`,
          `${act.volume_horaire} h`,
          `${act.montant?.toLocaleString()} FCFA`
        ]);

        exportListToPDF({
          title: 'Liste des Règlements d\'Heures en Attente',
          headers,
          rows,
          metadata: {
            'Généré par': `${profile?.prenom || ''} ${profile?.nom || ''}`,
            'Rôle': profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'secretaire' ? 'Secrétaire' : 'Enseignant',
            'Prestations en attente': String(pendingActivities.length),
            'Volume horaire cumulé': `${pendingActivities.reduce((sum, a) => sum + (a.volume_horaire || 0), 0)} h`
          }
        });
      } else {
        const headers = ['Date Règlement', 'Enseignant', 'Montant', 'Mode de Règlement', 'Statut'];
        const rows = payments.map(p => {
          const userObj = users.find(u => u.id === p.id_utilisateur);
          const name = p.nom_enseignant || `${userObj?.prenom || ''} ${userObj?.nom || ''}` || 'Inconnu';
          return [
            format(new Date(p.date_paiement), 'dd MMM yyyy HH:mm', { locale: fr }),
            name,
            `${p.montant?.toLocaleString()} FCFA`,
            p.mode_paiement || 'Virement',
            'Effectué'
          ];
        });

        exportListToPDF({
          title: 'Historique des Règlements d\'Heures Effectués',
          headers,
          rows,
          metadata: {
            'Généré par': `${profile?.prenom || ''} ${profile?.nom || ''}`,
            'Rôle': profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'secretaire' ? 'Secrétaire' : 'Enseignant',
            'Virements émis': String(payments.length),
            'Masse salariale réglée': `${payments.reduce((sum, p) => sum + (p.montant || 0), 0).toLocaleString()} FCFA`
          }
        });
      }

      getThemedSwal().fire({
        title: 'Impression en cours',
        text: 'Le PDF officiel UVCI a été préparé.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      getThemedSwal().fire('Erreur', 'Impossible de générer le rapport PDF.', 'error');
    }
  };

  const handleExportExcel = () => {
    try {
      let dataToExport = [];
      let filename = 'reglements.xlsx';

      if (activeTab === 'pending') {
        dataToExport = pendingActivities.map(act => ({
          Enseignant: `${act.user?.prenom || ''} ${act.user?.nom || ''}`,
          Activite: `${act.cours?.intitule || 'Inconnu'} (${act.type_action})`,
          Volume_Horaire_Heures: act.volume_horaire,
          Montant_FCFA: act.montant
        }));
        filename = 'reglements_en_attente.xlsx';
      } else {
        dataToExport = payments.map(p => {
          const userObj = users.find(u => u.id === p.id_utilisateur);
          return {
            Date_Paiement: format(new Date(p.date_paiement), 'yyyy-MM-dd HH:mm'),
            Enseignant: p.nom_enseignant || `${userObj?.prenom || ''} ${userObj?.nom || ''}` || 'Inconnu',
            Montant_FCFA: p.montant,
            Mode_Paiement: p.mode_paiement || 'Virement',
            Statut: 'Effectué'
          };
        });
        filename = 'historique_reglements.xlsx';
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Règlements');
      XLSX.writeFile(workbook, filename);

      getThemedSwal().fire({
        title: 'Export réussi',
        text: 'Le fichier Excel a été généré.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      getThemedSwal().fire('Erreur', 'Impossible d\'exporter au format Excel.', 'error');
    }
  };

  const totalPaidAmount = payments.reduce((sum, p) => sum + (p.montant || 0), 0);
  const totalPendingAmount = pendingActivities.reduce((sum, act) => sum + (act.montant || 0), 0);
  const totalTransactions = payments.length;
  const totalPendingTransactions = pendingActivities.length;
  const paymentRate = (totalPaidAmount + totalPendingAmount > 0)
    ? Math.round((totalPaidAmount / (totalPaidAmount + totalPendingAmount)) * 100)
    : 100;

  // Pagination filters
  const filteredActivities = pendingActivities.filter(act => 
    `${act.user?.prenom} ${act.user?.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (act.cours?.intitule || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = payments.filter(p => {
    const userObj = users.find(u => u.id === p.id_utilisateur);
    const name = p.nom_enseignant || `${userObj?.prenom} ${userObj?.nom}` || 'Inconnu';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.mode_paiement || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const pendingSubset = filteredActivities.slice(
    (pendingPage - 1) * ITEMS_PER_PAGE,
    pendingPage * ITEMS_PER_PAGE
  );

  const historySubset = filteredHistory.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-black flex items-center gap-2">
            <CreditCard className="text-uvci-purple animate-pulse" />
            Gestion des Règlements Financer
          </h1>
          <p className="text-slate-500">Suivi financier des cours, paiements et états validés des enseignants.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF} 
            className="btn btn-outline border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 gap-2 rounded-2xl"
          >
            <FileText size={18} className="text-red-500" />
            Exporter PDF (UVCI)
          </button>
          <button 
            onClick={handleExportExcel} 
            className="btn btn-outline border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 gap-2 rounded-2xl"
          >
            <TableIcon size={18} className="text-emerald-500" />
            Format Excel
          </button>
        </div>
      </div>

      {/* Mini Financial Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payé</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalPaidAmount.toLocaleString()} FCFA</p>
            <p className="text-xs text-slate-500 mt-0.5">{totalTransactions} virement{totalTransactions > 1 ? 's' : ''} effectué{totalTransactions > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Règlements en cours</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalPendingAmount.toLocaleString()} FCFA</p>
            <p className="text-xs text-slate-500 mt-0.5">{totalPendingTransactions} prestation{totalPendingTransactions > 1 ? 's' : ''} en attente</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Prestations</p>
            <p className="text-2xl font-bold text-indigo-950 mt-1">{(totalPaidAmount + totalPendingAmount).toLocaleString()} FCFA</p>
            <p className="text-xs text-slate-500 mt-0.5">Cumul des heures validées</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux de Règlement</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">{paymentRate}%</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${paymentRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="tabs tabs-boxed bg-slate-100 p-1 rounded-2xl inline-flex w-fit">
          <button 
            className={`tab gap-2 rounded-xl transition-all ${activeTab === 'pending' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
            onClick={() => { setActiveTab('pending'); setPendingPage(1); }}
          >
            <Clock size={16} />
            Paiements en attente ({filteredActivities.length})
          </button>
          <button 
            className={`tab gap-2 rounded-xl transition-all ${activeTab === 'history' ? 'tab-active bg-uvci-purple text-white' : 'text-slate-500'}`}
            onClick={() => { setActiveTab('history'); setHistoryPage(1); }}
          >
            <TrendingUp size={16} />
            Historique des paiements ({filteredHistory.length})
          </button>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un enseignant..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPendingPage(1);
              setHistoryPage(1);
            }}
            className="input input-bordered pl-12 rounded-2xl bg-slate-50/50 w-full sm:w-64"
          />
        </div>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                  <th className="p-6">Enseignant</th>
                  <th>Activité</th>
                  <th>Volume</th>
                  <th>Montant</th>
                  <th className="text-right p-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubset.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-black">{act.user?.prenom} {act.user?.nom}</p>
                      <p className="text-xs text-slate-500 uppercase font-mono tracking-wide">{act.user?.role}</p>
                    </td>
                    <td className="text-sm text-black font-medium">{act.cours?.intitule} <span className="text-xs text-slate-400 font-normal">({act.type_action})</span></td>
                    <td className="text-sm text-black font-semibold">{act.volume_horaire} h</td>
                    <td className="text-sm font-bold text-uvci-purple">{act.montant?.toLocaleString()} FCFA</td>
                    <td className="text-right p-6">
                      {(profile?.role === 'admin' || profile?.role === 'secretaire') && (
                        <button 
                          onClick={() => handleProcessPayment(act)}
                          className="btn btn-uvci-purple btn-sm rounded-xl px-4 py-2"
                        >
                          Régler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                      Aucun paiement en attente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={pendingPage}
            totalItems={filteredActivities.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPendingPage}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                  <th className="p-6">Date règlement</th>
                  <th>Enseignant</th>
                  <th>Montant</th>
                  <th>Mode de paiement</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {historySubset.map((p) => {
                   const user = users.find(u => u.id === p.id_utilisateur);
                   const userName = p.nom_enseignant || `${user?.prenom} ${user?.nom}` || 'Inconnu';
                   return (
                    <tr key={p.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                      <td className="p-6 text-sm text-black font-medium">{format(new Date(p.date_paiement), 'dd MMM yyyy HH:mm', { locale: fr })}</td>
                      <td className="text-sm text-black font-semibold">{userName}</td>
                      <td className="text-sm font-bold text-uvci-purple">{p.montant?.toLocaleString()} FCFA</td>
                      <td className="text-sm text-slate-500">{p.mode_paiement || 'Virement'}</td>
                      <td>
                        <span className="badge badge-success badge-sm text-white font-bold px-3 py-1 rounded-full">Effectué</span>
                      </td>
                    </tr>
                  );
                })}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                      Aucun historique de paiement disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={historyPage}
            totalItems={filteredHistory.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setHistoryPage}
          />
        </div>
      )}
    </div>
  );
}
