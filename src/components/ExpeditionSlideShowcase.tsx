import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Continent, Destination, NatureCategory } from '../types/travel';
import { ALL_CATEGORIES } from '../data/destinations';

interface ExpeditionSlideShowcaseProps {
  destinations: Destination[];
  selectedDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  onOpenDetails: (dest: Destination) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
}

type TransitionStyle = 'iris' | 'push' | 'cube' | 'shutter';

const TRANSITION_LABELS: { id: TransitionStyle; label: string }[] = [
  { id: 'iris', label: 'Radial Iris' },
  { id: 'push', label: 'Radical Push' },
  { id: 'cube', label: '3D Cube Turn' },
  { id: 'shutter', label: 'Curtain Wipe' },
];

const CONTINENTS: ('All' | Continent)[] = [
  'All',
  'North America',
  'South America',
  'Europe',
  'Africa',
  'Asia',
  'Oceania',
];

export function ExpeditionSlideShowcase({
  destinations,
  selectedDestination,
  onSelectDestination,
  onOpenDetails,
  wishlistIds,
  onToggleWishlist,
}: ExpeditionSlideShowcaseProps) {
  const [continentFilter, setContinentFilter] = useState<'All' | Continent>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | NatureCategory>('All');
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>('iris');
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [slideKey, setSlideKey] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [hoveredHotspotIdx, setHoveredHotspotIdx] = useState<number | null>(0);
  const [hoveredThumbId, setHoveredThumbId] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    const list = destinations.filter((d) => {
      if (continentFilter !== 'All' && d.continent !== continentFilter) return false;
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      return true;
    });
    return list.length > 0 ? list : destinations;
  }, [destinations, continentFilter, categoryFilter]);

  const currentIdx = useMemo(() => {
    if (!selectedDestination) return 0;
    const found = slides.findIndex((s) => s.id === selectedDestination.id);
    return found >= 0 ? found : 0;
  }, [slides, selectedDestination]);

  const activeSlide = slides[currentIdx] ?? slides[0];

  const goToSlide = useCallback(
    (nextIndex: number, dir: 'next' | 'prev' = 'next') => {
      const wrapped = (nextIndex + slides.length) % slides.length;
      setDirection(dir);
      setSlideKey((k) => k + 1);
      setHoveredHotspotIdx(null);
      onSelectDestination(slides[wrapped]);
    },
    [slides, onSelectDestination]
  );

  // Auto-advance PowerPoint deck
  useEffect(() => {
    if (!autoPlay) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = window.setInterval(() => {
      goToSlide(currentIdx + 1, 'next');
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoPlay, currentIdx, goToSlide]);

  // Subtle JS mouse parallax tilt across the slide stage
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-ny * 3.5).toFixed(2)),
      ry: Number((nx * 4.5).toFixed(2)),
    });
  };

  const handleStageMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const transitionClass =
    transitionStyle === 'iris'
      ? 'ppt-transition-iris'
      : transitionStyle === 'cube'
      ? 'ppt-transition-cube'
      : transitionStyle === 'shutter'
      ? 'ppt-transition-shutter'
      : direction === 'next'
      ? 'ppt-transition-push-next'
      : 'ppt-transition-push-prev';

  // Three interactive hover hotspots per slide grounded in verified destination facts
  const hotspots = useMemo(
    () => [
      {
        id: 'telemetry',
        x: '22%',
        y: '34%',
        label: 'Verified Geography',
        title: `${activeSlide.metricLabel}: ${activeSlide.metricValue}`,
        detail: `${activeSlide.coordinates.formatted} · ${activeSlide.region}, ${activeSlide.country}`,
        source: activeSlide.verificationSource,
      },
      {
        id: 'climate',
        x: '56%',
        y: '28%',
        label: 'Seasonal Window & Access',
        title: `Best Window: ${activeSlide.bestSeason}`,
        detail: `Mean Temp ${activeSlide.avgTemp} (${activeSlide.weatherCondition}) · Gateway: ${activeSlide.howToReach.nearestAirport}`,
        source: activeSlide.permitsAndFees,
      },
      {
        id: 'stewardship',
        x: '76%',
        y: '60%',
        label: 'Protect Place & People',
        title: 'Conservation Stewardship',
        detail: activeSlide.conservationStewardship,
        source: `Difficulty: ${activeSlide.difficulty} · ${activeSlide.budgetTier}`,
      },
    ],
    [activeSlide]
  );

  return (
    <div className="space-y-6">
      {/* Filter & PowerPoint Transition Mode Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {CONTINENTS.map((cont) => (
            <button
              key={cont}
              type="button"
              onClick={() => {
                setContinentFilter(cont);
                setSlideKey((k) => k + 1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                continentFilter === cont
                  ? 'bg-[#C88A36] text-[#0B0F0D] font-semibold'
                  : 'bg-[#131B17] text-[#C8D1CB] hover:text-white border border-white/10'
              }`}
            >
              {cont}
            </button>
          ))}

          <select
            aria-label="Filter showcase by nature category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as 'All' | NatureCategory);
              setSlideKey((k) => k + 1);
            }}
            className="ml-1 bg-[#131B17] text-[#F6F4EF] text-xs px-3 py-1.5 rounded-full border border-white/15 focus:outline-none focus:border-[#C88A36]"
          >
            <option value="All">All 10 Biomes</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* PowerPoint Transition Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8C9B92] flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C88A36]" />
            Slide Effect:
          </span>
          {TRANSITION_LABELS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTransitionStyle(t.id);
                setSlideKey((k) => k + 1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                transitionStyle === t.id
                  ? 'bg-white text-[#0B0F0D] font-semibold'
                  : 'bg-[#131B17] text-[#C8D1CB] hover:text-white border border-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main PowerPoint-Style Radical Sliding Stage with Hovering Radial Popups */}
      <div
        ref={stageRef}
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
        style={{
          transform: `perspective(1400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative rounded-3xl overflow-hidden bg-[#0E1512] border border-white/12 min-h-[540px] md:min-h-[600px] shadow-2xl"
      >
        {/* Active Slide Content with CSS PowerPoint Transition Key */}
        <div key={`${activeSlide.id}-${slideKey}`} className={`absolute inset-0 ${transitionClass}`}>
          <img
            src={activeSlide.heroImage}
            alt={`${activeSlide.name} in ${activeSlide.country}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover animate-ken-burns"
          />
          {/* Measured Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080C0A] via-[#080C0A]/35 to-[#080C0A]/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C0A]/80 via-[#080C0A]/20 to-transparent" />
        </div>

        {/* Top Slide Telemetry Strip */}
        <div className="relative z-20 p-5 md:p-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#F6F4EF]">
            <span className="font-mono text-[#C88A36] tabular-nums font-semibold">
              SLIDE {String(currentIdx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
            <span className="text-white/30" aria-hidden="true">·</span>
            <span>{activeSlide.continent}</span>
            <span className="text-white/30" aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-white/85">{activeSlide.coordinates.formatted}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPlay((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B0F0D]/80 border border-white/15 text-xs text-[#E4E8E5] hover:border-[#C88A36] transition-colors cursor-pointer"
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5 text-[#C88A36]" /> : <Play className="w-3.5 h-3.5 text-[#C88A36]" />}
              <span>{autoPlay ? 'Auto Deck' : 'Paused'}</span>
            </button>

            <button
              type="button"
              onClick={() => goToSlide(currentIdx - 1, 'prev')}
              aria-label="Previous expedition slide"
              className="p-2 rounded-full bg-[#0B0F0D]/80 border border-white/15 text-white hover:border-[#C88A36] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(currentIdx + 1, 'next')}
              aria-label="Next expedition slide"
              className="p-2 rounded-full bg-[#0B0F0D]/80 border border-white/15 text-white hover:border-[#C88A36] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Hovering Radial Popup Hotspots */}
        <div className="relative z-20 hidden md:block h-[240px]">
          {hotspots.map((spot, idx) => {
            const isOpen = hoveredHotspotIdx === idx;
            return (
              <div
                key={spot.id}
                style={{ left: spot.x, top: spot.y }}
                onMouseEnter={() => setHoveredHotspotIdx(idx)}
                onMouseLeave={() => setHoveredHotspotIdx(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={() => setHoveredHotspotIdx(isOpen ? null : idx)}
                  onFocus={() => setHoveredHotspotIdx(idx)}
                  aria-label={`Inspect ${spot.label}`}
                  className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B0F0D]/85 border border-[#C88A36]/70 text-xs font-medium text-[#F6F4EF] shadow-lg transition-transform duration-200 hover:scale-110 cursor-pointer"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="ppt-radial-ripple absolute inline-flex h-full w-full rounded-full bg-[#C88A36]" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C88A36]" />
                  </span>
                  <span className="whitespace-nowrap">{spot.label}</span>
                </button>

                {isOpen && (
                  <div className="ppt-popup-card absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 rounded-2xl bg-[#0B0F0D]/95 border border-[#C88A36]/40 p-4 shadow-2xl text-left z-30">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#C88A36]">
                      {spot.label}
                    </p>
                    <h4 className="mt-1 font-display text-base font-semibold text-white">
                      {spot.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-[#D0D7D2] leading-relaxed">
                      {spot.detail}
                    </p>
                    <p className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-[#8C9B92] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                      <span className="truncate">{spot.source}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Editorial Caption & Action Deck */}
        <div className="relative z-20 p-6 md:p-10 mt-10 md:mt-0 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#C88A36] font-medium mb-2">
              <span>{activeSlide.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activeSlide.country}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{activeSlide.metricValue}</span>
            </div>

            <h3 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight [text-wrap:balance]">
              {activeSlide.name}
            </h3>

            <p className="mt-3 text-sm sm:text-base text-[#D8DFDA] leading-relaxed max-w-xl">
              {activeSlide.shortDescription}
            </p>

            <p className="mt-3 text-xs text-[#9CA9A1] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#52B788] shrink-0" />
              <span>Verified via {activeSlide.verificationSource}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onToggleWishlist(activeSlide.id)}
              aria-label={wishlistIds.includes(activeSlide.id) ? 'Remove from wishlist' : 'Save to wishlist'}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                wishlistIds.includes(activeSlide.id)
                  ? 'bg-[#1B4332] border-[#2D6A4F] text-white'
                  : 'bg-[#0B0F0D]/75 border-white/20 text-white hover:border-white/45'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={wishlistIds.includes(activeSlide.id) ? 'currentColor' : 'none'} />
              <span>{wishlistIds.includes(activeSlide.id) ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDetails(activeSlide)}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <span>Open Verified Guide</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Hovering PowerPoint Filmstrip Thumbnail Deck */}
      <div className="relative pt-2">
        <div className="flex items-center justify-between text-xs text-[#8C9B92] mb-3">
          <span>Hover any destination slide to preview · Click to trigger radical transition</span>
          <span className="font-mono tabular-nums">{slides.length} Worlds</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {slides.slice(0, 8).map((slide, idx) => {
            const isActive = slide.id === activeSlide.id;
            const isHovered = hoveredThumbId === slide.id;
            return (
              <div
                key={slide.id}
                onMouseEnter={() => setHoveredThumbId(slide.id)}
                onMouseLeave={() => setHoveredThumbId(null)}
                className="relative"
              >
                {/* Hovering Radial Popup Preview Card above thumbnail */}
                {isHovered && (
                  <div className="ppt-popup-card hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 rounded-xl bg-[#121916] border border-[#C88A36]/50 p-3 shadow-2xl z-30 pointer-events-none">
                    <p className="font-mono text-[10px] text-[#C88A36] uppercase">
                      {slide.category} · {slide.country}
                    </p>
                    <p className="mt-0.5 font-display text-sm font-semibold text-white leading-snug">
                      {slide.name}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#A8B5AD] tabular-nums">
                      {slide.metricValue} · {slide.bestSeason}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => goToSlide(idx, idx >= currentIdx ? 'next' : 'prev')}
                  style={{
                    transform: isHovered ? 'translateY(-10px) scale(1.06)' : isActive ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s',
                  }}
                  className={`w-full text-left rounded-xl overflow-hidden border cursor-pointer bg-[#121916] ${
                    isActive
                      ? 'border-[#C88A36] ring-2 ring-[#C88A36]/30'
                      : 'border-white/10 hover:border-white/40'
                  }`}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={slide.heroImage}
                      alt={slide.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 left-2 font-mono text-[10px] text-white/90 tabular-nums">
                      0{idx + 1}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-[#F6F4EF] truncate">
                      {slide.name.split('&')[0].trim()}
                    </p>
                    <p className="text-[10px] text-[#8C9B92] truncate">{slide.country}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
