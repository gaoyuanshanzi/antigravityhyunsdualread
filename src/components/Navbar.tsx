'use client';

import React from 'react';
import { BookOpen, LogOut, Sun, UserCheck, HelpCircle } from 'lucide-react';

interface NavbarProps {
  onLogout: () => void;
  onOpenHelp: () => void;
}

export default function Navbar({ onLogout, onOpenHelp }: NavbarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between shadow-2xs select-none sticky top-0 z-30">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
              DualRead &amp; Study Note
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sun className="w-3 h-3 text-amber-500" /> White Mode
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden md:block">
            웹&middot;문서 두화면 비교 리더 및 개인 학습 노트 스튜디오
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenHelp}
          title="사용 방법 및 단축키 안내"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">사용 가이드</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold">admin</span>
        </div>

        <button
          onClick={onLogout}
          title="로그아웃"
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
