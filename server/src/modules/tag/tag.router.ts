import { authedProcedure, router } from '../../rpc/trpc'
import {
  createTagInputSchema,
  deleteTagOutputSchema,
  tagByIdInputSchema,
  tagListInputSchema,
  tagListOutputSchema,
  tagSchema,
  updateTagInputSchema,
} from './dto'
import { createTag, deleteTag, getTagById, listTags, updateTag } from './tag.service'

export const tagsRouter = router({
  list: authedProcedure
    .meta({
      openapi: {
        summary: 'List tags',
        tags: ['tag'],
      },
    })
    .input(tagListInputSchema)
    .output(tagListOutputSchema)
    .query(({ input }) => listTags(input)),

  getById: authedProcedure
    .meta({
      openapi: {
        summary: 'Get tag by id',
        tags: ['tag'],
      },
    })
    .input(tagByIdInputSchema)
    .output(tagSchema)
    .query(({ input }) => getTagById(input.id)),

  create: authedProcedure
    .meta({
      openapi: {
        summary: 'Create tag',
        tags: ['tag'],
      },
    })
    .input(createTagInputSchema)
    .output(tagSchema)
    .mutation(({ input }) => createTag(input)),

  update: authedProcedure
    .meta({
      openapi: {
        summary: 'Update tag',
        tags: ['tag'],
      },
    })
    .input(updateTagInputSchema)
    .output(tagSchema)
    .mutation(({ input }) => updateTag(input)),

  remove: authedProcedure
    .meta({
      openapi: {
        summary: 'Delete tag',
        tags: ['tag'],
      },
    })
    .input(tagByIdInputSchema)
    .output(deleteTagOutputSchema)
    .mutation(({ input }) => deleteTag(input.id)),
})
