<template>
  <div class="info-tab-wrapper">
    <div class="info-tab" ref="contentRef">
    

    <!-- 当事人 -->
    <div class="section-card">
      <div class="section-title">当事人</div>
      <PartyCompare :applicants="parties.applicants" :respondents="parties.respondents" />
    </div>

    <!-- 请求和答辩 -->
    <div class="section-card" id="section-claim">
      <div class="section-title">请求和答辩</div>
      <ClaimBlock :data="claims" />
    </div>

    <!-- 反请求和答辩 -->
    <div class="section-card" id="section-counter-claim">
      <div class="section-title">反请求和答辩</div>
      <ClaimBlock
        :data="counterClaims"
        :show-clause="false"
        fact-label="反请求事实和理由"
        list-label="反请求列表"
        defense-label="反请求答辩意见"
      />
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
import PartyCompare from './shared/PartyCompare.vue'
import MaterialList from './shared/MaterialList.vue'
import ClaimBlock from './shared/ClaimBlock.vue'

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
  counterClaims: {
    type: Object,
    default: () => ({}),
  },
  attachments: {
    type: Array,
    default: () => [],
  },
})

const remainDaysClass = computed(() => {
  const days = props.caseInfo.remainDays
  if (days < 0) return 'expired'
  if (days <= 15) return 'expiring'
  return 'normal'
})

// ============ 锚点导航 ============
const anchors = [
  { id: 'section-base', label: '基本信息' },
  { id: 'section-party', label: '当事人' },
  { id: 'section-claim', label: '请求和答辩' },
  { id: 'section-counter-claim', label: '反请求和答辩' },
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
  }
}
</style>
