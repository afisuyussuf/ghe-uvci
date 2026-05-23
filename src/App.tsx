import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Preloader from './components/Preloader';
import Onboarding from './components/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Courses from './pages/Courses';
import Activities from './pages/Activities';
import Layout from './components/Layout';

import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';
import PaymentsPage from './pages/Payments';
import HoursStatesPage from './pages/HoursStates';
import UsersPage from './pages/Users';
import UserGuide from './pages/UserGuide';
import ProfilePage from './pages/Profile';
import AvailabilityPage from './pages/Availability';

import { ThemeProvider } from './contexts/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [showPreloader, setShowPreloader] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [visiblePaths, setVisiblePaths] = useState<string[]>([]);

  useEffect(() => {
    const role = profile?.role;
    if (!role) return;

    // Fetch permissions from API
    fetch(`/api/permissions/${role}`)
      .then(res => res.json())
      .then(data => {
        setVisiblePaths(data.visible_paths || []);
      })
      .catch(err => {
        console.error("Failed to fetch permissions:", err);
        // Fallback defaults
          const defaults: Record<string, string[]> = {
            admin: ['/', '/enseignants', '/cours', '/activites', '/etats', '/paiements', '/historique', '/utilisateurs', '/parametres', '/profil', '/disponibilites', '/guide'],
            secretaire: ['/', '/enseignants', '/cours', '/activites', '/etats', '/paiements', '/historique', '/profil', '/disponibilites', '/guide'],
            enseignant: ['/', '/activites', '/etats', '/paiements', '/profil', '/disponibilites', '/guide']
          };
        setVisiblePaths(defaults[role] || ['/', '/guide']);
      });
  }, [profile?.role]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setShowPreloader(false);
      const hasSeenOnboarding = localStorage.getItem('ghe_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('ghe_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  if (showPreloader) return <Preloader isLoading={true} />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <ConfigProvider>
      <ThemeProvider>
        <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          <Route element={<ProtectedRoute user={user} loading={loading} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              
              {/* Dynamic Restricted Routes */}
              <Route element={<DynamicRoute path="/enseignants" visiblePaths={visiblePaths} />}>
                <Route path="/enseignants" element={<Teachers />} />
              </Route>
              <Route element={<DynamicRoute path="/cours" visiblePaths={visiblePaths} />}>
                <Route path="/cours" element={<Courses />} />
              </Route>
              <Route element={<DynamicRoute path="/historique" visiblePaths={visiblePaths} />}>
                <Route path="/historique" element={<HistoryPage />} />
              </Route>
              <Route element={<DynamicRoute path="/utilisateurs" visiblePaths={visiblePaths} />}>
                <Route path="/utilisateurs" element={<UsersPage />} />
              </Route>
              <Route element={<DynamicRoute path="/parametres" visiblePaths={visiblePaths} />}>
                <Route path="/parametres" element={<SettingsPage />} />
              </Route>

              {/* Common Routes */}
              <Route path="/activites" element={<Activities />} />
              <Route path="/etats" element={<HoursStatesPage />} />
              <Route path="/paiements" element={<PaymentsPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/disponibilites" element={<AvailabilityPage />} />
              <Route path="/guide" element={<UserGuide />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </ConfigProvider>
  );
}

function ProtectedRoute({ user, loading }: { user: any; loading: boolean }) {
  if (loading) return <Preloader isLoading={true} />;
  if (!user) return <Navigate to="/login" />;
  return <Outlet />;
}

function RoleRoute({ allowedRoles, profile }: { allowedRoles: string[]; profile: any }) {
  if (!profile) return <Preloader isLoading={true} />;
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function DynamicRoute({ path, visiblePaths }: { path: string; visiblePaths: string[] }) {
  if (visiblePaths.length === 0) return <Preloader isLoading={true} />;
  if (!visiblePaths.includes(path)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
