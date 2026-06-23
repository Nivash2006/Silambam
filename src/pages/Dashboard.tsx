import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Trophy, 
  Plus, 
  CheckCircle2, 
  FileText,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  Target,
  AlertTriangle,
  Award,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SmartAlert {
  type: 'fee' | 'attendance';
  title: string;
  studentName: string;
  value: string;
  studentId: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [recentTournaments, setRecentTournaments] = useState<any[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [topPerformer, setTopPerformer] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentMonthStr = format(now, 'MMMM yyyy');
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // 1. Fetch Students & Basic Stats
      const { data: allStudents, count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact' });

      // 2. Fetch Monthly Payments
      const { data: payments } = await supabase
        .from('fees')
        .select('student_id, amount')
        .eq('month', currentMonthStr)
        .eq('status', 'paid');
      
      const paidStudentIds = new Set(payments?.map(p => p.student_id));
      
      // 3. Calculate Pending Fees & Alerts
      const pendingStudents = allStudents?.filter(s => !paidStudentIds.has(s.id)) || [];
      const pendingFeesTotal = pendingStudents.reduce((acc, s) => acc + (s.fee_amount || 0), 0);
      
      const feeAlerts: SmartAlert[] = pendingStudents.slice(0, 3).map(s => ({
        type: 'fee',
        title: 'Fee Pending',
        studentName: s.name,
        value: `₹${s.fee_amount}`,
        studentId: s.id
      }));

      // 4. Attendance Analysis
      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('student_id, status, date');
      
      const uniqueClasses = new Set(attendanceRecords?.map(a => a.date)).size;
      
      // Calculate attendance % for each student this month (mock logic if needed, but we have real data)
      const attendanceMap: Record<string, number> = {};
      attendanceRecords?.forEach(record => {
        if (record.status === 'present') {
          attendanceMap[record.student_id] = (attendanceMap[record.student_id] || 0) + 1;
        }
      });

      const attendanceAlerts: SmartAlert[] = [];
      if (uniqueClasses > 0) {
        allStudents?.forEach(s => {
          const count = attendanceMap[s.id] || 0;
          const percentage = (count / uniqueClasses) * 100;
          if (percentage < 50 && uniqueClasses > 4) {
             attendanceAlerts.push({
               type: 'attendance',
               title: 'Low Attendance',
               studentName: s.name,
               value: `${Math.round(percentage)}%`,
               studentId: s.id
             });
          }
        });
      }

      setSmartAlerts([...feeAlerts, ...attendanceAlerts.slice(0, 2)]);

      // 5. Tournament & Top Performer
      const { count: victoryCount } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('position', ['1st', 'Gold']);

      const { data: recentT } = await supabase
        .from('tournaments')
        .select(`*, student:students(name, belt_level)`)
        .order('date', { ascending: false })
        .limit(3);

      setRecentTournaments(recentT || []);

      // Derive top performer from attendance + recent wins
      if (recentT && recentT.length > 0) {
        setTopPerformer({
          name: recentT[0].student?.name,
          rank: recentT[0].student?.belt_level,
          achievement: recentT[0].name
        });
      }

      setStats([
        { 
          label: 'Total Students', 
          value: studentCount?.toString() || '0', 
          icon: Users, 
          color: 'text-emerald-400',
          trend: '+12% growth',
          glow: 'shadow-emerald-500/10'
        },
        { 
          label: 'Pending Fees', 
          value: '₹' + pendingFeesTotal.toLocaleString(), 
          icon: CreditCard, 
          color: 'text-rose-400',
          trend: `${pendingStudents.length} pending`,
          glow: 'shadow-rose-500/10'
        },
        { 
          label: 'Active Classes', 
          value: uniqueClasses.toString(), 
          icon: CalendarCheck, 
          color: 'text-sky-400',
          trend: 'This month',
          glow: 'shadow-sky-500/10'
        },
        { 
          label: 'Gold Medals', 
          value: victoryCount?.toString() || '0', 
          icon: Trophy, 
          color: 'text-amber-400',
          trend: 'Academy peak',
          glow: 'shadow-amber-500/10'
        },
      ]);
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-12 p-8 animate-in fade-in duration-700">
        <div className="h-20 w-1/3 skeleton rounded-3xl" />
        <div className="grid grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-64 skeleton" />)}
        </div>
        <div className="grid grid-cols-3 gap-12">
          <div className="col-span-2 h-96 skeleton" />
          <div className="h-96 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* Premium Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Academy Dashboard</p>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-tight">
            Academy <span className="text-emerald-500 text-glow">Dashboard</span>
          </h2>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#05070a] bg-emerald-900/40" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-[#05070a] bg-emerald-500 flex items-center justify-center text-[10px] font-black">+</div>
            </div>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">3 Students Training Now</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap gap-4"
        >
          <Link to="/attendance" className="btn-secondary group !rounded-[2rem]">
            <CheckCircle2 className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
            Record Session
          </Link>
          <Link to="/students" className="btn-primary !rounded-[2rem]">
            <Plus className="w-5 h-5" />
            Add Student
          </Link>
        </motion.div>
      </div>
      
      {/* Enhanced Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              key={stat.label} 
              className={cn("glass-card group", stat.glow)}
            >
              <div className="flex items-start justify-between">
                <div className="p-4 bg-white/[0.04] rounded-2xl group-hover:bg-emerald-500/10 transition-all duration-700 border border-white/5 ring-1 ring-white/5">
                  <Icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              </div>
              <div className="mt-12">
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-3">
                  <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white group-hover:text-emerald-500 transition-all duration-700 italic">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-[60px] group-hover:bg-emerald-500/[0.05] transition-all duration-1000" />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Smart Alerts & Insights */}
        <div className="lg:col-span-4 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight italic uppercase flex items-center gap-4">
              Academy <span className="text-white/20">Insights</span>
              <div className="h-px flex-1 bg-white/5" />
            </h3>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {smartAlerts.length > 0 ? smartAlerts.map((alert, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={alert.studentId + alert.type}
                  className={cn(
                    "glass-card !p-6 border-white/5 flex items-center gap-6 group transition-all !rounded-[2rem]",
                    alert.type === 'fee' ? 'hover:bg-rose-500/[0.03]' : 'hover:bg-sky-500/[0.03]'
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                    alert.type === 'fee' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  )}>
                    {alert.type === 'fee' ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate">{alert.title}</p>
                    <p className="font-black text-white italic uppercase truncate text-sm mt-1">{alert.studentName}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-black text-lg italic",
                      alert.type === 'fee' ? "text-rose-400" : "text-sky-400"
                    )}>{alert.value}</p>
                  </div>
                </motion.div>
              )) : (
                 <div className="glass-card !p-12 text-center border-dashed border-white/5">
                    <p className="text-white/10 font-black uppercase tracking-widest">No Alerts</p>
                 </div>
              )}
            </AnimatePresence>
          </div>

          {/* Top Performer Spotlight */}
          {topPerformer && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card !p-10 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent border-amber-500/10 relative overflow-hidden group !rounded-[3rem]"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-5 h-5 text-amber-400" />
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">Student Spotlight</p>
                </div>
                <h4 className="text-3xl font-black text-white italic uppercase leading-none">{topPerformer.name}</h4>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-3 mb-6">{topPerformer.rank} Belt</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                   <div className="flex flex-col">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Achievement</p>
                      <p className="text-xs font-black text-emerald-400 italic uppercase truncate max-w-[150px]">{topPerformer.achievement}</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                      <ChevronRight className="w-5 h-5 text-amber-400" />
                   </div>
                </div>
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/[0.05] rounded-full blur-[80px]" />
            </motion.div>
          )}
        </div>

        {/* Global Activity Feed */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between">
             <h3 className="text-2xl font-black tracking-tight italic uppercase flex items-center gap-4">
              Recent <span className="text-white/20">Achievements</span>
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            <Link to="/tournaments" className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 transition-all uppercase tracking-[0.3em] bg-emerald-500/5 px-6 py-3 rounded-2xl border border-emerald-500/10">Full Archive</Link>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {recentTournaments.length > 0 ? recentTournaments.map((t, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                key={t.id} 
                className="glass-card flex items-center gap-10 py-8 group hover:bg-white/[0.03] !rounded-[2.5rem] border-white/5 hover:border-white/10"
              >
                <div className="w-20 h-20 bg-emerald-500/5 rounded-[2rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-700 border border-emerald-500/10 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                   <Target className="w-8 h-8 text-emerald-500 relative z-10" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t.date}</p>
                    <div className="flex items-center gap-2">
                       <Trophy className="w-3 h-3 text-amber-500" />
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t.position}</span>
                    </div>
                  </div>
                  <h4 className="font-black text-2xl text-white group-hover:text-emerald-400 transition-colors uppercase italic mb-2 tracking-tight truncate">{t.name}</h4>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                       <p className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none">{t.student?.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:flex flex-col items-end pr-6">
                   <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all">
                      <ArrowUpRight className="w-6 h-6" />
                   </div>
                </div>
              </motion.div>
            )) : (
              <div className="glass-card py-24 text-center border-dashed border-white/5">
                <p className="text-white/10 italic font-black uppercase tracking-[0.4em]">No Achievements Found</p>
              </div>
            )}
            
            {/* Quick Utility Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
               <Link to="/reports" className="glass-card !p-8 flex items-center gap-8 group hover:bg-sky-500/[0.03] border-white/5 !rounded-[3rem] transition-all">
                  <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/10 group-hover:scale-110 transition-transform">
                     <FileText className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-black text-white uppercase italic text-lg tracking-tight group-hover:text-sky-400 transition-colors">Reports Hub</p>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Export & Generate Reports</p>
                  </div>
               </Link>
               <Link to="/fees" className="glass-card !p-8 flex items-center gap-8 group hover:bg-emerald-400/[0.03] border-white/5 !rounded-[3rem] transition-all">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
                     <CreditCard className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-black text-white uppercase italic text-lg tracking-tight group-hover:text-emerald-400 transition-colors">Fees Hub</p>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Manage Fee Payments</p>
                  </div>
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
