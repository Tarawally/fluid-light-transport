import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

// Single authoritative development server port
const PROXY_PORT = 3000;
// Internal backend port for Observable Framework (hidden from user)
const TARGET_PORT = 3005;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

console.log(`Starting development preview server...`);
const previewProcess = spawn(
  'node',
  [
    path.join(PROJECT_ROOT, 'node_modules/@observablehq/framework/dist/bin/observable.js'),
    'preview',
    '--port',
    String(TARGET_PORT),
    '--no-open'
  ],
  {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

previewProcess.stdout.on('data', (data) => {
  let str = data.toString();
  // Rewrite references from the internal backend port to our single development port
  str = str.replace(new RegExp(`:${TARGET_PORT}`, 'g'), `:${PROXY_PORT}`);
  process.stdout.write(str);
});

previewProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

previewProcess.on('error', (err) => {
  console.error('Failed to start Observable preview process:', err);
  process.exit(1);
});

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;

  // Check if it's a request for raw simulation static assets
  const isStaticAsset = pathname.startsWith('/src/') || pathname.startsWith('/assets/') || pathname.startsWith('/sim/');

  if (isStaticAsset) {
    if (pathname.startsWith('/sim/')) {
      pathname = '/src/' + pathname.slice(5);
    }
    if (pathname === '/src/demo.html' || pathname === '/sim/demo.html') {
      pathname = '/src/index.html';
    }

    const filePath = path.join(PROJECT_ROOT, pathname);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(PROJECT_ROOT)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        proxyRequest(req, res);
      } else {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stats.size,
          'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.on('error', (streamErr) => {
          console.error(`Error reading file ${filePath}:`, streamErr);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Internal Server Error');
          }
        });
        stream.pipe(res);
      }
    });
  } else {
    proxyRequest(req, res);
  }
}

function proxyRequest(req, res) {
  const options = {
    host: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy request error for ${req.url}:`, err);
    if (!res.headersSent) {
      res.statusCode = 502;
      res.end('Bad Gateway');
    }
  });

  req.pipe(proxyReq);
}

function handleUpgrade(req, socket, head) {
  socket.on('error', (err) => {
    if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
      console.error('Client socket error:', err.message);
    }
  });

  const options = {
    host: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options);
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on('error', (err) => {
      if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
        console.error('Target socket error:', err.message);
      }
    });

    if (socket.destroyed) {
      proxySocket.destroy();
      return;
    }

    socket.write(`HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n');
    
    if (proxyHead && proxyHead.length) {
      socket.write(proxyHead);
    }
    
    socket.pipe(proxySocket).pipe(socket);
  });

  proxyReq.on('error', (err) => {
    console.error('WebSocket proxy upgrade error:', err);
    socket.destroy();
  });

  proxyReq.end();
}

const server = http.createServer(handleRequest);
server.on('upgrade', handleUpgrade);

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Development Server running at: http://127.0.0.1:${PROXY_PORT}/`);
  console.log(`======================================================\n`);
});

// Graceful cleanup
const cleanExit = () => {
  console.log('\nShutting down preview server...');
  previewProcess.kill('SIGINT');
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
