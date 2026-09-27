import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Prepend https:// if missing
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    const response = await fetch(parsedTarget.toString(), {
      headers,
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';

    // If it's HTML, inject <base> tag and remove frame busters
    if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
      let html = await response.text();

      // Inject <base> tag right after <head> or at the beginning
      const baseTag = `<base href="${parsedTarget.origin}${parsedTarget.pathname}" target="_blank">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        html = baseTag + html;
      }

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          // Omit X-Frame-Options and CSP to allow embedding in iframe
        },
      });
    }

    // For other types (images, pdfs, etc.)
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '네트워크 요청 실패 또는 웹사이트 정책에 의해 차단되었습니다.';
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px; color: #333; background: #fff;">
        <h3 style="color: #e11d48;">페이지를 불러올 수 없습니다</h3>
        <p>URL: <code>${targetUrl}</code></p>
        <p style="color: #666; font-size: 14px;">${errorMsg}</p>
        <p><a href="${targetUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">새 창에서 열기</a></p>
      </body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
