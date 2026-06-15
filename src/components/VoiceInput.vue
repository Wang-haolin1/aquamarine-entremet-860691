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
const mediaRecorder = ref(null)
const websocket = ref(null)
const audioContext = ref(null)
const audioStream = ref(null)
const accessToken = ref('')
const isFirstMessage = ref(true)

// 百度语音识别配置
const BAIDU_CONFIG = {
  apiKey: 'UWYcslDxo9freV2G9GuN9SGe',           // 替换为你的百度API Key
  secretKey: 'CGtFJMXYXyR0bxZ32avTCnsWYhJrfye1',     // 替换为你的百度Secret Key
  format: 'pcm',
  rate: 16000,
  dev_pid: 1537,                   // 中文普通话
  channel: 1
}

// 获取百度Access Token（带缓存机制）
const getAccessToken = async () => {
  // 先检查本地缓存
  const cachedToken = localStorage.getItem('baidu_asr_token')
  const tokenExpire = localStorage.getItem('baidu_asr_token_expire')
  
  // 如果缓存存在且未过期，直接使用
  if (cachedToken && tokenExpire && Date.now() < parseInt(tokenExpire)) {
    accessToken.value = cachedToken
    return cachedToken
  }
  
  // 否则重新获取
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_CONFIG.apiKey}&client_secret=${BAIDU_CONFIG.secretKey}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  if (data.access_token) {
    accessToken.value = data.access_token
    
    // 缓存到本地，有效期30天（提前1天过期，避免边界问题）
    const expireTime = Date.now() + (data.expires_in || 2592000) * 1000 - 86400000
    localStorage.setItem('baidu_asr_token', data.access_token)
    localStorage.setItem('baidu_asr_token_expire', expireTime.toString())
    
    return data.access_token
  } else {
    throw new Error(data.error_description || '获取Access Token失败')
  }
}

// 初始化WebSocket连接
const initWebSocket = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // 先获取Access Token
      await getAccessToken()
      
      // 构建WebSocket URL
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
      
      // 实时转写结果，直接提交
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
        
        // 创建音频上下文
        audioContext.value = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: BAIDU_CONFIG.rate
        })
        
        // 创建MediaRecorder录制音频
        const options = {
          audioBitsPerSecond: 16 * BAIDU_CONFIG.rate,
          mimeType: 'audio/wav'
        }
        
        mediaRecorder.value = new MediaRecorder(stream, options)
        
        // 监听音频数据可用事件
        mediaRecorder.value.ondataavailable = (event) => {
          if (event.data && event.data.size > 0 && websocket.value && websocket.value.readyState === WebSocket.OPEN) {
            // 将音频数据转换为ArrayBuffer发送
            event.data.arrayBuffer().then((buffer) => {
              websocket.value.send(buffer)
            })
          }
        }
        
        mediaRecorder.value.onerror = (error) => {
          console.error('MediaRecorder error:', error)
          reject(error)
        }
        
        resolve()
      })
      .catch((error) => {
        console.error('Failed to get user media:', error)
        reject(error)
      })
  })
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 开始录音
const startRecording = async () => {
  try {
    isRecording.value = true
    recordingText.value = '正在连接...'
    isFirstMessage.value = true
    
    // 1. 初始化WebSocket连接（包含获取Access Token）
    await initWebSocket()
    
    // 2. 初始化音频采集
    await initAudio()
    
    // 3. 开始录制，每100ms发送一次数据
    recordingText.value = '正在听...'
    mediaRecorder.value.start(100)
    
    ElMessage.success('开始录音')
  } catch (error) {
    console.error('Failed to start recording:', error)
    isRecording.value = false
    recordingText.value = '正在听...'
    
    if (error.message && error.message.includes('permission')) {
      ElMessage.error('请允许麦克风权限')
    } else {
      ElMessage.error('启动录音失败: ' + (error.message || '未知错误'))
    }
    
    // 清理资源
    cleanup()
  }
}

// 停止录音
const stopRecording = () => {
  isRecording.value = false
  recordingText.value = '正在听...'
  
  // 停止录制
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
  
  // 关闭WebSocket连接
  if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
    // 发送结束标志（百度ASR会自动检测音频结束）
    setTimeout(() => {
      websocket.value.close()
    }, 300)
  }
  
  // 停止音频流
  if (audioStream.value) {
    audioStream.value.getTracks().forEach((track) => track.stop())
  }
  
  ElMessage.info('停止录音')
}

// 清理资源
const cleanup = () => {
  if (mediaRecorder.value) {
    mediaRecorder.value = null
  }
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }
  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
  if (audioStream.value) {
    audioStream.value.getTracks().forEach((track) => track.stop())
    audioStream.value = null
  }
  accessToken.value = ''
}

// 组件卸载时清理
onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
  cleanup()
})
</script>

<style scoped>
.voice-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.voice-button {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #7BC88C 0%, #5DAF69 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(93, 175, 105, 0.3);
}

.voice-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(93, 175, 105, 0.4);
}

.voice-button.recording {
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%) !important;
  box-shadow: 0 4px 14px rgba(238, 90, 90, 0.4);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 14px rgba(238, 90, 90, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(238, 90, 90, 0.6);
  }
}

.voice-button .icon {
  width: 28px;
  height: 28px;
  color: #fff;
}

.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.wave-container {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 30px;
}

.wave {
  width: 6px;
  background: linear-gradient(180deg, #FF6B6B 0%, #EE5A5A 100%);
  border-radius: 3px;
  animation: wave 1s ease-in-out infinite;
}

.wave:nth-child(1) {
  height: 10px;
  animation-delay: 0s;
}

.wave:nth-child(2) {
  height: 20px;
  animation-delay: 0.1s;
}

.wave:nth-child(3) {
  height: 28px;
  animation-delay: 0.2s;
}

.wave:nth-child(4) {
  height: 20px;
  animation-delay: 0.3s;
}

.wave:nth-child(5) {
  height: 10px;
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.5);
  }
}

.recording-text {
  font-size: 14px;
  color: #EE5A5A;
  font-weight: 500;
  max-width: 300px;
  text-align: center;
  word-break: break-all;
}
</style>
