'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import RibbonToolbar from './RibbonToolbar';
import ExportModal from './ExportModal';
import { Download, FileEdit, Trash2, Check } from 'lucide-react';

const STORAGE_KEY = 'hyuns_study_note_v1';
const TITLE_STORAGE_KEY = 'hyuns_study_note_title_v1';

const INITIAL_CONTENT = `
<h2>학습 노트 (Study Note)</h2>
<p>이곳에 자유롭게 개인 학습 노트를 작성하세요. 왼쪽 패널 A, B에서 문서를 읽으며 중요한 문장을 인용하거나 정리할 수 있습니다.</p>
<blockquote>💡 <strong>사용 팁</strong>: 서식 리본을 사용하여 제목(H1, H2, H3), 굵게, 기울임, 밑줄, 리스트, 인용구, 표, 이미지 등을 자유롭게 추가할 수 있습니다. 작성 완료 후 <strong>Export file</strong> 버튼을 눌러 Text, PDF, Word(DOC), EPUB, HTML, RTF, Markdown 형식으로 컴퓨터에 바로 저장하세요!</blockquote>
<ul>
  <li><strong>Panel A</strong>: 원문 자료 (PDF, 논문, 웹사이트 등)</li>
  <li><strong>Panel B</strong>: 참고 자료 또는 번역본 (ePub, docx, 웹 문서 등)</li>
  <li><strong>Study Note</strong>: 핵심 요약, 질의응답 및 나만의 인사이트 정리</li>
</ul>
`;

export default function StudyNoteEditor() {
  const [title, setTitle] = useState('개인 학습 노트');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        inline: false,
        width: 480,
        height: 270,
      }),
    ],
    content: INITIAL_CONTENT,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[460px] p-4 text-slate-800',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, html);
        const text = editor.getText();
        setCharCount(text.length);
        const now = new Date();
        setLastSaved(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
    },
  });

  // Load saved content from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && editor) {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedTitle = localStorage.getItem(TITLE_STORAGE_KEY);
      if (saved) {
        editor.commands.setContent(saved);
        setCharCount(editor.getText().length);
      }
      if (savedTitle) {
        setTitle(savedTitle);
      }
    }
  }, [editor]);

  // Save title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TITLE_STORAGE_KEY, newTitle);
    }
  };

  // Helper to append text/quote to editor from panels
  useEffect(() => {
    const handleAddClip = (e: Event) => {
      const customEvent = e as CustomEvent<{ text?: string }>;
      if (editor && customEvent.detail?.text) {
        editor.chain().focus().insertContent(`<blockquote><p>${customEvent.detail.text}</p></blockquote><p></p>`).run();
      }
    };

    window.addEventListener('insert-quote-to-note', handleAddClip);
    return () => {
      window.removeEventListener('insert-quote-to-note', handleAddClip);
    };
  }, [editor]);

  const handleClear = () => {
    if (window.confirm('정말 학습 노트를 새로 작성하시겠습니까? (기존 내용은 초기화됩니다)')) {
      editor?.commands.setContent('<p></p>');
      setTitle('새 학습 노트');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Header: Export file & Title */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileEdit className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors w-full"
            placeholder="노트 제목 입력..."
          />
        </div>

        {/* Top Right "Export file" button as labeled in Image 1 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            title="노트 비우기"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export file</span>
          </button>
        </div>
      </div>

      {/* Formatting Ribbon Menu (Image 2) */}
      <RibbonToolbar
        editor={editor}
        onExportClick={() => setIsExportOpen(true)}
      />

      {/* TipTap Rich Editor Main Body */}
      <div className="flex-1 overflow-y-auto p-2 bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Bottom Status Bar */}
      <div className="px-4 py-1.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>글자 수: <strong className="text-slate-600">{charCount.toLocaleString()}</strong>자</span>
          {lastSaved && (
            <span className="flex items-center gap-1 text-slate-400">
              <Check className="w-3 h-3 text-emerald-500" />
              자동저장됨 ({lastSaved})
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400">Rich Text Editor &bull; 7개 포맷 저장 지원</span>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        noteTitle={title}
        getEditorHtml={() => editor?.getHTML() || ''}
      />
    </div>
  );
}
