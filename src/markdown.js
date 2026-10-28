(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.renderMarkdown = api.renderMarkdown;
    root.escapeHtml = root.escapeHtml || api.escapeHtml;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[ch]);
  }

  function safeUrl(raw) {
    const url = String(raw || '').trim().replace(/^<|>$/g, '');
    if (!/^(https?:|mailto:)/i.test(url)) return '';
    if (/[\u0000-\u001f]/.test(url)) return '';
    return escapeHtml(url);
  }

  function isWord(ch) {
    return /[A-Za-z0-9]/.test(ch || '');
  }

  function parseLink(text, start) {
    if (text[start] !== '[') return null;
    let i = start + 1;
    let depth = 1;
    while (i < text.length && depth) {
      if (text[i] === '\\') {
        i += 2;
        continue;
      }
      if (text[i] === '[') depth += 1;
      else if (text[i] === ']') depth -= 1;
      if (depth) i += 1;
    }
    if (text[i] !== ']' || text[i + 1] !== '(') return null;
    const label = text.slice(start + 1, i);
    i += 2;
    const urlStart = i;
    while (i < text.length && text[i] !== ')') i += 1;
    if (text[i] !== ')') return null;
    const url = text.slice(urlStart, i).trim().replace(/^<([^>]+)>.*/, '$1').split(/\s+/)[0];
    return { text: label, url, end: i + 1 };
  }

  function findMarker(text, from, marker) {
    if (text[from] === ' ' || text[from] === '\n') return -1;
    let i = from;
    while (i < text.length) {
      const idx = text.indexOf(marker, i);
      if (idx === -1) return -1;
      if (text[idx - 1] !== ' ' && text[idx - 1] !== '\n' && idx > from) return idx;
      i = idx + marker.length;
    }
    return -1;
  }

  function renderInline(input) {
    const text = String(input);
    let i = 0;
    let html = '';
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\\' && i + 1 < text.length) {
        html += escapeHtml(text[i + 1]);
        i += 2;
        continue;
      }
      if (ch === '`') {
        let ticks = 1;
        while (text[i + ticks] === '`') ticks += 1;
        const closer = text.indexOf('`'.repeat(ticks), i + ticks);
        if (closer !== -1) {
          let code = text.slice(i + ticks, closer);
          code = code.replace(/^ ([^ ].*[^ ]) $/, '$1');
          html += '<code class="md-inline-code">' + escapeHtml(code) + '</code>';
          i = closer + ticks;
          continue;
        }
      }
      if (text.startsWith('![', i)) {
        const image = parseLink(text, i + 1);
        if (image) {
          const url = safeUrl(image.url);
          const alt = escapeHtml(image.text);
          html += url ? '<img class="md-image" alt="' + alt + '" src="' + url + '">' : alt;
          i = image.end;
          continue;
        }
      }
      if (ch === '[') {
        const link = parseLink(text, i);
        if (link) {
          const url = safeUrl(link.url);
          const label = renderInline(link.text);
          html += url ? '<a class="md-link" href="' + url + '">' + label + '</a>' : label;
          i = link.end;
          continue;
        }
      }
      if (text.startsWith('~~', i)) {
        const close = findMarker(text, i + 2, '~~');
        if (close !== -1) {
          html += '<del>' + renderInline(text.slice(i + 2, close)) + '</del>';
          i = close + 2;
          continue;
        }
      }
      if ((ch === '*' || ch === '_') && text[i + 1] === ch && text[i + 2] === ch) {
        const close = findMarker(text, i + 3, ch + ch + ch);
        if (close !== -1) {
          html += '<strong><em>' + renderInline(text.slice(i + 3, close)) + '</em></strong>';
          i = close + 3;
          continue;
        }
      }
      if ((ch === '*' || ch === '_') && text[i + 1] === ch) {
        const close = findMarker(text, i + 2, ch + ch);
        if (close !== -1) {
          html += '<strong>' + renderInline(text.slice(i + 2, close)) + '</strong>';
          i = close + 2;
          continue;
        }
      }
      if (ch === '*' || (ch === '_' && !isWord(text[i - 1]))) {
        const close = findMarker(text, i + 1, ch);
        if (close !== -1 && !(ch === '_' && isWord(text[close + 1]))) {
          html += '<em>' + renderInline(text.slice(i + 1, close)) + '</em>';
          i = close + 1;
          continue;
        }
      }
      const auto = text.slice(i).match(/^<(https?:\/\/[^\s<>]+)>/) || text.slice(i).match(/^(https?:\/\/[^\s<]+)/);
      if (auto && (text[i] === '<' || text[i] === 'h')) {
        let visible = auto[1];
        if (text[i] !== '<') visible = visible.replace(/[.,;:!?)]+$/, '');
        const url = safeUrl(visible);
        if (url) {
          html += '<a class="md-link" href="' + url + '">' + escapeHtml(visible) + '</a>';
          i += text[i] === '<' ? auto[0].length : visible.length;
          continue;
        }
      }
      html += escapeHtml(ch);
      i += 1;
    }
    return html;
  }

  function isHr(line) {
    return /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(line);
  }

  function isListLine(line) {
    return /^ {0,7}([-*+]|\d+[.)])[ \t]+/.test(line);
  }

  function looksLikeTable(line, next) {
    if (!next || !line.includes('|')) return false;
    const cells = splitRow(next);
    return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function splitRow(line) {
    let row = line.trim();
    if (row.startsWith('|')) row = row.slice(1);
    if (row.endsWith('|')) row = row.slice(0, -1);
    return row.split('|').map((cell) => cell.trim());
  }

  function alignment(cell) {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  }

  function startsBlock(lines, index) {
    const line = lines[index];
    if (!line || !line.trim()) return true;
    if (/^ {0,3}(```+|~~~+)/.test(line)) return true;
    if (/^ {0,3}#{1,6}[ \t]+/.test(line)) return true;
    if (isHr(line)) return true;
    if (/^ {0,3}>/.test(line)) return true;
    if (isListLine(line)) return true;
    if (looksLikeTable(line, lines[index + 1])) return true;
    return false;
  }

  const COPY_ICON = '<svg class="icon-copy" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.4"/><path d="M4 11H3.2A1.2 1.2 0 0 1 2 9.8V3.2A1.2 1.2 0 0 1 3.2 2H9.8A1.2 1.2 0 0 1 11 3.2V4" stroke="currentColor" stroke-width="1.4"/></svg>';
  const CHECK_ICON = '<svg class="icon-check" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderFence(lines, index) {
    const open = lines[index].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const marker = open[1][0];
    const width = open[1].length;
    const lang = (open[2] || '').trim().split(/\s+/)[0].replace(/[^A-Za-z0-9_+#.-]/g, '');
    const body = [];
    let i = index + 1;
    while (i < lines.length) {
      const close = lines[i].match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (close && close[1][0] === marker && close[1].length >= width) {
        i += 1;
        break;
      }
      body.push(lines[i]);
      i += 1;
    }
    const label = lang ? '<span class="md-code-lang">' + escapeHtml(lang) + '</span>' : '<span class="md-code-lang"></span>';
    const html = '<div class="md-code-outer"><div class="md-code-bar">' + label
      + '<button type="button" class="copy-code-btn" aria-label="Copy">' + COPY_ICON + CHECK_ICON + '</button></div>'
      + '<pre class="md-code-block"><code>' + escapeHtml(body.join('\n')) + '</code></pre></div>';
    return { html, index: i };
  }

  function renderTable(lines, index) {
    const header = splitRow(lines[index]);
    const align = splitRow(lines[index + 1]).map(alignment);
    const rows = [];
    let i = index + 2;
    while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
      rows.push(splitRow(lines[i]));
      i += 1;
    }
    const head = header.map((cell, n) => '<th style="text-align:' + (align[n] || 'left') + '">' + renderInline(cell) + '</th>').join('');
    const body = rows.map((row) => '<tr>' + header.map((_, n) => '<td style="text-align:' + (align[n] || 'left') + '">' + renderInline(row[n] || '') + '</td>').join('') + '</tr>').join('');
    return { html: '<table class="md-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>', index: i };
  }

  function renderList(lines, index, baseIndent) {
    const first = lines[index].match(/^(\s*)([-*+]|\d+[.)])[ \t]+(.*)$/);
    const ordered = /\d/.test(first[2]);
    const items = [];
    let i = index;
    while (i < lines.length) {
      if (!lines[i].trim()) break;
      const match = lines[i].match(/^(\s*)([-*+]|\d+[.)])[ \t]+(.*)$/);
      if (!match || match[1].length !== baseIndent || (/\d/.test(match[2]) !== ordered)) break;
      const task = match[3].match(/^\[([ xX])\][ \t]+(.*)$/);
      const content = [task ? task[2] : match[3]];
      const checked = task ? task[1].toLowerCase() === 'x' : null;
      i += 1;
      const nested = [];
      while (i < lines.length) {
        if (!lines[i].trim()) {
          if (lines[i + 1] && /^\s+/.test(lines[i + 1]) && !isListLine(lines[i + 1].replace(/^\s{0,0}/, ''))) break;
          break;
        }
        const indent = lines[i].match(/^\s*/)[0].length;
        if (indent <= baseIndent) break;
        nested.push(lines[i]);
        i += 1;
      }
      let inner = renderInline(content[0]);
      if (nested.length) inner += renderBlocks(nested.map((line) => line.replace(new RegExp('^ {0,' + (baseIndent + 2) + '}'), '')));
      items.push(checked === null
        ? '<li>' + inner + '</li>'
        : '<li class="md-task"><input type="checkbox" disabled' + (checked ? ' checked' : '') + '>' + inner + '</li>');
    }
    const tag = ordered ? 'ol' : 'ul';
    return { html: '<' + tag + ' class="md-list">' + items.join('') + '</' + tag + '>', index: i };
  }

  function renderBlocks(lines) {
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const start = i;
      const line = lines[i];
      if (!line.trim()) {
        i += 1;
        continue;
      }
      if (/^ {0,3}(`{3,}|~{3,})/.test(line)) {
        const fence = renderFence(lines, i);
        out.push(fence.html);
        i = fence.index;
        continue;
      }
      const heading = line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/);
      if (heading) {
        const level = heading[1].length;
        out.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
        i += 1;
        continue;
      }
      if (i + 1 < lines.length && /^ {0,3}(=+|-+)[ \t]*$/.test(lines[i + 1]) && !startsBlock(lines, i)) {
        const level = lines[i + 1].trim().startsWith('=') ? 1 : 2;
        out.push('<h' + level + '>' + renderInline(line.trim()) + '</h' + level + '>');
        i += 2;
        continue;
      }
      if (isHr(line)) {
        out.push('<hr class="md-hr">');
        i += 1;
        continue;
      }
      if (/^ {0,3}>/.test(line)) {
        const quoted = [];
        while (i < lines.length && /^ {0,3}>/.test(lines[i])) {
          quoted.push(lines[i].replace(/^ {0,3}>[ \t]?/, ''));
          i += 1;
        }
        out.push('<blockquote class="md-quote">' + renderBlocks(quoted) + '</blockquote>');
        continue;
      }
      if (looksLikeTable(line, lines[i + 1])) {
        const table = renderTable(lines, i);
        out.push(table.html);
        i = table.index;
        continue;
      }
      if (isListLine(line)) {
        const indent = line.match(/^\s*/)[0].length;
        const list = renderList(lines, i, indent);
        out.push(list.html);
        i = list.index;
        continue;
      }
      const para = [];
      while (i < lines.length && !startsBlock(lines, i)) {
        para.push(lines[i]);
        i += 1;
      }
      out.push('<p>' + para.map((part) => renderInline(part)).join('<br>') + '</p>');
      if (i === start) i += 1;
    }
    return out.join('');
  }

  function renderMarkdown(source) {
    const text = String(source || '').replace(/\r\n?/g, '\n');
    if (!text.trim()) return '';
    return '<div class="md">' + renderBlocks(text.split('\n')) + '</div>';
  }

  return { renderMarkdown, escapeHtml };
});
