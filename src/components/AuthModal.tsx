import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  Bookmark,
  Calendar,
  CheckCircle2,
  LogOut,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  auth,
  createUserWithEmailAndPassword,
  googleProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  homeBase: string;
  wishlistCount: number;
  savedPlansCount: number;
  onSaveHomeBase: (homeBase: string) => Promise<void>;
  onRefreshUser: () => Promise<void>;
  onNavigateToPlanner: () => void;
}

function formatAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method). You can sign in right now with Google, or enable Email/Password in your Firebase project settings.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before finishing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and retry.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email or password did not match an existing account.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Switch to Sign In instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Please choose a password with at least 6 characters.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
}

export function AuthModal({
  isOpen,
  onClose,
  user,
  homeBase,
  wishlistCount,
  savedPlansCount,
  onSaveHomeBase,
  onRefreshUser,
  onNavigateToPlanner,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localHomeBase, setLocalHomeBase] = useState(homeBase);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalHomeBase(homeBase);
  }, [homeBase]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusMsg('Signed in with Google. Your saved data is syncing.');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      if (mode === 'signup') {
        const cleanName = displayName.trim();
        if (!cleanName) {
          setErrorMsg('Please enter your explorer display name.');
          setBusy(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: cleanName });
        try {
          await sendEmailVerification(cred.user);
          setStatusMsg(
            'Account created! Please check your inbox and click the verification link, then press Refresh Verification below to unlock cloud saves.'
          );
        } catch {
          setStatusMsg('Account created! Verify your email to enable cloud saves.');
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setStatusMsg('Welcome back to Wild Earth.');
      }
      setPassword('');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setStatusMsg('Verification email sent. Check your inbox and click Refresh Status once verified.');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshVerification = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await onRefreshUser();
      if (auth.currentUser?.emailVerified) {
        setStatusMsg('Email verified! Cloud wishlist, expedition plans, stories, and reviews are now active.');
      } else {
        setErrorMsg('Email is still unverified. Click the link in your inbox first, then refresh.');
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onSaveHomeBase(localHomeBase.trim());
      setStatusMsg('Home base updated in your cloud profile.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await signOut(auth);
      setStatusMsg('Signed out.');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B09]/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Explorer Account"
    >
      <div className="bg-[#F6F4EF] text-[#141816] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#DCD6C8]">
        {/* Modal Header */}
        <div className="bg-[#121916] text-[#F6F4EF] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C88A36]">
              Wild Earth Account
            </p>
            <h2 className="font-display text-2xl font-semibold mt-0.5">
              {user ? 'Explorer Passport' : mode === 'login' ? 'Sign In to Sync' : 'Create Explorer Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3.5 rounded-xl bg-[#1B4332]/10 border border-[#1B4332]/30 text-xs text-[#1B4332] flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {user ? (
            <div className="space-y-5">
              {/* Signed-In Identity Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E2DDD2] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#141816] truncate">
                        {user.displayName || 'Field Explorer'}
                      </p>
                      <p className="text-xs text-[#5A655F] truncate">{user.email}</p>
                    </div>
                  </div>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4332] shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#B45309] shrink-0">Unverified</span>
                  )}
                </div>
              </div>

              {/* Email Verification Gate Banner if unverified */}
              {!user.emailVerified && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-xs text-amber-950">
                  <div className="flex items-start gap-2">
                    <MailCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Verify your email address to enable cloud writes for your wishlist, saved itineraries, field stories, and reviews.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleResendVerification}
                      className="px-3.5 py-2 rounded-lg bg-amber-900 text-white font-semibold hover:bg-amber-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Resend Email
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleRefreshVerification}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-amber-300 text-amber-950 font-semibold hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Status</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cloud Sync Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E2DDD2]">
                  <div className="flex items-center gap-1.5 text-xs text-[#5A655F]">
                    <Bookmark className="w-3.5 h-3.5 text-[#C88A36]" />
                    <span>Saved Places</span>
                  </div>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{wishlistCount}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPlanner();
                  }}
                  className="p-3.5 rounded-xl bg-white border border-[#E2DDD2] hover:border-[#1B4332] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs text-[#5A655F]">
                    <Calendar className="w-3.5 h-3.5 text-[#1B4332]" />
                    <span>Cloud Plans</span>
                  </div>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{savedPlansCount}</p>
                </button>
              </div>

              {/* Home Base Form */}
              {user.emailVerified && (
                <form onSubmit={handleSaveProfile} className="space-y-2.5">
                  <label htmlFor="profile-homebase" className="block text-xs font-semibold text-[#5A655F]">
                    Home Base (City / Country)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="profile-homebase"
                      type="text"
                      maxLength={80}
                      value={localHomeBase}
                      onChange={(e) => setLocalHomeBase(e.target.value)}
                      placeholder="e.g. Zurich, Switzerland"
                      className="flex-1 bg-white border border-[#DCD6C8] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1B4332]"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#DCD6C8] bg-white hover:bg-[#ECE8DF] text-xs font-semibold text-[#141816] transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Google OAuth Button */}
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white border border-[#DCD6C8] hover:border-[#141816] text-sm font-semibold text-[#141816] transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <span className="border-t border-[#DCD6C8] w-full" />
                <span className="px-3 text-[11px] uppercase tracking-wider text-[#5A655F] bg-[#F6F4EF] shrink-0">
                  or with email
                </span>
                <span className="border-t border-[#DCD6C8] w-full" />
              </div>

              {/* Login / Signup Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EAE5DA]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'login' ? 'bg-white text-[#141816] shadow-sm' : 'text-[#5A655F]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'signup' ? 'bg-white text-[#141816] shadow-sm' : 'text-[#5A655F]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-medium text-[#4B544F] mb-1">
                      Explorer Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nadia Alvarez"
                      className="w-full bg-white border border-[#DCD6C8] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-[#4B544F] mb-1">
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="explorer@example.com"
                    className="w-full bg-white border border-[#DCD6C8] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-[#4B544F] mb-1">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border border-[#DCD6C8] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p className="text-[11px] text-[#5A655F] leading-relaxed">
                Sign in to save your destination wishlist, store day-by-day expedition plans in the cloud, and publish community stories or field reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
