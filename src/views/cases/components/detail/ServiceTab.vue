<template>
  <div class="service-tab section-card">
    <div class="section-title">电子送达记录</div>
    <div v-if="services.length === 0" class="empty-wrap">
      <CaseEmptyState text="本案暂无电子送达记录" />
    </div>
    <el-table
      v-else
      :data="services"
      :span-method="spanMethod"
      style="width: 100%"
    >
      <el-table-column prop="serviceType" label="送达类型" min-width="120" />
      <el-table-column label="送达方式 / 地址" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.method }}：{{ row.address }}
        </template>
      </el-table-column>
      <el-table-column label="送达情况" min-width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="readStatus" label="读取情况" min-width="160" />
      <el-table-column prop="serviceTime" label="送达时间" min-width="140" />
    </el-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CaseEmptyState from '../shared/CaseEmptyState.vue'

const props = defineProps({
  services: {
    type: Array,
    default: () => [],
  },
})

const statusType = (status) => {
  if (status === '已送达') return 'success'
  if (status === '待送达') return 'warning'
  if (status === '送达失败') return 'danger'
  return 'info'
}

// 按送达类型分组：计算每行的合并信息
const spanInfo = computed(() => {
  const info = [] // { rowSpan, colSpan } for serviceType column of each row
  let prevType = null
  let startIndex = 0
  const list = props.services

  for (let i = 0; i <= list.length; i++) {
    const currentType = i < list.length ? list[i].serviceType : null
    if (currentType !== prevType && prevType !== null) {
      // 结束上一组
      const span = i - startIndex
      for (let j = startIndex; j < i; j++) {
        info[j] = { rowSpan: j === startIndex ? span : 0, colSpan: 1 }
      }
      startIndex = i
    }
    prevType = currentType
  }

  return info
})

// el-table span-method：仅合并第一列（送达类型）
const spanMethod = ({ rowIndex, columnIndex }) => {
  if (columnIndex === 0) {
    const cellInfo = spanInfo.value[rowIndex]
    if (cellInfo) {
      return { rowspan: cellInfo.rowSpan, colspan: cellInfo.colSpan }
    }
  }
}
</script>

<style scoped lang="scss">
.service-tab {
  .empty-wrap {
    padding: 12px 0;
  }
}
</style>
