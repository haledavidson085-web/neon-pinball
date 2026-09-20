import { describe, expect, it } from 'vitest'
import { formatScore, nextMultiplier, pointsForTarget } from './scoring'
describe('pinball scoring', () => {
  it('scores targets with a bounded multiplier', () => {
    expect(pointsForTarget('bumper', 2)).toBe(500)
    expect(pointsForTarget('lane', 99)).toBe(5000)
  })
  it('advances the multiplier after all lanes are lit', () => {
    expect(nextMultiplier(1, 2)).toBe(1)
    expect(nextMultiplier(1, 3)).toBe(2)
    expect(nextMultiplier(5, 3)).toBe(5)
  })
  it('formats scores for the display', () => {
    expect(formatScore(12500.9)).toBe('12,500')
    expect(formatScore(-1)).toBe('0')
  })
})
