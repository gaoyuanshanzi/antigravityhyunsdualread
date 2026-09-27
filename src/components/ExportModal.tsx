'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  BookOpen,
  Globe,
  FileType2,
  Download,
  CheckCircle,
  FileDown
} from 'lucide-react';
import { ExportFormat, exportStudyNote } from '@/lib/exporters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  getEditorHtml: () => string;
}

interface FormatOption {
  id: ExportFormat;
  name: string;
  extension: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'text',
    name: '일반 텍스트',
    extension: '.txt',
    description: '서식 없이 내용만 순수 텍스트 파일로 저장합니다.',
    badge: 'TEXT',
    icon: FileText,
    iconColor: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200 hover:border-slate-400',
  },
  {
    id: 'pdf',
    name: 'PDF 문서',
    extension: '.pdf',
    description: '스타일과 표, 이미지가 포함된 인쇄용 PDF로 내보냅니다.',
    badge: 'PDF',
    icon: FileDown,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-50/50 border-rose-200 hover:border-rose-400',
  },
  {
    id: 'doc',
    name: 'Word 문서',
    extension: '.doc',
    description: 'Microsoft Word 및 한컴오피스에서 바로 열 수 있습니다.',
    badge: 'DOC',
    icon: FileSpreadsheet,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50/50 border-blue-200 hover:border-blue-400',
  },
  {
    id: 'epub',
    name: '전자책 (EPUB)',
    extension: '.epub',
    description: '전자책 뷰어(리더기, 태블릿)에서 읽을 수 있는 표준 ePub 파일입니다.',
    badge: 'EPUB',
    icon: BookOpen,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50/50 border-purple-200 hover:border-purple-400',
  },
  {
    id: 'html',
    name: 'HTML 웹 문서',
    extension: '.html',
    description: '화이트 모드 스타일이 포함된 독립 실행형 HTML 웹 문서입니다.',
    badge: 'HTML',
    icon: Globe,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400',
  },
  {
    id: 'rtf',
    name: '서식 있는 텍스트',
    extension: '.rtf',
    description: '글꼴 크기, 굵기, 색상 등 서식이 유지되는 Rich Text Format입니다.',
    badge: 'RTF',
    icon: FileType2,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50/50 border-amber-200 hover:border-amber-400',
  },
  {
    id: 'md',
    name: '마크다운',
    extension: '.md',
    description: 'GitHub, Notion, Obsidian과 완벽히 호환되는 마크다운 형식입니다.',
    badge: 'MARKDOWN',
    icon: FileCode,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400',
  },
];

export default function ExportModal({
  isOpen,
  onClose,
  noteTitle,
  getEditorHtml,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('text');
  const [customTitle, setCustomTitle] = useState(noteTitle || 'Study Note');
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (formatToExport?: ExportFormat) => {
    const targetFormat = formatToExport || selectedFormat;
    setIsExporting(true);
    setSuccess(false);

    try {
      const html = getEditorHtml();
      await exportStudyNote(targetFormat, {
        title: customTitle.trim() || 'Study Note',
        htmlContent: html,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`내보내기 중 오류가 발생했습니다: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Study Note 파일 내보내기 (Export)</h2>
              <p className="text-xs text-slate-500">원하시는 저장 파일 포맷을 선택하세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* File Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              저장 파일 이름
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="파일 이름을 입력하세요"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Formats Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              포맷 선택 (7종)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedFormat === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedFormat(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                        : `${opt.bgColor}`
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs ${opt.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{opt.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {opt.extension}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            선택된 포맷: <strong className="text-slate-800">{selectedFormat.toUpperCase()}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => handleExport()}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExporting ? (
                <span>내보내는 중...</span>
              ) : success ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>다운로드 완료!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>파일 다운로드</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
