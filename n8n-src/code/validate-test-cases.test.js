const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTestCases } = require('./validate-test-cases');

const base = {
  storyKey: 'US-CART-02',
  cases: [
    { id: 'anything', title: 'Valid code', type: 'positive', priority: 1, acRefs: [1, 2, 3, 4], preconditions: [], steps: [{ action: 'Apply SAVE10', expected: 'Discount applies' }], testData: 'SAVE10' },
    { id: 'anything', title: 'Expired code', type: 'negative', priority: 2, acRefs: [3], preconditions: [], steps: [{ action: 'Apply OLD5', expected: 'Rejected' }], testData: 'OLD5' },
    { id: 'anything', title: 'Lowercase code', type: 'edge', priority: 2, acRefs: [4], preconditions: [], steps: [{ action: 'Apply save10', expected: 'Discount applies' }], testData: 'save10' },
  ],
  assumptions: [],
};

test('renumbers valid cases and retains coverage', () => {
  const result = validateTestCases(base, 4);
  assert.equal(result.valid, true);
  assert.deepEqual(result.cases.map((item) => item.id), ['TC-US-CART-02-01', 'TC-US-CART-02-02', 'TC-US-CART-02-03']);
});

test('rejects missing positive acceptance-criteria coverage', () => {
  const data = structuredClone(base);
  data.cases[0].acRefs = [1];
  const result = validateTestCases(data, 4);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /positive coverage.*2/i);
});

test('rejects output without a negative case', () => {
  const data = structuredClone(base);
  data.cases[1].type = 'positive';
  const result = validateTestCases(data, 4);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /negative/i);
});
