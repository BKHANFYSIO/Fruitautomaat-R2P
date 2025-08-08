#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const mediaDir = path.join(publicDir, 'answer-media');
const manifestPath = path.join(mediaDir, 'manifest.json');

const URL_REGEX = /(https?:\/\/[^\s)"'`]+)(?=[\s)"'`]|$)/gi;

function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }
function writeJson(file, obj) { fs.writeFileSync(file, JSON.stringify(obj, null, 2)); }

function extractUrlsFromText(text) {
  const out = new Set();
  (text || '').replace(URL_REGEX, (m) => { out.add(m); return m; });
  return Array.from(out);
}

function walkDir(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, acc);
    else acc.push(p);
  }
  return acc;
}

function collectUrls() {
  const srcDir = path.join(projectRoot, 'src');
  const files = walkDir(srcDir).filter((p) => p.endsWith('.ts') || p.endsWith('.tsx'));
  const urls = new Set();
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    extractUrlsFromText(c).forEach((u) => urls.add(u));
  }
  // probeer ook public/opdrachten.xlsx te lezen
  const excelPath = path.join(publicDir, 'opdrachten.xlsx');
  if (fs.existsSync(excelPath)) {
    try {
      const wb = xlsx.read(fs.readFileSync(excelPath));
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(ws);
      for (const row of rows) {
        const ans = row.Antwoordsleutel || row.antwoord || '';
        extractUrlsFromText(String(ans)).forEach((u) => urls.add(u));
      }
    } catch {}
  }
  return Array.from(urls).filter((u) => !u.includes('${'));
}

function isImageUrl(u) {
  try {
    const ur = new URL(u);
    return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(ur.pathname);
  } catch { return false; }
}

function getSite(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'onbekend'; } }

function isYouTube(u) { try { const h = new URL(u).hostname.replace(/^www\./, ''); return ['youtube.com','m.youtube.com','youtube-nocookie.com','youtu.be'].includes(h); } catch { return false; } }
function isVimeo(u) { try { const h = new URL(u).hostname.replace(/^www\./, ''); return ['vimeo.com','player.vimeo.com'].includes(h); } catch { return false; } }

function httpGetJson(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      if ((res.statusCode || 0) >= 400) { reject(new Error('HTTP ' + res.statusCode)); return; }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { allowlist: null, revalidate: false, cleanupDays: null };
  for (const a of args) {
    if (a.startsWith('--allowlist=')) {
      opts.allowlist = a.substring('--allowlist='.length).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } else if (a === '--revalidate') {
      opts.revalidate = true;
    } else if (a.startsWith('--cleanup=')) {
      const n = parseInt(a.substring('--cleanup='.length), 10);
      if (!Number.isNaN(n)) opts.cleanupDays = n;
    }
  }
  return opts;
}

function download(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, { timeout: timeoutMs }, (res) => {
        if ((res.statusCode || 0) >= 400) { reject(new Error('HTTP ' + res.statusCode)); return; }
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), headers: res.headers }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    } catch (e) { reject(e); }
  });
}

async function main() {
  fs.mkdirSync(mediaDir, { recursive: true });
  const manifest = readJson(manifestPath);
  const allUrls = collectUrls();
  const imageUrls = allUrls.filter(isImageUrl);
  const videoUrls = allUrls.filter((u) => isYouTube(u) || isVimeo(u));
  const now = new Date().toISOString();
  const opts = parseArgs();
  const seen = new Set(allUrls);

  // Process images
  for (const u of imageUrls) {
    const host = getSite(u);
    if (opts.allowlist && !opts.allowlist.some((d) => host.endsWith(d))) {
      console.log(`Skip (not in allowlist): ${u}`);
      continue;
    }
    const entry = manifest[u] || { originalUrl: u, meta: { site: host, kind: 'image' } };
    try {
      if (opts.revalidate && entry.etag) {
        // Simple re-download strategy; proper conditional requests can be added later
      }
      const { buffer, headers } = await download(u);
      const hash = crypto.createHash('sha1').update(buffer).digest('hex');
      const extMatch = u.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
      const fileName = `${hash}.${ext}`;
      const filePath = path.join(mediaDir, fileName);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, buffer);
      }
      entry.localPath = `/answer-media/${fileName}`;
      entry.contentHash = hash;
      if (headers.etag) entry.etag = String(headers.etag);
      if (headers['last-modified']) entry.lastModified = String(headers['last-modified']);
      entry.status = 'ok';
      entry.lastChecked = now;
      entry.lastSeen = now;
      manifest[u] = entry;
      console.log(`Cached: ${u} -> ${fileName}`);
    } catch (e) {
      entry.status = 'error';
      entry.lastChecked = now;
      entry.lastSeen = now;
      manifest[u] = entry;
      console.warn(`Failed: ${u} (${e.message})`);
    }
  }

  // Process video metadata (no download)
  for (const u of videoUrls) {
    const host = getSite(u);
    const entry = manifest[u] || { originalUrl: u, meta: { site: host, kind: isYouTube(u) ? 'youtube' : 'vimeo' } };
    try {
      let oembedUrl = null;
      if (isYouTube(u)) oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`;
      if (isVimeo(u)) oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`;
      if (oembedUrl) {
        const data = await httpGetJson(oembedUrl);
        entry.meta = entry.meta || {};
        entry.meta.site = host;
        entry.meta.kind = isYouTube(u) ? 'youtube' : 'vimeo';
        entry.meta.title = data.title || entry.meta.title;
        entry.meta.author = data.author_name || entry.meta.author;
        entry.status = 'ok';
        entry.lastChecked = now;
        entry.lastSeen = now;
        manifest[u] = entry;
        console.log(`Meta: ${u} -> ${entry.meta.title || ''}`);
      }
    } catch (e) {
      entry.status = 'error';
      entry.lastChecked = now;
      entry.lastSeen = now;
      manifest[u] = entry;
      console.warn(`Meta failed: ${u} (${e.message})`);
    }
  }

  // Mark seen for non-media links
  for (const u of allUrls) {
    if (manifest[u]) {
      manifest[u].lastSeen = now;
    }
  }

  // Cleanup old entries/files
  if (opts.cleanupDays != null) {
    const cutoff = Date.now() - opts.cleanupDays * 24 * 60 * 60 * 1000;
    const allEntries = Object.entries(manifest);
    for (const [url, entry] of allEntries) {
      const lastSeen = entry.lastSeen ? Date.parse(entry.lastSeen) : 0;
      if (!seen.has(url) && lastSeen && lastSeen < cutoff) {
        // remove file if not referenced by others
        const filePath = entry.localPath && entry.localPath.startsWith('/answer-media/')
          ? path.join(publicDir, entry.localPath.replace('/', path.sep))
          : null;
        if (filePath && fs.existsSync(filePath)) {
          const usedElsewhere = Object.values(manifest).some((e) => e !== entry && e.localPath === entry.localPath);
          if (!usedElsewhere) {
            try { fs.unlinkSync(filePath); } catch {}
          }
        }
        delete manifest[url];
        console.log(`Cleaned: ${url}`);
      }
    }
  }

  writeJson(manifestPath, manifest);
  console.log(`Manifest updated: ${manifestPath}`);
}

main();


