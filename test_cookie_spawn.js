const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetUrl = 'https://www.youtube.com/watch?v=iFNTUO6-Pbw';
const ytdlpPath = path.join(__dirname, 'backend', 'yt-dlp.exe');
const cookiePath = path.join(__dirname, 'backend', 'cookies.txt');

console.log("Cookie exists:", fs.existsSync(cookiePath));

let ytDlpBaseArgs = [
    '--no-warnings', '--no-download',
    '--extractor-args', 'youtube:player_client=android,ios',
    '--js-runtimes', 'node',
    '--print', '%(title)s'
];
if (fs.existsSync(cookiePath)) {
    ytDlpBaseArgs.push('--cookies', cookiePath);
}
ytDlpBaseArgs.push(targetUrl);

console.log("Args:", ytDlpBaseArgs);

const ytDlp = spawn(ytdlpPath, ytDlpBaseArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

ytDlp.stdout.on('data', d => process.stdout.write("OUT: " + d));
ytDlp.stderr.on('data', d => process.stderr.write("ERR: " + d));
ytDlp.on('close', code => console.log("CODE:", code));
