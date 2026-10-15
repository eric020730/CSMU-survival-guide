import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const prefix = '/CSMU-survival-guide/';
const root = resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/' || url.pathname === prefix.slice(0,-1)) { res.writeHead(302,{Location:prefix}); res.end(); return; }
  if (!url.pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
  const file = resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html');
  if (!file.startsWith(root + '/')) { res.writeHead(404); res.end(); return; }
  try { const body = await readFile(file); res.writeHead(200,{'Content-Type':types[extname(file)] ?? 'application/octet-stream','Cache-Control':'no-store'}); res.end(body); }
  catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173,'127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173/CSMU-survival-guide/'));
