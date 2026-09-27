'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReaderPanel from '@/components/ReaderPanel';
import StudyNoteEditor from '@/components/StudyNoteEditor';
import LoginView from '@/components/LoginView';
import HelpModal from '@/components/HelpModal';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Check login state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hyuns_dualread_logged_in');
      if (stored === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hyuns_dualread_logged_in');
    }
    setIsAuthenticated(false);
  };

  // Prevent flash while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, show clean Login screen (ID/PW empty, white mode)
  if (!isAuthenticated) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col overflow-x-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        onLogout={handleLogout}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Workspace (3 Columns matching Image 1) */}
      <main className="flex-1 p-3 md:p-4 max-w-[1920px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 h-[calc(100vh-5.5rem)] min-h-[640px]">
          {/* Column 1: Panel A (www + file + Panel A) */}
          <section className="h-full flex flex-col min-w-0">
            <ReaderPanel id="A" panelName="Panel A" />
          </section>

          {/* Column 2: Panel B (www + file + Panel B) */}
          <section className="h-full flex flex-col min-w-0">
            <ReaderPanel id="B" panelName="Panel B" />
          </section>

          {/* Column 3: Study Note (Export file + 서식 리본 + Study note) */}
          <section className="h-full flex flex-col min-w-0">
            <StudyNoteEditor />
          </section>
        </div>
      </main>

      {/* Help & User Guide Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
