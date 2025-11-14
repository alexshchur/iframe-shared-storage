#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const host = args.host || '127.0.0.1';
const port = Number(args.port || 0) || 5000;
const rootFile = args.file || 'index.html';
const rootDir = path.resolve(process.cwd());

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, code, headers, body) {
  res.writeHead(code, headers);
  if (body && (typeof body === 'string' || Buffer.isBuffer(body))) {
    res.end(body);
  } else {
    res.end();
  }
}

function safeJoin(base, requestedPath) {
  const resolved = path.resolve(base, requestedPath);
  if (!resolved.startsWith(base)) {
    return null; // directory traversal attempt
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(u.pathname);

    // Root -> serve the specified root file
    if (pathname === '/' || pathname === '') {
      const filePath = safeJoin(rootDir, rootFile);
      if (!filePath) {
        return send(res, 400, { 'content-type': 'text/plain' }, 'Bad Request');
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          return send(res, 500, { 'content-type': 'text/plain' }, `Error reading ${rootFile}: ${err.message}`);
        }
        return send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, data);
      });
      return;
    }

    // Static files - allow serving anything under project root (e.g., /dist/browser.js)
    const fileOnDisk = safeJoin(rootDir, pathname.slice(1));
    if (!fileOnDisk) {
      return send(res, 400, { 'content-type': 'text/plain' }, 'Bad Request');
    }

    fs.stat(fileOnDisk, (err, stat) => {
      if (err) {
        return send(res, 404, { 'content-type': 'text/plain' }, 'Not Found');
      }
      let finalPath = fileOnDisk;
      if (stat.isDirectory()) {
        finalPath = path.join(fileOnDisk, 'index.html');
      }
      fs.readFile(finalPath, (err2, data) => {
        if (err2) {
          return send(res, 404, { 'content-type': 'text/plain' }, 'Not Found');
        }
        const ext = path.extname(finalPath).toLowerCase();
        const type = mime[ext] || 'application/octet-stream';
        return send(res, 200, { 'content-type': type }, data);
      });
    });
  } catch (e) {
    return send(res, 500, { 'content-type': 'text/plain' }, `Internal Server Error: ${e.message}`);
  }
});

server.listen(port, host, () => {
  console.log(`[server] Serving ${rootFile} at http://${host}:${port}`);
});
