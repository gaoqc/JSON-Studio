/*
  url-param.js
  URL query parameters ⇄ JSON. Values stay as strings by default because query
  strings do not carry type information.
*/

(function () {
  const $ = TK.$;
  const dirPill = $('dir-pill');
  const inLabel = $('in-label');
  const outLabel = $('out-label');

  let direction = 'auto';
  let lastResolved = 'p2j';

  const SAMPLE_PARAMS = 'id=1001&name=zhangsan&age=25';
  const SAMPLE_JSON = '{\n  "id": "1001",\n  "name": "zhangsan",\n  "age": "25"\n}';

  function cleanParams(text) {
    const trimmed = text.trim();
    const query = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?') + 1) : trimmed;
    return query.replace(/^#/, '').replace(/^\?/, '');
  }

  function addValue(out, key, value) {
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      if (!Array.isArray(out[key])) out[key] = [out[key]];
      out[key].push(value);
    } else {
      out[key] = value;
    }
  }

  function paramsToJSON(text) {
    const query = cleanParams(text);
    if (!query) throw new Error('No URL parameters found.');

    const params = new URLSearchParams(query);
    const out = {};
    let count = 0;
    params.forEach((value, key) => {
      addValue(out, key, value);
      count++;
    });
    if (!count) throw new Error('No key/value pairs found.');

    const json = JSON.stringify(out, null, 2);
    return {
      output: json,
      inMsg: count + ' parameter' + (count === 1 ? '' : 's') + ' parsed',
      outMsg: 'JSON object · ' + Object.keys(out).length + ' keys'
    };
  }

  function appendParam(params, key, value) {
    if (Array.isArray(value)) {
      value.forEach((item) => appendParam(params, key, item));
      return;
    }
    if (value && typeof value === 'object') {
      params.append(key, JSON.stringify(value));
      return;
    }
    params.append(key, value == null ? '' : String(value));
  }

  function jsonToParams(text) {
    const data = TK.parseJSON(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('JSON input must be an object, such as {"id":"1001"}.');
    }

    const params = new URLSearchParams();
    Object.keys(data).forEach((key) => appendParam(params, key, data[key]));
    const output = params.toString();
    return {
      output,
      inMsg: 'Valid JSON object · ' + Object.keys(data).length + ' keys',
      outMsg: 'URL parameters · ' + TK.bytes(new Blob([output]).size)
    };
  }

  function looksLikeJSON(text) {
    const t = text.trim();
    return t[0] === '{' || t[0] === '[';
  }

  const api = TK.tool({
    filename: () => (lastResolved === 'p2j' ? 'params.json' : 'params.txt'),
    mime: 'text/plain',
    run(text) {
      const dir = direction === 'auto' ? (looksLikeJSON(text) ? 'j2p' : 'p2j') : direction;
      lastResolved = dir;
      inLabel.textContent = dir === 'p2j' ? 'URL parameters input' : 'JSON input';
      outLabel.textContent = dir === 'p2j' ? 'JSON output' : 'URL parameters output';
      return dir === 'p2j' ? paramsToJSON(text) : jsonToParams(text);
    }
  });

  dirPill.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-dir]');
    if (!btn) return;
    direction = btn.dataset.dir;
    [...dirPill.querySelectorAll('button')].forEach((b) => b.classList.toggle('on', b === btn));
    if (api.input.value.trim()) api.run(true);
  });

  $('btn-swap').addEventListener('click', () => {
    if (!api.output.value) return;
    api.input.value = api.output.value;
    if (direction !== 'auto') {
      dirPill.querySelector('button[data-dir="' + (direction === 'p2j' ? 'j2p' : 'p2j') + '"]').click();
    } else {
      api.run(true);
    }
  });

  $('btn-sample-params').addEventListener('click', () => api.setInput(SAMPLE_PARAMS));
  $('btn-sample-json').addEventListener('click', () => api.setInput(SAMPLE_JSON));
})();
