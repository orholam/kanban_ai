import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bug, Inbox, Lightbulb, MessageCircle, SendHorizontal, Sparkles } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';
import { createFeedback } from '../api/createFeedback';
import SEO from '../components/SEO';
import { isLocalAppMode } from '../lib/localApp';

type FeedbackKind = 'bug' | 'idea' | 'general';

const KINDS: { id: FeedbackKind; label: string; icon: React.ElementType }[] = [
  { id: 'bug', label: 'Bug', icon: Bug },
  { id: 'idea', label: 'Idea', icon: Lightbulb },
  { id: 'general', label: 'Note', icon: MessageCircle },
];

export default function Feedback({ isDarkMode }: { isDarkMode: boolean }) {
  const [comment, setComment] = useState('');
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageShell = isDarkMode
    ? 'bg-zinc-950 text-zinc-100'
    : 'bg-[#fafafa] text-zinc-900';

  const mesh = (
    <>
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${
          isDarkMode ? 'opacity-90' : 'opacity-70'
        }`}
        aria-hidden
      >
        <div
          className={`absolute -left-[20%] top-[-25%] h-[55vmin] w-[55vmin] rounded-full blur-[100px] ${
            isDarkMode ? 'bg-violet-600/25' : 'bg-violet-400/35'
          }`}
        />
        <div
          className={`absolute -right-[15%] top-[10%] h-[45vmin] w-[45vmin] rounded-full blur-[90px] ${
            isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-400/30'
          }`}
        />
        <div
          className={`absolute bottom-[-20%] left-[25%] h-[40vmin] w-[40vmin] rounded-full blur-[100px] ${
            isDarkMode ? 'bg-fuchsia-600/15' : 'bg-fuchsia-300/25'
          }`}
        />
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="feedback-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path
                d="M0 32V0h32"
                fill="none"
                className={isDarkMode ? 'stroke-white/[0.06]' : 'stroke-zinc-950/[0.06]'}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#feedback-grid)" style={{ maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black, transparent)' }} />
        </svg>
      </div>
    </>
  );

  const panel = isDarkMode
    ? 'rounded-[1.75rem] border border-zinc-800/80 bg-zinc-900/40 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl'
    : 'rounded-[1.75rem] border border-zinc-200/90 bg-white/70 shadow-[0_0_0_1px_rgba(24,24,27,0.04),0_24px_64px_-20px_rgba(24,24,27,0.12)] backdrop-blur-xl';

  const pillBase =
    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-[background,box-shadow,color,border-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

  const pillIdle = isDarkMode
    ? 'border-zinc-700/80 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/40 hover:text-zinc-200 focus-visible:ring-offset-zinc-950'
    : 'border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-offset-white';

  const pillActive = isDarkMode
    ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-100 shadow-[0_0_0_1px_rgba(129,140,248,0.2)] focus-visible:ring-offset-zinc-950'
    : 'border-indigo-300/90 bg-indigo-50 text-indigo-900 shadow-[0_0_0_1px_rgba(99,102,241,0.12)] focus-visible:ring-offset-white';

  const inputSurface = isDarkMode
    ? 'border-zinc-800/90 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20'
    : 'border-zinc-200/90 bg-white/90 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-indigo-500/15';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      toast.error("Write something first—we can't send an empty note.");
      return;
    }

    const prefix = kind ? `[${kind === 'bug' ? 'Bug' : kind === 'idea' ? 'Idea' : 'Note'}] ` : '';
    const body = `${prefix}${trimmed}`;

    setIsSubmitting(true);
    try {
      await createFeedback({ comment: body });
      setComment('');
      setKind(null);
      toast.success('Thanks—we read every message.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Could not send. Try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hintClass = isDarkMode ? 'text-zinc-500' : 'text-zinc-500';

  if (isLocalAppMode()) {
    return (
      <>
        <SEO
          title="Feedback — Kanban AI (local mode)"
          description="Feedback is stored in Supabase in hosted mode."
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/feedback`}
          noindex
        />
        <div
          className={`relative flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center ${pageShell}`}
        >
          {mesh}
          <p className="relative z-[1] max-w-md text-sm leading-relaxed">
            In-app feedback is sent to the hosted Supabase database. Use GitHub issues while running in local mode.
          </p>
          <Link
            to="/kanban"
            className={`relative z-[1] text-sm font-medium underline underline-offset-2 ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
            }`}
          >
            Back to boards
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Feedback — Kanban AI"
        description="Share bugs, ideas, and suggestions for Kanban AI."
        keywords="feedback, Kanban AI, feature request"
        url="https://kanbanai.dev/feedback"
        noindex
      />
      <div className={`relative min-h-0 flex-1 overflow-y-auto ${pageShell}`}>
        {mesh}
        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <motion.header
            className="mb-10 sm:mb-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                isDarkMode ? 'text-indigo-400/90' : 'text-indigo-600'
              }`}
            >
              Product input
            </p>
            <h1
              className={`mt-3 max-w-xl text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-[2.75rem] sm:leading-[1.05] ${
                isDarkMode
                  ? 'bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent'
                  : 'bg-gradient-to-br from-zinc-900 via-indigo-900 to-violet-800 bg-clip-text text-transparent'
              }`}
            >
              Shape what we ship next.
            </h1>
            <p className={`mt-4 max-w-lg text-base leading-relaxed sm:text-[1.05rem] ${hintClass}`}>
              Loose thoughts are fine. The more context—what you were doing, what you expected—the faster we can act
              on it.
            </p>
          </motion.header>

          <motion.div
            className={`${panel} p-6 sm:p-8`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  What kind of feedback?
                </span>
                <p className={`mt-1 text-xs ${hintClass}`}>Optional—helps us route it internally.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {KINDS.map(({ id, label, icon: Icon }) => {
                    const on = kind === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setKind(on ? null : id)}
                        className={`${pillBase} ${on ? pillActive : pillIdle}`}
                      >
                        <Icon className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedback-body"
                  className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  Your message
                </label>
                <div
                  className={`mt-2 overflow-hidden rounded-2xl border shadow-inner transition-colors focus-within:ring-2 ${
                    isDarkMode ? 'focus-within:ring-indigo-500/25' : 'focus-within:ring-indigo-500/20'
                  } ${inputSurface}`}
                >
                  <TextareaAutosize
                    id="feedback-body"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Repro steps, mockups, wild ideas, typos you noticed—anything."
                    disabled={isSubmitting}
                    minRows={5}
                    maxRows={16}
                    className="w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed placeholder:text-[15px] focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-xs leading-snug sm:max-w-[14rem] ${hintClass}`}>
                  Roadmap voting is on the way—until then, this inbox is the fastest line to the builders.
                </p>
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  whileTap={{ scale: comment.trim() && !isSubmitting ? 0.98 : 1 }}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-[opacity,box-shadow] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:w-auto sm:min-w-[10.5rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] hover:shadow-indigo-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:bg-gradient-to-r"
                  style={{ transitionDuration: '380ms' }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isSubmitting ? (
                      <motion.span
                        key="sending"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2"
                      >
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending
                      </motion.span>
                    ) : (
                      <motion.span
                        key="send"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2"
                      >
                        Send
                        <SendHorizontal className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>
          </motion.div>

          <motion.ul
            className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
            }}
          >
            {[
              {
                icon: Inbox,
                title: 'Human inbox',
                body: 'No bots filing your note into the void.',
              },
              {
                icon: Sparkles,
                title: 'Build priorities',
                body: 'Your reports directly inform what we tackle.',
              },
              {
                icon: Lightbulb,
                title: 'Voting soon',
                body: 'Public board + upvotes are on the roadmap.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <motion.li
                key={title}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                }}
                className={`rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${
                  isDarkMode
                    ? 'border-zinc-800/80 bg-zinc-900/30'
                    : 'border-zinc-200/80 bg-white/50'
                }`}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    isDarkMode
                      ? 'bg-zinc-800/80 text-indigo-300'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <h2
                  className={`mt-3 text-sm font-semibold tracking-tight ${
                    isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {title}
                </h2>
                <p className={`mt-1.5 text-xs leading-relaxed ${hintClass}`}>{body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </>
  );
}
