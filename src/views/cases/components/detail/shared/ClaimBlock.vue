<template>
  <div class="claim-block">
    <!-- 1. 仲裁条款约定情况 -->
    <div v-if="showClause" class="claim-section">
      <div class="claim-title">仲裁条款约定情况</div>
      <div class="claim-content">{{ data.arbitrationClause?.text || '—' }}</div>
      <div v-if="data.arbitrationClause?.attachments?.length" class="claim-files">
        <el-link
          v-for="file in data.arbitrationClause.attachments"
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
    <div v-if="showClause" class="claim-section">
      <div class="claim-title">合同签订主体及签章情况</div>
      <div class="claim-content">{{ data.contractSign?.text || '—' }}</div>
      <div v-if="data.contractSign?.attachments?.length" class="claim-files">
        <el-link
          v-for="file in data.contractSign.attachments"
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
      <div class="claim-title">{{ factLabel }}</div>
      <div class="claim-content long-text">{{ data.factsAndReasons?.text || '—' }}</div>
      <div v-if="data.factsAndReasons?.attachments?.length" class="claim-files">
        <el-link
          v-for="file in data.factsAndReasons.attachments"
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
      <div class="claim-title">{{ listLabel }}</div>
      <div class="claim-list">
        <div v-for="(item, idx) in data.claimList" :key="item.id" class="claim-list-item">
          <span class="item-index">{{ idx + 1 }}</span>
          <span class="item-content">{{ item.content }}</span>
        </div>
        <div v-if="!data.claimList?.length" class="empty-inline">暂无请求</div>
      </div>
    </div>

    <!-- 5. 答辩意见 -->
    <div class="claim-section">
      <div class="claim-title">{{ defenseLabel }}</div>
      <div class="defense-list">
        <div v-for="(defense, idx) in data.defenseList" :key="defense.id" class="defense-item">
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
        <div v-if="!data.defenseList?.length" class="empty-inline">暂无答辩</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  showClause: {
    type: Boolean,
    default: true,
  },
  factLabel: {
    type: String,
    default: '事实和理由',
  },
  listLabel: {
    type: String,
    default: '请求列表',
  },
  defenseLabel: {
    type: String,
    default: '答辩意见',
  },
})

const handleFile = (name) => {
  ElMessage.success(`《${name}》预览加载中`)
}
</script>

<style scoped lang="scss">
.claim-block {
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
}
</style>
