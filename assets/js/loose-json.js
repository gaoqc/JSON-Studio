/*
  loose-json.js
  Best-effort conversion from common key=value text into a JSON object.
*/

(function () {
  const $ = TK.$;

  const SAMPLE = 'id= 1001,name=zhangsan,age=25';

  function splitPairs(text) {
    const parts = [];
    let buf = '';
    let quote = '';
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (quote) {
        buf += ch;
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === quote) quote = '';
        continue;
      }

      if (ch === '"' || ch === "'") {
        quote = ch;
        buf += ch;
        continue;
      }

      if (ch === ',' || ch === '，' || ch === ';' || ch === '\n' || ch === '\r' || ch === '&') {
        if (buf.trim()) parts.push(buf.trim());
        buf = '';
        continue;
      }

      buf += ch;
    }

    if (buf.trim()) parts.push(buf.trim());
    return parts;
  }

  function findSeparator(pair) {
    let quote = '';
    let escaped = false;
    for (let i = 0; i < pair.length; i++) {
      const ch = pair[i];
      if (quote) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === quote) quote = '';
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '=' || ch === ':') return i;
    }
    return -1;
  }

  function stripQuotes(value) {
    const s = value.trim();
    if (s.length >= 2) {
      const first = s[0];
      const last = s[s.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return s.slice(1, -1);
      }
    }
    return s;
  }

  function addValue(out, key, value) {
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      if (!Array.isArray(out[key])) out[key] = [out[key]];
      out[key].push(value);
    } else {
      out[key] = value;
    }
  }

  function parseLoose(text) {
    const pairs = splitPairs(text);
    if (!pairs.length) throw new Error('No key/value pairs found.');

    const out = {};
    const skipped = [];
    pairs.forEach((pair) => {
      const idx = findSeparator(pair);
      if (idx < 0) {
        skipped.push(pair);
        return;
      }
      const key = stripQuotes(pair.slice(0, idx)).trim();
      const value = stripQuotes(pair.slice(idx + 1));
      if (!key) {
        skipped.push(pair);
        return;
      }
      addValue(out, key, value);
    });

    if (!Object.keys(out).length) throw new Error('Could not recognize any key/value pairs.');
    return { out, skipped };
  }

  TK.tool({
    sample: SAMPLE,
    filename: 'loose-string.json',
    mime: 'application/json',
    run(text) {
      const parsed = parseLoose(text);
      const json = JSON.stringify(parsed.out, null, 2);
      const skipped = parsed.skipped.length ? ' · skipped ' + parsed.skipped.length + ' fragment(s)' : '';
      return {
        output: json,
        inMsg: Object.keys(parsed.out).length + ' keys parsed' + skipped,
        outMsg: 'JSON object · ' + TK.bytes(new Blob([json]).size),
        inKind: parsed.skipped.length ? '' : 'ok'
      };
    }
  });
})();
