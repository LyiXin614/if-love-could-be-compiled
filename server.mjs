import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('.');
const port = Number(process.env.PORT || 5173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.md':'text/plain; charset=utf-8' };
http.createServer(async (req,res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(path);
    res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-store'}).end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).on('error',error=>{ console.error(error.code==='EADDRINUSE' ? `Port ${port} is in use. Close the earlier preview, or set PORT to another local port.` : error.message); process.exitCode=1; })
  .listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
