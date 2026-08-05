<template>
  <div class="material-reader">
    <!-- 顶部栏 -->
    <header class="reader-header">
      <div class="header-row header-row-main">
        <!-- 栏1：标题 -->
        <div class="header-col col-title">
          <el-icon :size="24"><Document /></el-icon>
          <span class="logo-text">材料阅览</span>
        </div>
        <!-- 栏2：案号 -->
        <div class="header-col col-case-no">
          <span class="case-no">{{ caseInfo.caseNo }}</span>
        </div>
        <!-- 栏3：基本信息（2行） -->
        <div class="header-col col-case-meta">
          <div class="meta-line">
            <span class="party-item">
              <span class="party-label">案由：</span>
              <span class="party-value">{{ caseInfo.caseReason }}</span>
            </span>
            <span class="separator">|</span>
            <span class="party-item">
              <span class="party-label">立案日期：</span>
              <span class="party-value">{{ caseInfo.filingDate }}</span>
            </span>
            <span class="separator">|</span>
            <span class="party-item">
              <span class="party-label">办案秘书：</span>
              <span class="party-value">{{ caseInfo.secretary }}</span>
            </span>
          </div>
          <div class="meta-line">
            <span class="party-item">
              <span class="party-label">申请人：</span>
              <span class="party-value">
                <span v-for="(p, idx) in parties.applicants" :key="p.id">
                  {{ p.name }}<span v-if="idx < parties.applicants.length - 1" class="party-join">、</span>
                </span>
                <span v-if="!parties.applicants?.length">—</span>
              </span>
            </span>
            <span class="separator">|</span>
            <span class="party-item">
              <span class="party-label">被申请人：</span>
              <span class="party-value">
                <span v-for="(p, idx) in parties.respondents" :key="p.id">
                  {{ p.name }}<span v-if="idx < parties.respondents.length - 1" class="party-join">、</span>
                </span>
                <span v-if="!parties.respondents?.length">—</span>
              </span>
            </span>
            <span class="separator">|</span>
            <span class="party-item">
              <span class="party-label">仲裁员：</span>
              <span class="party-value">{{ caseInfo.tribunal || '—' }}</span>
            </span>
          </div>
        </div>
        <div class="header-right">
          <el-button size="small" :icon="Close" @click="handleClose">关闭</el-button>
        </div>
      </div>
    </header>

    <div class="reader-body">
      <!-- 左侧材料目录 -->
      <aside class="reader-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <!-- 展开态：完整目录 -->
        <div v-show="!sidebarCollapsed" class="sidebar-inner">
          <div class="sidebar-title-row">
            <span class="sidebar-title">材料目录</span>
            <div class="sidebar-title-actions">
              <el-tooltip content="展开全部" placement="bottom">
                <el-button size="small" link :icon="Expand" aria-label="展开全部" @click="expandAll" />
              </el-tooltip>
              <el-tooltip content="折叠全部" placement="bottom">
                <el-button size="small" link :icon="Fold" aria-label="折叠全部" @click="collapseAll" />
              </el-tooltip>
              <el-tooltip content="收起目录" placement="bottom">
                <el-button size="small" link :icon="DArrowLeft" aria-label="收起目录" @click="collapseSidebar" />
              </el-tooltip>
            </div>
          </div>
          <!-- 搜索区域 -->
          <div class="sidebar-search">
            <el-input
              v-model="searchKeyword"
              size="small"
              clearable
              placeholder="搜索材料名称"
              :prefix-icon="Search"
            />
          </div>
          <div class="catalog-tree">
            <div
              v-for="group in filteredCatalogGroups"
              :key="group.id"
              class="catalog-group"
            >
              <div
                class="catalog-group-title"
                :class="{ active: activeGroup === group.id && !activeMaterial }"
                @click="selectGroup(group)"
              >
                <el-icon class="expand-icon" @click.stop="toggleGroup(group.id)">
                  <ArrowDown v-if="expandedGroups[group.id]" />
                  <ArrowRight v-else />
                </el-icon>
                <el-icon><FolderOpened /></el-icon>
                <span>{{ group.label }}</span>
                <span class="count">{{ group.items.length }}</span>
              </div>
              <div v-show="expandedGroups[group.id]" class="catalog-items">
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  class="catalog-item"
                  :class="{ active: activeMaterial?.id === item.id }"
                  @click="selectMaterial(group, item)"
                >
                  <el-icon><Document /></el-icon>
                  <span class="item-name" :title="item.name">{{ item.name }}</span>
                  <span class="item-type">{{ item.fileType?.toUpperCase() }}</span>
                </div>
                <div v-if="!group.items.length" class="empty-inline">无匹配材料</div>
              </div>
            </div>
            <div v-if="!filteredCatalogGroups.length" class="empty-inline empty-global">
              未找到匹配材料
            </div>
          </div>
        </div>
        <!-- 收起态：竖条轨道，点击展开 -->
        <div v-show="sidebarCollapsed" class="sidebar-rail" @click="expandSidebar">
          <el-icon class="rail-icon"><DArrowRight /></el-icon>
          <span class="rail-text">材料目录</span>
        </div>
      </aside>

      <!-- 右侧预览区 -->
      <main class="reader-content">
        <!-- 封面态：显示某组所有 PDF 第一页缩略图 -->
        <div v-if="viewMode === 'cover'" class="cover-view">
          <div class="cover-header">
            <h2 class="cover-title">{{ currentGroup?.label || '材料目录' }}</h2>
            <span class="cover-count">共 {{ currentGroup?.items.length || 0 }} 份材料</span>
          </div>
          <div class="cover-grid">
            <div
              v-for="item in currentGroup?.items"
              :key="item.id"
              class="cover-card"
              @click="selectMaterial(currentGroup, item)"
            >
              <div class="cover-thumbnail">
                <el-icon :size="48" v-if="item.fileType === 'pdf'"><Document /></el-icon>
                <el-icon :size="48" v-else><Picture /></el-icon>
                <span class="page-badge">{{ item.pages || 1 }} 页</span>
              </div>
              <div class="cover-info">
                <div class="cover-name" :title="item.name">{{ item.name }}</div>
                <div class="cover-meta">
                  <span>{{ item.type }}</span>
                  <span>{{ item.submitDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF 预览态 -->
        <div v-else-if="viewMode === 'preview'" class="preview-view">
          <!-- 预览便签页：切换不同 PDF -->
          <div class="preview-tabs">
            <div class="tabs-scroll">
              <div
                v-for="tab in openTabs"
                :key="tab.id"
                class="preview-tab"
                :class="{ active: activeTabId === tab.id }"
                @click="switchTab(tab)"
              >
                <el-icon class="tab-icon"><Document /></el-icon>
                <span class="tab-name" :title="tab.name">{{ tab.name }}</span>
                <el-icon class="tab-close" aria-label="关闭标签页" @click.stop="closeTab(tab.id)"><Close /></el-icon>
              </div>
            </div>
          </div>

          <!-- 预览工具栏 -->
          <div class="preview-toolbar">
            <div class="toolbar-left">
              <el-button size="small" :icon="Back" @click="backToCover">返回目录</el-button>
              <el-button size="small" :icon="ArrowLeft" :disabled="!hasPrev" @click="goPrev">上一份</el-button>
              <el-button size="small" :disabled="!hasNext" @click="goNext">
                下一份<el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
            <div class="toolbar-center">
              <span class="current-name">{{ activeMaterial?.name }}</span>
            </div>
            <div class="toolbar-right">
              <el-button size="small" :icon="InfoFilled" @click="toggleCaseInfo">案件信息</el-button>
              <el-button size="small" :icon="Monitor" @click="toggleSplit">双屏对照</el-button>
              <el-button size="small" :icon="Notebook" @click="toggleSummary">摘要</el-button>
              <el-button size="small" :icon="CircleCheck" @click="handleVerify">验签</el-button>
              <el-button size="small" :icon="Download" @click="handleDownload">下载</el-button>
              <el-button size="small" :icon="FullScreen" @click="toggleFullscreen">全屏</el-button>
              <el-button size="small" :icon="MagicStick" @click="handleOCR">OCR提取</el-button>
            </div>
          </div>

          <!-- 预览主体（含侧栏容器） -->
          <div class="preview-main">
            <div class="preview-body" :class="{ 'split-mode': splitMode }">
              <!-- 主预览区 -->
              <div class="preview-pane">
                <div class="pdf-placeholder">
                  <el-icon :size="64"><Document /></el-icon>
                  <p>{{ activeMaterial?.name }}</p>
                  <p class="placeholder-tip">[PDF 预览区] 共 {{ activeMaterial?.pages || 1 }} 页</p>
                </div>
              </div>

              <!-- 双屏对照：第二屏 -->
              <div v-if="splitMode" class="preview-pane split-second">
                <div class="split-selector">
                  <el-select v-model="splitTargetId" placeholder="选择对照材料" size="small" style="width: 220px">
                    <el-option
                      v-for="item in allMaterials"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </div>
                <div class="pdf-placeholder">
                  <el-icon :size="64"><Document /></el-icon>
                  <p>{{ splitTargetMaterial?.name || '请选择对照材料' }}</p>
                  <p class="placeholder-tip">[对照预览区]</p>
                </div>
              </div>
            </div>

            <!-- 摘要侧栏 -->
            <transition name="slide-summary">
              <div v-if="summaryVisible" class="summary-panel">
                <div class="summary-header">
                  <span class="summary-title">材料摘要</span>
                  <el-button size="small" :icon="Close" link aria-label="关闭摘要" @click="summaryVisible = false" />
                </div>
                <div class="summary-content">
                  <p class="summary-text">{{ activeMaterial?.summary || '该材料暂无预生成摘要。' }}</p>
                </div>
              </div>
            </transition>

            <!-- 案件信息侧栏 -->
            <transition name="slide-summary">
              <div v-if="caseInfoVisible" class="summary-panel">
                <div class="summary-header">
                  <span class="summary-title">案件信息</span>
                  <el-button size="small" :icon="Close" link aria-label="关闭案件信息" @click="caseInfoVisible = false" />
                </div>
                <div class="summary-content">
                  <div class="info-row"><span class="info-label">案号</span><span class="info-value">{{ caseInfo.caseNo }}</span></div>
                  <div class="info-row"><span class="info-label">案由</span><span class="info-value">{{ caseInfo.caseReason }}</span></div>
                  <div class="info-row"><span class="info-label">状态</span><span class="info-value">{{ caseInfo.caseStatus }}</span></div>
                  <div class="info-row"><span class="info-label">立案日期</span><span class="info-value">{{ caseInfo.filingDate }}</span></div>
                  <div class="info-row"><span class="info-label">办案秘书</span><span class="info-value">{{ caseInfo.secretary }}</span></div>
                  <div class="info-row"><span class="info-label">仲裁庭</span><span class="info-value">{{ caseInfo.tribunal }}</span></div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document, FolderOpened, Picture, Back, ArrowLeft, ArrowRight,
  InfoFilled, Monitor, Notebook, CircleCheck, Download,
  FullScreen, MagicStick, Close, Search, Expand, Fold,
  ArrowDown, User, OfficeBuilding, DArrowLeft, DArrowRight,
} from '@element-plus/icons-vue'
import { useCaseDetailStore } from '@/stores/caseDetail'

const route = useRoute()
const router = useRouter()
const caseDetailStore = useCaseDetailStore()

const caseInfo = computed(() => caseDetailStore.caseInfo)
const parties = computed(() => caseDetailStore.parties || { applicants: [], respondents: [] })
const evidence = computed(() => caseDetailStore.evidence)
const attachments = computed(() => caseDetailStore.attachments)

// 目录分组：整合案件全部材料
const catalogGroups = computed(() => [
  { id: 'applicant', label: '申请人证据', items: evidence.value.applicant || [] },
  { id: 'respondent', label: '被申请人证据', items: evidence.value.respondent || [] },
  { id: 'attachment', label: '其他附件', items: attachments.value || [] },
])

// 搜索关键字
const searchKeyword = ref('')

// 过滤后的目录分组
const filteredCatalogGroups = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return catalogGroups.value
  return catalogGroups.value
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => (it.name || '').toLowerCase().includes(kw)),
    }))
    .filter((g) => g.items.length > 0)
})

