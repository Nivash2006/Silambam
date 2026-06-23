import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Users,
  CreditCard,
  Trophy,
  Loader2,
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Layers,
  FileSpreadsheet,
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('Attendance Summary');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

    const generateReport = async (typeOverride?: string) => {
      const activeType = typeOverride || reportType;
      const loadToast = toast.loading(`Generating ${activeType} report...`);
      try {
        setLoading(true);
      let query;
      
      if (activeType === 'Attendance Summary') {
        query = supabase
          .from('attendance')
          .select(`*, student:students(name)`)
          .gte('date', startDate)
          .lte('date', endDate);
      } else if (activeType === 'Fee Collection') {
        query = supabase
          .from('fees')
          .select(`*, student:students(name)`)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate);
      } else if (activeType === 'Tournament History') {
        query = supabase
          .from('tournaments')
          .select(`*, student:students(name)`)
          .gte('date', startDate)
          .lte('date', endDate);
      } else {
        toast.error('Unrecognized report type', { id: loadToast });
        setReportData([]);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setReportData(data || []);
      setReportType(activeType);
      toast.success(`${activeType} report generated successfully.`, { id: loadToast });
    } catch (error) {
      toast.error('Failed to generate report.', { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const exportToast = toast.loading('Generating PDF...');
    try {
      if (reportData.length === 0) throw new Error('Empty dataset');
      const doc = new jsPDF() as any;
      
      doc.setFontSize(20);
      doc.text(`Academy Report: ${reportType}`, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Range: ${startDate} to ${endDate}`, 14, 30);
      
      const tableHeaders = [['Student', 'Date', 'Status/Detail']];
      const tableData = reportData.map(item => [
        item.student?.name,
        item.date || item.payment_date,
        item.status || item.position || `₹${item.amount}`
      ]);

      doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });

      doc.save(`${reportType.replace(/ /g, '_')}_${startDate}.pdf`);
      toast.success('PDF downloaded successfully.', { id: exportToast });
    } catch (error) {
      toast.error('Failed to generate PDF.', { id: exportToast });
    }
  };

  const exportExcel = () => {
    const exportToast = toast.loading('Generating Excel sheet...');
    try {
      if (reportData.length === 0) throw new Error('Empty dataset');
      const worksheet = XLSX.utils.json_to_sheet(reportData.map(item => ({
        Student: item.student?.name,
        Date: item.date || item.payment_date,
        Detail: item.status || item.position || item.amount
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${reportType.replace(/ /g, '_')}_${startDate}.xlsx`);
      toast.success('Excel report downloaded successfully.', { id: exportToast });
    } catch (error) {
      toast.error('Failed to generate Excel sheet.', { id: exportToast });
    }
  };

  const filteredData = reportData.filter(item => 
    item.student?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const reportTypes = [
    { 
      title: 'Attendance Summary', 
      desc: 'Monthly student attendance records.', 
      icon: Users,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20'
    },
    { 
      title: 'Fee Collection', 
      desc: 'Overview of paid and pending student fees.', 
      icon: CreditCard,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    { 
      title: 'Tournament History', 
      desc: 'Student achievements and tournament history.', 
      icon: Trophy,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20'
    }
  ];

  if (loading && reportData.length === 0) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-end">
           <div className="h-24 w-1/3 skeleton rounded-3xl" />
           <div className="h-16 w-32 skeleton rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-12">
           <div className="col-span-2 h-[400px] skeleton rounded-[3rem]" />
           <div className="col-span-1 h-[600px] skeleton rounded-[3rem]" />
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
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Academy Analytics</p>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
            Reports <span className="text-emerald-500 text-glow">Hub</span>
          </h2>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <ShieldCheck className="w-3 h-3 text-emerald-400" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Access</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5">
               <Layers className="w-3 h-3 text-white/40" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Available Reports: {reportTypes.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Control Column */}
        <div className="xl:col-span-8 space-y-12">
          <div className="glass-card !rounded-[3rem] !p-12 border-emerald-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.02] rounded-full blur-3xl" />
            
            <h3 className="text-sm font-black italic uppercase tracking-[0.3em] mb-12 flex items-center gap-4 text-emerald-500">
              <Zap className="w-5 h-5 animate-pulse" /> Report Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Report Type</label>
                <div className="relative group/select">
                  <BarChart3 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 transition-transform group-focus-within/select:scale-110" />
                  <select 
                    className="bg-black/40 border border-white/5 w-full h-16 pl-16 pr-8 rounded-[1.5rem] text-white font-black text-sm appearance-none focus:outline-none focus:ring-2 ring-emerald-500/20 cursor-pointer italic"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option className="bg-[#0B0F0C]">Attendance Summary</option>
                    <option className="bg-[#0B0F0C]">Fee Collection</option>
                    <option className="bg-[#0B0F0C]">Tournament History</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Date Range</label>
                <div className="flex gap-4">
                  <div className="relative flex-1 group/date">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-transform group-focus-within/date:scale-110" />
                    <input 
                      type="date" 
                      className="bg-black/40 border border-white/5 w-full h-16 pl-14 pr-4 rounded-[1.5rem] text-white font-black text-[10px] focus:outline-none focus:ring-2 ring-emerald-500/20 font-mono" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                    />
                  </div>
                  <div className="relative flex-1 group/date">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-transform group-focus-within/date:scale-110" />
                    <input 
                      type="date" 
                      className="bg-black/40 border border-white/5 w-full h-16 pl-14 pr-4 rounded-[1.5rem] text-white font-black text-[10px] focus:outline-none focus:ring-2 ring-emerald-500/20 font-mono" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-12">
              <button 
                onClick={() => generateReport()}
                disabled={loading}
                className="btn-primary !h-16 !px-12 flex-1 group shadow-[0_20px_60px_rgba(16,185,129,0.2)] !rounded-[2rem]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><BarChart3 className="w-5 h-5" /> Generate Report</>}
              </button>
              
              <AnimatePresence>
                {reportData.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 w-full md:w-auto"
                  >
                    <button onClick={exportPDF} className="btn-secondary !h-16 border-white/5 !bg-white/[0.02] !px-8 !rounded-[1.5rem] hover:!text-emerald-400">
                      <FileText className="w-5 h-5" />
                      PDF
                    </button>
                    <button onClick={exportExcel} className="btn-secondary !h-16 border-white/5 !bg-white/[0.02] !px-8 !rounded-[1.5rem] hover:!text-emerald-400">
                      <FileSpreadsheet className="w-5 h-5" />
                      XLSX
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {reportData.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-8"
              >
                 <div className="glass-card !p-6 !rounded-[2rem] flex items-center gap-6 border-white/5 bg-white/[0.01]">
                    <Search className="w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Search report entries..."
                      className="bg-transparent flex-1 font-bold text-white placeholder:text-white/10 focus:outline-none"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                 </div>

                 <div className="glass-card !p-0 !rounded-[3rem] border-white/5 overflow-hidden relative">
                    <div className="px-10 py-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                        <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/40">
                          Report Entries ({filteredData.length} entries)
                        </h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.03]">
                            <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Student Name</th>
                            <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Date</th>
                            <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {filteredData.map((item, idx) => (
                            <motion.tr 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.01 }}
                              key={idx} 
                              className="group hover:bg-white/[0.01] transition-colors"
                            >
                              <td className="px-10 py-6">
                                 <span className="text-sm font-black text-white italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">
                                   {item.student?.name}
                                 </span>
                              </td>
                              <td className="px-10 py-6 text-xs font-black text-white/20 uppercase tracking-widest font-mono">
                                 {format(new Date(item.date || item.payment_date), 'dd.MM.yyyy')}
                              </td>
                              <td className="px-10 py-6 text-right">
                                <span className="text-sm font-black text-emerald-400 italic uppercase tracking-tighter shadow-emerald-500/20">
                                  {item.status || item.position || `₹${(item.amount || 0).toLocaleString()}`}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 space-y-6"
              >
                 <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-white/5" />
                 </div>
                 <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">No report generated yet</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Intelligence Templates Sidebar */}
        <div className="xl:col-span-4 space-y-10">
          <div className="flex items-center gap-4 px-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/20">
               Available Reports
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {reportTypes.map((type, idx) => {
              const Icon = type.icon;
              return (
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={type.title} 
                  onClick={() => generateReport(type.title)}
                  className="glass-card text-left group hover:scale-[1.03] transition-all duration-500 border-white/5 relative overflow-hidden !rounded-[2.5rem] !p-10"
                >
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.02] group-hover:opacity-[0.05] group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000">
                    <Icon className="w-full h-full" />
                  </div>
                  
                  <div className="flex flex-col gap-8">
                    <div className={cn(
                      "w-16 h-16 border rounded-[1.2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
                      type.bg,
                      type.border
                    )}>
                      <Icon className={cn("w-8 h-8", type.color)} />
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="font-black text-lg text-white italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">
                             {type.title}
                          </h4>
                          <ArrowUpRight className="w-5 h-5 text-white/5 group-hover:text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                       </div>
                       <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em] leading-relaxed">
                          {type.desc}
                       </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="glass-card !p-10 !rounded-[2.5rem] border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.02] to-transparent space-y-6">
             <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Report Summary</h4>
             </div>
             <p className="text-[10px] text-white/20 italic leading-loose">
                Reports provide valuable insights into attendance, fees, and achievements to help manage the academy effectively.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
