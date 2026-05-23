import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { logAction } from '../lib/audit';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  updateProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const saveUserSessionForStorage = (data: any) => {
  try {
    if (!data) {
      localStorage.removeItem('ghe_user');
      return;
    }
    const cleanData = { ...data };
    if (cleanData.photo_url && cleanData.photo_url.length > 2000) {
      // Stripping heavy base64 data URL to prevent QuotaExceededError in localStorage
      cleanData.photo_url = "/logo.png";
    }
    localStorage.setItem('ghe_user', JSON.stringify(cleanData));
  } catch (err) {
    console.error("Failed to save session to localStorage, trying minimal schema:", err);
    try {
      const minimal = {
        id: data.id,
        email: data.email,
        role: data.role,
        nom: data.nom,
        prenom: data.prenom,
        actif: data.actif
      };
      localStorage.setItem('ghe_user', JSON.stringify(minimal));
    } catch (innerErr) {
      console.error("Even minimal storage save failed:", innerErr);
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ghe_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setProfile(parsedUser);

        // Background load full profile to restore photo and updated settings from server/database!
        fetch(`/api/users/${parsedUser.id}`)
          .then(res => res.json())
          .then(fullData => {
            if (fullData && !fullData.error) {
              setUser(fullData);
              setProfile(fullData);
            }
          })
          .catch(err => console.error("Error fetching full background profile:", err));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem('ghe_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      saveUserSessionForStorage(data);
      setUser(data);
      setProfile(data);
      logAction('LOGIN', `Connexion de l'utilisateur ${data.prenom} ${data.nom} (${data.role})`);
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur de connexion');
    }
  };

  const logout = () => {
    try {
      const savedUser = localStorage.getItem('ghe_user');
      if (savedUser) {
        const data = JSON.parse(savedUser);
        logAction('LOGOUT', `Déconnexion de l'utilisateur ${data.prenom || ''} ${data.nom || ''} (${data.role || ''})`);
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('ghe_user');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        saveUserSessionForStorage(data);
        setUser(data);
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
