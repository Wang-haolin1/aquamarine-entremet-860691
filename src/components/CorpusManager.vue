<template>
  <div class="corpus-manager">
    <div class="manager-header">
      <span class="title">语料库管理</span>
      <div class="header-actions">
        <el-input
          v-model="searchText"
          placeholder="搜索语料..."
          style="width: 200px; margin-right: 10px;"
          size="small"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="small" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传语料
        </el-button>
        <el-button size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    
    <div class="manager-content">
      <div class="corpus-stats">
        <el-card>
          <div class="stat-item">
            <span class="stat-label">语料总数</span>
            <span class="stat-value">{{ corpus.length }}</span>
          </div>
        </el-card>
      </div>
      
      <div class="corpus-table">
        <el-table :data="filteredCorpus" stripe style="width: 100%">
          <el-table-column prop="name" label="文件名" min-width="200" />
          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryType(row.category)">
                {{ row.category || '未分类' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="100" />
          <el-table-column prop="createdAt" label="上传时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="handlePreview(row)">预览</el-button>
              <el-button type="text" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="text" size="small" class="delete-btn" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <el-dialog v-model="previewVisible" title="语料预览" width="70%">
      <div class="preview-content">
        <pre>{{ previewContent }}</pre>
      </div>
    </el-dialog>
    
    <el-dialog v-model="uploadVisible" title="上传语料" width="500px">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileSelect"
        accept=".txt,.json"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 TXT 和 JSON 格式的文件
          </div>
        </template>
      </el-upload>
      <el-form v-if="selectedFile" label-width="80px" style="margin-top: 20px;">
        <el-form-item label="分类">
          <el-select v-model="newCorpusCategory" placeholder="请选择分类">
            <el-option label="未分类" value="" />
            <el-option label="技术文档" value="tech" />
            <el-option label="产品资料" value="product" />
            <el-option label="用户手册" value="manual" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmUpload" :disabled="!selectedFile">确认上传</el-button>
      </template>
    </el-dialog>
    
    <input
      ref="fileInputRef"
      type="file"
      accept=".txt,.json"
      style="display: none;"
      @change="handleFileInputChange"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../store'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Download, UploadFilled } from '@element-plus/icons-vue'

const chatStore = useChatStore()

const searchText = ref('')
const previewVisible = ref(false)
const previewContent = ref('')
const uploadVisible = ref(false)
const selectedFile = ref(null)
const newCorpusCategory = ref('')
const fileInputRef = ref(null)
const uploadRef = ref(null)

const corpus = computed(() => chatStore.corpus)

const filteredCorpus = computed(() => {
  if (!searchText.value) return corpus.value
  return corpus.value.filter(item => 
    item.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const getCategoryType = (category) => {
  const types = {
    tech: 'primary',
    product: 'success',
    manual: 'warning',
    other: 'info'
  }
  return types[category] || ''
}

const handleUpload = () => {
  uploadVisible.value = true
  selectedFile.value = null
  newCorpusCategory.value = ''
}

const handleFileSelect = (file) => {
  selectedFile.value = file.raw
}

const handleFileInputChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleConfirmUpload = () => {
  if (!selectedFile.value) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const content = event.target.result
    chatStore.addCorpus({
      name: selectedFile.value.name,
      category: newCorpusCategory.value,
      content: content,
      size: formatFileSize(selectedFile.value.size)
    })
    chatStore.saveToStorage()
    ElMessage.success('上传成功')
    uploadVisible.value = false
    selectedFile.value = null
  }
  reader.readAsText(selectedFile.value)
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handlePreview = (item) => {
  previewContent.value = item.content
  previewVisible.value = true
}

const handleEdit = (item) => {
  ElMessage.info('编辑功能开发中')
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个语料吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    chatStore.deleteCorpus(id)
    chatStore.saveToStorage()
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const handleExport = () => {
  const data = JSON.stringify(corpus.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'corpus.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.corpus-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(168, 230, 207, 0.4);
  background: linear-gradient(135deg, #A8E6CF 0%, #7BC88C 100%);
  color: #2D5A27;
}

.manager-header .title {
  font-size: 16px;
  font-weight: bold;
}

.manager-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.corpus-stats {
  margin-bottom: 20px;
}

.corpus-stats .el-card {
  border-radius: 20px;
  border: 2px solid rgba(168, 230, 207, 0.4);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 16px rgba(93, 175, 105, 0.12);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #4A6746;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #5DAF69;
}

.corpus-table {
  flex: 1;
}

.corpus-table .el-table {
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(168, 230, 207, 0.3);
}

.delete-btn {
  color: #e57373;
}

.preview-content {
  max-height: 400px;
  overflow-y: auto;
}

.preview-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background: linear-gradient(135deg, #F5F9E9 0%, #F0F7E6 100%);
  padding: 15px;
  border-radius: 12px;
  border: 1px solid rgba(168, 230, 207, 0.4);
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

/* 上传组件美化 */
:deep(.el-upload-dragger) {
  border: 2px dashed rgba(168, 230, 207, 0.6) !important;
  border-radius: 20px !important;
  background: rgba(245, 249, 233, 0.8) !important;
  transition: all 0.3s ease !important;
}

:deep(.el-upload-dragger:hover) {
  border-color: #7BC88C !important;
  background: rgba(168, 230, 207, 0.1) !important;
}

:deep(.el-upload-dragger .el-icon-upload) {
  color: #7BC88C !important;
}

:deep(.el-upload__text) {
  color: #4A6746 !important;
}
</style>
