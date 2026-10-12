const PREFIX = '/CSMU-survival-guide';
const ORIGIN = 'https://eric020730.github.io';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) {
      return new Response('Not found', { status: 404 });
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (url.pathname === PREFIX) {
      url.pathname += '/';
      return Response.redirect(url.href, 308);
    }
    // GitHub Pages is the publishing origin. Never forward visitor cookies or credentials.
    const upstreamURL = new URL(url.pathname + url.search, ORIGIN);
    try {
      const upstream = await fetch(upstreamURL, {
        method: request.method,
        redirect: 'manual',
        cf: { cacheTtl: 0 },
      });
      const headers = new Headers(upstream.headers);
      const location = headers.get('Location');
      if (location) {
        const target = new URL(location, upstreamURL);
        if (target.origin === ORIGIN && target.pathname.startsWith(`${PREFIX}/`)) {
          target.host = url.host;
          headers.set('Location', target.href);
        }
      }
      headers.set('Cache-Control', 'no-cache');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      return new Response('網站暫時無法讀取，請稍後重新整理。', {
        status: 502,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
  },
};
