import TurndownService from 'turndown';
import JSZip from 'jszip';

export type ExportFormat = 'text' | 'pdf' | 'doc' | 'epub' | 'html' | 'rtf' | 'md';

export interface ExportOptions {
  title: string;
  htmlContent: string;
}

/**
 * Trigger browser file download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Export as Plain Text (.txt)
 */
export function exportAsText(options: ExportOptions) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = options.htmlContent;

  // Format breaks and paragraphs
  tempDiv.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  tempDiv.querySelectorAll('p').forEach(p => p.append('\n\n'));
  tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    h.prepend('\n\n# ');
    h.append('\n');
  });
  tempDiv.querySelectorAll('li').forEach(li => li.prepend('• '));

  const text = `# ${options.title}\n\n${tempDiv.textContent || ''}`.trim();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${options.title || 'study-note'}.txt`);
}

/**
 * 2. Export as Markdown (.md)
 */
export function exportAsMarkdown(options: ExportOptions) {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  const mdContent = `# ${options.title}\n\n` + turndownService.turndown(options.htmlContent);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${options.title || 'study-note'}.md`);
}

/**
 * 3. Export as Standalone HTML (.html)
 */
export function exportAsHtml(options: ExportOptions) {
  const htmlDoc = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      color: #1e293b;
      background-color: #ffffff;
      max-width: 860px;
      margin: 40px auto;
      padding: 0 24px;
    }
    h1 { font-size: 2rem; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-top: 24px; }
    h2 { font-size: 1.5rem; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-top: 20px; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-top: 16px; }
    p { margin: 12px 0; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; background: #f8fafc; padding: 12px 16px; border-radius: 4px; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: monospace; }
    ul, ol { padding-left: 24px; margin: 12px 0; }
    li { margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #94a3b8; text-align: right; }
  </style>
</head>
<body>
  <h1>${options.title}</h1>
  <div class="content">
    ${options.htmlContent}
  </div>
  <div class="footer">
    Exported from DualRead &amp; Study Note &bull; ${new Date().toLocaleDateString('ko-KR')}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${options.title || 'study-note'}.html`);
}

/**
 * 4. Export as Rich Text Format (.rtf)
 */
export function exportAsRtf(options: ExportOptions) {
  let content = options.htmlContent;

  // Convert HTML tags to RTF control words
  content = content.replace(/<h1>(.*?)<\/h1>/gi, '\\par\\b\\fs36 $1\\b0\\fs22\\par ');
  content = content.replace(/<h2>(.*?)<\/h2>/gi, '\\par\\b\\fs30 $1\\b0\\fs22\\par ');
  content = content.replace(/<h3>(.*?)<\/h3>/gi, '\\par\\b\\fs26 $1\\b0\\fs22\\par ');
  content = content.replace(/<strong>(.*?)<\/strong>/gi, '\\b $1\\b0 ');
  content = content.replace(/<b>(.*?)<\/b>/gi, '\\b $1\\b0 ');
  content = content.replace(/<em>(.*?)<\/em>/gi, '\\i $1\\i0 ');
  content = content.replace(/<i>(.*?)<\/i>/gi, '\\i $1\\i0 ');
  content = content.replace(/<u>(.*?)<\/u>/gi, '\\ul $1\\ulnone ');
  content = content.replace(/<p>(.*?)<\/p>/gi, '$1\\par\\par\n');
  content = content.replace(/<br\s*\/?>/gi, '\\line\n');
  content = content.replace(/<li>(.*?)<\/li>/gi, '\\bullet  $1\\par\n');
  content = content.replace(/<blockquote>(.*?)<\/blockquote>/gi, '\\i $1\\i0\\par\n');
  content = content.replace(/<hr\s*\/?>/gi, '\\par----------------------------------------\\par\n');

  // Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, '');

  // Convert non-ASCII Unicode characters to RTF \uN? format
  let rtfBody = '';
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code > 127) {
      rtfBody += `\\u${code}?`;
    } else {
      rtfBody += content.charAt(i);
    }
  }

  const titleUnicode = Array.from(options.title)
    .map(c => (c.charCodeAt(0) > 127 ? `\\u${c.charCodeAt(0)}?` : c))
    .join('');

  const rtfDoc = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat
{\\fonttbl{\\f0\\fnil\\fcharset129 Malgun Gothic;}{\\f1\\fnil\\fcharset0 Arial;}}
{\\colortbl ;\\red30\\green41\\blue59;}
\\viewkind4\\uc1\\pard\\cf1\\f0\\fs40\\b ${titleUnicode}\\b0\\fs22\\par\\par
${rtfBody}
}`;

  const blob = new Blob([rtfDoc], { type: 'application/rtf' });
  downloadBlob(blob, `${options.title || 'study-note'}.rtf`);
}

/**
 * 5. Export as Word Document (.doc / .docx compatible)
 */
export function exportAsDoc(options: ExportOptions) {
  // Use Microsoft Word HTML format with specific XML/MHTML namespaces
  // This format opens seamlessly in Microsoft Word, LibreOffice, and Google Docs with full styles!
  const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${options.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Malgun Gothic', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111827; }
    h1 { font-size: 20pt; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 6pt; margin-top: 18pt; }
    h2 { font-size: 15pt; font-weight: bold; color: #1e40af; border-bottom: 1px solid #93c5fd; padding-bottom: 4pt; margin-top: 14pt; }
    h3 { font-size: 13pt; font-weight: bold; color: #1d4ed8; margin-top: 10pt; }
    p { margin: 6pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th, td { border: 1px solid #cbd5e1; padding: 6pt 8pt; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; }
    blockquote { border-left: 3pt solid #3b82f6; padding-left: 10pt; color: #475569; font-style: italic; background-color: #f8fafc; margin: 8pt 0; padding: 6pt 10pt; }
    ul, ol { margin: 6pt 0; padding-left: 18pt; }
    li { margin-bottom: 4pt; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 16pt 0; }
  </style>
</head>
<body>
  <h1>${options.title}</h1>
  ${options.htmlContent}
</body>
</html>`;

  const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
  downloadBlob(blob, `${options.title || 'study-note'}.doc`);
}

/**
 * 6. Export as Standard EPUB (.epub)
 */
export async function exportAsEpub(options: ExportOptions) {
  const zip = new JSZip();

  // 1. mimetype (must be uncompressed application/epub+zip)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Clean XHTML content
  // Convert any void tags to XML self-closing tags
  const xhtmlBody = options.htmlContent
    .replace(/<br\s*>/gi, '<br/>')
    .replace(/<hr\s*>/gi, '<hr/>')
    .replace(/<img([^>]+)>/gi, '<img$1/>');

  const xhtmlContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${options.title}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; margin: 5%; color: #222; }
    h1 { font-size: 1.8em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; }
    h2 { font-size: 1.4em; }
    h3 { font-size: 1.2em; }
    blockquote { border-left: 3px solid #666; padding-left: 1em; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #ccc; padding: 0.5em; text-align: left; }
    th { background: #eee; }
  </style>
</head>
<body>
  <h1>${options.title}</h1>
  ${xhtmlBody}
</body>
</html>`;

  zip.file('OEBPS/note.xhtml', xhtmlContent);

  // 4. OEBPS/toc.ncx
  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:hyuns-note-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${options.title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>${options.title}</text></navLabel>
      <content src="note.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`
  );

  // 5. OEBPS/content.opf
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${options.title}</dc:title>
    <dc:language>ko</dc:language>
    <dc:identifier id="BookID">urn:uuid:hyuns-note-${Date.now()}</dc:identifier>
    <dc:creator>Hyuns DualRead</dc:creator>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
  </metadata>
  <manifest>
    <item id="note" href="note.xhtml" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="note"/>
  </spine>
</package>`
  );

  const epubBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  downloadBlob(epubBlob, `${options.title || 'study-note'}.epub`);
}

/**
 * 7. Export as PDF (.pdf)
 * Opens a dedicated styled print window that prompts the browser's PDF save dialog
 */
export function exportAsPdf(options: ExportOptions) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('팝업 차단이 활성화되어 있습니다. 팝업을 허용해주세요.');
    return;
  }

  const printHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #111827;
      background: #ffffff;
      padding: 0;
      margin: 0;
    }
    h1 { font-size: 22pt; font-weight: 800; border-bottom: 2px solid #2563eb; padding-bottom: 8pt; margin-top: 0; }
    h2 { font-size: 16pt; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; margin-top: 16pt; }
    h3 { font-size: 13pt; font-weight: 600; margin-top: 12pt; }
    p { margin: 8pt 0; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 12pt; color: #4b5563; font-style: italic; background: #f8fafc; margin: 12pt 0; padding: 8pt 12pt; }
    pre { background: #f3f4f6; padding: 10pt; border-radius: 6pt; font-family: monospace; font-size: 9.5pt; }
    table { width: 100%; border-collapse: collapse; margin: 14pt 0; }
    th, td { border: 1px solid #d1d5db; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
    th { background: #f3f4f6; font-weight: bold; }
    ul, ol { padding-left: 18pt; margin: 8pt 0; }
    li { margin-bottom: 4pt; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 16pt 0; }
    img { max-width: 100%; }
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2563eb;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 9999;
    }
    .print-bar button {
      background: white;
      color: #2563eb;
      border: none;
      padding: 6px 16px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }
    .container {
      margin-top: 50px;
    }
    @media print {
      .print-bar { display: none !important; }
      .container { margin-top: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span><strong>PDF 인쇄/저장</strong>: 브라우저 인쇄 대화상자에서 대상을 <strong>'PDF로 저장'</strong>으로 선택하세요.</span>
    <button onclick="window.print()">지금 인쇄 / PDF 저장</button>
  </div>
  <div class="container">
    <h1>${options.title}</h1>
    <div>${options.htmlContent}</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
}

/**
 * Dispatch export based on selected format
 */
export async function exportStudyNote(format: ExportFormat, options: ExportOptions) {
  switch (format) {
    case 'text':
      exportAsText(options);
      break;
    case 'md':
      exportAsMarkdown(options);
      break;
    case 'html':
      exportAsHtml(options);
      break;
    case 'rtf':
      exportAsRtf(options);
      break;
    case 'doc':
      exportAsDoc(options);
      break;
    case 'epub':
      await exportAsEpub(options);
      break;
    case 'pdf':
      exportAsPdf(options);
      break;
    default:
      exportAsText(options);
  }
}
