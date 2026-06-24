import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Users, 
  Save,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  Search,
  DownloadCloud
} from 'lucide-react';
import { Student } from '../types';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Portal from '../components/Portal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Attendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | null>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [personalStats, setPersonalStats] = useState<Record<string, number>>({});

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

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

      // 2. Fetch Daily Attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('date', selectedDate);
      
      if (attendanceError) throw attendanceError;

      const initialAttendance: Record<string, 'present' | 'absent' | null> = {};
      studentData?.forEach(s => {
        const record = attendanceData?.find(a => a.student_id === s.id);
        initialAttendance[s.id] = record ? (record.status as 'present' | 'absent') : null;
      });
      setAttendance(initialAttendance);

      // 3. Fetch Weekly Trends (Last 7 Sessions)
      const { data: trendData } = await supabase
        .from('attendance')
        .select('date, status')
        .order('date', { ascending: false });

      // Group by date and calculate %
      const dateGroups: Record<string, { present: number, total: number }> = {};
      trendData?.forEach(r => {
        if (!dateGroups[r.date]) dateGroups[r.date] = { present: 0, total: 0 };
        dateGroups[r.date].total++;
        if (r.status === 'present') dateGroups[r.date].present++;
      });

      const trends = Object.entries(dateGroups)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .slice(0, 7)
        .map(([date, stats]) => ({
          date: format(new Date(date), 'MMM dd'),
          rate: Math.round((stats.present / stats.total) * 100)
        })).reverse();
      
      setWeeklyTrends(trends);

      // 4. Calculate Personal Stats for this month
      const currentMonth = format(new Date(selectedDate), 'MMMM yyyy');
      const { data: studentStats } = await supabase
        .from('attendance')
        .select('student_id, status');
      
      const pStats: Record<string, number> = {};
      const totals: Record<string, number> = {};
      
      studentStats?.forEach(r => {
        totals[r.student_id] = (totals[r.student_id] || 0) + 1;
        if (r.status === 'present') pStats[r.student_id] = (pStats[r.student_id] || 0) + 1;
      });

      const finalPStats: Record<string, number> = {};
      studentData?.forEach(s => {
        const count = pStats[s.id] || 0;
        const total = totals[s.id] || 1;
        finalPStats[s.id] = Math.round((count / total) * 100);
      });
      setPersonalStats(finalPStats);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const newAttendance = { ...attendance };
    students.forEach(s => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
    toast.success(`Marked all as ${status}`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const records = Object.entries(attendance)
        .filter(([_, status]) => status !== null)
        .map(([studentId, status]) => ({
          student_id: studentId,
          date: selectedDate,
          status: status,
        }));

      if (records.length === 0) {
         toast.error('No attendance changes to save');
         return;
      }

      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id, date' });
      
      if (error) throw error;
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (downloadMode === 'daily') {
      generateDailyPDF();
    } else if (downloadMode === 'weekly') {
      await generateWeeklyPDF();
    } else if (downloadMode === 'monthly') {
      await generateMonthlyPDF();
    }
    setIsDownloadOpen(false);
  };

  const generateDailyPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text("Maha Silambam Academy", 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text("DAILY ATTENDANCE SHEET", 14, 30);
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(selectedDate), 'dd MMMM yyyy')}`, 14, 36);

    const headers = [['Student Name', 'Belt Rank', 'Status']];
    const data = students.map(s => [
      s.name,
      s.belt_level,
      attendance[s.id] === 'present' ? 'Present' : attendance[s.id] === 'absent' ? 'Absent' : 'Not Marked'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("Instructor Signature: _______________________", 14, finalY);

    doc.save(`Daily_Attendance_${selectedDate}.pdf`);
    toast.success('Daily PDF downloaded successfully.');
  };

  const generateWeeklyPDF = async () => {
    const loadToast = toast.loading('Generating weekly attendance report...');
    try {
      const currentDate = new Date(selectedDate);
      const dayOfWeek = currentDate.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + diffToMon);
      
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return format(d, 'yyyy-MM-dd');
      });

      // Fetch attendance for these 7 days
      const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, date, status')
        .in('date', weekDates);
      
      if (error) throw error;

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129);
      doc.text("Maha Silambam Academy", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.text("WEEKLY ATTENDANCE SHEET", 14, 30);
      doc.setFontSize(10);
      doc.text(`Week: ${format(new Date(weekDates[0]), 'dd MMMM yyyy')} to ${format(new Date(weekDates[6]), 'dd MMMM yyyy')}`, 14, 36);

      const headers = [['Student Name', 'Belt Rank', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Present']];
      const data = students.map(s => {
        const row: any[] = [s.name, s.belt_level];
        let presentCount = 0;
        weekDates.forEach(date => {
          const log = logs?.find(l => l.student_id === s.id && l.date === date);
          if (log) {
            if (log.status === 'present') {
              row.push('P');
              presentCount++;
            } else {
              row.push('A');
            }
          } else {
            row.push('-');
          }
        });
        row.push(`${presentCount}/7`);
        return row;
      });

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 42,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.text("Instructor Signature: _______________________", 14, finalY);

      doc.save(`Weekly_Attendance_${weekDates[0]}.pdf`);
      toast.success('Weekly PDF downloaded successfully.', { id: loadToast });
    } catch (err) {
      toast.error('Failed to generate weekly PDF.', { id: loadToast });
    }
  };

  const generateMonthlyPDF = async () => {
    const loadToast = toast.loading('Generating monthly attendance report...');
    try {
      const currentDate = new Date(selectedDate);
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const { data: logs, error } = await supabase
        .from('attendance')
        .select('student_id, date, status')
        .gte('date', start)
        .lte('date', end);
      
      if (error) throw error;

      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129);
      doc.text("Maha Silambam Academy", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.text("MONTHLY ATTENDANCE SUMMARY", 14, 30);
      doc.setFontSize(10);
      doc.text(`Month: ${format(currentDate, 'MMMM yyyy')}`, 14, 36);

      const headers = [['Student Name', 'Belt Rank', 'Present Days', 'Absent Days', 'Total Classes', 'Attendance Rate (%)']];
      const data = students.map(s => {
        const studentLogs = logs?.filter(l => l.student_id === s.id) || [];
        const present = studentLogs.filter(l => l.status === 'present').length;
        const absent = studentLogs.filter(l => l.status === 'absent').length;
        const total = present + absent;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        return [
          s.name,
          s.belt_level,
          present.toString(),
          absent.toString(),
          total.toString(),
          `${rate}%`
        ];
      });

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 42,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.text("Instructor Signature: _______________________", 14, finalY);

      doc.save(`Monthly_Attendance_${format(currentDate, 'yyyy_MM')}.pdf`);
      toast.success('Monthly PDF downloaded successfully.', { id: loadToast });
    } catch (err) {
      toast.error('Failed to generate monthly PDF.', { id: loadToast });
    }
  };

  const currentStats = {
    total: students.length,
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
  };

  const attendanceRate = currentStats.total > 0 ? Math.round((currentStats.present / currentStats.total) * 100) : 0;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
           <div className="h-24 w-1/3 skeleton rounded-3xl" />
           <div className="flex gap-4">
              <div className="h-16 w-48 skeleton rounded-2xl" />
              <div className="h-16 w-32 skeleton rounded-2xl" />
           </div>
        </div>
        <div className="grid grid-cols-4 gap-8">
           <div className="col-span-1 h-[500px] skeleton rounded-[2.5rem]" />
           <div className="col-span-3 h-[500px] skeleton rounded-[3rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
             </div>
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Session Attendance</p>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
            Attendance <span className="text-emerald-500 text-glow">Sheet</span>
          </h2>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <TrendingUp className="w-3 h-3 text-emerald-400" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{attendanceRate}% Active Rate</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5">
               <CalendarIcon className="w-3 h-3 text-white/40" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{format(new Date(selectedDate), 'dd MMMM yyyy')}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap gap-4">
          <button onClick={() => setIsDownloadOpen(true)} className="btn-secondary !h-16 !px-8 backdrop-blur-xl border-white/5 !bg-white/[0.02]">
            <DownloadCloud className="w-5 h-5 text-emerald-500" />
            Download PDF
          </button>
          <button onClick={() => handleMarkAll('present')} className="btn-secondary !h-16 !px-8 backdrop-blur-xl border-white/5 !bg-white/[0.02]">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Bulk Present
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary !h-16 !px-12 !rounded-[2rem] shadow-[0_20px_60px_rgba(16,185,129,0.2)]">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Syncing...' : 'Save Attendance'}
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Stats & Controls */}
        <div className="lg:col-span-4 space-y-10">
          <div className="glass-card !p-8 !rounded-[3rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-3xl" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">Select Date</p>
            <div className="relative group/input">
              <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 transition-transform group-focus-within/input:scale-110" />
              <input 
                type="date" 
                className="bg-black/40 border border-white/5 w-full h-16 pl-14 pr-6 rounded-[1.5rem] text-sm font-black text-white focus:outline-none focus:ring-2 ring-emerald-500/20 transition-all font-mono"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="glass-card !p-10 !rounded-[3rem] space-y-12">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black italic uppercase tracking-widest text-white/60">Live Metrics</h3>
               <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/5">
                  <BarChart3 className="w-5 h-5 text-white/20" />
               </div>
            </div>
            
            <div className="space-y-8">
               {[
                 { label: 'Present', value: currentStats.present, color: 'text-emerald-400', pct: Math.round(currentStats.present/currentStats.total*100) || 0 },
                 { label: 'Absent', value: currentStats.absent, color: 'text-rose-500', pct: Math.round(currentStats.absent/currentStats.total*100) || 0 },
                 { label: 'Not Marked', value: currentStats.total - (currentStats.present + currentStats.absent), color: 'text-white/10', pct: Math.round((currentStats.total - currentStats.present - currentStats.absent)/currentStats.total*100) || 0 },
               ].map((item, i) => (
                 <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">{item.label}</p>
                       <p className={cn("text-xl font-black italic", item.color)}>{item.value}</p>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        className={cn("h-full rounded-full transition-all duration-1000", item.color.replace('text', 'bg'))} 
                       />
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="glass-card !p-10 !rounded-[3rem] space-y-10 bg-gradient-to-br from-white/[0.01] to-transparent">
             <div className="flex items-center gap-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black italic uppercase tracking-widest text-white/60">Weekly Trends</h3>
             </div>
             <div className="flex items-end justify-between gap-3 h-32">
                {weeklyTrends.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                     <div className="relative w-full flex justify-center">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${t.rate}%` }}
                          className="w-1.5 bg-emerald-500/20 group-hover/bar:bg-emerald-500/40 rounded-full transition-all duration-500 relative"
                        >
                           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full blur-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                        </motion.div>
                     </div>
                     <p className="text-[8px] font-black text-white/10 group-hover/bar:text-white/30 truncate uppercase tracking-widest">{t.date}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Student List */}
        <div className="lg:col-span-8 space-y-8">
           <div className="glass-card !p-6 !rounded-[2.5rem] flex items-center gap-6 border-white/5 bg-white/[0.01]">
              <Search className="w-5 h-5 text-white/10" />
              <input 
                type="text" 
                placeholder="Search students by name..."
                className="bg-transparent flex-1 font-bold text-white placeholder:text-white/10 focus:outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredStudents.map((student, idx) => {
                  const status = attendance[student.id];
                  const pRate = personalStats[student.id] || 0;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.03 }}
                      key={student.id}
                      onClick={() => setAttendance(p => ({ ...p, [student.id]: p[student.id] === 'present' ? null : 'present' }))}
                      className="glass-card group flex items-center justify-between gap-4 sm:gap-8 py-4 sm:py-6 px-4 sm:px-10 border-white/5 hover:border-emerald-500/20 transition-all !rounded-[2.5rem] cursor-pointer"
                    >
                       <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                          <div className="relative shrink-0">
                             <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.2rem] bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden">
                                {student.photo_url ? (
                                  <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <span className="text-lg sm:text-xl font-black text-white/10 uppercase">{student.name.charAt(0)}</span>
                                )}
                             </div>
                             <div className={cn(
                               "absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#0B0F0C] z-10",
                               status === 'present' ? "bg-emerald-500" : status === 'absent' ? "bg-rose-500" : "bg-white/10"
                             )} />
                          </div>

                          <div className="flex-1 min-w-0">
                             <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-1.5">
                                <h4 className="text-lg sm:text-xl font-black text-white group-hover:text-emerald-400 italic transition-colors uppercase tracking-tight truncate leading-none">{student.name}</h4>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] self-start sm:self-auto">{student.belt_level}</span>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                   <Zap className="w-3 h-3 text-emerald-500" />
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{pRate}% Consistency</p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <button 
                            type="button"
                            onClick={(e) => {
                               e.stopPropagation();
                               setAttendance(p => ({ ...p, [student.id]: p[student.id] === 'present' ? null : 'present' }));
                            }}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all flex items-center justify-center border shrink-0",
                              status === 'present' ? "bg-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/20" : "bg-white/[0.02] border-white/5 text-white/20 hover:text-emerald-400 hover:border-emerald-500/20"
                            )}
                            title="Mark Present"
                          >
                             <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                               e.stopPropagation();
                               setAttendance(p => ({ ...p, [student.id]: p[student.id] === 'absent' ? null : 'absent' }));
                            }}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all flex items-center justify-center border shrink-0",
                              status === 'absent' ? "bg-rose-500 border-transparent text-white shadow-lg shadow-rose-500/20" : "bg-white/[0.02] border-white/5 text-white/20 hover:text-rose-400 hover:border-rose-500/20"
                            )}
                            title="Mark Absent"
                          >
                             <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                       </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
           </div>
        </div>
      </div>
      <Portal>
        <AnimatePresence>
          {isDownloadOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto"
            >
              <div 
                onClick={() => setIsDownloadOpen(false)}
                className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl" 
              />
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="glass-card !rounded-[4rem] w-full max-w-md relative z-20 border-white/10 !p-12 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] my-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black italic uppercase text-white leading-none">Download <span className="text-emerald-500">Report</span></h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2">Choose attendance report range</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsDownloadOpen(false)}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-1">Report Mode</label>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'daily', label: 'Daily (Selected Day)' },
                        { id: 'weekly', label: 'Weekly Grid (Monday - Sunday)' },
                        { id: 'monthly', label: 'Monthly Summary (Rate & Counts)' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDownloadMode(mode.id as any);
                          }}
                          className={cn(
                            "w-full py-4 px-6 rounded-xl border text-xs font-black uppercase tracking-wider text-left transition-all",
                            downloadMode === mode.id 
                              ? "bg-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/20"
                              : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white"
                          )}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleDownloadPDF}
                    className="btn-primary w-full !h-16 text-[10px] font-black uppercase tracking-widest mt-6"
                  >
                    <DownloadCloud className="w-5 h-5" />
                    Download PDF Report
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
};

export default Attendance;
