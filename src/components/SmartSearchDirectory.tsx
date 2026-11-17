import { useMemo, useState } from 'react';
import { Bookmark, RotateCcw, Search } from 'lucide-react';
import {
  BudgetTier,
  Continent,
  Destination,
  DifficultyLevel,
  NatureCategory,
  TravelSeason,
  WeatherCondition,
} from '../types/travel';
import { ALL_CATEGORIES } from '../data/destinations';
import { DestinationCard } from './DestinationCard';

interface SmartSearchDirectoryProps {
  title: string;
  subtitle: string;
  destinations: Destination[];
  lockedCategories?: NatureCategory[];
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onOpenDetails: (dest: Destination) => void;
  showWishlistOnlyDefault?: boolean;
}

export function SmartSearchDirectory({
  title,
  subtitle,
  destinations,
  lockedCategories,
  wishlistIds,
  onToggleWishlist,
  onOpenDetails,
  showWishlistOnlyDefault = false,
}: SmartSearchDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState('All');
  const [continent, setContinent] = useState<'All' | Continent>('All');
  const [category, setCategory] = useState<'All' | NatureCategory>('All');
  const [budget, setBudget] = useState<'All' | BudgetTier>('All');
  const [season, setSeason] = useState<'All' | TravelSeason>('All');
  const [difficulty, setDifficulty] = useState<'All' | DifficultyLevel>('All');
  const [weather, setWeather] = useState<'All' | WeatherCondition>('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'elevation' | 'name'>('popularity');
  const [wishlistOnly, setWishlistOnly] = useState(showWishlistOnlyDefault);

  const baseList = useMemo(() => {
    if (!lockedCategories || lockedCategories.length === 0) return destinations;
    return destinations.filter((d) => lockedCategories.includes(d.category));
  }, [destinations, lockedCategories]);

  const countries = useMemo(
    () => ['All', ...Array.from(new Set(baseList.map((d) => d.country))).sort()],
    [baseList]
  );

  const filtered = useMemo(() => {
    return baseList
      .filter((d) => {
        if (wishlistOnly && !wishlistIds.includes(d.id)) return false;
        if (country !== 'All' && d.country !== country) return false;
        if (continent !== 'All' && d.continent !== continent) return false;
        if (category !== 'All' && d.category !== category) return false;
        if (budget !== 'All' && d.budgetTier !== budget) return false;
        if (season !== 'All' && d.seasonTag !== season && d.seasonTag !== 'Year-Round') return false;
        if (difficulty !== 'All' && d.difficulty !== difficulty) return false;
        if (weather !== 'All' && d.weatherCondition !== weather) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            d.name.toLowerCase().includes(q) ||
            d.country.toLowerCase().includes(q) ||
            d.region.toLowerCase().includes(q) ||
            d.shortDescription.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') return b.popularityScore - a.popularityScore;
        if (sortBy === 'elevation') return b.elevationMeters - a.elevationMeters;
        return a.name.localeCompare(b.name);
      });
  }, [
    baseList,
    wishlistOnly,
    wishlistIds,
    country,
    continent,
    category,
    budget,
    season,
    difficulty,
    weather,
    searchQuery,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setCountry('All');
    setContinent('All');
    setCategory('All');
    setBudget('All');
    setSeason('All');
    setDifficulty('All');
    setWeather('All');
    setSortBy('popularity');
    setWishlistOnly(false);
  };

  return (
    <div className="bg-[#F6F4EF] text-[#141816] min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Editorial Page Header */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C88A36] mb-3">
            Curated Field Index
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-[#141816] [text-wrap:balance]">
            {title}
          </h1>
          <p className="mt-4 text-base md:text-lg text-[#4B544F] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* 9-Dimension Smart Search & Filter Panel */}
        <div className="bg-white border border-[#E2DDD2] rounded-2xl p-5 md:p-6 mb-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#6A746E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destination name, region, or landscape..."
                className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#141816] placeholder-[#6A746E] focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by Continent"
                value={continent}
                onChange={(e) => setContinent(e.target.value as 'All' | Continent)}
                className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-3 py-2.5 text-xs text-[#141816]"
              >
                <option value="All">All Continents</option>
                {(['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania'] as Continent[]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-3 py-2.5 text-xs text-[#141816]"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Countries' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWishlistOnly((w) => !w)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  wishlistOnly
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-[#F6F4EF] text-[#141816] border-[#DCD6C8] hover:border-[#1B4332]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={wishlistOnly ? 'currentColor' : 'none'} />
                <span>Saved ({wishlistIds.length})</span>
              </button>

              <button
                type="button"
                onClick={resetFilters}
                aria-label="Reset all filters"
                className="p-2.5 rounded-xl border border-[#DCD6C8] bg-[#F6F4EF] hover:bg-[#ECE8DF] text-[#4B544F] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-[#ECE8DF]">
            {!lockedCategories && (
              <select
                aria-label="Filter by Nature Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as 'All' | NatureCategory)}
                className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs text-[#141816]"
              >
                <option value="All">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Filter by Budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value as 'All' | BudgetTier)}
              className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs text-[#141816]"
            >
              <option value="All">Any Budget</option>
              <option value="Budget">Budget ($100–$150/d)</option>
              <option value="Mid-Range">Mid-Range ($150–$250/d)</option>
              <option value="Luxury">Luxury ($250+/d)</option>
            </select>

            <select
              aria-label="Filter by Best Season"
              value={season}
              onChange={(e) => setSeason(e.target.value as 'All' | TravelSeason)}
              className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs text-[#141816]"
            >
              <option value="All">Any Season</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Autumn">Autumn</option>
              <option value="Winter">Winter</option>
            </select>

            <select
              aria-label="Filter by Adventure Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'All' | DifficultyLevel)}
              className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs text-[#141816]"
            >
              <option value="All">Any Difficulty</option>
              <option value="Accessible">Accessible</option>
              <option value="Moderate">Moderate</option>
              <option value="Challenging">Challenging</option>
              <option value="Expedition">Expedition</option>
            </select>

            <select
              aria-label="Filter by Weather Condition"
              value={weather}
              onChange={(e) => setWeather(e.target.value as 'All' | WeatherCondition)}
              className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs text-[#141816]"
            >
              <option value="All">Any Weather</option>
              <option value="Alpine Crisp">Alpine Crisp</option>
              <option value="Tropical Mist">Tropical Mist</option>
              <option value="Arctic Clear">Arctic Clear</option>
              <option value="Arid Sun">Arid Sun</option>
              <option value="Temperate">Temperate</option>
            </select>

            <select
              aria-label="Sort results"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popularity' | 'elevation' | 'name')}
              className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs font-medium text-[#1B4332]"
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="elevation">Sort: Highest Elevation</option>
              <option value="name">Sort: A – Z</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#5A655F]">
          <span>
            Displaying <strong className="font-mono text-[#141816] tabular-nums">{filtered.length}</strong> curated destinations
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-12 text-center space-y-4">
            <p className="font-display text-2xl font-semibold text-[#141816]">No matching expeditions found</p>
            <p className="text-sm text-[#5A655F] max-w-md mx-auto">
              Adjust your season, difficulty, or budget filters to uncover more wild destinations.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onOpenDetails={onOpenDetails}
                isSaved={wishlistIds.includes(dest.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
