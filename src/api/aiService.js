import axios from 'axios'

export const aiService = {
  async sendMessage(config, messages, onStream = null) {
    const { provider, apiKey, model, baseUrl } = config
    
    try {
      // 通义千问使用非流式模式
      if (provider === 'tongyi') {
        const response = await this.sendNormalMessage(config, messages)
        // 如果有回调函数，调用它
        if (onStream) {
          onStream(response)
        }
        return response
      }
      
      if (onStream) {
        return this.sendStreamMessage(config, messages, onStream)
      } else {
        return this.sendNormalMessage(config, messages)
      }
    } catch (error) {
      throw error
    }
  },

  async sendNormalMessage(config, messages) {
    const { provider, apiKey, model, baseUrl } = config
    
    let url, headers, data
    
    if (provider === 'openai' || provider === 'claude') {
      url = `${baseUrl}/chat/completions`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
      data = {
        model,
        messages,
        stream: false
      }
    } else if (provider === 'tongyi') {
      url = `${baseUrl}/api/v1/services/aigc/text-generation/generation`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
      data = {
        model,
        input: {
          messages
        },
        parameters: {
          result_format: 'message'
        }
      }
    }

    const response = await axios.post(url, data, { headers })
    
    if (provider === 'tongyi') {
      return response.data.output.choices[0].message.content
    } else {
      return response.data.choices[0].message.content
    }
  },

  async sendStreamMessage(config, messages, onChunk) {
    const { provider, apiKey, model, baseUrl } = config
    
    let url, headers, data
    
    if (provider === 'tongyi') {
      url = `${baseUrl}/api/v1/services/aigc/text-generation/generation`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
      data = {
        model,
        input: { messages },
        parameters: {
          result_format: 'message'
        },
        stream: true
      }
    } else {
      url = `${baseUrl}/chat/completions`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
      data = {
        model,
        messages,
        stream: true
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') continue
          
          try {
            const data = JSON.parse(dataStr)
            // 支持通义千问和 OpenAI 两种格式
            let content = ''
            if (provider === 'tongyi') {
              content = data.output?.choices?.[0]?.message?.content || 
                        data.output?.text || 
                        data.choices?.[0]?.delta?.content
            } else {
              content = data.choices?.[0]?.delta?.content
            }
            if (content) {
              fullText += content
              onChunk(content)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return fullText
  }
}
