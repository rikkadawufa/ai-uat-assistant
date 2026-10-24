const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReviewSheet } = require('./build-review-sheet');

test('creates CSV and escaped HTML rows for every test step', () => {
  const result = buildReviewSheet([{ storyKey: 'US-CART-02', cases: [{ id: 'TC-US-CART-02-01', title: 'Discount <valid>', type: 'positive', priority: 1, acRefs: [1], preconditions: ['Cart has items'], steps: [{ action: 'Apply SAVE10', expected: 'Total is 54.00' }, { action: 'Review total', expected: 'Discount remains' }], testData: 'SAVE10' }] }]);
  assert.equal(result.csv.trim().split('\n').length, 3);
  assert.match(result.html, /Discount &lt;valid&gt;/);
  assert.match(result.html, /US-CART-02/);
});
