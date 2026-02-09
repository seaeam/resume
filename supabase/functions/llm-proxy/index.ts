import { corsHeaders } from '../shared/cors.ts'

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  try {
    const { messages, model = 'deepseek-reasoner', response_format, temperature = 0, stream = true } = await req.json()

    // 从环境变量读取 API Key（服务端安全，不会暴露给客户端）
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'API Key not configured OPENAI_API_KEY',
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    // 构建请求体
    const requestBody: any = {
      model,
      messages,
      temperature,
      stream,
    }

    // 仅在需要时添加 response_format
    if (response_format) {
      requestBody.response_format = response_format
    }

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(JSON.stringify({
        error: `DeepSeek API error: ${error}`,
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    // 如果是流式响应，直接透传
    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
        },
      })
    }

    // 非流式响应
    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
  catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})
