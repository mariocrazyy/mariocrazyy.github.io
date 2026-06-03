import http from 'http';
import https from 'https';
import url from 'url';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;
    let target = query.url;
    
    if (!target && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Proxy</title></head>
            <body style="font-family:monospace;background:#000;color:#0f0;padding:20px">
                <h2>Proxy Active</h2>
                <input id="u" size="60" placeholder="https://example.com">
                <button onclick="location.href='?url='+encodeURIComponent(u.value)">Go</button>
                <iframe id="f" style="width:100%;height:70vh;margin-top:10px"></iframe>
                <script>document.getElementById('f').src=location.href.split('?url=')[1]||''</script>
            </body>
            </html>
        `);
        return;
    }
    
    if (!target) {
        res.writeHead(400);
        res.end('Missing ?url=');
        return;
    }
    
    const parsedTarget = url.parse(target);
    const options = {
        hostname: parsedTarget.hostname,
        port: parsedTarget.port || (parsedTarget.protocol === 'https:' ? 443 : 80),
        path: parsedTarget.path || '/',
        method: req.method,
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Accept-Encoding': 'identity'
        }
    };
    
    const protocol = options.port === 443 ? https : http;
    const proxyReq = protocol.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'text/html',
            'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + err.message);
    });
    
    proxyReq.end();
});

server.listen(port, () => {
    console.log('Proxy running on port ' + port);
});
