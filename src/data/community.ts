import { DestinationReview, TravelStory } from '../types/travel';
import { IMAGES } from './destinations';

export const INITIAL_STORIES: TravelStory[] = [
  {
    id: 'story-fitz-roy-dawn',
    title: 'Four Hours Before Dawn on the Moraine of Fitz Roy',
    author: 'Elena Rostova',
    authorRole: 'Alpine Photojournalist',
    destinationId: 'fitz-roy-patagonia',
    destinationName: 'Mount Fitz Roy & Laguna de los Tres',
    country: 'Argentina',
    date: 'October 2026',
    rating: 5,
    likes: 184,
    imageUrl: IMAGES.patagonia,
    excerpt:
      'Climbing the steep icy scree above Poincenot by headlamp in 60-knot gusts, only for the wind to drop dead calm five minutes before the granite ignited.',
    body:
      'We left Poincenot camp at 03:30 AM beneath a canopy of Southern Cross stars. For ninety minutes the final kilometer of moraine felt vertical—frozen gravel shifting beneath crampons while spindrift hissed off the glacier. When we crested the rim at 06:08, the sky turned deep violet, then molten copper, then electric crimson across every needle of the Chaltén massif.',
    sharedItinerarySummary: '4-Day El Chaltén Alpine Loop · Mid-Range ($165/day) · Laguna de los Tres + Cerro Torre',
  },
  {
    id: 'story-amazon-mist',
    title: 'Drifting Silently Across Cocha Salvador at First Light',
    author: 'Mateo Valdivia',
    authorRole: 'Bioacoustics Researcher',
    destinationId: 'amazon-manu-river',
    destinationName: 'Manu & Upper Amazon River Basin',
    country: 'Peru',
    date: 'September 2026',
    rating: 5,
    likes: 142,
    imageUrl: IMAGES.amazon,
    excerpt:
      'Before the howler monkeys begin their dawn chorus, the upper river channels belong entirely to river fog, giant otters, and golden sunbeams.',
    body:
      'Nothing prepares you for the acoustics of an intact primary rainforest. At 05:15 AM, our wooden catamaran slipped away from shore without an engine. Mist clung knee-deep to the oxbow surface while a family of six giant river otters surfaced thirty yards ahead, whistling softly to one another across the black mirror water.',
    sharedItinerarySummary: '4-Day Manu Biosphere Canoe Traverse · Mid-Range ($210/day)',
  },
  {
    id: 'story-iceland-basalt',
    title: 'Inside the Basalt Organ Pipes of Vatnajökull',
    author: 'Soren Lindqvist',
    authorRole: 'Architectural & Landscape Explorer',
    destinationId: 'svartifoss-iceland',
    destinationName: 'Svartifoss & Vatnajökull Basalt Gorge',
    country: 'Iceland',
    date: 'August 2026',
    rating: 4.9,
    likes: 129,
    imageUrl: IMAGES.icelandWaterfall,
    excerpt:
      'Standing in glacial mist beneath hexagonal volcanic columns that inspired Reykjavík’s skyline, listening to meltwater thunder off the ice cap.',
    body:
      'Walking up from Skaftafell through dwarf birch woods, Svartifoss announces itself first as a deep low-frequency vibration in your chest. The symmetrical black basalt pillars look almost hand-chiseled by ancient masons rather than cooled lava. Arrive at 06:00 AM during summer solstice and you have the entire canyon amphitheater to yourself.',
    sharedItinerarySummary: '3-Day South Coast Glacier & Falls · Luxury ($260/day)',
  },
  {
    id: 'story-svalbard-ice',
    title: 'Blue Silence at 78 Degrees North',
    author: 'Nadia Al-Mansoor',
    authorRole: 'Polar Expedition Leader',
    destinationId: 'svalbard-nordenskiold-glacier',
    destinationName: 'Nordenskiöld Glacier & Svalbard Fjords',
    country: 'Norway',
    date: 'July 2026',
    rating: 5,
    likes: 211,
    imageUrl: IMAGES.polarGlacier,
    excerpt:
      'Paddling sea kayaks half a kilometer from a five-kilometer wall of ancient compressed sapphire ice under endless Arctic twilight.',
    body:
      'In the High Arctic, distance deceives the eye. What looked like a modest ice cliff turned out to be fifty meters of sheer striated azure towering above our kayaks. Every twenty minutes a crack like distant cannon fire echoed across Billefjorden, sending sculpted growlers bobbing past our bows.',
    sharedItinerarySummary: '3-Day Billefjorden Sea Kayak Expedition · Luxury ($420/day)',
  },
];

export const INITIAL_REVIEWS: DestinationReview[] = [
  {
    id: 'rev-1',
    destinationId: 'fitz-roy-patagonia',
    author: 'Julian Vance',
    location: 'Zurich, Switzerland',
    date: 'Oct 2026',
    rating: 5,
    comment: 'Staying at Poincenot camp cut the pre-dawn moraine push in half. Unforgettable alpenglow.',
  },
  {
    id: 'rev-2',
    destinationId: 'moraine-lake-banff',
    author: 'Hannah Chen',
    location: 'Vancouver, Canada',
    date: 'Sep 2026',
    rating: 5,
    comment: 'Book the 04:00 AM alpine shuttle—watching golden larches reflect on still turquoise water is worth every minute.',
  },
  {
    id: 'rev-3',
    destinationId: 'svartifoss-iceland',
    author: 'Lucas Meyer',
    location: 'Munich, Germany',
    date: 'Aug 2026',
    rating: 5,
    comment: 'Combine Svartifoss with the upper Sjónarnípa ridge loop for sweeping views over Skaftafellsjökull.',
  },
];
