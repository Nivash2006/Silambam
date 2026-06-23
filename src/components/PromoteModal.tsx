import React from 'react';
import { Award, Calendar, X, Save, Loader2, Zap } from 'lucide-react';
import { BeltLevel, Student } from '../types';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onPromoted: () => void;
}

const belts: BeltLevel[] = [
  'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'
];

import Portal from './Portal';

const PromoteModal: React.FC<PromoteModalProps> = ({ isOpen, onClose, student, onPromoted }) => {
  const [newLevel, setNewLevel] = React.useState<BeltLevel>('White');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (student) {
      const currentIndex = belts.indexOf(student.belt_level);
      const nextIndex = Math.min(currentIndex + 1, belts.length - 1);
      setNewLevel(belts[nextIndex]);
    }
  }, [student]);

  const handlePromote = async () => {
    if (!student) return;
    const loadToast = toast.loading('Updating student rank...');
    try {
      setLoading(true);
      
      const { error: logError } = await supabase
        .from('belt_promotions')
        .insert([{
          student_id: student.id,
          previous_level: student.belt_level,
          new_level: newLevel,
          date: date
        }]);
      
      if (logError) throw logError;

      const { error: updateError } = await supabase
        .from('students')
        .update({ belt_level: newLevel })
        .eq('id', student.id);
      
      if (updateError) throw updateError;

      toast.success('Rank upgraded successfully.', { id: loadToast });
      onPromoted();
      onClose();
    } catch (error) {
      toast.error('Failed to upgrade rank.', { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && student && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-xl" 
              onClick={onClose} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card relative w-full max-w-md border-white/10 p-10 lg:p-12 !rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] z-20"
            >
              <div className="flex items-center justify-between mb-10 relative z-30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Award className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">Rank <span className="text-emerald-500">Upgrade</span></h3>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mt-1.5">Rank Upgrade Details</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={onClose} 
                  className="p-2.5 hover:bg-white/5 rounded-2xl transition-all group"
                >
                  <X className="w-5 h-5 text-white/20 group-hover:text-rose-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 relative z-10">Student Name</p>
                  <p className="text-xl font-black text-white italic uppercase tracking-tight relative z-10">{student.name}</p>
                  <div className="flex items-center gap-2 mt-2 relative z-10">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest leading-none">Current status: {student.belt_level} Belt</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 block">Select New Rank</label>
                    <div className="grid grid-cols-2 gap-3">
                      {belts.map(belt => (
                        <button
                          key={belt}
                          type="button"
                          onClick={() => setNewLevel(belt)}
                          className={`py-3.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                            newLevel === belt 
                              ? 'bg-emerald-500 text-[#05070a] border-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                              : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {belt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 block">Upgrade Date</label>
                    <div className="relative group/input">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-emerald-500 transition-colors" />
                      <input
                        type="date"
                        className="w-full pl-14 h-16 bg-white/[0.03] border border-white/10 rounded-2xl text-white font-bold italic tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handlePromote}
                  disabled={loading}
                  className="w-full relative group overflow-hidden bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#05070a] font-black italic uppercase tracking-[0.2em] h-18 rounded-[2rem] transition-all duration-500 shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 flex items-center justify-center gap-3 z-30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>{loading ? 'Processing...' : 'Update Rank'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};

export default PromoteModal;
