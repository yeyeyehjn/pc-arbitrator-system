<template>
  <div class="info-tab-wrapper">
    <div class="info-tab" ref="contentRef">
    <!-- 基本信息 -->
    <div class="section-card" id="section-base">
      <div class="section-title">基本信息</div>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="案号">{{ caseInfo.caseNo }}</el-descriptions-item>
        <el-descriptions-item label="案由">{{ caseInfo.caseReason }}</el-descriptions-item>
        <el-descriptions-item label="案件状态">{{ caseInfo.caseStatus }}</el-descriptions-item>
        <el-descriptions-item label="立案日期">{{ caseInfo.filingDate }}</el-descriptions-item>
        <el-descriptions-item label="办案秘书">{{ caseInfo.secretary }}</el-descriptions-item>
        <el-descriptions-item label="秘书电话">{{ caseInfo.secretaryPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="秘书邮箱">{{ caseInfo.secretaryEmail || '—' }}</el-descriptions-item>
        <el-descriptions-item label="仲裁庭">{{ caseInfo.tribunal }}</el-descriptions-item>
        <el-descriptions-item label="组庭日期">{{ caseInfo.groupDate }}</el-descriptions-item>
        <el-descriptions-item label="开庭日期">{{ caseInfo.hearingDate }}</el-descriptions-item>
        <el-descriptions-item label="案件审限">
          <span class="deadline-text">
            {{ caseInfo.deadline }}
            <span :class="remainDaysClass">（剩余 {{ caseInfo.remainDays }} 天）</span>
            <el-tag v-if="caseInfo.isSuspended" size="small" type="info" class="suspend-tag">已中止</el-tag>
            <span v-if="caseInfo.extensionCount > 0" class="extension-text">（延期 {{ caseInfo.extensionCount }} 次）</span>
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 当事人 -->
    <div class="section-card">
      <div class="section-title">当事人</div>
      <PartyCompare :applicants="parties.applicants" :respondents="parties.respondents" />
    </div>

    <!-- 请求答辩 -->
    <div class="section-card" id="section-claim">
      <div class="section-title">请求答辩</div>

      <!-- 1. 仲裁条款约定情况 -->
      <div class="claim-section">
        <div class="claim-title">仲裁条款约定情况</div>
        <div class="claim-content">{{ claims.arbitrationClause?.text || '—' }}</div>
        <div v-if="claims.arbitrationClause?.attachments?.length" class="claim-files">
          <el-link
            v-for="file in claims.arbitrationClause.attachments"
            :key="file.name"
            type="primary"
            :underline="false"
            :icon="Document"
            class="file-link"
            @click="handleFile(file.name)"
          >{{ file.name }}</el-link>
        </div>
      </div>

      <!-- 2. 合同签订主体及签章情况 -->
      <div class="claim-section">
        <div class="claim-title">合同签订主体及签章情况</div>
        <div class="claim-content">{{ claims.contractSign?.text || '—' }}</div>
        <div v-if="claims.contractSign?.attachments?.length" class="claim-files">
          <el-link
            v-for="file in claims.contractSign.attachments"
            :key="file.name"
            type="primary"
            :underline="false"
            :icon="Document"
            class="file-link"
            @click="handleFile(file.name)"
          >{{ file.name }}</el-link>
        </div>
      </div>

      <!-- 3. 事实和理由 -->
      <div class="claim-section">
        <div class="claim-title">事实和理由</div>
        <div class="claim-content long-text">{{ claims.factsAndReasons?.text || '—' }}</div>
        <div v-if="claims.factsAndReasons?.attachments?.length" class="claim-files">
          <el-link
            v-for="file in claims.factsAndReasons.attachments"
            :key="file.name"
            type="primary"
            :underline="false"
            :icon="Document"
            class="file-link"
            @click="handleFile(file.name)"
          >{{ file.name }}</el-link>
        </div>
      </div>

      <!-- 4. 请求列表 -->
      <div class="claim-section">
        <div class="claim-title">请求列表</div>
        <div class="claim-list">
          <div v-for="(item, idx) in claims.claimList" :key="item.id" class="claim-list-item">
            <span class="item-index">{{ idx + 1 }}</span>
            <span class="item-content">{{ item.content }}</span>
          </div>
          <div v-if="!claims.claimList?.length" class="empty-inline">暂无请求</div>
        </div>
      </div>

      <!-- 5. 答辩意见 -->
      <div class="claim-section">
        <div class="claim-title">答辩意见</div>
        <div class="defense-list">
          <div v-for="(defense, idx) in claims.defenseList" :key="defense.id" class="defense-item">
            <div class="defense-head">
              <span class="defense-index">答辩 {{ idx + 1 }}</span>
              <span class="defense-respondent">{{ defense.respondent }}</span>
            </div>
            <div class="defense-content">{{ defense.content }}</div>
            <div v-if="defense.files?.length" class="claim-files">
              <el-link
                v-for="file in defense.files"
                :key="file.name"
                type="primary"
                :underline="false"
                :icon="Document"
                class="file-link"
                @click="handleFile(file.name)"
              >{{ file.name }}</el-link>
            </div>
          </div>
          <div v-if="!claims.defenseList?.length" class="empty-inline">暂无答辩</div>
        </div>
      </div>
    </div>

    <!-- 证据 -->
    <div class="section-card" id="section-evidence">
      <div class="section-title-row">
        <div class="section-title">证据</div>
        <div class="section-actions">
          <el-button size="small" :icon="Download" @click="handleDownloadAll">一键下载</el-button>
          <el-button size="small" type="primary" :icon="Reading" @click="openMaterialReader">材料阅览</el-button>
        </div>
      </div>
      <div class="evidence-group">
        <div class="group-label">申请人证据</div>
        <MaterialList :materials="evidence.applicant" />
      </div>
      <div class="evidence-group">
        <div class="group-label">被申请人证据</div>
        <MaterialList :materials="evidence.respondent" />
      </div>
    </div>

    <!-- 其他附件 -->
    <div class="section-card" id="section-attachment">
      <div class="section-title">其他附件</div>
      <MaterialList :materials="attachments" />
    </div>
    </div>

    <!-- 右侧悬浮锚点导航 -->
    <div class="anchor-nav">
      <div
        v-for="item in anchors"
        :key="item.id"
        class="anchor-item"
        :class="{ active: activeAnchor === item.id }"
        @click="scrollToSection(item.id)"
      >
        <span class="anchor-dot"></span>
        <span class="anchor-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Download, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import PartyCompare from './shared/PartyCompare.vue'
import MaterialList from './shared/MaterialList.vue'

const props = defineProps({
  caseInfo: {
    type: Object,
    default: () => ({}),
  },
  parties: {
    type: Object,
    default: () => ({}),
  },
  claims: {
    type: Object,
    default: () => ({}),
  },
  evidence: {
    type: Object,
    default: () => ({}),
  },
  attachments: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
const router = useRouter()

const handleDownloadAll = () => {
  ElMessage.success('一键下载已开始，文件打包中...')
}

const openMaterialReader = () => {
  const caseId = route.params.id
  const url = router.resolve(`/cases/${caseId}/material-reader`).href
  window.open(url, '_blank')
}

const remainDaysClass = computed(() => {
  const days = props.caseInfo.remainDays
  if (days < 0) return 'expired'
  if (days <= 15) return 'expiring'
  return 'normal'
})

const handleFile = (name) => {
  ElMessage.success(`《${name}》预览加载中`)
}

// ============ 锚点导航 ============
const anchors = [
  { id: 'section-base', label: '基本信息' },
  { id: 'section-party', label: '当事人' },
  { id: 'section-claim', label: '请求和答辩' },
  { id: 'section-evidence', label: '证据' },
  { id: 'section-attachment', label: '其他附件' },
]
const activeAnchor = ref('section-base')

// 点击锚点：用原生 scrollIntoView + CSS scroll-margin-top 预留顶部空间
const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (!el) return
  activeAnchor.value = id
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 滚动监听：基于视口位置高亮当前锚点
// scroll 事件不冒泡，但用 capture 模式挂 window 可捕获子容器（el-main）的滚动
const handleScroll = () => {
  for (let i = anchors.length - 1; i >= 0; i--) {
    const el = document.getElementById(anchors[i].id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    // 元素顶部进入视口顶部 120px 以内视为当前区域
    if (rect.top <= 120) {
      activeAnchor.value = anchors[i].id
      return
    }
  }
  activeAnchor.value = anchors[0].id
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

<style scoped lang="scss">
.info-tab-wrapper {
  display: block;
}

.info-tab {
  width: 100%;
}

.anchor-nav {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 100;
  width: 120px;
  padding: 12px 0;
  background-color: #ffffff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  // 移动端隐藏锚点导航
  @media (max-width: 768px) {
    display: none;
  }

  .anchor-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.2s;

    .anchor-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #8a8e95;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .anchor-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      transition: color 0.2s;
    }

    &:hover {
      .anchor-label {
        color: var(--el-color-primary);
      }

      .anchor-dot {
        background-color: var(--el-color-primary);
      }
    }

    &.active {
      background-color: #f2f5fa;

      .anchor-dot {
        background-color: var(--el-color-primary);
        width: 8px;
        height: 8px;
      }

      .anchor-label {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }
}

.info-tab {
  .section-card {
    scroll-margin-top: 100px;

    // 基本信息描述列表：label 单元格降权为常规字重
    &#section-base {
      :deep(.el-descriptions__label.is-bordered-label) {
        font-weight: 400;
      }

      // 立案日期（第2行第1列）
      :deep(tbody tr:nth-child(2) > td.el-descriptions__label:nth-child(1)) {
        opacity: 0.99;
      }
    }

    .deadline-text {
      .expiring {
        color: #e6a23c;
        font-weight: 600;
      }

      .expired {
        color: #f56c6c;
        font-weight: 600;
      }

      .normal {
        color: var(--el-text-color-secondary);
      }

      .suspend-tag {
        margin: 0 8px;
      }

      .extension-text {
        color: var(--el-text-color-secondary);
      }
    }

    .claim-section {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .claim-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-regular);
        position: relative;
        padding-left: 10px;
        margin-bottom: 8px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 4px;
          bottom: 4px;
          width: 2px;
          background-color: var(--el-color-primary);
        }
      }

      .claim-content {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.8;
        white-space: pre-wrap;
        padding-left: 12px;

        &.long-text {
          text-indent: 2em;
        }
      }

      .claim-files {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 8px 0 0 12px;

        .file-link {
          font-size: 12px;
        }
      }

      .claim-list {
        padding-left: 12px;

        .claim-list-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 12px;
          margin-bottom: 8px;
          background-color: #f5f7fa;
          border-radius: 4px;

          &:last-child {
            margin-bottom: 0;
          }

          .item-index {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            background-color: var(--el-color-primary);
            color: #ffffff;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
            margin-top: 1px;
          }

          .item-content {
            font-size: 14px;
            color: var(--el-text-color-regular);
            line-height: 1.6;
            flex: 1;
          }
        }
      }

      .defense-list {
        padding-left: 12px;

        .defense-item {
          padding: 12px;
          margin-bottom: 10px;
          background-color: #f5f7fa;
          border-radius: 4px;

          &:last-child {
            margin-bottom: 0;
          }

          .defense-head {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;

            .defense-index {
              font-size: 12px;
              font-weight: 600;
              color: var(--el-color-primary);
              background-color: #f2f5fa;
              padding: 2px 8px;
              border-radius: 3px;
            }

            .defense-respondent {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }

          .defense-content {
            font-size: 14px;
            color: var(--el-text-color-regular);
            line-height: 1.8;
            margin-bottom: 8px;
          }
        }
      }

      .empty-inline {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        padding: 8px 0;
      }
    }

    .evidence-group {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .group-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }
    }
  }
}
</style>
