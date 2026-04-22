import { NextResponse } from 'next/server'

import {
  OECD_SEED_REVISION,
  OECD_SEED_URL,
  OECD_TAX_RATES_2024,
} from '@/lib/tax-rate-seed'
import { upsertStatutoryTaxRate } from '@/lib/tax-rates'

/**
 * POST /api/v1/admin/tax-rates/sync
 *
 * Seeds the `tax_rates` table from the committed OECD snapshot
 * (apps/web/src/lib/tax-rate-seed.ts). Idempotent — re-running upserts rows
 * keyed by (company_id, jurisdiction_code, rate_type, effective_from).
 *
 * Every inserted row carries `source = 'oecd'` and
 * `source_ref = OECD_SEED_REVISION + ' | ' + OECD_SEED_URL` so every tax
 * number downstream is traceable to the exact dataset revision.
 *
 * TODO (M1+): protect with admin auth (currently relies on being
 * cron-triggered at a non-public path); also add a "fetch live from OECD"
 * mode that replaces the seed when the OECD endpoint is reachable.
 */
export async function POST(): Promise<NextResponse> {
  const sourceRef = `${OECD_SEED_REVISION} | ${OECD_SEED_URL}`
  let upserted = 0

  for (const row of OECD_TAX_RATES_2024) {
    await upsertStatutoryTaxRate({
      jurisdictionCode: row.jurisdictionCode,
      rate: row.rate,
      source: 'oecd',
      sourceRef,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
    })
    upserted++
  }

  return NextResponse.json({
    ok: true,
    sourceRevision: OECD_SEED_REVISION,
    sourceUrl: OECD_SEED_URL,
    jurisdictionsUpserted: upserted,
  })
}
