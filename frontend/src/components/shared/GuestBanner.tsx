import { X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { markGuestPromptSeen } from '../../lib/guestStorage';

export function GuestBanner() {
  const { user } = useAuthStore();
  const { guestPromptShown, setGuestPromptShown, openAuthModal } = useUIStore();

  if (user || guestPromptShown) return null;

  const dismiss = () => {
    markGuestPromptSeen();
    setGuestPromptShown(true);
  };

  return (
    <div className="flex-shrink-0 bg-accent/10 border-b border-accent/20 px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm text-text">
        <span className="font-medium">You're browsing as a guest.</span>{' '}
        <span className="text-textSecondary">Sign in to sync your music across all your devices.</span>
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => { openAuthModal(); dismiss(); }}
          className="px-4 py-1.5 bg-accent hover:bg-accentHover text-black text-sm font-medium rounded-full transition-colors"
        >
          Sign in
        </button>
        <button
          onClick={dismiss}
          className="text-textMuted hover:text-text transition-colors p-1 rounded"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
