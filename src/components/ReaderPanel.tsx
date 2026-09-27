'use client';

import React, { useState, useRef } from 'react';
import {
  Globe,
  Upload,
  ArrowRight,
  RotateCw,
  ExternalLink,
  X,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Quote,
  Sparkles,
  Languages,
} from 'lucide-react';
import { parseUploadedFile, ParsedDocument, ENCODING_OPTIONS, reDecodeDocument } from '@/lib/fileParsers';

interface ReaderPanelProps {
  id: 'A' | 'B';
  panelName: string;
}

export default function ReaderPanel({ id, panelName }: ReaderPanelProps) {
  // URL state
  const [inputUrl, setInputUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [proxyMode, setProxyMode] = useState<'proxy' | 'direct'>('proxy');

  // File state
  const [loadedDoc, setLoadedDoc] = useState<ParsedDocument | null>(null);
  const [selectedEpubChapter, setSelectedEpubChapter] = useState<number>(0);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer options
  const [fontSize, setFontSize] = useState<number>(15);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Content mode: 'none' | 'url' | 'file'
  const activeMode: 'none' | 'url' | 'file' = loadedDoc
    ? 'file'
    : activeUrl
    ? 'url'
    : 'none';

  // Handle URL submit
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let url = inputUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setLoadedDoc(null);
    setActiveUrl(url);
    setIframeKey((prev) => prev + 1);
  };

  // Handle File select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const parsed = await parseUploadedFile(file);
      setLoadedDoc(parsed);
      setSelectedEpubChapter(0);
      setActiveUrl('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`파일을 읽는 도중 오류가 발생했습니다: ${msg}`);
    } finally {
      setIsLoadingFile(false);
      // Reset input value so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Quote selected text to Study Note
  const handleQuoteToNote = () => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim()) {
      window.dispatchEvent(
        new CustomEvent('insert-quote-to-note', {
          detail: { text: `[Panel ${id} 인용] ${selection.trim()}` },
        })
      );
    } else {
      alert('본문에서 인용할 텍스트를 마우스로 드래그하여 선택한 후 버튼을 눌러주세요.');
    }
  };

  // Quick preset links
  const handlePreset = (url: string) => {
    setInputUrl(url);
    setLoadedDoc(null);
    setActiveUrl(url);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* 1. Top Section: WWW URL Input (Matching Image 1: www) */}
      <div className="p-2.5 bg-slate-50/80 border-b border-slate-200/80 space-y-2">
        <form onSubmit={handleUrlSubmit} className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="www.example.com 또는 웹사이트 URL 입력"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            title="웹페이지 불러오기"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-all"
          >
            <span>이동</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {activeUrl && (
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              title="새로고침"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              title="새 창에서 열기"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </form>

        {/* 2. Middle Section: File Selector (Matching Image 1: file) */}
        <div className="flex items-center justify-between gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.pdf,.doc,.docx,.epub,.html,.htm,.rtf,.md,.markdown"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingFile}
            className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            {isLoadingFile ? (
              <span>파일 분석 중...</span>
            ) : (
              <span>파일 열기 (text, pdf, doc, epub, html, rtf, md)</span>
            )}
          </button>

          {loadedDoc && (
            <button
              type="button"
              onClick={() => setLoadedDoc(null)}
              title="열린 파일 닫기"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Subheader / Status Bar */}
      <div className="px-3 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 truncate">
          <span className="font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] border border-blue-200">
            {panelName}
          </span>
          <span className="truncate max-w-[200px] text-slate-700 font-medium">
            {loadedDoc ? loadedDoc.title : activeUrl || '대기 중'}
          </span>
          {loadedDoc && (
            <span className="text-[10px] text-slate-400">({loadedDoc.fileSize})</span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {activeMode === 'file' && loadedDoc?.rawBuffer && (
            <div className="flex items-center gap-1 border-r border-slate-200 pr-1.5 mr-1">
              <Languages className="w-3 h-3 text-slate-400" />
              <select
                value={loadedDoc.encoding || 'utf-8'}
                onChange={async (e) => {
                  const newEnc = e.target.value;
                  if (loadedDoc) {
                    const updated = await reDecodeDocument(loadedDoc, newEnc);
                    setLoadedDoc(updated);
                  }
                }}
                title="문자 인코딩 선택 (한국어 EUC-KR / 번체 Big5 / 유니코드 UTF-8 / 간체 GBK)"
                className="text-[10px] font-medium border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {ENCODING_OPTIONS.map((enc) => (
                  <option key={enc.id} value={enc.id}>
                    {enc.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeMode === 'file' && loadedDoc?.type !== 'pdf' && (
            <div className="flex items-center gap-1 border-r border-slate-200 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                title="글꼴 축소"
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                title="글꼴 확대"
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeMode === 'url' && (
            <button
              type="button"
              onClick={() => setProxyMode(proxyMode === 'proxy' ? 'direct' : 'proxy')}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                proxyMode === 'proxy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="CORS/보안 정책으로 웹페이지가 뜨지 않을 때 프록시 모드로 전환"
            >
              {proxyMode === 'proxy' ? '프록시 모드' : '직접 연결'}
            </button>
          )}

          <button
            type="button"
            onClick={handleQuoteToNote}
            title="선택한 텍스트를 오른쪽 Study Note로 인용 복사"
            className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded text-[11px] font-medium text-slate-600 transition-colors flex items-center gap-1"
          >
            <Quote className="w-3 h-3" />
            <span>노트로 인용</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content Display Area (Matching Image 1: Panel A / Panel B) */}
      <div className="flex-1 overflow-auto bg-slate-50/30 relative">
        {/* State: Empty */}
        {activeMode === 'none' && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">{panelName}</h3>
            <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed mb-4">
              상단의 <strong>www</strong>에 웹사이트 URL을 입력하거나, <strong>file</strong>에서 읽을 문서를 선택하세요.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5 text-left w-full max-w-[320px] bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> 빠른 웹사이트 열기 테스트:
              </span>
              <button
                type="button"
                onClick={() => handlePreset('https://ko.wikipedia.org/wiki/위키백과:대문')}
                className="w-full text-left text-xs text-blue-600 hover:underline px-2 py-1 hover:bg-slate-50 rounded"
              >
                &bull; 위키백과 (한국어 대문)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('https://ko.javascript.info')}
                className="w-full text-left text-xs text-blue-600 hover:underline px-2 py-1 hover:bg-slate-50 rounded"
              >
                &bull; 모던 JavaScript 튜토리얼
              </button>
              <button
                type="button"
                onClick={() => handlePreset('https://developer.mozilla.org/ko/')}
                className="w-full text-left text-xs text-blue-600 hover:underline px-2 py-1 hover:bg-slate-50 rounded"
              >
                &bull; MDN Web Docs (한국어)
              </button>
            </div>
          </div>
        )}

        {/* State: URL Mode */}
        {activeMode === 'url' && (
          <div className="w-full h-full bg-white relative">
            <iframe
              key={iframeKey}
              src={proxyMode === 'proxy' ? `/api/proxy?url=${encodeURIComponent(activeUrl)}` : activeUrl}
              className="w-full h-full border-none"
              title={`${panelName} Web Viewer`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        )}

        {/* State: File Mode */}
        {activeMode === 'file' && loadedDoc && (
          <div className="h-full overflow-y-auto p-4 bg-white">
            {/* 1. PDF File Viewer */}
            {loadedDoc.type === 'pdf' ? (
              <div className="w-full h-full min-h-[500px] flex flex-col">
                <iframe
                  src={loadedDoc.content}
                  className="w-full h-full min-h-[500px] border border-slate-200 rounded-lg"
                  title="PDF Viewer"
                />
              </div>
            ) : loadedDoc.type === 'epub' && loadedDoc.epubChapters ? (
              /* 2. EPUB Reader with Chapter selector */
              <div className="space-y-4">
                <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-2 border-b border-slate-100 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">목차 / 장:</span>
                    <select
                      value={selectedEpubChapter}
                      onChange={(e) => setSelectedEpubChapter(Number(e.target.value))}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {loadedDoc.epubChapters.map((chap, idx) => (
                        <option key={idx} value={idx}>
                          {chap.title || `제 ${idx + 1} 장`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-slate-400">
                    {selectedEpubChapter + 1} / {loadedDoc.epubChapters.length}
                  </span>
                </div>
                <div
                  className="prose prose-slate max-w-none leading-relaxed text-slate-800"
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{
                    __html: loadedDoc.epubChapters[selectedEpubChapter]?.content || '',
                  }}
                />
              </div>
            ) : loadedDoc.type === 'text' ? (
              /* 3. Plain Text Viewer */
              <pre
                className="font-mono whitespace-pre-wrap leading-relaxed text-slate-800 select-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                {loadedDoc.content}
              </pre>
            ) : (
              /* 4. HTML / DOCX / RTF / Markdown converted HTML */
              <div
                className="prose prose-slate max-w-none leading-relaxed text-slate-800 select-text"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: loadedDoc.content }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
