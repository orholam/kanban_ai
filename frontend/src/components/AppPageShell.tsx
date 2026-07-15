import React from 'react';

type ShellWidth = '2xl' | '3xl' | '5xl';

interface AppPageShellProps {
  isDarkMode: boolean;
  children: React.ReactNode;
  maxWidth?: ShellWidth;
}

const widthClass: Record<ShellWidth, string> = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
};

/** Shared zinc page shell used by in-app utility pages. */
export const AppPageShell = React.forwardRef<HTMLDivElement, AppPageShellProps>(
  function AppPageShell({ isDarkMode, children, maxWidth = '5xl' }, ref) {
    return (
      <div
        ref={ref}
        className={`relative isolate flex min-h-full flex-1 overflow-auto ${
          isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] ${
            isDarkMode
              ? 'bg-[radial-gradient(55%_70%_at_80%_0%,rgba(63,63,70,0.55),transparent_70%)]'
              : 'bg-[radial-gradient(55%_70%_at_80%_0%,rgba(255,255,255,0.95),transparent_70%)]'
          }`}
          aria-hidden
        />
        <div
          className={`relative mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${widthClass[maxWidth]}`}
        >
          {children}
        </div>
      </div>
    );
  }
);
