<template>
  <div class="home">
    <el-container class="main-container">
      <el-aside width="60px" class="sidebar">
        <div class="logo-section">
          <div class="tianguo-logo">&#x1F34E;</div>
        </div>
        <div class="sidebar-menu">
          <div
            v-for="item in menuItems"
            :key="item.key"
            :class="['menu-item', { active: activeTab === item.key }]"
            @click="activeTab = item.key"
          >
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
        </div>
        
        <div class="sidebar-bottom">
          <div
            class="menu-item"
            :class="{ active: activeTab === 'config' }"
            @click="activeTab = 'config'"
            title="&#x8BBE;&#x7F6E;"
          >
            <el-icon :size="24"><Setting /></el-icon>
          </div>
        </div>
      </el-aside>
      
      <el-main class="main-content">
        <div v-if="activeTab === 'chat'" class="tianguo-chat-wrapper">
          <div class="tianguo-header">
            <div class="header-content">
              <span class="header-icon">&#x1F34E;</span>
              <h1 class="header-title">&#x751C;&#x679C;&#x76F4;&#x64AD;&#x5C0F;&#x52A9;&#x624B;</h1>
              <span class="header-subtitle">&#x6816;&#x971E;&#x82F9;&#x679C;&#x76F4;&#x64AD;&#x597D;&#x5E2E;&#x624B;</span>
            </div>
            <div class="header-right">
              <WeatherWidget />
            </div>
          </div>
          <ChatBox />
        </div>
        <PromptEditor v-if="activeTab === 'prompt'" />
        <CorpusManager v-if="activeTab === 'corpus'" />
        
        <div v-if="activeTab === 'config'" class="config-page">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>&#x2699;&#xFE0F; API&#x914D;&#x7F6E;</span>
              </div>
            </template>
            
            <el-form :model="apiConfig" label-width="120px">
              <el-form-item label="AI&#x670D;&#x52A1;&#x63D0;&#x4F9B;&#x5546;">
                <el-select v-model="apiConfig.provider" style="width: 100%;">
                  <el-option label="OpenAI" value="openai" />
                  <el-option label="Claude" value="claude" />
                  <el-option label="&#x901A;&#x4E49;&#x5343;&#x95EE;" value="tongyi" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="API Key">
                <el-input
                  v-model="apiConfig.apiKey"
                  type="password"
                  show-password
                  placeholder="&#x8BF7;&#x8F93;&#x5165;API Key"
                />
              </el-form-item>
              
              <el-form-item label="&#x6A21;&#x578B;&#x540D;&#x79F0;">
                <el-input
                  v-model="apiConfig.model"
                  placeholder="&#x4F8B;&#x5982;: gpt-3.5-turbo"
                />
              </el-form-item>
              
              <el-form-item label="API&#x5730;&#x5740;">
                <el-input
                  v-model="apiConfig.baseUrl"
                  placeholder="&#x8BF7;&#x8F93;&#x5165;API&#x5730;&#x5740;"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSaveConfig">&#x4FDD;&#x5B58;&#x914D;&#x7F6E;</el-button>
                <el-button @click="handleResetConfig">&#x91CD;&#x7F6E;</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          
          <el-card class="config-card" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>&#x1F34E; &#x5173;&#x4E8E;&#x751C;&#x679C;&#x76F4;&#x64AD;&#x5C0F;&#x52A9;&#x624B;</span>
              </div>
            </template>
            
            <div class="about-content">
              <div class="tianguo-about">
                <div class="about-icon">&#x1F34E;</div>
                <h3>&#x751C;&#x679C;&#x76F4;&#x64AD;&#x5C0F;&#x52A9;&#x624B;</h3>
                <p>&#x7248;&#x672C;: 2.0.0</p>
                <p class="about-desc">&#x4E13;&#x4E3A;&#x6816;&#x971E;&#x82F9;&#x679C;&#x76F4;&#x64AD;&#x6253;&#x9020;&#x7684;AI&#x52A9;&#x624B;&#xFF0C;&#x52A9;&#x529B;&#x679C;&#x519C;&#x76F4;&#x64AD;&#x9500;&#x552E;&#xFF01;</p>
                <div class="features-list">
                  <div class="feature-item">
                    <span class="feature-icon">1&#xFE0F;&#x20E3;</span>
                    <span>&#x8BCD;&#x6C47;&#x8BED;&#x97F3;&#x901A;&#x9053;</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">2&#xFE0F;&#x20E3;</span>
                    <span>&#x53E5;&#x6CD5;&#x4FEE;&#x8F9E;&#x901A;&#x9053;</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">3&#xFE0F;&#x20E3;</span>
                    <span>&#x8BED;&#x7528;&#x7B56;&#x7565;&#x901A;&#x9053;</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">4&#xFE0F;&#x20E3;</span>
                    <span>&#x53D9;&#x4E8B;&#x5185;&#x5BB9;&#x901A;&#x9053;</span>
                  </div>
                </div>
                <p style="margin-top: 15px; color: #909399; font-size: 14px;">
                  &#x63D0;&#x793A;: &#x8BF7;&#x5148;&#x914D;&#x7F6E;API Key&#x540E;&#x518D;&#x4F7F;&#x7528;&#x5BF9;&#x8BDD;&#x529F;&#x80FD;
                </p>
              </div>
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useChatStore } from '../store'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Guide, Files, Setting } from '@element-plus/icons-vue'
import ChatBox from '../components/ChatBox.vue'
import PromptEditor from '../components/PromptEditor.vue'
import CorpusManager from '../components/CorpusManager.vue'
import WeatherWidget from '../components/WeatherWidget.vue'

