import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, SendHorizontal, User } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';
import { createFeedback } from '../api/createFeedback';
import SEO from '../components/SEO';
import { isLocalAppMode } from '../lib/localApp';

type ContactTopic = 'sales' | 'partnership' | 'support' | 'other';

const TOPICS: { id: ContactTopic; label: string }[] = [
  { id: 'sales', label: 'Enterprise / sales' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'support', label: 'Product support' },
  { id: 'other', label: 'Something else' },
];

export default function ContactPage({ isDarkMode }: { isDarkMode: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('sales');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageShell = isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f7f7f5] text-zinc-900';
  const panel = isDarkMode
    ? 'rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl shadow-black/30'
    : 'rounded-2xl border border-zinc-200/90 bg-white shadow-xl shadow-zinc-900/5';
  const labelClass = `mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`;
  const inputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
    isDarkMode
      ? 'border-zinc-700 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-600'
      : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400'
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error('Name, email, and message are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Enter a valid email address.');
      return;
    }

    const topicLabel = TOPICS.find((t) => t.id === topic)?.label ?? topic;
    const companyLine = company.trim() ? `\nCompany: ${company.trim()}` : '';
    const body = [
      '[Contact]',
      `Topic: ${topicLabel}`,
      `From: ${trimmedName} <${trimmedEmail}>${companyLine}`,
      '---',
      trimmedMessage,
    ].join('\n');

    setIsSubmitting(true);
    try {
      await createFeedback({ comment: body });
      setName('');
      setEmail('');
      setCompany('');
      setTopic('sales');
      setMessage('');
      toast.success('Message sent — we will get back to you soon.');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error(error instanceof Error ? error.message : 'Could not send. Try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocalAppMode()) {
    return (
      <>
        <SEO
          title="Contact — Kanban AI (local mode)"
          description="Contact form requires hosted Supabase."
          noindex
        />
        <div className={`flex min-h-full flex-1 items-center justify-center px-4 py-16 ${pageShell}`}>
          <div className={`max-w-md p-8 text-center ${panel}`}>
            <h1 className="text-xl font-semibold">Contact is unavailable in local mode</h1>
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Messages are stored in the hosted database. Use GitHub issues while developing locally, or open{' '}
              <a
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                href="https://kanbanai.dev/contact"
              >
                kanbanai.dev/contact
              </a>
              .
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Contact — Kanban AI"
        description="Contact Kanban AI for enterprise sales, partnerships, and product questions."
        keywords="contact Kanban AI, enterprise kanban, sales"
        url="https://kanbanai.dev/contact"
      />
      <div className={`relative min-h-full flex-1 overflow-y-auto ${pageShell}`}>
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:py-20">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
              }`}
            >
              Contact
            </p>
            <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Talk to the Kanban AI team
            </h1>
            <p className={`mt-4 max-w-md text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Enterprise plans, partnerships, or a product question — send a note and we will reply by email.
              Product bugs and feature ideas from signed-in users can also go through{' '}
              <Link to="/feedback" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Feedback
              </Link>
              .
            </p>
            <ul className={`mt-8 space-y-3 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <li className="flex gap-2">
                <Mail className={`mt-0.5 h-4 w-4 shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                We read every message in the same inbox as in-app feedback.
              </li>
              <li className="flex gap-2">
                <Building2 className={`mt-0.5 h-4 w-4 shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                Enterprise inquiries usually get a reply within one business day.
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className={`p-6 sm:p-8 ${panel}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="contact-name" className={labelClass}>
                  Name
                </label>
                <div className="relative">
                  <User
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="Alex Rivera"
                    required
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="contact-email" className={labelClass}>
                  Work email
                </label>
                <div className="relative">
                  <Mail
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="alex@company.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="contact-company" className={labelClass}>
                Company <span className={isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}>(optional)</span>
              </label>
              <input
                id="contact-company"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                placeholder="Acme Inc."
              />
            </div>

            <fieldset className="mt-4">
              <legend className={labelClass}>Topic</legend>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => {
                  const active = topic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopic(t.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? isDarkMode
                            ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-100'
                            : 'border-indigo-300 bg-indigo-50 text-indigo-900'
                          : isDarkMode
                            ? 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-4">
              <label htmlFor="contact-message" className={labelClass}>
                How can we help?
              </label>
              <TextareaAutosize
                id="contact-message"
                minRows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder="Team size, timeline, or the question on your mind…"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <SendHorizontal className="h-4 w-4" />
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
