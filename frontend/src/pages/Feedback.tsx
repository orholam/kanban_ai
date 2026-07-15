import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';
import { createFeedback } from '../api/createFeedback';
import { AppPageShell } from '../components/AppPageShell';
import SEO from '../components/SEO';
import { isLocalAppMode } from '../lib/localApp';

type FeedbackKind = 'bug' | 'idea' | 'general';

const KINDS: { id: FeedbackKind; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'idea', label: 'Idea' },
  { id: 'general', label: 'Note' },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Feedback({ isDarkMode }: { isDarkMode: boolean }) {
  const [comment, setComment] = useState('');
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const ink = isDarkMode ? 'text-zinc-50' : 'text-zinc-950';
  const fieldBorder = isDarkMode ? 'border-zinc-700' : 'border-zinc-300';
  const previewSurface = isDarkMode
    ? 'border-zinc-800 bg-zinc-900'
    : 'border-zinc-200 bg-white';
  const sideItem = isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-50';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      toast.error("Write something first; we can't send an empty note.");
      return;
    }

    const prefix = kind ? `[${kind === 'bug' ? 'Bug' : kind === 'idea' ? 'Idea' : 'Note'}] ` : '';
    const body = `${prefix}${trimmed}`;

    setIsSubmitting(true);
    try {
      await createFeedback({ comment: body });
      setComment('');
      setKind(null);
      toast.success('Thanks. We read every message.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Could not send. Try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocalAppMode()) {
    return (
      <>
        <SEO
          title="Feedback — Kanban AI (local mode)"
          description="Feedback is stored in Supabase in hosted mode."
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/feedback`}
          noindex
        />
        <AppPageShell isDarkMode={isDarkMode} maxWidth="2xl">
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <p className={`max-w-md text-sm leading-relaxed ${muted}`}>
              In-app feedback is sent to the hosted Supabase database. Use GitHub issues while running in local mode.
            </p>
            <Link
              to="/kanban"
              className={`text-sm font-medium underline-offset-4 hover:underline ${
                isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            >
              Back to boards
            </Link>
          </div>
        </AppPageShell>
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
      <AppPageShell isDarkMode={isDarkMode} maxWidth="5xl">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.9fr)] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl ${ink}`}>Feedback</h1>
            <p className={`mt-3 max-w-md text-base leading-relaxed ${muted}`}>
              Bugs, ideas, or loose notes. Context about what you were doing helps us act faster.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-8">
              <div>
                <p className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Type <span className={`font-normal ${muted}`}>(optional)</span>
                </p>
                <div
                  className={`inline-flex rounded-lg p-1 ${
                    isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200/80'
                  }`}
                >
                  {KINDS.map(({ id, label }) => {
                    const on = kind === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setKind(on ? null : id)}
                        className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                          on
                            ? isDarkMode
                              ? 'bg-zinc-700 text-white'
                              : 'bg-white text-zinc-900 shadow-sm'
                            : muted
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedback-body"
                  className={`mb-1 block text-sm font-medium ${
                    isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                  }`}
                >
                  Message
                </label>
                <TextareaAutosize
                  id="feedback-body"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Repro steps, ideas, typos you noticed…"
                  disabled={isSubmitting}
                  minRows={5}
                  maxRows={16}
                  className={`w-full resize-none border-0 border-b bg-transparent px-0 py-3 text-base leading-relaxed outline-none transition-colors focus:border-indigo-500 disabled:opacity-50 ${fieldBorder} ${
                    isDarkMode
                      ? 'text-zinc-100 placeholder:text-zinc-600'
                      : 'text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-40"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isSubmitting ? (
                    <motion.span
                      key="sending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Sending…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="send"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Send feedback
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease }}
            className={`overflow-hidden rounded-2xl border ${previewSurface}`}
          >
            <div
              className={`border-b px-4 py-3 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
            >
              <p className={`text-sm font-semibold ${ink}`}>What happens next</p>
              <p className={`mt-0.5 text-xs ${muted}`}>A human reads every note.</p>
            </div>
            <ul className="space-y-2 p-3">
              {[
                { title: 'Inbox', body: 'Goes straight to the builders.' },
                { title: 'Priorities', body: 'Shapes what we tackle next.' },
                { title: 'Voting soon', body: 'Public board and upvotes are planned.' },
              ].map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + index * 0.06, duration: 0.3, ease }}
                  className={`rounded-xl px-3 py-3 ${sideItem}`}
                >
                  <p className={`text-sm font-medium ${ink}`}>{item.title}</p>
                  <p className={`mt-0.5 text-xs leading-relaxed ${muted}`}>{item.body}</p>
                </motion.li>
              ))}
            </ul>
          </motion.aside>
        </div>
      </AppPageShell>
    </>
  );
}