// 所有材料平铺（用于双屏对照选择）
const allMaterials = computed(() =>
  catalogGroups.value.flatMap((g) => g.items),
)

// 视图状态
const viewMode = ref('cover') // cover | preview
const activeGroup = ref(null)
const activeMaterial = ref(null)

// 展开状态：默认全部展开
const expandedGroups = reactive({})
const initExpanded = () => {
  catalogGroups.value.forEach((g) => {
    expandedGroups[g.id] = true
  })
}
const toggleGroup = (groupId) => {
  expandedGroups[groupId] = !expandedGroups[groupId]
}
const expandAll = () => {
  catalogGroups.value.forEach((g) => {
    expandedGroups[g.id] = true
  })
}
const collapseAll = () => {
  catalogGroups.value.forEach((g) => {
    expandedGroups[g.id] = false
  })
}

// 左侧目录整体展开/收起
const sidebarCollapsed = ref(false)
const collapseSidebar = () => {
  sidebarCollapsed.value = true
}
const expandSidebar = () => {
  sidebarCollapsed.value = false
}

// 预览便签页（多 tab）
const openTabs = ref([]) // [{ id, name, group, material }]
const activeTabId = ref('')

// 工具栏状态
const splitMode = ref(false)
const splitTargetId = ref('')
const summaryVisible = ref(false)
const caseInfoVisible = ref(false)

