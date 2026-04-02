import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface AdModalProps {
  onContinue: () => void;
  onClose: () => void;
  songTitle?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_WAIT_SECONDS = 5;

export function AdModal({ onContinue, onClose, songTitle }: AdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(AD_WAIT_SECONDS);
  const [canContinue, setCanContinue] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Push AdSense ad unit once the modal mounts
  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // AdSense might not be loaded in dev — silent fail
      console.warn('[AdModal] AdSense push failed:', err);
    }
  }, []);

  // Start countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleContinue = () => {
    if (!canContinue) return;
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-[#111111] border border-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-textMuted uppercase tracking-widest font-mono mb-1">
                Advertisement
              </p>
              <p className="text-sm text-textSecondary">
                {songTitle
                  ? `Converting: ${songTitle.slice(0, 40)}${songTitle.length > 40 ? '…' : ''}`
                  : 'Your song is being prepared…'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-textMuted hover:text-text transition-colors p-1 rounded-lg hover:bg-surface"
              aria-label="Cancel download"
            >
              <X size={18} />
            </button>
          </div>

          {/* Ad unit container */}
          <div
            ref={adRef}
            className="flex items-center justify-center bg-[#0d0d0d] min-h-[250px] p-4"
          >
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '250px' }}
              data-ad-client={import.meta.env.VITE_ADSENSE_PUBLISHER_ID}
              data-ad-slot={import.meta.env.VITE_ADSENSE_AD_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            {/* Shown in dev or if AdSense fails to load */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <p className="text-textMuted text-xs font-mono">Ad space</p>
            </div>
          </div>

          {/* Footer with countdown */}
          <div className="px-6 py-5 flex items-center justify-between">
            <p className="text-sm text-textMuted font-mono">
              {canContinue ? (
                <span className="text-accent">Ready to convert ✓</span>
              ) : (
                <>
                  Continue in{' '}
                  <span className="text-text font-medium tabular-nums">
                    {secondsLeft}s
                  </span>
                </>
              )}
            </p>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`
                px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${canContinue
                  ? 'bg-accent text-black hover:bg-accentHover cursor-pointer scale-100 hover:scale-105'
                  : 'bg-surface text-textMuted cursor-not-allowed opacity-60'
                }
              `}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
