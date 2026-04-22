/**
 * Tax-rate resolver.
 *
 * Every income-statement tax line in the product resolves against the
 * `tax_rates` table through this module. There is no fallback hardcoded rate
 * anywhere — if nothing is resolvable, the caller must surface
 * "Tax rate source required" in the UI.
 *
 * Lookup precedence at `asOf`:
 *   1. Company override       (rate_type='override',  company_id IS NOT NULL)
 *   2. Company effective rate (rate_type='effective', company_id IS NOT NULL)
 *   3. Jurisdiction statutory (rate_type='statutory', company_id IS NULL)
 */

import { sql } from './db'

export type TaxRateType = 'statutory' | 'effective' | 'override'
export type TaxRateSource = 'oecd' | 'tax_foundation' | 'company_filing' | 'cfo_attested'

export interface ResolvedTaxRate {
  rate: number
  rateType: TaxRateType
  jurisdictionCode: string
  source: TaxRateSource
  sourceRef: string
  effectiveFrom: string
  effectiveTo: string | null
  companyScoped: boolean
  submittedBy: string | null
  submittedAt: string
}

interface TaxRateRow {
  rate: string
  rate_type: TaxRateType
  jurisdiction_code: string
  source: TaxRateSource
  source_ref: string
  effective_from: string
  effective_to: string | null
  company_id: string | null
  submitted_by: string | null
  submitted_at: string
}

function toResolved(row: TaxRateRow): ResolvedTaxRate {
  return {
    rate: Number(row.rate),
    rateType: row.rate_type,
    jurisdictionCode: row.jurisdiction_code,
    source: row.source,
    sourceRef: row.source_ref,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    companyScoped: row.company_id !== null,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
  }
}

/**
 * Resolve the applicable tax rate for a company at a given date, honoring
 * precedence. Returns `null` when no source is available — callers must then
 * show the "Tax rate source required" banner and omit the tax line from the
 * statement.
 */
export async function resolveTaxRate(params: {
  companyId: string
  jurisdictionCode: string
  asOf: Date
}): Promise<ResolvedTaxRate | null> {
  const { companyId, jurisdictionCode, asOf } = params
  const asOfIso = asOf.toISOString().slice(0, 10)

  // 1. Company override
  const overrideRows = (await sql`
    SELECT rate, rate_type, jurisdiction_code, source, source_ref,
           effective_from::text, effective_to::text,
           company_id, submitted_by, submitted_at::text
    FROM tax_rates
    WHERE company_id = ${companyId}
      AND rate_type = 'override'
      AND effective_from <= ${asOfIso}::date
      AND (effective_to IS NULL OR effective_to >= ${asOfIso}::date)
    ORDER BY effective_from DESC
    LIMIT 1
  `) as TaxRateRow[]
  if (overrideRows[0]) return toResolved(overrideRows[0])

  // 2. Company effective
  const effectiveRows = (await sql`
    SELECT rate, rate_type, jurisdiction_code, source, source_ref,
           effective_from::text, effective_to::text,
           company_id, submitted_by, submitted_at::text
    FROM tax_rates
    WHERE company_id = ${companyId}
      AND rate_type = 'effective'
      AND effective_from <= ${asOfIso}::date
      AND (effective_to IS NULL OR effective_to >= ${asOfIso}::date)
    ORDER BY effective_from DESC
    LIMIT 1
  `) as TaxRateRow[]
  if (effectiveRows[0]) return toResolved(effectiveRows[0])

  // 3. Jurisdiction statutory
  const statutoryRows = (await sql`
    SELECT rate, rate_type, jurisdiction_code, source, source_ref,
           effective_from::text, effective_to::text,
           company_id, submitted_by, submitted_at::text
    FROM tax_rates
    WHERE company_id IS NULL
      AND rate_type = 'statutory'
      AND jurisdiction_code = ${jurisdictionCode}
      AND effective_from <= ${asOfIso}::date
      AND (effective_to IS NULL OR effective_to >= ${asOfIso}::date)
    ORDER BY effective_from DESC
    LIMIT 1
  `) as TaxRateRow[]
  if (statutoryRows[0]) return toResolved(statutoryRows[0])

  return null
}

/**
 * List all tax-rate rows for a company across all precedence levels.
 * Used by the admin UI to show full history and provenance.
 */
export async function listCompanyTaxRates(companyId: string): Promise<ResolvedTaxRate[]> {
  const rows = (await sql`
    SELECT rate, rate_type, jurisdiction_code, source, source_ref,
           effective_from::text, effective_to::text,
           company_id, submitted_by, submitted_at::text
    FROM tax_rates
    WHERE company_id = ${companyId}
    ORDER BY effective_from DESC
  `) as TaxRateRow[]
  return rows.map(toResolved)
}

/**
 * Insert a company-scoped override. Callers must have already fetched the
 * `sourceRef` target and verified it exists (tax filing URL, IPFS hash, or
 * attestation uid). `submittedBy` must be the connected wallet address.
 */
export async function insertCompanyTaxRateOverride(params: {
  companyId: string
  jurisdictionCode: string
  rate: number
  rateType: Extract<TaxRateType, 'effective' | 'override'>
  source: Extract<TaxRateSource, 'company_filing' | 'cfo_attested'>
  sourceRef: string
  effectiveFrom: string
  effectiveTo: string | null
  submittedBy: string
}): Promise<void> {
  await sql`
    INSERT INTO tax_rates (
      company_id, jurisdiction_code, rate, rate_type,
      source, source_ref, effective_from, effective_to,
      submitted_by
    ) VALUES (
      ${params.companyId}, ${params.jurisdictionCode}, ${params.rate}, ${params.rateType},
      ${params.source}, ${params.sourceRef}, ${params.effectiveFrom}::date, ${params.effectiveTo}::date,
      ${params.submittedBy}
    )
    ON CONFLICT (company_id, jurisdiction_code, rate_type, effective_from)
    DO UPDATE SET
      rate = EXCLUDED.rate,
      source = EXCLUDED.source,
      source_ref = EXCLUDED.source_ref,
      effective_to = EXCLUDED.effective_to,
      submitted_by = EXCLUDED.submitted_by,
      submitted_at = NOW()
  `
}

/**
 * Upsert a statutory rate (used by the OECD seed sync job).
 * Not exposed via the public API — admin-only.
 */
export async function upsertStatutoryTaxRate(params: {
  jurisdictionCode: string
  rate: number
  source: Extract<TaxRateSource, 'oecd' | 'tax_foundation'>
  sourceRef: string
  effectiveFrom: string
  effectiveTo: string | null
}): Promise<void> {
  await sql`
    INSERT INTO tax_rates (
      company_id, jurisdiction_code, rate, rate_type,
      source, source_ref, effective_from, effective_to
    ) VALUES (
      NULL, ${params.jurisdictionCode}, ${params.rate}, 'statutory',
      ${params.source}, ${params.sourceRef},
      ${params.effectiveFrom}::date, ${params.effectiveTo}::date
    )
    ON CONFLICT (company_id, jurisdiction_code, rate_type, effective_from)
    DO UPDATE SET
      rate = EXCLUDED.rate,
      source = EXCLUDED.source,
      source_ref = EXCLUDED.source_ref,
      effective_to = EXCLUDED.effective_to,
      submitted_at = NOW()
  `
}
