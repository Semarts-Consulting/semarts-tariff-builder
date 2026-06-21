export function normaliseImportHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function parseRequiredImportNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

export function createImportedRowId(prefix: string, index: number) {
  return `${prefix}-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateImportHeaders(expectedHeaders: string[], headerRow: unknown[]) {
  return expectedHeaders.every(
    (header, index) => normaliseImportHeader(headerRow[index]) === normaliseImportHeader(header)
  );
}
