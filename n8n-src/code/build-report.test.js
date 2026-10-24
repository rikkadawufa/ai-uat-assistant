const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReport } = require('./build-report');

test('builds screenshot-ready HTML and Slack blocks using computed metrics', () => {
  const report = buildReport({ readiness: 'AMBER', total: 16, passed: 12, failed: 3, blocked: 1, passRate: 80, executionProgress: 93.8, readinessReasons: ['Pass rate 80%'], criticalIssues: [{ title: 'Shipping <fault>', severity: '2 - High' }], outstanding: { blocked: ['payment'], untestedStories: [], missingAcceptanceCriteria: ['US-CHK-06'] }, runUrl: 'https://run/4' }, { headline: 'AMBER readiness', summary: '12 passed.' }, 'llm');
  assert.match(report.html, /AMBER/);
  assert.match(report.html, /Shipping &lt;fault&gt;/);
  assert.equal(report.blocks[0].text.text.includes('🟡'), true);
});
