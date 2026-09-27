'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo,
  Redo,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  ImagePlus,
  Video,
  Table as TableIcon,
  Download,
} from 'lucide-react';

interface RibbonToolbarProps {
  editor: Editor | null;
  onExportClick: () => void;
}

export default function RibbonToolbar({ editor, onExportClick }: RibbonToolbarProps) {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('삽입할 이미지 URL을 입력하세요 (예: https://...):');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addVideo = () => {
    const url = window.prompt('삽입할 YouTube 또는 비디오 URL을 입력하세요:');
    if (url) {
      // If it's youtube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      } else {
        // Fallback insert as embedded link / text
        editor.chain().focus().insertContent(`<p><a href="${url}" target="_blank">🔗 비디오 링크: ${url}</a></p>`).run();
      }
    }
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 bg-white border-b border-slate-200 text-slate-700 select-none">
      {/* Undo */}
      <button
        type="button"
        title="실행 취소 (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
      >
        <Undo className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        type="button"
        title="다시 실행 (Ctrl+Y)"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
      >
        <Redo className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />

      {/* H1 */}
      <button
        type="button"
        title="제목 1 (H1)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 text-xs font-bold transition-all rounded ${
          editor.isActive('heading', { level: 1 })
            ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-extrabold ring-1 ring-indigo-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        H1
      </button>

      {/* H2 */}
      <button
        type="button"
        title="제목 2 (H2)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-xs font-bold transition-all rounded ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-extrabold ring-1 ring-indigo-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        H2
      </button>

      {/* H3 */}
      <button
        type="button"
        title="제목 3 (H3)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-xs font-bold transition-all rounded ${
          editor.isActive('heading', { level: 3 })
            ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-extrabold ring-1 ring-indigo-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        H3
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />

      {/* Bold */}
      <button
        type="button"
        title="굵게 (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-all text-sm font-black w-7 h-7 flex items-center justify-center ${
          editor.isActive('bold')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        B
      </button>

      {/* Italic */}
      <button
        type="button"
        title="기울임꼴 (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-all text-sm italic font-serif w-7 h-7 flex items-center justify-center ${
          editor.isActive('italic')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        I
      </button>

      {/* Underline */}
      <button
        type="button"
        title="밑줄 (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded transition-all text-sm underline font-medium w-7 h-7 flex items-center justify-center ${
          editor.isActive('underline')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        U
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />

      {/* Bullet List */}
      <button
        type="button"
        title="글머리 기호 목록"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-all ${
          editor.isActive('bulletList')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <List className="w-4 h-4" />
      </button>

      {/* Ordered List */}
      <button
        type="button"
        title="번호 매기기 목록"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-all ${
          editor.isActive('orderedList')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />

      {/* Blockquote */}
      <button
        type="button"
        title="인용구"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded transition-all ${
          editor.isActive('blockquote')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Quote className="w-4 h-4" />
      </button>

      {/* Code Block */}
      <button
        type="button"
        title="코드 블록"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded transition-all ${
          editor.isActive('codeBlock')
            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Code className="w-4 h-4" />
      </button>

      {/* Horizontal Rule */}
      <button
        type="button"
        title="가로선 (구분선)"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />

      {/* Insert Image */}
      <button
        type="button"
        title="이미지 삽입"
        onClick={addImage}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
      >
        <ImagePlus className="w-4 h-4" />
      </button>

      {/* Insert Video */}
      <button
        type="button"
        title="비디오 / YouTube 삽입"
        onClick={addVideo}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
      >
        <Video className="w-4 h-4" />
      </button>

      {/* Insert Table */}
      <button
        type="button"
        title="표 삽입 (3x3)"
        onClick={insertTable}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
      >
        <TableIcon className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />

      {/* Export / Download */}
      <button
        type="button"
        title="노트 파일 내보내기 / 다운로드"
        onClick={onExportClick}
        className="p-1.5 rounded text-blue-600 hover:bg-blue-50 active:scale-95 transition-all ml-auto md:ml-0"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}
