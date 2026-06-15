<template>
  <div class="voice-input">
    <el-button
      :type="isRecording ? 'danger' : 'primary'"
      :circle="true"
      size="large"
      @click="toggleRecording"
      class="voice-button"
      :class="{ 'recording': isRecording }"
    >
      <svg v-if="!isRecording" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
      <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="6" width="12" height="12" rx="1"></rect>
      </svg>
    </el-button>
    
    <div v-if="isRecording" class="recording-indicator">
      <div class="wave-container">
        <span class="wave"></span>
        <span class="wave"></span>
        <span class="wave"></span>
        <span class="wave"></span>
        <span class="wave"></span>
      </div>
      <span class="recording-text">{{ recordingText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['transcript'])

const isRecording = ref(false)
const recordingText = ref('正在听...')
const websocket = ref(null)
const audioContext = ref(null)
const audioStream = ref(null)
const accessToken = ref('')
const scriptProcessor = ref(null)
const audioInput = ref(null)

// 百度语音识别配置
const BAIDU_CONFIG = {
  apiKey: 'UWYcslDxo9freV2G9GuN9SGe',
  secretKey: 'CGtFJMXYXyR0bxZ32avTCnsWYhJrfye1',
  format: 'pcm',
  rate: 16000,
  dev_pid: 1537,
  channel: 1
}

// 获取百度Access Token（带缓存机制）
const getAccessToken = async () => {
  const cachedToken = localStorage.getItem('baidu_asr_token')
  const tokenExpire = localStorage.getItem('baidu_asr_token_expire')
  
  if (cachedToken && tokenExpire && Date.now() < parseInt(tokenExpire)) {
    accessToken.value = cachedToken
    return cachedToken
  }
  
  const url = `/api/baidu-token?grant_type=client_credentials&client_id=${BAIDU_CONFIG.apiKey}&client_secret=${BAIDU_CONFIG.secretKey}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  if (data.access_token) {
    accessToken.value = data.access_token
    const expireTime = Date.now() + (data.expires_in || 2592000) * 1000 - 86400000
    localStorage.setItem('baidu_asr_token', data.access_token)
    localStorage.setItem('baidu_asr_token_expire', expireTime.toString())
    return data.access_token
  } else {
    throw new Error(data.error_description || '获取Access Token失败')
  }
}

// 建立WebSocket连接
const connectWebSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      const wsUrl = `wss://vop.baidu.com/realtime_asr?token=${accessToken.value}&dev_pid=${BAIDU_CONFIG.dev_pid}&cuid=web_voice_input&format=${BAIDU_CONFIG.format}&rate=${BAIDU_CONFIG.rate}&channel=${BAIDU_CONFIG.channel}`
      
      websocket.value = new WebSocket(wsUrl)
      
      websocket.value.onopen = () => {
        console.log('WebSocket connected')
        resolve()
      }
      
      websocket.value.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)
          handleBaiduResponse(response)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      websocket.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      }
      
      websocket.value.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        if (isRecording.value) {
          stopRecording()
        }
      }
    } catch (error) {
      reject(error)
    }
  })
}

// 处理百度语音识别响应
const handleBaiduResponse = (response) => {
  if (response.err_no === 0) {
    if (response.result) {
      const text = response.result.join('')
      recordingText.value = text
      
      if (text.trim()) {
        emit('transcript', text)
      }
    }
  } else {
    console.error('Baidu ASR error:', response.err_msg)
    if (response.err_msg) {
      ElMessage.warning('语音识别异常: ' + response.err_msg)
    }
  }
}

// 初始化音频采集
const initAudio = () => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: BAIDU_CONFIG.rate,
        channelCount: BAIDU_CONFIG.channel,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
      .then((stream) => {
        audioStream.value = stream
        
        audioContext.value = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: BAIDU_CONFIG.rate
        })
        
        audioInput.value = audioContext.value.createMediaStreamSource(stream)
        
        scriptProcessor.value = audioContext.value.createScriptProcessor(4096, 1, 1)
        scriptProcessor.value.onaudioprocess = (event) => {
          if (isRecording.value && websocket.value && websocket.value.readyState === WebSocket.OPEN) {
            const inputBuffer = event.inputBuffer
            const outputBuffer = event.outputBuffer
            
            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
              const inputData = inputBuffer.getChannelData(channel)
              const outputData = outputBuffer.getChannelData(channel)
              
              for (let i = 0; i < inputData.length; i++) {
                outputData[i] = inputData[i]
              }
            }
            
            const rawData = inputBuffer.getChannelData(0)
            const samples = new Int16Array(rawData.length)
            
            for (let i = 0; i < rawData.length; i++) {
              const sample = Math.max(-1, Math.min(1, rawData[i]))
              samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
            }
            
            websocket.value.send(samples.buffer)
          }
        }
        
        audioInput.value.connect(scriptProcessor.value)
        scriptProcessor.value.connect(audioContext.value.destination)
        
        resolve()
      })
      .catch((error) => {
        console.error('Failed to get audio stream:', error)
        reject(error)
      })
  })
}

// 开始录音
const startRecording = async () => {
  try {
    await getAccessToken()
    await connectWebSocket()
    await initAudio()
    
    isRecording.value = true
    recordingText.value = '正在听...'
  } catch (error) {
    console.error('Failed to start recording:', error)
    ElMessage.error('无法启动录音: ' + error.message)
  }
}

// 停止录音
const stopRecording = () => {
  isRecording.value = false
  
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }
  
  if (scriptProcessor.value) {
    scriptProcessor.value.disconnect()
    scriptProcessor.value = null
  }
  
  if (audioInput.value) {
    audioInput.value.disconnect()
    audioInput.value = null
  }
  
  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
  
  if (audioStream.value) {
    audioStream.value.getTracks().forEach(track => track.stop())
    audioStream.value = null
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
})
</script>

<style scoped>
.voice-input {
  position: relative;
  display: inline-block;
}

.voice-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.voice-button .icon {
  width: 24px;
  height: 24px;
}

.voice-button.recording {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
}

.recording-indicator {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.wave-container {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 20px;
}

.wave {
  width: 3px;
  height: 100%;
  background: #409EFF;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.wave:nth-child(1) { animation-delay: 0s; }
.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }
.wave:nth-child(4) { animation-delay: 0.3s; }
.wave:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { height: 50%; }
  50% { height: 100%; }
}

.recording-text {
  color: #fff;
  font-size: 14px;
}
</style>
