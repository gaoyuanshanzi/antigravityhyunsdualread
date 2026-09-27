import { marked } from 'marked';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export interface ParsedDocument {
  type: 'html' | 'text' | 'pdf' | 'epub';
  title: string;
  content: string; // HTML string or plain text or PDF object url
  epubChapters?: { title: string; content: string }[];
  fileSize: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
 * Main file parser dispatcher
 */
export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const fileSize = formatFileSize(file.size);
  const title = file.name;

  // 1. Text (.txt)
  if (ext === 'txt') {
    const text = await file.text();
    return {
      type: 'text',
      title,
      content: text,
      fileSize,
    };
  }

  // 2. Markdown (.md, .markdown)
  if (ext === 'md' || ext === 'markdown') {
    const raw = await file.text();
    const html = await marked.parse(raw);
    return {
      type: 'html',
      title,
      content: html,
      fileSize,
    };
  }

  // 3. HTML (.html, .htm)
  if (ext === 'html' || ext === 'htm') {
    const html = await file.text();
    return {
      type: 'html',
      title,
      content: html,
      fileSize,
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
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        type: 'html',
        title,
        content: `<div class="p-4 text-red-600 bg-red-50 rounded-lg">DOCX 파일 읽기 오류: ${msg}</div>`,
        fileSize,
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
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        type: 'html',
        title,
        content: `<div class="p-4 text-red-600 bg-red-50 rounded-lg">EPUB 파일 파싱 오류: ${msg}</div>`,
        fileSize,
      };
    }
  }

  // 7. Rich Text (.rtf)
  if (ext === 'rtf') {
    const raw = await file.text();
    const html = rtfToHtml(raw);
    return {
      type: 'html',
      title,
      content: html,
      fileSize,
    };
  }

  // Fallback for any other text-like file
  const fallbackText = await file.text();
  return {
    type: 'text',
    title,
    content: fallbackText,
    fileSize,
  };
}
