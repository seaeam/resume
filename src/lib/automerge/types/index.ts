import type { ORDERType, ResumeSchema, VisibilityItemsType } from '@/lib/schema'

/**
 * Automerge 简历文档接口
 * @description 定义 Automerge 管理的简历文档结构。
 * 扩展了基础 ResumeSchema，增加了元数据和协作字段。
 */
export interface AutomergeResumeDocument extends ResumeSchema {
  /**
   * 文档元数据
   * @description 包含关于文档的系统级信息
   */
  _metadata: {
    /** 简历唯一标识符 */
    resumeId: string
    /** 拥有文档的用户 ID */
    userId: string
    /** 创建时间的 ISO 时间戳 */
    createdAt: string
    /** 最后更新时间的 ISO 时间戳 */
    updatedAt: string
    /** 文档版本号 */
    version: number
  }

  /**
   * Actor ID
   * @description 进行最后一次更改的 Actor ID
   */
  actor: Uint8Array<ArrayBufferLike>

  /**
   * 章节顺序
   * @description 定义简历章节的显示顺序
   */
  order: ORDERType[]

  /**
   * 章节可见性
   * @description 控制简历上可见的章节
   */
  visibility: Record<VisibilityItemsType, boolean>

  /**
   * 简历类型
   * @description 简历的模板类型
   */
  type: 'basic' | 'modern' | 'simple'

  /**
   * 协作者信息
   * @description 活跃协作者的运行时状态。不持久化到数据库。
   */
  _collaborators?: {
    [userId: string]: {
      /** 协作者显示名称 */
      name: string
      /** 协作者邮箱地址 */
      email: string
      /** 头像图片 URL */
      avatarUrl?: string
      /** 分配的光标颜色 */
      color: string
      /** 最后活动时间的 ISO 时间戳 */
      lastSeen: string
      /** 当前正在编辑的字段路径列表 */
      currentlyEditing?: string[]
    }
  }
}

/**
 * 变更函数类型
 * @description 修改 Automerge 文档的回调函数
 * @template T 文档类型
 * @param doc 可变文档代理
 */
export type ChangeFn<T> = (doc: T) => void

/**
 * 字段路径类型
 * @description 表示文档中特定字段的路径，用于光标跟踪
 * @example ['basics', 'name']
 */
export type FieldPath = string[]
