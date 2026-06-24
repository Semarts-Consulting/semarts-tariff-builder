# Known Limitations Register

| ID | Limitation | Impact | Risk | Current Workaround | MVP Accepted | Needs Implementation | Owner | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LIM-SM-001 | Site submeter location is free text | Weak grouping and audit trace for location-level allocation | High | Use consistent naming and validation review; future hierarchy should mirror Semarts Utilityhub | Yes | Yes | Data/UI plus PM | High |
| LIM-SM-002 | Tenant linkage is text, not a customer record relationship | Tenant totals can drift from customer-class inputs | High | Validate tenant names manually | Yes | Yes | Data/UI plus PM | High |
| LIM-SM-003 | Submeter consumption is not tariff-impacting | Tariff outputs still use aggregate customer-class inputs | Medium | Keep aggregate path explicit | Yes | Yes, after approval | Tariff Engine | High |
| LIM-SM-004 | Non-HH consumption is not profiled | TLM and HH-dependent calculations cannot use monthly/quarterly/annual data | Medium | Use aggregate totals only | Yes | Decision needed | PM plus Tariff Engine | High |
| LIM-SM-005 | TLM source is not fully automated | Manual or structured import needed | Medium | Import reviewed TLM data | Yes | Yes, after source confirmation | Data Import | Medium |
| LIM-SM-006 | Local storage is not suitable for large HH datasets | Performance and data-loss risk at production scale | High | Use small MVP datasets | Yes for MVP | Yes before production scale | Data/storage | High |
| LIM-SM-007 | Responsibility allocation rules are provisional | Categories cannot safely drive tariff denominators yet | High | Treat as evidence only | Yes | Yes, after methodology approval | PM plus Tariff Engine | High |
| LIM-SM-008 | Reconciliation is evidence-only | Reconciliation is visible in reports but does not alter tariff denominators or recovery | Medium | Use report evidence and tests for review; keep aggregate tariff path explicit | Yes | Yes, before tariff-impacting use | UI plus QA | Medium |
| LIM-SM-009 | Loss-adjusted consumption is evidence-only | Loss-adjusted evidence is visible in reports but not tariff-impacting | High | Keep raw and adjusted values separate in report evidence and tests | Yes | Yes, after methodology approval | Tariff Engine plus UI | High |
| LIM-SM-010 | Import templates and append imports are available, but import review remains manual | Users must review duplicate register, consumption, and TLM rows after import | Medium | Import review messages now show duplicate summary counts and detailed warnings | Yes short-term | Yes, for richer review workflow | Data Import plus UI | Medium |
| LIM-SM-011 | Utilityhub hierarchy mapping is evidence-only | Submeters can be reviewed against Utilityhub-style hierarchy evidence, but no IDs are persisted to methodology records | High | Use mapping readiness panels and report evidence for review | Yes | Yes, after shared hierarchy contract approval | Data/UI plus PM | High |
| LIM-SM-012 | Asset evidence is not production valuation | Asset values can be reviewed in reports but do not calculate annuity, depreciation or tariff recovery automatically | High | Keep asset values as evidence unless separately represented as approved cost pools | Yes | Yes, after asset methodology approval | Tariff Engine plus PM | High |
| LIM-SM-013 | Methodology cost workbook inputs are evidence-only | Direct cost, employee cost, and overhead rows can be reviewed in inputs and reports but do not automatically create recoverable cost pools or tariff allocations | High | Keep cost pool and allocation inputs as the approved tariff-driving path; use methodology cost readiness as supporting evidence | Yes | Yes, after methodology configuration and cost-pool mapping approval | PM plus Tariff Engine/Data Import | High |

## Closeout Rule

A limitation can only be closed when:

- The implementation is complete.
- Tests cover the accepted behaviour.
- Documentation or UI explains the behaviour.
- Any methodology-impacting decision has been approved.
