import type { DocHandle, Repo } from '@automerge/automerge-repo'
import type { AutomergeResumeDocument } from './schema'
import type { ResumeSchema } from '@/lib/schema'
import { DEFAULT_ORDER, DEFAULT_VISIBILITY } from '@/lib/schema'
import { generateDeterministicActor } from '../shared'

interface DocumentIdentity {
  resumeId: string
  userId: string
}

interface CreateDocumentOptions extends DocumentIdentity {
  repo: Repo
  seedData?: Partial<ResumeSchema> | null
}

function buildMetadata(
  existing: Partial<AutomergeResumeDocument['_metadata']> | undefined,
  identity: DocumentIdentity,
) {
  const now = new Date().toISOString()

  return {
    resumeId: existing?.resumeId ?? identity.resumeId,
    userId: existing?.userId ?? identity.userId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing?.updatedAt ?? now,
    version: typeof existing?.version === 'number' ? existing.version : 1,
  }
}

export function ensureDocumentMetadata(doc: AutomergeResumeDocument, identity: DocumentIdentity) {
  doc._metadata = buildMetadata(doc._metadata, identity)
  return doc._metadata
}

export function touchDocumentMetadata(doc: AutomergeResumeDocument, identity: DocumentIdentity) {
  const metadata = ensureDocumentMetadata(doc, identity)

  metadata.updatedAt = new Date().toISOString()
  metadata.version = typeof metadata.version === 'number' ? metadata.version + 1 : 1
}

export async function createResumeDocument({
  repo,
  resumeId,
  userId,
  seedData,
}: CreateDocumentOptions): Promise<DocHandle<AutomergeResumeDocument>> {
  const handle = repo.create<AutomergeResumeDocument>({
    actor: generateDeterministicActor(resumeId),
  })

  handle.change((doc) => {
    doc._metadata = buildMetadata(undefined, { resumeId, userId })

    if (seedData) {
      Object.assign(doc, seedData)
    }

    if (!doc.order || doc.order.length === 0) {
      doc.order = [...DEFAULT_ORDER] as AutomergeResumeDocument['order']
    }

    if (!doc.visibility) {
      doc.visibility = { ...DEFAULT_VISIBILITY } as AutomergeResumeDocument['visibility']
    }
  })

  await handle.whenReady()

  return handle
}
