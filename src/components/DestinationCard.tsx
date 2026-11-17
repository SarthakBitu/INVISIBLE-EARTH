import { ArrowRight, Bookmark } from 'lucide-react';
import { Destination } from '../types/travel';

interface DestinationCardProps {
  destination: Destination;
  onOpenDetails: (dest: Destination) => void;
  isSaved: boolean;
  onToggleWishlist: (id: string) => void;
  variant?: 'light' | 'dark';
}

export function DestinationCard({
  destination,
  onOpenDetails,
  isSaved,
  onToggleWishlist,
  variant = 'light',
}: DestinationCardProps) {
  const isDark = variant === 'dark';

  return (
    <article
      className={`group rounded-2xl overflow-hidden flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 ${
        isDark
          ? 'bg-[#121916] border border-white/10 text-[#F6F4EF]'
          : 'bg-white border border-[#E2DDD2] text-[#141816]'
      }`}
    >
      <div>
        <div
          onClick={() => onOpenDetails(destination)}
          className="relative aspect-[4/3] overflow-hidden bg-[#19231E] cursor-pointer"
        >
          <img
            src={destination.heroImage}
            alt={`${destination.name} in ${destination.country}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(destination.id);
            }}
            aria-label={isSaved ? `Remove ${destination.name} from wishlist` : `Save ${destination.name} to wishlist`}
            className={`absolute top-3.5 right-3.5 p-2.5 rounded-full transition-colors cursor-pointer ${
              isSaved
                ? 'bg-[#C88A36] text-[#0B0F0D]'
                : 'bg-[#0B0F0D]/70 text-white hover:bg-[#0B0F0D]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>

          <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs text-white/95 font-mono tabular-nums">
            <span>{destination.metricValue}</span>
            <span>{destination.avgTemp}</span>
          </div>
        </div>

        <div className="p-6">
          {/* Unboxed Clean Metadata */}
          <div
            className={`flex flex-wrap items-center gap-2 text-xs mb-2.5 ${
              isDark ? 'text-[#9CA9A1]' : 'text-[#5A655F]'
            }`}
          >
            <span className="font-medium text-[#C88A36]">{destination.category}</span>
            <span aria-hidden="true">·</span>
            <span>{destination.country}</span>
            <span aria-hidden="true">·</span>
            <span>{destination.region}</span>
          </div>

          <h3
            onClick={() => onOpenDetails(destination)}
            className="font-display text-xl font-semibold leading-snug cursor-pointer group-hover:text-[#C88A36] transition-colors"
          >
            {destination.name}
          </h3>

          <p
            className={`mt-2.5 text-sm leading-relaxed line-clamp-3 ${
              isDark ? 'text-[#C2CCC6]' : 'text-[#4B544F]'
            }`}
          >
            {destination.shortDescription}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div
          className={`pt-4 pb-5 border-t grid grid-cols-3 gap-2 text-xs ${
            isDark ? 'border-white/10' : 'border-[#ECE8DF]'
          }`}
        >
          <div>
            <span className={isDark ? 'text-[#8C9B92]' : 'text-[#6A746E]'}>Season</span>
            <p className="mt-0.5 font-medium truncate">{destination.bestSeason}</p>
          </div>
          <div>
            <span className={isDark ? 'text-[#8C9B92]' : 'text-[#6A746E]'}>Avg Temp</span>
            <p className="mt-0.5 font-mono tabular-nums font-medium">{destination.avgTemp}</p>
          </div>
          <div>
            <span className={isDark ? 'text-[#8C9B92]' : 'text-[#6A746E]'}>Difficulty</span>
            <p className="mt-0.5 font-medium truncate">{destination.difficulty}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(destination)}
          className={`w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
            isDark
              ? 'bg-white/8 hover:bg-[#C88A36] text-[#F6F4EF] hover:text-[#0B0F0D]'
              : 'bg-[#F4F1EA] hover:bg-[#1B4332] text-[#141816] hover:text-white'
          }`}
        >
          <span>Explore Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