const splitTargetMaterial = computed(() =>
  allMaterials.value.find((m) => m.id === splitTargetId.value),
)

const currentGroup = computed(() =>
  catalogGroups.value.find((g) => g.id === activeGroup.value),
)

// 上一份/下一份导航（基于当前组）
const flatList = computed(() => currentGroup.value?.items || [])
const currentIndex = computed(() =>
  flatList.value.findIndex((m) => m.id === activeMaterial.value?.id),
)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < flatList.value.length - 1)

const selectGroup = (group) => {
  activeGroup.value = group.id
  activeMaterial.value = null
  viewMode.value = 'cover'
  // 点击组标题时确保该组展开
  expandedGroups[group.id] = true
}

const selectMaterial = (group, item) => {
  activeGroup.value = group.id
  activeMaterial.value = item
  viewMode.value = 'preview'
  splitMode.value = false
  summaryVisible.value = false
  caseInfoVisible.value = false
  // 打开或激活对应 tab
  const exist = openTabs.value.find((t) => t.id === item.id)
  if (!exist) {
    openTabs.value.push({
      id: item.id,
      name: item.name,
      group: group.id,
      material: item,
    })
  }
  activeTabId.value = item.id
}

const switchTab = (tab) => {
  activeTabId.value = tab.id
  activeMaterial.value = tab.material
  activeGroup.value = tab.group
  viewMode.value = 'preview'
  // 切换 tab 时重置侧栏与双屏
  splitMode.value = false
  summaryVisible.value = false
  caseInfoVisible.value = false
}

