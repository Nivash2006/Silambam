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
  Filter,
  CheckCircle2,
  DownloadCloud,
  Users2,
  Tag,
  AlertCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import { Student, TournamentRecord, UpcomingTournament, TournamentRegistration } from '../types';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Portal from '../components/Portal';
import ConfirmModal from '../components/ConfirmModal';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import StudentForm from '../components/StudentForm';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Tournaments: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<UpcomingTournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  
  const [activeTab, setActiveTab] = useState<'achievements' | 'upcoming' | 'tshirts'>('achievements');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Confirmation state
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
  
  // Past Achievements states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    date: '',
    student_id: '',
    position: 'Participation' as TournamentRecord['position']
  });

  // Upcoming Tournaments states
  const [isUpcomingFormOpen, setIsUpcomingFormOpen] = useState(false);
  const [newUpcoming, setNewUpcoming] = useState({
    name: '',
    date: '',
    fee_amount: '0'
  });
  const [selectedUpcoming, setSelectedUpcoming] = useState<UpcomingTournament | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Student detail modal states
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Student Edit/Delete states (from T-shirt tab)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  // T-Shirt status counts
  const [tshirtSearch, setTshirtSearch] = useState('');
  const [tshirtFilter, setTshirtFilter] = useState<string>('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .order('name');
      if (studentError) throw studentError;
      setStudents(studentData || []);

      // 2. Fetch Past Achievements
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: false });
      if (tournamentError) throw tournamentError;
      setTournaments(tournamentData || []);

      // 3. Fetch Upcoming Tournaments
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('upcoming_tournaments')
        .select('*')
        .order('date', { ascending: true });
      if (upcomingError) throw upcomingError;
      setUpcomingTournaments(upcomingData || []);

      // 4. Fetch Registrations
      const { data: regData, error: regError } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          student:students(name, belt_level, phone, tshirt_status, tshirt_size)
        `);
      if (regError) throw regError;
      setRegistrations(regData || []);

    } catch (error) {
      toast.error('Failed to load tournament data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data: regData, error: regError } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          student:students(name, belt_level, phone, tshirt_status, tshirt_size)
        `);
      if (regError) throw regError;
      setRegistrations(regData || []);
    } catch (err) {
      console.error(err);
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

  // Add Upcoming Tournament
  const handleAddUpcoming = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadToast = toast.loading('Creating upcoming tournament...');
    try {
      const { error } = await supabase
        .from('upcoming_tournaments')
        .insert([{
          name: newUpcoming.name,
          date: newUpcoming.date,
          fee_amount: parseInt(newUpcoming.fee_amount) || 0
        }]);
      if (error) throw error;
      toast.success('Upcoming tournament created successfully.', { id: loadToast });
      setIsUpcomingFormOpen(false);
      setNewUpcoming({ name: '', date: '', fee_amount: '0' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create tournament.', { id: loadToast });
    }
  };

  // Register Student to Upcoming Tournament
  const handleRegisterStudent = async (studentId: string) => {
    if (!selectedUpcoming) return;
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert([{
          tournament_id: selectedUpcoming.id,
          student_id: studentId,
          fee_status: 'pending'
        }]);
      if (error) throw error;
      toast.success('Student registered successfully.');
      fetchRegistrations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register student.');
    }
  };

  // Remove Student Registration
  const handleUnregisterStudent = async (regId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', regId);
      if (error) throw error;
      toast.success('Registration removed.');
      fetchRegistrations();
    } catch (err) {
      toast.error('Failed to remove student registration.');
    }
  };

  // Toggle Fee Status
  const handleToggleFeeStatus = async (regId: string, currentStatus: 'paid' | 'pending') => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ fee_status: newStatus })
        .eq('id', regId);
      if (error) throw error;
      toast.success(`Payment status marked as ${newStatus}.`);
      fetchRegistrations();
    } catch (err) {
      toast.error('Failed to update payment status.');
    }
  };

  // Inline T-Shirt updates
  const handleUpdateTshirt = async (studentId: string, updates: Partial<Student>) => {
    try {
      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId);
      if (error) throw error;
      toast.success('T-shirt details updated.');
      fetchData();
    } catch (err) {
      toast.error('Failed to update T-shirt details.');
    }
  };

  const handleToggleTshirt = async (studentId: string, currentStatus: string | null | undefined, currentSize: string | null | undefined) => {
    const isWants = currentStatus && currentStatus !== 'None';
    const newStatus = isWants ? 'None' : 'Wants';
    const newSize = isWants ? 'None' : (currentSize && currentSize !== 'None' ? currentSize : '26');
    
    await handleUpdateTshirt(studentId, {
      tshirt_status: newStatus as any,
      tshirt_size: newSize
    });
  };

  // Delete Achievement Record
  const handleDeleteAchievement = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Achievement',
      message: 'Are you sure you want to delete this achievement record? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('tournaments')
            .delete()
            .eq('id', id);
          if (error) throw error;
          toast.success('Achievement deleted successfully.');
          fetchData();
        } catch (err) {
          toast.error('Failed to delete achievement.');
        }
      }
    });
  };

  // Delete Upcoming Tournament and registrations
  const handleDeleteUpcoming = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Tournament',
      message: 'Are you sure you want to delete this tournament? All student registrations for this event will also be deleted.',
      onConfirm: async () => {
        const loadToast = toast.loading('Deleting tournament...');
        try {
          await supabase.from('tournament_registrations').delete().eq('tournament_id', id);
          const { error } = await supabase.from('upcoming_tournaments').delete().eq('id', id);
          if (error) throw error;
          toast.success('Tournament deleted successfully.', { id: loadToast });
          setSelectedUpcoming(null);
          fetchData();
        } catch (err) {
          toast.error('Failed to delete tournament.', { id: loadToast });
        }
      }
    });
  };

  // Delete Student
  const handleDeleteStudent = async (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Student',
      message: `Are you sure you want to delete ${name}? All attendance, fees, and achievement records for this student will also be deleted.`,
      onConfirm: async () => {
        const loadToast = toast.loading('Deleting student...');
        try {
          const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
          if (error) throw error;
          toast.success('Student deleted successfully.', { id: loadToast });
          fetchData();
        } catch (err) {
          toast.error('Failed to delete student.', { id: loadToast });
        }
      }
    });
  };

  // Submit edit for student
  const handleEditStudentSubmit = async (data: Omit<Student, 'id' | 'fee_status' | 'created_at'>) => {
    if (!editingStudent) return;
    const loadToast = toast.loading('Updating student details...');
    try {
      const { error } = await supabase
        .from('students')
        .update(data)
        .eq('id', editingStudent.id);
      if (error) throw error;
      toast.success('Student details updated successfully.', { id: loadToast });
      setIsStudentFormOpen(false);
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update student details.', { id: loadToast });
    }
  };

  // PDF Export for Upcoming Tournament
  const handleDownloadRosterPDF = (tournament: UpcomingTournament, list: TournamentRegistration[]) => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text("Maha Silambam Academy", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(15, 23, 42);
    doc.text(`TOURNAMENT PARTICIPATION ROSTER`, 14, 30);
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Tournament: ${tournament.name}`, 14, 38);
    doc.text(`Date: ${format(new Date(tournament.date), 'dd MMMM yyyy')}`, 14, 44);
    doc.text(`Registration Fee: Rs. ${tournament.fee_amount}`, 14, 50);

    const headers = [['Student Name', 'Belt Rank', 'Phone Number', 'T-Shirt Size', 'T-Shirt Status', 'Fee Payment']];
    const data = list.map(reg => [
      reg.student?.name || 'N/A',
      reg.student?.belt_level || 'N/A',
      reg.student?.phone || 'N/A',
      reg.student?.tshirt_size || 'None',
      reg.student?.tshirt_status || 'None',
      reg.fee_status === 'paid' ? 'Paid' : 'Pending'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 56,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    // Signature Block
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("Master / Instructor Signature: _______________________", 14, finalY);

    doc.save(`${tournament.name.replace(/ /g, '_')}_roster.pdf`);
    toast.success('Roster PDF downloaded successfully.');
  };

  // Excel Export for Upcoming Tournament
  const handleDownloadRosterExcel = (tournament: UpcomingTournament, list: TournamentRegistration[]) => {
    const data = list.map(reg => ({
      'Student Name': reg.student?.name || 'N/A',
      'Belt Rank': reg.student?.belt_level || 'N/A',
      'Phone Number': reg.student?.phone || 'N/A',
      'T-Shirt Size': reg.student?.tshirt_size || 'None',
      'T-Shirt Status': reg.student?.tshirt_status || 'None',
      'Fee Status': reg.fee_status === 'paid' ? 'Paid' : 'Pending'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Roster");
    XLSX.writeFile(workbook, `${tournament.name.replace(/ /g, '_')}_roster.xlsx`);
    toast.success('Roster Excel downloaded successfully.');
  };

  const filteredPast = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    gold: tournaments.filter(t => t.position === '1st').length,
    silver: tournaments.filter(t => t.position === '2nd').length,
    podiums: tournaments.filter(t => ['1st', '2nd', '3rd'].includes(t.position)).length,
  };

  // T-Shirt tab filters
  const filteredTshirts = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(tshirtSearch.toLowerCase()) ||
                          (s.class_std || '').toLowerCase().includes(tshirtSearch.toLowerCase());
    const matchesFilter = tshirtFilter === 'All' || s.tshirt_status === tshirtFilter;
    return matchesSearch && matchesFilter;
  });

  const tshirtStats = {
    wants: students.filter(s => s.tshirt_status === 'Wants').length,
    paid: students.filter(s => s.tshirt_status === 'Bought (Paid)').length,
    unpaid: students.filter(s => s.tshirt_status === 'Bought (Unpaid)').length,
    has: students.filter(s => s.tshirt_status === 'Already Has').length,
  };

  const selectedRegs = registrations.filter(r => r.tournament_id === selectedUpcoming?.id);
  const unregisteredStudents = students.filter(s => 
    !selectedRegs.some(r => r.student_id === s.id)
  );

  if (loading && tournaments.length === 0) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
           <div className="h-24 w-1/3 skeleton rounded-3xl" />
           <div className="h-16 w-32 skeleton rounded-2xl" />
        </div>
        <div className="h-14 skeleton rounded-2xl" />
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
            Tournament <span className="text-emerald-500 text-glow">Hub</span>
          </h2>
        </motion.div>
        
        <div className="flex flex-wrap gap-4">
          {activeTab === 'achievements' && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="btn-primary !h-16 !px-8 group shadow-[0_20px_60px_rgba(16,185,129,0.3)] !rounded-[2rem] text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              Add Record
            </button>
          )}
          {activeTab === 'upcoming' && (
            <button 
              onClick={() => setIsUpcomingFormOpen(true)}
              className="btn-primary !h-16 !px-8 group shadow-[0_20px_60px_rgba(16,185,129,0.3)] !rounded-[2rem] text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              Create Tournament
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 pb-1 gap-2 overflow-x-auto scrollbar-none whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'upcoming', label: 'Upcoming Tournaments', icon: Calendar },
          { id: 'tshirts', label: 'T-Shirt Management', icon: Tag },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedUpcoming(null); }}
              className={cn(
                "flex items-center gap-3 px-6 py-4.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-2xl border-b-2 border-transparent shrink-0",
                activeTab === tab.id 
                  ? "border-emerald-500 text-emerald-400 bg-white/[0.02]" 
                  : "text-white/40 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {activeTab === 'achievements' && (
          <>
            {/* Achievements List */}
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
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {filteredPast.map((t, idx) => {
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
                        onClick={() => {
                          if (student) {
                            setSelectedStudentForDetail(student);
                            setIsDetailModalOpen(true);
                          }
                        }}
                        className="glass-card group hover:scale-[1.02] transition-all duration-700 border-white/5 !rounded-[2rem] sm:!rounded-[3rem] !p-5 sm:!p-10 relative overflow-hidden cursor-pointer"
                      >
                        <div className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none",
                          isGold ? "bg-gradient-to-r from-yellow-500/[0.03] to-transparent" : 
                          isSilver ? "bg-gradient-to-r from-slate-400/[0.03] to-transparent" :
                          isBronze ? "bg-gradient-to-r from-orange-500/[0.03] to-transparent" :
                          "bg-gradient-to-r from-emerald-500/[0.02] to-transparent"
                        )} />
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full text-center sm:text-left flex-1 min-w-0">
                            <div className={cn(
                              "w-16 h-16 sm:w-28 sm:h-28 rounded-[1.2rem] sm:rounded-[2rem] flex items-center justify-center border transition-all duration-1000 group-hover:rotate-[8deg] group-hover:scale-110 shadow-2xl shrink-0",
                              isGold ? 'bg-yellow-400/10 text-yellow-500 border-yellow-400/20 shadow-[0_0_40px_rgba(234,179,8,0.1)]' :
                              isSilver ? 'bg-slate-300/10 text-slate-300 border-slate-300/20 shadow-[0_0_40px_rgba(203,213,225,0.1)]' :
                              isBronze ? 'bg-orange-400/10 text-orange-500 border-orange-400/20 shadow-[0_0_40px_rgba(251,146,60,0.1)]' :
                              'bg-white/5 text-white/10 border-white/5'
                            )}>
                              {isGold ? <Crown className="w-8 h-8 sm:w-14 sm:h-14" /> : <Medal className="w-8 h-8 sm:w-14 sm:h-14" />}
                            </div>
                            <div className="space-y-3 sm:space-y-4 flex-1 w-full min-w-0">
                              <h3 className="font-black text-xl sm:text-3xl text-white italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors leading-none truncate sm:whitespace-normal">{t.name}</h3>
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-3">
                                <span className="flex items-center gap-2.5 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">
                                  <Calendar className="w-4 h-4 text-emerald-500/50" /> {t.date}
                                </span>
                                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                                <span className="flex items-center gap-2.5 text-[10px] font-black text-emerald-500 uppercase tracking-wider sm:tracking-[0.3em] cursor-pointer hover:text-emerald-400 transition-colors max-w-full min-w-0">
                                  {student?.photo_url ? (
                                    <img src={student.photo_url} className="w-6 h-6 rounded-full object-cover border border-emerald-500/20 shrink-0" alt="" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[8px] font-black text-emerald-400 shrink-0">
                                      {student?.name?.charAt(0) || 'G'}
                                    </div>
                                  )}
                                  <span className="truncate max-w-[100px] sm:max-w-none">{student?.name || 'Grandmaster'}</span>
                                  {student?.class_std && (
                                    <span className="text-white/30 font-normal tracking-normal shrink-0 whitespace-nowrap">
                                      ({student.class_std})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 w-full md:w-auto flex items-center justify-between md:justify-end gap-3 sm:gap-4 z-20">
                            <span className={cn(
                              "inline-flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[11px] font-black px-4 sm:px-10 py-3.5 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] uppercase tracking-wider sm:tracking-[0.3em] border transition-all duration-500 flex-1 md:flex-none justify-center",
                              isGold ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-xl' :
                              isSilver ? 'bg-slate-300/10 text-slate-300 border-slate-300/20' :
                              isBronze ? 'bg-orange-400/10 text-orange-500 border-orange-400/20' :
                              'bg-white/5 text-white/40 border-white/5'
                            )}>
                              {isGold && <Star className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />}
                              {t.position === 'Participation' ? 'Participation' : `${t.position} Place`}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAchievement(t.id);
                              }}
                              className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                              title="Delete Achievement"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {filteredPast.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-20">
                      <Trophy className="w-20 h-20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">No tournament records found</p>
                   </div>
                )}
              </div>
            </div>

            {/* Achievements Sidebar */}
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
            </div>
          </>
        )}

        {/* Tab 2: Upcoming Tournaments */}
        {activeTab === 'upcoming' && (
          <div className="xl:col-span-12 space-y-12">
            {!selectedUpcoming ? (
              // Upcoming Tournaments List
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {upcomingTournaments.map((ut) => {
                  const regsCount = registrations.filter(r => r.tournament_id === ut.id).length;
                  const paidCount = registrations.filter(r => r.tournament_id === ut.id && r.fee_status === 'paid').length;
                  return (
                    <div 
                      key={ut.id}
                      onClick={() => setSelectedUpcoming(ut)}
                      className="glass-card group hover:scale-[1.02] border-white/5 hover:border-emerald-500/20 cursor-pointer !p-8 !rounded-[2.5rem] transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUpcoming(ut.id);
                            }}
                            className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center relative z-20"
                            title="Delete Tournament"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </div>
                      
                      <h4 className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-emerald-400 transition-colors mb-3">{ut.name}</h4>
                      <p className="text-[10px] text-white/30 font-mono font-black uppercase tracking-widest">{format(new Date(ut.date), 'dd MMMM yyyy')}</p>
                      
                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Entry Fee</p>
                          <p className="text-xl font-black text-emerald-400">₹{ut.fee_amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Registered</p>
                          <p className="text-xl font-black text-white">{regsCount} Students <span className="text-xs text-white/40">({paidCount} Paid)</span></p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {upcomingTournaments.length === 0 && (
                  <div className="col-span-3 text-center py-24 glass-card border-dashed border-white/5 opacity-30">
                    <Calendar className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">No upcoming tournaments scheduled</p>
                  </div>
                )}
              </div>
            ) : (
              // Selected Upcoming Tournament Registration details
              <div className="space-y-10 animate-in fade-in duration-500">
                <button 
                  onClick={() => setSelectedUpcoming(null)}
                  className="btn-secondary !h-12 !px-6 text-[10px] font-black uppercase tracking-widest"
                >
                  ← Back to List
                </button>

                 <div className="glass-card !p-5 sm:!p-10 !rounded-[2rem] sm:!rounded-[3rem] border-white/5 bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.02] rounded-full blur-3xl" />
                  
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">{selectedUpcoming.name}</h3>
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-[10px] font-black text-white/30 uppercase tracking-widest">
                      <span className="flex items-center gap-2 font-mono"><Calendar className="w-4 h-4 text-emerald-500" /> {format(new Date(selectedUpcoming.date), 'dd MMMM yyyy')}</span>
                      <span>•</span>
                      <span>Entry Fee: <span className="text-emerald-400">₹{selectedUpcoming.fee_amount}</span></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 z-10">
                    <button 
                      onClick={() => handleDownloadRosterPDF(selectedUpcoming, selectedRegs)}
                      className="btn-secondary !h-14 !px-6 !rounded-xl"
                    >
                      <DownloadCloud className="w-5 h-5 text-emerald-500" />
                      Download PDF
                    </button>
                    <button 
                      onClick={() => handleDownloadRosterExcel(selectedUpcoming, selectedRegs)}
                      className="btn-secondary !h-14 !px-6 !rounded-xl"
                    >
                      <Save className="w-5 h-5 text-emerald-400" />
                      Download Excel
                    </button>
                    <button 
                      onClick={() => setIsRegisterOpen(true)}
                      className="btn-primary !h-14 !px-8 !rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-5 h-5" />
                      Register Students
                    </button>
                    <button 
                      onClick={() => handleDeleteUpcoming(selectedUpcoming.id)}
                      className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      title="Delete Tournament"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Participant roster table list */}
                <div className="glass-card !p-0 !rounded-[3rem] border-white/5 overflow-hidden">
                  <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Participating Students ({selectedRegs.length} registered)
                    </h4>
                  </div>
                  
                  <div className="divide-y divide-white/[0.03]">
                    {selectedRegs.map((reg) => (
                      <div key={reg.id} className="p-5 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 group hover:bg-white/[0.01] transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic tracking-tight truncate leading-none mb-3">
                            {reg.student?.name}
                          </h4>
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                            <span>Belt: {reg.student?.belt_level}</span>
                            <span>•</span>
                            <span>Phone: {reg.student?.phone}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-500/80" /> 
                              T-Shirt Size: <strong className="text-emerald-400 font-mono text-xs">{reg.student?.tshirt_size || 'None'}</strong> ({reg.student?.tshirt_status})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end w-full md:w-auto">
                          <button
                            onClick={() => handleToggleFeeStatus(reg.id, reg.fee_status)}
                            className={cn(
                              "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                              reg.fee_status === 'paid' 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            )}
                          >
                            Fee: {reg.fee_status === 'paid' ? 'Paid' : 'Pending'}
                          </button>
                          
                          <button
                            onClick={() => handleUnregisterStudent(reg.id)}
                            className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-rose-500/20 hover:text-rose-500 transition-all text-white/20"
                            title="Remove registration"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {selectedRegs.length === 0 && (
                      <div className="py-24 text-center text-white/20 uppercase tracking-widest text-[10px] font-black">
                        No students registered for this event yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: T-Shirt Management */}
        {activeTab === 'tshirts' && (
          <div className="xl:col-span-12 space-y-12">
            {/* T-Shirt Stats indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Wants T-Shirt', value: tshirtStats.wants, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                { label: 'Already Has', value: tshirtStats.has, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' },
                { label: 'Bought (Paid)', value: tshirtStats.paid, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                { label: 'Bought (Unpaid)', value: tshirtStats.unpaid, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
              ].map((stat, i) => (
                <div key={i} className="glass-card !p-6 !rounded-2xl border-white/5 bg-white/[0.01] flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={cn("text-3xl font-black italic", stat.color)}>{stat.value}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", stat.bg, stat.border)}>
                    <Tag className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 glass-card !p-4 !rounded-[2rem] border-white/5 bg-white/[0.01] flex items-center px-6 gap-4">
                <Search className="w-5 h-5 text-white/20" />
                <input 
                  type="text"
                  placeholder="Search students by name or class..."
                  className="bg-transparent flex-1 focus:outline-none text-white font-bold"
                  value={tshirtSearch}
                  onChange={e => setTshirtSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['All', 'Wants', 'Already Has', 'Bought (Paid)', 'Bought (Unpaid)', 'None'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTshirtFilter(f)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[9px] font-black border uppercase tracking-widest transition-all whitespace-nowrap",
                      tshirtFilter === f 
                        ? "bg-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/20"
                        : "bg-white/[0.02] border-white/5 text-white/30 hover:text-white"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Students T-Shirt List */}
            <div className="grid grid-cols-1 gap-5">
              {filteredTshirts.map(student => (
                <div 
                  key={student.id} 
                  className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 !p-5 sm:!p-6 border-white/5 bg-white/[0.01] hover:border-emerald-500/20 transition-all !rounded-[2rem] sm:!rounded-3xl"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight">{student.name}</h4>
                    <div className="flex flex-wrap gap-4 mt-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      <span>Phone: <strong className="text-white/60">{student.phone || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Age: <strong className="text-white/60">{student.age} Yrs</strong></span>
                      <span>•</span>
                      <span>Class: <strong className="text-white/60">{student.class_std || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto">
                    {/* Wants T-Shirt Toggle Switch */}
                    <div className="flex flex-col gap-1 shrink-0 items-start">
                      <label className="text-[8px] font-black text-white/20 uppercase tracking-widest block ml-1">Wants T-Shirt</label>
                      <button
                        onClick={() => handleToggleTshirt(student.id, student.tshirt_status, student.tshirt_size)}
                        className={cn(
                          "w-16 h-9 rounded-full transition-all duration-300 p-1 flex items-center cursor-pointer border relative select-none shrink-0",
                          (student.tshirt_status && student.tshirt_status !== 'None')
                            ? "bg-emerald-500 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                            : "bg-white/[0.02] border-white/5"
                        )}
                        title={(student.tshirt_status && student.tshirt_status !== 'None') ? "Turn off (No T-Shirt)" : "Turn on (Needs T-Shirt)"}
                      >
                        <span className="absolute left-2.5 text-[8px] font-black text-[#05070a] uppercase tracking-wider transition-opacity duration-200 pointer-events-none" style={{ opacity: (student.tshirt_status && student.tshirt_status !== 'None') ? 1 : 0 }}>
                          ON
                        </span>
                        <span className="absolute right-2 text-[8px] font-black text-white/20 uppercase tracking-wider transition-opacity duration-200 pointer-events-none" style={{ opacity: (student.tshirt_status && student.tshirt_status !== 'None') ? 0 : 1 }}>
                          OFF
                        </span>
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full shadow-md transition-all duration-300 transform",
                            (student.tshirt_status && student.tshirt_status !== 'None')
                              ? "bg-[#05070a] translate-x-7" 
                              : "bg-white/10 translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Show size and status options only if toggle is ON */}
                    {student.tshirt_status && student.tshirt_status !== 'None' && (
                      <>
                        {/* Size Select Dropdown */}
                        <div className="space-y-1 w-full sm:w-36 shrink-0">
                          <label className="text-[8px] font-black text-white/20 uppercase tracking-widest block ml-1">T-Shirt Size</label>
                          <div className="relative">
                            <select
                              value={student.tshirt_size || 'None'}
                              onChange={(e) => handleUpdateTshirt(student.id, { tshirt_size: e.target.value })}
                              className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 w-full text-xs font-black text-white focus:outline-none appearance-none cursor-pointer"
                            >
                              <option value="None" className="bg-[#0f172a] text-white">None</option>
                              {['22', '24', '26', '28', '30', '32', '34', '36', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                                <option key={sz} value={sz} className="bg-[#0f172a] text-white">Size {sz}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Status Select Dropdown */}
                        <div className="space-y-1 w-full sm:w-44 shrink-0">
                          <label className="text-[8px] font-black text-white/20 uppercase tracking-widest block ml-1">T-Shirt Status</label>
                          <div className="relative">
                            <select
                              value={student.tshirt_status || 'None'}
                              onChange={(e) => handleUpdateTshirt(student.id, { tshirt_status: e.target.value as any })}
                              className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 w-full text-xs font-black text-white focus:outline-none appearance-none cursor-pointer"
                            >
                              <option value="None" className="bg-[#0f172a] text-white">None</option>
                              <option value="Wants" className="bg-[#0f172a] text-white">Wants T-Shirt</option>
                              <option value="Already Has" className="bg-[#0f172a] text-white">Already Has</option>
                              <option value="Bought (Paid)" className="bg-[#0f172a] text-white">Bought (Paid)</option>
                              <option value="Bought (Unpaid)" className="bg-[#0f172a] text-white">Bought (Unpaid)</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end w-full sm:w-auto mt-2 sm:mt-0">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setIsStudentFormOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-500/20 transition-all flex items-center justify-center shrink-0"
                        title="Edit Student"
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-500/20 transition-all flex items-center justify-center shrink-0"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTshirts.length === 0 && (
                <div className="py-24 text-center glass-card border-dashed border-white/5 text-white/20 uppercase tracking-widest text-xs font-black">
                  No students match the criteria
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* achievements record creation Modal */}
      <Portal>
        <AnimatePresence>
          {isFormOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto"
            >
              <div 
                onClick={() => setIsFormOpen(false)}
                className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl" 
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
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {/* upcoming event creation Modal */}
      <Portal>
        <AnimatePresence>
          {isUpcomingFormOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto"
            >
              <div 
                onClick={() => setIsUpcomingFormOpen(false)}
                className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl" 
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
                    <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Schedule <span className="text-emerald-500">Tournament</span></h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] mt-4">
                       Create Upcoming Event
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsUpcomingFormOpen(false)}
                    className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all group border border-white/5"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <form className="space-y-10 relative z-30" onSubmit={handleAddUpcoming}>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Tournament Name</label>
                    <div className="relative group/input">
                      <Trophy className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                      <input 
                        required 
                        className="bg-black/40 border border-white/5 w-full h-20 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-xl italic focus:outline-none focus:ring-2 ring-emerald-500/20" 
                        placeholder="Enter tournament name..."
                        value={newUpcoming.name} 
                        onChange={e => setNewUpcoming({...newUpcoming, name: e.target.value})} 
                      />
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
                          value={newUpcoming.date} 
                          onChange={e => setNewUpcoming({...newUpcoming, date: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Entry Fee (₹)</label>
                      <div className="relative group/input">
                        <Award className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                        <input 
                          type="number"
                          required
                          className="bg-black/40 border border-white/5 w-full h-20 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-sm focus:outline-none focus:ring-2 ring-emerald-500/20"
                          value={newUpcoming.fee_amount} 
                          onChange={e => setNewUpcoming({...newUpcoming, fee_amount: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full !h-24 text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_30px_70px_rgba(16,185,129,0.3)] mt-12 group !rounded-[2.5rem]"
                  >
                    <Save className="w-6 h-6 group-hover:scale-125 transition-transform" /> 
                    Create Tournament
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Student Registration Modal */}
      <Portal>
        <AnimatePresence>
          {isRegisterOpen && selectedUpcoming && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto"
            >
              <div 
                onClick={() => setIsRegisterOpen(false)}
                className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl" 
              />
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="glass-card !rounded-[4rem] w-full max-w-2xl relative z-20 border-white/10 !p-12 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] my-auto max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div>
                    <h3 className="text-3xl font-black italic uppercase text-white leading-none">Register <span className="text-emerald-500">Students</span></h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2">Select students to participate</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-white/[0.03] pr-2 custom-scrollbar">
                  {unregisteredStudents.map(student => (
                    <div key={student.id} className="py-4 flex items-center justify-between gap-6 group">
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic">{student.name}</h4>
                        <div className="flex gap-3 text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">
                          <span>{student.belt_level}</span>
                          <span>•</span>
                          <span>T-Shirt: {student.tshirt_size || 'None'} ({student.tshirt_status})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRegisterStudent(student.id)}
                        className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-md"
                      >
                        Register
                      </button>
                    </div>
                  ))}
                  {unregisteredStudents.length === 0 && (
                    <div className="py-12 text-center text-white/20 uppercase tracking-widest text-[9px] font-black">
                      All students are registered for this event.
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Student Edit Form Modal (from T-shirt management) */}
      {isStudentFormOpen && (
        <StudentForm
          isOpen={isStudentFormOpen}
          onClose={() => {
            setIsStudentFormOpen(false);
            setEditingStudent(null);
          }}
          onSubmit={handleEditStudentSubmit}
          initialData={editingStudent || undefined}
        />
      )}

      {/* Student Details Modal */}
      <Portal>
        <AnimatePresence>
          {isDetailModalOpen && selectedStudentForDetail && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto"
            >
              <div 
                onClick={() => { setIsDetailModalOpen(false); setSelectedStudentForDetail(null); }}
                className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl" 
              />
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="glass-card !rounded-[4rem] w-full max-w-xl relative z-20 border-white/10 !p-12 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] my-auto max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h3 className="text-3xl font-black italic uppercase text-white leading-none">Student <span className="text-emerald-500">Details</span></h3>
                  <button 
                    type="button"
                    onClick={() => { setIsDetailModalOpen(false); setSelectedStudentForDetail(null); }}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-8">
                  {/* Photo and Header Info */}
                  <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                    <div className="relative shrink-0">
                      {selectedStudentForDetail.photo_url ? (
                        <img 
                          src={selectedStudentForDetail.photo_url} 
                          alt={selectedStudentForDetail.name} 
                          className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center text-3xl font-black text-white/20">
                          {selectedStudentForDetail.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">{selectedStudentForDetail.name}</h4>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">{selectedStudentForDetail.belt_level} Belt</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Class: {selectedStudentForDetail.class_std || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Age', value: `${selectedStudentForDetail.age} Years` },
                      { label: 'Student Type', value: `${selectedStudentForDetail.student_type || 'New'} Student` },
                      { label: 'Phone', value: selectedStudentForDetail.phone || 'N/A' },
                      { label: 'Parent Phone', value: selectedStudentForDetail.parent_phone || 'N/A' },
                      { label: 'Mother\'s Name', value: selectedStudentForDetail.mothers_name || 'N/A' },
                      { label: 'Date of Birth', value: selectedStudentForDetail.dob || 'N/A' },
                      { label: 'Joining Date', value: selectedStudentForDetail.joining_date || 'N/A' },
                      { label: 'Fee Amount', value: `₹${selectedStudentForDetail.fee_amount}` },
                      { label: 'T-Shirt Size', value: selectedStudentForDetail.tshirt_size || 'None' },
                      { label: 'T-Shirt Status', value: selectedStudentForDetail.tshirt_status || 'None' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-wider block mb-1">{item.label}</span>
                        <span className="text-xs font-bold text-white/80">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl col-span-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-wider block mb-1">Address</span>
                    <span className="text-xs font-bold text-white/80">{selectedStudentForDetail.address || 'N/A'}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};

export default Tournaments;
