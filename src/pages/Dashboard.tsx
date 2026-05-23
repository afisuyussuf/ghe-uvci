import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock3,
  BarChart3,
  Calendar,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ActivitePedagogique, UserProfile, AnneeAcademique, Departement } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../contexts/ConfigContext';
import { Filter } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { config } = useConfig();
  const [stats, setStats] = useState({
    teachers: 0,
    courses: 0,
    validatedHours: 0,
    pendingActivities: 0,
    overloadedTeachers: 0
  });

  const [recentActivities, setRecentActivities] = useState<ActivitePedagogique[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [selectedAnneeId, setSelectedAnneeId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [chartData, setChartData] = useState<{ name: string, heures: number }[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<{ name: string, value: number }[]>([]);
  const COLORS = ['#5A2D82', '#009245', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (!profile) return;

    // Fetch Annees
    fetch('/api/annees').then(res => res.json()).then(list => {
      setAnnees(list);
      if (config.defaultAnneeId) {
        setSelectedAnneeId(config.defaultAnneeId);
      } else if (list.length > 0) {
        const active = (list as any[]).find(a => a.actif);
        setSelectedAnneeId(active ? active.id : list[0].id);
      }
    });

    // Fetch Departments
    fetch('/api/departements').then(res => res.json()).then(setDepartements);

    // Fetch Users
    fetch('/api/users').then(res => res.json()).then(data => {
      setUsers(data);
      if (profile.role === 'admin' || profile.role === 'secretaire') {
        setStats(prev => ({ ...prev, teachers: data.filter((u: any) => u.role === 'enseignant').length }));
      }
    });

    // Fetch Courses count
    fetch('/api/courses').then(res => res.json()).then(data => {
      setStats(prev => ({ ...prev, courses: data.length }));
    });

  }, [profile]);

  useEffect(() => {
    if (!selectedAnneeId || !profile) return;

    const fetchActivities = async () => {
      const url = profile.role === 'admin' || profile.role === 'secretaire' 
        ? `/api/activities?anneeId=${selectedAnneeId}` 
        : `/api/activities?userId=${profile.id}&anneeId=${selectedAnneeId}`;
      
      const res = await fetch(url);
      const activities: ActivitePedagogique[] = await res.json();
      
      let filtered = activities;
      if (selectedDeptId) {
        filtered = activities.filter(a => {
          const teacher = users.find(u => u.id === (a as any).id_user || a.id_utilisateur);
          return teacher?.id_departement === selectedDeptId;
        });
      }

      let totalHours = 0;
      let pending = 0;
      const chargeAnnuelle = 192; // Default for now
      const teacherHours: Record<string, number> = {};
      const monthlyData: { [key: string]: number } = {
        'Jan': 0, 'Fév': 0, 'Mar': 0, 'Avr': 0, 'Mai': 0, 'Juin': 0,
        'Juil': 0, 'Août': 0, 'Sept': 0, 'Oct': 0, 'Nov': 0, 'Déc': 0
      };

      filtered.forEach(data => {
        if (data.statut === 'valide') {
          totalHours += data.volume_horaire || 0;
          const uId = (data as any).id_user || data.id_utilisateur;
          teacherHours[uId] = (teacherHours[uId] || 0) + (data.volume_horaire || 0);
          
          if (data.date_saisie) {
            const date = new Date(data.date_saisie);
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
            const monthLabel = monthNames[date.getMonth()];
            monthlyData[monthLabel] += data.volume_horaire || 0;
          }
        }
        if (data.statut === 'en_attente') pending++;
      });

      const overloaded = Object.values(teacherHours).filter(h => h > chargeAnnuelle).length;
      
      // Calculate course distribution
      const coursesMap: Record<string, number> = {};
      filtered.forEach(a => {
        if (a.statut === 'valide') {
          const courseName = (a as any).cours?.intitule || 'Autre';
          coursesMap[courseName] = (coursesMap[courseName] || 0) + (a.volume_horaire || 0);
        }
      });
      setCourseDistribution(Object.entries(coursesMap).map(([name, value]) => ({ name, value })));
      
      setStats(prev => ({ 
        ...prev, 
        validatedHours: totalHours, 
        pendingActivities: pending, 
        overloadedTeachers: overloaded 
      }));
      setRecentActivities(filtered.slice(0, 5));
      
      setChartData(Object.keys(monthlyData).map(key => ({
        name: key,
        heures: monthlyData[key]
      })));
    };

    fetchActivities();
  }, [selectedAnneeId, selectedDeptId, users, profile]);

  const statCards = [
    ...(profile?.role === 'admin' || profile?.role === 'secretaire' ? [
      { label: 'Total Enseignants', value: stats.teachers.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Cours Actifs', value: stats.courses.toString(), icon: BookOpen, color: 'text-uvci-purple', bg: 'bg-uvci-purple/10' },
    ] : []),
    { label: profile?.role === 'enseignant' ? 'Mes Heures Validées' : 'Heures Validées', value: `${stats.validatedHours.toFixed(1)}h`, icon: CheckCircle2, color: 'text-uvci-green', bg: 'bg-uvci-green/10' },
    { label: profile?.role === 'enseignant' ? 'Mes Saisies en Attente' : 'En Attente', value: stats.pendingActivities.toString(), icon: Clock3, color: 'text-orange-600', bg: 'bg-orange-50' },
    ...(profile?.role === 'enseignant' ? [
      { label: 'Rémunération Est.', value: `${(stats.validatedHours * (profile?.taux_horaire || 0)).toLocaleString()} FCFA`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Taux Horaire Actuel', value: `${(profile?.taux_horaire || 0).toLocaleString()} F/h`, icon: TrendingUp, color: 'text-uvci-purple', bg: 'bg-uvci-purple/10' }
    ] : []),
    ...(profile?.role === 'admin' || profile?.role === 'secretaire' ? [
      { label: 'Enseignants Surchargés', value: stats.overloadedTeachers.toString(), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    ] : []),
  ];
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">
              Tableau de bord 
              {profile?.role && (
                <span className="text-uvci-purple ml-2">
                  ({profile.role === 'admin' ? 'Admin' : profile.role === 'secretaire' ? 'Secrétaire' : 'Enseignant'})
                </span>
              )}
            </h1>
            <p className="text-slate-500">Bienvenue sur votre espace de gestion GHE UVCI.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              <option value="">Tous les départements</option>
              {departements.map(d => (
                <option key={d.id} value={d.id}>{d.libelle}</option>
              ))}
            </select>
          </div>
          {profile?.role === 'enseignant' && (
            <div className="flex items-center gap-2 bg-uvci-purple/10 px-4 py-2 rounded-2xl shadow-sm border border-uvci-purple/20">
              <span className="text-xs font-bold text-uvci-purple uppercase tracking-wider">Espace Enseignant</span>
            </div>
          )}
          {(profile?.role === 'secretaire' || profile?.role === 'admin') && (
            <div className="flex items-center gap-2 bg-uvci-green/10 px-4 py-2 rounded-2xl shadow-sm border border-uvci-green/20">
              <span className="text-xs font-bold text-uvci-green uppercase tracking-wider">Espace {profile.role === 'admin' ? 'Admin' : 'Secrétaire'}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-uvci-green animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Système en ligne</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Analytical Bento Layout */}
      {profile?.role === 'enseignant' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Column: Time Series & Activity Feeds (Width: 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Volume Horaire Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="text-uvci-purple" />
                  Volume Horaire Mensuel
                </h2>
                <select 
                  className="select select-sm select-ghost bg-slate-50 rounded-lg text-xs"
                  value={selectedAnneeId}
                  onChange={(e) => setSelectedAnneeId(e.target.value)}
                >
                  {annees.map(a => (
                    <option key={a.id} value={a.id}>{a.libelle} {a.actif ? '(Active)' : ''}</option>
                  ))}
                  {annees.length === 0 && <option value="">Aucune année</option>}
                </select>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHeures" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5A2D82" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#5A2D82" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#fff',
                        color: '#1e293b'
                      }}
                    />
                    <Area type="monotone" dataKey="heures" stroke="#5A2D82" strokeWidth={3} fillOpacity={1} fill="url(#colorHeures)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Activities Feed */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-uvci-green" />
                  Activités Récentes
                </h2>
                <button 
                  onClick={() => navigate('/activites')} 
                  className="text-xs font-bold text-uvci-purple hover:underline"
                >
                  Déclarer une heure
                </button>
              </div>
              <div className="space-y-6">
                {recentActivities.map((activity) => {
                  const user = users.find(u => u.id === activity.id_utilisateur);
                  return (
                    <div key={activity.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50/50 p-2 rounded-2xl transition-all">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        activity.statut === 'valide' ? 'bg-uvci-green/10 text-uvci-green' : 
                        activity.statut === 'rejete' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                      }`}>
                        <Clock size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{(activity as any).cours?.intitule || activity.type_action} - {activity.volume_horaire}h</p>
                        <p className="text-xs text-slate-500">
                          {activity.type_action} ({activity.nb_sequences} séq.) - {new Date(activity.date_saisie).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`badge badge-sm font-bold px-3 py-2 border-none ${
                          activity.statut === 'valide' ? 'bg-uvci-green/10 text-uvci-green font-extrabold' : 
                          activity.statut === 'rejete' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {activity.statut === 'valide' ? 'Validé' : activity.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic">
                    Aucune activité récente enregistrée pour cette période.
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/activites')}
                className="w-full mt-8 btn btn-ghost text-uvci-purple hover:bg-uvci-purple/5 rounded-xl text-xs font-bold"
              >
                Voir tout l'historique de mes déclarations
              </button>
            </motion.div>
          </div>

          {/* Sidebar Column: Strategic metrics, progression, course shares (Width: 1/3) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Highly Polished Target Progress Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Objectif Annuel</h2>
                    <p className="text-xs text-slate-400 font-medium">Charge de service requise</p>
                  </div>
                  <span className="text-uvci-purple font-extrabold text-lg bg-uvci-purple/10 px-3.5 py-1 rounded-2xl">
                    {Math.min(100, (stats.validatedHours / 1.92)).toFixed(1)}%
                  </span>
                </div>

                {/* Styled Stepper Progress Track */}
                <div className="space-y-4 my-6">
                  <div className="relative w-full bg-slate-100 h-5 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stats.validatedHours / 192) * 100)}%` }}
                      className="bg-gradient-to-r from-uvci-purple to-indigo-600 h-full rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.4),transparent)] animate-pulse" />
                    </motion.div>
                  </div>
                  {/* Milestones / Markers */}
                  <div className="grid grid-cols-3 text-[10px] text-slate-400 font-bold px-1 select-none">
                    <div>0h</div>
                    <div className="text-center">96h (Moyen)</div>
                    <div className="text-right">192h (Complet)</div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Charge Statutaire UVCI:</span>
                    <span className="font-extrabold text-slate-900">192 h / an</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Heures Validées:</span>
                    <span className="font-extrabold text-uvci-green bg-uvci-green/10 px-2 py-0.5 rounded-lg">{stats.validatedHours} h</span>
                  </div>
                  <div className="border-t border-slate-100 my-2" />
                  {192 - stats.validatedHours > 0 ? (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Reste à accomplir:</span>
                      <span className="font-extrabold text-slate-800">{(192 - stats.validatedHours).toFixed(1)} h</span>
                    </div>
                  ) : (
                    <div className="bg-green-50 text-green-700 font-bold p-2.5 rounded-xl text-center border border-green-100">
                      Félicitations ! Objectif annuel rempli ! 🎉
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Course distribution (Pie) or Secondary Dynamic Panel */}
            {courseDistribution.length > 0 ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <BookOpen className="text-uvci-purple" size={18} />
                  Répartition par Cours
                </h2>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height={224}>
                    <PieChart>
                      <Pie
                        data={courseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {courseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                  {courseDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs pb-1 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 truncate max-w-[170px]">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-600 truncate font-semibold">{entry.name}</span>
                      </div>
                      <span className="font-extrabold text-slate-800 shrink-0">{entry.value}h</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-8 rounded-3xl border border-indigo-100/60 flex flex-col justify-between h-72"
              >
                <div>
                  <h3 className="text-sm font-extrabold text-indigo-950 mb-2 flex items-center gap-2">
                    <Info size={16} className="text-uvci-purple" />
                    Conseil d'Intervention
                  </h3>
                  <p className="text-xs text-indigo-700/80 leading-relaxed">
                    Saisissez régulièrement vos heures de cours dispensés dans l'onglet des activités pédagogiques afin d'alimenter vos statistiques horaires et de faciliter les arrêtés de paiement mensuels.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/activites')}
                  className="btn btn-sm bg-uvci-purple border-none rounded-2xl text-white hover:bg-opacity-95 text-xs font-bold w-full h-10 shadow-sm"
                >
                  Déclarer une heure de cours
                </button>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        /* Regular Admin / Secretary Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Volume Horaire Mensuel */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-uvci-purple" />
                Volume Horaire Permanent
              </h2>
              <select 
                className="select select-sm select-ghost bg-slate-50 rounded-lg text-xs"
                value={selectedAnneeId}
                onChange={(e) => setSelectedAnneeId(e.target.value)}
              >
                {annees.map(a => (
                  <option key={a.id} value={a.id}>{a.libelle} {a.actif ? '(Active)' : ''}</option>
                ))}
                {annees.length === 0 && <option value="">Aucune année</option>}
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHeuresAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5A2D82" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#5A2D82" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#fff',
                      color: '#1e293b'
                    }}
                  />
                  <Area type="monotone" dataKey="heures" stroke="#5A2D82" strokeWidth={3} fillOpacity={1} fill="url(#colorHeuresAdmin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Activities List */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <TrendingUp className="text-uvci-green" />
              Dernières Déclarations Reçues
            </h2>
            <div className="space-y-6">
              {recentActivities.map((activity) => {
                const user = users.find(u => u.id === activity.id_utilisateur);
                return (
                  <div key={activity.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50/55 p-1 rounded-xl transition-all">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      activity.statut === 'valide' ? 'bg-uvci-green/10 text-uvci-green' : 
                      activity.statut === 'rejete' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                    }`}>
                      <Clock size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{activity.type_action} - {activity.volume_horaire}h</p>
                      <p className="text-xs text-slate-500">Par {user ? `${user.prenom} ${user.nom}` : 'Enseignant ...'} - {new Date(activity.date_saisie).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge badge-sm font-bold border-none px-2.5 py-1.5 ${
                        activity.statut === 'valide' ? 'bg-uvci-green/10 text-uvci-green font-semibold' : 
                        activity.statut === 'rejete' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {activity.statut === 'valide' ? 'Validé' : activity.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentActivities.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic">
                  Aucune activité en attente d'évaluation de l'administration.
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/activites')}
              className="w-full mt-8 btn btn-ghost text-uvci-purple hover:bg-uvci-purple/5 rounded-xl border-dashed border-slate-200"
            >
              Évaluer la file des activités reçues
            </button>
          </motion.div>
        </div>
      )}

      {/* Alerts / Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-uvci-purple text-white p-8 rounded-3xl shadow-lg flex flex-col justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Période de validation</h3>
              <p className="text-white/80">
                Pensez à soumettre vos activités avant le 15 du mois pour le paiement.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/etats')}
            className="btn bg-white text-uvci-purple hover:bg-slate-100 border-none px-8 rounded-xl font-bold w-full md:w-auto"
          >
            Voir mes états
          </button>
        </motion.div>

        {profile?.role === 'enseignant' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-uvci-green/10 text-uvci-green rounded-2xl flex items-center justify-center shrink-0">
                <Calendar size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Mes Disponibilités</h3>
                <p className="text-slate-500">
                  Mettez à jour vos créneaux pour le semestre en cours.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/disponibilites')}
              className="btn btn-outline btn-uvci-green border-uvci-green/50 text-uvci-green hover:bg-uvci-green hover:text-white px-8 rounded-xl font-bold"
            >
              Gérer mes créneaux
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
