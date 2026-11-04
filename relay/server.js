// Apex Riviera Real Racing — online race relay
// A tiny WebSocket server: players join rooms by code and every message is passed on to the rest of the room.
// Run locally:  npm install && npm start      (listens on PORT, default 8787)
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8787;
const MAX_ROOM = 20;            // drivers per room
const MAX_MSG = 48 * 1024;      // bytes per message
const RATE = 40;                // messages per second per player (burst)
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const rooms = new Map();        // code -> { code, clients: Map(id -> ws), created }

const newCode = () => { let c; do { c = Array.from({ length: 5 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join(''); } while (rooms.has(c)); return c; };
const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const racing = room => [...room.clients.values()].some(c => c.pres && c.pres.st === 'race');
const makeRoom = () => { const room = { code: newCode(), clients: new Map(), created: Date.now() }; rooms.set(room.code, room); return room; };

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    let players = 0; for (const r of rooms.values()) players += r.clients.size;
    res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
    res.end(`apex-riviera relay ok · ${rooms.size} rooms · ${players} players\n`);
  } else { res.writeHead(404); res.end(); }
});

const wss = new WebSocketServer({ server, maxPayload: MAX_MSG });
let seq = 1;

wss.on('connection', ws => {
  ws.id = 'u' + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
  ws.room = null; ws.pres = {}; ws.alive = true; ws.tokens = RATE; ws.lastRefill = Date.now();
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', data => {
    const now = Date.now(); ws.tokens = Math.min(RATE, ws.tokens + (now - ws.lastRefill) / 1000 * RATE); ws.lastRefill = now;
    if (ws.tokens < 1) return; ws.tokens -= 1;
    let m; try { m = JSON.parse(data); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.t === 'ping') return send(ws, { t: 'pong', c: m.c });
    if (m.t === 'hello' && !ws.room) {
      const code = String(m.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      let room = null, host = false;
      if (m.mode === 'host') { room = makeRoom(); host = true; }
      else if (m.mode === 'join') {
        room = rooms.get(code);
        if (!room) return send(ws, { t: 'err', msg: 'No room with that code. Check it with the host.' });
        if (room.clients.size >= MAX_ROOM) return send(ws, { t: 'err', msg: 'That room is full (20 drivers).' });
      } else if (m.mode === 'quick') {
        room = [...rooms.values()].filter(r => r.clients.size > 0 && r.clients.size < MAX_ROOM && !racing(r)).sort((a, b) => b.clients.size - a.clients.size)[0];
        if (!room) { room = makeRoom(); host = true; }
      } else return;
      ws.room = room; room.clients.set(ws.id, ws);
      send(ws, { t: 'welcome', id: ws.id, code: room.code, host, peers: [...room.clients.values()].filter(c => c !== ws).map(c => [c.id, c.pres]) });
      return;
    }
    if (m.t === 'p' && ws.room && m.p && typeof m.p === 'object' && !Array.isArray(m.p)) {
      ws.pres = m.p;
      const out = JSON.stringify({ t: 'p', id: ws.id, p: m.p });
      for (const c of ws.room.clients.values()) if (c !== ws && c.readyState === 1 && c.bufferedAmount < 1 << 20) c.send(out);
    }
  });
  ws.on('close', () => {
    const room = ws.room; if (!room) return;
    room.clients.delete(ws.id);
    const out = JSON.stringify({ t: 'leave', id: ws.id });
    for (const c of room.clients.values()) if (c.readyState === 1) c.send(out);
    if (!room.clients.size) rooms.delete(room.code);
  });
});

// drop dead connections
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; try { ws.ping(); } catch (e) { } } }, 25000);

server.listen(PORT, () => console.log(`Apex Riviera relay listening on :${PORT}`));
