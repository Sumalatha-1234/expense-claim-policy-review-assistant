# Agent Usage

## Tools used

AI-assisted development tools were used for project scaffolding, code review, implementation support, test planning, documentation, and deployment troubleshooting. GitHub was used for source control and Render was used for the hosted deployment.

## Representative prompts and work

- Build a focused internal expense claim review application with deterministic validation, stored policy evidence, human decisions, SQLite, and a React frontend.
- Review the application against the assessment requirements and identify missing edge cases.
- Improve the finance-review dashboard and create realistic demo claims for a product walkthrough.
- Add strict calendar-date validation, uncertain classification handling, and focused automated tests.

## Delegated work

No autonomous delegated agents were used. The work remained in one local workspace so implementation, testing, and review could be checked consistently.

## Important corrections and rejected suggestions

- The dashboard initially retained stale claim data after a reviewer approved a claim. This was identified during manual testing and fixed by refreshing claim data on dashboard navigation. Completed decisions also no longer present repeat decision controls.
- A deployment initially failed because the Render build command contained an accidental `buildid` suffix. The deployment log exposed the error; the command was corrected to `npm ci && npm run build` and the service was redeployed.
- A Vercel-only deployment was not used because this application has an Express API and SQLite database. A single Render web service was configured instead.
- The free Render plan does not offer persistent disk. This is documented as a known limitation; the service seeds safe demo data when it starts.

## Verification performed

- `npm test`: 6 automated tests pass, covering validation, receipt/limit checks, duplicate detection, policy retrieval, history, strict dates, and uncertain classification.
- `npm run lint`: passes.
- `npm run build`: passes.
- Manual browser checks: claim submission, policy evidence display, approval, clarification request, decision history, and dashboard status refresh.
- Hosted deployment verified at the public Render URL.

## Human responsibility

AI assistance accelerated development, but the submitted design, code changes, tests, review, deployment decisions, and documented limitations were reviewed by the project author. The application deliberately keeps final claim decisions with a human reviewer.
