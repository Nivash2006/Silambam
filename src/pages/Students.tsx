import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone,
  MapPin,
  Award,
  Loader2,
  Calendar,
  ChevronRight,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  CreditCard,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Student, BeltLevel } from '../types';
import StudentForm from '../components/StudentForm';
import PromoteModal from '../components/PromoteModal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const beltColors: Record<string, { bg: string, text: string, glow: string, border: string }> = {
  White: { bg: 'bg-white/10', text: 'text-white', glow: 'shadow-white/20', border: 'border-white/20' },
  Yellow: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', glow: 'shadow-yellow-400/20', border: 'border-yellow-400/20' },
  Orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', glow: 'shadow-orange-500/20', border: 'border-orange-500/20' },
  Green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/20' },
  Blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-blue-500/20', border: 'border-blue-500/20' },
  Purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/20', border: 'border-purple-500/20' },
  Brown: { bg: 'bg-amber-700/10', text: 'text-amber-500', glow: 'shadow-amber-700/20', border: 'border-amber-700/20' },
  Black: { bg: 'bg-zinc-800', text: 'text-zinc-400', glow: 'shadow-black/40', border: 'border-white/5' },
};

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState<string>('All');
  const [feeFilter, setFeeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [promotingStudent, setPromotingStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const currentMonth = format(new Date(), 'MMMM yyyy');

      // Fetch students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*');
      
      if (studentError) throw studentError;

      // Fetch fee status for filter accuracy
      const { data: feeData } = await supabase
        .from('fees')
        .select('student_id')
        .eq('month', currentMonth)
        .eq('status', 'paid');
      
      const paidIds = new Set(feeData?.map(f => f.student_id));
      
      const enrichedStudents = (studentData || []).map(s => ({
        ...s,
        fee_status: paidIds.has(s.id) ? 'paid' : 'pending'
      }));

      setStudents(enrichedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Tactical failure: Directory inaccessible');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleAdd = async (data: Omit<Student, 'id' | 'fee_status' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('students').insert([data]);
      if (error) throw error;
      toast.success('New warrior enlisted');
      fetchStudents();
    } catch (error) {
      toast.error('Enlistment failed');
    }
  };

  const handleEdit = async (data: Omit<Student, 'id' | 'fee_status' | 'created_at'>) => {
    if (!editingStudent) return;
    try {
      const { error } = await supabase.from('students').update(data).eq('id', editingStudent.id);
      if (error) throw error;
      toast.success('Warrior dossier updated');
      fetchStudents();
      setEditingStudent(undefined);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filteredAndSorted = students
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.belt_level.toLowerCase().includes(search.toLowerCase());
      const matchesBelt = beltFilter === 'All' || s.belt_level === beltFilter;
      const matchesFee = feeFilter === 'All' || s.fee_status === feeFilter.toLowerCase();
      return matchesSearch && matchesBelt && matchesFee;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.joining_date).getTime() - new Date(a.joining_date).getTime();
      if (sortBy === 'rank') {
        const order = Object.keys(beltColors);
        return order.indexOf(b.belt_level) - order.indexOf(a.belt_level);
      }
      return 0;
    });

  const belts = ['All', ...Object.keys(beltColors)];

  if (loading) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
           <div className="h-20 w-1/3 skeleton rounded-3xl" />
           <div className="h-14 w-48 skeleton rounded-2xl" />
        </div>
        <div className="h-24 skeleton rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-[450px] skeleton rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 lg:space-y-16 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
            Student <span className="text-emerald-500 text-glow">Directory</span>
          </h2>
          <div className="flex items-center gap-4 mt-6">
            <div className="h-px w-8 bg-emerald-500/50" />
            <p className="text-white/30 font-black uppercase tracking-[0.4em] text-[10px]">Managing {students.length} Student Records</p>
          </div>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => { setEditingStudent(undefined); setIsFormOpen(true); }}
          className="btn-primary group !rounded-[2rem] h-20 px-12"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          Add Student
        </motion.button>
      </div>

      {/* Advanced Control Panel */}
      <div className="space-y-6">
        <div className="glass-card !p-4 !rounded-[2.5rem] border-white/5 bg-white/[0.02]">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, rank, or phone..."
                className="bg-transparent w-full pl-16 pr-8 h-16 text-lg font-bold text-white placeholder:text-white/10 focus:outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4 px-4 lg:border-l border-white/5">
              <div className="flex items-center gap-3 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setSortBy('name')}
                  className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", sortBy === 'name' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/30 hover:text-white")}
                >Name</button>
                <button 
                  onClick={() => setSortBy('date')}
                  className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", sortBy === 'date' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/30 hover:text-white")}
                >Join Date</button>
                <button 
                  onClick={() => setSortBy('rank')}
                  className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", sortBy === 'rank' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/30 hover:text-white")}
                >Rank</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-2xl">
            <Filter className="w-4 h-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Rank Filter</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[400px]">
              {belts.map(b => (
                <button
                  key={b}
                  onClick={() => setBeltFilter(b)}
                  className={cn(
                    "whitespace-nowrap px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                    beltFilter === b ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-white/30 hover:text-white"
                  )}
                >{b}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-2xl">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Fee Status</p>
            <div className="flex gap-2 text-[9px] font-black">
              {['All', 'Paid', 'Pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setFeeFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg border uppercase tracking-widest transition-all",
                    feeFilter === f ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-white/30 hover:text-white"
                  )}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredAndSorted.map((student, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              key={student.id} 
              className="glass-card group relative !p-0 !rounded-[3rem] border-white/5 hover:border-emerald-500/20 hover:shadow-[0_45px_100px_rgba(16,185,129,0.1)] transition-all duration-700 overflow-hidden"
            >
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-br from-white/[0.03] via-transparent to-emerald-500/[0.02] relative">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20">
                  <button onClick={() => { setPromotingStudent(student); setIsPromoteModalOpen(true); }} className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 text-white/40 hover:text-amber-400 transition-all flex items-center justify-center backdrop-blur-md"><Award className="w-5 h-5" /></button>
                  <button onClick={() => { setEditingStudent(student); setIsFormOpen(true); }} className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 text-white/40 hover:text-emerald-400 transition-all flex items-center justify-center backdrop-blur-md"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(student.id)} className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 text-white/40 hover:text-rose-400 transition-all flex items-center justify-center backdrop-blur-md"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="px-10 pb-12 -mt-16 relative z-10">
                <div className="flex items-end gap-6 mb-10">
                  <div className="relative shrink-0 group/photo">
                    <div className={cn("absolute inset-0 blur-3xl opacity-20 group-hover:opacity-50 transition-opacity rounded-full", beltColors[student.belt_level].bg)} />
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-[#0B0F0C] relative z-10 shadow-2xl transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border-4 border-[#0B0F0C] flex items-center justify-center text-4xl font-black text-white/10 relative z-10">{student.name.charAt(0)}</div>
                    )}
                    <div className={cn("absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-[#0B0F0C] flex items-center justify-center shadow-2xl z-20", beltColors[student.belt_level].bg, beltColors[student.belt_level].text)}>
                      <Zap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="min-w-0 pb-2">
                    <h3 className="text-2xl font-black text-white italic transition-all group-hover:text-emerald-500 uppercase tracking-tighter truncate leading-none mb-3">{student.name}</h3>
                    <div className="flex items-center gap-3">
                      {student.fee_status === 'paid' ? 
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Ledger Fixed</div> :
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20"><AlertTriangle className="w-3 h-3" /> Fee Alert</div>
                      }
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="glass-card !p-5 !rounded-2xl border-white/5 hover:bg-white/[0.04] transition-all">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Comms</p>
                    <p className="text-sm font-black text-white/60 italic leading-none">{student.phone}</p>
                  </div>
                  <div className="glass-card !p-5 !rounded-2xl border-white/5 hover:bg-white/[0.04] transition-all">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Cycle</p>
                    <p className="text-sm font-black text-white/60 italic leading-none">{student.age} Years</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-10 border-t border-white/5">
                   <div className="space-y-3">
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Honor Rank</p>
                      <div className={cn("px-6 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-3", beltColors[student.belt_level].bg, beltColors[student.belt_level].border, beltColors[student.belt_level].text, beltColors[student.belt_level].glow)}>
                         <Award className="w-4 h-4" />
                         {student.belt_level}
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mb-2">Ledger</p>
                      <p className="text-3xl font-black text-white group-hover:text-emerald-400 transition-all italic tracking-tighter leading-none">₹{student.fee_amount}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <StudentForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingStudent(undefined); }}
        onSubmit={editingStudent ? handleEdit : handleAdd}
        initialData={editingStudent}
      />

      <PromoteModal
        isOpen={isPromoteModalOpen}
        onClose={() => { setIsPromoteModalOpen(false); setPromotingStudent(null); }}
        student={promotingStudent}
        onPromoted={fetchStudents}
      />
    </div>
  );
};

export default Students;
