import { z } from 'zod'

export const durationField = z.array(z.string().trim()).length(2)

export function createExperienceSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({
    items: z.array(z.object(fields)),
  })
}
