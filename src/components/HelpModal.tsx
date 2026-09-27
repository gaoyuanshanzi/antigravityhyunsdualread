'use client';

import React from 'react';
import { X, BookOpen, Globe, Download, Sparkles, Quote } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">DualRead &amp; Study Note 사용 가이드</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Section 1 */}
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>1. 두 화면 읽기 (Panel A &amp; Panel B)</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>www 입력창</strong>: 보고 싶은 웹페이지 주소(URL)를 입력하고 이동 버튼을 누르면 화면에 로드됩니다. 보안 정책으로 임베드가 제한된 사이트도 스마트 프록시가 우회하여 표시합니다.
              </li>
              <li>
                <strong>file 선택창</strong>: 내 컴퓨터의 파일을 직접 열람할 수 있습니다.
                <br />
                <span className="text-blue-700 font-semibold">
                  지원 형식: text(.txt), pdf(.pdf), doc/docx(.doc, .docx), epub(.epub), html(.html), rich text(.rtf), md(.md)
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Quote className="w-4 h-4 text-indigo-600" />
              <span>2. 본문 인용 기능 (Quote to Note)</span>
            </div>
            <p>
              패널 A 또는 B에서 참고하고 싶은 텍스트를 마우스로 드래그하여 선택한 뒤, 패널 상단의 <strong>[노트로 인용]</strong> 버튼을 누르면 오른쪽 Study Note에 자동으로 인용구 블록으로 삽입됩니다.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>3. 서식 리본 &amp; 개인 Study Note</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>실행 취소(Ctrl+Z), 다시 실행(Ctrl+Y)</li>
              <li>제목 1, 2, 3 (H1, H2, H3) 서식 토글</li>
              <li>굵게(B), 기울임(I), 밑줄(U) 서식 지정</li>
              <li>글머리 기호 및 번호 매기기 리스트</li>
              <li>인용구, 코드 블록, 구분선, 이미지 삽입, 유튜브 비디오 삽입, 3x3 표 삽입</li>
              <li>작성 중인 내용은 브라우저에 실시간 자동 저장됩니다.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Download className="w-4 h-4 text-amber-600" />
              <span>4. Study Note 파일 내보내기 (Export)</span>
            </div>
            <p>
              우측 상단의 <strong>[Export file]</strong> 버튼 또는 서식 리본 끝의 다운로드 아이콘을 클릭하여 다음 7가지 형식 중 원하는 파일로 로컬에 바로 저장할 수 있습니다:
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-medium text-slate-700">
              <span>&bull; 일반 텍스트 (.txt)</span>
              <span>&bull; PDF 문서 (.pdf)</span>
              <span>&bull; 워드 문서 (.doc)</span>
              <span>&bull; 전자책 (.epub)</span>
              <span>&bull; 웹 문서 (.html)</span>
              <span>&bull; 서식 텍스트 (.rtf)</span>
              <span>&bull; 마크다운 (.md)</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
