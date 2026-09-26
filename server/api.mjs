import { createServer } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const digest = token => createHash('sha256').update(token).digest('hex');
const validEmail = v => typeof v === 'string' && v.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validVenue = v => v && typeof v.name === 'string' && v.name.trim().length > 0 && v.name.length <= 200 && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180;

export function createApi({ database = ':memory:', sessionMs = 60 * 60 * 1000 } = {}) {
  const db = new DatabaseSync(database);
  db.exec(`CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS trips(id TEXT PRIMARY KEY, email TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS profiles(email TEXT PRIMARY KEY, data TEXT NOT NULL);`);
  const attempts = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Demo API, bearer auth, no cookies.
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    if (req.method === 'OPTIONS') return send(204, null);
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      let body = {};
      if (req.method === 'POST' || req.method === 'PUT') {
        let size = 0; const chunks = [];
        for await (const chunk of req) { size += chunk.length; if (size > 3_000_000) fail(413, 'ไฟล์หรือข้อมูลใหญ่เกินไป'); chunks.push(chunk); }
        try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { fail(400, 'JSON ไม่ถูกต้อง'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'ต้องส่ง JSON object');
      }
      if (path === '/health') return send(200, { ok: true });
      if ((path === '/auth/register' || path === '/auth/login') && req.method === 'POST') {
        const address = req.socket.remoteAddress;
        const now = Date.now(); const attempt = attempts.get(address) ?? { count: 0, reset: now + 60000 };
        if (attempt.reset < now) { attempt.count = 0; attempt.reset = now + 60000; }
        attempt.count++; attempts.set(address, attempt);
        if (attempt.count > 20) fail(429, 'ลองเข้าสู่ระบบใหม่ใน 1 นาที');
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!validEmail(email) || typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) fail(400, 'ตรวจอีเมลและรหัสผ่าน 8–128 ตัวอักษร');
        let user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if (path === '/auth/register') {
          if (user) fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ');
          const salt = randomBytes(16).toString('hex');
          db.prepare('INSERT INTO users VALUES (?,?,?)').run(email, salt, scryptSync(body.password, salt, 64).toString('hex'));
          user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        }
        if (!user || !timingSafeEqual(Buffer.from(user.hash, 'hex'), scryptSync(body.password, user.salt, 64))) fail(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        const token = randomBytes(32).toString('hex'); const expiresAt = Date.now() + sessionMs;
        db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token), email, expiresAt);
        return send(200, { token, expiresAt, email });
      }
      const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
      const session = db.prepare('SELECT * FROM sessions WHERE hash=?').get(digest(token));
      if (!session || session.expires <= Date.now()) fail(401, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      if (path === '/auth/me' && req.method === 'GET') return send(200, { email: session.email, expiresAt: session.expires });
      if (path === '/profile' && req.method === 'GET') {
        const saved = db.prepare('SELECT data FROM profiles WHERE email=?').get(session.email);
        return send(200, saved ? JSON.parse(saved.data) : { name: 'นักเก็บความทรงจำ', bio: '', photo: null });
      }
      if (path === '/profile' && req.method === 'PUT') {
        if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 60 || typeof body.bio !== 'string' || body.bio.length > 300) fail(400, 'กรอกชื่อไม่เกิน 60 ตัวอักษร และแนะนำตัวไม่เกิน 300 ตัวอักษร');
        if (body.photo !== null) {
          if (typeof body.photo !== 'string' || body.photo.length > 700_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(body.photo)) fail(400, 'รูปโปรไฟล์ต้องเป็น JPEG ขนาดไม่เกิน 500 KB');
          const bytes = Buffer.from(body.photo.split(',')[1], 'base64');
          if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) fail(400, 'เนื้อหาไฟล์ไม่ใช่ JPEG');
        }
        const profile = { name: body.name.trim(), bio: body.bio.trim(), photo: body.photo };
        db.prepare('INSERT INTO profiles VALUES (?,?) ON CONFLICT(email) DO UPDATE SET data=excluded.data').run(session.email, JSON.stringify(profile));
        return send(200, profile);
      }
      if (path === '/auth/logout' && req.method === 'POST') { db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(token)); return send(200, { ok: true }); }
      if (path === '/trips' && req.method === 'GET') return send(200, db.prepare("SELECT data FROM trips WHERE email=? ORDER BY json_extract(data, '$.date') DESC").all(session.email).map(r => JSON.parse(r.data)));
      if (path.startsWith('/trips/')) {
        const id = path.slice(7);
        if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) fail(400, 'รหัสทริปไม่ถูกต้อง');
        const previous = db.prepare('SELECT * FROM trips WHERE id=?').get(id);
        if (previous && previous.email !== session.email) fail(404, 'ไม่พบทริป');
        if (req.method === 'DELETE') {
          db.prepare('DELETE FROM trips WHERE id=? AND email=?').run(id, session.email);
          return send(200, { ok: true });
        }
        if (req.method === 'PUT') {
          if (body.id !== id || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 100 || typeof body.note !== 'string' || body.note.length > 4000 || typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !Number.isFinite(Date.parse(body.date)) || new Date(body.date).toISOString().slice(0,10) !== body.date || !validVenue(body.location) || typeof body.favorite !== 'boolean') fail(400, 'ตรวจชื่อทริป วันที่ และพิกัด');
          if (body.photo !== null) {
            if (typeof body.photo !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(body.photo) || body.photo.length > 2_800_000) fail(400, 'รองรับภาพ JPEG ไม่เกิน 2 MB');
            const bytes = Buffer.from(body.photo.split(',')[1], 'base64');
            if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) fail(400, 'เนื้อหาไฟล์ไม่ใช่ JPEG');
          }
          const now = new Date().toISOString();
          const trip = { id, title: body.title.trim(), note: body.note.trim(), date: body.date, location: body.location, photo: body.photo, favorite: body.favorite, createdAt: previous ? JSON.parse(previous.data).createdAt : now, updatedAt: now };
          db.prepare('INSERT INTO trips VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(id, session.email, JSON.stringify(trip));
          return send(previous ? 200 : 201, trip);
        }
      }
      fail(404, 'ไม่พบเส้นทาง API');
    } catch (error) { send(error.status ?? 500, { message: error.status ? error.message : 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' }); }
  });
  server.on('close', () => db.close());
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const folder = join(dirname(fileURLToPath(import.meta.url)), '.data'); mkdirSync(folder, { recursive: true });
  const port = Number(process.env.PORT || 3002);
  createApi({ database: join(folder, 'travel-diary.sqlite'), sessionMs: Number(process.env.SESSION_SECONDS || 3600) * 1000 }).listen(port, '0.0.0.0', () => console.log(`TravelDiary API ready on port ${port}`));
}
