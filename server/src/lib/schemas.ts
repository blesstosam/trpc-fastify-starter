import { z } from 'zod'

export const idSchema = z.string()
  .regex(/^\d+$/, { message: 'ID 必须为数字字符串' })

export const bigIntIdSchema = idSchema.transform(val => BigInt(val))

// const a = z.string().transform(v => BigInt(v)).nullable()
//   - null 会被外层 nullable 直接放行，transform 不执行
//   - "123" 才会进 transform
export const optionalBigIntIdSchema = bigIntIdSchema.optional()

export const optionalNullableBigIntIdSchema = bigIntIdSchema.optional().nullable()

export function createAuditFields(userSchema: z.ZodTypeAny) {
  return {
    createdBy: userSchema.nullable(),
    updatedBy: userSchema.nullable(),
    owner: userSchema.nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }
}

export const countOutputSchema = z.object({ count: z.number().int() })

// 分页相关
export const paginatedListMetaSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})

export function createPaginatedListOutputSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return paginatedListMetaSchema.extend({
    items: z.array(itemSchema),
  })
}

export function createListQueryInputSchema(options?: {
  defaultPageSize?: number
  maxPageSize?: number
}) {
  const maxPageSize = options?.maxPageSize ?? 200
  const defaultPageSize = options?.defaultPageSize ?? 20

  return z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(maxPageSize).default(defaultPageSize),
    keyword: z.string().trim().min(1).optional(),
  }).optional()
}
