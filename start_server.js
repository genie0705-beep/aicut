const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const DIR = 'C:/Users/paul/.openclaw/workspace';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.md': 'text/plain'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIR, req.url === '/' ? 'blog_viewer.html' : decodeURIComponent(req.url));
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + filePath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('서버 시작: http://localhost:' + PORT);
  console.log('뷰어: http://localhost:' + PORT + '/blog_viewer.html');
});

// Keep running until Ctrl+C
process.on('SIGINT', () => { server.close(); process.exit(0); });
