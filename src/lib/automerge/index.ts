/**
 * Automerge 库入口点
 * @description 导出 Automerge 集成的所有公共接口、类和工具。
 */

// 适配器
export { SupabaseNetworkAdapter } from './adapters/supabase'
export type { CollaborationCallbacks, UIEventPayload, UIEventType } from './adapters/supabase'

// 核心
export { DocumentManager } from './core/manager'

export { destroyAutomergeRepo, getAutomergeRepo } from './core/repo'
// 数据
export { PersistenceService } from './data/persistence'

// 类型
export * from './types'

// 工具
export * from './utils'
