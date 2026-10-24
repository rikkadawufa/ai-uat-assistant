const test = require('node:test');
const assert = require('node:assert/strict');
const { parseStory } = require('./parse-story');

test('parses a tagged Azure DevOps story and numbered acceptance criteria', () => {
  const story = parseStory({ id: 12, fields: {
    'System.Title': '[US-CART-02] Apply a discount code',
    'System.Description': '<p>As a shopper &amp; buyer</p>',
    'Microsoft.VSTS.Common.AcceptanceCriteria': '<ol><li>Valid codes work</li><li>Expired codes fail</li></ol>',
  } });
  assert.equal(story.key, 'US-CART-02');
  assert.equal(story.description, 'As a shopper & buyer');
  assert.deepEqual(story.acceptanceCriteria, ['Valid codes work', 'Expired codes fail']);
});

test('retains a story with missing acceptance criteria for the needs-info branch', () => {
  const story = parseStory({ id: 13, fields: { 'System.Title': '[US-CHK-06] Saved cards' } });
  assert.equal(story.key, 'US-CHK-06');
  assert.deepEqual(story.acceptanceCriteria, []);
});
