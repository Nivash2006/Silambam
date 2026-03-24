import React from 'react';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Trophy, 
  Plus, 
  CheckCircle2, 
  FileText,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_STUDENTS, MOCK_TOURNAMENTS } from '../mockData';

const Dashboard: React.FC = () => {
  const stats = [
    { 
      label: 'Total Students', 
      value: MOCK_STUDENTS.length.toString(), 
      icon: Users, 
      color: 'text-blue-400',
      trend: '+2 this month'
    },
    { 
      label: 'Pending Fees', 
      value: '₹' + MOCK_STUDENTS.filter(s => s.feeStatus === 'pending').reduce((acc, s) => acc + s.feeAmount, 0).toLocaleString(), 
      icon: CreditCard, 
      color: 'text-red-400',
      trend: '3 students'
    },
    { 
      label: 'Classes this Month', 
      value: '14', 
      icon: CalendarCheck, 
      color: 'text-green-400',
      trend: 'Next: Today 5 PM'
    },
    { 
      label: 'Tournaments Won', 
      value: MOCK_TOURNAMENTS.length.toString(), 
      icon: Trophy, 
      color: 'text-yellow-400',
      trend: 'Last: 2 weeks ago'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, Master!</h2>
          <p className="text-white/40 mt-1">Here is what's happening in Maha Silambam Academy today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/attendance" className="btn-secondary">
            <CheckCircle2 className="w-4 h-4" />
            Mark Attendance
          </Link>
          <Link to="/students" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Student
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card group hover:border-primary/50 transition-all cursor-default">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-white/20">{stat.trend}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-white/40 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Recent Achievements</h3>
            <Link to="/tournaments" className="text-primary text-sm font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {MOCK_TOURNAMENTS.map((t) => (
              <div key={t.id} className="card flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <p className="text-sm text-white/40">Student ID: {t.studentId} • {t.position} Place</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{t.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button className="card hover:bg-white/5 text-left flex items-center gap-4 transition-colors p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Generate Monthly Report</p>
                <p className="text-xs text-white/40">Export attendance & fees</p>
              </div>
            </button>
            <button className="card hover:bg-white/5 text-left flex items-center gap-4 transition-colors p-4">
              <div className="w-10 h-10 bg-blue-400/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Belt Promotion</p>
                <p className="text-xs text-white/40">Record student progress</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
