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
const recognition = ref(null)

const initRecognition = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    ElMessage.error('您的浏览器不支持语音识别功能')
    return false
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition.value = new SpeechRecognition()
  recognition.value.continuous = true
  recognition.value.interimResults = true
  recognition.value.lang = 'zh-CN'

  recognition.value.onresult = (event) => {
    let transcript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    recordingText.value = transcript || '正在听...'
    if (event.results[event.results.length - 1].isFinal) {
      emit('transcript', transcript)
    }
  }

  recognition.value.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    if (event.error !== 'no-speech') {
      ElMessage.error('语音识别出错: ' + event.error)
    }
    stopRecording()
  }

  recognition.value.onend = () => {
    if (isRecording.value) {
      recognition.value.start()
    }
  }

  return true
}

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

const startRecording = () => {
  if (!recognition.value && !initRecognition()) {
    return
  }
  
  try {
    isRecording.value = true
    recordingText.value = '正在听...'
    recognition.value.start()
    ElMessage.success('开始录音')
  } catch (error) {
    console.error('Failed to start recognition:', error)
    ElMessage.error('启动语音识别失败')
  }
}

const stopRecording = () => {
  isRecording.value = false
  recordingText.value = '正在听...'
  if (recognition.value) {
    recognition.value.stop()
  }
  ElMessage.info('停止录音')
}

onUnmounted(() => {
  if (recognition.value) {
    recognition.value.stop()
  }
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
