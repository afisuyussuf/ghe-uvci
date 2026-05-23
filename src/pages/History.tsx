import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Calendar,
  Monitor,
  Globe,
  User,
  Trash2,
  Smartphone,
  Laptop,
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { AuditLog, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Pagination from '../components/Pagination';
import { getThemedSwal } from '../lib/swal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addLogoToDoc } from '../lib/pdfLogo';
import * as XLSX from 'xlsx';

export default function HistoryPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'secretaire')) return;

    const fetchData = async () => {
      try {
        const [logsRes, usersRes] = await Promise.all([
          fetch('/api/audit').then(r => r.json()),
          fetch('/api/users').then(r => r.json())
        ]);
        setLogs(logsRes || []);
        setUsers(usersRes || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [profile]);

  const handleDeleteLog = async (id: string) => {
    const result = await getThemedSwal().fire({
      title: 'Supprimer ?',
      text: "Le log sera supprimé.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/audit/${id}`, { method: 'DELETE' });
        setLogs(prev => prev.filter(l => l.id !== id));
        getThemedSwal().fire('Supprimé', 'Log supprimé.', 'success');
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleClearHistory = async () => {
    const result = await getThemedSwal().fire({
      title: 'Vider tout l\'historique ?',
      text: "Cette action supprimera tous les logs présents.",
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, tout vider'
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/audit', { method: 'DELETE' });
        setLogs([]);
        getThemedSwal().fire('Vidé', 'L\'historique a été vidé.', 'success');
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportPDF = async () => {
    const doc = new jsPDF();
    
    // Add Logo
    await addLogoToDoc(doc, 14, 8, 15, 15);
    
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Journal d\'activités', 35, 18);
    
    autoTable(doc, {
      head: [['Date', 'Action', 'Utilisateur', 'Détails']],
      body: filteredLogs.map(l => [
        format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr }),
        l.action,
        l.userEmail || l.userId,
        l.details
      ]),
      startY: 30
    });
    doc.save('historique.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, "historique.xlsx");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-black flex items-center gap-2">
            <History className="text-uvci-purple" />
            Journal d'activités
          </h1>
          <p className="text-slate-500">Suivi complet des actions effectuées sur la plateforme.</p>
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
          {profile?.role === 'admin' && (
            <button 
              onClick={handleClearHistory}
              className="btn btn-error btn-outline rounded-xl gap-2"
            >
              <Trash2 size={20} />
              Vider tout
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par action, détails ou utilisateur..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-uvci-purple text-sm text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              <th className="p-6">Date</th>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Détails</th>
              <th className="text-right p-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <td className="p-6 text-sm text-black">
                  {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                </td>
                <td>
                  <span className={`badge badge-sm font-bold ${
                    log.action.includes('CREATE') ? 'badge-success text-white' :
                    log.action.includes('DELETE') ? 'badge-error text-white' : 'badge-info text-white'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="text-sm text-black">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    {log.userEmail || 'Système'}
                  </div>
                </td>
                <td className="text-sm text-slate-500 max-w-xs truncate">
                  {log.details}
                </td>
                <td className="text-right p-6">
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {paginatedLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                  Aucun log trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
        <Pagination 
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
