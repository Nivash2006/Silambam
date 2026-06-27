import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import Portal from './Portal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onClose
}) => {
  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-12 overflow-y-auto"
          >
            <div
              onClick={onClose}
              className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-3xl z-0 cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card !rounded-[3rem] w-full max-w-md relative z-10 border-white/10 p-10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] my-auto flex flex-col gap-6 pointer-events-auto"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isDanger ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="text-2xl font-black italic uppercase text-white leading-none tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm font-medium text-white/50 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-2 relative z-20">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white/[0.02] hover:bg-white/5 border border-white/5 text-white/60 hover:text-white font-black italic uppercase tracking-wider h-14 rounded-xl transition-all cursor-pointer pointer-events-auto"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 font-black italic uppercase tracking-wider h-14 rounded-xl transition-all cursor-pointer pointer-events-auto flex items-center justify-center ${
                    isDanger 
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)]' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-[#05070a] shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default ConfirmModal;
