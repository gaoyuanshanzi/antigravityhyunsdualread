import { marked } from 'marked';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export interface ParsedDocument {
  type: 'html' | 'text' | 'pdf' | 'epub';
  title: string;
  content: string; // HTML string or plain text or PDF object url
  epubChapters?: { title: string; content: string }[];
  fileSize: string;
  rawBuffer?: ArrayBuffer;
  encoding?: string;
  fileExt?: string;
}

export const ENCODING_OPTIONS = [
  { id: 'utf-8', label: 'UTF-8 (유니코드)' },
  { id: 'euc-kr', label: 'EUC-KR / CP949 (한국어)' },
  { id: 'big5', label: 'Big5 (번체 한자)' },
  { id: 'gbk', label: 'GBK / GB2312 (간체 한자)' },
  { id: 'shift_jis', label: 'Shift-JIS (일본어)' },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Decode ArrayBuffer using specific encoding with fallback
 */
export function decodeBuffer(buffer: ArrayBuffer, encoding: string): string {
  try {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

/**
 * Smart automatic detection and decoding for UTF-8, EUC-KR, Big5, and GBK
 */
export function autoDetectAndDecode(buffer: ArrayBuffer): { text: string; encoding: string } {
  const bytes = new Uint8Array(buffer);

  // 1. Check UTF-8 BOM (EF BB BF)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return { text: decodeBuffer(buffer, 'utf-8'), encoding: 'utf-8' };
  }

  // 2. Test strict UTF-8
  let strictSuccess = false;
  let strictText = '';
  try {
    const strictDecoder = new TextDecoder('utf-8', { fatal: true });
    strictText = strictDecoder.decode(bytes);
    strictSuccess = true;
  } catch {
    strictSuccess = false;
  }

  // If strictly valid UTF-8 and contains no replacement characters
  if (strictSuccess && !strictText.includes('\uFFFD')) {
    // If it has any Hangul or CJK characters, it's definitely clean UTF-8
    const hasHangul = /[\uAC00-\uD7A3]/.test(strictText);
    const hasCJK = /[\u4E00-\u9FFF]/.test(strictText);
    if (hasHangul || hasCJK || strictText.length < 500) {
      return { text: strictText, encoding: 'utf-8' };
    }
  }

  // 3. Score candidate legacy encodings: euc-kr, big5, gbk
  const candidates = ['euc-kr', 'big5', 'gbk', 'utf-8'];
  let bestEncoding = 'euc-kr';
  let bestScore = -999999;
  let bestText = '';

  for (const enc of candidates) {
    try {
      const dec = new TextDecoder(enc);
      const text = dec.decode(bytes);
      const replacementCount = (text.match(/\uFFFD/g) || []).length;
      const hangulCount = (text.match(/[\uAC00-\uD7A3]/g) || []).length;
      const cjkCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;

      let score = 0;
      if (enc === 'euc-kr') {
        // High reward for Korean Hangul and common Hanja
        score = hangulCount * 8 + cjkCount * 2 - replacementCount * 25;
      } else if (enc === 'big5') {
        // High reward for Traditional CJK characters, penalty if hangul unexpectedly appears
        score = cjkCount * 4 - hangulCount * 3 - replacementCount * 25;
      } else if (enc === 'gbk') {
        score = cjkCount * 3.5 - hangulCount * 3 - replacementCount * 25;
      } else {
        // utf-8
        score = hangulCount * 2 + cjkCount * 2 - replacementCount * 30;
      }

      if (score > bestScore) {
        bestScore = score;
        bestEncoding = enc;
        bestText = text;
      }
    } catch {
      // ignore
    }
  }

  if (!bestText) {
    bestText = decodeBuffer(buffer, 'utf-8');
    bestEncoding = 'utf-8';
  }

  return { text: bestText, encoding: bestEncoding };
}

/**
 * Re-decode existing loaded document with user-selected encoding
 */
export async function reDecodeDocument(doc: ParsedDocument, encoding: string): Promise<ParsedDocument> {
  if (!doc.rawBuffer) return doc;
  const decodedText = decodeBuffer(doc.rawBuffer, encoding);

  if (doc.fileExt === 'md' || doc.fileExt === 'markdown') {
    const html = await marked.parse(decodedText);
    return {
      ...doc,
      content: html,
      encoding,
    };
  } else if (doc.fileExt === 'html' || doc.fileExt === 'htm') {
    return {
      ...doc,
      content: decodedText,
      encoding,
    };
  } else if (doc.fileExt === 'rtf') {
    return {
      ...doc,
      content: rtfToHtml(decodedText),
      encoding,
    };
  } else {
    // Plain text (.txt)
    return {
      ...doc,
      content: decodedText,
      encoding,
    };
  }
}

/**
 * Basic RTF to HTML converter
 */
export function rtfToHtml(rtf: string): string {
  let text = rtf;

  // Remove header and fonts table
  text = text.replace(/\{\\fonttbl[\s\S]*?\}/g, '');
  text = text.replace(/\{\\colortbl[\s\S]*?\}/g, '');
  text = text.replace(/\{\\\*[\s\S]*?\}/g, '');

  // Convert unicode escapes \uN? to characters
  text = text.replace(/\\u(-?\d+)\??/g, (_, code) => {
    const num = parseInt(code, 10);
    return String.fromCharCode(num < 0 ? num + 65536 : num);
  });

  // Convert special formatting
  text = text.replace(/\\par\b/g, '<br/>\n');
  text = text.replace(/\\line\b/g, '<br/>');
  text = text.replace(/\\tab\b/g, '&emsp;');
  text = text.replace(/\\b\s+(.*?)\\b0/g, '<strong>$1</strong>');
  text = text.replace(/\\b\s+(.*?)(?=\\)/g, '<strong>$1</strong>');
  text = text.replace(/\\i\s+(.*?)\\i0/g, '<em>$1</em>');
  text = text.replace(/\\ul\s+(.*?)\\ulnone/g, '<u>$1</u>');

  // Strip remaining RTF control words
  text = text.replace(/\\[a-zA-Z0-9-]+\s?/g, '');
  text = text.replace(/[{}]/g, '');

  // Wrap into clean paragraphs
  const paragraphs = text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p class="my-2 leading-relaxed">${p}</p>`)
    .join('');

  return paragraphs || '<p>(내용 없음)</p>';
}

/**
 * Parses EPUB files using JSZip
 */
export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<{
  title: string;
  chapters: { title: string; content: string }[];
}> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate META-INF/container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  let opfPath = 'content.opf';

  if (containerXml) {
    const match = containerXml.match(/full-path="([^"]+)"/);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfContent = await zip.file(opfPath)?.async('string');

  let title = 'EPUB Document';
  const chapters: { title: string; content: string }[] = [];

  if (opfContent) {
    // Extract title
    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    // Extract manifest items
    const manifest: Record<string, { href: string; mediaType: string }> = {};

    // Alternative order of attributes in <item>
    const allItems = opfContent.match(/<item\s+[^>]+>/gi) || [];
    for (const itemTag of allItems) {
      const id = itemTag.match(/id="([^"]+)"/)?.[1];
      const href = itemTag.match(/href="([^"]+)"/)?.[1];
      const mediaType = itemTag.match(/media-type="([^"]+)"/)?.[1];
      if (id && href) {
        manifest[id] = { href, mediaType: mediaType || '' };
      }
    }

    // Extract spine items
    const itemrefMatches = opfContent.match(/<itemref\s+[^>]*idref="([^"]+)"/gi) || [];
    for (let i = 0; i < itemrefMatches.length; i++) {
      const idref = itemrefMatches[i].match(/idref="([^"]+)"/)?.[1];
      if (idref && manifest[idref]) {
        const itemHref = manifest[idref].href;
        const fullHref = opfDir + itemHref;
        const chapterFile = zip.file(fullHref) || zip.file(itemHref);

        if (chapterFile) {
          const rawHtml = await chapterFile.async('string');
          // Extract body content
          let bodyContent = rawHtml;
          const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch && bodyMatch[1]) {
            bodyContent = bodyMatch[1];
          }

          // Extract title if exists
          const hMatch = rawHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) || rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const chapterTitle = hMatch && hMatch[1] ? hMatch[1].replace(/<[^>]+>/g, '').trim() : `제 ${i + 1} 장`;

          chapters.push({
            title: chapterTitle || `장 ${i + 1}`,
            content: bodyContent,
          });
        }
      }
    }
  }

  // Fallback: If no chapters found in spine, read all html/xhtml files
  if (chapters.length === 0) {
    const htmlFiles = Object.keys(zip.files).filter(
      name => name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm')
    );
    for (let i = 0; i < htmlFiles.length; i++) {
      const name = htmlFiles[i];
      const content = await zip.files[name].async('string');
      chapters.push({
        title: `파트 ${i + 1}`,
        content,
      });
    }
  }

  return { title, chapters };
}

/**
 * Main file parser dispatcher with encoding support
 */
export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const fileSize = formatFileSize(file.size);
  const title = file.name;

  // 1. Text (.txt)
  if (ext === 'txt') {
    const arrayBuffer = await file.arrayBuffer();
    const { text, encoding } = autoDetectAndDecode(arrayBuffer);
    return {
      type: 'text',
      title,
      content: text,
      fileSize,
      rawBuffer: arrayBuffer,
      encoding,
      fileExt: 'txt',
    };
  }

  // 2. Markdown (.md, .markdown)
  if (ext === 'md' || ext === 'markdown') {
    const arrayBuffer = await file.arrayBuffer();
    const { text, encoding } = autoDetectAndDecode(arrayBuffer);
    const html = await marked.parse(text);
    return {
      type: 'html',
      title,
      content: html,
      fileSize,
      rawBuffer: arrayBuffer,
      encoding,
      fileExt: ext,
    };
  }

  // 3. HTML (.html, .htm)
  if (ext === 'html' || ext === 'htm') {
    const arrayBuffer = await file.arrayBuffer();
    const { text, encoding } = autoDetectAndDecode(arrayBuffer);
    return {
      type: 'html',
      title,
      content: text,
      fileSize,
      rawBuffer: arrayBuffer,
      encoding,
      fileExt: ext,
    };
  }

  // 4. PDF (.pdf)
  if (ext === 'pdf') {
    const objectUrl = URL.createObjectURL(file);
    return {
      type: 'pdf',
      title,
      content: objectUrl,
      fileSize,
      fileExt: 'pdf',
    };
  }

  // 5. DOCX / DOC (.docx, .doc)
  if (ext === 'docx' || ext === 'doc') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return {
        type: 'html',
        title,
        content: result.value || '<p>문서 내용이 비어있습니다.</p>',
        fileSize,
        fileExt: ext,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        type: 'html',
        title,
        content: `<div class="p-4 text-red-600 bg-red-50 rounded-lg">DOCX 파일 읽기 오류: ${msg}</div>`,
        fileSize,
        fileExt: ext,
      };
    }
  }

  // 6. EPUB (.epub)
  if (ext === 'epub') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const epub = await parseEpub(arrayBuffer);
      return {
        type: 'epub',
        title: epub.title || title,
        content: epub.chapters[0]?.content || '<p>내용이 없습니다.</p>',
        epubChapters: epub.chapters,
        fileSize,
        fileExt: 'epub',
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        type: 'html',
        title,
        content: `<div class="p-4 text-red-600 bg-red-50 rounded-lg">EPUB 파일 파싱 오류: ${msg}</div>`,
        fileSize,
        fileExt: 'epub',
      };
    }
  }

  // 7. Rich Text (.rtf)
  if (ext === 'rtf') {
    const arrayBuffer = await file.arrayBuffer();
    const { text, encoding } = autoDetectAndDecode(arrayBuffer);
    const html = rtfToHtml(text);
    return {
      type: 'html',
      title,
      content: html,
      fileSize,
      rawBuffer: arrayBuffer,
      encoding,
      fileExt: 'rtf',
    };
  }

  // Fallback for any other file
  const arrayBuffer = await file.arrayBuffer();
  const { text, encoding } = autoDetectAndDecode(arrayBuffer);
  return {
    type: 'text',
    title,
    content: text,
    fileSize,
    rawBuffer: arrayBuffer,
    encoding,
    fileExt: ext,
  };
}
