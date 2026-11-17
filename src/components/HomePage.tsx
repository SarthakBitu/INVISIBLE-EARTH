import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Compass, Map as MapIcon } from 'lucide-react';
import { Destination, NatureCategory, PageRoute } from '../types/travel';
import { ALL_CATEGORIES } from '../data/destinations';
import { HeroSection } from './HeroSection';
import { ExpeditionSlideShowcase } from './ExpeditionSlideShowcase';
import { DestinationCard } from './DestinationCard';
import { WorldDiscoveryMap } from './WorldDiscoveryMap';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  destinations: Destination[];
  selectedDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  onOpenDetails: (dest: Destination) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onNavigate: (page: PageRoute) => void;
}

export function HomePage({
  destinations,
  selectedDestination,
  onSelectDestination,
  onOpenDetails,
  wishlistIds,
  onToggleWishlist,
  onNavigate,
}: HomePageProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | NatureCategory>('All');
  const rootRef = useRef<HTMLDivElement>(null);

  const visibleCards =
    activeCategory === 'All'
      ? destinations.slice(0, 6)
      : destinations.filter((d) => d.category === activeCategory);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.gs-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* 1. Full-Screen Cinematic Hero */}
      <HeroSection
        onExploreNow={() => {
          document.getElementById('global-explorer')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectDestination={(id) => {
          const found = destinations.find((d) => d.id === id);
          if (found) onOpenDetails(found);
        }}
      />

      {/* 2. Interactive Expedition Slide Showcase (JS + CSS Radial/Radical Transitions) */}
      <section id="global-explorer" className="bg-[#0B0F0D] text-[#F6F4EF] py-20 md:py-24 px-6 md:px-12 border-t border-white/8">
        <div className="max-w-[1440px] mx-auto gs-reveal">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C88A36] mb-3">
                Interactive Expedition Deck
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight [text-wrap:balance]">
                Step Into Another World
              </h2>
              <p className="mt-3 text-sm md:text-base text-[#B6C2BB] leading-relaxed">
                Switch between radial iris, radical push, 3D cube, and curtain wipe transitions. Hover any waypoint marker or slide thumbnail to reveal verified geography, climate, and conservation stewardship.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 hover:border-[#C88A36] text-xs font-semibold text-[#F6F4EF] transition-colors cursor-pointer shrink-0 self-start md:self-auto"
            >
              <Compass className="w-4 h-4 text-[#C88A36]" />
              <span>Full Atlas Workspace</span>
            </button>
          </div>

          <ExpeditionSlideShowcase
            destinations={destinations}
            selectedDestination={selectedDestination ?? destinations[0]}
            onSelectDestination={onSelectDestination}
            onOpenDetails={onOpenDetails}
            wishlistIds={wishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        </div>
      </section>

      {/* 3. Explore Destinations by 10 Nature Categories */}
      <section className="bg-[#F6F4EF] text-[#141816] py-20 md:py-24 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto gs-reveal">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C88A36] mb-3">
                Extraordinary Landscapes
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight [text-wrap:balance]">
                Explore by Natural Biome
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('mountains')}
                className="px-4 py-2 rounded-full border border-[#DCD6C8] hover:border-[#1B4332] font-medium transition-colors cursor-pointer"
              >
                Mountains
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rivers-waterfalls')}
                className="px-4 py-2 rounded-full border border-[#DCD6C8] hover:border-[#1B4332] font-medium transition-colors cursor-pointer"
              >
                Rivers & Waterfalls
              </button>
              <button
                type="button"
                onClick={() => onNavigate('lakes-forests')}
                className="px-4 py-2 rounded-full border border-[#DCD6C8] hover:border-[#1B4332] font-medium transition-colors cursor-pointer"
              >
                Lakes & Forests
              </button>
              <button
                type="button"
                onClick={() => onNavigate('destinations')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1B4332] text-white font-semibold hover:bg-[#2D6A4F] transition-colors cursor-pointer"
              >
                <span>All Destinations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive 10-Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-8 border-b border-[#E2DDD2] mb-10">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'All'
                  ? 'bg-[#141816] text-white'
                  : 'bg-white text-[#4B544F] border border-[#E2DDD2] hover:border-[#141816]'
              }`}
            >
              Featured Selection
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#1B4332] text-white font-semibold'
                    : 'bg-white text-[#4B544F] border border-[#E2DDD2] hover:border-[#1B4332]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {visibleCards.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onOpenDetails={onOpenDetails}
                isSaved={wishlistIds.includes(dest.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. World Map & Geodesic Discovery Section */}
      <section className="bg-[#0E1512] text-[#F6F4EF] py-20 md:py-24 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto gs-reveal">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C88A36] mb-3">
                Route & Proximity Intelligence
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">
                World Map & Location Discovery
              </h2>
              <p className="mt-3 text-sm md:text-base text-[#B6C2BB] leading-relaxed">
                Search any destination, calculate geodesic flight distances from global hubs, uncover nearby mountains and rivers, and save places to your wishlist.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#A8B5AD]">
              <MapIcon className="w-4 h-4 text-[#C88A36]" />
              <span>Great-Circle Navigation Active</span>
            </div>
          </div>

          <WorldDiscoveryMap
            destinations={destinations}
            selectedDestination={selectedDestination ?? destinations[0]}
            onSelectDestination={onSelectDestination}
            onOpenDetails={onOpenDetails}
            wishlistIds={wishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        </div>
      </section>

      {/* 5. Adventure Planner & Travel Community Editorial Split */}
      <section className="bg-[#F6F4EF] text-[#141816] py-20 md:py-24 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 gs-reveal">
          <div className="bg-[#121916] text-[#F6F4EF] rounded-2xl p-8 md:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C88A36] mb-3">
                Custom Trip Engine
              </p>
              <h3 className="font-display text-3xl font-semibold [text-wrap:balance]">
                Design Your Next Expedition
              </h3>
              <p className="mt-3 text-sm text-[#C2CCC6] leading-relaxed max-w-md">
                Choose travel dates, party style (solo, couple, friends, or family), and preferred activities to generate a day-by-day itinerary and itemized budget forecast.
              </p>
            </div>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Open Adventure Planner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-8 md:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4332] mb-3">
                Traveler Dispatches
              </p>
              <h3 className="font-display text-3xl font-semibold [text-wrap:balance]">
                Read & Share Field Stories
              </h3>
              <p className="mt-3 text-sm text-[#4B544F] leading-relaxed max-w-md">
                Explore first-hand photography, location ratings, and itineraries uploaded by explorers, or publish your own expedition notes to the community.
              </p>
            </div>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => onNavigate('stories')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Visit Travel Community</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
