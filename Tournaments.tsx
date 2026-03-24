import React from 'react';
import { 
  Trophy, 
  Calendar, 
  Medal, 
  Plus, 
  Search,
  Award,
  Star
} from 'lucide-react';
import { MOCK_TOURNAMENTS, MOCK_STUDENTS } from '../mockData';

const Tournaments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournaments</h2>
          <p className="text-white/40 mt-1">Track student participation and achievements in competitions.</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Tournament Record
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tournament History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search tournaments..." 
              className="input-field w-full pl-10"
            />
          </div>

          <div className="space-y-4">
            {MOCK_TOURNAMENTS.map((t) => {
              const student = MOCK_STUDENTS.find(s => s.id === t.studentId);
              return (
                <div key={t.id} className="card group hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        t.position === '1st' ? 'bg-yellow-400/10 text-yellow-400' :
                        t.position === '2nd' ? 'bg-slate-300/10 text-slate-300' :
                        t.position === '3rd' ? 'bg-orange-400/10 text-orange-400' :
                        'bg-white/5 text-white/40'
                      }`}>
                        <Medal className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{t.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {t.date}
                          </span>
                          <span>•</span>
                          <span className="text-primary font-medium">Student: {student?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        t.position === '1st' ? 'bg-yellow-400/20 text-yellow-400' :
                        t.position === '2nd' ? 'bg-slate-300/20 text-slate-300' :
                        t.position === '3rd' ? 'bg-orange-400/20 text-orange-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {t.position}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academy Stats */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Academy Performance</h3>
          <div className="card space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-white/40">Gold Medals</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-300/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm text-white/40">Silver Medals</p>
                <p className="text-xl font-bold">8</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-400/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-white/40">Total Participations</p>
                <p className="text-xl font-bold">45</p>
              </div>
            </div>
          </div>

          <div className="card bg-primary/5 border-primary/20">
            <h4 className="font-bold text-primary mb-2">Upcoming Event</h4>
            <p className="text-sm font-medium">National Silambam Meet 2024</p>
            <p className="text-xs text-white/40 mt-1">April 15-18 • New Delhi</p>
            <button className="btn-primary w-full mt-4 text-xs">Register Students</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tournaments;
