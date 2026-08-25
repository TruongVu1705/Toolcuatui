const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { convertPdfToDocx, convertPdfToPptx } = require('./pdfConverter');

const PORT = process.env.PORT || 8080;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

const store = new Map();

function generateCode(length = 6) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < length; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
}

const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = parsedUrl.pathname;

    // API Routes
    if (pathname === '/api/v1/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', server: 'Node.js Local Runner + OpenXML Office Ready' }));
        return;
    }

    // 1 & 2. PDF to DOCX & PPTX Converters
    if ((pathname === '/api/v1/pdf/convert-word' || pathname === '/api/v1/pdf/convert-pptx') && req.method === 'POST') {
        const chunks = [];
        const rawFilename = req.headers['x-filename'] || 'document.pdf';
        let originalFilename = 'document.pdf';
        try {
            originalFilename = decodeURIComponent(rawFilename);
        } catch (e) {
            originalFilename = rawFilename;
        }

        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const bodyBuffer = Buffer.concat(chunks);
                const isPptx = pathname.includes('convert-pptx');

                let outputBuffer;
                if (isPptx) {
                    outputBuffer = await convertPdfToPptx(bodyBuffer, originalFilename);
                    res.setHeader('Content-Type', MIME_TYPES['.pptx']);
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFilename.replace(/\.pdf$/i, '.pptx'))}"`);
                } else {
                    outputBuffer = await convertPdfToDocx(bodyBuffer, originalFilename);
                    res.setHeader('Content-Type', MIME_TYPES['.docx']);
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFilename.replace(/\.pdf$/i, '.docx'))}"`);
                }

                res.writeHead(200);
                res.end(outputBuffer);
            } catch (err) {
                console.error('PDF Endpoint Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to convert PDF' }));
            }
        });
        return;
    }

    // Image Downloader Info
    if (pathname === '/api/v1/media/image-info' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                if (!data.url) throw new Error("Missing URL");

                const scraperPath = path.join(__dirname, 'backend', 'scraper.js');
                const scraper = spawn('node', [scraperPath, data.url], { stdio: ['ignore', 'pipe', 'pipe'] });

                let output = '';
                let errorOutput = '';

                scraper.stdout.on('data', (d) => output += d);
                scraper.stderr.on('data', (d) => errorOutput += d);

                scraper.on('close', (code) => {
                    try {
                        let parsed = {};
                        try {
                            // Extract the last JSON object from stdout in case of other logs
                            const lines = output.trim().split('\n').filter(l => l.trim().length > 0);
                            parsed = JSON.parse(lines[lines.length - 1]);
                        } catch (err) {
                            parsed = JSON.parse(output.trim());
                        }

                        if (parsed.error || code !== 0) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: parsed.error || errorOutput || 'Failed to fetch image' }));
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(parsed));
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to parse scraper output' }));
                    }
                });

            } catch (e) {
                res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid Request' }));
            }
        });
        return;
    }

    // Image Download Proxy
    if (pathname === '/api/v1/media/download-proxy' && req.method === 'GET') {
        const queryParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const targetUrl = queryParams.get('url');

        if (!targetUrl) {
            res.writeHead(400); res.end('Missing URL');
            return;
        }

        const _http = require('http');
        const _https = require('https');
        const protocol = targetUrl.startsWith('https') ? _https : _http;

        protocol.get(targetUrl, (proxyRes) => {
            if (proxyRes.statusCode !== 200) {
                res.writeHead(500); res.end('Failed to download image');
                return;
            }
            const filename = `image_${Date.now()}.jpg`;
            res.writeHead(200, {
                'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                'Content-Disposition': `attachment; filename="${filename}"`
            });
            proxyRes.pipe(res);
        }).on('error', (err) => {
            res.writeHead(500); res.end('Proxy Error');
        });
        return;
    }

    // 4. URL Shortener
    if (pathname === '/api/v1/shorten' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const alias = data.alias || generateCode();
                store.set(alias, { url: data.url, clicks: 0 });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    short_code: alias,
                    short_url: `http://localhost:${PORT}/s/${alias}`
                }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    if (pathname.startsWith('/s/')) {
        const code = pathname.replace('/s/', '');
        const found = store.get(code);
        if (found) {
            found.clicks++;
            res.writeHead(302, { Location: found.url });
            res.end();
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Link rút gọn không tồn tại!');
        }
        return;
    }

    // Media Downloader Info
    if (pathname === '/api/v1/media/download-info' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                if (!data.url) throw new Error("Missing URL");

                const downloadUrl = `/api/v1/media/stream${data.type === 'audio' ? '-audio' : ''}?url=${encodeURIComponent(data.url)}`;
                const isWin = process.platform === 'win32';
                const ytdlpPath = isWin ? path.join(__dirname, 'backend', 'yt-dlp.exe') : 'yt-dlp';
                
                let ytDlpBaseArgs = [
                    '--no-warnings', '--no-download',
                    '--js-runtimes', 'node',
                    '--print', '%(title)s|||%(uploader)s|||%(duration)s|||%(thumbnail)s|||%(formats.:.height)j'
                ];
                if (fs.existsSync(path.join(__dirname, 'backend', 'cookies.txt'))) {
                    ytDlpBaseArgs.push('--cookies', path.join(__dirname, 'backend', 'cookies.txt'));
                }
                ytDlpBaseArgs.push(data.url);

                const ytDlp = spawn(ytdlpPath, ytDlpBaseArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

                let output = '';
                let stderr = '';
                let responded = false;

                ytDlp.stdout.on('data', d => output += d);
                ytDlp.stderr.on('data', d => stderr += d);

                // Format seconds to MM:SS or HH:MM:SS
                function formatDuration(sec) {
                    const n = parseInt(sec, 10);
                    if (isNaN(n) || n <= 0) return '00:00';
                    const h = Math.floor(n / 3600);
                    const m = Math.floor((n % 3600) / 60);
                    const s = n % 60;
                    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }

                // Timeout after 35 seconds - return fallback immediately
                const timeout = setTimeout(() => {
                    if (!responded) {
                        responded = true;
                        console.error('[Download Info] yt-dlp timeout after 35 seconds.');
                        try { ytDlp.kill(); } catch (e) { }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            title: 'Video tải xuống',
                            uploader: 'Nền tảng verified',
                            duration: '00:00',
                            thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
                            download_url: downloadUrl,
                            resolutions: [1080, 720, 360]
                        }));
                    }
                }, 35000);

                ytDlp.on('close', code => {
                    clearTimeout(timeout);
                    if (responded) return;
                    responded = true;

                    try {
                        if (code === 0 && output.trim()) {
                            const parts = output.trim().split('|||');
                            if (parts.length >= 5) {
                                const title = parts[0];
                                const uploader = parts[1];
                                const duration = parts[2];
                                const thumbnail = parts[3];
                                const formatsJson = parts.slice(4).join('|||'); // in case there's '|||' in JSON for some reason

                                let heights = [];
                                try {
                                    heights = JSON.parse(formatsJson);
                                } catch (e) { }

                                // Extract resolutions
                                let resolutions = [];
                                if (Array.isArray(heights)) {
                                    const resSet = new Set();
                                    heights.forEach(h => {
                                        if (h && h > 0) resSet.add(h);
                                    });
                                    resolutions = Array.from(resSet).sort((a, b) => b - a);
                                }

                                // Filter out audio-only small values if any (though yt-dlp might just return height=null)
                                // Standard resolutions
                                if (resolutions.length === 0) resolutions = [1080, 720, 360];

                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    title: title || 'Video tải xuống',
                                    uploader: uploader || 'Unknown',
                                    duration: formatDuration(duration),
                                    thumbnail: thumbnail && thumbnail !== 'NA' ? thumbnail : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
                                    download_url: downloadUrl,
                                    resolutions: resolutions
                                }));
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse yt-dlp output:', e);
                    }

                    if (code !== 0) {
                        console.error('[Download Info] yt-dlp failed. Code:', code, 'Stderr:', stderr);
                    }

                    // Fallback
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        title: 'Video tải xuống',
                        uploader: 'Nền tảng verified',
                        duration: '00:00',
                        thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
                        download_url: downloadUrl,
                        resolutions: [1080, 720, 360]
                    }));
                });
            } catch (e) {
                res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid URL' }));
            }
        });
        return;
    }

    // Stream Video (mp4)
    if (pathname === '/api/v1/media/stream' && req.method === 'GET') {
        const url = parsedUrl.searchParams.get('url');
        const resolution = parsedUrl.searchParams.get('resolution') || '1080';
        if (!url) { res.writeHead(400); return res.end('Missing URL'); }

        const isWin = process.platform === 'win32';
        const ytdlpPath = isWin ? path.join(__dirname, 'backend', 'yt-dlp.exe') : 'yt-dlp';
        const ffmpegDir = isWin ? path.join(__dirname, 'backend') : '/usr/bin';
        const tmpFile = path.join(__dirname, 'backend', 'tmp', `vid_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp4`);

        let isFacebook = url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg');

        let ytDlpArgs = [
            '--ffmpeg-location', ffmpegDir,
            '--js-runtimes', 'node',
            '-S', 'vcodec:h264,res,acodec:m4a',
            '-f', `bestvideo[ext=mp4][height<=${resolution}]+bestaudio[ext=m4a]/best[ext=mp4][height<=${resolution}]/best`,
            '--merge-output-format', 'mp4',
            '--no-warnings',
            '--retries', '5'
        ];
        if (fs.existsSync(path.join(__dirname, 'backend', 'cookies.txt'))) {
            ytDlpArgs.push('--cookies', path.join(__dirname, 'backend', 'cookies.txt'));
        }
        ytDlpArgs.push('-o', tmpFile, url);

        if (isFacebook) {
            // Ưu tiên bản pre-muxed mp4 H264 (thường có mã format là hd hoặc sd) để tránh AV1 DASH và không phải re-encode gây kẹt tiến trình 40%
            ytDlpArgs = [
                '--ffmpeg-location', ffmpegDir,
                '--js-runtimes', 'node',
                '-f', `hd/sd/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
                '--merge-output-format', 'mp4',
                '--no-warnings',
                '--retries', '5'
            ];
            if (fs.existsSync(path.join(__dirname, 'backend', 'cookies.txt'))) {
                ytDlpArgs.push('--cookies', path.join(__dirname, 'backend', 'cookies.txt'));
            }
            ytDlpArgs.push('-o', tmpFile, url);
        }

        const ytDlp = spawn(ytdlpPath, ytDlpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        let stderrData = '';
        ytDlp.stderr.on('data', d => stderrData += d);

        ytDlp.on('close', code => {
            if (code === 0 && fs.existsSync(tmpFile)) {
                const stat = fs.statSync(tmpFile);
                if (stat.size > 0) {
                    res.writeHead(200, {
                        'Content-Type': 'video/mp4',
                        'Content-Disposition': 'attachment; filename="downloaded_video.mp4"',
                        'Content-Length': stat.size
                    });
                    const stream = fs.createReadStream(tmpFile);
                    stream.pipe(res);
                    stream.on('end', () => { fs.unlink(tmpFile, () => { }); });
                    stream.on('error', () => { fs.unlink(tmpFile, () => { }); });
                } else {
                    console.error('[Video Download] File is empty:', tmpFile);
                    res.writeHead(500); res.end('Downloaded file is empty');
                    fs.unlink(tmpFile, () => { });
                }
            } else {
                console.error('[Video Download] yt-dlp exit code:', code, 'stderr:', stderrData);
                res.writeHead(500); res.end('Failed to download video');
                if (fs.existsSync(tmpFile)) fs.unlink(tmpFile, () => { });
            }
        });
        return;
    }

    // Stream Audio (mp3)
    if (pathname === '/api/v1/media/stream-audio' && req.method === 'GET') {
        const url = parsedUrl.searchParams.get('url');
        if (!url) { res.writeHead(400); return res.end('Missing URL'); }

        const ytdlpPath = path.join(__dirname, 'backend', 'yt-dlp.exe');
        const tmpFile = path.join(__dirname, 'backend', 'tmp', `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`);

        const ytDlp = spawn(ytdlpPath, [
            '--js-runtimes', 'node',
            '--ffmpeg-location', path.join(__dirname, 'backend'),
            '--no-warnings', '--retries', '5',
            '-x', '--audio-format', 'mp3', '-o', tmpFile, url
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        let stderrData = '';
        ytDlp.stderr.on('data', d => stderrData += d);

        ytDlp.on('close', code => {
            if (code === 0 && fs.existsSync(tmpFile)) {
                const stat = fs.statSync(tmpFile);
                res.writeHead(200, {
                    'Content-Type': 'audio/mpeg',
                    'Content-Disposition': 'attachment; filename="downloaded_audio.mp3"',
                    'Content-Length': stat.size
                });
                const stream = fs.createReadStream(tmpFile);
                stream.pipe(res);
                stream.on('end', () => { fs.unlink(tmpFile, () => { }); });
                stream.on('error', () => { fs.unlink(tmpFile, () => { }); });
            } else {
                console.error('[Audio Download] yt-dlp exit code:', code, 'stderr:', stderrData);
                res.writeHead(500); res.end('Failed to download audio');
                if (fs.existsSync(tmpFile)) fs.unlink(tmpFile, () => { });
            }
        });
        return;
    }

    // AI Background Remover
    if (pathname === '/api/v1/image/remove-bg' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!data.image) {
                    res.writeHead(400); return res.end('Missing image');
                }
                const base64Data = data.image.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const tempIn = path.join(__dirname, 'backend', 'tmp', `in_bg_${Date.now()}.png`);
                const tempOut = path.join(__dirname, 'backend', 'tmp', `out_bg_${Date.now()}.png`);

                fs.writeFileSync(tempIn, buffer);

                // Sử dụng model silueta chuyên tối ưu hóa tốc độ (siêu nhẹ, siêu mượt, rút ngắn thời gian xử lý)
                const rembg = spawn('rembg', ['i', '-m', 'silueta', tempIn, tempOut], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
                rembg.on('close', code => {
                    if (code === 0 && fs.existsSync(tempOut)) {
                        const stat = fs.statSync(tempOut);
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': stat.size
                        });
                        const stream = fs.createReadStream(tempOut);
                        stream.pipe(res);
                        stream.on('end', () => {
                            if (fs.existsSync(tempIn)) fs.unlink(tempIn, () => { });
                            if (fs.existsSync(tempOut)) fs.unlink(tempOut, () => { });
                        });
                        stream.on('error', () => {
                            if (fs.existsSync(tempIn)) fs.unlink(tempIn, () => { });
                            if (fs.existsSync(tempOut)) fs.unlink(tempOut, () => { });
                        });
                    } else {
                        res.writeHead(500); res.end('rembg processing failed');
                        if (fs.existsSync(tempIn)) fs.unlink(tempIn, () => { });
                        if (fs.existsSync(tempOut)) fs.unlink(tempOut, () => { });
                    }
                });
            } catch (e) {
                console.error(e);
                res.writeHead(400); res.end('Invalid request');
            }
        });
        return;
    }

    // Serve Static Files from frontend/
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(FRONTEND_DIR, pathname);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Trình duyệt truy cập: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
