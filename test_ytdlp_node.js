const { spawn } = require('child_process');
const ytDlp = spawn('backend\\yt-dlp.exe', [
    '--no-warnings', '--no-download',
    '--extractor-args', 'youtube:player_client=android',
    '--print', '%(title)s',
    'https://www.youtube.com/watch?v=PXUZ6xcdx_g'
], { stdio: ['ignore', 'pipe', 'pipe'] });

ytDlp.stdout.on('data', d => process.stdout.write(d));
ytDlp.stderr.on('data', d => process.stderr.write(d));
