import React from 'react';
import { X, Save, User, Phone, MapPin, Calendar, CreditCard, Award } from 'lucide-react';
import { BeltLevel } from '../types';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const StudentForm: React.FC<StudentFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  if (!isOpen) return null;

  const beltLevels: BeltLevel[] = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-card-dark border border-border-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border-dark flex items-center justify-between bg-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {initialData ? 'Edit Student' : 'Add New Student'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-8 overflow-y-auto space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSubmit({});
          onClose();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input type="text" className="input-field w-full pl-10" placeholder="e.g. Rahul Sharma" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Age</label>
              <input type="number" className="input-field w-full" placeholder="e.g. 14" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input type="tel" className="input-field w-full pl-10" placeholder="e.g. 9876543210" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Parent's Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input type="tel" className="input-field w-full pl-10" placeholder="e.g. 9876543211" required />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-white/40">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-primary" />
                <textarea className="input-field w-full pl-10 min-h-[80px]" placeholder="Full residential address" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Joining Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input type="date" className="input-field w-full pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Belt Level</label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <select className="input-field w-full pl-10 bg-card-dark">
                  {beltLevels.map(level => (
                    <option key={level} value={level}>{level} Belt</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Monthly Fee (₹)</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input type="number" className="input-field w-full pl-10" placeholder="e.g. 500" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Student Photo</label>
              <input type="file" className="text-sm text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              <Save className="w-4 h-4" />
              {initialData ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
