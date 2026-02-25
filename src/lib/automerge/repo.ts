import type { RepoConfig } from '@automerge/automerge-repo'
import { Repo } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'

let repoInstance: Repo | null = null
let currentResumeId: string | null = null
let storageAdapter: IndexedDBStorageAdapter | null = null

/**
 * 获取或创建 Automerge Repo 单例
 */
export function getAutomergeRepo(userId: string, resumeId?: string) {
  // 如果 resumeId 变化，需要重新创建 repo（因为网络适配器绑定到特定简历）
  if (repoInstance && resumeId && resumeId !== currentResumeId) {
    destroyAutomergeRepo()
  }

  if (!repoInstance) {
    repoInstance = createResumeRepo()
  }

  currentResumeId = resumeId ?? currentResumeId ?? null
  return repoInstance
}

/**
 * 创建 Automerge Repo
 * 注意：userId 参数已移除，未来如需 per-user 隔离存储可再引入。
 */
function createResumeRepo(): Repo {
  storageAdapter = new IndexedDBStorageAdapter('resume-automerge-v1')

  const config: RepoConfig = {
    // 本地存储适配器
    storage: storageAdapter,

    // 共享策略（允许多标签页共享）
    sharePolicy: async () => true,
  }

  const repo = new Repo(config)

  return repo
}

/**
 * 销毁 Repo 实例（用于登出或切换简历）
 */
export function destroyAutomergeRepo() {
  if (repoInstance) {
    try {
      repoInstance.networkSubsystem.disconnect()
    }
    catch (error) {
      // 忽略断开连接时的错误
    }

    repoInstance = null
    currentResumeId = null
  }

  // 清理 IndexedDB 存储适配器引用，防止泄漏
  storageAdapter = null
}
