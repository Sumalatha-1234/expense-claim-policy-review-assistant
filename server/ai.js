import { findPolicy } from './policies.js';

const keywords = [
  ['Business Meal', /meal|dinner|lunch|breakfast|restaurant|client/i], ['Accommodation', /hotel|accommodation|stay|lodging/i],
  ['Local Transport', /taxi|cab|uber|metro|train|transport/i], ['Travel', /flight|airfare|travel|trip/i], ['Office Supplies', /stationery|supplies|printer|office/i]
];

export async function classifyClaim(claim) {
  // API integration is deliberately optional: no key means an auditable local fallback, never a fabricated provider result.
  const match = keywords.find(([, pattern]) => pattern.test(claim.description));
  const classification = match?.[0] || claim.category;
  const categoryConflict = Boolean(match && match[0] !== claim.category);
  const confidence = categoryConflict ? 0.68 : (match ? 0.92 : 0.55);
  const uncertain = confidence < 0.8;
  const missingInformation = [];
  if (!match) missingInformation.push('A clearer description of the purchase and its business purpose.');
  if (classification === 'Business Meal' && !/client|meeting|business|project/i.test(claim.description)) missingInformation.push('Names of attendees and the business purpose of the meal.');
  if (categoryConflict) missingInformation.push(`Please confirm whether this should be reviewed as ${match[0]} rather than ${claim.category}.`);
  if (!process.env.OPENAI_API_KEY) return { classification, confidence, uncertain, explanation: categoryConflict ? `Local analysis found ${classification.toLowerCase()} cues in the description, which conflicts with the submitted ${claim.category} category.` : (match ? `Local analysis found description cues consistent with ${classification}.` : 'Local analysis could not identify clear category cues.'), missingInformation, provider: 'fallback' };
  // Keep provider handling constrained; policy evidence is always attached by server retrieval below.
  try {
    const response = await fetch(`${(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: `Classify only into: ${keywords.map(x => x[0]).join(', ')}. Return JSON classification, confidence (0-1), explanation, missingInformation array. Do not invent policy rules.` }, { role: 'user', content: claim.description }] }) });
    if (!response.ok) throw new Error(`provider returned ${response.status}`);
    const parsed = JSON.parse((await response.json()).choices?.[0]?.message?.content || '{}');
    if (!findPolicy(parsed.classification) || !Number.isFinite(parsed.confidence)) throw new Error('malformed AI response');
    return { classification: parsed.classification, confidence: Math.max(0, Math.min(1, parsed.confidence)), uncertain: parsed.confidence < 0.8, explanation: String(parsed.explanation || ''), missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [], provider: 'openai' };
  } catch (error) { console.error('AI error:', error.message); return { classification: null, confidence: null, uncertain: true, explanation: 'AI review is temporarily unavailable. Deterministic validation results are still available. Please review manually.', missingInformation: [], provider: 'unavailable' }; }
}
