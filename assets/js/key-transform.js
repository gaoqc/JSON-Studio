/*
  key-transform.js
  Recursive JSON object-key transformations. Collisions are errors: silently
  overwriting a value after a rename would make this tool unsafe to use.
*/

(function () {
  const $ = TK.$;
  const options = [...document.querySelectorAll('input[name="key-transform"]')];

  const SAMPLE = JSON.stringify({
    user_name: 'Zhang San',
    account_details: { 'display-name': 'Zhang', 'First Name': 'San' },
    recent_orders: [{ order_id: '1001', 'item-name': 'Keyboard' }]
  }, null, 2);

  function camelFromSeparator(key, separator) {
    const pattern = separator === '_' ? /_+([A-Za-z0-9])/g : /-+([A-Za-z0-9])/g;
    return key.replace(pattern, (_, letter) => letter.toUpperCase());
  }

  const transforms = {
    lower: (key) => key.toLowerCase(),
    upper: (key) => key.toUpperCase(),
    snakeCamel: (key) => camelFromSeparator(key, '_'),
    kebabCamel: (key) => camelFromSeparator(key, '-'),
    capitalize: (key) => key ? key[0].toUpperCase() + key.slice(1) : key,
    removeSpaces: (key) => key.replace(/\s+/g, '')
  };

  function rename(value, path, pipeline) {
    if (Array.isArray(value)) return value.map((item, index) => rename(item, path + '[' + index + ']', pipeline));
    if (!value || typeof value !== 'object') return value;

    const out = {};
    Object.keys(value).forEach((key) => {
      const nextKey = pipeline.reduce((current, name) => transforms[name](current), key);
      if (Object.prototype.hasOwnProperty.call(out, nextKey)) {
        throw new Error('Key collision at ' + path + ': "' + key + '" and another key both become "' + nextKey + '".');
      }
      out[nextKey] = rename(value[key], path + '.' + nextKey, pipeline);
    });
    return out;
  }

  const api = TK.tool({
    sample: SAMPLE,
    filename: 'transformed-keys.json',
    mime: 'application/json',
    run(text) {
      const pipeline = options.filter((option) => option.checked).map((option) => option.value);
      if (!pipeline.length) throw new Error('Select at least one key transformation.');
      const data = TK.parseJSON(text);
      const transformed = rename(data, '$', pipeline);
      const output = JSON.stringify(transformed, null, 2);
      return {
        output,
        inMsg: 'Valid JSON · ' + pipeline.length + ' transformations selected',
        outMsg: 'Keys transformed · ' + TK.bytes(new Blob([output]).size)
      };
    }
  });

  options.forEach((option) => option.addEventListener('change', () => {
    if (api.input.value.trim()) api.run(true);
  }));
})();
