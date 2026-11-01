// Serves the mock-up from this PC so the browser and your phone (same Wi-Fi) can open it,
// with the sounds/ folder loaded automatically. Nothing is uploaded anywhere.
// Run: node serve.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const SOUND_EXT = /\.(mp3|wav|ogg|m4a)$/i;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
};
// The published artifact gets this document shell from Claude; serving the file directly needs it added here.
const SHELL = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  + '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>'
  + '</head><body>';

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/sounds/manifest.json') {
    const dir = path.join(ROOT, 'sounds');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => SOUND_EXT.test(f)) : [];
    res.writeHead(200, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(files));
  }

  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('Not found');
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (ext === '.html') {
    const html = fs.readFileSync(file, 'utf8');
    return res.end(/^<!doctype/i.test(html) ? html : SHELL + html + '</body></html>');   // mockup.html has no document shell of its own
  }
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Plate Log mock-up on this PC: http://localhost:${PORT}`);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets || []) {
      if (n.family === 'IPv4' && !n.internal) console.log(`On your phone (same Wi-Fi):  http://${n.address}:${PORT}`);
    }
  }
});
