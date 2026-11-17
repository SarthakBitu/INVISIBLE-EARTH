import { useEffect, useState } from 'react';
import { IMAGES } from '../data/destinations';

interface EarthLoaderProps {
  onComplete: () => void;
}

export function EarthLoader({ onComplete }: EarthLoaderProps) {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openTimer = window.setTimeout(() => setOpening(true), prefersReduced ? 120 : 900);
    const doneTimer = window.setTimeout(onComplete, prefersReduced ? 220 : 1650);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        clipPath: opening ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
        transition: 'clip-path 0.75s cubic-bezier(0.76, 0, 0.24, 1)',
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080C0A] overflow-hidden"
      role="status"
      aria-label="Opening Wild Earth Portal"
    >
      <img
        src={IMAGES.heroAlpine}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080C0A]/80 via-[#080C0A]/70 to-[#080C0A]" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="relative flex items-center justify-center w-28 h-28 mb-7">
          <svg
            viewBox="0 0 120 120"
            className="w-28 h-28 text-[#C88A36]/85 animate-spin-slow"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.9" strokeDasharray="4 6" />
            <circle cx="60" cy="60" r="40" stroke="#2D6A4F" strokeWidth="1.2" />
            <circle cx="60" cy="60" r="24" stroke="#C88A36" strokeWidth="0.8" strokeOpacity="0.6" />
            <line x1="60" y1="6" x2="60" y2="114" stroke="#2D6A4F" strokeWidth="0.7" />
            <line x1="6" y1="60" x2="114" y2="60" stroke="#2D6A4F" strokeWidth="0.7" />
          </svg>
          <span className="absolute w-3 h-3 rounded-full bg-[#C88A36]" />
        </div>

        <p className="font-display text-3xl sm:text-4xl tracking-[0.22em] text-[#F6F4EF] uppercase">
          Wild Earth
        </p>
        <p className="mt-2.5 font-mono text-xs tracking-[0.2em] text-[#C88A36] uppercase">
          Verified Field Atlas · Step Beyond Limits
        </p>

        <button
          type="button"
          onClick={() => {
            setOpening(true);
            window.setTimeout(onComplete, 400);
          }}
          className="mt-8 px-5 py-2 text-xs text-[#D0D7D2] hover:text-white border border-white/20 hover:border-[#C88A36] rounded-full transition-colors cursor-pointer"
        >
          Enter World
        </button>
      </div>
    </div>
  );
}
