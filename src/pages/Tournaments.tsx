import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Medal, 
  Plus, 
  Search,
  Award,
  Star,
  Loader2,
  X,
  Save,
  ChevronRight,
  TrendingUp,
  Target,
  Crown,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Student, TournamentRecord } from '../types';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Portal from '../components/Portal';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Tournaments: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    date: '',
    student_id: '',
    position: 'Participation' as TournamentRecord['position']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (studentError) throw studentError;
      setStudents(studentData || []);

      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: false });
      
      if (tournamentError) throw tournamentError;
      setTournaments(tournamentData || []);
    } catch (error) {
      toast.error('Failed to load tournament records.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadToast = toast.loading('Saving tournament record...');
    try {
      const { error } = await supabase
        .from('tournaments')
        .insert([newTournament]);
      
      if (error) throw error;
      toast.success('Tournament record saved successfully.', { id: loadToast });
      setIsFormOpen(false);
      fetchData();
      setNewTournament({ name: '', date: '', student_id: '', position: 'Participation' });
    } catch (error) {
      toast.error('Failed to save tournament record.', { id: loadToast });
    }
  };

  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    gold: tournaments.filter(t => t.position === '1st').length,
    silver: tournaments.filter(t => t.position === '2nd').length,
    podiums: tournaments.filter(t => ['1st', '2nd', '3rd'].includes(t.position)).length,
  };

  if (loading && tournaments.length === 0) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
           <div className="h-24 w-1/3 skeleton rounded-3xl" />
           <div className="h-16 w-32 skeleton rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-12">
           <div className="col-span-2 space-y-8">
              {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-[2.5rem]" />)}
           </div>
           <div className="col-span-1 h-[600px] skeleton rounded-[3rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Trophy className="w-5 h-5 text-emerald-500" />
             </div>
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Achievements & Honors</p>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
            Tournament <span className="text-emerald-500 text-glow">Records</span>
          </h2>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Academy Achievements</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5">
                <Star className="w-3 h-3 text-white/40" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Records: {tournaments.length}</span>
            </div>
          </div>
        </motion.div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="btn-primary !h-20 !px-12 group shadow-[0_20px_60px_rgba(16,185,129,0.3)] !rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em]"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          Add Record
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Tournament Feed */}
        <div className="xl:col-span-8 space-y-10">
          <div className="glass-card !p-4 !rounded-[2.5rem] border-white/5 bg-white/[0.01] flex items-center px-8 gap-6 group focus-within:ring-2 ring-emerald-500/20 transition-all">
            <Search className="w-6 h-6 text-white/10 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tournaments..." 
              className="bg-transparent w-full h-16 text-lg font-bold text-white placeholder:text-white/5 focus:outline-none italic"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-white/40">
               <Filter className="w-3 h-3" />
               ALL RECORDS
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((t, idx) => {
                const student = students.find(s => s.id === t.student_id);
                const isGold = t.position === '1st';
                const isSilver = t.position === '2nd';
                const isBronze = t.position === '3rd';
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={t.id} 
                    className="glass-card group hover:scale-[1.02] transition-all duration-700 border-white/5 !rounded-[3rem] !p-10 relative overflow-hidden"
                  >
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none",
                      isGold ? "bg-gradient-to-r from-yellow-500/[0.03] to-transparent" : 
                      isSilver ? "bg-gradient-to-r from-slate-400/[0.03] to-transparent" :
                      isBronze ? "bg-gradient-to-r from-orange-500/[0.03] to-transparent" :
                      "bg-gradient-to-r from-emerald-500/[0.02] to-transparent"
                    )} />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                      <div className="flex items-center gap-10 w-full">
                        <div className={cn(
                          "w-28 h-28 rounded-[2rem] flex items-center justify-center border transition-all duration-1000 group-hover:rotate-[8deg] group-hover:scale-110 shadow-2xl shrink-0",
                          isGold ? 'bg-yellow-400/10 text-yellow-500 border-yellow-400/20 shadow-[0_0_40px_rgba(234,179,8,0.1)]' :
                          isSilver ? 'bg-slate-300/10 text-slate-300 border-slate-300/20 shadow-[0_0_40px_rgba(203,213,225,0.1)]' :
                          isBronze ? 'bg-orange-400/10 text-orange-500 border-orange-400/20 shadow-[0_0_40px_rgba(251,146,60,0.1)]' :
                          'bg-white/5 text-white/10 border-white/5'
                        )}>
                          {isGold ? <Crown className="w-14 h-14" /> : <Medal className="w-14 h-14" />}
                        </div>
                        <div className="space-y-4 flex-1">
                          <h3 className="font-black text-3xl text-white italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors leading-none">{t.name}</h3>
                          <div className="flex flex-wrap items-center gap-6 mt-3">
                            <span className="flex items-center gap-2.5 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">
                              <Calendar className="w-4 h-4 text-emerald-500/50" /> {t.date}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                            <span className="flex items-center gap-2.5 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                              <Target className="w-4 h-4" /> {student?.name || 'Grandmaster'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 w-full md:w-auto">
                        <span className={cn(
                          "inline-flex items-center gap-4 text-[11px] font-black px-10 py-5 rounded-[1.5rem] uppercase tracking-[0.3em] border transition-all duration-500 w-full md:w-auto justify-center",
                          isGold ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-xl' :
                          isSilver ? 'bg-slate-300/10 text-slate-300 border-slate-300/20' :
                          isBronze ? 'bg-orange-400/10 text-orange-500 border-orange-400/20' :
                          'bg-white/5 text-white/40 border-white/5'
                        )}>
                          {isGold && <Star className="w-5 h-5 animate-pulse" />}
                          {t.position === 'Participation' ? 'Participation' : `${t.position} Place`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
               <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-20">
                  <Trophy className="w-20 h-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No tournament records found</p>
               </div>
            )}
          </div>
        </div>

        {/* Intelligence Module */}
        <div className="xl:col-span-4 space-y-10">
          <div className="glass-card !rounded-[3rem] !p-12 relative overflow-hidden group border-white/5 bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
            <div className="absolute -top-12 -right-12 p-12 opacity-[0.03] scale-[2.5] pointer-events-none group-hover:rotate-12 transition-transform duration-1000 group-hover:scale-[3]">
              <Trophy className="w-32 h-32 text-emerald-500" />
            </div>
            
            <h3 className="text-[10px] font-black italic uppercase tracking-[0.4em] mb-14 flex items-center gap-4 text-emerald-500">
              <TrendingUp className="w-5 h-5 animate-pulse" /> Statistics
            </h3>

            <div className="space-y-12">
              {[
                { label: 'Gold Medals', value: stats.gold, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { label: 'Silver Medals', value: stats.silver, icon: Award, color: 'text-slate-300', bg: 'bg-slate-300/10' },
                { label: 'Podium Finishes', value: stats.podiums, icon: Trophy, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              ].map((stat, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  key={idx} 
                  className="flex items-center justify-between group/stat"
                >
                  <div className="flex items-center gap-8">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.2rem] flex items-center justify-center border transition-all duration-500 group-hover/stat:scale-110 group-hover/stat:rotate-6",
                      stat.bg,
                      stat.color.replace('text', 'border') + '/20'
                    )}>
                      <stat.icon className={cn("w-8 h-8", stat.color)} />
                    </div>
                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">{stat.label}</span>
                  </div>
                  <span className="text-5xl font-black text-white italic tracking-tighter text-glow-white">{stat.value}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 pt-12 border-t border-white/5 relative">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Achievement Rate</span>
                <span className="text-2xl font-black text-emerald-500 italic">Excellent</span>
              </div>
              <div className="w-full bg-black/40 h-4 rounded-full overflow-hidden border border-white/5 relative p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  transition={{ duration: 2.5, ease: "circOut" }}
                  className="bg-emerald-500 h-full rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] relative overflow-hidden" 
                >
                   <div className="absolute inset-x-0 bottom-0 top-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          </div>

          <div className="glass-card !p-12 !rounded-[3rem] border-white/5 bg-white/[0.01] space-y-8">
             <div className="flex items-center gap-4 text-emerald-500">
                <Zap className="w-5 h-5 fill-emerald-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Student Inspiration</h4>
             </div>
             <p className="text-[11px] text-white/40 leading-[2] italic uppercase font-bold tracking-wider">
                "The records in this archive represent verified student achievements and active participation in tournaments."
             </p>
             <div className="h-px w-1/4 bg-emerald-500/20" />
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-emerald-500/30 flex items-center justify-center">
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Status: Authenticated</span>
             </div>
          </div>
        </div>
      </div>

      {/* Modern Overlay Form */}
      <AnimatePresence>
        {isFormOpen && (
          <Portal>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFormOpen(false)}
                className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl" 
                style={{ position: 'fixed' }}
              />
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="glass-card !rounded-[4rem] w-full max-w-2xl relative z-20 border-white/10 !p-12 lg:!p-16 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] my-auto"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex items-center justify-between mb-16 relative z-30">
                  <div>
                    <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Add <span className="text-emerald-500">Record</span></h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] mt-4 flex items-center gap-3">
                       <span className="w-1 h-1 rounded-full bg-emerald-500" />
                       New Tournament Record
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all group border border-white/5 shadow-xl"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <form className="space-y-10 relative z-30" onSubmit={handleAdd}>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Tournament Name</label>
                    <div className="relative group/input">
                      <Trophy className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50 group-focus-within/input:text-emerald-500 transition-colors" />
                      <input 
                        required 
                        className="bg-black/40 border border-white/5 w-full h-20 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-xl italic focus:outline-none focus:ring-2 ring-emerald-500/20 transition-all placeholder:text-white/5" 
                        placeholder="Enter tournament name..."
                        value={newTournament.name} 
                        onChange={e => setNewTournament({...newTournament, name: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Select Student</label>
                    <div className="relative group/select">
                      <Target className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50 group-focus-within/select:text-emerald-500 transition-colors" />
                      <select 
                        required 
                        className="bg-black/40 border border-white/5 w-full h-20 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-xl italic focus:outline-none focus:ring-2 ring-emerald-500/20 appearance-none cursor-pointer"
                        value={newTournament.student_id} 
                        onChange={e => setNewTournament({...newTournament, student_id: e.target.value})}
                      >
                        <option value="" className="bg-[#0B0F0C]">Select Student...</option>
                        {students.map(s => <option key={s.id} value={s.id} className="bg-[#0B0F0C]">{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Date</label>
                      <div className="relative group/date">
                         <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                         <input 
                          type="date" 
                          required 
                          className="bg-black/40 border border-white/5 w-full h-20 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-sm focus:outline-none focus:ring-2 ring-emerald-500/20 font-mono" 
                          value={newTournament.date} 
                          onChange={e => setNewTournament({...newTournament, date: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Tournament Result</label>
                      <div className="relative group/select">
                        <Crown className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                        <select 
                          className="bg-black/40 border border-white/5 w-full h-20 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-sm focus:outline-none focus:ring-2 ring-emerald-500/20 appearance-none cursor-pointer"
                          value={newTournament.position} 
                          onChange={e => setNewTournament({...newTournament, position: e.target.value as any})}
                        >
                          <option value="1st" className="bg-[#0B0F0C]">1st Place</option>
                          <option value="2nd" className="bg-[#0B0F0C]">2nd Place</option>
                          <option value="3rd" className="bg-[#0B0F0C]">3rd Place</option>
                          <option value="Participation" className="bg-[#0B0F0C]">Participation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full !h-24 text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_30px_70px_rgba(16,185,129,0.3)] mt-12 group !rounded-[2.5rem]"
                  >
                    <Save className="w-6 h-6 group-hover:scale-125 transition-transform" /> 
                    Save Record
                  </button>
                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tournaments;
