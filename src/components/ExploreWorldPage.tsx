import { useState } from 'react';
import { Layers, Map as MapIcon } from 'lucide-react';
import { Destination } from '../types/travel';
import { ExpeditionSlideShowcase } from './ExpeditionSlideShowcase';
import { WorldDiscoveryMap } from './WorldDiscoveryMap';

interface ExploreWorldPageProps {
  destinations: Destination[];
  selectedDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  onOpenDetails: (dest: Destination) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
}

export function ExploreWorldPage({
  destinations,
  selectedDestination,
  onSelectDestination,
  onOpenDetails,
  wishlistIds,
  onToggleWishlist,
}: ExploreWorldPageProps) {
  const [viewMode, setViewMode] = useState<'showcase' | 'map'>('showcase');

  return (
    <div className="bg-[#0B0F0D] text-[#F6F4EF] min-h-screen pt-24 pb-20 px-6 md:px-12">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C88A36] mb-2">
              Interactive Expedition Portal
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold">
              Explore World
            </h1>
            <p className="mt-3 text-sm md:text-base text-[#B6C2BB] leading-relaxed">
              Step into another world through the interactive radial slide showcase with hovering verified field popups, or switch to the geodesic world discovery map.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-full bg-[#131B17] border border-white/12 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'showcase' ? 'bg-[#C88A36] text-[#0B0F0D]' : 'text-[#D0D7D2] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Radial Slide Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'map' ? 'bg-[#C88A36] text-[#0B0F0D]' : 'text-[#D0D7D2] hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Discovery Map</span>
            </button>
          </div>
        </div>

        {viewMode === 'showcase' ? (
          <ExpeditionSlideShowcase
            destinations={destinations}
            selectedDestination={selectedDestination ?? destinations[0]}
            onSelectDestination={onSelectDestination}
            onOpenDetails={onOpenDetails}
            wishlistIds={wishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        ) : (
          <WorldDiscoveryMap
            destinations={destinations}
            selectedDestination={selectedDestination ?? destinations[0]}
            onSelectDestination={onSelectDestination}
            onOpenDetails={onOpenDetails}
            wishlistIds={wishlistIds}
            onToggleWishlist={onToggleWishlist}
          />
        )}
      </div>
    </div>
  );
}
