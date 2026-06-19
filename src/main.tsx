import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedInitialData } from './lib/seed';
import { AuthProvider } from './contexts/AuthContext.tsx';

// Setup JWT Fetch Interceptor to automatically add Bearer token to all requests
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const token = localStorage.getItem("ghe_token");
  if (token) {
    init = init || {};
    init.headers = init.headers || {};
    if (init.headers instanceof Headers) {
      init.headers.set("Authorization", `Bearer ${token}`);
    } else if (Array.isArray(init.headers)) {
      // Find if Authorization already exists
      const hasAuth = init.headers.some(h => h[0].toLowerCase() === 'authorization');
      if (!hasAuth) {
        init.headers.push(["Authorization", `Bearer ${token}`]);
      }
    } else {
      const headersRecord = init.headers as Record<string, string>;
      if (!headersRecord["Authorization"] && !headersRecord["authorization"]) {
        headersRecord["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(input, init);
};

// Seed initial data if needed
seedInitialData().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
