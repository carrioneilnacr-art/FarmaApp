const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const preview = path.join(root, 'preview.html');

http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname !== '/' && pathname !== '/preview.html') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('No encontrado');
    return;
  }
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(preview).pipe(response);
}).listen(3000, '127.0.0.1', () => {
  console.log('FarmaApp preview: http://localhost:3000/');
});
