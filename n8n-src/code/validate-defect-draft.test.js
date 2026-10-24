const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDefectDraft } = require('./validate-defect-draft');

const draft = {
  title: '[Checkout] Shipping charged at $52.00', summary: 'Shipping was charged.', reproSteps: ['Add items', 'Apply discount', 'Checkout'],
  expected: 'Shipping is free.', actual: 'Expected shipping 0.00 for discounted subtotal 52.00, got 5.99.',
  suggestedSeverity: '3 - Medium', severityRationale: 'Checkout total is wrong.', suggestedPriority: 2, area: 'Checkout', confidence: 'high',
};

test('accepts actual text grounded in a numeric error-message fact', () => {
  const result = validateDefectDraft(draft, 'expected shipping 0.00 for discounted subtotal 52.00, got 5.99');
  assert.equal(result.valid, true);
});

test('rejects actual text that invents no error-message evidence', () => {
  const result = validateDefectDraft({ ...draft, actual: 'The platform has a serious checkout failure.' }, 'expected shipping 0.00 for discounted subtotal 52.00, got 5.99');
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /evidence/i);
});

test('accepts the three recorded Azure DevOps failure messages', () => {
  const cases = [
    [draft, "Decimal('5.99') != Decimal('0.00') : expected shipping 0.00 for discounted subtotal 52.00, got 5.99"],
    [{ ...draft, title: '[Tax] Half-up rounding is not applied', actual: "The observed amount was Decimal('0.16') instead of Decimal('0.17')." }, "Decimal('0.16') != Decimal('0.17')"],
    [{ ...draft, title: '[Discount] Lowercase code is rejected', actual: 'Checkout reports Invalid discount code.' }, 'Invalid discount code'],
  ];
  for (const [candidate, errorMessage] of cases) assert.equal(validateDefectDraft(candidate, errorMessage).valid, true);
});

test('rejects invalid metadata and unquoted plain-text evidence', () => {
  const longTitle = `[Checkout] ${'x'.repeat(90)}`;
  const invalid = validateDefectDraft({ ...draft, title: longTitle }, 'Invalid discount code');
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(' '), /title/i);
  const plainText = validateDefectDraft({ ...draft, actual: 'A payment error occurred.' }, 'Invalid discount code');
  assert.equal(plainText.valid, false);
});
