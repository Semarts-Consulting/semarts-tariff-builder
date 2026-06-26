# MVP Limitations Closeout

Date: 2026-06-22

Status: prepared.

Purpose: convert the accepted limitations for the internal MVP candidate into a controlled follow-up backlog.

## Closeout Position

The internal MVP candidate is accepted with limitations. None of the limitations below blocks stakeholder-demo preparation, provided the demo language stays clear that this is not an external release or formal compliance certification.

External release readiness requires additional evidence and decisions.

## Limitation Register

| ID | Limitation | Owner | Priority | Blocks stakeholder demo? | Blocks external release? | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| LIM-001 | Representative scenario covers one site and three customer groups only | PM plus QA | High | No | Yes | Use `docs/ADDITIONAL_SCENARIO_PLAN.md` to sequence additional representative and stakeholder-specific scenarios |
| LIM-002 | Formal machine-readable export DTOs are outside MVP scope | PM plus UI/Engine | Medium | No | To decide | Confirm whether the next commercial milestone needs a stable export data contract |
| LIM-003 | Formal report/export audit trace remains post-MVP or MVP+ | PM plus UI/Engine | Medium | No | To decide | Decide whether formal export audit trace is required before external release |
| LIM-004 | Supply tariff integration is deferred pending allocation and pass-through decisions | PM plus Tariff Engine | High | No, if stated clearly | Yes, if supply tariffs are in release scope | Phase 2 annual amounts are merged; resolve allocation destination and pass-through treatment before feeding supply values into tariff outputs |
| LIM-005 | Browser print/PDF and rendered HTML download are stakeholder outputs, not stable export contracts | PM plus UI | Medium | No | To decide | Keep report view as MVP output; design export separately if needed |
| LIM-006 | Local/cloud storage reconciliation failure cases need broader coverage | Data/storage plus QA | Medium | No | Yes | Add targeted failure-path tests before external release |
| LIM-007 | Broader UI/browser regression evidence is still required | UI plus QA | Medium | No | Yes | Add route/browser checks and screenshot evidence for release candidate |
| LIM-008 | Cross-form save-blocking validation policy remains unresolved | PM plus workstream leads | High | No | Yes | Decide when validation blocks save, report approval, or export |
| LIM-009 | UtilityHub selector API stubs are not live UtilityHub integration | PM plus UtilityHub/UI | High | No | Yes, if live UtilityHub data is required | Confirm endpoint/auth/session handling before replacing controlled unavailable stub states with live selector calls |

## Demo Guardrails

The stakeholder demo can proceed if these statements are made clearly:

- This is an internal MVP candidate.
- It is accepted with limitations.
- It supports commercial review of methodology logic and reconciliation.
- It is not an external release commitment.
- It is not formal compliance certification.
- Formal export contracts and production supply calculation remain separate follow-up decisions.

## Recommended Next Packages

1. Demo delivery and feedback capture.
2. Additional scenario definition.
3. Supply tariff integration decision pack.
4. Report/export DTO decision pack.
5. Release-readiness regression pack.

## Manager Decision

Do not start supply tariff integration or formal export DTO implementation until the stakeholder-demo audience and next commercial milestone are confirmed. Supply Phase 2 annual amount calculation is merged only inside the disconnected supply service; allocation destination and pass-through treatment remain the gate for tariff-output integration.
