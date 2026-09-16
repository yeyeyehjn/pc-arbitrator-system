<template>
  <nav class="page-breadcrumb" aria-label="已打开页面">
    <div ref="scrollRef" class="tabs-scroll" role="tablist" aria-label="页面标签">
      <div
        v-for="tab in tabs"
        :key="tab.fullPath"
        class="page-tab"
        :class="{ 'is-active': tab.fullPath === activeFullPath }"
        role="tab"
        :aria-selected="tab.fullPath === activeFullPath"
        :title="tabTitle(tab)"
        :aria-label="tab.affix ? `${tabTitle(tab)}（固定）` : tabTitle(tab)"
        tabindex="0"
        @click="selectTab(tab)"
        @keydown.enter="selectTab(tab)"
      >
        <span class="tab-title">{{ tabTitle(tab) }}</span>
        <el-icon
          v-if="!tab.affix"
          class="tab-close"
          role="button"
          :aria-label="`关闭 ${tabTitle(tab)}`"
          tabindex="-1"
          @click.stop="closeTab(tab)"
          @keydown.enter.stop.prevent="closeTab(tab)"
        >
          <Close />
        </el-icon>
      </div>
    </div>
    <button
      type="button"
      class="close-all-btn"
      :disabled="closableCount === 0"
      title="关闭除首页外的所有页面"
      @click="closeAll"
    >
      关闭所有
    </button>
  </nav>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useCaseDetailStore } from '../stores/caseDetail'

const HOME_TAB = { path: '/', fullPath: '/', title: '首页', affix: true }

const route = useRoute()
const router = useRouter()
const caseDetailStore = useCaseDetailStore()

const tabs = ref([{ ...HOME_TAB }])
const activeFullPath = ref('/')
const scrollRef = ref(null)

// 案号缓存：caseId → 案号。案件详情页签显示案号，
// store 加载后回填，已打开的其他案件页签不受影响
const caseNoMap = reactive({})

watch(
  () => caseDetailStore.caseInfo,
  (info) => {
    if (info?.id && info?.caseNo) {
      caseNoMap[info.id] = info.caseNo
    }
  },
  { immediate: true }
)

const closableCount = computed(() => tabs.value.filter((t) => !t.affix).length)

function resolveTitle(r) {
  const matched = [...r.matched].reverse().find((m) => m.meta?.title)
  return matched?.meta?.title || '未命名页面'
}

function tabTitle(tab) {
  if (tab.caseId) return caseNoMap[tab.caseId] || tab.title
  return tab.title
}

function addTab(r) {
  // 登录页等公开页面不进入面包屑
  if (r.meta?.public) return
  activeFullPath.value = r.fullPath
  // 同一路由（path 相同）只保留一个标签，query 变化时原地更新，
  // 避免页面内 router.replace 同步筛选参数时产生重复标签
  const existing = tabs.value.find((t) => t.path === r.path)
  const caseId = r.name === 'CaseDetail' ? String(r.params.id) : undefined
  if (existing) {
    if (existing.fullPath !== r.fullPath) {
      existing.fullPath = r.fullPath
      existing.title = resolveTitle(r)
    }
    existing.caseId = caseId
    return
  }
  tabs.value.push({ path: r.path, fullPath: r.fullPath, title: resolveTitle(r), affix: false, caseId })
}

function scrollActiveIntoView() {
  const el = scrollRef.value?.querySelector('.page-tab.is-active')
  if (!el) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior })
}

watch(
  () => route.fullPath,
  () => {
    addTab(route)
    nextTick(scrollActiveIntoView)
  },
  { immediate: true }
)

onMounted(scrollActiveIntoView)

function selectTab(tab) {
  if (tab.fullPath !== route.fullPath) {
    router.push(tab.fullPath)
  }
}

function closeTab(tab) {
  const idx = tabs.value.findIndex((t) => t.fullPath === tab.fullPath)
  if (idx === -1) return
  tabs.value.splice(idx, 1)
  // 关闭的是当前页面时，跳转到相邻页签（优先左侧）
  if (tab.fullPath === route.fullPath) {
    const next = tabs.value[idx - 1] || tabs.value[idx] || tabs.value[0]
    router.push(next.fullPath)
  }
}

function closeAll() {
  tabs.value = tabs.value.filter((t) => t.affix)
  if (route.fullPath !== HOME_TAB.fullPath) {
    router.push(HOME_TAB.fullPath)
  }
}
</script>

<style lang="scss" scoped>
.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  flex-shrink: 0;
  padding: 0 20px;
  background-color: var(--el-bg-color-white);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tabs-scroll {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color-lighter);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.page-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  background-color: transparent;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: background-color 0.2s ease, color 0.2s ease;

  .tab-title {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    width: 16px;
    height: 16px;
    font-size: 12px;
    border-radius: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: var(--el-color-white);
      background-color: var(--el-text-color-placeholder);
      outline: none;
    }
  }

  &:hover:not(.is-active),
  &:focus-visible:not(.is-active) {
    color: var(--el-color-primary-light-3);
    background-color: #f5f7fa;
  }

  &:focus-visible {
    outline: none;
    border-color: var(--el-color-primary);
  }

  &.is-active {
    color: var(--el-color-primary);
    background-color: #f2f5fa;
    font-weight: 500;
  }
}

.close-all-btn {
  flex-shrink: 0;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  background-color: var(--el-bg-color-white);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-7);
    outline: none;
  }

  &:disabled {
    color: var(--el-text-color-placeholder);
    cursor: not-allowed;
  }
}

/* 响应式：移动端收紧内边距（遵循 768 断点规范） */
@media (max-width: 768px) {
  .page-breadcrumb {
    padding: 0 12px;
    gap: 8px;
  }
}

/* 移动端隐藏面包屑导航 */
@media (max-width: 768px) {
  .page-breadcrumb {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-tab,
  .page-tab .tab-close,
  .close-all-btn {
    transition: none;
  }
}
</style>
