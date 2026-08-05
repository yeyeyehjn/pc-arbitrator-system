<template>
  <div class="work-unit">
    <InfoSection
      title="工作单位"
      v-model="editing"
      :hide-edit-actions="true"
      @save="handleSave"
      @cancel="handleCancel"
    >
      <!-- 只读态 -->
      <template #view>
        <div class="work-view">
          <!-- 主体行：公司名 + 职务摘要 -->
          <header class="work-hero">
            <div class="hero-icon" aria-hidden="true">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="hero-text">
              <h3 class="hero-company">{{ workUnit.company || '未填写单位名称' }}</h3>
              <div class="hero-sub">
                <span v-if="workUnit.position" class="hero-position">{{ workUnit.position }}</span>
                <span v-if="workUnit.position && workUnit.department" class="hero-sep">·</span>
                <span v-if="workUnit.department" class="hero-dept">{{ workUnit.department }}</span>
                <el-tag
                  v-if="workUnit.status"
                  size="small"
                  :type="workUnit.status === 'active' ? 'success' : 'info'"
                  class="hero-status"
                >
                  {{ workUnit.status === 'active' ? '在职' : '退休' }}
                </el-tag>
              </div>
            </div>
          </header>

          <!-- 联系方式网格 -->
          <div class="meta-grid">
            <div class="meta-cell">
              <div class="meta-label">
                <el-icon class="meta-icon"><Phone /></el-icon>
                <span>单位电话</span>
              </div>
              <div class="meta-value">
                <a v-if="workUnit.phone" :href="'tel:' + workUnit.phone" class="link-text">{{ workUnit.phone }}</a>
                <span v-else class="meta-empty">-</span>
              </div>
            </div>
            <div class="meta-cell">
              <div class="meta-label">
                <el-icon class="meta-icon"><Printer /></el-icon>
                <span>单位传真</span>
              </div>
              <div class="meta-value">
                <span v-if="workUnit.fax" class="num-text">{{ workUnit.fax }}</span>
                <span v-else class="meta-empty">-</span>
              </div>
            </div>
          </div>

          <!-- 地址 -->
          <div class="meta-block">
            <div class="meta-label">
              <el-icon class="meta-icon"><LocationInformation /></el-icon>
              <span>单位地址</span>
            </div>
            <div class="meta-value meta-value--block">
              {{ workUnit.address || '-' }}
            </div>
          </div>

          <!-- 备注 -->
          <div class="meta-block">
            <div class="meta-label">
              <el-icon class="meta-icon"><ChatDotSquare /></el-icon>
              <span>备注</span>
            </div>
            <div class="meta-value meta-value--block meta-remark">
              {{ workUnit.remark || '-' }}
            </div>
          </div>

          <!-- 附件 -->
          <div class="meta-block">
            <div class="meta-label">
              <el-icon class="meta-icon"><Folder /></el-icon>
              <span>附件</span>
              <span v-if="workUnit.attachments && workUnit.attachments.length" class="meta-count">
                {{ workUnit.attachments.length }}
              </span>
            </div>
            <div class="meta-value meta-value--block">
              <div v-if="workUnit.attachments && workUnit.attachments.length" class="attach-list">
                <a
                  v-for="(file, idx) in workUnit.attachments"
                  :key="idx"
                  href="javascript:void(0)"
                  class="attach-chip"
                  @click="handleDownload(file)"
                >
                  <el-icon class="attach-icon"><Document /></el-icon>
                  <span class="attach-name">{{ file.name }}</span>
                </a>
              </div>
              <span v-else class="meta-empty">-</span>
            </div>
          </div>
        </div>
      </template>
      <!-- 编辑态 -->
      <template #edit>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="left" class="work-edit-form">
          <el-form-item label="单位名称" prop="company">
            <el-input v-model="form.company" placeholder="请输入单位名称" />
          </el-form-item>
          <el-form-item label="工作部门" prop="department">
            <el-input v-model="form.department" placeholder="请输入工作部门" />
          </el-form-item>
          <el-form-item label="职务" prop="position">
            <el-input v-model="form.position" placeholder="请输入职务" />
          </el-form-item>
          <el-form-item label="单位电话" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入单位电话" />
          </el-form-item>
          <el-form-item label="工作状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择工作状态" style="width: 100%">
              <el-option label="在职" value="active" />
              <el-option label="退休" value="retired" />
            </el-select>
          </el-form-item>
          <el-form-item label="单位传真" prop="fax">
            <el-input v-model="form.fax" placeholder="请输入单位传真" />
          </el-form-item>
          <el-form-item label="单位地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入单位地址" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
          <el-form-item label="附件">
            <el-upload
              v-model:file-list="fileList"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :before-upload="beforeUpload"
              multiple
            >
              <el-button type="primary" plain>
                <el-icon><Upload /></el-icon>
                <span>点击上传</span>
              </el-button>
              <template #tip>
                <div class="upload-tip">支持 pdf/doc/docx 格式</div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSave">保存</el-button>
            <el-button @click="handleCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </template>
    </InfoSection>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Upload,
  OfficeBuilding,
  Phone,
  Printer,
  LocationInformation,
  ChatDotSquare,
  Folder,
} from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import InfoSection from './shared/InfoSection.vue'

