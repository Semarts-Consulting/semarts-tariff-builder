# Storage And Persistence Review

## Current Storage Approach

The application currently stores project data and methodology inputs through the existing local project storage pattern. This is suitable for MVP workflows, review demos and controlled input capture.

## Data Volume Risk

Half-hourly submeter records can grow quickly:

- 48 settlement periods per day.
- 17,520 settlement periods per meter per non-leap year.
- 100 meters creates 1,752,000 settlement-period values per year.
- Multiple years or many sites will exceed practical browser storage and UI rendering limits.

## Browser Storage Limits

Browser local storage is not suitable as a long-term production store for high-volume half-hourly records. Risks include:

- Storage quota limits.
- Slow serialisation and deserialisation.
- Data loss if browser data is cleared.
- Poor multi-user support.
- Weak audit history.

## Performance Risk

Large datasets can affect:

- Page load time.
- Table rendering.
- Validation execution.
- Import merge behaviour.
- Report generation.

Large half-hourly data should be paged, filtered and processed outside React render paths.

## Audit Trail Risk

Production tariff methodology support needs a durable audit trail for:

- Source file identity.
- Import batch.
- Row fingerprints.
- Manual edits.
- Validation status changes.
- Reviewer approval.
- Calculation source records.

Local storage alone is not sufficient for production auditability.

## Recommended MVP Approach

For MVP:

- Keep local storage for controlled demos and low-volume examples.
- Keep source metadata and row fingerprints.
- Add validation and reconciliation as pure services.
- Avoid loading very large HH datasets into visible tables all at once.
- Document storage limitations clearly.

## Recommended Scalable Approach

For production:

- Move high-volume interval data to database-backed persistence.
- Store settlement-period rows in a queryable table or equivalent structured store.
- Store import batches and source metadata separately.
- Add server-side validation jobs for large imports.
- Add pagination and filtering to UI.
- Keep local storage as a demo/offline fallback only if required.

## Decision Needed Before Production Scale

Approve whether high-volume submeter and TLM data should move to database-backed persistence before external production use.
