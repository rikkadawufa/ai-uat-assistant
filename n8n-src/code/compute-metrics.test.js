const test = require('node:test');
const assert = require('node:assert/strict');
const { computeMetrics } = require('./compute-metrics');

const stories = [{ key: 'US-1', acceptanceCriteria: ['AC'] }, { key: 'US-2', acceptanceCriteria: [] }];

test('calculates totals, coverage, and RED readiness from real outcomes', () => {
  const metrics = computeMetrics({
    results: [{ outcome: 'Passed', storyKey: 'US-1' }, { outcome: 'Failed', storyKey: 'US-1' }, { outcome: 'Blocked', storyKey: 'US-1' }],
    bugs: [{ severity: '2 - High', title: 'Checkout issue', state: 'Active' }], stories, previousResults: [{ outcome: 'Passed' }, { outcome: 'Passed' }],
  });
  assert.equal(metrics.total, 3);
  assert.equal(metrics.passRate, 50.0);
  assert.equal(metrics.executionProgress, 66.7);
  assert.equal(metrics.readiness, 'RED');
  assert.deepEqual(metrics.untestedStories, ['US-2']);
  assert.equal(metrics.delta.failed, 1);
});

test('returns GREEN only when pass rate, blockers, and high severity defects meet thresholds', () => {
  const metrics = computeMetrics({ results: [{ outcome: 'Passed', storyKey: 'US-1' }, { outcome: 'Passed', storyKey: 'US-1' }], bugs: [], stories: [stories[0]] });
  assert.equal(metrics.readiness, 'GREEN');
});
