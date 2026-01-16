export function calculateRating(score: number) {
  if (score >= 90)
    return 'text-green-600'
  if (score >= 80)
    return 'text-emerald-600'
  if (score >= 60)
    return 'text-yellow-600'
  if (score >= 40)
    return 'text-orange-600'

  return 'text-red-600'
}

export function calculateReadabilityRating(score: number) {
  if (score >= 9)
    return 'text-green-600'
  if (score >= 7)
    return 'text-emerald-600'
  if (score >= 5)
    return 'text-yellow-600'
  if (score >= 3)
    return 'text-orange-600'
  return 'text-red-600'
}
