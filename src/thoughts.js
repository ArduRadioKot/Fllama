(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.splitThoughts = api.splitThoughts;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CLOSED_TAG = /<think>([\s\S]*?)<\/think>/gi;

  function mergeThought(a, b) {
    a = (a || '').trim();
    b = (b || '').trim();
    if (!a) return b;
    if (!b) return a;
    if (a === b || a.includes(b)) return a;
    if (b.includes(a)) return b;
    return a + '\n\n' + b;
  }

  // Хвост вроде "<thi" ещё не тег. Прячем его, чтобы сырой тег не мигал в ответе.
  function peelPartialTag(text) {
    const idx = text.lastIndexOf('<');
    if (idx < 0) return text;
    const tail = text.slice(idx);
    if (tail.includes('>')) return text;
    const low = tail.toLowerCase();
    if (low.startsWith('<think') || low.startsWith('</think') || low === '<' || low === '</' || /^<\/?t(?:h(?:i(?:n(?:k)?)?)?)?$/i.test(low)) {
      return text.slice(0, idx);
    }
    return text;
  }

  function splitThoughts(content, nativeThinking) {
    CLOSED_TAG.lastIndex = 0;
    let answer = peelPartialTag(String(content || ''));
    const pieces = [];
    answer = answer.replace(CLOSED_TAG, function (_, inner) {
      pieces.push(String(inner || '').trim());
      return '';
    });

    let thinkingOpen = false;
    const openMatch = answer.match(/<think>([\s\S]*)$/i);
    if (openMatch) {
      pieces.push(String(openMatch[1] || '').trim());
      answer = answer.slice(0, openMatch.index);
      thinkingOpen = true;
    }

    answer = answer.replace(/<\/think>/gi, '').trim();
    const fromTags = pieces.filter(Boolean).join('\n\n');
    const thinking = mergeThought(nativeThinking, fromTags);
    if (!thinking) thinkingOpen = false;
    return { thinking, answer, thinkingOpen };
  }

  return { splitThoughts };
});