const profileStore = useProfileStore()

// ============ 响应式列数 ============
const windowWidth = ref(window.innerWidth)
const descColumn = computed(() => (windowWidth.value <= 768 ? 1 : 2))
const handleResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// ============ 数据 ============
const workUnit = computed(() => profileStore.workUnit)
const editing = ref(false)
const formRef = ref(null)
const form = reactive({
  company: '',
  department: '',
  position: '',
  phone: '',
  status: 'active',
  fax: '',
  address: '',
  remark: '',
  attachments: [],
})

const fileList = ref([])

const rules = {
  phone: [
    { pattern: /^[\d-]+$|^$/, message: '请输入正确的电话号码', trigger: 'blur' },
  ],
}

watch(editing, (val) => {
  if (val) {
    Object.assign(form, {
      company: workUnit.value.company,
      department: workUnit.value.department,
      position: workUnit.value.position,
      phone: workUnit.value.phone,
      status: workUnit.value.status,
      fax: workUnit.value.fax,
      address: workUnit.value.address,
      remark: workUnit.value.remark,
      attachments: [...(workUnit.value.attachments || [])],
    })
    fileList.value = (workUnit.value.attachments || []).map((f, idx) => ({
      name: f.name,
      url: f.url,
      uid: Date.now() + idx,
    }))
  }
})

const beforeUpload = (file) => {
  const allowed = ['.pdf', '.doc', '.docx']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowed.includes(ext)) {
    ElMessage.warning('仅支持 pdf/doc/docx 格式')
    return false
  }
  return false
}

const handleFileChange = (file) => {
  const allowed = ['.pdf', '.doc', '.docx']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowed.includes(ext)) {
    ElMessage.warning('仅支持 pdf/doc/docx 格式')
    const idx = fileList.value.findIndex((f) => f.uid === file.uid)
    if (idx !== -1) fileList.value.splice(idx, 1)
    return
  }
  // 同步到 form.attachments
  form.attachments = fileList.value.map((f) => ({ name: f.name, url: f.url || '#' }))
}

const handleFileRemove = () => {
  form.attachments = fileList.value.map((f) => ({ name: f.name, url: f.url || '#' }))
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    await profileStore.updateWorkUnit({ ...form, attachments: [...form.attachments] })
    ElMessage.success('保存成功')
    editing.value = false
  })
}

const handleCancel = () => {
  formRef.value?.resetFields()
}

const handleDownload = (file) => {
  ElMessage.info('下载功能开发中')
}
</script>

<style scoped lang="scss">
.work-unit {
  .link-text {
    color: var(--el-color-primary);
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover {
      text-decoration: underline;
      color: var(--el-color-primary-dark-2);
    }
  }

  .work-edit-form {
    max-width: 640px;
  }

  .upload-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}

/* ============ 只读态 ============ */
.work-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 主体行 */
.work-hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 6px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 22px;
}

.hero-text {
  min-width: 0;
  flex: 1;
}

.hero-company {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  text-wrap: balance;
}

.hero-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.hero-position {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.hero-sep {
  color: var(--el-text-color-placeholder);
}

.hero-status {
  margin-left: 4px;
}

/* 元数据：联系方式网格 */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 32px;
}

/* 元数据：整行区块 */
.meta-block {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 16px;
  align-items: start;
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  padding-top: 1px;
}

.meta-icon {
  font-size: 14px;
  color: var(--el-color-primary-light-5);
}

.meta-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.meta-value {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  min-width: 0;
}

.meta-value--block {
  line-height: 1.7;
}

.meta-remark {
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

.num-text {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.meta-empty {
  color: var(--el-text-color-placeholder);
}

/* 附件列表 */
.attach-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attach-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 5px 10px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.4;
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;

  .attach-icon {
    font-size: 14px;
    color: var(--el-color-primary-light-5);
    flex-shrink: 0;
  }

  .attach-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    text-decoration: none;

    .attach-icon {
      color: var(--el-color-primary);
    }
  }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .work-unit .work-edit-form {
    max-width: 100%;
  }

  .meta-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .meta-block {
    grid-template-columns: 80px 1fr;
    gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-unit .link-text,
  .work-unit .attach-chip {
    transition: none;
  }
}
</style>
