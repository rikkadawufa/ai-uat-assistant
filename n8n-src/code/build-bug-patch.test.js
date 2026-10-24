const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBugPatch } = require('./build-bug-patch');

test('builds a tagged and linked patch from approved human decisions', () => {
  const patch = buildBugPatch({ title: '[Checkout] charged', summary: 'Summary', reproSteps: ['Do <thing>'], expected: 'Free', actual: 'Charged 5.99', errorMessage: 'got <5.99>', stackTrace: 'line1\nline2', dedupKey: 'dk-a', storyId: 3, runId: 4, reviewer: 'QA <Demo>', severity: '2 - High', priority: 1, org: 'org', project: 'project', date: '2026-10-24' });
  assert.equal(patch.find((op) => op.path === '/fields/System.Tags').value, 'shopeasy-demo; ai-drafted; qa-approved; dk-a');
  assert.match(patch.find((op) => op.path === '/fields/Microsoft.VSTS.TCM.ReproSteps').value, /QA &lt;Demo&gt;/);
  assert.equal(patch.filter((op) => op.path === '/relations/-').length, 2);
});

test('names the failed test case in the evidence when it is known', () => {
  const base = { title: '[Tax] rounding', reproSteps: [], dedupKey: 'dk-b', storyId: 4, runId: 7, reviewer: 'QA Lead', severity: '2 - High', priority: 1, org: 'org', project: 'project', date: '2026-10-24' };
  const repro = (draft) => buildBugPatch(draft).find((op) => op.path === '/fields/Microsoft.VSTS.TCM.ReproSteps').value;
  assert.match(repro({ ...base, caseId: 'TC-US-CHK-04-02' }), /Test case: TC-US-CHK-04-02/);
  assert.doesNotMatch(repro(base), /Test case:/);
});
