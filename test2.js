const { spawn } = require('child_process');
const ytDlp = spawn('backend\\yt-dlp.exe', [
    '--no-warnings', '--no-download',
    '--extractor-args', 'youtube:player_client=android',
    '--print', '%(title)s|||%(uploader)s|||%(duration)s|||%(thumbnail)s|||%(formats.:.height)j',
    'https://www.youtube.com/watch?v=iFNTUO6-Pbw'
], { stdio: ['ignore', 'pipe', 'pipe'] });

ytDlp.stdout.on('data', d => process.stdout.write(d));
ytDlp.stderr.on('data', d => process.stderr.write("STDERR: " + d));
ytDlp.on('close', code => console.log("\nEXIT CODE:", code));
