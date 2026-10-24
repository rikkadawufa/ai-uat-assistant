const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReviewPage } = require('./build-review-page');

const draft = { dedupKey: 'dk-abc', status: 'draft', title: '[Checkout] <bad>', summary: 'Summary', reproSteps: ['Do <thing>'], expected: 'Expected', actual: 'Actual', suggestedSeverity: '2 - High', suggestedPriority: 1, errorMessage: 'Error <text>', stackTrace: 'stack\nline', runUrl: 'https://run/4', storyId: '3' };

test('renders escaped evidence and editable human-review controls', () => {
  const html = buildReviewPage({ runId: 4, drafts: [draft], resumeUrl: 'https://resume' });
  assert.match(html, /action="https:\/\/resume"/);
  assert.match(html, /title__dk-abc/);
  assert.match(html, /decision__dk-abc/);
  assert.match(html, /&lt;bad&gt;/);
  assert.doesNotMatch(html, /<bad>/);
});

test('does not offer approval for a needs-human draft', () => {
  const html = buildReviewPage({ runId: 4, drafts: [{ ...draft, status: 'needs_human', errors: ['Invalid actual'] }], resumeUrl: 'https://resume' });
  assert.doesNotMatch(html, /decision__dk-abc/);
  assert.match(html, /manual bug/i);
});

test('marks drafts without a linked story as missing traceability', () => {
  const html = buildReviewPage({ runId: 4, drafts: [{ ...draft, storyId: '' }], resumeUrl: 'https://resume' });
  assert.match(html, /Traceability missing/);
});

test('shows the story acceptance criteria and test case next to a collapsed trace', () => {
  const html = buildReviewPage({ runId: 7, drafts: [{ ...draft, storyKey: 'US-CHK-04', caseId: 'TC-US-CHK-04-02', story: { title: 'Calculate sales tax', acceptanceCriteria: ['Tax is rounded half-up to 2 decimal places.'] } }], resumeUrl: 'https://resume' });
  assert.match(html, /Test case TC-US-CHK-04-02/);
  assert.match(html, /<li>Tax is rounded half-up to 2 decimal places\.<\/li>/);
  assert.match(html, /<details><summary>Full trace/);
  assert.doesNotMatch(html, /<details open>/);
});
