import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  User,
  Trash2,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Globe,
  FileText,
  Table as TableIcon,
  Wifi,
  Chrome
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

function DeviceIcon({ device }: { device?: string }) {
  if (!device) return <Monitor size={14} className="text-slate-400" />;
  const d = device.toLowerCase();
  if (d.includes('mobile')) return <Smartphone size={14} className="text-blue-500" />;
  if (d.includes('tablette') || d.includes('tablet')) return <Tablet size={14} className="text-purple-500" />;
  return <Laptop size={14} className="text-green-600" />;
}

function getActionBadgeClass(action: string) {
  if (action === 'LOGIN') return 'badge-primary text-white';
  if (action.includes('CREATE')) return 'badge-success text-white';
  if (action.includes('DELETE')) return 'badge-error text-white';
  if (action.includes('UPDATE') || action.includes('EDIT')) return 'badge-warning text-white';
  return 'badge-info text-white';
}

export default function HistoryPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');

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

  // Get unique action types for filter
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.device || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterAction ? log.action === filterAction : true;
    return matchSearch && matchFilter;
  });

  const totalItems = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const loginCount = logs.filter(l => l.action === 'LOGIN').length;
  const mobileCount = logs.filter(l => (l.device || '').toLowerCase().includes('mobile')).length;
  const desktopCount = logs.filter(l => (l.device || '').toLowerCase().includes('desktop')).length;

  const exportPDF = async () => {
    const doc = new jsPDF();
    
    // Add Logo
    await addLogoToDoc(doc, 14, 8, 15, 15);
    
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Journal d\'activités', 35, 18);
    
    autoTable(doc, {
      head: [['Date', 'Action', 'Utilisateur', 'Appareil', 'IP', 'Détails']],
      body: filteredLogs.map(l => [
        format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr }),
        l.action,
        l.userEmail || l.userId,
        l.device || '—',
        l.ip_address || '—',
        l.details
      ]),
      startY: 30
    });
    doc.save('historique.pdf');
  };

  const exportExcel = () => {
    const exportData = filteredLogs.map(l => ({
      Date: format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr }),
      Action: l.action,
      Utilisateur: l.userEmail || l.userId,
      Appareil: l.device || '—',
      IP: l.ip_address || '—',
      Détails: l.details
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
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

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Globe size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total logs</p>
            <p className="text-xl font-bold text-black">{logs.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Wifi size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Connexions</p>
            <p className="text-xl font-bold text-black">{loginCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Smartphone size={20} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Mobiles</p>
            <p className="text-xl font-bold text-black">{mobileCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Laptop size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Desktop</p>
            <p className="text-xl font-bold text-black">{desktopCount}</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par action, utilisateur, appareil, IP..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-uvci-purple text-sm text-black"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
            className="py-3 px-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-uvci-purple text-sm text-black"
          >
            <option value="">Toutes les actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-400">{filteredLogs.length} résultat(s) trouvé(s)</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <th className="p-6">Date</th>
                <th>Action</th>
                <th>Utilisateur</th>
                <th>Appareil</th>
                <th>Adresse IP</th>
                <th>Détails</th>
                {profile?.role === 'admin' && <th className="text-right p-6">Suppr.</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="p-6 text-sm text-black whitespace-nowrap">
                    {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </td>
                  <td>
                    <span className={`badge badge-sm font-bold ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="text-sm text-black">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      {log.userEmail || 'Système'}
                    </div>
                  </td>
                  <td className="text-sm">
                    <div className="flex items-center gap-2 text-slate-600 whitespace-nowrap">
                      <DeviceIcon device={log.device} />
                      <span className="max-w-[140px] truncate" title={log.device}>
                        {log.device || <span className="text-slate-300 italic">—</span>}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm font-mono text-slate-500">
                    {log.ip_address ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-xs">{log.ip_address}</span>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>
                  <td className="text-sm text-slate-500 max-w-xs truncate">
                    {log.details}
                  </td>
                  {profile?.role === 'admin' && (
                    <td className="text-right p-6">
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                    Aucun log trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
