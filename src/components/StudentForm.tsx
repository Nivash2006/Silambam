import React, { useRef } from 'react';
import { X, Save, User, Phone, MapPin, Calendar, CreditCard, Award, Camera, Loader2, Zap } from 'lucide-react';
import { BeltLevel, Student } from '../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Student, 'id' | 'fee_status' | 'created_at'>) => void;
  initialData?: Student;
}

const beltLevels: BeltLevel[] = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'];

import Portal from './Portal';

const StudentForm: React.FC<StudentFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = React.useState({
    name: initialData?.name || '',
    age: initialData?.age?.toString() || '',
    phone: initialData?.phone || '',
    parent_phone: initialData?.parent_phone || '',
    address: initialData?.address || '',
    joining_date: initialData?.joining_date || format(new Date(), 'yyyy-MM-dd'),
    belt_level: initialData?.belt_level || 'White' as BeltLevel,
    fee_amount: initialData?.fee_amount?.toString() || '500',
    photo_url: initialData?.photo_url || '',
  });

  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const loadToast = toast.loading('Synchronizing biometric data...');
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('academy')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('academy')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, photo_url: publicUrl }));
      toast.success('Biometric profile updated.', { id: loadToast });
    } catch (error: any) {
      console.error('Storage Upload Error:', error);
      toast.error(`Identity capture failed: ${error.message || 'Unknown protocol error'}`, { id: loadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      age: parseInt(form.age),
      phone: form.phone,
      parent_phone: form.parent_phone,
      address: form.address,
      joining_date: form.joining_date,
      belt_level: form.belt_level as BeltLevel,
      fee_amount: parseInt(form.fee_amount),
      photo_url: form.photo_url,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-xl"
              onClick={onClose}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.7 }}
              className="glass-card w-full max-w-4xl !p-0 shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-white/5 relative z-20 overflow-hidden flex flex-col md:flex-row max-h-[95vh]"
            >
              {/* Form Left Side - Preview & Image */}
              <div className="md:w-72 bg-gradient-to-br from-emerald-500/10 to-transparent border-r border-white/5 p-10 flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative w-40 h-40 rounded-[2.5rem] bg-white/[0.03] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-emerald-500/50">
                    {form.photo_url ? (
                      <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="w-8 h-8 text-white/20 mx-auto mb-2 group-hover:text-emerald-400 transition-colors" />
                        <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Upload Student Photo</p>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                </div>

                <div className="mt-8 text-center">
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-white truncate w-full">{form.name || 'Unrecorded'}</h4>
                  <p className="text-[10px] text-emerald-500/50 font-black uppercase tracking-[0.3em] mt-2">{form.belt_level} Belt</p>
                </div>

                <div className="mt-auto space-y-4 w-full">
                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 relative overflow-hidden group/id">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1.5 relative z-10">Academy ID</p>
                    <p className="text-xs font-black text-white italic relative z-10">#MS-{Math.floor(Math.random() * 9000 + 1000)}</p>
                  </div>
                </div>
              </div>

              {/* Form Right Side - Data Entry */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-20">
                  <div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Student <span className="text-emerald-500">Enrollment</span></h3>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mt-2">Academy Registration Form</p>
                  </div>
                  <button 
                    type="button"
                    onClick={onClose} 
                    className="p-3 hover:bg-white/5 rounded-2xl transition-all group relative z-30"
                  >
                    <X className="w-6 h-6 text-white/20 group-hover:text-rose-500" />
                  </button>
                </div>

                <form className="p-10 overflow-y-auto custom-scrollbar space-y-12" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Row 1 */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Identity Designation</label>
                      <div className="relative group/input">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input name="name" type="text" className="input-field w-full pl-14 h-16 bg-white/[0.01] font-bold italic tracking-tight" placeholder="Legal Name" value={form.name} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Maturity Cycle</label>
                      <div className="relative group/input">
                        <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input name="age" type="number" className="input-field w-full pl-14 h-16 bg-white/[0.01] font-bold italic tracking-tight" placeholder="Years" value={form.age} onChange={handleChange} required />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Primary Transmission</label>
                      <div className="relative group/input">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input name="phone" type="tel" className="input-field w-full pl-14 h-16 bg-white/[0.01] font-bold italic tracking-tight" placeholder="Contact Frequency" value={form.phone} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Guardian Link</label>
                      <div className="relative group/input">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input name="parent_phone" type="tel" className="input-field w-full pl-14 h-16 bg-white/[0.01] font-bold italic tracking-tight" placeholder="Emergency Backup" value={form.parent_phone} onChange={handleChange} required />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Geographical Domain</label>
                      <div className="relative group/input">
                        <MapPin className="absolute left-5 top-6 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <textarea name="address" className="input-field w-full pl-14 pt-6 min-h-[100px] bg-white/[0.01] font-bold italic tracking-tight" placeholder="Base of Operations" value={form.address} onChange={handleChange} required />
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Initiation Cycle</label>
                      <div className="relative group/input">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input name="joining_date" type="date" className="input-field w-full pl-14 h-16 bg-white/[0.01] font-bold italic tracking-tight font-mono" value={form.joining_date} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Current Standing</label>
                      <div className="relative group/input">
                        <Award className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <select name="belt_level" className="input-field w-full pl-14 h-16 bg-[#0a0f14] font-bold italic tracking-tight appearance-none cursor-pointer" value={form.belt_level} onChange={handleChange}>
                          {beltLevels.map(level => (
                            <option key={level} value={level}>{level} Belt</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 5 */}
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Monthly Fee (₹)</label>
                      <div className="relative group/input">
                        <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input name="fee_amount" type="number" className="input-field w-full pl-14 h-16 bg-white/[0.01] font-bold italic tracking-tight" placeholder="Enter fee amount" value={form.fee_amount} onChange={handleChange} required />
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 flex flex-col sm:flex-row gap-6 relative z-30">
                    <button type="button" onClick={onClose} className="btn-secondary !bg-white/[0.01] border-white/5 flex-1 h-18 uppercase font-black tracking-[0.3em] text-[10px] hover:!bg-rose-500/10 hover:!text-rose-500 hover:!border-rose-500/20 transition-all">Cancel</button>
                    <button type="submit" className="btn-primary flex-[2] h-18 uppercase font-black tracking-[0.3em] text-[10px] shadow-[0_20px_60px_rgba(16,185,129,0.3)] group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <Save className="w-5 h-5" />
                      <span>{initialData ? 'Update Student' : 'Enroll Student'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};

export default StudentForm;
