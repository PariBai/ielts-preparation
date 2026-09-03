'use strict';

/* Multi-user auth with signed session cookies.
   No dependencies: HMAC signing and scrypt hashing both come from node:crypto.

   Accounts are declared in .env, never self-registered, because the app sits
   behind a public tunnel:
     USERS=pari:secret1,ali:secret2,sara:secret3
   A single AUTH_USERNAME / AUTH_PASSWORD pair still works and is merged in. */

const crypto = require('crypto');
const fsp = require('fs/promises');
const path = require('path');

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);
const COOKIE = 'ielts_session';

/* Brute-force throttle: per-IP attempt budget over a rolling window. */
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

let SECRET = null;
let enabled = false;

/* username -> { salt, hash } */
const users = new Map();

/* Usernames become filenames, so keep them boring. */
const VALID_NAME = /^[a-z0-9][a-z0-9._-]{0,31}$/i;

function addUser(name, password) {
  const clean = String(name || '').trim();
  if (!clean || !password) return;
  if (!VALID_NAME.test(clean)) {
    console.warn(`[auth] ignoring user "${clean}": names must be letters, digits, dot, dash or underscore`);
    return;
  }
  const key = clean.toLowerCase();
  if (users.has(key)) {
    console.warn(`[auth] duplicate user "${clean}" ignored`);
    return;
  }
  const salt = crypto.randomBytes(16);
  users.set(key, { name: clean, salt, hash: crypto.scryptSync(String(password), salt, 64) });
}

async function init(dataDir) {
  users.clear();

  for (const pair of String(process.env.USERS || '').split(',')) {
    if (!pair.trim()) continue;
    const idx = pair.indexOf(':');
    if (idx < 1) {
      console.warn(`[auth] skipping malformed USERS entry: ${pair.trim()}`);
      continue;
    }
    addUser(pair.slice(0, idx), pair.slice(idx + 1));
  }

  if (process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) {
    addUser(process.env.AUTH_USERNAME, process.env.AUTH_PASSWORD);
  }

  if (users.size === 0) {
    enabled = false;
    console.warn('[auth] no accounts configured — the app is UNPROTECTED.');
    return false;
  }

  /* Persist the signing key so a restart does not log everyone out. */
  const keyFile = path.join(dataDir, 'session.key');
  try {
    SECRET = await fsp.readFile(keyFile);
    if (SECRET.length < 32) throw new Error('short key');
  } catch (_) {
    SECRET = crypto.randomBytes(32);
    await fsp.writeFile(keyFile, SECRET, { mode: 0o600 });
  }

  enabled = true;
  console.log(`[auth] ${users.size} account(s): ${[...users.values()].map((u) => u.name).join(', ')} (sessions last ${SESSION_DAYS} days)`);
  return true;
}

function isEnabled() {
  return enabled;
}

function listUsers() {
  return [...users.values()].map((u) => u.name);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    /* An account removed from .env must lose its existing sessions too. */
    if (!users.has(String(payload.u || '').toLowerCase())) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

/* Returns the canonical username on success, null otherwise. */
function checkCredentials(username, password) {
  if (!enabled) return null;
  if (typeof username !== 'string' || typeof password !== 'string') return null;

  const rec = users.get(username.trim().toLowerCase());

  /* Hash even when the user does not exist, so a bad username and a bad
     password take the same time and cannot be told apart. */
  const salt = rec ? rec.salt : Buffer.alloc(16);
  const given = crypto.scryptSync(password, salt, 64);
  if (!rec) return null;

  return crypto.timingSafeEqual(given, rec.hash) ? rec.name : null;
}

function clientIp(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function throttle(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return { blocked: false, retryIn: 0 };
  }
  if (rec.count >= MAX_ATTEMPTS) {
    return { blocked: true, retryIn: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { blocked: false, retryIn: 0 };
}

function recordFailure(req) {
  const rec = attempts.get(clientIp(req));
  if (rec) rec.count++;
}

function clearFailures(req) {
  attempts.delete(clientIp(req));
}

/* Only mark the cookie Secure when the request actually arrived over HTTPS,
   otherwise it would be dropped when testing on plain http://localhost. */
function isSecure(req) {
  return req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

function setSession(req, res, username) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const token = sign({ u: String(username).toLowerCase(), exp });
  const bits = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 86400}`,
  ];
  if (isSecure(req)) bits.push('Secure');
  res.setHeader('Set-Cookie', bits.join('; '));
}

function clearSession(req, res) {
  const bits = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecure(req)) bits.push('Secure');
  res.setHeader('Set-Cookie', bits.join('; '));
}

/* The storage key for whoever is making this request. */
function currentUser(req) {
  if (!enabled) return 'default';
  const payload = verify(parseCookies(req)[COOKIE]);
  return payload ? String(payload.u).toLowerCase() : null;
}

function displayName(key) {
  const rec = users.get(String(key || '').toLowerCase());
  return rec ? rec.name : key;
}

function isLoggedIn(req) {
  return currentUser(req) !== null;
}

/* Paths reachable without a session. Everything else is gated. */
const PUBLIC_PATHS = new Set(['/login', '/login.html', '/healthz', '/api/login', '/favicon.ico']);

function gate(req, res, next) {
  if (!enabled) {
    req.user = 'default';
    return next();
  }
  if (PUBLIC_PATHS.has(req.path)) return next();

  const user = currentUser(req);
  if (user) {
    req.user = user;
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'not authenticated' });
  }
  return res.redirect(302, '/login.html');
}

module.exports = {
  init,
  isEnabled,
  gate,
  isLoggedIn,
  currentUser,
  displayName,
  listUsers,
  checkCredentials,
  setSession,
  clearSession,
  throttle,
  recordFailure,
  clearFailures,
  SESSION_DAYS,
};
