#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
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

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// Extract all URLs from Antwoordsleutels by parsing public/opdrachten.xlsx via a simple regexp on built json cache (fallback: scan src for seed examples)
// Simpler approach: scan src for Antwoordsleutel occurrences and collect literals/strings that look like URLs.

const URL_REGEX = /(https?:\/\/[^\s)"'`]+)(?=[\s)"'`]|$)/gi;

function extractUrlsFromText(text) {
  const out = new Set();
  (text || '').replace(URL_REGEX, (m) => { out.add(m); return m; });
  // Filter placeholders uit code (template strings)
  return Array.from(out).filter((u) => !u.includes('${'));
}

function collectUrls() {
  const srcDir = path.join(projectRoot, 'src');
  const files = walkDir(srcDir).filter((p) => p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.md'));
  const urls = new Set();
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    extractUrlsFromText(content).forEach((u) => urls.add(u));
  }
  // Scan ook public/opdrachten.xlsx voor echte data
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
  return Array.from(urls);
}

function head(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.request(url, { method: 'HEAD', timeout: timeoutMs }, (res) => {
        resolve({ ok: res.statusCode && res.statusCode < 400, status: res.statusCode, headers: res.headers });
      });
      req.on('error', () => resolve({ ok: false, status: 0 }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
      req.end();
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

function get(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, { timeout: timeoutMs }, (res) => {
        resolve({ ok: res.statusCode && res.statusCode < 400, status: res.statusCode, headers: res.headers });
        res.resume();
      });
      req.on('error', () => resolve({ ok: false, status: 0 }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0 }); });
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

async function main() {
  const urls = collectUrls();
  console.log(`Found ${urls.length} URLs (heuristic scan).`);
  const results = [];
  for (const u of urls) {
    let res = await head(u);
    if (!res.ok || res.status === 405) {
      // fallback naar GET voor servers die HEAD blokkeren
      res = await get(u);
    }
    results.push({ url: u, ...res });
    const statusText = res.ok ? 'OK' : `FAIL(${res.status})`;
    console.log(`${statusText} ${u}`);
  }
  const outDir = path.join(projectRoot, 'tmp');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'link-check-report.json'), JSON.stringify(results, null, 2));
  console.log(`Report written to tmp/link-check-report.json`);
}

main();


