import React from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  Users,
  CreditCard,
  Trophy
} from 'lucide-react';

const Reports: React.FC = () => {
  const reportTypes = [
    { 
      title: 'Attendance Report', 
      desc: 'Monthly student attendance summary and trends.', 
      icon: Users,
      color: 'text-blue-400'
    },
    { 
      title: 'Fee Collection', 
      desc: 'Detailed breakdown of paid and pending fees.', 
      icon: CreditCard,
      color: 'text-green-400'
    },
    { 
      title: 'Tournament Success', 
      desc: 'Student achievements and academy performance.', 
      icon: Trophy,
      color: 'text-yellow-400'
    },
    { 
      title: 'Academy Growth', 
      desc: 'New admissions and retention statistics.', 
      icon: BarChart3,
      color: 'text-purple-400'
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-white/40 mt-1">Generate and export detailed academy performance data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Generator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-6">
            <h3 className="text-xl font-bold">Generate Custom Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/40">Report Type</label>
                <select className="input-field w-full bg-card-dark">
                  <option>Attendance Summary</option>
                  <option>Fee Collection</option>
                  <option>Student Progress</option>
                  <option>Tournament History</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/40">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" className="input-field flex-1" />
                  <input type="date" className="input-field flex-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="btn-primary flex-1">
                <BarChart3 className="w-4 h-4" />
                Generate Preview
              </button>
              <button className="btn-secondary">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button className="btn-secondary">
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Reports</h3>
              <button className="text-primary text-sm font-medium hover:underline">Clear History</button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'March_Attendance_2024.pdf', date: '2024-03-15', size: '1.2 MB' },
                { name: 'Fee_Status_Q1.xlsx', date: '2024-03-10', size: '450 KB' },
                { name: 'Tournament_Summary_2023.pdf', date: '2024-01-05', size: '2.8 MB' },
              ].map((report) => (
                <div key={report.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-border-dark hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-white/40">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <button className="p-2 text-white/40 hover:text-primary transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Templates */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Quick Templates</h3>
          <div className="grid grid-cols-1 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button key={type.title} className="card text-left group hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors`}>
                      <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div>
                      <p className="font-bold">{type.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{type.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
