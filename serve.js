const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.js':'text/javascript','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.webmanifest':'application/manifest+json'};
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!f.startsWith(root)){s.writeHead(403);return s.end()}
fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('not found')}s.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});s.end(d)})}).listen(+process.argv[2]||8765,'127.0.0.1');
