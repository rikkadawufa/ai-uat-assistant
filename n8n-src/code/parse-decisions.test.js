const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDecisions } = require('./parse-decisions');

const drafts = [{ dedupKey: 'dk-a', title: '[Area] A', suggestedSeverity: '2 - High', suggestedPriority: 1, reproSteps: ['one'] }];

test('parses approved and implicitly rejected review forms', () => {
  const result = parseDecisions({ reviewer: 'QA Demo', 'decision__dk-a': 'approve', 'title__dk-a': '[Area] revised', 'severity__dk-a': '2 - High', 'priority__dk-a': '1', 'repro__dk-a': 'one\ntwo' }, drafts);
  assert.equal(result.errors.length, 0);
  assert.equal(result.approved.length, 1);
  assert.equal(result.approved[0].reproSteps.length, 2);
});

test('rejects missing reviewer, unknown keys, and invalid enum values', () => {
  const result = parseDecisions({ 'decision__dk-a': 'approve', 'severity__dk-a': 'bad', 'decision__unknown': 'approve' }, drafts);
  assert.ok(result.errors.some((error) => /reviewer/i.test(error)));
  assert.ok(result.errors.some((error) => /unknown/i.test(error)));
});

test('marks an empty Wait webhook payload as a timeout without rejecting a review', () => {
  const result = parseDecisions(undefined, drafts);
  assert.equal(result.timedOut, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.approved, []);
  assert.deepEqual(result.rejected, []);
});
