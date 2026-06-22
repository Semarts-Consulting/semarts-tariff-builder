# MVP Stakeholder Demo Preparation

Date: 2026-06-22

Status: in progress; rehearsal notes prepared.

Purpose: prepare a focused stakeholder walkthrough for the accepted-with-limitations internal MVP candidate without expanding MVP scope.

## Demo Objective

Show that the application can support a commercial review of a private electricity network tariff methodology by making the input, allocation, calculation, audit trace, output, and reconciliation understandable.

The demo should not present the MVP as externally release-ready or as a formal export/reporting product.

## Recommended Walkthrough

1. Open the demo project and confirm project context.
2. Review customer groups, annual consumption, customer counts, and peak demand.
3. Review recoverable cost pools and recoverable percentages.
4. Review allocation methods by cost category, including any review indicators.
5. Review tariff calculation outputs by customer group.
6. Review audit trace entries that explain the calculation steps.
7. Review revenue recovery and variance.
8. Open the report view and explain that it is a stakeholder-reviewable output, not a stable export data contract.
9. Close with accepted limitations and next decisions.

## Evidence To Use

- PRs #1 through #10 merged to `main`.
- Representative scenario reconciles GBP 45,000 recoverable cost to GBP 45,000 allocated cost.
- Manual demo path accepted by the user on 2026-06-22.
- Internal MVP candidate accepted with limitations on 2026-06-22.
- Latest recorded full checks passed before the docs-only decision package:
  - `npm.cmd run lint`
  - `npx.cmd tsc --noEmit --incremental false`
  - `npm.cmd test`
  - `npm.cmd run build`

## Message Discipline

Use these terms:

- Internal MVP candidate.
- Accepted with limitations.
- Stakeholder-reviewable report view.
- Formal export DTO out of scope.
- Supply calculation deferred pending business rules.

Avoid these claims:

- Production-ready external release.
- Ofgem compliance certified.
- Formal export contract complete.
- Supply calculation complete.
- All tariff scenarios covered.

## Limitations To State

- The representative scenario covers one site and three customer groups.
- Formal machine-readable export DTOs are outside MVP scope.
- Formal report/export audit trace remains post-MVP or MVP+.
- Supply calculation remains deferred until business assumptions are resolved.
- Broader UI/browser regression evidence is still required before external release readiness.
- Additional representative and stakeholder-specific tariff scenarios should be added after the internal MVP candidate decision.

## Support Needed

- User to confirm the stakeholder-demo audience and expected depth.
- User to confirm whether the demo should focus on business sign-off, investor/ExCo confidence, or operational user workflow.
- PM to split any feedback into narrow post-MVP packages rather than expanding the demo scope.

## Rehearsal Material

Use `docs/MVP_DEMO_REHEARSAL_NOTES.md` as the short presenter script and question guide.
