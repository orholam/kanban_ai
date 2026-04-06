import React from 'react';

const AnalyticsPage = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={`mx-auto max-w-2xl p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
  >
    <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
    <p className={`mt-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      Product analytics are not configured. You can log events to your own Supabase project
      or a provider (Plausible, PostHog, etc.) without embedding a second Supabase client in
      the browser.
    </p>
  </div>
);

export default AnalyticsPage;
