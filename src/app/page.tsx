'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReaderPanel from '@/components/ReaderPanel';
import StudyNoteEditor from '@/components/StudyNoteEditor';
import LoginView from '@/components/LoginView';
import HelpModal from '@/components/HelpModal';
import { BookOpen, FileEdit, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'note' | 'all'>('all');

  // Check login state and set initial tab based on device width
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hyuns_dualread_logged_in');
      if (stored === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      // If mobile screen (< 1024px), default to Panel A
      if (window.innerWidth < 1024) {
        setActiveTab('A');
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
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100/70 flex flex-col font-sans select-none">
      {/* Top Navbar (Fixed, Never Moves) */}
      <div className="shrink-0">
        <Navbar
          onLogout={handleLogout}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      </div>

      {/* Main Workspace (Strictly pinned to viewport, no outer page scrolling) */}
      <main className="flex-1 min-h-0 overflow-hidden p-2 sm:p-3 md:p-4 max-w-[1920px] w-full mx-auto flex flex-col">
        {/* Top 3 Tab Buttons (Fixed, Never Moves - Study note on far left) */}
        <div className="shrink-0 flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs w-full lg:w-auto">
            {/* Tab 1: Study note (Far Left) */}
            <button
              type="button"
              onClick={() => setActiveTab('note')}
              className={`flex-1 lg:flex-none px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'note'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Study note</span>
            </button>

            {/* Tab 2: Panel A */}
            <button
              type="button"
              onClick={() => setActiveTab('A')}
              className={`flex-1 lg:flex-none px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'A'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Panel A</span>
            </button>

            {/* Tab 3: Panel B */}
            <button
              type="button"
              onClick={() => setActiveTab('B')}
              className={`flex-1 lg:flex-none px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'B'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Panel B</span>
            </button>

            {/* Desktop View Switcher: 3화면 동시 보기 */}
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`hidden lg:flex px-4 py-2 rounded-lg text-xs font-bold transition-all items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
              title="데스크톱에서 3개 패널을 한 화면에 나란히 비교합니다"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>3화면 전체 보기</span>
            </button>
          </div>

          <span className="hidden xl:inline-block text-xs text-slate-400">
            Study note (좌측) &bull; Panel A / B (우측)
          </span>
        </div>

        {/* Content Area (Strictly min-h-0 overflow-hidden) */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Case 1: Desktop 'all' 3-column split view (Study note -> Panel A -> Panel B) */}
          {activeTab === 'all' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 h-full min-h-0 overflow-hidden">
              {/* Column 1: Study Note (Far Left) */}
              <section className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                <StudyNoteEditor />
              </section>

              {/* Column 2: Panel A (Center) */}
              <section className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                <ReaderPanel id="A" panelName="Panel A" />
              </section>

              {/* Column 3: Panel B (Right) */}
              <section className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                <ReaderPanel id="B" panelName="Panel B" />
              </section>
            </div>
          ) : (
            /* Case 2: Single Tab view (Mobile / Focused view) */
            <div className="h-full min-h-0 overflow-hidden">
              {activeTab === 'note' && (
                <section className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <StudyNoteEditor />
                </section>
              )}
              {activeTab === 'A' && (
                <section className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <ReaderPanel id="A" panelName="Panel A" />
                </section>
              )}
              {activeTab === 'B' && (
                <section className="h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <ReaderPanel id="B" panelName="Panel B" />
                </section>
              )}
            </div>
          )}
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
