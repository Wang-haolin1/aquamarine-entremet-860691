<template>
  <div class="chat-box">
    <div class="chat-header">
      <span class="title">AI&#x5BF9;&#x8BDD;</span>
      <el-button type="danger" size="small" @click="handleClear">&#x6E05;&#x7A7A;&#x5BF9;&#x8BDD;</el-button>
    </div>
    
    <div class="chat-messages" ref="messagesRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div v-if="msg.role === 'assistant'" class="avatar avatar-assistant">&#x1F34E;</div>
        <div class="message-content">
          <div class="message-bubble">
            {{ msg.content }}
          </div>
          <div class="message-meta">
            <span class="timestamp">{{ msg.timestamp }}</span>
            <el-button
              type="text"
              size="small"
              @click="copyMessage(msg.content)"
            >
              &#x590D;&#x5236;
            </el-button>
          </div>
        </div>
        <div v-if="msg.role === 'user'" class="avatar avatar-user">&#x1F464;</div>
      </div>
      
      <div v-if="isLoading" class="message assistant">
        <div class="avatar avatar-assistant">&#x1F34E;</div>
        <div class="message-content">
          <div class="message-bubble">
            <span class="loading-dots">&#x6B63;&#x5728;&#x601D;&#x8003;</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <div class="input-wrapper">
        <el-select
          v-model="selectedTemplate"
          placeholder="&#x9009;&#x62E9;&#x63D0;&#x793A;&#x8BCD;&#x6A21;&#x677F;"
          size="small"
          style="margin-right: 10px; width: 200px;"
        >
          <el-option
            v-for="t in promptTemplates"
            :key="t.id"
            :label="t.name"
            :value="t.id"
          />
        </el-select>
        
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="&#x8F93;&#x5165;&#x6D88;&#x606F;..."
          @keydown.enter.ctrl="handleSend"
        />
        
        <VoiceInput @transcript="handleVoiceTranscript" />
        
        <el-button
          type="primary"
          :disabled="isLoading || !inputText.trim()"
          @click="handleSend"
        >
          &#x53D1;&#x9001;
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '../store'
import { aiService } from '../api/aiService'
import { ElMessage } from 'element-plus'
import VoiceInput from './VoiceInput.vue'

const chatStore = useChatStore()
const messagesRef = ref(null)
const inputText = ref('')
const selectedTemplate = ref('template-1')

const messages = computed(() => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)
const promptTemplates = computed(() => chatStore.promptTemplates)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  chatStore.loadFromStorage()
  scrollToBottom()
})

const handleSend = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  
  const userContent = inputText.value
  inputText.value = ''
  
  chatStore.addMessage({
    role: 'user',
    content: userContent
  })
  
  chatStore.isLoading = true
  
  try {
    const currentTemplate = chatStore.promptTemplates.find(t => t.id === selectedTemplate.value)
    const systemPrompt = currentTemplate?.systemPrompt || '\u4F60\u662F\u4E00\u4E2A\u667A\u80FD\u52A9\u624B\u3002'
    
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...chatStore.messages.map(m => ({ role: m.role, content: m.content }))
    ]
    
    let aiResponse = ''
    
    await aiService.sendMessage(
      chatStore.apiConfig,
      aiMessages,
      (chunk) => {
        aiResponse += chunk
        if (chatStore.messages.length > 0 && chatStore.messages[chatStore.messages.length - 1].role === 'assistant') {
          chatStore.messages[chatStore.messages.length - 1].content = aiResponse
        } else {
          chatStore.addMessage({
            role: 'assistant',
            content: aiResponse
          })
        }
      }
    )
    
    if (aiResponse === '') {
      chatStore.addMessage({
        role: 'assistant',
        content: '\u8FD9\u662F\u4E00\u4E2A\u6A21\u62DF\u56DE\u590D\uFF0C\u8BF7\u914D\u7F6E\u771F\u5B9E\u7684AI\u63A5\u53E3\u6765\u83B7\u53D6\u5B9E\u9645\u56DE\u590D\u3002'
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('\u53D1\u9001\u6D88\u606F\u5931\u8D25: ' + (error.message || '\u672A\u77E5\u9519\u8BEF'))
    chatStore.addMessage({
      role: 'assistant',
      content: '\u62B1\u6B49\uFF0C\u53D1\u751F\u4E86\u9519\u8BEF\u3002\u8BF7\u68C0\u67E5\u60A8\u7684API\u914D\u7F6E\u3002'
    })
  } finally {
    chatStore.isLoading = false
    chatStore.saveToStorage()
  }
}

const handleClear = () => {
  chatStore.clearMessages()
  chatStore.saveToStorage()
  ElMessage.success('\u5BF9\u8BDD\u5DF2\u6E05\u7A7A')
}

const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')
  }).catch(() => {
    ElMessage.error('\u590D\u5236\u5931\u8D25')
  })
}

