# Expense Claim Policy Review Assistant

A focused internal MVP for submitting expense claims, checking them against configured policy, presenting a policy-grounded review, and preserving the final human decision trail.

## Features

- React dashboard with claim submission, review, decisions, and an audit timeline.
- Express REST API backed by SQLite.
- Deterministic validation for required fields, dates, positive amounts, limits, receipt requirements, and possible duplicates.
- Structured policy records and evidence retrieval—AI output is never used as policy evidence.
- Optional OpenAI-compatible classification. With no API key, the product uses a visibly labelled local fallback; provider errors remain visible to the reviewer.
- Reviewer approval, rejection, clarification, and category override (reasons required where appropriate).
- Structured JSON application and AI-workflow logs suitable for Render log search.

## Architecture and workflow

The client submits a claim to the API. The API validates the request, queries matching claims for possible duplicates, applies policy limits/receipt rules, stores the claim, and produces a classification review. It retrieves policy evidence by the returned category, stores the review, then writes an audit event. The reviewer sees deterministic findings separately from analysis and makes the only final decision.

`src/` contains the React UI. `server/validation.js` contains non-AI rules, `server/ai.js` contains constrained classification, `server/policies.js` owns policy configuration, and `server/db.js` owns SQLite schema/access. `test/` covers the critical workflow.

## Database

- `policies`: seeded policy sections and rules.
- `claims`: submitted expense data and the reviewer-visible status.
- `reviews`: classification, confidence, findings, evidence reference, and provider state.
- `decision_history`: append-only action timeline with actor, reason, prior/new status, and timestamp.

## API

- `POST /api/claims`, `GET /api/claims`, `GET /api/claims/:id`
- `GET /api/claims/:id/history`
- `POST /api/claims/:id/decision`, `POST /api/claims/:id/override`
- `GET /api/policies`, `GET /api/policies/:category`

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). API runs at port 3001. Use `npm run build` for a production client bundle and `npm start` for the API.

On a fresh local database, the server seeds four realistic demo claims so the dashboard is ready for a walkthrough. Set `SEED_DEMO_DATA=false` in `.env` when you need a blank local instance. Existing claim data is never overwritten.

## Tests

```bash
npm test
```

The test suite covers required fields, invalid amounts, strict calendar dates, policy retrieval, receipt and limit findings, duplicate detection, claim creation, reviewer rejection, classification override reasons, audit history, and uncertain classification.

## Reviewer demo inputs

No account is required. A fresh local or hosted instance seeds demo claims automatically.

- Review **Arjun Mehta** to see a Travel claim exceeding its 5,000 INR policy limit.
- Review **Kavya Iyer** to see a missing-receipt finding and a clarification workflow.
- Submit `Neha Kapoor`, `Business Meal`, `1450 INR`, receipt available, with the description `Lunch with the client team after the quarterly project review meeting.` Then approve it to inspect the audit history.

## Environment and deployment

Copy `.env.example`; `OPENAI_API_KEY` is optional. Set `OPENAI_BASE_URL` and `OPENAI_MODEL` for an OpenAI-compatible provider. Do not commit `.env`. Deploy the API with persistent storage mounted for `data/claims.db`, serve the client build through a static host/reverse proxy, and route `/api` to the API.

The submitted demo is deployed as a single Render web service at `https://expense-claim-policy-review-assistant.onrender.com/`. The free Render plan has no persistent disk: SQLite data can reset after a restart or redeploy, and the safe demo records are then seeded again. A production deployment should use persistent storage or a managed relational database.

## Known limitations

This MVP has no authentication, receipt file uploads, or multi-currency conversion. The local fallback classifier is deliberately simple; production deployments should configure an OpenAI-compatible API key, add identity/authorization, and use persistent managed data storage. The fallback is clearly labelled in the UI and does not claim to be an external LLM response.
