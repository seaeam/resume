import type { ChatCompletionChunk } from 'openai/resources/chat/completions'
import type { ResumeSchema } from '../schema'
import { throttle } from 'lodash'
import { Stream } from 'openai/streaming'
import supabase from '../supabase/client'
import prompt from './prompt'

export async function runAtsStructured(
  resumeConfig: ResumeSchema,
  onUpdate?: (data: { content?: string, reasoning?: string }) => void,
  options?: { throttleMs?: number },
) {
  const { throttleMs = 100 } = options || {}

  const promptText = prompt.replace('<<<RESUME_JSON>>>', JSON.stringify(resumeConfig, null, 2))
  const req = {
    model: 'deepseek-reasoner',
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
    temperature: 0,
    stream: true,
  }

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM request failed: ${response.status} ${errorText}`)
  }

  const stream = Stream.fromSSEResponse<ChatCompletionChunk>(response, new AbortController())

  let fullContent = ''
  let fullReasoning = ''

  // 使用节流来限制 UI 更新频率，避免页面卡顿
  const throttledUpdate = onUpdate
    ? throttle((data: { content?: string, reasoning?: string }) => {
        onUpdate(data)
      }, throttleMs)
    : null

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as any
    const content = delta?.content || ''
    const reasoning = delta?.reasoning_content || ''

    if (content || reasoning) {
      if (content)
        fullContent += content
      if (reasoning)
        fullReasoning += reasoning

      throttledUpdate?.({
        content: fullContent,
        reasoning: fullReasoning,
      })
    }
  }

  // 确保最后一次更新被执行
  throttledUpdate?.flush()

  return { content: fullContent, reasoning: fullReasoning }
}
