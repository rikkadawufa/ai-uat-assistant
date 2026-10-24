const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { parseResult } = require('./parse-result');

test('extracts traceability and makes a stable deduplication key', () => {
  const result = parseResult({ automatedTestName: 'tests_shopeasy.test_pricing.test_discount', comment: 'story=US-CART-02;storyId=13', errorMessage: 'expected 54, got 60' });
  assert.equal(result.storyKey, 'US-CART-02');
  assert.equal(result.storyId, '13');
  assert.match(result.dedupKey, /^dk-[a-f0-9]{8}$/);
  assert.equal(result.dedupKey, `dk-${createHash('sha1').update('tests_shopeasy.test_pricing.test_discount').digest('hex').slice(0, 8)}`);
  assert.equal(result.traceability, 'complete');
});

test('keeps a failed result moving when its story id is absent', () => {
  const result = parseResult({ automatedTestName: 'suite.case', comment: 'story=US-CHK-03' });
  assert.equal(result.traceability, 'missing');
  assert.equal(result.storyId, '');
});

test('reads the approved test case id from the result comment', () => {
  const result = parseResult({ automatedTestName: 'suite.case', comment: 'story=US-CHK-04;storyId=4;case=TC-US-CHK-04-02' });
  assert.equal(result.caseId, 'TC-US-CHK-04-02');
  assert.equal(parseResult({ comment: 'story=US-CART-01;storyId=1' }).caseId, '');
});

test('redacts local folders from traceback paths', () => {
  const trace = String.raw`File "C:\Users\someone\AppData\Local\Python\pythoncore-3.12-64\Lib\unittest\case.py", line 58
  File "C:\Users\someone\work\demo\tests_shopeasy\test_checkout.py", line 34
  File "/home/someone/demo/shopeasy/pricing.py", line 23`;
  const result = parseResult({ stackTrace: trace });
  assert.doesNotMatch(result.stackTrace, /someone/);
  assert.ok(result.stackTrace.includes(String.raw`"<python>\Lib\unittest\case.py"`));
  assert.ok(result.stackTrace.includes(String.raw`"<project>\tests_shopeasy\test_checkout.py"`));
  assert.match(result.stackTrace, /"<project>\/shopeasy\/pricing\.py"/);
});
