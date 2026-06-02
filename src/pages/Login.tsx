import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Trophy, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { AUTHORIZED_CREDENTIALS } from '../config/auth';

export default function Login() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const loadToast = toast.loading('Signing in...');

    try {
      // Validate identity against configuration file
      const isEmailMatch = identity.toLowerCase() === AUTHORIZED_CREDENTIALS.email.toLowerCase();
      const isMobileMatch = identity === AUTHORIZED_CREDENTIALS.mobile;

      if (!isEmailMatch && !isMobileMatch) {
        throw new Error('Invalid email or mobile number.');
      }

      // Validate password against configuration file
      if (password !== AUTHORIZED_CREDENTIALS.loginPassword) {
        throw new Error('Invalid password.');
      }

      // Background login to Supabase using the master account to maintain DB access
      const { error } = await supabase.auth.signInWithPassword({
        email: AUTHORIZED_CREDENTIALS.email,
        password: AUTHORIZED_CREDENTIALS.masterPassword,
      });

      if (error) {
        console.error('Master Access Failure:', error.message);
        throw new Error('System authentication failure.');
      }
      
      toast.success('Logged in successfully', { id: loadToast });
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.', { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] selection:bg-emerald-500/30 selection:text-emerald-400 p-6 font-sans antialiased overflow-hidden">
      {/* Background Intelligence Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-500/[0.05] blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-600/[0.03] blur-[180px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] glass-panel border border-white/10 p-6 sm:p-10 lg:p-14 relative z-10 overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        
        <div className="flex flex-col items-center mb-12">
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#05070a] via-[#052e16] to-[#000000] border-2 border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] overflow-hidden">
              <img src="/logo.png?v=3" alt="Logo" className="w-20 h-20 object-cover rounded-full" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white italic leading-none uppercase">Maha Silambam</h1>
            <p className="text-[10px] font-black tracking-[0.4em] text-emerald-500 uppercase opacity-80 leading-none">Martial Academy</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Email / Mobile Number</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-500 placeholder:text-white/20 font-medium tracking-tight"
                  placeholder="email@example.com or 10-digit mobile"
                />
                <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-500 placeholder:text-white/20 font-medium tracking-tight"
                  placeholder="Enter your password"
                />
                <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#05070a] font-black italic uppercase tracking-widest h-16 rounded-2xl transition-all duration-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <LogIn className="w-5 h-5" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center gap-6">
           <div className="h-px flex-1 bg-white/5" />
           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center">Maha Silambam Academy</p>
           <div className="h-px flex-1 bg-white/5" />
        </div>
      </motion.div>
    </div>
  );
}
