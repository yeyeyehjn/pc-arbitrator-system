<template>
  <el-dialog
    v-model="dialogVisible"
    title="裁决书在线编辑"
    fullscreen
    :close-on-click-modal="false"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <div class="editor-wrapper">
      <Toolbar
        v-if="editorReady"
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
        style="border-bottom: 1px solid var(--el-border-color-lighter)"
      />
      <Editor
        v-if="editorReady"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="mode"
        style="height: calc(100vh - 200px); overflow-y: hidden"
        @onCreated="handleCreated"
        @onChange="handleChange"
      />
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onBeforeUnmount } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  content: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'save'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})
const editorRef = shallowRef()
const editorReady = ref(false)
const valueHtml = ref(props.content)
const mode = 'default'

const toolbarConfig = {
  excludeKeys: ['group-video', 'fullScreen'],
}

const editorConfig = {
  placeholder: '请输入裁决书内容…',
  MENU_CONF: {},
}

const handleOpen = () => {
  valueHtml.value = props.content
  editorReady.value = true
}

const handleCreated = (editor) => {
  editorRef.value = editor
}

const handleChange = (editor) => {
  valueHtml.value = editor.getHtml()
}

const handleSave = () => {
  emit('save', valueHtml.value)
  dialogVisible.value = false
}

const handleClosed = () => {
  // 销毁编辑器
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
  editorReady.value = false
}

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>

<style scoped lang="scss">
.editor-wrapper {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}
</style>
