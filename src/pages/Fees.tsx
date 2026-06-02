import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  History,
  IndianRupee,
  Loader2,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  BarChart3,
  Calendar,
  ChevronRight,
  Zap,
  DollarSign
} from 'lucide-react';
import { Student, FeePayment } from '../types';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Fees: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  
  const currentMonth = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

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

      // 2. Fetch Current Month Payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('fees')
        .select('*')
        .eq('month', currentMonth);
      
      if (paymentError) throw paymentError;
      setPayments(paymentData || []);

      // 3. Fetch Historical Revenue Trends (Last 6 Months)
      const last6Months = Array.from({ length: 6 }).map((_, i) => 
        format(subMonths(new Date(), i), 'MMMM yyyy')
      ).reverse();

      const { data: historicalData } = await supabase
        .from('fees')
        .select('month, amount, status')
        .in('month', last6Months)
        .eq('status', 'paid');

      const trends = last6Months.map(month => ({
        month: month.split(' ')[0],
        amount: historicalData?.filter(d => d.month === month).reduce((acc, curr) => acc + curr.amount, 0) || 0
      }));
      setRevenueTrends(trends);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fiscal Uplink Error: Data feed compromised');
    } finally {
      setLoading(false);
    }
  };

  const getStudentStatus = (studentId: string) => {
    const payment = payments.find(p => p.student_id === studentId);
    return payment?.status === 'paid' ? 'paid' : 'pending';
  };

  const filteredStudents = students.filter(s => {
    const status = getStudentStatus(s.id);
    const matchesFilter = filter === 'all' ? true : status === filter;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const collected = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalExpected = students.reduce((acc, s) => acc + s.fee_amount, 0);
  const pending = totalExpected - collected;
  
  const rate = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0;

  const markAsPaid = async (student: Student) => {
    const loadingToast = toast.loading(`Processing payment for ${student.name}...`);
    try {
      const { error } = await supabase
        .from('fees')
        .insert([{
          student_id: student.id,
          amount: student.fee_amount,
          month: currentMonth,
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'paid',
          method: 'cash'
        }]);
      
      if (error) throw error;
      
      toast.success('Funds authorized. Ledger updated.', { id: loadingToast });
      fetchData();
    } catch (error) {
      toast.error('Transaction failed. Protocol denied.', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
           <div className="h-24 w-1/3 skeleton rounded-3xl" />
           <div className="h-16 w-48 skeleton rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-8">
           {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-[2.5rem]" />)}
        </div>
        <div className="h-[400px] skeleton rounded-[3rem]" />
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
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
             </div>
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Fees Management</p>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
            Fees <span className="text-emerald-500 text-glow">Ledger</span>
          </h2>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <Calendar className="w-3 h-3 text-emerald-400" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{currentMonth}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5">
               <TrendingUp className="w-3 h-3 text-white/40" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{rate}% Collection Efficiency</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <button className="btn-secondary !h-16 !px-10 backdrop-blur-xl border-white/5 !bg-white/[0.02] shadow-xl hover:shadow-white/5 transition-all">
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </motion.div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            label: 'Total Collected', 
            value: `₹${collected.toLocaleString()}`, 
            icon: IndianRupee, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-500/10'
          },
          { 
            label: 'Outstanding Dues', 
            value: `₹${pending.toLocaleString()}`, 
            icon: AlertCircle, 
            color: 'text-rose-500', 
            bg: 'bg-rose-500/10'
          },
          { 
            label: 'Success Coefficient', 
            value: `${rate}%`, 
            icon: History, 
            color: 'text-sky-400', 
            bg: 'bg-sky-500/10'
          }
        ].map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="glass-card !p-8 !rounded-[2.5rem] border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500"
          >
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity", stat.bg)} />
            <div className="flex items-center justify-between mb-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", stat.bg, stat.color.replace('text', 'border') + '/20')}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Controls & Trends */}
        <div className="lg:col-span-4 space-y-10">
          <div className="glass-card !p-10 !rounded-[3rem] space-y-10 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
             <div className="flex items-center gap-4">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black italic uppercase tracking-widest text-white/60">Revenue Cycles</h3>
             </div>
             <div className="flex items-end justify-between gap-4 h-48">
                {revenueTrends.map((t, i) => {
                  const maxAmt = Math.max(...revenueTrends.map(x => x.amount)) || 1;
                  const hPct = (t.amount / maxAmt) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar h-full justify-end">
                       <div className="relative w-full flex justify-center items-end h-full">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${hPct}%` }}
                            className="w-2 bg-emerald-500/20 group-hover/bar:bg-emerald-500/40 rounded-full transition-all duration-500 relative"
                          >
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full blur-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                          </motion.div>
                          <div className="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                             <p className="text-[8px] font-black text-emerald-400">₹{(t.amount/1000).toFixed(1)}k</p>
                          </div>
                       </div>
                       <p className="text-[8px] font-black text-white/10 group-hover/bar:text-white/30 truncate uppercase tracking-widest">{t.month}</p>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="glass-card !p-8 !rounded-[2.5rem] border-white/5 space-y-6">
             <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status Filter</h4>
             </div>
             <div className="flex flex-col gap-2">
                {(['all', 'paid', 'pending'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "w-full h-14 rounded-xl flex items-center justify-between px-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
                      filter === f 
                        ? "bg-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/20" 
                        : "bg-white/[0.02] border-white/5 text-white/30 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {f}
                    {filter === f && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Right Ledger List */}
        <div className="lg:col-span-8 space-y-8">
           <div className="glass-card !p-6 !rounded-[2.5rem] flex items-center gap-6 border-white/5 bg-white/[0.01]">
              <Search className="w-5 h-5 text-white/10" />
              <input 
                type="text" 
                placeholder="Locate practitioner by fiscal identity..."
                className="bg-transparent flex-1 font-bold text-white placeholder:text-white/10 focus:outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStudents.map((student, idx) => {
                  const status = getStudentStatus(student.id);
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.03 }}
                      key={student.id}
                      className="glass-card group flex flex-col md:flex-row md:items-center gap-8 py-6 px-10 border-white/5 hover:border-emerald-500/20 transition-all !rounded-[2.5rem]"
                    >
                       <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="relative shrink-0">
                             <div className="w-16 h-16 rounded-[1.2rem] bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden">
                                {student.photo_url ? (
                                  <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <span className="text-xl font-black text-white/10 uppercase">{student.name.charAt(0)}</span>
                                )}
                             </div>
                             <div className={cn(
                               "absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-[#0B0F0C] z-10 flex items-center justify-center",
                               status === 'paid' ? "bg-emerald-500" : "bg-rose-500"
                             )}>
                                {status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <AlertCircle className="w-3.5 h-3.5 text-white" />}
                             </div>
                          </div>

                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-4 mb-2">
                                <h4 className="text-xl font-black text-white group-hover:text-emerald-400 italic transition-colors uppercase tracking-tight truncate leading-none">{student.name}</h4>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">{student.belt_level}</span>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                   <Zap className="w-3 h-3 text-emerald-500" />
                                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic tracking-tighter">Commitment: ₹{student.fee_amount.toLocaleString()}</p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-6 justify-between md:justify-end">
                          <AnimatePresence mode="wait">
                             {status === 'paid' ? (
                               <motion.div 
                                 key="paid-pill"
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                               >
                                  Synchronized
                               </motion.div>
                             ) : (
                               <motion.div 
                                 key="pending-pill"
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="px-6 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em]"
                               >
                                  Outstanding
                               </motion.div>
                             )}
                          </AnimatePresence>

                          <div className="flex items-center gap-3">
                             {status === 'pending' ? (
                               <button 
                                 onClick={() => markAsPaid(student)}
                                 className="btn-primary !h-12 !px-8 text-[9px] font-black uppercase shadow-lg shadow-emerald-500/20"
                               >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Resolve
                               </button>
                             ) : (
                               <button className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 text-white/20 hover:text-white transition-all flex items-center justify-center">
                                  <History className="w-5 h-5" />
                               </button>
                             )}
                          </div>
                       </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Fees;
