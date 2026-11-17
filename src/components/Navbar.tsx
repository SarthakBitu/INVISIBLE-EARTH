import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ChevronDown, Menu, UserCheck, User as UserIcon, X } from 'lucide-react';
import { PageRoute } from '../types/travel';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  wishlistCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export function Navbar({
  currentPage,
  onNavigate,
  wishlistCount,
  currentUser,
  onOpenAuth,
}: NavbarProps) {
  const [destMenuOpen, setDestMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDestMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleNav = (page: PageRoute) => {
    onNavigate(page);
    setDestMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const isDestActive =
    currentPage === 'destinations' ||
    currentPage === 'destination-details' ||
    currentPage === 'mountains' ||
    currentPage === 'rivers-waterfalls' ||
    currentPage === 'lakes-forests';

  const firstName = currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Account';

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#0B0F0D]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-lg md:text-xl font-semibold tracking-[0.14em] text-[#F6F4EF] hover:text-[#C88A36] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          WILD EARTH
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#D0D7D2]" aria-label="Primary Navigation">
          <button
            type="button"
            onClick={() => handleNav('explore')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b cursor-pointer ${
              currentPage === 'explore'
                ? 'text-white border-[#C88A36]'
                : 'border-transparent hover:text-white hover:border-white/40'
            }`}
          >
            Explore World
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDestMenuOpen((prev) => !prev)}
              aria-expanded={destMenuOpen}
              className={`flex items-center gap-1 whitespace-nowrap shrink-0 py-1 transition-colors border-b cursor-pointer ${
                isDestActive
                  ? 'text-white border-[#C88A36]'
                  : 'border-transparent hover:text-white hover:border-white/40'
              }`}
            >
              <span>Destinations</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${destMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {destMenuOpen && (
              <div className="absolute left-0 top-full mt-3 w-56 rounded-xl bg-[#121916] border border-white/12 shadow-2xl py-2 z-50">
                <button
                  type="button"
                  onClick={() => handleNav('destinations')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#F6F4EF] hover:bg-white/8 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>All Destinations</span>
                  {wishlistCount > 0 && (
                    <span className="font-mono text-xs text-[#C88A36] tabular-nums">{wishlistCount} saved</span>
                  )}
                </button>
                <div className="my-1 border-t border-white/8" />
                <button
                  type="button"
                  onClick={() => handleNav('mountains')}
                  className="w-full text-left px-4 py-2 text-sm text-[#D0D7D2] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                >
                  Mountains & Glaciers
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('rivers-waterfalls')}
                  className="w-full text-left px-4 py-2 text-sm text-[#D0D7D2] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                >
                  Rivers & Waterfalls
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('lakes-forests')}
                  className="w-full text-left px-4 py-2 text-sm text-[#D0D7D2] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                >
                  Lakes & Forests
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNav('planner')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b cursor-pointer ${
              currentPage === 'planner'
                ? 'text-white border-[#C88A36]'
                : 'border-transparent hover:text-white hover:border-white/40'
            }`}
          >
            Planner
          </button>

          <button
            type="button"
            onClick={() => handleNav('stories')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b cursor-pointer ${
              currentPage === 'stories'
                ? 'text-white border-[#C88A36]'
                : 'border-transparent hover:text-white hover:border-white/40'
            }`}
          >
            Stories
          </button>

          <button
            type="button"
            onClick={() => handleNav('about')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b cursor-pointer ${
              currentPage === 'about' || currentPage === 'contact'
                ? 'text-white border-[#C88A36]'
                : 'border-transparent hover:text-white hover:border-white/40'
            }`}
          >
            About
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action CTA (Sign In / Explorer Account) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAuth}
            className={`hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold tracking-wide rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentUser
                ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-[#F6F4EF] border border-[#52B788]/40'
                : 'bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D]'
            }`}
          >
            {currentUser ? <UserCheck className="w-3.5 h-3.5 text-[#C88A36]" /> : <UserIcon className="w-3.5 h-3.5" />}
            <span>{currentUser ? firstName : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 text-[#F6F4EF] hover:text-[#C88A36] transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0E1411] border-b border-white/10 px-6 py-5 space-y-2">
          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'explore', label: 'Explore World' },
              { id: 'destinations', label: 'All Destinations' },
              { id: 'mountains', label: 'Mountains' },
              { id: 'rivers-waterfalls', label: 'Rivers & Waterfalls' },
              { id: 'lakes-forests', label: 'Lakes & Forests' },
              { id: 'planner', label: 'Adventure Planner' },
              { id: 'stories', label: 'Travel Stories' },
              { id: 'about', label: 'About Us' },
              { id: 'contact', label: 'Contact' },
            ] as { id: PageRoute; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPage === item.id
                  ? 'bg-[#1B4332]/60 text-white'
                  : 'text-[#D0D7D2] hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAuth();
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold bg-[#C88A36] text-[#0B0F0D] cursor-pointer"
          >
            {currentUser ? `Account (${firstName})` : 'Sign In / Create Account'}
          </button>
        </div>
      )}
    </header>
  );
}
