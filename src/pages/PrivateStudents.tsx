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
  Zap,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  DownloadCloud,
  X,
  Check,
  BookOpen,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';
import { Student, BeltLevel } from '../types';
import StudentForm from '../components/StudentForm';
import PromoteModal from '../components/PromoteModal';
import Portal from '../components/Portal';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { format, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
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

const PrivateStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'fees'>('directory');
  
  // Form/Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [promotingStudent, setPromotingStudent] = useState<Student | null>(null);

  // Log session state
  const [logSessionStudent, setLogSessionStudent] = useState<Student | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  // Attendance States
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | null>>({});

  // Fees States
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'MMMM yyyy'));
  const [payments, setPayments] = useState<Record<string, 'paid' | 'pending'>>({});

  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  // Confirmation Modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedDate, currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch private students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('is_private', true)
        .order('name');

      if (studentError) {
        // Fallback for missing is_private column (schema update alert)
        if (studentError.code === 'PGRST116' || studentError.message?.includes('column "is_private" does not exist') || studentError.code === '42703') {
          setIsSchemaMissing(true);
          setStudents([]);
          setLoading(false);
          return;
        }
        throw studentError;
      }

      setIsSchemaMissing(false);
      setStudents(studentData || []);

      if (activeTab === 'attendance') {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('date', selectedDate)
          .eq('class_type', 'private');

        const initialAttendance: Record<string, 'present' | 'absent' | null> = {};
        studentData?.forEach(s => {
          const rec = attendanceData?.find(a => a.student_id === s.id);
          initialAttendance[s.id] = rec ? (rec.status as any) : null;
        });
        setAttendance(initialAttendance);
      }

      if (activeTab === 'fees') {
        const { data: feeData } = await supabase
          .from('fees')
          .select('student_id, status')
          .eq('month', currentMonth);

        const initialPayments: Record<string, 'paid' | 'pending'> = {};
        studentData?.forEach(s => {
          const rec = feeData?.find(f => f.student_id === s.id);
          initialPayments[s.id] = rec ? (rec.status as any) : 'pending';
        });
        setPayments(initialPayments);
      }

    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load private students workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEdit = async (data: Omit<Student, 'id' | 'fee_status' | 'created_at'>) => {
    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(data)
          .eq('id', editingStudent.id);
        if (error) throw error;
        toast.success('Private student updated.');
      } else {
        const { error } = await supabase
          .from('students')
          .insert([{ ...data, is_private: true }]);
        if (error) throw error;
        toast.success('Private student enrolled.');
      }
      fetchData();
      setEditingStudent(undefined);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to save student: ${err.message || 'Unknown database error'}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Student',
      message: `Are you sure you want to delete ${name}? All attendance, session credits, and fees history for this private student will be removed.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
          if (error) throw error;
          toast.success('Private student removed successfully.');
          fetchData();
        } catch (err) {
          toast.error('Failed to delete student.');
        }
      }
    });
  };

  // Toggle Attendance
  const handleToggleAttendance = async (studentId: string, currentStatus: 'present' | 'absent' | null) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      // 1. Save Attendance Record
      const { error: attError } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          date: selectedDate,
          status: newStatus,
          class_type: 'private'
        }, { onConflict: 'student_id,date' });

      if (attError) throw attError;

      // 2. Auto-decrement prepaid session credit if marked present
      if (newStatus === 'present') {
        const student = students.find(s => s.id === studentId);
        if (student && typeof student.remaining_sessions === 'number' && student.remaining_sessions > 0) {
          await supabase
            .from('students')
            .update({ remaining_sessions: student.remaining_sessions - 1 })
            .eq('id', studentId);
        }
      }

      toast.success(`Marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to log attendance.');
    }
  };

  // Toggle Payment status
  const handleTogglePayment = async (studentId: string, currentStatus: 'paid' | 'pending') => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    try {
      // Query if fee record exists for this month
      const { data: existingFee } = await supabase
        .from('fees')
        .select('id')
        .eq('student_id', studentId)
        .eq('month', currentMonth)
        .maybeSingle();

      if (existingFee) {
        await supabase
          .from('fees')
          .update({ status: newStatus, payment_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null })
          .eq('id', existingFee.id);
      } else {
        await supabase
          .from('fees')
          .insert([{
            student_id: studentId,
            month: currentMonth,
            amount: student.fee_amount,
            status: newStatus,
            payment_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null,
            method: 'cash'
          }]);
      }

      toast.success(`Fee status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update fee record.');
    }
  };

  // Submit session logs
  const handleSubmitSessionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSessionStudent) return;

    try {
      const currentCredits = logSessionStudent.remaining_sessions || 0;
      const newCredits = Math.max(0, currentCredits - 1);
      
      // Update student session notes and decrement credits
      const { error } = await supabase
        .from('students')
        .update({
          remaining_sessions: newCredits,
          syllabus_progress: sessionNotes
        })
        .eq('id', logSessionStudent.id);

      if (error) throw error;

      // Log attendance as present for today
      await supabase
        .from('attendance')
        .upsert({
          student_id: logSessionStudent.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          status: 'present',
          class_type: 'private'
        }, { onConflict: 'student_id,date' });

      toast.success('Session logged, 1 credit deducted.');
      setLogSessionStudent(null);
      setSessionNotes('');
      fetchData();
    } catch (err) {
      toast.error('Failed to log private session.');
    }
  };

  // Filters
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.private_slots || '').toLowerCase().includes(search.toLowerCase())
  );

  const months = Array.from({ length: 6 }).map((_, i) => 
    format(subMonths(new Date(), i), 'MMMM yyyy')
  );

  if (loading && students.length === 0) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="h-16 w-1/3 bg-white/5 rounded-3xl" />
        <div className="h-20 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1,2,3].map(i => <div key={i} className="h-96 bg-white/5 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-12 lg:space-y-16 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
            Private <span className="text-emerald-500 text-glow">Batch</span>
          </h2>
          <div className="flex items-center gap-4 mt-6">
            <div className="h-px w-8 bg-emerald-500/50" />
            <p className="text-white/30 font-black uppercase tracking-[0.4em] text-[10px]">
              {students.length} Personal Class Students
            </p>
          </div>

          <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1 relative mt-6 w-fit pointer-events-auto">
            <Link
              to={activeTab === 'attendance' ? '/attendance' : activeTab === 'fees' ? '/fees' : '/students'}
              className="relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors duration-300 z-10 whitespace-nowrap text-center flex items-center justify-center cursor-pointer pointer-events-auto"
            >
              Regular Batch
            </Link>
            <button
              className="relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#05070a] z-10 whitespace-nowrap cursor-default"
            >
              <motion.div
                layoutId="batchTabActive"
                className="absolute inset-0 bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] z-[-1]"
              />
              Private Batch
            </button>
          </div>
        </motion.div>

        {activeTab === 'directory' && !isSchemaMissing && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => { setEditingStudent(undefined); setIsFormOpen(true); }}
            className="btn-primary group !rounded-[2rem] h-20 px-12 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            Add Private Student
          </motion.button>
        )}
      </div>

      {isSchemaMissing && (
        <div className="glass-card border-amber-500/20 bg-amber-500/5 !p-10 !rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-4 text-amber-400">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <h3 className="text-xl font-black uppercase tracking-wider">Database Update Required</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Please run the following SQL commands in your <strong>Supabase SQL Editor</strong> to enable the Private Batch feature:
          </p>
          <pre className="bg-black/60 border border-white/10 p-6 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto select-all cursor-pointer">
            ALTER TABLE students ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
            ALTER TABLE students ADD COLUMN private_slots TEXT;
            ALTER TABLE students ADD COLUMN syllabus_progress TEXT;
            ALTER TABLE students ADD COLUMN remaining_sessions INTEGER DEFAULT 0;
          </pre>
          <p className="text-xs text-white/40">
            After running the statements, refresh this page to begin managing private class slots, syllabus notes, and credits.
          </p>
        </div>
      )}

      {!isSchemaMissing && (
        <>
          {/* Tabs & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Sliding Tab Switcher */}
            <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1 relative shrink-0 w-full lg:w-auto overflow-x-auto no-scrollbar">
              {(['directory', 'attendance', 'fees'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 z-10 whitespace-nowrap cursor-pointer select-none pointer-events-auto",
                      isActive ? "text-[#05070a]" : "text-white/40 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePrivateTab"
                        className="absolute inset-0 bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] z-[-1]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Search / Context Control */}
            <div className="flex-1 max-w-md w-full flex items-center gap-4">
              {activeTab === 'attendance' ? (
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white font-mono focus:outline-none w-full"
                />
              ) : activeTab === 'fees' ? (
                <select 
                  value={currentMonth}
                  onChange={e => setCurrentMonth(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white focus:outline-none appearance-none cursor-pointer w-full"
                >
                  {months.map(m => <option key={m} value={m} className="bg-[#0f172a]">{m}</option>)}
                </select>
              ) : (
                <div className="flex-1 glass-card !p-4 !rounded-[2rem] flex items-center px-6 gap-4 border-white/5 bg-white/[0.01]">
                  <Search className="w-5 h-5 text-white/20" />
                  <input 
                    type="text"
                    placeholder="Search by name or slot..."
                    className="bg-transparent flex-1 focus:outline-none text-white text-xs font-bold"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* TAB CONTENTS */}
          
          {/* TAB 1: Directory */}
          {activeTab === 'directory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {filteredStudents.map((student, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                  key={student.id} 
                  className="glass-card group relative !p-0 !rounded-[3rem] border-white/5 hover:border-emerald-500/20 hover:shadow-[0_45px_100px_rgba(16,185,129,0.1)] transition-all duration-700 overflow-hidden"
                >
                  {/* Actions overlay */}
                  <div className="h-28 bg-gradient-to-br from-white/[0.02] via-transparent to-emerald-500/[0.02] relative">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20">
                      <button 
                        onClick={() => { setEditingStudent(student); setIsFormOpen(true); }}
                        className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 text-white/40 hover:text-emerald-400 transition-all flex items-center justify-center backdrop-blur-md cursor-pointer pointer-events-auto"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4.5 h-4.5 pointer-events-none" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id, student.name)}
                        className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 text-white/40 hover:text-rose-400 transition-all flex items-center justify-center backdrop-blur-md cursor-pointer pointer-events-auto"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4.5 h-4.5 pointer-events-none" />
                      </button>
                    </div>
                  </div>

                  <div className="px-10 pb-12 -mt-14 relative z-10">
                    <div className="flex items-end gap-6 mb-8">
                      <div className="relative shrink-0 group/photo">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt={student.name} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-[#0B0F0C] relative z-10 shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border-4 border-[#0B0F0C] flex items-center justify-center text-3xl font-black text-white/10 relative z-10">{student.name.charAt(0)}</div>
                        )}
                        <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-[#0B0F0C] flex items-center justify-center shadow-2xl z-20", beltColors[student.belt_level]?.bg, beltColors[student.belt_level]?.text)}>
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pb-1">
                        <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors italic uppercase tracking-tighter truncate leading-none mb-3">{student.name}</h3>
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                          {student.belt_level} Belt
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-8">
                      <div className="glass-card !p-4 !rounded-2xl border-white/5">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Weekly Slots</span>
                        <span className="text-xs font-bold text-white/70">{student.private_slots || 'Not Scheduled'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="glass-card !p-4 !rounded-2xl border-white/5">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Prepaid Credits</span>
                          <span className={cn(
                            "text-base font-black italic",
                            (student.remaining_sessions || 0) <= 2 ? "text-rose-500" : "text-emerald-400"
                          )}>
                            {student.remaining_sessions ?? 0} Sessions
                          </span>
                        </div>
                        <div className="glass-card !p-4 !rounded-2xl border-white/5">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Session Rate</span>
                          <span className="text-base font-black italic text-white/70">₹{student.fee_amount}</span>
                        </div>
                      </div>

                      {student.syllabus_progress && (
                        <div className="glass-card !p-4 !rounded-2xl border-white/5 max-h-24 overflow-y-auto custom-scrollbar">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Lesson Notes</span>
                          <p className="text-[10px] font-bold text-white/50 leading-relaxed">{student.syllabus_progress}</p>
                        </div>
                      )}
                    </div>

                    {/* Log Session quick trigger */}
                    <button 
                      onClick={() => {
                        setLogSessionStudent(student);
                        setSessionNotes(student.syllabus_progress || '');
                      }}
                      className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#05070a] font-black italic uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-95 pointer-events-auto"
                    >
                      <BookOpen className="w-4 h-4" />
                      Log Today's Session
                    </button>
                  </div>
                </motion.div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="col-span-full py-24 text-center glass-card border-dashed border-white/5 text-white/20 uppercase tracking-widest text-xs font-black">
                  No private students found
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Attendance */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 gap-5">
              {filteredStudents.map((student) => {
                const status = attendance[student.id];
                return (
                  <div 
                    key={student.id}
                    className="glass-card group flex items-center justify-between gap-4 py-5 px-6 sm:px-10 border-white/5 hover:border-emerald-500/20 transition-all !rounded-[2.5rem]"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden">
                          {student.photo_url ? (
                            <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-lg font-black text-white/10 uppercase">{student.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className={cn(
                          "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-[#0B0F0C] z-10 flex items-center justify-center",
                          status === 'present' ? "bg-emerald-500 animate-pulse" : status === 'absent' ? "bg-rose-500" : "bg-white/10"
                        )}>
                          {status === 'present' && <Check className="w-3 h-3 text-[#05070a] stroke-[3]" />}
                          {status === 'absent' && <X className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black text-white group-hover:text-emerald-400 italic transition-colors uppercase tracking-tight truncate leading-none mb-1.5">{student.name}</h4>
                        <div className="flex items-center gap-4">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{student.private_slots || 'No slots'}</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                          <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">{student.remaining_sessions ?? 0} Credits Left</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAttendance(student.id, status)}
                      className={cn(
                        "w-16 h-9 rounded-full transition-all duration-300 p-1 flex items-center cursor-pointer border relative select-none shrink-0 pointer-events-auto",
                        status === 'present' 
                          ? "bg-emerald-500 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.2)] justify-end" 
                          : "bg-[#05070a] border-white/5 justify-start"
                      )}
                    >
                      <span className="absolute left-2.5 text-[8px] font-black text-[#05070a] uppercase tracking-wider transition-opacity duration-200 pointer-events-none" style={{ opacity: status === 'present' ? 1 : 0 }}>
                        IN
                      </span>
                      <span className="absolute right-2 text-[8px] font-black text-rose-500 uppercase tracking-wider transition-opacity duration-200 pointer-events-none" style={{ opacity: status === 'present' ? 0 : 1 }}>
                        OUT
                      </span>
                      <div className={cn(
                        "w-6 h-6 rounded-full shadow-md transition-all duration-300 transform",
                        status === 'present' ? "bg-[#05070a]" : "bg-rose-500"
                      )} />
                    </button>
                  </div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div className="py-24 text-center glass-card border-dashed border-white/5 text-white/20 uppercase tracking-widest text-xs font-black">
                  No private students found
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Fees */}
          {activeTab === 'fees' && (
            <div className="grid grid-cols-1 gap-5">
              {filteredStudents.map((student) => {
                const status = payments[student.id] || 'pending';
                return (
                  <div 
                    key={student.id}
                    className="glass-card group flex items-center justify-between gap-4 py-5 px-6 sm:px-10 border-white/5 hover:border-emerald-500/20 transition-all !rounded-[2.5rem]"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden">
                          {student.photo_url ? (
                            <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-lg font-black text-white/10 uppercase">{student.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className={cn(
                          "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-[#0B0F0C] z-10 flex items-center justify-center",
                          status === 'paid' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        )}>
                          {status === 'paid' ? <Check className="w-3 h-3 text-[#05070a] stroke-[3]" /> : <AlertTriangle className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black text-white group-hover:text-emerald-400 italic transition-colors uppercase tracking-tight truncate leading-none mb-1.5">{student.name}</h4>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Custom Fee Package: ₹{student.fee_amount}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePayment(student.id, status)}
                      className={cn(
                        "w-24 h-10 rounded-xl transition-all duration-300 font-black uppercase text-[9px] tracking-widest cursor-pointer border select-none shrink-0 pointer-events-auto flex items-center justify-center",
                        status === 'paid' 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                      )}
                    >
                      {status === 'paid' ? 'Paid' : 'Pending'}
                    </button>
                  </div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div className="py-24 text-center glass-card border-dashed border-white/5 text-white/20 uppercase tracking-widest text-xs font-black">
                  No private students found
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Enroll / Edit Modal */}
      <StudentForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingStudent(undefined); }}
        onSubmit={handleAddOrEdit}
        initialData={editingStudent}
        isPrivate={true}
      />

      {/* Log Session Modal Overlay */}
      <Portal>
        <AnimatePresence>
          {logSessionStudent && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 overflow-y-auto"
            >
              <div 
                onClick={() => setLogSessionStudent(null)}
                className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-sm z-0" 
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="glass-card !rounded-[3rem] w-full max-w-md relative z-10 border-white/10 p-10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] my-auto flex flex-col gap-6 pointer-events-auto"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h3 className="text-2xl font-black italic uppercase text-white leading-none tracking-tight">Log Private Session</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Logging a session for <strong>{logSessionStudent.name}</strong> will decrement their prepaid credits from <strong>{logSessionStudent.remaining_sessions ?? 0}</strong> to <strong>{Math.max(0, (logSessionStudent.remaining_sessions ?? 0) - 1)}</strong>.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitSessionLog} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Today's Lesson Notes</label>
                    <textarea 
                      required
                      value={sessionNotes}
                      onChange={e => setSessionNotes(e.target.value)}
                      placeholder="e.g. Silambam weapon strike combination 1-3, footwork refinement."
                      className="input-field w-full p-5 min-h-[100px] bg-white/[0.01] font-bold italic text-sm tracking-tight"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setLogSessionStudent(null)}
                      className="btn-secondary flex-1 h-14 text-[9px] font-black uppercase tracking-widest rounded-xl hover:!bg-rose-500/10 hover:!text-rose-500 border-white/5"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn-primary flex-[2] h-14 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/15"
                    >
                      Log & Deduct Credit
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Confirm Action Dialogue */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};

export default PrivateStudents;
