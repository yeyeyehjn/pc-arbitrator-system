<template>
  <div class="legal-search">
    <el-segmented
      v-model="searchType"
      :options="searchTypeOptions"
      class="search-type-group"
    />
    <el-input
      v-model="searchText"
      placeholder="请输入关键词"
      :prefix-icon="Search"
      class="search-input"
      @keyup.enter="handleSearch"
    >
      <template #append>
        <el-button class="search-btn" @click="handleSearch">
          <el-icon><Search /></el-icon>
          <span>搜索</span>
        </el-button>
      </template>
    </el-input>
    <div class="hot-keywords">
      <span class="hot-label">热门</span>
      <span
        v-for="(kw, i) in hotKeywords"
        :key="i"
        class="hot-tag"
        role="button"
        tabindex="0"
        @click="searchText = kw"
        @keydown.enter="searchText = kw"
      >{{ kw }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const searchType = ref('法律法规')
const searchTypeOptions = [
  { label: '法律法规', value: '法律法规' },
  { label: '司法案例', value: '司法案例' },
]
const searchText = ref('')

const hotKeywords = ref(['民法典', '合同纠纷', '仲裁法', '证据规则'])

const handleSearch = () => {
  console.log(`Searching for '${searchText.value}' in '${searchType.value}'`)
  // Implement actual search logic here, e.g., navigate to a search results page
}
</script>

<style scoped lang="scss">
.legal-search {
  display: flex;
  flex-direction: column;

  // 顶部切换：el-segmented 轻量胶囊
  .search-type-group {
    margin-bottom: 14px;
    align-self: flex-start;
    :deep(.el-segmented) {
      padding: 2px;
      background-color: #F5F7FA;
      border-radius: 6px;
    }
    :deep(.el-segmented__item) {
      font-size: 14px;
      padding: 4px 14px;
      color: var(--el-text-color-secondary);
      transition: color 0.2s ease;
    }
    :deep(.el-segmented__item-selected) {
      background-color: #ffffff;
      color: var(--el-color-primary);
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
    }
  }

  // 搜索框：扁平、附按钮轻量化
  .search-input {
    :deep(.el-input__wrapper) {
      border-radius: 6px 0 0 6px;
      box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
      &:hover {
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
      }
      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
      }
    }
    :deep(.el-input-group__append) {
      padding: 0;
      background-color: transparent;
      border: none;
      .search-btn {
        margin: 0;
        border: none;
        border-radius: 0 6px 6px 0;
        padding: 0 16px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        background-color: #F5F7FA;
        transition: all 0.2s ease;
        .el-icon {
          margin-right: 4px;
          font-size: 14px;
        }
        &:hover {
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
        }
      }
    }
  }

  // 热门：纯文本轻标签
  .hot-keywords {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    line-height: 1;
    .hot-label {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin-right: 2px;
    }
    .hot-tag {
      font-size: 12px;
      color: var(--el-text-color-regular);
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover,
      &:focus-visible {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        outline: none;
      }
    }
  }
}
</style>
