import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { playBip } from '../lib/sounds';
import { getThemedSwal } from '../lib/swal';

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Field-specific errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email) {
      setEmailError("L'adresse email est requise.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Format d'email invalide.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Le mot de passe est requis.");
      isValid = false;
    }

    return isValid;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    playBip();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      getThemedSwal().fire({
        icon: 'error',
        title: 'Échec de connexion',
        text: err.message || "Erreur de connexion. Vérifiez vos identifiants.",
        confirmButtonColor: '#5A2D82'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    playBip();
    getThemedSwal().fire({
      title: 'Mot de passe oublié ?',
      text: "Contactez l'administrateur ou le technicien via WhatsApp pour réinitialiser votre accès.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Contacter via WhatsApp',
      cancelButtonText: 'Fermer',
      confirmButtonColor: '#25D366',
    }).then((result) => {
      if (result.isConfirmed) {
        window.open('https://wa.me/2250554118801', '_blank');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-uvci-purple via-uvci-purple to-uvci-green p-4 md:p-8">
      <div className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col lg:flex-row min-h-[700px] border border-white/20">
        
        {/* Left Side: Login Form */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center"
        >
          <div className="mb-10">
            <h2 className="text-4xl font-display font-bold text-[#000000] mb-3">Connexion</h2>
            <p className="text-slate-500 text-lg">Heureux de vous revoir ! Veuillez entrer vos accès pour continuer.</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-[#000000]">Adresse Email</span>
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${emailError ? 'text-red-500' : 'text-slate-400'}`} size={20} />
                <input 
                  type="email" 
                  placeholder="nom.prenom@uvci.edu.ci" 
                  className={`input w-full pl-12 bg-slate-50 rounded-2xl border-2 transition-all h-14 focus:outline-none text-[#000000] ${
                    emailError ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-uvci-purple focus:bg-white'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                />
              </div>
              {emailError && (
                <motion.span initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs mt-1 font-medium ml-1">
                  {emailError}
                </motion.span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-[#000000]">Mot de passe</span>
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${passwordError ? 'text-red-500' : 'text-slate-400'}`} size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={`input w-full pl-12 pr-12 bg-slate-50 rounded-2xl border-2 transition-all h-14 focus:outline-none text-[#000000] ${
                    passwordError ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-uvci-purple focus:bg-white'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-uvci-purple transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && (
                <motion.span initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs mt-1 font-medium ml-1">
                  {passwordError}
                </motion.span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="label cursor-pointer gap-3 justify-start group">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary border-2 border-slate-200 checked:border-uvci-purple [--chkbg:theme(colors.uvci.purple)] [--chkfg:white] rounded-lg transition-all" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="label-text text-slate-600 font-medium group-hover:text-uvci-purple transition-colors">Rester connecté</span>
              </label>
              <a 
                href="#" 
                onClick={handleForgotPassword}
                className="text-sm font-bold text-uvci-purple hover:text-uvci-green transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-uvci-purple h-14 rounded-2xl gap-3 shadow-xl shadow-uvci-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg font-bold"
            >
              {loading ? <span className="loading loading-spinner"></span> : <><LogIn size={22} /> Se connecter</>}
            </button>
          </form>

          {/* Test Accounts Helper */}
          <div className="mt-12 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Comptes de test</p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => { setEmail('yussuf.afisu@uvci.edu.ci'); setPassword('password'); }}
                className="text-[10px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-uvci-purple hover:text-uvci-purple transition-all font-medium"
              >
                Admin
              </button>
              <button 
                onClick={() => { setEmail('safi.moustapha@uvci.edu.ci'); setPassword('demo123'); }}
                className="text-[10px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-uvci-purple hover:text-uvci-purple transition-all font-medium"
              >
                Secrétaire
              </button>
              <button 
                onClick={() => { setEmail('seydou1.sangare@uvci.edu.ci'); setPassword('demo@demo'); }}
                className="text-[10px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-uvci-purple hover:text-uvci-purple transition-all font-medium"
              >
                Enseignant
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Branding (Onboarding Style) */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-1/2 bg-uvci-purple p-12 lg:p-20 flex flex-col justify-center items-center lg:items-start text-white relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-uvci-green/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
          
          <div className="relative z-10 w-full max-w-md">
            <div className="mb-12 flex justify-center lg:justify-start">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://lh3.googleusercontent.com/d/1fVHD32zx_GEBKBP7kJN8vM6tu227kvMF" 
                  alt="GHE UVCI Logo" 
                  className="h-24 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/logo.png";
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-8 text-center lg:text-left">
              <div>
                <h1 className="text-5xl lg:text-6xl font-display font-black leading-tight mb-4">
                  GHE <span className="text-uvci-green">UVCI</span>
                </h1>
                <div className="h-1.5 w-24 bg-uvci-green rounded-full mx-auto lg:mx-0"></div>
              </div>

              <p className="text-xl text-white/90 leading-relaxed font-medium">
                Plateforme officielle de gestion des heures d'enseignement de l'Université Virtuelle de Côte d'Ivoire.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/2250554118801"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-[#128C7E] transition-colors"
        title="Contacter le technicien"
      >
        <MessageCircle size={32} />
        <span className="absolute -top-2 -right-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-white text-[#25D366] text-[10px] font-bold items-center justify-center">1</span>
        </span>
      </motion.a>
    </div>
  );
}
