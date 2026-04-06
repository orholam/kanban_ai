import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { getUserInitials } from '../lib/userUtils';

/** Base = already in the free product; Pro = trial extras. Differentiation is icon + text color only. */
const PLAN_FEATURES: { id: string; text: string; scope: 'base' | 'pro' }[] = [
  { id: 'b1', text: 'Kanban, tasks, sprints, drag-and-drop', scope: 'base' },
  { id: 'b2', text: 'Filters, compact view, notes, public links', scope: 'base' },
  { id: 'p1', text: 'AI project planning from a brief', scope: 'pro' },
  { id: 'p2', text: 'Board-aware side assistant', scope: 'pro' },
  { id: 'p3', text: 'Unlimited assistant messages on Pro', scope: 'pro' },
  { id: 'p4', text: 'New models & workflows first', scope: 'pro' },
  { id: 'p5', text: 'Smarter descriptions & notes', scope: 'pro' },
];

export default function AccountPage({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const name =
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      '';
    setDisplayName(name);
  }, [user]);

  if (!user) {
    return <Navigate to="/login?next=/account" replace />;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();

    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          name: trimmedName || null,
          full_name: trimmedName || null,
        },
      });
      if (error) throw error;
      toast.success('Profile updated.');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const pageBg = isDarkMode
    ? 'bg-zinc-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.18),transparent_55%)]'
    : 'bg-zinc-100 bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(199,210,254,0.55),transparent_50%)]';

  const profileCard = isDarkMode
    ? 'rounded-3xl border border-zinc-800/90 bg-zinc-900/50 shadow-xl shadow-black/20 ring-1 ring-white/[0.04] backdrop-blur-sm'
    : 'rounded-3xl border border-zinc-200/90 bg-white/90 shadow-lg shadow-zinc-950/[0.06] ring-1 ring-zinc-200/60 backdrop-blur-sm';

  const label = isDarkMode ? 'text-zinc-500' : 'text-zinc-500';
  const input = isDarkMode
    ? 'border-zinc-700/90 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/80 focus:ring-indigo-500/25'
    : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20';

  const emailDisplay = user.email ?? '—';

  return (
    <>
      <SEO
        title="Account — Kanban AI"
        description="Manage your Kanban AI account and plan."
        keywords="account, profile, Kanban AI"
        url="https://kanbanai.dev/account"
        noindex
      />
      <div className={`min-h-0 flex-1 overflow-y-auto ${pageBg}`}>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <header className="mb-8 max-w-xl">
            <h1
              className={`text-2xl font-semibold tracking-tight sm:text-3xl ${
                isDarkMode ? 'text-zinc-50' : 'text-zinc-900'
              }`}
            >
              Account
            </h1>
            <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Profile and plan. Pro is on us during early access.
            </p>
          </header>

          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
            {/* Pro — primary visual column */}
            <section className="order-1 lg:order-2 lg:col-span-7">
              <div className="relative">
                <div
                  className={`absolute -inset-px rounded-[1.35rem] bg-gradient-to-br opacity-100 blur-sm ${
                    isDarkMode
                      ? 'from-indigo-500/45 via-violet-500/35 to-amber-400/25'
                      : 'from-indigo-400/50 via-violet-400/40 to-amber-300/35'
                  }`}
                  aria-hidden
                />
                <div
                  className={`relative overflow-hidden rounded-3xl border p-6 ${
                    isDarkMode
                      ? 'border-indigo-400/20 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-zinc-950 shadow-[0_0_0_1px_rgba(129,140,248,0.12),0_24px_64px_-12px_rgba(0,0,0,0.55)]'
                      : 'border-indigo-200/60 bg-gradient-to-b from-white via-indigo-50/[0.35] to-violet-50/30 shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_20px_50px_-12px_rgba(79,70,229,0.15)]'
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${
                      isDarkMode ? 'bg-indigo-500/25' : 'bg-indigo-400/30'
                    }`}
                    aria-hidden
                  />
                  <div
                    className={`pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full blur-3xl ${
                      isDarkMode ? 'bg-violet-600/20' : 'bg-violet-400/25'
                    }`}
                    aria-hidden
                  />

                  <div className="relative z-[1]">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      isDarkMode
                        ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25'
                        : 'bg-amber-100 text-amber-900 ring-1 ring-amber-300/70'
                    }`}
                  >
                    <Gift className="h-3 w-3" aria-hidden />
                    Trial
                  </span>
                  <span className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    No card · full Pro
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                  <h2
                    className={`text-2xl font-bold tracking-tight sm:text-3xl ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-white via-indigo-100 to-violet-300/95 bg-clip-text text-transparent'
                        : 'bg-gradient-to-br from-zinc-900 via-indigo-800 to-violet-700 bg-clip-text text-transparent'
                    }`}
                  >
                    Pro
                  </h2>
                </div>

                <p
                  className={`mt-3 max-w-lg text-sm leading-relaxed ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  Full Pro while we&apos;re in beta; subscriptions will land here later.
                </p>

                <ul className="mt-5 grid list-none gap-2.5">
                  {PLAN_FEATURES.map(({ id, text, scope }) => {
                    const base = scope === 'base';
                    const check = base
                      ? isDarkMode
                        ? 'border border-zinc-600 bg-zinc-800/80 text-zinc-400'
                        : 'border border-zinc-300 bg-zinc-100 text-zinc-500'
                      : isDarkMode
                        ? 'border border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                        : 'border border-indigo-200 bg-indigo-50 text-indigo-700';
                    const line = base
                      ? isDarkMode
                        ? 'text-zinc-500'
                        : 'text-zinc-600'
                      : isDarkMode
                        ? 'text-zinc-200'
                        : 'text-zinc-800';
                    return (
                      <li key={id} className="flex gap-2.5">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${check}`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        </span>
                        <span className={`min-w-0 flex-1 text-sm leading-snug ${line}`}>
                          {base ? (
                            <>
                              <span className="sr-only">Included in every plan. </span>
                              <span
                                className={`mr-1.5 font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
                              >
                                Base
                              </span>
                              <span className={line}>{text}</span>
                            </>
                          ) : (
                            <>
                              <span className="sr-only">Pro. </span>
                              <span
                                className={`mr-1.5 font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                              >
                                Pro
                              </span>
                              <span className={line}>{text}</span>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile */}
            <section className="order-2 lg:order-1 lg:col-span-5">
              <div className={`lg:sticky lg:top-6 ${profileCard} p-6 sm:p-8`}>
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.12em] ${label}`}
                >
                  Your profile
                </h2>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-semibold text-white shadow-md shadow-indigo-500/30">
                    {getUserInitials(user)}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-base font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                    >
                      {displayName.trim() || user.email?.split('@')[0] || 'Member'}
                    </p>
                    <p className={`text-xs ${label}`}>Shown across the app</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="mt-8 space-y-6">
                  <div>
                    <label htmlFor="account-display-name" className={`block text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Display name
                    </label>
                    <input
                      id="account-display-name"
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className={`mt-2 w-full rounded-xl border px-3.5 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 ${input}`}
                    />
                  </div>

                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Sign-in email
                    </p>
                    <p
                      className={`mt-2 break-all rounded-xl border px-3.5 py-3 text-sm ${
                        isDarkMode
                          ? 'border-zinc-800/90 bg-zinc-950/50 text-zinc-300'
                          : 'border-zinc-200 bg-zinc-50/80 text-zinc-800'
                      }`}
                    >
                      {emailDisplay}
                    </p>
                    <p className={`mt-2 text-xs leading-relaxed ${label}`}>
                      Email is tied to your sign-in provider and can&apos;t be changed here.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                        isDarkMode
                          ? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-offset-zinc-950'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-offset-white'
                      }`}
                    >
                      {savingProfile ? 'Saving…' : 'Save display name'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
