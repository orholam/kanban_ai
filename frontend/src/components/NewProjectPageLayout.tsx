import React from 'react';
import { AppPageShell } from './AppPageShell';

interface NewProjectPageLayoutProps {
  isDarkMode: boolean;
  children: React.ReactNode;
}

export const NewProjectPageLayout = React.forwardRef<HTMLDivElement, NewProjectPageLayoutProps>(
  function NewProjectPageLayout({ isDarkMode, children }, ref) {
    return (
      <AppPageShell ref={ref} isDarkMode={isDarkMode} maxWidth="5xl">
        {children}
      </AppPageShell>
    );
  }
);