const closeTab = (tabId) => {
  const idx = openTabs.value.findIndex((t) => t.id === tabId)
  if (idx === -1) return
  openTabs.value.splice(idx, 1)
  if (activeTabId.value === tabId) {
    if (openTabs.value.length === 0) {
      // 没有剩余 tab，返回封面
      activeMaterial.value = null
      activeTabId.value = ''
      viewMode.value = 'cover'
    } else {
      // 切到相邻 tab
      const next = openTabs.value[Math.min(idx, openTabs.value.length - 1)]
      switchTab(next)
    }
  }
}

const backToCover = () => {
  activeMaterial.value = null
  activeTabId.value = ''
  viewMode.value = 'cover'
}

const goPrev = () => {
  if (!hasPrev.value) return
  const prevItem = flatList.value[currentIndex.value - 1]
  selectMaterial(currentGroup.value, prevItem)
}

const goNext = () => {
  if (!hasNext.value) return
  const nextItem = flatList.value[currentIndex.value + 1]
  selectMaterial(currentGroup.value, nextItem)
}

// 工具栏操作
const toggleCaseInfo = () => {
  caseInfoVisible.value = !caseInfoVisible.value
  if (caseInfoVisible.value) summaryVisible.value = false
}

const toggleSplit = () => {
  splitMode.value = !splitMode.value
  if (splitMode.value && !splitTargetId.value && hasPrev.value) {
    splitTargetId.value = flatList.value[currentIndex.value - 1].id
  }
}

const toggleSummary = () => {
  summaryVisible.value = !summaryVisible.value
  if (summaryVisible.value) caseInfoVisible.value = false
}

const handleVerify = () => {
  ElMessage.success(`《${activeMaterial.value?.name}》验签通过：文件完整、签名有效`)
}

const handleDownload = () => {
  ElMessage.success(`《${activeMaterial.value?.name}》下载已开始`)
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleOCR = () => {
  ElMessage.info(`正在对《${activeMaterial.value?.name}》执行 OCR 提取...`)
  setTimeout(() => {
    ElMessage.success('OCR 提取完成，文本已生成')
  }, 1500)
}

const handleClose = () => {
  window.close()
  // 如果 window.close 无效（非脚本打开的窗口），回退到案件详情页
  router.push(`/cases/${route.params.id}`)
}

onMounted(async () => {
  const caseId = route.params.id
  if (caseId && caseInfo.value?.id !== caseId) {
    await caseDetailStore.fetchCaseDetail(caseId)
  }
  // 默认全部展开
  initExpanded()
  // 默认选中第一组，显示封面
  if (catalogGroups.value.length > 0) {
    activeGroup.value = catalogGroups.value[0].id
  }
})
</script>

<style scoped lang="scss">
.material-reader {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--el-bg-color-page);
}

