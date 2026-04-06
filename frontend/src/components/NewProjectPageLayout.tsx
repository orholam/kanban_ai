import React from 'react';

interface NewProjectPageLayoutProps {
  isDarkMode: boolean;
  children: React.ReactNode;
}

export const NewProjectPageLayout = React.forwardRef<HTMLDivElement, NewProjectPageLayoutProps>(
  function NewProjectPageLayout({ isDarkMode, children }, ref) {
    return (
      <div
        ref={ref}
        className={`relative isolate flex min-h-full flex-1 overflow-auto ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-64"
        aria-hidden
      >
        <div
          className={`relative left-1/2 aspect-[1155/678] w-[min(100%,36rem)] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-25 sm:w-[42rem] ${
            isDarkMode ? 'opacity-20' : 'opacity-30'
          }`}
        />
      </div>
      <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {children}
      </div>
    </div>
    );
  }
);
