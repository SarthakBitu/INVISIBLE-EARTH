import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowDown, ArrowRight, Compass, Pause, Play, Thermometer } from 'lucide-react';
import { HERO_REEL_SCENES } from '../data/destinations';

interface HeroSectionProps {
  onExploreNow: () => void;
  onSelectDestination: (destinationId: string) => void;
}

export function HeroSection({ onExploreNow, onSelectDestination }: HeroSectionProps) {
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [reelPlaying, setReelPlaying] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const atmosphereCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeScene = HERO_REEL_SCENES[activeSceneIdx];

  // Auto-advance documentary background reel
  useEffect(() => {
    if (!reelPlaying) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = window.setInterval(() => {
      setActiveSceneIdx((prev) => (prev + 1) % HERO_REEL_SCENES.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [reelPlaying]);

  // GSAP cinematic entrance animation
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.05, ease: 'power3.out', delay: 0.15 }
      );
      gsap.fromTo(
        subRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.35 }
      );
      gsap.fromTo(
        ctaRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.55 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Procedural atmospheric mist & drifting light motes over documentary scenes
  useEffect(() => {
    const canvas = atmosphereCanvasRef.current;
    if (!canvas) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const motes = Array.from({ length: 38 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.8 + Math.random() * 2.1,
      vx: -0.18 + Math.random() * 0.36,
      vy: -0.25 - Math.random() * 0.25,
      alpha: 0.15 + Math.random() * 0.4,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -10) m.y = canvas.height + 10;
        if (m.x < -10) m.x = canvas.width + 10;
        if (m.x > canvas.width + 10) m.x = -10;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246, 244, 239, ${m.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#0B0F0D] flex flex-col justify-between pt-24 pb-10 px-6 md:px-12"
    >
      {/* Multi-Scene Ken Burns Documentary Background */}
      <div className="absolute inset-0 z-0">
        {HERO_REEL_SCENES.map((scene, index) => (
          <img
            key={scene.id}
            src={scene.image}
            alt={`${scene.title} in ${scene.location}`}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover animate-ken-burns transition-opacity duration-[1600ms] ease-out ${
              index === activeSceneIdx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <canvas
          ref={atmosphereCanvasRef}
          className="absolute inset-0 pointer-events-none opacity-65"
          aria-hidden="true"
        />
        {/* Measured contrast scrims */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0D]/80 via-[#0B0F0D]/35 to-[#0B0F0D]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F0D]/75 via-transparent to-[#0B0F0D]/40" />
      </div>

      {/* Top Floating Location Telemetry & Weather Strip */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => onSelectDestination(activeScene.destinationId)}
          className="group flex flex-wrap items-center gap-3 text-left text-xs text-[#E3E7E4] hover:text-white transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4 text-[#C88A36] shrink-0" />
          <span className="font-medium tracking-wide">{activeScene.title}</span>
          <span className="text-white/40" aria-hidden="true">·</span>
          <span className="text-white/80">{activeScene.location}</span>
          <span className="text-white/40" aria-hidden="true">·</span>
          <span className="font-mono text-[#C88A36] tabular-nums">{activeScene.coords}</span>
        </button>

        <div className="flex items-center gap-4 text-xs text-[#E3E7E4]">
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-[#C88A36]" />
            <span className="font-mono tabular-nums">{activeScene.weather}</span>
          </div>
          <span className="text-white/30" aria-hidden="true">|</span>
          <span className="font-mono tabular-nums text-white/80">{activeScene.elevation}</span>
        </div>
      </div>

      {/* Dominant Hero Typography Anchor */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto my-auto py-12">
        <div className="max-w-3xl">
          <p className="text-xs md:text-sm font-medium tracking-[0.22em] text-[#C88A36] uppercase mb-5">
            Expedition Atlas · Seven Continents
          </p>
          <h1
            ref={headlineRef}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold leading-[1.05] tracking-tight text-[#F6F4EF] [text-wrap:balance]"
          >
            THE WORLD IS YOURS TO EXPLORE.
          </h1>
          <p
            ref={subRef}
            className="mt-6 text-base sm:text-lg md:text-xl text-[#D8DFDA] leading-relaxed max-w-xl"
          >
            Discover extraordinary places. Follow the wild. Find your next adventure across untouched peaks, ancient rivers, and glacial horizons.
          </p>

          <div ref={ctaRef} className="mt-9 flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={onExploreNow}
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] font-semibold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-[#C88A36]/20 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Now</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => onSelectDestination(activeScene.destinationId)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-white/25 bg-[#0B0F0D]/45 hover:bg-white/10 text-[#F6F4EF] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>View Featured Location</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Documentary Reel Selector & Animated Scroll Indicator */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReelPlaying((p) => !p)}
            aria-label={reelPlaying ? 'Pause background reel' : 'Play background reel'}
            className="p-2 rounded-full border border-white/20 bg-[#0B0F0D]/60 text-white/80 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
          >
            {reelPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {HERO_REEL_SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveSceneIdx(idx)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer ${
                idx === activeSceneIdx
                  ? 'bg-white text-[#0B0F0D] font-semibold'
                  : 'bg-[#0B0F0D]/55 text-white/75 hover:text-white border border-white/15'
              }`}
            >
              0{idx + 1}. {scene.title.split(' ')[0]}
            </button>
          ))}
        </div>

        <a
          href="#global-explorer"
          className="flex items-center gap-3 text-xs tracking-[0.16em] uppercase text-[#D0D7D2] hover:text-white transition-colors"
        >
          <span>Scroll to Atlas</span>
          <span className="w-6 h-10 rounded-full border border-white/30 flex items-start justify-center p-1.5">
            <ArrowDown className="w-3 h-3 text-[#C88A36] animate-scroll-drop" />
          </span>
        </a>
      </div>
    </section>
  );
}
