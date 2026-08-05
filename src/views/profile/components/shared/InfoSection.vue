<template>
  <div class="section-card">
    <div class="section-title-row">
      <div class="section-title">{{ title }}</div>
      <div class="section-actions">
        <slot v-if="!editing" name="actions">
          <el-button type="primary" link @click="handleStartEdit">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
        </slot>
        <template v-else-if="!hideEditActions">
          <el-button type="primary" size="small" @click="handleSave">保存</el-button>
          <el-button size="small" @click="handleCancel">取消</el-button>
        </template>
      </div>
    </div>
    <slot v-if="!editing" name="view" />
    <slot v-else name="edit" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Edit } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, required: true },
  modelValue: { type: Boolean, default: false },
  hideEditActions: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const editing = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    editing.value = val
  },
)

const handleStartEdit = () => {
  editing.value = true
  emit('update:modelValue', true)
}

const handleSave = () => {
  emit('save')
}

const handleCancel = () => {
  editing.value = false
  emit('update:modelValue', false)
  emit('cancel')
}
</script>
