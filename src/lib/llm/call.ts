import type { ChatCompletionChunk, ChatCompletionCreateParams } from 'openai/resources/chat/completions'
import { Stream } from 'openai/streaming'
import supabase from '../supabase/client'

export async function callLLM(req: ChatCompletionCreateParams) {
  const {
    model = 'deepseek-reasoner',
    messages = [],
    temperature = 0,
    stream = true,
    ...rest
  } = req

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ model, messages, temperature, stream, ...rest }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM request failed: ${response.status} ${errorText}`)
  }

  const streamData = Stream.fromSSEResponse<ChatCompletionChunk>(response, new AbortController())

  return streamData
}
