type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : Key extends `${infer ArrayKey}[${string}]`
      ? ArrayKey extends keyof T
        ? T[ArrayKey] extends (infer Item)[]
          ? PathValue<Item, Rest>
          : undefined
        : undefined
      : undefined
  : P extends keyof T
    ? T[P]
    : P extends `${infer ArrayKey}[${string}]`
      ? ArrayKey extends keyof T
        ? T[ArrayKey] extends (infer Item)[]
          ? Item
          : undefined
        : undefined
      : undefined

export function getByPath<T extends object, P extends string>(
  root: T,
  path: P,
): PathValue<T, P> {
  if (!root)
    return undefined as any

  const tokens = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  return tokens.reduce<unknown>((acc, k) => {
    if (acc === null || acc === undefined)
      return undefined
    return (acc as Record<string, unknown>)[k]
  }, root) as PathValue<T, P>
}
