# Elexon TLM Source Review

## Current Position

The application now supports Transmission Loss Multiplier input through:

- Structured Excel import.
- Manual table entry.
- A generic structured JSON refresh service.

This is acceptable for MVP because it avoids fragile screen scraping and keeps TLM data visible, auditable and manually reviewable.

## Source Limitation

The Elexon developer portal describes public production-grade APIs and structured CSV/XML/JSON dataset endpoints. The currently inspected public dataset list did not show an obvious Transmission Loss Multiplier endpoint.

This means the application should not yet assume a final automated Elexon TLM source.

## Supported Fields

Current TLM records support:

- Settlement date.
- Settlement period.
- Transmission loss multiplier.
- GSP group.
- Effective from date.
- Source.
- Retrieved at timestamp.
- Version or run reference.
- Import batch and row fingerprint.

## Scraping Risk

Screen scraping should not be implemented unless explicitly approved because:

- Portal HTML can change without notice.
- Scraped source provenance is weaker than structured API or file import.
- Refresh failures could silently create data gaps.
- It is harder to audit exact source definitions.

## Future Automated Refresh Requirements

Before automation:

1. Confirm authoritative Elexon dataset or feed.
2. Confirm field names and units.
3. Confirm GSP group handling.
4. Confirm settlement period range, including clock-change days.
5. Confirm version/run reference.
6. Confirm expected refresh frequency.
7. Add tests against representative source payloads.
8. Keep manual import fallback.

## Recommended Future Implementation

Use a dedicated service layer that:

- Fetches from the confirmed structured source.
- Normalises rows into the existing TLM input shape.
- Preserves source URL, retrieval timestamp and version.
- Reports missing or malformed rows.
- Does not overwrite reviewed TLM records without clear user action.

## MVP Recommendation

Keep manual/structured import as the MVP route. Do not automate Elexon retrieval or scrape web pages until the authoritative feed is confirmed.
