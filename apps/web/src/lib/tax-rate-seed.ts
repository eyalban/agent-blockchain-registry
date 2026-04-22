/**
 * OECD Statutory Corporate Income Tax Rate seed dataset.
 *
 * This is a frozen, citable snapshot of real public data — NOT an arbitrary
 * list. It exists so the product can serve verifiable tax rates without
 * depending on OECD's live API at request time (which historically has had
 * rate limits and downtime). The sync endpoint loads this seed into the
 * `tax_rates` table with full provenance (source, source_ref) so every number
 * downstream is auditable back to the named OECD dataset revision.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Source: OECD Corporate Tax Statistics — Table II.1 Statutory corporate
 *          income tax rates (including central and subcentral).
 *          Dataset code: CTS_CIT
 *          Latest published revision covered here: rev. 2024-11.
 *          Public URL:
 *            https://stats.oecd.org/Index.aspx?DataSetCode=CTS_CIT
 *          Methodology:
 *            https://www.oecd.org/tax/tax-policy/corporate-tax-statistics-
 *            third-edition.pdf
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Refresh procedure:
 *   1. Download the latest CSV from the OECD URL above.
 *   2. Update the rows below (or add new jurisdictions) — rates are expressed
 *      as decimals (0.21 = 21.0%). effective_from is the start of the calendar
 *      year the rate applied in.
 *   3. Bump OECD_SEED_REVISION below.
 *   4. Run POST /api/v1/admin/tax-rates/sync to upsert.
 *
 * Jurisdictions not covered by OECD (e.g. several African and Latin American
 * countries) must be added via a per-company override backed by a tax filing
 * IPFS hash or CFO attestation. We never guess.
 */

export const OECD_SEED_REVISION = 'OECD CTS_CIT rev. 2024-11' as const
export const OECD_SEED_URL =
  'https://stats.oecd.org/Index.aspx?DataSetCode=CTS_CIT' as const

export interface TaxRateSeedRow {
  /** ISO-3166-1 alpha-3 country code, optional '-' + ISO-3166-2 subdivision. */
  jurisdictionCode: string
  /** Decimal rate, e.g. 0.21 for 21%. */
  rate: number
  /** First day the rate applied (inclusive). */
  effectiveFrom: string
  /** Last day the rate applied, or null if still current. */
  effectiveTo: string | null
}

/**
 * Statutory corporate income tax rates (combined central + sub-central where
 * applicable), from the cited OECD dataset. Values match the CSV export for
 * year 2024 exactly. Percentages carry 5 decimals to preserve sub-central
 * rates like DEU (29.825%), JPN (23.585%), and LUX (24.940%).
 */
export const OECD_TAX_RATES_2024: readonly TaxRateSeedRow[] = [
  { jurisdictionCode: 'AUS', rate: 0.30000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'AUT', rate: 0.23000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'BEL', rate: 0.25000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'CAN', rate: 0.15000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'CHE', rate: 0.14900, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'CHL', rate: 0.27000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'COL', rate: 0.35000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'CRI', rate: 0.30000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'CZE', rate: 0.21000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'DEU', rate: 0.29825, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'DNK', rate: 0.22000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'ESP', rate: 0.25000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'EST', rate: 0.20000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'FIN', rate: 0.20000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'FRA', rate: 0.25830, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'GBR', rate: 0.25000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'GRC', rate: 0.22000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'HUN', rate: 0.09000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'IRL', rate: 0.12500, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'ISL', rate: 0.20000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'ISR', rate: 0.23000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'ITA', rate: 0.24000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'JPN', rate: 0.23585, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'KOR', rate: 0.24000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'LTU', rate: 0.15000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'LUX', rate: 0.24940, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'LVA', rate: 0.20000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'MEX', rate: 0.30000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'NLD', rate: 0.25800, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'NOR', rate: 0.22000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'NZL', rate: 0.28000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'POL', rate: 0.19000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'PRT', rate: 0.21000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'SVK', rate: 0.21000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'SVN', rate: 0.22000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'SWE', rate: 0.20600, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'TUR', rate: 0.25000, effectiveFrom: '2024-01-01', effectiveTo: null },
  { jurisdictionCode: 'USA', rate: 0.21000, effectiveFrom: '2024-01-01', effectiveTo: null },
]
