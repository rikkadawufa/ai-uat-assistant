const test = require('node:test');
const assert = require('node:assert/strict');
const { selectStories, buildTestCaseRequest, readLlmJson, summaryComment, summarizeStories } = require('./test-case-request');

const prompt = { system: 'You are QA.', userTemplate: 'Story:\n{{storyJson}}', schema: { type: 'object' } };
const story = { id: 12, key: 'US-CART-02', title: 'Apply a discount code', description: 'As a shopper', acceptanceCriteria: ['Valid codes work', 'Expired codes fail'] };

test('selects requested stories case-insensitively and all stories when no keys are given', () => {
  const stories = [story, { ...story, key: 'US-CHK-06' }];
  assert.deepEqual(selectStories(stories, ['us-cart-02']).map((item) => item.key), ['US-CART-02']);
  assert.equal(selectStories(stories, []).length, 2);
  assert.throws(() => selectStories(stories, ['US-NOPE-01']), /US-NOPE-01/);
});

test('builds a strict-schema request with numbered acceptance criteria', () => {
  const request = buildTestCaseRequest(story, prompt);
  assert.equal(request.response_format.json_schema.strict, true);
  assert.equal(request.messages.length, 2);
  assert.match(request.messages[1].content, /"ac": 2,\s+"text": "Expired codes fail"/);
});

test('appends validation errors to the retry request', () => {
  const request = buildTestCaseRequest(story, prompt, ['Missing positive coverage for AC 2']);
  assert.equal(request.messages.length, 3);
  assert.match(request.messages[2].content, /AC 2/);
});

test('reads JSON content and reports malformed responses', () => {
  assert.deepEqual(readLlmJson({ choices: [{ message: { content: '{"storyKey":"US-CART-02"}' } }] }).data, { storyKey: 'US-CART-02' });
  assert.match(readLlmJson({ choices: [{ message: { content: 'not json' } }] }).error, /not valid JSON/);
  assert.match(readLlmJson({}).error, /no message content/);
});

test('formats the story comment and run summary counts', () => {
  const cases = [{ type: 'positive' }, { type: 'positive' }, { type: 'negative' }, { type: 'edge' }];
  assert.equal(summaryComment(cases, 'test-cases-2026-10-24.csv'), 'Generated 4 test cases (2 positive / 1 negative / 1 edge) for QA review — file: test-cases-2026-10-24.csv');
  const summary = summarizeStories([
    { key: 'US-CART-02', status: 'generated', cases },
    { key: 'US-CHK-06', status: 'skipped' },
    { key: 'US-CHK-04', status: 'needs_human', errors: ['Missing positive coverage for AC 3'] },
  ]);
  assert.equal(summary.generated, 1);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.needsHuman, 1);
  assert.equal(summary.cases, 4);
});
