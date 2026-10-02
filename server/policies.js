export const POLICIES = [
  { id: 'EXP-001', category: 'Travel', title: 'Travel', description: 'Business travel is reimbursable up to 5000 INR per claim. A receipt is required for claims over 1000 INR.', limit: 5000, currency: 'INR', receiptRequired: true, receiptThreshold: 1000, conditions: 'Must be for approved business travel.' },
  { id: 'EXP-002', category: 'Accommodation', title: 'Accommodation', description: 'Accommodation for approved business travel is reimbursable up to 8000 INR per night. A receipt is required.', limit: 8000, currency: 'INR', receiptRequired: true, receiptThreshold: 0, conditions: 'Include dates and business purpose.' },
  { id: 'EXP-003', category: 'Business Meal', title: 'Business Meals', description: 'Business meals are reimbursable up to 2000 INR per employee per meal. A receipt is required.', limit: 2000, currency: 'INR', receiptRequired: true, receiptThreshold: 0, conditions: 'State attendees and business purpose.' },
  { id: 'EXP-004', category: 'Local Transport', title: 'Local Transport', description: 'Local transport for business purposes is reimbursable up to 1500 INR per claim. A receipt is required for claims over 500 INR.', limit: 1500, currency: 'INR', receiptRequired: true, receiptThreshold: 500, conditions: 'Use reasonable transport options.' },
  { id: 'EXP-005', category: 'Office Supplies', title: 'Office Supplies', description: 'Necessary office supplies are reimbursable up to 3000 INR per claim. A receipt is required.', limit: 3000, currency: 'INR', receiptRequired: true, receiptThreshold: 0, conditions: 'Must be used for company work.' }
];

export const findPolicy = category => POLICIES.find(policy => policy.category.toLowerCase() === String(category || '').toLowerCase());
