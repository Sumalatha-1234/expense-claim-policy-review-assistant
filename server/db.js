import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLICIES } from './policies.js';
const here = path.dirname(fileURLToPath(import.meta.url));

export function createDb(filename = path.join(here, '../data/claims.db')) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename); db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS policies (id TEXT PRIMARY KEY, category TEXT UNIQUE, title TEXT, description TEXT, limit_amount REAL, currency TEXT, receipt_required INTEGER, receipt_threshold REAL, conditions TEXT);
    CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY AUTOINCREMENT, claimant TEXT NOT NULL, date TEXT NOT NULL, category TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL, description TEXT NOT NULL, receipt_available INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, claim_id INTEGER NOT NULL UNIQUE, classification TEXT, confidence REAL, uncertain INTEGER NOT NULL, status TEXT NOT NULL, explanation TEXT NOT NULL, missing_information TEXT NOT NULL, deterministic_results TEXT NOT NULL, policy_id TEXT, provider TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(claim_id) REFERENCES claims(id));
    CREATE TABLE IF NOT EXISTS decision_history (id INTEGER PRIMARY KEY AUTOINCREMENT, claim_id INTEGER NOT NULL, action TEXT NOT NULL, previous_status TEXT, new_status TEXT, reason TEXT, actor TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(claim_id) REFERENCES claims(id));`);
  const insert = db.prepare('INSERT OR IGNORE INTO policies VALUES (@id,@category,@title,@description,@limit,@currency,@receiptRequired,@receiptThreshold,@conditions)');
  POLICIES.forEach(policy => insert.run({ ...policy, receiptRequired: Number(policy.receiptRequired) })); return db;
}
export const now = () => new Date().toISOString();
export function history(db, claimId, action, previousStatus, newStatus, reason, actor = 'Reviewer') { db.prepare('INSERT INTO decision_history (claim_id,action,previous_status,new_status,reason,actor,created_at) VALUES (?,?,?,?,?,?,?)').run(claimId, action, previousStatus, newStatus, reason || null, actor, now()); }

// Demo records make a first-run dashboard useful during an assessment or product walkthrough.
// They are only seeded by the executable server, never by test databases.
export function seedDemoData(db) {
  if (db.prepare('SELECT COUNT(*) AS count FROM claims').get().count) return;
  const examples = [
    { claimant: 'Priya Nair', date: '2026-09-28', category: 'Business Meal', amount: 1860, description: 'Client dinner after the Q3 implementation review.', receipt: 1, status: 'PENDING_REVIEW', classification: 'Business Meal', confidence: 0.94, findings: [], explanation: 'The description identifies a client meal connected to a business meeting.', missing: [], policy: 'EXP-003' },
    { claimant: 'Arjun Mehta', date: '2026-09-26', category: 'Travel', amount: 6240, description: 'Return flight to Bengaluru for the partner workshop.', receipt: 1, status: 'PENDING_REVIEW', classification: 'Travel', confidence: 0.97, findings: [{ type: 'LIMIT_EXCEEDED', severity: 'warning', message: 'Amount exceeds the 5000 INR category limit.', details: 'EXP-001' }], explanation: 'The claim describes business air travel; the requested amount exceeds the configured claim limit.', missing: [], policy: 'EXP-001' },
    { claimant: 'Kavya Iyer', date: '2026-09-24', category: 'Local Transport', amount: 740, description: 'Cab to client office for on-site discovery session.', receipt: 0, status: 'REQUIRES_CLARIFICATION', classification: 'Local Transport', confidence: 0.91, findings: [{ type: 'MISSING_RECEIPT', severity: 'warning', message: 'Receipt is required for this claim.', details: 'EXP-004' }], explanation: 'The description supports local business transport, but the required receipt is unavailable.', missing: ['Please provide a receipt or an explanation for its absence.'], policy: 'EXP-004' },
    { claimant: 'Rohan Shah', date: '2026-09-21', category: 'Office Supplies', amount: 1299, description: 'Notebooks and whiteboard markers for the project room.', receipt: 1, status: 'APPROVED', classification: 'Office Supplies', confidence: 0.96, findings: [], explanation: 'The purchase is clearly described as supplies for company work.', missing: [], policy: 'EXP-005' }
  ];
  const add = db.transaction(() => examples.forEach(item => {
    const created = now();
    const id = db.prepare('INSERT INTO claims (claimant,date,category,amount,currency,description,receipt_available,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(item.claimant, item.date, item.category, item.amount, 'INR', item.description, item.receipt, item.status, created, created).lastInsertRowid;
    db.prepare('INSERT INTO reviews (claim_id,classification,confidence,uncertain,status,explanation,missing_information,deterministic_results,policy_id,provider,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id, item.classification, item.confidence, 0, item.findings.length ? 'REQUIRES_REVIEW' : 'COMPLIANT', item.explanation, JSON.stringify(item.missing), JSON.stringify(item.findings), item.policy, 'demo', created);
    history(db, id, 'CLAIM_SUBMITTED', null, 'PENDING_REVIEW', null, item.claimant);
    history(db, id, 'AI_REVIEW_COMPLETED', 'PENDING_REVIEW', item.status, 'Policy-grounded review completed.', 'System');
  })); add(); console.info('seeded demo claims');
}
