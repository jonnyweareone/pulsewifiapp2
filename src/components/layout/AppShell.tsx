'use client';

import { ReactNode } from 'react';
import { BottomTabs } from './BottomTabs';

interface AppShellProps {
  children: ReactNode;
  showTabs?: boolean;
  header?: ReactNode;
}

export function AppShell({ children, showTabs = true, header }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Safe area for notch/dynamic island */}
      <div className="h-[env(safe-area-inset-top,0px)] bg-[#0a0a0f]" />
      
      {/* Optional header */}
      {header && (
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
          {header}
        </header>
      )}
      
      {/* Main content with bottom padding for tabs */}
      <main className={`${showTabs ? 'pb-20' : ''}`}>
        {children}
      </main>
      
      {/* Bottom tabs */}
      {showTabs && <BottomTabs />}
    </div>
  );
}
