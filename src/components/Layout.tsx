import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  Trophy, 
  BarChart3, 
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Bell,
  ShieldCheck,
  Zap,
  Layers,
  Home,
  LogOut,
  User,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    const loadToast = toast.loading('Terminating secure session...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Session terminated.', { id: loadToast });
      navigate('/login');
    } catch (error) {
      toast.error('Logout protocol failure.', { id: loadToast });
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home, activeIcon: Zap },
    { name: 'Students', path: '/students', icon: Users, activeIcon: ShieldCheck },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck, activeIcon: Zap },
    { name: 'Fees', path: '/fees', icon: CreditCard, activeIcon: Layers },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy, activeIcon: Trophy },
    { name: 'Reports', path: '/reports', icon: BarChart3, activeIcon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-[#05070a] text-white/90 selection:bg-emerald-500/30 selection:text-emerald-400 font-sans antialiased overflow-x-hidden">
      {/* Dynamic Background Layering */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-500/[0.05] blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-600/[0.03] blur-[180px]" />
      </div>

      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-50 glass-panel border-r border-white/5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isSidebarOpen ? "w-80" : "w-28"
        )}
      >
        <div className="flex flex-col h-full py-12">
          {/* Logo Section */}
          <div className={cn(
            "px-8 flex items-center transition-all duration-500",
            isSidebarOpen ? "gap-6" : "justify-center gap-0"
          )}>
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-60 transition-opacity duration-700" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#05070a] via-[#052e16] to-[#000000] border border-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-14 h-14 object-cover rounded-full" />
              </div>
            </div>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-black tracking-tighter text-white italic leading-none uppercase">Maha Silambam</h1>
                <p className="text-[9px] font-black tracking-[0.3em] text-emerald-500 uppercase mt-1.5 opacity-80 leading-none">Martial Academy</p>
              </motion.div>
            )}
          </div>

          {/* Navigation Matrix */}
          <nav className="flex-1 px-4 mt-16 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = location.pathname === item.path ? item.activeIcon : item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center px-6 py-4.5 rounded-[1.75rem] transition-all duration-500 group relative overflow-hidden",
                    isActive 
                      ? "bg-white/[0.04] text-emerald-400 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]" 
                      : "text-white/30 hover:text-white hover:bg-white/[0.02]",
                    !isSidebarOpen && "justify-center px-0"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-white/[0.04] group-hover:bg-emerald-500/10 group-hover:text-emerald-400"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSidebarOpen && (
                      <span className="font-black tracking-tighter text-[13px] uppercase italic transition-all duration-500">{item.name}</span>
                    )}
                  </div>
                  
                  {isActive && isSidebarOpen && (
                    <motion.div layoutId="navIndicator" className="absolute right-6 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                  )}

                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActiveBackground"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.04] to-transparent border-r-2 border-emerald-500/50 pointer-events-none"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Module */}
          <div className="px-6 mt-auto space-y-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center justify-center h-14 bg-white/[0.02] border border-white/5 rounded-2xl text-white/20 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all duration-700 group"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1" />}
            </button>
            
            <div className={cn(
               "glass-card !p-5 border-white/5 relative overflow-hidden transition-all duration-500",
               isSidebarOpen ? "!rounded-[2.25rem] group" : "h-14 !p-0 !rounded-2xl justify-center flex"
            )}>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <User className="text-emerald-400 w-5 h-5" />
                  </div>
                  {isSidebarOpen && (
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-white italic truncate tracking-tight uppercase leading-none">Instructor Profile</p>
                      <button 
                         onClick={handleLogout}
                         className="flex items-center gap-2 text-[9px] text-white/20 font-black uppercase tracking-[0.2em] mt-1.5 hover:text-rose-500 transition-colors"
                      >
                         <LogOut className="w-3 h-3" />
                         Logout
                      </button>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10",
        isSidebarOpen ? "lg:pl-80" : "lg:pl-28"
      )}>
        {/* Top Header Bar */}
        <header className={cn(
          "h-20 lg:h-24 px-8 lg:px-16 flex items-center justify-between shrink-0 fixed top-0 right-0 z-40 transition-all duration-500",
          isSidebarOpen ? "lg:left-80" : "lg:left-28",
          scrolled ? "bg-black/40 backdrop-blur-2xl border-b border-white/5" : "bg-transparent"
        )}>
          <div className="flex items-center gap-6">
            <button 
              className="lg:hidden w-12 h-12 flex items-center justify-center bg-white/[0.03] border border-white/5 rounded-xl text-white/60"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden lg:flex items-center gap-6">
               <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Protocol Active</p>
               </div>
               <div className="h-4 w-px bg-white/10" />
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Node: <span className="text-white/40 italic">TN-SILAMBAM-01</span></p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-12 h-12 flex items-center justify-center bg-white/[0.03] border border-white/5 rounded-2xl text-white/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#05070a] shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </button>
            <div className="hidden md:flex flex-col items-end border-l border-white/5 pl-6 ml-2">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{format(new Date(), 'EEEE')}</p>
              <p className="text-sm font-black text-white italic tracking-tighter">{format(new Date(), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-16 pt-24 lg:pt-36 custom-scrollbar relative">
          <div className="max-w-[1400px] mx-auto pb-32 lg:pb-12">
            {children}
          </div>
        </main>

        {/* Elite Mobile Navigation */}
        <nav className="fixed bottom-8 left-6 right-6 z-50 lg:hidden px-0 pointer-events-none">
          <div className="glass-card !p-2 !rounded-[2.5rem] border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 flex items-center justify-between pointer-events-auto bg-black/40 backdrop-blur-2xl">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-[1.75rem] transition-all duration-500 relative",
                    isActive ? "text-emerald-400" : "text-white/20"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="mobileNavActive"
                      className="absolute inset-x-2 inset-y-1.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                    />
                  )}
                  <Icon className={cn("w-6 h-6 relative z-10 transition-all duration-500", isActive && "scale-110 -translate-y-1 text-emerald-500")} />
                  <span className="text-[8px] font-black uppercase tracking-widest relative z-10">{item.name === 'Dashboard' ? 'Home' : item.name.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Premium Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl pointer-events-auto"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[110] w-full max-w-sm glass-panel border-r border-white/10 p-12 flex flex-col"
            >
              <div className="flex items-center justify-between mb-20">
                 <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#05070a] via-[#052e16] to-[#000000] border border-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden">
                    <img src="/logo.png" alt="Logo" className="w-14 h-14 object-cover rounded-full" />
                  </div>
                  <div>
                     <h1 className="text-xl font-black italic uppercase leading-none">Maha Silambam</h1>
                     <p className="text-[9px] font-black tracking-[0.3em] text-emerald-500 uppercase mt-1">Martial Academy</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full border border-white/5">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.name} 
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden group",
                      location.pathname === item.path ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-white/40 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-6 h-6 transition-transform duration-500", location.pathname === item.path && "scale-110")} />
                    <span className="text-xl font-black italic uppercase tracking-tighter">{item.name}</span>
                    <ArrowUpRight className="ml-auto w-5 h-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-10 border-t border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                     <User className="text-emerald-400 w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-white italic uppercase leading-none">Master Ji</p>
                    <button 
                       onClick={handleLogout}
                       className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-2 flex items-center gap-2 hover:text-rose-500 transition-colors animate-pulse"
                    >
                       <LogOut className="w-3 h-3" />
                       Logout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
