const test = require('node:test');
const assert = require('node:assert/strict');
const { formatAlert } = require('./format-alert');

test('formats an execution link and masks credential-shaped values', () => {
  const key = ['sk', 'abcdefghijklmnopqrst'].join('-');
  const alert = formatAlert({ workflow: { id: 'wf1', name: 'Flow' }, execution: { id: '99', lastNodeExecuted: 'Fetch', error: { message: `Bearer abcdefghijklmnopqrstuvwxyz and ${key}` } } });
  assert.match(alert.text, /http:\/\/localhost:5678\/workflow\/wf1\/executions\/99/);
  assert.doesNotMatch(alert.text, /Bearer abc|sk-abc/);
  assert.match(alert.text, /\*\*\*/);
});
