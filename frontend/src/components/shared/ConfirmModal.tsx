import { X, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export function ConfirmModal() {
  const { confirmModal, closeConfirm } = useUIStore();
  const { 
    open, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmLabel = 'Confirm', 
    cancelLabel = 'Cancel',
    destructive = false 
  } = confirmModal;

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    closeConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={handleCancel}
      />
      <div className="relative z-10 w-full max-w-sm bg-[#111111] border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${destructive ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-bold text-text">{title}</h3>
          </div>
          
          <p className="text-sm text-textSecondary mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-surface hover:bg-surfaceHover text-text font-semibold rounded-xl text-sm transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 font-semibold rounded-xl text-sm transition-colors ${
                destructive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-accent hover:bg-accentHover text-black'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
