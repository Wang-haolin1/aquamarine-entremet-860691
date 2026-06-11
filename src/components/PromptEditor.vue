<template>
  <div class="prompt-editor">
    <div class="editor-header">
      <span class="title">提示词管理</span>
      <div class="header-actions">
        <el-button size="small" @click="handleImport">导入</el-button>
        <el-button size="small" @click="handleExport">导出</el-button>
        <el-button type="primary" size="small" @click="handleNewTemplate">新建模板</el-button>
      </div>
    </div>
    
    <div class="editor-content">
      <div class="template-list">
        <div
          v-for="template in promptTemplates"
          :key="template.id"
          :class="['template-item', { active: currentPromptTemplate.id === template.id }]"
          @click="selectTemplate(template)"
        >
          <div class="template-name">{{ template.name }}</div>
          <div class="template-actions">
            <el-button type="text" size="small" @click.stop="handleEditTemplate(template)">编辑</el-button>
            <el-button type="text" size="small" class="delete-btn" @click.stop="handleDeleteTemplate(template.id)">删除</el-button>
          </div>
        </div>
      </div>
      
      <div class="template-edit">
        <el-form :model="editingTemplate" label-width="100px">
          <el-form-item label="模板名称">
            <el-input v-model="editingTemplate.name" placeholder="请输入模板名称" />
          </el-form-item>
          
          <el-form-item label="系统提示词">
            <el-input
              v-model="editingTemplate.systemPrompt"
              type="textarea"
              :rows="6"
              placeholder="请输入系统提示词"
            />
          </el-form-item>
          
          <el-form-item label="用户模板">
            <div class="user-templates">
              <div
                v-for="(ut, index) in editingTemplate.userTemplates"
                :key="index"
                class="user-template-item"
              >
                <el-input
                  v-model="ut.name"
                  placeholder="名称"
                  style="width: 120px; margin-right: 10px;"
                />
                <el-input
                  v-model="ut.template"
                  placeholder="提示词模板"
                  style="flex: 1;"
                />
                <el-button
                  type="danger"
                  size="small"
                  @click="removeUserTemplate(index)"
                >
                  删除
                </el-button>
              </div>
              <el-button type="text" @click="addUserTemplate">+ 添加用户模板</el-button>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none;"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useChatStore } from '../store'
import { ElMessage, ElMessageBox } from 'element-plus'

const chatStore = useChatStore()
const fileInputRef = ref(null)

const promptTemplates = computed(() => chatStore.promptTemplates)
const currentPromptTemplate = computed(() => chatStore.currentPromptTemplate)

const editingTemplate = reactive({
  id: '',
  name: '',
  systemPrompt: '',
  userTemplates: []
})

const selectTemplate = (template) => {
  Object.assign(editingTemplate, JSON.parse(JSON.stringify(template)))
  chatStore.currentPromptTemplate = template
}

const handleNewTemplate = () => {
  const newTemplate = {
    id: 'template-' + Date.now(),
    name: '新模板',
    systemPrompt: '你是一个智能助手。',
    userTemplates: []
  }
  selectTemplate(newTemplate)
}

const handleEditTemplate = (template) => {
  selectTemplate(template)
}

const handleSaveTemplate = () => {
  if (!editingTemplate.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  chatStore.savePromptTemplate(JSON.parse(JSON.stringify(editingTemplate)))
  chatStore.saveToStorage()
  ElMessage.success('保存成功')
}

const handleDeleteTemplate = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    chatStore.deletePromptTemplate(id)
    chatStore.saveToStorage()
    if (promptTemplates.value.length > 0) {
      selectTemplate(promptTemplates.value[0])
    }
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleReset = () => {
  selectTemplate(currentPromptTemplate.value)
}

const addUserTemplate = () => {
  editingTemplate.userTemplates.push({
    name: '',
    template: ''
  })
}

const removeUserTemplate = (index) => {
  editingTemplate.userTemplates.splice(index, 1)
}

const handleImport = () => {
  fileInputRef.value.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)
      if (Array.isArray(data)) {
        data.forEach(template => {
          if (!template.id) template.id = 'template-' + Date.now()
          chatStore.savePromptTemplate(template)
        })
      } else if (data.id) {
        chatStore.savePromptTemplate(data)
      }
      chatStore.saveToStorage()
      ElMessage.success('导入成功')
    } catch (err) {
      ElMessage.error('文件格式错误')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

const handleExport = () => {
  const data = JSON.stringify(promptTemplates.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'prompt-templates.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

if (promptTemplates.value.length > 0) {
  selectTemplate(promptTemplates.value[0])
}
</script>

<style scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(168, 230, 207, 0.4);
  background: linear-gradient(135deg, #A8E6CF 0%, #7BC88C 100%);
  color: #2D5A27;
}

.editor-header .title {
  font-size: 16px;
  font-weight: bold;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.template-list {
  width: 250px;
  border-right: 1px solid rgba(168, 230, 207, 0.4);
  overflow-y: auto;
  padding: 10px;
  background: rgba(245, 249, 233, 0.5);
}

.template-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 16px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(168, 230, 207, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.template-item:hover {
  background: rgba(168, 230, 207, 0.3);
  transform: translateX(4px);
}

.template-item.active {
  background: linear-gradient(135deg, #7BC88C 0%, #5DAF69 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(93, 175, 105, 0.3);
}

.template-name {
  flex: 1;
}

.template-actions {
  display: none;
}

.template-item:hover .template-actions {
  display: flex;
}

.template-item.active .template-actions {
  display: flex;
}

.template-actions .delete-btn {
  color: #e57373;
}

.template-edit {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.6);
}

.user-templates {
  width: 100%;
}

.user-template-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

/* 统一输入框美化 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border: 2px solid rgba(168, 230, 207, 0.5) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 
    0 2px 8px rgba(168, 230, 207, 0.15) inset !important;
  transition: all 0.3s ease !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #7BC88C !important;
  box-shadow: 
    0 0 0 3px rgba(123, 200, 140, 0.1),
    0 2px 8px rgba(168, 230, 207, 0.2) !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: #5DAF69 !important;
  box-shadow: 
    0 0 0 4px rgba(93, 175, 105, 0.15) !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: #2D5A27 !important;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: rgba(93, 175, 105, 0.5) !important;
}

/* 按钮美化 */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #7BC88C 0%, #5DAF69 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  color: #fff !important;
  box-shadow: 
    0 4px 12px rgba(93, 175, 105, 0.3) !important;
  transition: all 0.3s ease !important;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 
    0 6px 16px rgba(93, 175, 105, 0.35) !important;
}

:deep(.el-button--default) {
  border: 2px solid rgba(168, 230, 207, 0.5) !important;
  border-radius: 12px !important;
  color: #5DAF69 !important;
  background: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.3s ease !important;
}

:deep(.el-button--default:hover) {
  border-color: #5DAF69 !important;
  background: rgba(168, 230, 207, 0.2) !important;
  transform: translateY(-1px) !important;
}
</style>
