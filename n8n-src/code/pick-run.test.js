const test = require('node:test');
const assert = require('node:assert/strict');
const { pickRun, pickRecentRuns } = require('./pick-run');

const runs = [
  { id: 3, name: 'ShopEasy UAT 2026-10-23', state: 'Completed', completedDate: '2026-10-23T10:00:00Z' },
  { id: 4, name: 'ShopEasy UAT 2026-10-24', state: 'Completed', completedDate: '2026-10-24T10:00:00Z' },
  { id: 9, name: 'Other run', state: 'Completed', completedDate: '2026-10-24T10:00:00Z' },
];

test('selects an explicit completed UAT run or the highest completed run', () => {
  assert.equal(pickRun(runs, 3).id, 3);
  assert.equal(pickRun(runs).id, 4);
  assert.equal(pickRun(runs, 99), null);
});

test('selects current and previous UAT runs within seven days', () => {
  const picked = pickRecentRuns(runs, new Date('2026-10-24T12:00:00Z'));
  assert.equal(picked.current.id, 4);
  assert.equal(picked.previous.id, 3);
});
