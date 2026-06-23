# Known Limitations Register

| ID | Limitation | Impact | Risk | Current Workaround | MVP Accepted | Needs Implementation | Owner | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LIM-SM-001 | Site submeter location is free text | Weak grouping and audit trace for location-level allocation | High | Use consistent naming and validation review | Yes | Yes | Data/UI plus PM | High |
| LIM-SM-002 | Tenant linkage is text, not a customer record relationship | Tenant totals can drift from customer-class inputs | High | Validate tenant names manually | Yes | Yes | Data/UI plus PM | High |
| LIM-SM-003 | Submeter consumption is not tariff-impacting | Tariff outputs still use aggregate customer-class inputs | Medium | Keep aggregate path explicit | Yes | Yes, after approval | Tariff Engine | High |
| LIM-SM-004 | Non-HH consumption is not profiled | TLM and HH-dependent calculations cannot use monthly/quarterly/annual data | Medium | Use aggregate totals only | Yes | Decision needed | PM plus Tariff Engine | High |
| LIM-SM-005 | TLM source is not fully automated | Manual or structured import needed | Medium | Import reviewed TLM data | Yes | Yes, after source confirmation | Data Import | Medium |
| LIM-SM-006 | Local storage is not suitable for large HH datasets | Performance and data-loss risk at production scale | High | Use small MVP datasets | Yes for MVP | Yes before production scale | Data/storage | High |
| LIM-SM-007 | Responsibility allocation rules are provisional | Categories cannot safely drive tariff denominators yet | High | Treat as evidence only | Yes | Yes, after methodology approval | PM plus Tariff Engine | High |
| LIM-SM-008 | Reconciliation is service-level only | Not yet visible in reports or calculation workflow | Medium | Use tests/service output | Yes | Yes | UI plus QA | Medium |
| LIM-SM-009 | Loss-adjusted consumption is service-level only | Not yet surfaced in UI/report and not tariff-impacting | High | Keep raw and adjusted values separate in tests | Yes | Yes, after methodology approval | Tariff Engine plus UI | High |
| LIM-SM-010 | Import templates are not downloadable from the UI yet | Users need documented headers or manually prepared files | Medium | Use documented headers | Yes short-term | Yes | Data Import plus UI | Medium |

## Closeout Rule

A limitation can only be closed when:

- The implementation is complete.
- Tests cover the accepted behaviour.
- Documentation or UI explains the behaviour.
- Any methodology-impacting decision has been approved.
