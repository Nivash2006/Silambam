import React from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  History,
  IndianRupee
} from 'lucide-react';
import { MOCK_STUDENTS } from '../mockData';

const Fees: React.FC = () => {
  const [filter, setFilter] = React.useState<'all' | 'paid' | 'pending'>('all');

  const filteredStudents = MOCK_STUDENTS.filter(s => 
    filter === 'all' ? true : s.feeStatus === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fees Management</h2>
          <p className="text-white/40 mt-1">Track monthly payments and pending dues.</p>
        </div>
        <button className="btn-primary">
          <Download className="w-4 h-4" />
          Export Fee Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-white/40 font-medium">Collected this Month</p>
            <p className="text-2xl font-bold">₹12,400</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-white/40 font-medium">Pending Dues</p>
            <p className="text-2xl font-bold">₹3,500</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <History className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-white/40 font-medium">Payment Rate</p>
            <p className="text-2xl font-bold">78%</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search by student name..." 
            className="input-field w-full pl-10"
          />
        </div>
        <div className="flex bg-card-dark border border-border-dark rounded-lg p-1">
          {(['all', 'paid', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-primary text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Fees Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-border-dark">
              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40">Student</th>
              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40">Belt</th>
              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40">Monthly Fee</th>
              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40">Status</th>
              <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <span className="font-medium">{student.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-white/60">{student.beltLevel}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold">₹{student.feeAmount}</span>
                </td>
                <td className="px-6 py-4">
                  {student.feeStatus === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> PAID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      <AlertCircle className="w-3 h-3" /> PENDING
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {student.feeStatus === 'pending' ? (
                    <button className="btn-primary text-xs py-1.5 px-3">
                      <IndianRupee className="w-3 h-3" /> Mark as Paid
                    </button>
                  ) : (
                    <button className="btn-secondary text-xs py-1.5 px-3">
                      View Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Fees;
