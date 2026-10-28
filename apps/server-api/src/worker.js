const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Secret-Key',
    'Access-Control-Max-Age': '86400'
};

const API_PATHS = new Set(['/api/data', '/api/info', '/api/benchmark']);

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function isQuickTunnelUrl(value) {
    let tunnelUrl;
    try {
        tunnelUrl = new URL(value);
    } catch {
        return false;
    }

    return tunnelUrl.protocol === 'https:'
        && tunnelUrl.hostname.endsWith('.trycloudflare.com')
        && tunnelUrl.username === ''
        && tunnelUrl.password === ''
        && tunnelUrl.port === ''
        && (tunnelUrl.pathname === '/' || tunnelUrl.pathname === '')
        && tunnelUrl.search === ''
        && tunnelUrl.hash === '';
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS
            });
        }

        if (request.method === 'POST' && url.pathname === '/update-url') {
            if (!env.UPDATE_SECRET) {
                return jsonResponse({ success: false, error: 'Secret update URL belum dikonfigurasi.' }, 503);
            }
            if (!env.TUNNEL_KV) {
                return jsonResponse({ success: false, error: 'Binding TUNNEL_KV belum dikonfigurasi.' }, 503);
            }
            if (request.headers.get('X-Secret-Key') !== env.UPDATE_SECRET) {
                return jsonResponse({ success: false, error: 'Unauthorized.' }, 401);
            }

            let body;
            try {
                body = await request.json();
            } catch {
                return jsonResponse({ success: false, error: 'Body harus berupa JSON yang valid.' }, 400);
            }

            const tunnelUrl = typeof body?.url === 'string' ? body.url.trim() : '';
            if (!isQuickTunnelUrl(tunnelUrl)) {
                return jsonResponse({
                    success: false,
                    error: 'url harus berupa URL HTTPS Quick Tunnel dengan domain .trycloudflare.com.'
                }, 400);
            }

            try {
                await env.TUNNEL_KV.put('ACTIVE_TUNNEL_URL', new URL(tunnelUrl).origin);
            } catch {
                return jsonResponse({ success: false, error: 'Gagal menyimpan URL tunnel ke KV.' }, 500);
            }

            return jsonResponse({ success: true, message: 'URL tunnel berhasil diperbarui.' });
        }

        if (!API_PATHS.has(url.pathname)) {
            return jsonResponse({ success: false, error: 'Endpoint tidak ditemukan.' }, 404);
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405);
        }

        if (!env.TUNNEL_KV) {
            return jsonResponse({ success: false, error: 'Binding TUNNEL_KV belum dikonfigurasi.' }, 503);
        }

        let targetUrl;
        try {
            targetUrl = await env.TUNNEL_KV.get('ACTIVE_TUNNEL_URL');
        } catch {
            return jsonResponse({ success: false, error: 'Gagal membaca URL tunnel dari KV.' }, 503);
        }

        if (!targetUrl || !isQuickTunnelUrl(targetUrl)) {
            return jsonResponse({ success: false, error: 'API tunnel belum aktif atau URL tunnel tidak valid.' }, 503);
        }

        const proxyUrl = new URL(url.pathname + url.search, new URL(targetUrl).origin);
        const headers = new Headers(request.headers);
        headers.delete('host');
        headers.delete('cookie');
        headers.delete('x-secret-key');

        try {
            const response = await fetch(proxyUrl, {
                method: request.method,
                headers,
                redirect: 'manual',
                cache: 'no-store'
            });
            const responseHeaders = new Headers(response.headers);
            for (const [name, value] of Object.entries(CORS_HEADERS)) {
                responseHeaders.set(name, value);
            }
            responseHeaders.set('Cache-Control', 'no-store');

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders
            });
        } catch {
            return jsonResponse({ success: false, error: 'Gagal menghubungi API melalui tunnel.' }, 502);
        }
    }
};