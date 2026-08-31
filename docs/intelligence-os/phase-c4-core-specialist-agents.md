# Phase C4 core specialist agents

## Outcome

Five v1 agents are implemented as typed deterministic functions rather than registrations or prose placeholders. They are disabled by default, require no OpenAI key, do not persist private reasoning, expose no mutation tools, and emit only structured operational artifacts suitable for later durable workflow persistence.

| Agent | Input truth | Structured output | Hard boundary |
| --- | --- | --- | --- |
| Revenue Agent | Normalized `MetricSnapshot` current/comparison periods | Metric, current/comparison values, defensible delta, confidence, data-quality state, evidence, optional evidenced driver, follow-up | Unknown remains null; ActiveCampaign is never financial or paid-status authority |
| Growth Agent | Normalized daily metrics plus Revenue output | Current/prior week and trailing 4/12 week comparisons, category, coverage/confidence, durable anomalies/signals | Does not calculate financial truth or claim causation |
| Industry Intelligence Agent | Deterministic fixture or explicitly approved read-only observations | Publication/event dates, provenance, confidence, relevance, segment, risk, licensing caveat, follow-up, routed signals | No implicit live research, copied source text, paid-source use, or prose-only brief |
| Marketing Agent | Revenue, Growth, read-only marketing metrics, lifecycle signals | Recommendations, experiments, identifier-free audiences, internal copy, proposed actions | No financial-success declaration, ActiveCampaign mutation, direct contact identifiers, or unapproved send |
| Operations Orchestrator | Typed specialist inputs plus persisted signals, metrics, experiments, tasks, prior actions | Up to three priorities, task/experiment/action drafts, Autumn decisions, persisted operational state | Enforces action policy, attaches no executor, and stays quiet when no material evidence exists |

## Revenue data-quality behavior

Revenue Agent computes a delta only when both periods have a numeric normalized value and the same unit. `unknown` and `not_applicable` remain null. Partial inputs retain their numeric observation but are marked partial. Missing comparisons, unit mismatches, and non-authoritative sources are explicit states rather than zeros.

Financial metrics sourced from ActiveCampaign are withheld as `non_authoritative`, even when they contain a number. Likely drivers remain null unless the caller supplies an explicit driver hint with source references.

## Growth comparison behavior

Growth Agent uses UTC date windows ending on `currentWeekEnd`:

- Current week: 7 days.
- Prior week: preceding 7 days.
- Trailing four weeks: 28 days.
- Trailing twelve weeks: 84 days.

Daily sum/average series record observed versus expected days and reduce confidence for incomplete coverage. Snapshot series use the latest observation in the window. An anomaly requires numeric current/prior values, at least 0.5 comparison confidence, the configured absolute threshold, and the configured relative threshold when a percent change is defined. A prior value of zero never creates an invented percentage.

## Industry provenance behavior

Every observation requires a stable observation/source ID, HTTPS source URI, publisher, publication date, optional event date, confidence, business relevance, affected segment, risk, licensing caveat, and recommended follow-up. High/critical relevance or risk creates a source-linked `industry.high_value_observation` signal for the Orchestrator. The deterministic path never fetches a URL; approved read-only live research remains an extension gate.

## Marketing and approval behavior

Marketing Agent can propose a lifecycle routing review, record an experiment proposal, or draft internal copy. ActiveCampaign proposals use the existing fail-closed action policy, remain `proposed`, require approval, carry no executor, and declare `mutationAllowed: false`. Audience definitions contain aggregate rules and explicit exclusions, never emails or direct contact IDs.

Revenue is included as an input dependency and named as the financial-truth agent. Marketing output permanently records `financialSuccessDeclared: false` and `activeCampaignMutationPerformed: false`.

## Orchestrator behavior

The Orchestrator invokes Revenue first, Growth with Revenue output, Industry independently, and Marketing with Revenue/Growth output. Missing typed dependencies produce a blocked state. It combines unresolved persisted and new specialist signals, deduplicates by fingerprint, applies priority/confidence/severity scoring, and returns no more than three priorities even if a larger limit is requested.

Each priority without an existing open task produces a pending task draft whose correlation ID matches the originating signal and whose causation ID is that signal ID. Persisted normalized metrics are merged into Growth input by metric idempotency key. Existing active experiments and nonterminal actions suppress duplicate proposals. Proposed actions are checked against the action policy; any attached executor, execution timestamp, or policy mismatch fails closed. Only consequential action approvals and exceptionally high-priority evidence reviews become Autumn decisions.

Operational state is written through `OperationsOrchestratorStateStore`. The C4 in-memory implementation verifies idempotent reuse and rejects a changed state under the same key. C5 will attach this state contract to the durable workflow persistence path.

## Persistable record shape

Every deterministic agent result contains:

- Status, summary, structured data, concise rationale, correlation and causation.
- Evidence and stable source references.
- Durable signals, recommendations, proposed actions, and explicit Autumn decisions.
- Tool summaries when a bounded tool is later used.
- Null token usage and cost when no model is called.
- `modelUsed: false` and `mutationsPerformed: false`.

No field exists for chain-of-thought or private reasoning.

## Validation

From `apps/agent-runtime`:

```text
npm run format:check
npm run specialists:check
npm run typecheck
npm test
```

The focused suite proves unknown revenue preservation, ActiveCampaign authority rejection, all four Growth windows, high-value industry routing, proposal-only Marketing output, three-priority Orchestrator ranking, idempotent state persistence, quiet healthy behavior, and inactive paid-access detection.
