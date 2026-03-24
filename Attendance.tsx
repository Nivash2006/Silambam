import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Users, 
  Save,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { MOCK_STUDENTS } from '../mockData';
import { format } from 'date-fns';

const Attendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = React.useState<Record<string, 'present' | 'absent' | null>>(
    Object.fromEntries(MOCK_STUDENTS.map(s => [s.id, null]))
  );

  const handleMarkAll = (status: 'present' | 'absent') => {
    const newAttendance = { ...attendance };
    MOCK_STUDENTS.forEach(s => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
  };

  const toggleStatus = (id: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : 'present'
    }));
  };

  const stats = {
    total: MOCK_STUDENTS.length,
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    unmarked: Object.values(attendance).filter(v => v === null).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
          <p className="text-white/40 mt-1">Mark and track daily attendance for your students.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleMarkAll('present')}
            className="btn-secondary"
          >
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Mark All Present
          </button>
          <button className="btn-primary">
            <Save className="w-4 h-4" />
            Save Records
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Date Selector & Stats */}
        <div className="space-y-6">
          <div className="card">
            <label className="text-sm font-medium text-white/40 mb-2 block">Select Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input 
                type="date" 
                className="input-field w-full pl-10"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Students</span>
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-500">Present</span>
                <span className="font-bold">{stats.present}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Absent</span>
                <span className="font-bold">{stats.absent}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/20">Unmarked</span>
                <span className="font-bold">{stats.unmarked}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border-dark">
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500" 
                  style={{ width: `${(stats.present / stats.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-center mt-2 text-white/40 uppercase tracking-wider font-bold">
                {Math.round((stats.present / stats.total) * 100)}% Attendance Rate
              </p>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-border-dark">
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40">Student Name</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40">Belt Level</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40 text-center">Status</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/40 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {MOCK_STUDENTS.map((student) => {
                  const status = attendance[student.id];
                  return (
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
                        <div className="flex justify-center">
                          {status === 'present' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
                              <Check className="w-3 h-3" /> PRESENT
                            </span>
                          )}
                          {status === 'absent' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                              <X className="w-3 h-3" /> ABSENT
                            </span>
                          )}
                          {status === null && (
                            <span className="text-xs font-bold text-white/20 px-2 py-1">NOT MARKED</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'present' }))}
                            className={`p-2 rounded-lg transition-colors ${status === 'present' ? 'bg-green-500 text-black' : 'bg-white/5 hover:bg-green-500/20 text-green-500'}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                            className={`p-2 rounded-lg transition-colors ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-red-500/20 text-red-500'}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: null }))}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
