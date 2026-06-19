import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../contexts/ConfigContext';
import { AnneeAcademique, AppNotification } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Book,
  Clock, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  ChevronRight,
  History,
  CreditCard,
  FileText,
  Calendar,
  Check,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playBip } from '../lib/sounds';
import { getThemedSwal } from '../lib/swal';

const menuItems = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'secretaire', 'enseignant'] },
  { path: '/enseignants', label: 'Enseignants', icon: Users, roles: ['admin', 'secretaire'] },
  { path: '/cours', label: 'Cours', icon: BookOpen, roles: ['admin', 'secretaire'] },
  { path: '/activites', label: 'Activités', icon: Clock, roles: ['admin', 'secretaire', 'enseignant'] },
  { path: '/etats', label: 'États d\'heures', icon: FileText, roles: ['admin', 'secretaire', 'enseignant'] },
  { path: '/paiements', label: 'Paiements', icon: CreditCard, roles: ['admin', 'secretaire', 'enseignant'] },
  { path: '/disponibilites', label: 'Disponibilités', icon: Calendar, roles: ['enseignant'] },
  { path: '/profil', label: 'Mon Profil', icon: Users, roles: ['admin', 'secretaire', 'enseignant'] },
  { path: '/historique', label: 'Historique', icon: History, roles: ['admin', 'secretaire'] },
  { path: '/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { path: '/parametres', label: 'Paramètres', icon: Settings, roles: ['admin'] },
  { path: '/guide', label: 'Guide d\'utilisateurs', icon: Book, roles: ['admin', 'secretaire', 'enseignant'] },
];

export default function Layout() {
  const { profile, logout } = useAuth();
  const { config } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeAnnee, setActiveAnnee] = useState<AnneeAcademique | null>(null);
  const [visiblePaths, setVisiblePaths] = useState<string[]>([]);

  useEffect(() => {
    const role = profile?.role;
    if (!role) return;

    fetch(`/api/permissions/${role}`)
      .then(res => res.json())
      .then(data => {
        setVisiblePaths(data.visible_paths || []);
      })
      .catch(err => {
        const defaults = menuItems
          .filter(item => item.roles.includes(role))
          .map(item => item.path);
        setVisiblePaths(defaults);
      });
  }, [profile?.role]);

  const filteredMenuItems = menuItems.filter(item => 
    visiblePaths.includes(item.path)
  );

  useEffect(() => {
    fetch('/api/annees')
      .then(res => res.json())
      .then(list => {
        const active = (list as AnneeAcademique[]).find(a => a.id === config.defaultAnneeId) || (list as AnneeAcademique[]).find(a => a.actif);
        if (active) {
          setActiveAnnee(active);
        }
      });
  }, [config.defaultAnneeId]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotifs = () => {
      fetch(`/api/notifications?userId=${profile.id}`)
        .then(res => res.json())
        .then(notifs => {
          if (Array.isArray(notifs)) {
            setNotifications(notifs);
          } else {
            console.error('Invalid notifications response:', notifs);
            setNotifications([]);
          }
        })
        .catch(err => {
          console.warn('Temporary connection issue fetching notifications (the dev server might be restarting):', err.message || err);
          setNotifications([]);
        });
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [profile?.id]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lu: true })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.lu);
      for (const n of unread) {
        await markAsRead(n.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    playBip();
    const result = await getThemedSwal().fire({
      title: 'Déconnexion',
      text: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, me déconnecter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center gap-4">
            <div className={`flex items-center justify-center flex-shrink-0 ${isSidebarOpen ? 'w-full' : 'w-10'} bg-white rounded-2xl p-2`}>
              <img 
                src="https://lh3.googleusercontent.com/d/1fVHD32zx_GEBKBP7kJN8vM6tu227kvMF" 
                alt={config.appName} 
                className={`object-contain transition-all ${isSidebarOpen ? 'h-16' : 'h-10'}`}
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={playBip}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-uvci-purple text-white shadow-lg shadow-uvci-purple/20' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <item.icon size={24} className="flex-shrink-0" />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100">
            <Link 
              to="/profil"
              className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors ${!isSidebarOpen && 'justify-center'}`}
            >
              <div className="w-10 h-10 rounded-full bg-uvci-green flex items-center justify-center text-white font-bold flex-shrink-0">
                {profile?.nom?.[0] || 'U'}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{profile?.prenom} {profile?.nom}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{profile?.role}</p>
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full mt-4 flex items-center gap-4 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all ${!isSidebarOpen && 'justify-center'}`}
            >
              <LogOut size={24} />
              {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-uvci-purple w-64 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => {
                  playBip();
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                className={`p-2 hover:bg-slate-100 rounded-full text-slate-500 relative transition-all ${isNotificationsOpen ? 'bg-slate-100' : ''}`}
              >
                <Bell size={24} />
                {notifications.filter(n => !n.lu).length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-0.5 animate-pulse">
                    {notifications.filter(n => !n.lu).length > 9 ? '9+' : notifications.filter(n => !n.lu).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {notifications.filter(n => !n.lu).length > 0 && (
                            <button 
                              onClick={markAllAsRead}
                              className="text-[10px] font-bold text-uvci-purple hover:underline"
                            >
                              Tout lire
                            </button>
                          )}
                          <span className="text-xs bg-uvci-purple text-white px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.lu).length}
                          </span>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 hover:bg-slate-50 transition-colors relative group ${!notif.lu ? 'bg-uvci-purple/5' : ''}`}
                              >
                                <div className="flex gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    notif.type === 'success' ? 'bg-uvci-green' :
                                    notif.type === 'error' ? 'bg-red-500' :
                                    notif.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notif.lu ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                      {notif.titre}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      {new Date(notif.date).toLocaleString('fr-FR')}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notif.lu && (
                                      <button 
                                        onClick={() => markAsRead(notif.id)}
                                        className="p-1 hover:bg-uvci-purple/10 rounded text-uvci-purple"
                                        title="Marquer comme lu"
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => deleteNotification(notif.id)}
                                      className="p-1 hover:bg-red-50 rounded text-red-500"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                              <Bell size={32} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Aucune notification</p>
                              <p className="text-xs text-slate-500 mt-1">Vous êtes à jour ! Revenez plus tard.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 text-center border-t border-slate-50">
                        <button 
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            navigate('/activites'); // Or a dedicated notifications page if we had one
                          }}
                          className="text-xs font-bold text-uvci-purple hover:underline"
                        >
                          Voir mes activités
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="hidden sm:inline">Année Académique:</span>
              <span className="bg-uvci-green/10 text-uvci-green px-3 py-1 rounded-full font-bold">
                {activeAnnee ? activeAnnee.libelle : 'Non définie'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
