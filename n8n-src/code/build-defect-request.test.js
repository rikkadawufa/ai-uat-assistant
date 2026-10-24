const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDefectRequest } = require('./build-defect-request');

test('builds a strict defect request from bounded result evidence and story context', () => {
  const request = buildDefectRequest({ title: 'Shipping', automatedTestName: 'tests.shipping', errorMessage: 'got 5.99', stackTrace: 'a\nb', storyKey: 'US-CHK-03', story: { title: 'Checkout', acceptanceCriteria: ['Free shipping'] }, runUrl: 'https://run/4' }, { system: 'system', userTemplate: 'Draft {{failedResultJson}}', schema: { type: 'object' } });
  assert.equal(request.response_format.json_schema.strict, true);
  assert.match(request.messages[1].content, /US-CHK-03/);
  assert.match(request.messages[1].content, /got 5\.99/);
  assert.match(request.messages[1].content, /https:\/\/run\/4/);
});

test('passes the approved test case id to the model', () => {
  const request = buildDefectRequest({ caseId: 'TC-US-CHK-04-02', errorMessage: 'got 0.16' }, { system: 's', userTemplate: '{{failedResultJson}}', schema: {} });
  assert.match(request.messages[1].content, /"testCaseId": "TC-US-CHK-04-02"/);
});
