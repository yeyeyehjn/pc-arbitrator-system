<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="left">
      <!-- 教育背景 -->
      <template v-if="recordType === 'education'">
        <el-form-item label="起始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择起始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="在读院校" prop="school">
          <el-input v-model="form.school" placeholder="请输入在读院校" />
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="form.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="学历" prop="education">
          <el-select v-model="form.education" placeholder="请选择学历" style="width: 100%">
            <el-option label="大专" value="大专" />
            <el-option label="本科" value="本科" />
            <el-option label="硕士" value="硕士" />
            <el-option label="博士" value="博士" />
            <el-option label="博士后" value="博士后" />
          </el-select>
        </el-form-item>
        <el-form-item label="学位" prop="degree">
          <el-input v-model="form.degree" placeholder="请输入学位" />
        </el-form-item>
      </template>

      <!-- 外语能力 -->
      <template v-else-if="recordType === 'language'">
        <el-form-item label="语种" prop="language">
          <el-input v-model="form.language" placeholder="请输入语种及水平" />
        </el-form-item>
      </template>

      <!-- 培训/工作经历 -->
      <template v-else-if="recordType === 'training'">
        <el-form-item label="起始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择起始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位/机构" prop="org">
          <el-input v-model="form.org" placeholder="请输入单位/机构名称" />
        </el-form-item>
        <el-form-item label="职务/结业" prop="result">
          <el-input v-model="form.result" placeholder="请输入职务或结业情况" />
        </el-form-item>
      </template>

      <!-- 主要专业成果 -->
      <template v-else-if="recordType === 'achievement'">
        <el-form-item label="获得时间" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择获得时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="成果名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入成果名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </template>

      <!-- 工作背景信息 -->
      <template v-else-if="recordType === 'workHistory'">
        <el-form-item label="起始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择起始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </template>

      <!-- 附件（除工作背景信息外都有） -->
      <el-form-item v-if="recordType !== 'workHistory'" label="附件">
        <el-upload
          v-model:file-list="fileList"
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          multiple
        >
          <el-button type="primary" plain>
            <el-icon><Upload /></el-icon>
            <span>点击上传</span>
          </el-button>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Upload } from '@element-plus/icons-vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  recordType: { type: String, default: 'education' },
  editData: { type: Object, default: null },
})

const emit = defineEmits(['update:visible', 'save', 'close'])

const formRef = ref(null)
const fileList = ref([])

const typeLabels = {
  education: '教育背景',
  language: '外语能力',
  training: '培训/工作经历',
  achievement: '主要专业成果',
  workHistory: '工作背景信息',
}

const dialogTitle = computed(() => {
  const label = typeLabels[props.recordType] || ''
  return props.editData ? `编辑${label}` : `添加${label}`
})

const form = reactive({
  startDate: '',
  endDate: '',
  school: '',
  major: '',
  education: '',
  degree: '',
  language: '',
  org: '',
  result: '',
  name: '',
  description: '',
  attachments: [],
})

// 动态校验规则
const rules = computed(() => {
  const r = {}
  const required = [{ required: true, message: '此项必填', trigger: 'blur' }]
  const requiredDate = [{ required: true, message: '请选择日期', trigger: 'change' }]

  if (props.recordType === 'education') {
    r.startDate = requiredDate
    r.school = required
    r.major = required
  } else if (props.recordType === 'language') {
    r.language = required
  } else if (props.recordType === 'training') {
    r.startDate = requiredDate
    r.org = required
  } else if (props.recordType === 'achievement') {
    r.startDate = requiredDate
    r.name = required
  } else if (props.recordType === 'workHistory') {
    r.startDate = requiredDate
    r.name = required
  }
  return r
})

const validateEndDate = (rule, value, callback) => {
  if (value && form.startDate && value < form.startDate) {
    callback(new Error('结束日期不能早于起始日期'))
  } else {
    callback()
  }
}

// 起止日期校验（追加）
watch(rules, (newRules) => {
  if (newRules.endDate) {
    newRules.endDate.push({ validator: validateEndDate, trigger: 'change' })
  }
}, { immediate: true })

// 监听 visible/editData 初始化表单
watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      if (props.editData) {
        Object.keys(form).forEach((key) => {
          if (props.editData[key] !== undefined) {
            form[key] = props.editData[key]
          }
        })
        fileList.value = (props.editData.attachments || []).map((f, idx) => ({
          name: f.name,
          url: f.url,
          uid: Date.now() + idx,
        }))
      }
    }
  },
)

const resetForm = () => {
  Object.keys(form).forEach((key) => {
    if (key === 'attachments') {
      form[key] = []
    } else {
      form[key] = ''
    }
  })
  fileList.value = []
}

const handleFileChange = () => {
  form.attachments = fileList.value.map((f) => ({ name: f.name, url: f.url || '#' }))
}

const handleFileRemove = () => {
  form.attachments = fileList.value.map((f) => ({ name: f.name, url: f.url || '#' }))
}

const handleConfirm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    // 额外校验结束日期
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      return
    }
    const data = { ...form }
    emit('save', { type: props.recordType, data, isEdit: !!props.editData })
  })
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>
