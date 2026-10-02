import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const categories = [
  "Travel",
  "Business Meal",
  "Accommodation",
  "Local Transport",
  "Office Supplies",
];
const api = (url, options) =>
  fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  });
const money = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .toLowerCase();
function Badge({ status }) {
  return (
    <span className={`status ${String(status).toLowerCase()}`}>
      {label(status)}
    </span>
  );
}
function Icon({ children, tone = "blue" }) {
  return <span className={`icon ${tone}`}>{children}</span>;
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ claims: [], totals: {} });
  const [claim, setClaim] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setData(await api("/api/claims"));
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };
  const open = async (id) => {
    try {
      setClaim(await api(`/api/claims/${id}`));
      setPage("review");
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    }
  };
  useEffect(() => {
    load();
  }, []);
  const go = (next) => {
    setNotice(null);
    setPage(next);
  };
  const dashboard = () => {
    load();
    go("dashboard");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">E</span>
          <b>
            Expense<span>Desk</span>
          </b>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            ["dashboard", "▦", "Overview"],
            ["new", "+", "New claim"],
          ].map(([id, icon, text]) => (
            <button
              key={id}
              className={page === id ? "nav-active" : ""}
              onClick={() => (id === "dashboard" ? dashboard() : go(id))}
            >
              <b>{icon}</b>
              {text}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <span className="pulse" /> AI review assistance
          <small>Policy grounded</small>
        </div>
        <div className="reviewer">
          <div className="avatar">SL</div>
          <div>
            <b>Sumalatha</b>
            <small>Finance reviewer</small>
          </div>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCE OPERATIONS / INDIA</p>
            <h1>
              {page === "dashboard"
                ? "Expense claims"
                : page === "new"
                  ? "Submit a claim"
                  : `Claim #${claim?.id || ""}`}
            </h1>
          </div>
          {page !== "new" && (
            <button className="primary" onClick={() => go("new")}>
              + Submit expense
            </button>
          )}
        </header>
        {notice && (
          <div className={`notice ${notice.type}`}>
            <span>{notice.type === "error" ? "!" : "✓"}</span>
            {notice.text}
            <button onClick={() => setNotice(null)}>×</button>
          </div>
        )}
        {page === "dashboard" && (
          <Dashboard data={data} loading={loading} open={open} go={go} />
        )}{" "}
        {page === "new" && (
          <ClaimForm
            cancel={dashboard}
            saved={(item) => {
              load();
              setClaim(item);
              setNotice({
                type: "success",
                text: "Claim submitted and reviewed successfully.",
              });
              setPage("review");
            }}
          />
        )}{" "}
        {page === "review" && (
          <Review
            claim={claim}
            back={dashboard}
            refresh={() => open(claim.id)}
            announce={setNotice}
          />
        )}
      </main>
    </div>
  );
}