const handleVoiceTranscript = (transcript) => {
  if (transcript && transcript.trim()) {
    inputText.value += transcript
  }
}
</script>

<style scoped>
.chat-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: transparent;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(168, 230, 207, 0.4);
  background: linear-gradient(135deg, #A8E6CF 0%, #7BC88C 100%);
  color: #2D5A27;
  flex-shrink: 0;
}

.chat-header .title {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: transparent;
  min-height: 0;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(168, 230, 207, 0.2);
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(123, 200, 140, 0.5);
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(93, 175, 105, 0.7);
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
  gap: 12px;
}

.message.user {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-assistant {
  background: linear-gradient(135deg, #A8E6CF 0%, #7BC88C 100%);
}

.avatar-user {
  background: linear-gradient(135deg, #E8F5E9 0%, #D4EED4 100%);
}

.message-bubble {
  padding: 14px 18px;
  border-radius: 24px;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #7BC88C 0%, #5DAF69 100%);
  color: #fff;
  box-shadow: 
    0 6px 20px rgba(93, 175, 105, 0.25),
    0 2px 8px rgba(93, 175, 105, 0.1);
}

.message.assistant .message-bubble {
  background: linear-gradient(135deg, #ffffff 0%, #F5F9E9 100%);
  color: #2D3A27;
  border: 2px solid rgba(168, 230, 207, 0.6);
  box-shadow: 
    0 4px 16px rgba(168, 230, 207, 0.2),
    0 1px 4px rgba(93, 175, 105, 0.08);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
  color: #6B8E6B;
}

.loading-dots::after {
  content: '';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

.chat-input {
  padding: 24px;
  border-top: 1px solid rgba(168, 230, 207, 0.4);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 249, 233, 0.95) 100%);
  backdrop-filter: blur(15px);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

:deep(.el-textarea__inner) {
  border: 2px solid rgba(168, 230, 207, 0.5) !important;
  border-radius: 16px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  color: #2D5A27 !important;
  font-size: 15px !important;
  line-height: 1.6 !important;
  padding: 14px 18px !important;
  transition: all 0.3s ease !important;
  box-shadow: 
    0 2px 8px rgba(168, 230, 207, 0.15) inset,
    0 1px 3px rgba(93, 175, 105, 0.08) !important;
}

:deep(.el-textarea__inner:focus) {
  border-color: #7BC88C !important;
  box-shadow: 
    0 0 0 4px rgba(123, 200, 140, 0.15),
    0 4px 12px rgba(123, 200, 140, 0.2) !important;
  outline: none !important;
}

:deep(.el-textarea__inner::placeholder) {
  color: rgba(93, 175, 105, 0.5) !important;
}

:deep(.el-select .el-input__wrapper) {
  border: 2px solid rgba(168, 230, 207, 0.5) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 
    0 2px 8px rgba(168, 230, 207, 0.15) inset !important;
  padding: 8px 14px !important;
  transition: all 0.3s ease !important;
}

:deep(.el-select:hover .el-input__wrapper) {
  border-color: #7BC88C !important;
  box-shadow: 
    0 0 0 3px rgba(123, 200, 140, 0.1),
    0 2px 8px rgba(168, 230, 207, 0.2) !important;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #5DAF69 !important;
  box-shadow: 
    0 0 0 4px rgba(93, 175, 105, 0.15) !important;
}

:deep(.el-select .el-input__inner) {
  color: #2D5A27 !important;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #7BC88C 0%, #5DAF69 100%) !important;
  border: none !important;
  border-radius: 14px !important;
  padding: 12px 24px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #fff !important;
  box-shadow: 
    0 4px 14px rgba(93, 175, 105, 0.3),
    0 2px 6px rgba(93, 175, 105, 0.2) !important;
  transition: all 0.3s ease !important;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 
    0 6px 18px rgba(93, 175, 105, 0.35),
    0 3px 8px rgba(93, 175, 105, 0.25) !important;
}

:deep(.el-button--primary:active) {
  transform: translateY(0) !important;
}

:deep(.el-button--primary.is-disabled) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

:deep(.el-button--danger) {
  background: rgba(255, 255, 255, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  color: #2D5A27 !important;
  border-radius: 12px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
}

:deep(.el-button--danger:hover) {
  background: rgba(255, 255, 255, 0.4) !important;
  transform: translateY(-1px) !important;
}
</style>