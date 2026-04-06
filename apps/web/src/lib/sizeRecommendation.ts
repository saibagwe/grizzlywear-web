/**
 * Pure functions for size recommendation logic.
 * No imports from Next.js or Firebase allowed.
 */

export type FitPreference = 'fitted' | 'regular' | 'relaxed' | 'oversized'

export type SizeMeasurements = {
  chest: number        // in inches e.g. 40
  shoulder: number     // in inches e.g. 17.5
  fit: FitPreference
}

export type SizeRecommendationResult = {
  recommendedSize: string    // e.g. "L"
  basedOn: 'chest' | 'shoulder' | 'both'
  fitAdjusted: boolean
  isAvailable: boolean
  fallbackSize: string | null
  sizeRange: string          // e.g. "Chest 40-42\" · Shoulder 17.5-18.5\""
}

// ─── SIZE CHART ───────────────────────────────────────────────────────────────
// Grizzlywear standard size chart in inches

type SizeEntry = {
  size: string
  chestMin: number
  chestMax: number
  shoulderMin: number
  shoulderMax: number
}

const SIZE_CHART: SizeEntry[] = [
  { size: 'XS',  chestMin: 34, chestMax: 36, shoulderMin: 14.5, shoulderMax: 15.5 },
  { size: 'S',   chestMin: 36, chestMax: 38, shoulderMin: 15.5, shoulderMax: 16.5 },
  { size: 'M',   chestMin: 38, chestMax: 40, shoulderMin: 16.5, shoulderMax: 17.5 },
  { size: 'L',   chestMin: 40, chestMax: 42, shoulderMin: 17.5, shoulderMax: 18.5 },
  { size: 'XL',  chestMin: 42, chestMax: 44, shoulderMin: 18.5, shoulderMax: 19.5 },
  { size: 'XXL', chestMin: 44, chestMax: 46, shoulderMin: 19.5, shoulderMax: 20.5 },
]

const SIZE_ORDER = SIZE_CHART.map(s => s.size)

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getSizeFromChest(chest: number): string {
  // Find the size whose chest range contains this measurement
  // If between sizes, round up (better to have slightly loose than tight)
  const match = SIZE_CHART.find(
    s => chest >= s.chestMin && chest < s.chestMax
  )
  if (match) return match.size
  // Below smallest → XS, above largest → XXL
  if (chest < SIZE_CHART[0].chestMin) return SIZE_CHART[0].size
  return SIZE_CHART[SIZE_CHART.length - 1].size
}

function getSizeFromShoulder(shoulder: number): string {
  const match = SIZE_CHART.find(
    s => shoulder >= s.shoulderMin && shoulder < s.shoulderMax
  )
  if (match) return match.size
  if (shoulder < SIZE_CHART[0].shoulderMin) return SIZE_CHART[0].size
  return SIZE_CHART[SIZE_CHART.length - 1].size
}

function adjustForFit(
  sizeIndex: number,
  fit: FitPreference
): number {
  const fitAdjustMap: Record<FitPreference, number> = {
    fitted:    -1,
    regular:    0,
    relaxed:   +1,
    oversized: +2,
  }
  const adjusted = sizeIndex + fitAdjustMap[fit]
  return Math.max(0, Math.min(SIZE_ORDER.length - 1, adjusted))
}

function findNearestAvailable(
  sizeIndex: number,
  availableSizes: string[]
): string | null {
  for (let offset = 0; offset < SIZE_ORDER.length; offset++) {
    const up = SIZE_ORDER[sizeIndex + offset]
    const down = SIZE_ORDER[sizeIndex - offset]
    if (up && availableSizes.includes(up)) return up
    if (down && availableSizes.includes(down)) return down
  }
  return null
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

export function getRecommendedSize(
  measurements: SizeMeasurements,
  availableSizes: string[]
): SizeRecommendationResult {

  const { chest, shoulder, fit } = measurements

  // Step 1 — Get base size from both measurements
  const chestSize = getSizeFromChest(chest)
  const shoulderSize = getSizeFromShoulder(shoulder)

  // Step 2 — Reconcile chest vs shoulder
  // If they agree → use that size with high confidence
  // If they disagree → use the LARGER of the two
  // (shoulder fit is critical — tight shoulders can't be adjusted)
  let baseSize: string
  let basedOn: 'chest' | 'shoulder' | 'both'

  if (chestSize === shoulderSize) {
    baseSize = chestSize
    basedOn = 'both'
  } else {
    // Prioritize shoulder — shoulder seam placement is harder to adjust
    const chestIdx = SIZE_ORDER.indexOf(chestSize)
    const shoulderIdx = SIZE_ORDER.indexOf(shoulderSize)
    if (shoulderIdx >= chestIdx) {
      baseSize = shoulderSize
      basedOn = 'shoulder'
    } else {
      baseSize = chestSize
      basedOn = 'chest'
    }
  }

  // Step 3 — Adjust for fit preference
  const baseIndex = SIZE_ORDER.indexOf(baseSize)
  const fitAdjustedIndex = adjustForFit(baseIndex, fit)
  const fitAdjusted = fitAdjustedIndex !== baseIndex
  const recommendedSize = SIZE_ORDER[fitAdjustedIndex]

  // Step 4 — Check availability
  const isAvailable = availableSizes.includes(recommendedSize)

  // Step 5 — Find fallback if not available
  let fallbackSize: string | null = null
  if (!isAvailable) {
    fallbackSize = findNearestAvailable(fitAdjustedIndex, availableSizes)
  }

  // Step 6 — Build size range description
  const chartEntry = SIZE_CHART.find(s => s.size === recommendedSize)
  const sizeRange = chartEntry
    ? `Chest ${chartEntry.chestMin}–${chartEntry.chestMax}" · Shoulder ${chartEntry.shoulderMin}–${chartEntry.shoulderMax}"`
    : ''

  return {
    recommendedSize,
    basedOn,
    fitAdjusted,
    isAvailable,
    fallbackSize,
    sizeRange,
  }
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

export function validateMeasurements(
  chest: number,
  shoulder: number
): { valid: boolean; error?: string } {
  if (isNaN(chest) || chest <= 0)
    return { valid: false, error: 'Please enter a valid chest measurement' }
  if (isNaN(shoulder) || shoulder <= 0)
    return { valid: false, error: 'Please enter a valid shoulder measurement' }
  if (chest < 28 || chest > 60)
    return { valid: false, error: 'Chest measurement seems incorrect (28–60 inches)' }
  if (shoulder < 12 || shoulder > 28)
    return { valid: false, error: 'Shoulder measurement seems incorrect (12–28 inches)' }
  if (shoulder >= chest)
    return { valid: false, error: 'Shoulder width should be less than chest circumference' }
  return { valid: true }
}

export const SIZE_ANSWERS_FIELD = 'sizeAnswers'
