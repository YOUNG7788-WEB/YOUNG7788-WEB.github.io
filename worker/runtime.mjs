const BASE_POLICY = "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'none'";
function securityHeaders(contentType, policy = BASE_POLICY) {
  return new Headers({
    'content-type': contentType,
    'content-security-policy': policy,
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'strict-transport-security': 'max-age=31536000',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
  });
}
export function createWorker(assets, legacyAssetPaths = [], fetchOrigin = fetch, options = {}) {
  const privateAudience = options.privateAudience !== false;
  const originals = new Set(legacyAssetPaths);
  const originalOrigin = 'https://young7788-web.github.io';
  function response(body, status, type = 'text/plain; charset=utf-8', extra = {}) {
    const headers = securityHeaders(type);
    for (const [key,value] of Object.entries(extra)) headers.set(key,value);
    return new Response(body,{status,headers});
  }
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.protocol !== 'https:') {
        url.protocol='https:';
        return response(null,301,undefined,{location:url.href});
      }
      if (!['GET','HEAD'].includes(request.method)) {
        return response(null,405,undefined,{allow:'GET, HEAD','cache-control':'no-store'});
      }
      let path = url.pathname === '/' ? '/index.html' : url.pathname;
      // Never map URL input to filesystem paths or a user-selected remote origin.
      if (/%|\\|\0/.test(path)) return response(null,404);
      if (path === '/article.html') {
        const id = url.searchParams.get('id');
        if (id && /^[a-z0-9-]+$/.test(id) && Object.hasOwn(assets,`/posts/${id}.html`)) {
          return response(null,302,undefined,{location:`/posts/${id}.html`,'cache-control':'no-store'});
        }
      }
      const known = Object.hasOwn(assets,path);
      const asset = known ? assets[path] : null;
      if (asset) {
        const headers = securityHeaders(asset.type,asset.policy || BASE_POLICY);
        headers.set('etag',`"${asset.digest}"`);
        const cache = /-[0-9a-f]{10}\.(webp|png|jpe?g)$/.test(path)
          ? 'public, max-age=31536000, immutable'
          : path.endsWith('.html') ? 'public, max-age=300' : 'public, max-age=3600';
        headers.set('cache-control',privateAudience ? 'private, no-store' : cache);
        if (request.headers.get('if-none-match') === `"${asset.digest}"`) {
          return new Response(null,{status:304,headers});
        }
        if (request.method === 'HEAD') return new Response(null,{status:200,headers});
        const body = asset.encoding === 'base64'
          ? Uint8Array.from(atob(asset.body),char=>char.charCodeAt(0)) : asset.body;
        return new Response(body,{status:200,headers});
      }
      // Old full-resolution artwork stays available without bloating the Worker.
      // Only predeclared public assets are fetched. No user auth/cookies are forwarded.
      if (originals.has(path)) {
        try {
          const origin = await fetchOrigin(originalOrigin+path,{
            method:request.method,
            redirect:'manual',
            headers:{accept:'*/*','accept-encoding':'identity'},
            cf:{cacheEverything:true,cacheTtl:3600},
          });
          if (origin.status !== 200) return response(null,origin.status===404?404:502);
          const type = origin.headers.get('content-type') || 'application/octet-stream';
          if (!/^(image\/(?:webp|png|jpeg|gif)|application\/json)\b/i.test(type)) {
            return response(null,502);
          }
          const headers = securityHeaders(type);
          headers.set('cache-control',privateAudience ? 'private, no-store' : 'public, max-age=3600');
          return new Response(request.method==='HEAD'?null:origin.body,{status:200,headers});
        } catch {return response(null,502);}
      }
      const missing = assets['/404.html'];
      const headers = securityHeaders('text/html; charset=utf-8',missing?.policy || BASE_POLICY);
      headers.set('cache-control','no-store');
      return new Response(request.method==='HEAD'?null:(missing?.body || 'Not found'),{status:404,headers});
    },
  };
}