function Dashboard({ data, loading, open, go }) {
  const { totals: t, claims } = data;
  const queue = claims.filter(
    (item) => !["APPROVED", "REJECTED"].includes(item.status),
  );
  const cards = [
    ["Total submitted", t.submitted, "▦", "blue"],
    [
      "Needs attention",
      (t.pending || 0) + (t.clarification || 0),
      "!",
      "amber",
    ],
    ["Approved", t.approved, "✓", "green"],
    ["Submitted value", money(t.totalAmount), "₹", "purple"],
  ];
  if (loading)
    return (
      <>
        <div className="skeleton hero-skeleton" />
        <div className="metric-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="skeleton metric-skeleton" key={i} />
          ))}
        </div>
        <div className="skeleton table-skeleton" />
      </>
    );
  return (
    <>
      <section className="welcome">
        <div>
          <span className="date-chip">OCTOBER 2026</span>
          <h2>Good morning, Sumalatha.</h2>
          <p>
            You have <b>{queue.length} claims</b> requiring your attention
            today.
          </p>
        </div>
        <button className="outline" onClick={() => go("new")}>
          Create claim
        </button>
      </section>
      <section className="metric-grid">
        {cards.map(([title, value, icon, tone]) => (
          <article className="metric" key={title}>
            <Icon tone={tone}>{icon}</Icon>
            <small>{title}</small>
            <strong>{value ?? 0}</strong>
            {title === "Needs attention" && <em>Review queue</em>}
            {title === "Approved" && (
              <em>
                {t.submitted ? Math.round((t.approved / t.submitted) * 100) : 0}
                % of all claims
              </em>
            )}
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="card queue-card">
          <div className="card-heading">
            <div>
              <h2>Review queue</h2>
              <p>Claims that need a decision or follow-up</p>
            </div>
            <button
              className="text-button"
              onClick={() =>
                document
                  .getElementById("recent")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View all
            </button>
          </div>
          {queue.length ? (
            <div className="queue-list">
              {queue.slice(0, 3).map((item) => (
                <button
                  className="queue-row"
                  key={item.id}
                  onClick={() => open(item.id)}
                >
                  <div className="claim-avatar">
                    {item.claimant
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="queue-name">
                    <b>{item.claimant}</b>
                    <span>
                      {item.category} · {item.date}
                    </span>
                  </div>
                  <div className="queue-value">
                    <b>{money(item.amount, item.currency)}</b>
                    <Badge status={item.status} />
                  </div>
                  <span className="arrow">›</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              ✓ Everything is up to date. No claims need review.
            </div>
          )}
        </div>
        <div className="card policy-card">
          <Icon tone="purple">✦</Icon>
          <p className="eyebrow">POLICY INTELLIGENCE</p>
          <h2>Every review is grounded in policy.</h2>
          <p>
            AI classifies descriptions; deterministic checks handle receipts,
            limits, dates and duplicates.
          </p>
          <div>
            <span>5</span> active policy sections <i>·</i> human decision
            required
          </div>
        </div>
      </section>
      <section className="card recent-card" id="recent">
        <div className="card-heading">
          <div>
            <h2>All claims</h2>
            <p>Most recent submissions across your workspace</p>
          </div>
          <span className="count-pill">{claims.length} total</span>
        </div>
        {claims.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CLAIMANT</th>
                  <th>DATE</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {claims.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-person">
                        <span className="mini-avatar">{item.claimant[0]}</span>
                        <div>
                          <b>{item.claimant}</b>
                          <small>Claim #{item.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <span className="category-tag">{item.category}</span>
                    </td>
                    <td>
                      <b>{money(item.amount, item.currency)}</b>
                    </td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => open(item.id)}
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No claims have been submitted yet.</div>
        )}
      </section>
    </>
  );
}

function ClaimForm({ saved, cancel }) {
  const [form, setForm] = useState({
    claimant: "",
    date: new Date().toISOString().slice(0, 10),
    category: "Travel",
    amount: "",
    currency: "INR",
    description: "",
    receiptAvailable: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      saved(
        await api("/api/claims", {
          method: "POST",
          body: JSON.stringify(form),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="form-layout">
      <div className="form-intro">
        <button className="back-button" onClick={cancel}>
          ← Back to claims
        </button>
        <h2>Tell us about the expense.</h2>
        <p>
          We’ll run policy checks and prepare a review. A human reviewer always
          makes the final decision.
        </p>
        <div className="process-list">
          <span>
            <i>1</i> Claim details
          </span>
          <span>
            <i>2</i> Policy checks
          </span>
          <span>
            <i>3</i> Human decision
          </span>
        </div>
      </div>
      <form className="claim-form card" onSubmit={submit}>
        <div className="form-head">
          <div>
            <p className="eyebrow">CLAIM DETAILS</p>
            <h2>New expense claim</h2>
          </div>
          <span className="required-key">* Required</span>
        </div>
        {error && <div className="inline-error">{error}</div>}
        <div className="fields">
          <Field label="Claimant name" required>
            <input
              name="claimant"
              value={form.claimant}
              onChange={update}
              placeholder="e.g. Priya Nair"
              required
              autoFocus
            />
          </Field>
          <Field label="Expense date" required>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={update}
              required
            />
          </Field>
          <Field label="Policy category" required>
            <select name="category" value={form.category} onChange={update}>
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount" required>
            <div className="amount-input">
              <span>₹</span>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={update}
                placeholder="0.00"
                required
              />
            </div>
          </Field>
          <Field label="Currency" required>
            <select name="currency" value={form.currency} onChange={update}>
              <option>INR</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
          <Field label="Receipt">
            <label className="receipt-toggle">
              <input
                name="receiptAvailable"
                type="checkbox"
                checked={form.receiptAvailable}
                onChange={update}
              />
              <span />
              <b>{form.receiptAvailable ? "Available" : "Not available"}</b>
            </label>
          </Field>
          <Field label="Description and business purpose" required wide>
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              placeholder="Describe what was purchased and why it was needed for business…"
              required
            />
            <small>Be specific—this helps the policy review be accurate.</small>
          </Field>
        </div>
        <div className="form-footer">
          <button type="button" className="ghost" onClick={cancel}>
            Cancel
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Submitting and reviewing…" : "Submit for review →"}
          </button>
        </div>
      </form>
    </section>
  );
}
function Field({ label, required, wide, children }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {children}
    </label>
  );
}

function Review({ claim, back, refresh, announce }) {
  const [panel, setPanel] = useState("");
  const [reason, setReason] = useState("");
  const [classification, setClassification] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!claim) return <div className="skeleton table-skeleton" />;
  const review = claim.review || {};
  const checks = review.deterministic_results || [];
  const save = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const override = action === "override";
      await api(
        `/api/claims/${claim.id}/${override ? "override" : "decision"}`,
        {
          method: "POST",
          body: JSON.stringify(
            override
              ? { classification, reason }
              : { action: panel || "APPROVE", reason },
          ),
        },
      );
      setPanel("");
      setReason("");
      await refresh();
      announce({
        type: "success",
        text: override
          ? "Classification updated and recorded in history."
          : "Reviewer decision saved successfully.",
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const show = (type) => {
    setPanel(type);
    setReason("");
    setError("");
    if (type === "override") setClassification(review.classification || "");
  };
  const finalized = ["APPROVED", "REJECTED"].includes(claim.status);
  return (
    <>
      <button className="back-button review-back" onClick={back}>
        ← Back to claims
      </button>
      <section className="review-header">
        <div>
          <div className="review-title">
            <span className="claim-number">#{claim.id}</span>
            <Badge status={claim.status} />
          </div>
          <h2>{claim.claimant}’s expense claim</h2>
          <p>
            Submitted{" "}
            {new Date(claim.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="review-amount">
          <small>CLAIM AMOUNT</small>
          <strong>{money(claim.amount, claim.currency)}</strong>
        </div>
      </section>
      <div className="review-layout">
        <div className="review-main">
          <section className="card detail-card">
            <h2>Expense details</h2>
            <div className="detail-grid">
              <Detail label="Claimant" value={claim.claimant} />
              <Detail label="Expense date" value={claim.date} />
              <Detail label="Submitted category" value={claim.category} />
              <Detail
                label="Receipt"
                value={claim.receiptAvailable ? "Available" : "Not available"}
                tone={claim.receiptAvailable ? "good" : "risk"}
              />
            </div>
            <div className="description-box">
              <small>DESCRIPTION & BUSINESS PURPOSE</small>
              <p>{claim.description}</p>
            </div>
          </section>
          <section className="card analysis-card">
            <div className="section-label">
              <Icon tone="purple">✦</Icon>
              <div>
                <p className="eyebrow">AI-ASSISTED ANALYSIS</p>
                <h2>Policy review</h2>
              </div>
              {review.provider === "fallback" && (
                <span className="local-badge">Local analysis</span>
              )}
            </div>
            <div className={`review-recommendation ${String(review.status || "").toLowerCase()}`}>
              <span>REVIEW RECOMMENDATION</span>
              <b>{label(review.status || "REQUIRES_REVIEW")}</b>
            </div>
            {review.provider === "unavailable" ? (
              <div className="inline-error">
                AI review is unavailable. Use deterministic findings and policy
                evidence for manual review.
              </div>
            ) : (
              <>
                <div className="classification">
                  <div>
                    <small>RECOMMENDED CLASSIFICATION</small>
                    <strong>{review.classification || "Unavailable"}</strong>
                  </div>
                  {review.confidence !== null &&
                    review.confidence !== undefined && (
                      <div className="confidence-ring">
                        <b>{Math.round(review.confidence * 100)}%</b>
                        <span>confidence</span>
                      </div>
                    )}
                </div>
                {review.uncertain && (
                  <div className="warning-box">
                    ! Uncertain classification — reviewer attention required.
                  </div>
                )}
                <p className="analysis-copy">{review.explanation}</p>
              </>
            )}
            <h3>Policy evidence</h3>
            {review.policyEvidence ? (
              <div className="evidence">
                <div>
                  <span>{review.policyEvidence.id}</span>
                  <b>{review.policyEvidence.title}</b>
                </div>
                <p>“{review.policyEvidence.description}”</p>
                <small>{review.policyEvidence.conditions}</small>
              </div>
            ) : (
              <div className="warning-box">
                No policy evidence was available for this classification.
              </div>
            )}
          </section>
          <section className="card checks-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">RULE-BASED CONTROLS</p>
                <h2>Deterministic checks</h2>
              </div>
              {checks.length ? (
                <span className="risk-count">
                  {checks.length} issue{checks.length > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="pass-badge">✓ Passed</span>
              )}
            </div>
            {checks.length ? (
              <div className="finding-list">
                {checks.map((item) => (
                  <div className="finding" key={item.type}>
                    <span>!</span>
                    <div>
                      <b>{item.message}</b>
                      <p>{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="clear-checks">
                No receipt, category limit, duplicate or date issues were found.
              </p>
            )}
            {review.missing_information?.length > 0 && (
              <div className="missing-info">
                <b>Information needed</b>
                <ul>
                  {review.missing_information.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
        <aside className="review-side">
          <section className="card decision-card">
            <p className="eyebrow">REVIEWER ACTION</p>
            <h2>{finalized ? "Decision completed" : "Make a decision"}</h2>
            <p>
              {finalized
                ? `This claim is ${label(claim.status)}. Its decision history remains available below.`
                : "You remain in control of the final outcome."}
            </p>
            {!finalized && (
              <>
                <button
                  className="approve"
                  onClick={() => save("approve")}
                  disabled={busy}
                >
                  ✓ Approve claim
                </button>
                <button
                  className="action-secondary"
                  onClick={() => show("REQUEST_CLARIFICATION")}
                >
                  Request clarification
                </button>
                <button
                  className="action-secondary danger"
                  onClick={() => show("REJECT")}
                >
                  Reject claim
                </button>
                <button
                  className="text-button override-button"
                  onClick={() => show("override")}
                >
                  Override AI classification →
                </button>
              </>
            )}
            {panel && (
              <div className="action-drawer">
                <h3>
                  {panel === "override"
                    ? "Override classification"
                    : label(panel)}
                </h3>
                {panel === "override" && (
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                  >
                    <option value="">Select policy category</option>
                    {categories.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                )}
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    panel === "REQUEST_CLARIFICATION"
                      ? "What information do you need?"
                      : "Reason is required"
                  }
                />
                {error && <p className="inline-error">{error}</p>}
                <button
                  className="primary full"
                  disabled={busy}
                  onClick={() =>
                    save(panel === "override" ? "override" : "decision")
                  }
                >
                  {busy ? "Saving…" : "Confirm action"}
                </button>
              </div>
            )}
          </section>
          <section className="card timeline-card">
            <p className="eyebrow">AUDIT TRAIL</p>
            <h2>Decision history</h2>
            <ol>
              {claim.history?.map((event) => (
                <li key={event.id}>
                  <span className="timeline-dot" />
                  <div>
                    <b>{label(event.action)}</b>
                    <small>
                      {event.actor} ·{" "}
                      {new Date(event.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </small>
                    {event.reason && <p>{event.reason}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
function Detail({ label: heading, value, tone }) {
  return (
    <div>
      <small>{heading}</small>
      <b className={tone}>{value}</b>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
