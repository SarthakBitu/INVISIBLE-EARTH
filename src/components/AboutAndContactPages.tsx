import { useState } from 'react';
import { ArrowRight, CheckCircle2, Compass, Globe, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { IMAGES } from '../data/destinations';
import { PageRoute } from '../types/travel';

interface AboutPageProps {
  onNavigate: (page: PageRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="bg-[#F6F4EF] text-[#141816] min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C88A36]">
              Our Expedition Philosophy
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.08] [text-wrap:balance]">
              Cartography for those who seek the Earth untamed.
            </h1>
            <p className="text-base text-[#4B544F] leading-relaxed">
              WILD EARTH began as an independent field archive uniting mountain cartographers, hydrologists, and documentary photographers. We curate extraordinary natural places across all seven continents with practical logistics, seasonal weather realism, and deep respect for local ecosystems.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Open Interactive Showcase</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#141816]/25 hover:border-[#141816] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Contact Expedition Desk</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] rounded-2xl overflow-hidden bg-[#19231E]">
            <img
              src={IMAGES.heroAlpine}
              alt="High alpine mountain expedition ridge at sunrise"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-3">
            <Compass className="w-6 h-6 text-[#1B4332]" />
            <h2 className="font-display text-xl font-semibold">Precision Field Logistics</h2>
            <p className="text-sm text-[#4B544F] leading-relaxed">
              Every destination guide pairs exact coordinates and seasonal weather windows with nearest railheads, trail permits, and safety protocols.
            </p>
          </div>
          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-3">
            <Globe className="w-6 h-6 text-[#1B4332]" />
            <h2 className="font-display text-xl font-semibold">Ten Living Biomes</h2>
            <p className="text-sm text-[#4B544F] leading-relaxed">
              From vertical Patagonian granite walls and Arctic tidewater glaciers to inland river deltas and hyper-arid dune seas.
            </p>
          </div>
          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#1B4332]" />
            <h2 className="font-display text-xl font-semibold">Leave Zero Trace</h2>
            <p className="text-sm text-[#4B544F] leading-relaxed">
              Every factual claim cites official park or hydrological registries, and every recommendation prioritizes local community livelihoods, permit compliance, and ecological protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Expedition Planning');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@') || !message.trim()) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="bg-[#F6F4EF] text-[#141816] min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C88A36]">
            Expedition Desk
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">
            Connect with Wild Earth
          </h1>
          <p className="text-base text-[#4B544F] leading-relaxed">
            Inquire about seasonal trail permits, photography submissions, or custom expedition planning across any continent.
          </p>

          <div className="pt-4 space-y-4 text-sm text-[#3D4641]">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#1B4332]" />
              <span>dispatch@wildearth-atlas.org</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#1B4332]" />
              <span>Chamonix · Kathmandu · El Chaltén Field Hubs</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-8">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-[#1B4332] mx-auto" />
              <h2 className="font-display text-2xl font-semibold">Message Received</h2>
              <p className="text-sm text-[#4B544F] max-w-md mx-auto">
                Our regional expedition desk has logged your inquiry and will reply with current field conditions shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-semibold cursor-pointer"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-[#5A655F] mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-[#5A655F] mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-topic" className="block text-xs font-semibold text-[#5A655F] mb-1.5">
                  Inquiry Topic
                </label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-2.5 text-sm"
                >
                  <option>Expedition Planning</option>
                  <option>Trail Permits & Safety Updates</option>
                  <option>Photography & Editorial Contribution</option>
                  <option>Conservation Partnership</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-msg" className="block text-xs font-semibold text-[#5A655F] mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-msg"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your destination window, group size, or question..."
                  className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <button
                type="submit"
                className="px-7 py-3 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Send Dispatch
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function Footer({ onNavigate }: { onNavigate: (page: PageRoute) => void }) {
  return (
    <footer className="bg-[#0B0F0D] text-[#D0D7D2] border-t border-white/10">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-3">
          <p className="font-display text-2xl font-semibold tracking-[0.14em] text-[#F6F4EF]">
            WILD EARTH
          </p>
          <p className="text-sm text-[#8C9B92] max-w-sm leading-relaxed">
            Explore Beyond Limits. Curating the planet’s highest ridges, wild rivers, sapphire glaciers, and remote valleys.
          </p>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
          <div className="space-y-2.5">
            <p className="font-semibold text-white uppercase tracking-wider">Atlas & Biomes</p>
            <button type="button" onClick={() => onNavigate('explore')} className="block hover:text-[#C88A36] cursor-pointer">
              Explore World (Showcase & Map)
            </button>
            <button type="button" onClick={() => onNavigate('mountains')} className="block hover:text-[#C88A36] cursor-pointer">
              Mountains
            </button>
            <button type="button" onClick={() => onNavigate('rivers-waterfalls')} className="block hover:text-[#C88A36] cursor-pointer">
              Rivers & Waterfalls
            </button>
            <button type="button" onClick={() => onNavigate('lakes-forests')} className="block hover:text-[#C88A36] cursor-pointer">
              Lakes & Forests
            </button>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-white uppercase tracking-wider">Expeditions</p>
            <button type="button" onClick={() => onNavigate('destinations')} className="block hover:text-[#C88A36] cursor-pointer">
              All Destinations
            </button>
            <button type="button" onClick={() => onNavigate('planner')} className="block hover:text-[#C88A36] cursor-pointer">
              Adventure Planner
            </button>
            <button type="button" onClick={() => onNavigate('stories')} className="block hover:text-[#C88A36] cursor-pointer">
              Travel Stories
            </button>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-white uppercase tracking-wider">Collective</p>
            <button type="button" onClick={() => onNavigate('home')} className="block hover:text-[#C88A36] cursor-pointer">
              Home
            </button>
            <button type="button" onClick={() => onNavigate('about')} className="block hover:text-[#C88A36] cursor-pointer">
              About Us
            </button>
            <button type="button" onClick={() => onNavigate('contact')} className="block hover:text-[#C88A36] cursor-pointer">
              Contact
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 py-5 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7C8B83]">
        <span>© 2026 WILD EARTH · Explore Beyond Limits</span>
        <span>Seven Continents · Ten Natural Biomes</span>
      </div>
    </footer>
  );
}
