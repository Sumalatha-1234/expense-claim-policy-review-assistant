import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClaim } from '../server/validation.js';
import { classifyClaim } from '../server/ai.js';

const baseClaim = { claimant: 'Maya Rao', date: '2026-09-25', category: 'Business Meal', amount: 850, currency: 'INR', description: 'Lunch with client after project meeting', receiptAvailable: true };

test('rejects calendar dates that do not exist', () => {
  const errors = validateClaim({ ...baseClaim, date: '2026-02-31' });
  assert.ok(errors.includes('date must be valid YYYY-MM-DD'));
});

test('flags an uncertain description that conflicts with its selected category', async () => {
  const analysis = await classifyClaim({ ...baseClaim, category: 'Travel', description: 'Dinner with a client after the project meeting' });
  assert.equal(analysis.classification, 'Business Meal');
  assert.equal(analysis.uncertain, true);
  assert.ok(analysis.missingInformation.some(item => item.includes('confirm')));
});

test('asks for business context when classification cues are absent', async () => {
  const analysis = await classifyClaim({ ...baseClaim, description: 'Miscellaneous expense' });
  assert.equal(analysis.uncertain, true);
  assert.ok(analysis.missingInformation.length > 0);
});
