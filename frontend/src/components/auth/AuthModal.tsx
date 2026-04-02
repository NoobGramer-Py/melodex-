import { useState } from 'react';
import { X, Mail, Lock, Chrome } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export function AuthModal() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuthStore();
  const { closeAuthModal } = useUIStore();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        closeAuthModal();
      } else {
        await signUpWithEmail(email, password);
        setSuccess('Check your email for a confirmation link.');
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message || 'Google sign-in failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAuthModal} />

      <div className="relative z-10 w-full max-w-sm mx-4 bg-[#111111] border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-textMuted mt-0.5">
                {mode === 'signin'
                  ? 'Sign in to sync your music everywhere'
                  : 'Start your free account today'}
              </p>
            </div>
            <button
              onClick={closeAuthModal}
              className="text-textMuted hover:text-text transition-colors p-1.5 rounded-lg hover:bg-surface"
            >
              <X size={18} />
            </button>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface hover:bg-surfaceHover border border-border rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Chrome size={18} className="text-textSecondary" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-textMuted font-mono">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-accent text-xs bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accentHover text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-textMuted mt-5">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
              className="text-accent hover:text-accentHover transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
