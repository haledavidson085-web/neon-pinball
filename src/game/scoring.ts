export const BALLS_PER_GAME = 3
export type TargetKind = 'bumper' | 'spinner' | 'lane'
const TARGET_VALUES: Record<TargetKind, number> = { bumper: 250, spinner: 500, lane: 1000 }
export function pointsForTarget(kind: TargetKind, multiplier: number): number {
  return TARGET_VALUES[kind] * Math.max(1, Math.min(5, Math.floor(multiplier)))
}
export function nextMultiplier(current: number, litLanes: number): number {
  return litLanes >= 3 ? Math.min(5, current + 1) : current
}
export function formatScore(score: number): string {
  return Math.max(0, Math.floor(score)).toLocaleString('en-US')
}
