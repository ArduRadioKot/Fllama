const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
const MAX_READ = 200000;
const MAX_WRITE = 500000;
const MAX_FETCH = 120000;

const TOOLS = [
  {
    name: 'list_dir',
    description: 'List files and folders inside the project. Path is relative to the project root.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: [] },
  },
  {
    name: 'read_file',
    description: 'Read a text file inside the project.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a text file inside the project.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_path',
    description: 'Delete a file or folder inside the project. Cannot delete the project root.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'search',
    description: 'Search file names and text inside the project.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'fetch_url',
    description: 'Fetch a public http or https page and return readable text.',
    parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
  },
];

function assertInside(root, target) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Путь вне папки проекта');
  }
}

function resolveInside(root, inputPath) {
  const base = fs.realpathSync(root);
  const requested = path.resolve(base, inputPath && inputPath !== '.' ? inputPath : '.');
  if (fs.existsSync(requested)) {
    const real = fs.realpathSync(requested);
    assertInside(base, real);
    return real;
  }
  const missing = [];
  let cursor = requested;
  while (!fs.existsSync(cursor)) {
    missing.push(path.basename(cursor));
    const parent = path.dirname(cursor);
    if (parent === cursor) throw new Error('Путь вне папки проекта');
    cursor = parent;
  }
  const realParent = fs.realpathSync(cursor);
  assertInside(base, realParent);
  const rebuilt = path.join(realParent, ...missing.reverse());
  assertInside(base, rebuilt);
  return rebuilt;
}

function relativeTo(root, target) {
  const base = fs.realpathSync(root);
  const rel = path.relative(base, target);
  return rel || '.';
}

function listDirectory(root, inputPath) {
  const dir = resolveInside(root, inputPath || '.');
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) throw new Error('Это не папка');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !SKIP_DIRS.has(entry.name))
    .slice(0, 200)
    .map((entry) => ({
      name: entry.name,
      path: path.join(inputPath && inputPath !== '.' ? inputPath : '', entry.name),
      type: entry.isDirectory() ? 'dir' : 'file',
    }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'dir' ? -1 : 1)));
}

function readFile(root, inputPath) {
  const file = resolveInside(root, inputPath);
  const stat = fs.statSync(file);
  if (!stat.isFile()) throw new Error('Это не файл');
  if (stat.size > MAX_READ) throw new Error('Файл слишком большой');
  const buf = fs.readFileSync(file);
  if (buf.includes(0)) throw new Error('Бинарный файл');
  return buf.toString('utf8');
}

function writeFile(root, inputPath, content) {
  const text = String(content ?? '');
  if (Buffer.byteLength(text) > MAX_WRITE) throw new Error('Слишком большой текст');
  const file = resolveInside(root, inputPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return relativeTo(root, file);
}

function deletePath(root, inputPath) {
  const base = fs.realpathSync(root);
  const target = resolveInside(root, inputPath);
  if (target === base) throw new Error('Нельзя удалить корень проекта');
  fs.rmSync(target, { recursive: true, force: false });
  return relativeTo(root, target);
}

function searchProject(root, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) throw new Error('Пустой запрос');
  const hits = [];
  const base = fs.realpathSync(root);
  function walk(dir, depth) {
    if (hits.length >= 40 || depth > 6) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (hits.length >= 40) return;
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.isFile()) {
        const rel = path.relative(base, full);
        if (entry.name.toLowerCase().includes(needle)) hits.push(rel);
        else if (hits.length < 40) {
          try {
            const stat = fs.statSync(full);
            if (stat.size > 300000) continue;
            const text = fs.readFileSync(full, 'utf8');
            if (text.includes('\u0000')) continue;
            const lines = text.split(/\r?\n/);
            for (let i = 0; i < lines.length && hits.length < 40; i += 1) {
              if (lines[i].toLowerCase().includes(needle)) hits.push(`${rel}:${i + 1}: ${lines[i].trim().slice(0, 180)}`);
            }
          } catch {
            // skip unreadable files
          }
        }
      }
    }
  }
  walk(base, 0);
  return hits.join('\n') || 'Ничего не найдено';
}

function blockedHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === '169.254.169.254' || host === 'metadata.google.internal';
}

function fetchUrl(rawUrl) {
  return fetchUrlOnce(rawUrl, 0);
}

function fetchUrlOnce(rawUrl, redirects) {
  let url;
  try { url = new URL(rawUrl); } catch { return Promise.reject(new Error('Некорректный адрес')); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return Promise.reject(new Error('Можно открывать только http и https'));
  }
  if (blockedHost(url.hostname)) return Promise.reject(new Error('Этот адрес закрыт'));
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, { method: 'GET', timeout: 15000, headers: { 'User-Agent': 'Fllama', Accept: 'text/html,text/plain,*/*' } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode || 0) && res.headers.location && redirects < 3) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        fetchUrlOnce(next, redirects + 1).then(resolve, reject);
        return;
      }
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size <= MAX_FETCH) chunks.push(chunk);
      });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const text = htmlToText(body).slice(0, 12000);
        resolve(`HTTP ${res.statusCode}\n${text}`);
      });
    });
    req.on('timeout', () => req.destroy(new Error('Таймаут')));
    req.on('error', reject);
    req.end();
  });
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArgs(raw) {
  if (raw && typeof raw === 'object') return raw;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

async function executeTool(root, call) {
  const args = parseArgs(call.arguments);
  const name = call.name;
  if (name === 'list_dir') {
    const items = listDirectory(root, args.path || '.');
    return items.map((item) => `${item.type === 'dir' ? 'dir' : 'file'} ${item.path}`).join('\n') || 'Пусто';
  }
  if (name === 'read_file') return readFile(root, args.path);
  if (name === 'write_file') return 'Записан ' + writeFile(root, args.path, args.content);
  if (name === 'delete_path') return 'Удалён ' + deletePath(root, args.path);
  if (name === 'search') return searchProject(root, args.query);
  if (name === 'fetch_url') return fetchUrl(args.url);
  throw new Error('Неизвестный инструмент ' + name);
}

function takeToolCall(text) {
  const match = String(text || '').match(/<tool>\s*([\s\S]*?)\s*<\/tool>/i);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (!parsed || !parsed.name) return null;
    return {
      call: {
        id: 'call_text',
        name: String(parsed.name),
        arguments: JSON.stringify(parsed.arguments || {}),
      },
      answer: text.replace(match[0], '').trim(),
    };
  } catch {
    return null;
  }
}

module.exports = {
  TOOLS,
  resolveInside,
  listDirectory,
  executeTool,
  takeToolCall,
  htmlToText,
};