// ============ 顶部栏 ============
.reader-header {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;

  .header-row {
    display: flex;
    align-items: center;
    padding: 0 20px;
  }

  .header-row-main {
    min-height: 56px;
    padding: 10px 20px;
    align-items: center;
    gap: 20px;

    .header-col {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    // 栏1：标题
    .col-title {
      gap: 8px;
      color: var(--el-color-primary);
      flex-shrink: 0;

      .logo-text {
        font-size: 16px;
        font-weight: 600;
      }
    }

    // 栏2：案号
    .col-case-no {
      flex-shrink: 0;
      padding-right: 20px;
      border-right: 1px solid var(--el-border-color-lighter);

      .case-no {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-regular);
      }
    }

    // 栏3：基本信息（2行）
    .col-case-meta {
      flex: 1;
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
      min-width: 0;

      .meta-line {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        text-align: left;

        .separator {
          color: #dcdfe6;
          font-size: 12px;
          flex-shrink: 0;
        }

        .party-item {
          display: inline-flex;
          align-items: center;
          min-width: 0;
          flex: 1;
          text-align: left;

          .party-label {
            font-size: 12px;
            font-weight: 400;
            color: var(--el-text-color-secondary);
            flex-shrink: 0;
            width: 64px;
            text-align: left;
          }

          .party-value {
            font-size: 12px;
            font-weight: 400;
            color: var(--el-text-color-regular);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
            text-align: left;

            .party-join {
              color: var(--el-text-color-secondary);
              margin: 0 2px;
            }
          }
        }
      }
    }

    .header-right {
      margin-left: auto;
      flex-shrink: 0;
    }
  }
}

