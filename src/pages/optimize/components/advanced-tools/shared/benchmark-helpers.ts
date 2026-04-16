export function getMetricStatusClassName(status: 'good' | 'warn' | 'missing') {
  if (status === 'good') {
    return 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300'
  }

  if (status === 'warn') {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  }

  return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300'
}
