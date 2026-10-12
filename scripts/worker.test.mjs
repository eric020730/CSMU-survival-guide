import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
const base = 'https://eric020730.com/CSMU-survival-guide';
test('Only the requested path is served, and slash canonicalization preserves queries', async () => {
  const result = await worker.fetch(new Request(`${base}?x=1`));
  assert.equal(result.status, 308);
  assert.equal(result.headers.get('Location'), `${base}/?x=1`);
  assert.equal((await worker.fetch(new Request(`${base}-other/`))).status, 404);
  assert.equal((await worker.fetch(new Request(`${base}/`,{method:'POST'}))).status, 405);
});
test('Proxy routes to Pages without forwarding visitor cookies or authorization', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url),'https://eric020730.github.io/CSMU-survival-guide/notes.json');
      assert.equal(options.headers, undefined);
      assert.equal(options.cf.cacheTtl, 0);
      return new Response('[]', {headers:{'Content-Type':'application/json'}});
    };
    const response = await worker.fetch(new Request(`${base}/notes.json`,{headers:{Cookie:'private=example',Authorization:'Bearer example'}}));
    assert.equal(await response.text(),'[]');
    assert.equal(response.headers.get('Cache-Control'),'no-cache');
    assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  } finally { globalThis.fetch = original; }
});
test('Unavailable publishing origin returns a clear retryable failure', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error('offline'); };
    const response = await worker.fetch(new Request(`${base}/`));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
  } finally { globalThis.fetch = original; }
});