// ============ 主体 ============
.reader-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ============ 左侧目录 ============
.reader-sidebar {
  width: 240px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.25s ease;

  &.collapsed {
    width: 32px;

    .sidebar-rail {
      display: flex;
    }
  }

  .sidebar-inner {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-width: 0;
  }

  // 收起态竖条轨道
  .sidebar-rail {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 12px 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    transition: background-color 0.2s;

    .rail-icon {
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }

    .rail-text {
      writing-mode: vertical-rl;
      text-orientation: upright;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      letter-spacing: 2px;
    }

    &:hover {
      background-color: #f5f7fa;

      .rail-icon,
      .rail-text {
        color: var(--el-color-primary);
      }
    }
  }

  .sidebar-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .sidebar-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }

    .sidebar-title-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }
  }

  .sidebar-search {
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .catalog-tree {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .catalog-group {
    .catalog-group-title {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      cursor: pointer;
      transition: background-color 0.2s;

      .expand-icon {
        color: var(--el-text-color-secondary);
        cursor: pointer;
        font-size: 12px;
        flex-shrink: 0;

        &:hover {
          color: var(--el-color-primary);
        }
      }

      .el-icon:not(.expand-icon) {
        color: var(--el-text-color-secondary);
      }

      .count {
        margin-left: auto;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        background-color: #f5f7fa;
        padding: 1px 6px;
        border-radius: 8px;
      }

      &:hover {
        background-color: #f5f7fa;
      }

      &.active {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    .catalog-items {
      .catalog-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px 6px 36px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        transition: all 0.2s;

        .el-icon {
          color: #8a8e95;
          flex-shrink: 0;
        }

        .item-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-type {
          font-size: 10px;
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }

        &:hover {
          background-color: #f5f7fa;
          color: var(--el-color-primary);
        }

        &.active {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          font-weight: 600;

          .el-icon {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }

  .empty-inline {
    padding: 8px 16px 8px 36px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    &.empty-global {
      padding: 16px;
      text-align: center;
    }
  }
}

// ============ 右侧内容区 ============
.reader-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// ============ 封面态 ============
.cover-view {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  .cover-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;

    .cover-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      margin: 0;
    }

    .cover-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .cover-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }

  .cover-card {
    background-color: #ffffff;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .cover-thumbnail {
      position: relative;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      color: #8a8e95;

      .page-badge {
        position: absolute;
        bottom: 8px;
        right: 8px;
        font-size: 10px;
        color: #ffffff;
        background-color: rgba(0, 0, 0, 0.6);
        padding: 2px 6px;
        border-radius: 3px;
      }
    }

    .cover-info {
      padding: 10px 12px;

      .cover-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      .cover-meta {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// ============ PDF 预览态 ============
.preview-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

// 预览便签页
.preview-tabs {
  display: flex;
  background-color: #f5f7fa;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;

  .tabs-scroll {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    flex: 1;
    padding: 6px 8px 0;
    gap: 4px;

    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #8a8e95;
      border-radius: 2px;
    }
  }

  .preview-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 200px;
    padding: 6px 10px;
    background-color: #ffffff;
    border: 1px solid var(--el-border-color-light);
    border-bottom: none;
    border-radius: 4px 4px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    .tab-icon {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
    }

    .tab-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tab-close {
      font-size: 12px;
      color: #8a8e95;
      border-radius: 50%;
      padding: 2px;
      flex-shrink: 0;

      &:hover {
        color: #f56c6c;
        background-color: #fef0f0;
      }
    }

    &:hover {
      color: var(--el-color-primary);

      .tab-icon {
        color: var(--el-color-primary);
      }
    }

    &.active {
      color: var(--el-color-primary);
      font-weight: 600;
      background-color: #ffffff;
      border-color: var(--el-border-color-light);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        background-color: var(--el-color-primary);
      }

      .tab-icon {
        color: var(--el-color-primary);
      }
    }
  }
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  gap: 12px;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .toolbar-center {
    flex: 1;
    text-align: center;
    min-width: 0;
    padding: 0 12px;

    .current-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// 预览主体容器（含侧栏）
.preview-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  gap: 1px;
  background-color: var(--el-border-color-lighter);
}

.preview-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 1px;
  background-color: var(--el-border-color-lighter);

  &.split-mode {
    .preview-pane {
      flex: 1;
    }
  }

  .preview-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    overflow: hidden;

    &.split-second {
      .split-selector {
        padding: 8px 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        background-color: #fafafa;
      }
    }

    .pdf-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #8a8e95;

      p {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 0;
      }

      .placeholder-tip {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// ============ 摘要/案件信息侧栏 ============
.summary-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background-color: #ffffff;
  border-left: 1px solid var(--el-border-color-light);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 10;

  .summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .summary-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }
  }

  .summary-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .summary-text {
      font-size: 12px;
      line-height: 1.8;
      color: var(--el-text-color-secondary);
      margin: 0;
    }

    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .info-label {
        width: 70px;
        flex-shrink: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      .info-value {
        flex: 1;
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }
  }
}

// 侧栏滑入动画
.slide-summary-enter-active,
.slide-summary-leave-active {
  transition: transform 0.25s ease;
}

.slide-summary-enter-from,
.slide-summary-leave-to {
  transform: translateX(100%);
}

// ============ 移动端适配（≤768px） ============
@media (max-width: 768px) {
  .material-reader {
    height: 100vh;
  }

  // 顶部栏：简化为 标题 + 案号 + 关闭
  .reader-header .header-row-main {
    gap: 8px;
    padding: 8px 12px;
    min-height: 48px;

    // 隐藏基本信息两行
    .col-case-meta {
      display: none;
    }

    .col-case-no {
      padding-right: 8px;
      border-right: none;
      flex: 1;
      min-width: 0;

      .case-no {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .col-title .logo-text {
      font-size: 14px;
    }
  }

  // 左侧目录：抽屉化，展开时绝对定位覆盖，不挤压内容
  .reader-body {
    position: relative;
  }

  .reader-sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    width: 80%;
    max-width: 300px;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.12);

    &.collapsed {
      width: 32px;
      box-shadow: none;
    }
  }

  // 封面网格：单列
  .cover-view {
    padding: 12px;

    .cover-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .cover-header {
      margin-bottom: 12px;

      .cover-title {
        font-size: 14px;
      }
    }
  }

  // 预览工具栏：换行、隐藏中间名称、按钮紧凑
  .preview-toolbar {
    flex-wrap: wrap;
    padding: 6px 8px;
    gap: 6px;

    .toolbar-left,
    .toolbar-right {
      gap: 2px;
      flex-wrap: wrap;
    }

    .toolbar-center {
      display: none;
    }

    .el-button {
      font-size: 12px;
      padding: 6px 8px;
    }
  }

  // 预览便签页
  .preview-tabs .preview-tab {
    max-width: 140px;
  }

  // 摘要/案件信息侧栏：全宽覆盖
  .summary-panel {
    width: 100%;
  }
}
</style>
