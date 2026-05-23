import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppConfig {
  appName: string;
  defaultAnneeId: string;
  chargeHoraireAnnuelle: number;
  signatureUrl: string;
}

interface ConfigContextType {
  config: AppConfig;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>({
    appName: 'GHE UVCI',
    defaultAnneeId: '',
    chargeHoraireAnnuelle: 192,
    signatureUrl: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config/system')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig(data as AppConfig);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching system config:", error);
        setLoading(false);
      });
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
