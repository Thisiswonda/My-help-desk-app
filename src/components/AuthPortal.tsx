import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Lock, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface AuthPortalProps {
  onLogin: (user: { username: string; role: 'admin' | 'staff'; department: string | null }) => void;
}

export function AuthPortal({ onLogin }: AuthPortalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('helpdesk_token', data.token);
        onLogin(data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 md:p-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <CompanyLogo width={160} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Secure Clearance
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Enterprise Identity Verification Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Shield size={14} /> FAULT DETECTED: {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="USERNAME"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-xs font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white transition-all placeholder:text-slate-300"
                required
              />
            </div>
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-xs font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white transition-all placeholder:text-slate-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white rounded-xl py-4 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-blue-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-blue-100"
          >
            {loading ? 'VERIFYING...' : (
              <>
                AUTHORIZE ACCESS <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
            Restricted Infrastructure
          </p>
          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest italic opacity-60">
            For credential management, contact the PAN Group Directorate
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
           Auth_Server_Live
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-300" />
        <div>TLS_Encrypted</div>
      </div>
    </div>
  );
}
