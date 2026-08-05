<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    direction="rtl"
    size="42%"
  >
    <div class="detail-content">
      <!-- 当事人类型徽章 -->
      <div class="type-badge">
        <el-tag :type="partyBadgeType" size="default">
          <el-icon class="badge-icon"><component :is="partyBadgeIcon" /></el-icon>
          {{ partyBadgeText }}
        </el-tag>
      </div>

      <!-- 自然人详情 -->
      <template v-if="data.type === 'natural'">
        <el-descriptions :column="descColumn" border>
          <el-descriptions-item label="国籍/地区">{{ data.nationality }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ data.name }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ data.idType }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ data.idNumber }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ data.phone }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ data.email }}</el-descriptions-item>
          <el-descriptions-item label="法定地址" :span="2">{{ data.address }}</el-descriptions-item>
        </el-descriptions>
        <div class="doc-section">
          <div class="doc-label">身份证人像面</div>
          <div class="doc-preview">{{ data.idFront }}</div>
          <div class="doc-label">身份证国徽面</div>
          <div class="doc-preview">{{ data.idBack }}</div>
        </div>
      </template>

      <!-- 企业详情 -->
      <template v-else-if="data.type === 'enterprise'">
        <el-descriptions :column="descColumn" border>
          <el-descriptions-item label="国籍/地区">{{ data.nationality }}</el-descriptions-item>
          <el-descriptions-item label="企业名称">{{ data.name }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ data.idType }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ data.idNumber }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ data.phone }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ data.email }}</el-descriptions-item>
          <el-descriptions-item label="注册地址" :span="2">{{ data.address }}</el-descriptions-item>
        </el-descriptions>
        <div class="doc-section">
          <div class="doc-label">企业证件</div>
          <div class="doc-preview">{{ data.certificate }}</div>
        </div>
      </template>

      <!-- 代理人详情 -->
      <template v-else-if="data.agentType">
        <el-descriptions :column="descColumn" border>
          <el-descriptions-item label="类型">{{ data.agentType }}</el-descriptions-item>
          <el-descriptions-item label="国籍/地区">{{ data.nationality }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ data.name }}</el-descriptions-item>
          <el-descriptions-item label="工作单位">{{ data.firm }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ data.idType }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ data.idNumber }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ data.phone }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ data.email }}</el-descriptions-item>
          <el-descriptions-item label="委托人">{{ data.principal }}</el-descriptions-item>
          <el-descriptions-item label="代理权限">
            <el-tag :type="data.authority === '特殊授权' ? 'danger' : 'info'" size="small">
              {{ data.authority }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="doc-section">
          <div class="doc-label">授权委托书</div>
          <div class="doc-preview">{{ data.powerOfAttorney }}</div>
          <div class="doc-label">所函</div>
          <div class="doc-preview">{{ data.firmLetter }}</div>
          <div class="doc-label">律师证复印件</div>
          <div class="doc-preview">{{ data.licenseCopy }}</div>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { User, OfficeBuilding, Avatar } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:visible'])

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

// 响应式列数：移动端单列，PC 端双列
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const descColumn = computed(() => (windowWidth.value <= 768 ? 1 : 2))
const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const drawerTitle = computed(() => {
  if (props.data.agentType) return `代理人详情 - ${props.data.name}`
  if (props.data.type === 'natural') return `当事人详情 - ${props.data.name}`
  if (props.data.type === 'enterprise') return `企业详情 - ${props.data.name}`
  return '详情'
})

const partyBadgeType = computed(() => {
  if (props.data.agentType) return 'warning'
  if (props.data.type === 'natural') return 'success'
  if (props.data.type === 'enterprise') return 'primary'
  return 'info'
})

const partyBadgeIcon = computed(() => {
  if (props.data.agentType) return Avatar
  if (props.data.type === 'natural') return User
  if (props.data.type === 'enterprise') return OfficeBuilding
  return User
})

const partyBadgeText = computed(() => {
  if (props.data.agentType) return `代理人（${props.data.agentType}）`
  if (props.data.type === 'natural') return '自然人'
  if (props.data.type === 'enterprise') return '企业'
  return '当事人'
})
</script>

<style scoped lang="scss">
.detail-content {
  .type-badge {
    margin-bottom: 16px;

    .badge-icon {
      margin-right: 4px;
      vertical-align: middle;
    }
  }

  .doc-section {
    margin-top: 16px;

    .doc-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      margin: 12px 0 6px;
    }

    .doc-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      background-color: #f5f7fa;
      border: 1px dashed var(--el-border-color-lighter);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
