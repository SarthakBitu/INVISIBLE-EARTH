import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Bookmark, Heart, Plus, Star, Upload, X } from 'lucide-react';
import { Destination, DestinationReview, TravelStory } from '../types/travel';

interface TravelStoriesPageProps {
  stories: TravelStory[];
  reviews: DestinationReview[];
  destinations: Destination[];
  wishlistIds: string[];
  likedStoryIds: string[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onToggleWishlist: (id: string) => void;
  onLikeStory: (storyId: string) => Promise<void> | void;
  onAddStory: (story: Omit<TravelStory, 'id' | 'date' | 'likes'>) => Promise<void> | void;
  onOpenDetails: (dest: Destination) => void;
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a supported image.'));
      img.onload = () => {
        const tryEncode = (maxDim: number, quality: number): string => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return '';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', quality);
        };

        let encoded = tryEncode(960, 0.72);
        if (encoded.length > 340000) encoded = tryEncode(760, 0.62);
        if (encoded.length > 340000) encoded = tryEncode(560, 0.55);
        if (!encoded || encoded.length > 345000) {
          reject(new Error('Image stays over 350 KB after compression; please pick a smaller photo.'));
          return;
        }
        resolve(encoded);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  });
}

export function TravelStoriesPage({
  stories,
  reviews,
  destinations,
  wishlistIds,
  likedStoryIds,
  currentUser,
  onOpenAuth,
  onToggleWishlist,
  onLikeStory,
  onAddStory,
  onOpenDetails,
}: TravelStoriesPageProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<TravelStory | null>(null);
  const [filterDestId, setFilterDestId] = useState('All');

  // Story composer fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(currentUser?.displayName || '');
  const [authorRole, setAuthorRole] = useState('Field Explorer');
  const [destId, setDestId] = useState(destinations[0].id);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [itineraryNote, setItineraryNote] = useState('');
  const [uploadedPhotoData, setUploadedPhotoData] = useState<string>('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (currentUser?.displayName && !author) {
      setAuthor(currentUser.displayName);
    }
  }, [currentUser, author]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPublishError(null);
    try {
      const compressed = await compressImageToDataUrl(file);
      setUploadedPhotoData(compressed);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError(null);
    if (!currentUser || !currentUser.emailVerified) {
      onOpenAuth();
      return;
    }

    const dest = destinations.find((d) => d.id === destId) ?? destinations[0];
    const cleanAuthor = (author || currentUser.displayName || 'Field Explorer').trim();
    if (title.trim().length < 3 || body.trim().length < 10) {
      setPublishError('Please enter a title (3+ characters) and story body (10+ characters).');
      return;
    }

    setPublishing(true);
    try {
      await onAddStory({
        title: title.trim(),
        author: cleanAuthor,
        authorRole: authorRole.trim() || 'Field Explorer',
        destinationId: dest.id,
        destinationName: dest.name,
        country: dest.country,
        rating,
        imageUrl: uploadedPhotoData || dest.heroImage,
        excerpt: body.trim().slice(0, 155) + (body.trim().length > 155 ? '…' : ''),
        body: body.trim(),
        sharedItinerarySummary: itineraryNote.trim() || undefined,
      });

      setTitle('');
      setBody('');
      setItineraryNote('');
      setUploadedPhotoData('');
      setComposerOpen(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Could not publish story.');
    } finally {
      setPublishing(false);
    }
  };

  const filteredStories =
    filterDestId === 'All' ? stories : stories.filter((s) => s.destinationId === filterDestId);

  const savedDestinations = destinations.filter((d) => wishlistIds.includes(d.id));

  return (
    <div className="bg-[#F6F4EF] text-[#141816] min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-14">
        {/* Header & Upload Trigger */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C88A36] mb-3">
              Explorer Community
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-[#141816]">
              Travel Stories & Field Notes
            </h1>
            <p className="mt-4 text-base text-[#4B544F] leading-relaxed">
              Dispatches, expedition photographs, trail ratings, and shared itineraries contributed by travelers across every continent.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setComposerOpen((o) => !o)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{composerOpen ? 'Close Story Studio' : 'Upload Story & Photos'}</span>
          </button>
        </div>

        {/* Upload Story Form */}
        {composerOpen && (
          <form
            onSubmit={handlePublish}
            className="bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-8 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Publish an Adventure Story</h2>
              {!currentUser?.emailVerified && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-1.5 rounded-full bg-[#C88A36] text-[#0B0F0D] text-xs font-semibold cursor-pointer"
                >
                  {currentUser ? 'Verify Email to Publish' : 'Sign In to Publish'}
                </button>
              )}
            </div>

            {publishError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium">
                {publishError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story Headline"
                className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm"
              />
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your Name"
                className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm"
              />
              <select
                aria-label="Select destination"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F6F4EF] border border-dashed border-[#A8B5AD] cursor-pointer text-xs text-[#3D4641]">
                <Upload className="w-4 h-4 text-[#1B4332]" />
                <span>{uploadedPhotoData ? 'Compressed Photo Ready' : 'Upload Travel Photo (Auto-Compressed)'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>

              <input
                type="text"
                value={itineraryNote}
                onChange={(e) => setItineraryNote(e.target.value)}
                placeholder="Optional Shared Itinerary (e.g. 4-Day Ridge Loop)"
                className="bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm"
              />

              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#F6F4EF] border border-[#DCD6C8]">
                <span className="text-xs text-[#4B544F]">Location Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="text-[#C88A36] cursor-pointer"
                    >
                      <Star className="w-4 h-4" fill={s <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your field dispatch, trail details, and practical notes for fellow travelers..."
              className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-3 text-sm"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-[#5A655F] hover:text-[#141816] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="px-6 py-2.5 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : currentUser?.emailVerified ? 'Publish Story' : 'Sign In to Publish'}
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2DDD2] pb-4">
          <div className="flex items-center gap-3">
            <select
              aria-label="Filter stories by destination"
              value={filterDestId}
              onChange={(e) => setFilterDestId(e.target.value)}
              className="bg-white border border-[#DCD6C8] rounded-xl px-3.5 py-2 text-xs text-[#141816]"
            >
              <option value="All">All Destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[#5A655F] font-mono tabular-nums">
            {filteredStories.length} published dispatches
          </p>
        </div>

        {/* Stories Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredStories.map((story) => (
            <article
              key={story.id}
              className="bg-white border border-[#E2DDD2] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => setActiveStory(story)}
                  className="aspect-[16/10] overflow-hidden bg-[#19231E] cursor-pointer"
                >
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A655F] mb-2">
                    <span className="font-semibold text-[#C88A36]">{story.country}</span>
                    <span aria-hidden="true">·</span>
                    <span>{story.destinationName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{story.date}</span>
                  </div>

                  <h2
                    onClick={() => setActiveStory(story)}
                    className="font-display text-2xl font-semibold text-[#141816] hover:text-[#1B4332] transition-colors cursor-pointer"
                  >
                    {story.title}
                  </h2>

                  <p className="mt-3 text-sm text-[#4B544F] leading-relaxed">{story.excerpt}</p>

                  {story.sharedItinerarySummary && (
                    <p className="mt-3 pt-3 border-t border-[#ECE8DF] text-xs font-medium text-[#1B4332]">
                      Shared Itinerary: {story.sharedItinerarySummary}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 border-t border-[#ECE8DF] flex items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="font-semibold text-[#141816]">{story.author}</span>
                  <span className="text-[#5A655F]"> · {story.authorRole}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs font-mono text-[#C88A36] tabular-nums">
                    <Star className="w-3.5 h-3.5" fill="currentColor" />
                    {story.rating.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser?.emailVerified && !story.id.startsWith('story-')) {
                        onOpenAuth();
                        return;
                      }
                      onLikeStory(story.id);
                    }}
                    aria-label="Like story"
                    className={`inline-flex items-center gap-1.5 text-xs cursor-pointer font-mono tabular-nums transition-colors ${
                      likedStoryIds.includes(story.id)
                        ? 'text-[#C88A36] font-semibold'
                        : 'text-[#4B544F] hover:text-[#C88A36]'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" fill={likedStoryIds.includes(story.id) ? 'currentColor' : 'none'} />
                    <span>{story.likes}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Saved Favorites & Community Destination Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          <div className="lg:col-span-5 bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Your Saved Places</h3>
              <span className="font-mono text-xs text-[#1B4332] tabular-nums">
                {savedDestinations.length} saved
              </span>
            </div>
            {savedDestinations.length === 0 ? (
              <p className="text-sm text-[#5A655F]">
                Bookmark destinations across the globe or directory to build your personal expedition wishlist.
              </p>
            ) : (
              <div className="space-y-3">
                {savedDestinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F6F4EF]"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenDetails(dest)}
                      className="text-left min-w-0 cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-[#141816] truncate hover:text-[#1B4332]">
                        {dest.name}
                      </p>
                      <p className="text-xs text-[#5A655F]">
                        {dest.category} · {dest.country}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(dest.id)}
                      aria-label="Remove from wishlist"
                      className="p-2 text-[#C88A36] cursor-pointer shrink-0"
                    >
                      <Bookmark className="w-4 h-4" fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-xl font-semibold">Recent Destination Reviews</h3>
            <div className="space-y-3">
              {reviews.slice(0, 4).map((rev) => {
                const d = destinations.find((x) => x.id === rev.destinationId);
                return (
                  <div key={rev.id} className="p-4 rounded-xl bg-[#F6F4EF]">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#141816]">
                        {rev.author} <span className="font-normal text-[#5A655F]">on {d?.name || rev.destinationId}</span>
                      </span>
                      <span className="font-mono text-[#C88A36] font-semibold tabular-nums">
                        {rev.rating.toFixed(1)} ★
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#3D4641]">{rev.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Story Full Reading Modal */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#F6F4EF] text-[#141816] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative aspect-[16/9]">
              <img
                src={activeStory.imageUrl}
                alt={activeStory.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                aria-label="Close story"
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <p className="text-xs font-semibold text-[#C88A36]">
                {activeStory.destinationName} · {activeStory.country} · {activeStory.date}
              </p>
              <h2 className="font-display text-3xl font-semibold">{activeStory.title}</h2>
              <p className="text-xs text-[#5A655F]">
                By {activeStory.author} · {activeStory.authorRole}
              </p>
              <div className="pt-2 space-y-4 text-base text-[#3D4641] leading-relaxed whitespace-pre-line">
                {activeStory.body}
              </div>
              {activeStory.sharedItinerarySummary && (
                <div className="p-4 rounded-xl bg-white border border-[#E2DDD2] text-xs font-medium text-[#1B4332]">
                  Attached Itinerary: {activeStory.sharedItinerarySummary}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
