import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions'
import type { ResumeSchema } from '../schema'
import { throttle } from 'lodash'
import { callLLM } from './call'
import { createJobDescriptionAnalysisPrompt, optimize_prompt } from './prompt'

interface StreamUpdate {
  content?: string
  reasoning?: string
}

async function streamStructuredJson(
  req: ChatCompletionCreateParamsBase,
  onUpdate?: (data: StreamUpdate) => void,
  options?: { throttleMs?: number },
) {
  const { throttleMs = 100 } = options || {}
  const stream = await callLLM(req)

  let fullContent = ''
  let fullReasoning = ''

  const throttledUpdate = onUpdate
    ? throttle((data: StreamUpdate) => {
        onUpdate(data)
      }, throttleMs)
    : null

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as { content?: string, reasoning_content?: string } | undefined
    const content = typeof delta?.content === 'string' ? delta.content : ''
    const reasoning = typeof delta?.reasoning_content === 'string' ? delta.reasoning_content : ''

    if (!content && !reasoning) {
      continue
    }

    if (content) {
      fullContent += content
    }

    if (reasoning) {
      fullReasoning += reasoning
    }

    throttledUpdate?.({
      content: fullContent,
      reasoning: fullReasoning,
    })
  }

  throttledUpdate?.flush()

  return { content: fullContent, reasoning: fullReasoning }
}

export function parseLlmJsonObject<T>(value: string): T {
  const normalized = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  const firstBraceIndex = normalized.indexOf('{')
  const lastBraceIndex = normalized.lastIndexOf('}')

  if (firstBraceIndex < 0 || lastBraceIndex <= firstBraceIndex) {
    throw new Error('LLM 未返回有效的 JSON 对象')
  }

  const jsonText = normalized.slice(firstBraceIndex, lastBraceIndex + 1)
  const parsed = JSON.parse(jsonText) as T

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('LLM 返回的 JSON 结构无效')
  }

  return parsed
}

export async function runAtsStructured(
  resumeConfig: ResumeSchema,
  onUpdate?: (data: StreamUpdate) => void,
  options?: { throttleMs?: number },
) {
  const promptText = optimize_prompt.replace('<<<RESUME_JSON>>>', JSON.stringify(resumeConfig, null, 2))
  const req = {
    messages: [
      {
        role: 'system',
        content: `你是一个 ATS 简历评估引擎。你将收到一份用户上传的“简历 JSON”（字段固定，包含基本信息、求职意向、教育/工作/项目等）。你的任务是：仅根据该简历 JSON 的内容，生成一份「AtsEvaluationResult」评估结果 JSON。`,
      },
      { role: 'user', content: promptText },
    ],
    response_format: {
      type: 'json_object',
    },
  } as ChatCompletionCreateParamsBase

  return await streamStructuredJson(req, onUpdate, options)
}

export async function runJobDescriptionStructured(
  resumeConfig: ResumeSchema,
  jobDescription: string,
  onUpdate?: (data: StreamUpdate) => void,
  options?: { throttleMs?: number },
) {
  const promptText = createJobDescriptionAnalysisPrompt(JSON.stringify(resumeConfig, null, 2), jobDescription)
  const req = {
    messages: [
      {
        role: 'system',
        content: '你是一个职位描述匹配分析引擎。你会同时收到当前简历 JSON 和岗位描述文本。你的任务是只根据输入内容，输出一份严格符合约定结构的职位匹配分析 JSON。',
      },
      { role: 'user', content: promptText },
    ],
    response_format: {
      type: 'json_object',
    },
  } as ChatCompletionCreateParamsBase

  return await streamStructuredJson(req, onUpdate, options)
}
