import { findPolicy } from './policies.js';

const required = ['claimant', 'date', 'category', 'amount', 'currency', 'description', 'receiptAvailable'];
export function validateClaim(input, { allowFutureDates = false } = {}) {
  const errors = [];
  for (const key of required) if (input[key] === undefined || input[key] === null || input[key] === '') errors.push(`${key} is required`);
  if (input.date && !isCalendarDate(input.date)) errors.push('date must be valid YYYY-MM-DD');
  if (input.date && !allowFutureDates && new Date(`${input.date}T00:00:00`) > new Date(new Date().toDateString())) errors.push('future dates are not allowed');
  if (input.amount === '' || !Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0) errors.push('amount must be a positive number');
  if (input.currency && !/^[A-Za-z]{3}$/.test(input.currency)) errors.push('currency must be a 3-letter code');
  if (input.category && !findPolicy(input.category)) errors.push('category must match a configured policy');
  return errors;
}

function isCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function deterministicChecks(claim, duplicates = []) {
  const policy = findPolicy(claim.category);
  const findings = [];
  if (duplicates.length) findings.push({ type: 'DUPLICATE', severity: 'warning', message: 'Possible duplicate — requires review.', details: `${duplicates.length} similar prior claim(s) found.` });
  if (policy && Number(claim.amount) > policy.limit) findings.push({ type: 'LIMIT_EXCEEDED', severity: 'warning', message: `Amount exceeds the ${policy.limit} ${policy.currency} category limit.`, details: policy.id });
  if (policy && !claim.receiptAvailable && Number(claim.amount) > policy.receiptThreshold) findings.push({ type: 'MISSING_RECEIPT', severity: 'warning', message: 'Receipt is required for this claim.', details: policy.id });
  return findings;
}