const chatStore = useChatStore()

const activeTab = ref('chat')

const menuItems = [
  { key: 'chat', icon: ChatDotRound, title: '\u5BF9\u8BDD' },
  { key: 'prompt', icon: Guide, title: '\u63D0\u793A\u8BCD' },
  { key: 'corpus', icon: Files, title: '\u8BED\u6599\u5E93' }
]

const apiConfig = reactive({
  provider: 'tongyi',
  apiKey: 'sk-96f45e8bc7ac4063bbb319494fcab27f',
  model: 'qwen-plus',
  baseUrl: 'https://dashscope.aliyuncs.com'
})

onMounted(() => {
  chatStore.loadFromStorage()
  Object.assign(apiConfig, chatStore.apiConfig)
})

const handleSaveConfig = () => {
  chatStore.apiConfig = { ...apiConfig }
  chatStore.saveToStorage()
  ElMessage.success('\u914D\u7F6E\u5DF2\u4FDD\u5B58')
}

const handleResetConfig = () => {
  Object.assign(apiConfig, {
    provider: 'tongyi',
    apiKey: 'sk-96f45e8bc7ac4063bbb319494fcab27f',
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com'
  })
}
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
}

.main-container {
  height: 100%;
}

.sidebar {
  background: linear-gradient(180deg, #A8E6CF 0%, #7BC88C 50%, #5DAF69 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0;
}

.logo-section {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.tianguo-logo {
  font-size: 36px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.sidebar-menu,
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.menu-item {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  transform: scale(1.1);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.4);
  color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.main-content {
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #F5F9E9 0%, #F0F7E6 50%, #FAFDF4 100%);
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(168, 230, 207, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(123, 200, 140, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.tianguo-chat-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  min-height: 0;
}

.tianguo-header {
  background: linear-gradient(90deg, #A8E6CF 0%, #7BC88C 100%);
  padding: 20px;
  color: #2D5A27;
  box-shadow: 0 4px 20px rgba(123, 200, 140, 0.3);
  border-bottom: 3px solid rgba(93, 175, 105, 0.2);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 40px;
}

.header-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.85;
  margin-left: 10px;
  color: #2D5A27;
}

.config-page {
  padding: 30px;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #F5F9E9 0%, #F0F7E6 100%);
  position: relative;
  z-index: 1;
}

.config-card {
  max-width: 600px;
  margin: 0 auto;
  border-radius: 24px;
  box-shadow: 
    0 8px 30px rgba(93, 175, 105, 0.15),
    0 2px 10px rgba(93, 175, 105, 0.05);
  border: 1px solid rgba(168, 230, 207, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #2D5A27;
}

.about-content {
  padding: 20px 0;
  line-height: 1.8;
}

.tianguo-about {
  text-align: center;
}

.about-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.tianguo-about h3 {
  margin: 0 0 10px 0;
  color: #5DAF69;
  font-size: 24px;
}

.about-desc {
  color: #4A6746;
  font-size: 16px;
  margin-bottom: 20px;
}

.features-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 20px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%);
  border-radius: 16px;
  border: 1px solid rgba(168, 230, 207, 0.4);
}

.feature-icon {
  font-size: 20px;
}
</style>
