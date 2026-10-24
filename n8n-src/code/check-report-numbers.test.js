const test = require('node:test');
const assert = require('node:assert/strict');
const { checkReportNumbers } = require('./check-report-numbers');

const metrics = { total: 16, passed: 12, failed: 3, blocked: 1, passRate: 80.0, openBugs: { high: 1 } };

test('accepts numbers which occur in computed metrics', () => {
  assert.equal(checkReportNumbers({ headline: '80% pass rate', summary: '12 passed, 3 failed, and 1 blocked out of 16.' }, metrics).valid, true);
});

test('rejects fabricated report numbers', () => {
  const result = checkReportNumbers({ headline: '99% pass rate', summary: '12 passed.' }, metrics);
  assert.equal(result.valid, false);
  assert.deepEqual(result.invalidNumbers, ['99']);
});

test('requires the computed readiness and rejects other readiness labels', () => {
  const reportMetrics = { ...metrics, readiness: 'AMBER' };
  assert.equal(checkReportNumbers({ headline: 'AMBER readiness: 80% pass rate', summary: '12 passed.' }, reportMetrics).valid, true);
  const result = checkReportNumbers({ headline: 'GREEN readiness: 80% pass rate', summary: '12 passed.' }, reportMetrics);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /readiness/i);
});

// Shape of the run #6 metrics: two Medium Bugs open, no Sev1/Sev2.
const run6 = { total: 16, passed: 12, failed: 3, blocked: 1, passRate: 80, executionProgress: 93.8, openBugs: { '3 - Medium': 2 }, criticalIssues: [], storiesAtRisk: ['A', 'B', 'C', 'D'], untestedStories: [], readiness: 'AMBER' };
const summarize = (summary) => checkReportNumbers({ headline: 'AMBER readiness: 80% pass rate', summary }, run6);

test('rejects a high-severity defect claim when no Sev1/Sev2 Bug is open', () => {
  const counted = summarize('AMBER readiness is driven by a pass rate of 80%, 1 blocked test, and 1 high-severity defect.');
  assert.equal(counted.valid, false);
  assert.match(counted.errors.join(' '), /high-severity/i);
  assert.equal(summarize('Resolve the high-severity defect before release.').valid, false);
  assert.equal(summarize('A critical bug remains open.').valid, false);
});

test('accepts severity claims that match the computed critical issues', () => {
  assert.equal(summarize('There are no high-severity defects, and 2 open bugs remain.').valid, true);
  const withHigh = { ...run6, criticalIssues: [{ severity: '2 - High' }], openBugs: { '2 - High': 1 } };
  assert.equal(checkReportNumbers({ headline: 'AMBER readiness', summary: 'Fix the 1 high-severity defect first.' }, withHigh).valid, true);
  assert.equal(checkReportNumbers({ headline: 'AMBER readiness', summary: 'There are 2 high-severity defects.' }, withHigh).valid, false);
});

test('rejects numbers attached to the wrong metric', () => {
  const swapped = summarize('The run has 3 passed and 12 failed results out of 16 total.');
  assert.equal(swapped.valid, false);
  assert.deepEqual(swapped.invalidNumbers, []);
  assert.equal(summarize('There are 1 open bugs.').valid, false);
  assert.equal(summarize('4 stories at risk and 1 blocked test remain.').valid, true);
  assert.equal(summarize('2 stories at risk remain.').valid, false);
});
