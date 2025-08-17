#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const allowlistPath = path.join(projectRoot, 'public', 'answer-media', 'allowlist.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { domains: [] };
  for (const a of args) {
    if (a.startsWith('--domains=')) {
      out.domains = a.substring('--domains='.length).split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return out;
}

function normalize(dom) {
  return dom.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
}

function unique(arr) { return Array.from(new Set(arr)); }

function ensureFile(file) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
}

async function main() {
  const { domains } = parseArgs();
  if (!domains || domains.length === 0) {
    console.error('Gebruik: npm run allowlist:write -- --domains=unsplash.com,githubusercontent.com');
    process.exit(1);
  }
  const norm = unique(domains.map(normalize).filter(Boolean)).sort();
  ensureFile(allowlistPath);
  fs.writeFileSync(allowlistPath, JSON.stringify(norm, null, 2));
  console.log(`Allowlist geschreven (${norm.length}): ${allowlistPath}`);
}

main();

















