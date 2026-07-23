/**
 * Stable, locale-neutral API error messages for production.
 * Clients should map known codes via i18n; these English strings
 * are the safe public fallback when a locale cannot be resolved.
 */

export const ApiError = {
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_DUPLICATE_FAILED: 'Project could not be duplicated',
  PROJECT_SAVE_FAILED: 'Project could not be saved',
  PROJECT_DELETE_FAILED: 'Project could not be deleted',
  PROJECT_LIST_FAILED: 'Projects could not be loaded',
  EXPORT_CSV_FAILED: 'CSV export failed',
  EXPORT_XLSX_FAILED: 'Excel export failed',
  EXPORT_PDF_FAILED: 'PDF export failed',
  ANALYSIS_FAILED: 'Analysis could not be completed',
  MARKET_FETCH_FAILED: 'Market data could not be loaded',
  MASTER_NOT_FOUND: 'Record not found',
  MASTER_LIST_FAILED: 'Catalog could not be loaded',
  MASTER_CREATE_FAILED: 'Record could not be created',
  MASTER_UPDATE_FAILED: 'Record could not be updated',
  MASTER_DELETE_FAILED: 'Record could not be deleted',
  MASTER_READ_FAILED: 'Record could not be read',
  MASTER_INVALID: 'Invalid data',
  MASTER_DUPLICATE_CODE: 'This code is already in use',
  MASTER_DUPLICATE_MODEL: 'This manufacturer and model already exist in the catalog',
  DEMO_ENSURE_FAILED: 'Demo projects could not be prepared',
  CATALOG_ENSURE_FAILED: 'Catalog could not be prepared',
  AI_UNAVAILABLE: 'AI analysis service did not respond',
  AI_CREDIT_LIMIT: 'AI analysis credit limit reached. Please try again later.',
  AI_STREAM_ERROR: 'Stream error',
  SERVER_ERROR: 'Server error',
  VALIDATION_FAILED: 'Validation failed',
  FORBIDDEN: 'This action is not allowed',
} as const;

export type ApiErrorMessage = (typeof ApiError)[keyof typeof ApiError];

/** Safe public message — never leak internal/Prisma details to clients. */
export function publicErrorMessage(
  _error: unknown,
  fallback: ApiErrorMessage = ApiError.SERVER_ERROR
): string {
  return fallback;
}
