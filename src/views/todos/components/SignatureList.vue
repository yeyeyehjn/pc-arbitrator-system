<template>
  <div class="signature-list">
    <el-tabs v-model="activeTab" class="signature-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="承诺书签署" name="commitment">
        <SignatureTable
          :data="commitmentList"
          doc-type="承诺书"
          doc-type-tag="primary"
          @sign="openCommitmentDialog"
        />
      </el-tab-pane>
      <el-tab-pane label="笔录签名" name="record">
        <SignatureTable
          :data="recordList"
          doc-type="笔录"
          doc-type-tag="success"
          @sign="openRecordDialog"
          @preview="openRecordPreview"
        />
      </el-tab-pane>
      <el-tab-pane label="文书签名" name="document">
        <SignatureTable
          :data="documentList"
          doc-type="文书"
          doc-type-tag="warning"
          @sign="handleDocumentSign"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 承诺书签署弹窗 -->
    <el-dialog
      v-model="commitmentDialogVisible"
      title="承诺书签署"
      width="760px"
      :close-on-click-modal="false"
      class="commitment-dialog"
    >
      <div class="commitment-body">
        <!-- 案件信息 -->
        <div class="dialog-section">
          <div class="section-header">案件信息</div>
          <div class="section-content">
            <div class="case-summary">
              <div class="info-row">
                <span class="info-label">案号</span>
                <span class="info-value">{{ currentDoc?.caseNo || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">案由</span>
                <span class="info-value">{{ currentDoc?.caseReason || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">仲裁庭</span>
                <span class="info-value">
                  {{ currentDoc?.tribunal || '-' }}
                  <span v-if="currentDoc?.arbitratorPhone" class="member-phone">{{ currentDoc.arbitratorPhone }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 申请人 -->
        <div class="dialog-section">
          <div class="section-header">申请人</div>
          <div class="section-content">
            <div v-for="(app, i) in (currentDoc?.applicants || [])" :key="'app-' + i" class="party-card">
              <div class="party-name">{{ app.name }}</div>
              <div class="party-grid">
                <div class="info-row">
                  <span class="info-label">机构代码</span>
                  <span class="info-value">{{ app.orgCode }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">代理人</span>
                  <span class="info-value">{{ app.agent }}</span>
                </div>
                <div class="info-row full">
                  <span class="info-label">地址</span>
                  <span class="info-value">{{ app.address }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 被申请人 -->
        <div class="dialog-section">
          <div class="section-header">被申请人</div>
          <div class="section-content">
            <div v-for="(resp, i) in (currentDoc?.respondents || [])" :key="'resp-' + i" class="party-card">
              <div class="party-name">{{ resp.name }}</div>
              <div class="party-grid">
                <div class="info-row">
                  <span class="info-label">机构代码</span>
                  <span class="info-value">{{ resp.orgCode }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">代理人</span>
                  <span class="info-value">{{ resp.agent }}</span>
                </div>
                <div class="info-row full">
                  <span class="info-label">地址</span>
                  <span class="info-value">{{ resp.address }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 仲裁员声明 -->
        <div class="dialog-section">
          <div class="section-header">仲裁员声明</div>
          <div class="section-content">
            <div class="declaration-hint">请仔细阅读并认真填写：</div>
            <el-radio-group v-model="declaration.type" class="declaration-group">
              <!-- 选项1 -->
              <div class="declaration-option">
                <el-radio value="1">
                  <span class="radio-text">本人郑重声明不存在《中华人民共和国仲裁法》及本会《仲裁规则》规定需要回避的事由，接受担任本案仲裁员。</span>
                </el-radio>
              </div>
              <!-- 选项2 -->
              <div class="declaration-option">
                <el-radio value="2">
                  <span class="radio-text">本人存在附件第<el-input v-model="declaration.recusalItem" class="inline-input" @focus="declaration.type = '2'" />项回避事由，不接受担任本案仲裁员。<el-button link type="primary" class="recusal-link" @click.stop="recusalModalVisible = true">查阅回避事由</el-button></span>
                </el-radio>
              </div>
              <!-- 选项3 -->
              <div class="declaration-option">
                <el-radio value="3">
                  <span class="radio-text">本人认为存在可能引起当事人对本人独立性、公正性产生合理怀疑的情形需要披露：</span>
                </el-radio>
                <transition name="collapse">
                  <div v-if="declaration.type === '3'" class="option-3-expand">
                    <el-input
                      v-model="declaration.disclosureText"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入披露内容"
                    />
                    <el-radio-group v-model="declaration.subType" class="sub-options">
                      <el-radio value="3.1">本人认为以上披露情形不影响本案公正裁决，接受担任本案仲裁员。</el-radio>
                      <el-radio value="3.2">本人认为以上披露情形影响本案公正裁决，不接受担任本案仲裁员。</el-radio>
                    </el-radio-group>
                  </div>
                </transition>
              </div>
              <!-- 选项4 -->
              <div class="declaration-option">
                <el-radio value="4">
                  <span class="radio-text">本人存在<el-input v-model="declaration.otherReason" class="inline-input" @focus="declaration.type = '4'" />事由，不接受担任本案仲裁员。</span>
                </el-radio>
              </div>
            </el-radio-group>
          </div>
        </div>

        <!-- 补充说明 -->
        <div class="dialog-section">
          <div class="section-header">补充说明</div>
          <div class="section-content">
            <div class="commitment-text">
              <p><span class="commitment-label">保密义务：</span>仲裁员应当遵守仲裁不公开原则，严格履行保密义务，不得对外界透露任何有关案件的情况，包括但不限于案情、审理过程、案件涉及的商业秘密、仲裁庭合议意见等内容；不得向当事人透露本人对案件的看法和仲裁庭合议的情况；不得利用履行仲裁职责获取案件保密信息为自己或他人谋取利益。</p>
              <p><span class="commitment-label">本人确知：</span>仲裁员无论是由当事人选定或由广州仲裁委员会主任指定而参加案件审理，都应平等对待双方当事人，不代表任何一方当事人的利益，不偏袒任何一方当事人。</p>
              <p><span class="commitment-label">本人承诺：</span>遵守本会《仲裁规则》和《仲裁员守则》的规定，保证办案时间，不私下会见当事人、代理人，不接受当事人、代理人的请客送礼，独立、公正、勤勉、高效地为当事人解决争议。如有违反上述规定情形，本人主动辞去仲裁员一职并接受广州仲裁委员会按相关规定处理。</p>
            </div>
          </div>
        </div>

        <!-- 电子签名 -->
        <div class="dialog-section">
          <div class="section-header">电子签名</div>
          <div class="section-content">
            <div v-if="commitmentSignature" class="signature-preview">
              <img :src="commitmentSignature" alt="签名" class="signature-image" />
              <el-button link type="primary" @click="fullscreenSignVisible = true">重新签名</el-button>
            </div>
            <div v-else class="signature-placeholder">
              <el-button type="primary" plain @click="fullscreenSignVisible = true">
                <el-icon><EditPen /></el-icon>
                点击签名
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="commitmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCommitment">提交确认</el-button>
      </template>
    </el-dialog>

    <!-- 全屏签名弹窗 -->
    <el-dialog
      v-model="fullscreenSignVisible"
      title="手写签名"
      fullscreen
      :close-on-click-modal="false"
      class="fullscreen-sign-dialog"
    >
      <div class="fullscreen-sign-body">
        <SignaturePad ref="commitmentPadRef" :width="signatureCanvasWidth" :height="signatureCanvasHeight" />
      </div>
      <template #footer>
        <el-button @click="fullscreenSignVisible = false">取消</el-button>
        <el-button @click="clearCommitmentPad">清除</el-button>
        <el-button type="primary" @click="confirmSignature">确认签名</el-button>
      </template>
    </el-dialog>

    <!-- 回避事由弹窗 -->
    <el-dialog
      v-model="recusalModalVisible"
      title="附件：回避事由"
      width="600px"
      append-to-body
    >
      <div class="recusal-content">
        <p class="recusal-intro">根据《中华人民共和国仲裁法》以及本会仲裁规则，需要回避的事由包括以下情形：</p>
        <ol class="recusal-list">
          <li>是本案当事人、代理人或者当事人、代理人的近亲属；</li>
          <li>与本案有利害关系；</li>
          <li>与本案当事人、代理人有其他关系，可能影响公正仲裁；</li>
          <li>私自会见当事人、代理人，或者接受当事人、代理人的请客送礼。</li>
        </ol>
        <p class="recusal-sub-intro">前述第3项中的"与本案当事人、代理人有其他关系"，包括下列情形：</p>
        <ol class="recusal-sub-list">
          <li>与本案当事人、代理人有咨询与被咨询、管理与被管理关系，或者担任本案当事人、代理人的代理人或者顾问的，但至组庭之日有关关系已经结束超过二年的除外；</li>
          <li>与本案当事人、代理人现在同一单位工作的；</li>
          <li>对本案所涉争议向当事人推荐、介绍过代理人的；</li>
          <li>对本案所涉争议提供过咨询，或者担任过与本案所涉争议有关案件的证人、鉴定人、勘验人、翻译人员、辩护人、代理人的；</li>
          <li>在本会正在审理的其他案件中，与本案当事人、代理人同为仲裁员的；</li>
          <li>在本案当事人、代理人担任仲裁员的案件中，本案仲裁员为该案当事人、代理人的，但至组庭之日案件已经审结超过二年的除外；</li>
          <li>其他可能影响公正裁决的情形。</li>
        </ol>
      </div>
      <template #footer>
        <el-button type="primary" @click="recusalModalVisible = false">我已阅读</el-button>
      </template>
    </el-dialog>

    <!-- 笔录签名弹窗 -->
    <el-dialog
      v-model="recordDialogVisible"
      :title="currentDoc?.docTitle || '笔录签名'"
      fullscreen
      :close-on-click-modal="false"
      :lock-scroll="true"
      class="record-sign-dialog"
    >
      <div class="record-sign">
        <div class="doc-info">
          <p><span class="label">所属案号：</span>{{ currentDoc?.caseNo }}</p>
          <p><span class="label">案由：</span>{{ currentDoc?.caseReason }}</p>
          <p><span class="label">提交时间：</span>{{ currentDoc?.submitTime }}</p>
        </div>
        <el-divider />
        <SignaturePad ref="recordPadRef" :width="signatureCanvasWidth" :height="signatureCanvasHeight" />
      </div>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button @click="clearRecordPad">清除</el-button>
        <el-button type="primary" @click="confirmRecordSign">确认签名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import { useTodoStore } from '@/stores/todo'
import SignaturePad from './shared/SignaturePad.vue'
import SignatureTable from './shared/SignatureTable.vue'

const router = useRouter()
const todoStore = useTodoStore()
const { commitmentList, recordList, documentList } = storeToRefs(todoStore)

const activeTab = ref('commitment')
const currentDoc = ref(null)

// 承诺书签署
const commitmentDialogVisible = ref(false)
const commitmentPadRef = ref(null)
const recusalModalVisible = ref(false)
const fullscreenSignVisible = ref(false)
const commitmentSignature = ref('')

const declaration = ref({
  type: '',
  recusalItem: '',
  disclosureText: '',
  subType: '',
  otherReason: '',
})

// 笔录签名
const recordDialogVisible = ref(false)
const recordPadRef = ref(null)

// 全屏签名画布尺寸：跟随浏览器视口
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const onResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// 画布宽度 = 视口宽度 - 80px (弹窗左右内边距)
// 画布高度 = 视口高度 - 200px (弹窗标题 + 底部按钮 + 信息区)
const signatureCanvasWidth = computed(() => Math.max(400, windowWidth.value - 80))
const signatureCanvasHeight = computed(() => Math.max(300, windowHeight.value - 200))

const handleTabChange = () => {
  // 切换 tab 时重置状态
}

// ============ 承诺书 ============
const openCommitmentDialog = (row) => {
  currentDoc.value = row
  commitmentSignature.value = ''
  declaration.value = { type: '', recusalItem: '', disclosureText: '', subType: '', otherReason: '' }
  commitmentDialogVisible.value = true
}

const clearCommitmentPad = () => {
  commitmentPadRef.value?.clear()
}

const confirmSignature = () => {
  const signature = commitmentPadRef.value?.getSignature()
  if (!signature) {
    ElMessage.warning('请先完成手写签名')
    return
  }
  commitmentSignature.value = signature
  fullscreenSignVisible.value = false
  ElMessage.success('签名已完成')
}

const handleSubmitCommitment = () => {
  if (!declaration.value.type) {
    ElMessage.warning('请选择声明选项')
    return
  }
  if (declaration.value.type === '2' && !declaration.value.recusalItem.trim()) {
    ElMessage.warning('请填写回避事由项数')
    return
  }
  if (declaration.value.type === '3') {
    if (!declaration.value.disclosureText.trim()) {
      ElMessage.warning('请填写披露内容')
      return
    }
    if (!declaration.value.subType) {
      ElMessage.warning('请选择子选项')
      return
    }
  }
  if (declaration.value.type === '4' && !declaration.value.otherReason.trim()) {
    ElMessage.warning('请填写事由')
    return
  }
  if (!commitmentSignature.value) {
    ElMessage.warning('请先完成电子签名')
    return
  }
  todoStore.signCommitment(currentDoc.value.id)
  ElMessage.success('承诺书提交成功')
  commitmentDialogVisible.value = false
}

// ============ 笔录 ============
const openRecordDialog = (row) => {
  currentDoc.value = row
  recordDialogVisible.value = true
}

const openRecordPreview = (row) => {
  if (!row?.fileUrl) {
    ElMessage.warning('暂无笔录文件')
    return
  }
  window.open(row.fileUrl, '_blank')
}

const clearRecordPad = () => {
  recordPadRef.value?.clear()
}

const confirmRecordSign = () => {
  const signature = recordPadRef.value?.getSignature()
  if (!signature) {
    ElMessage.warning('请先完成手写签名')
    return
  }
  todoStore.signRecord(currentDoc.value.id)
  ElMessage.success('笔录签名成功')
  recordDialogVisible.value = false
}

// ============ 文书 ============
// 跳转案件详情页-仲裁文书 Tab 处理签名
const handleDocumentSign = (row) => {
  if (!row?.caseId) {
    ElMessage.warning('未找到关联案件')
    return
  }
  router.push({ path: `/cases/${row.caseId}`, query: { tab: 'docs' } })
}
</script>

<style scoped lang="scss">
.signature-list {
  .signature-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
    :deep(.el-tabs__item.is-active) {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    :deep(.el-tabs__active-line) {
      background-color: var(--el-color-primary);
    }
  }
}

/* ============ 承诺书弹窗 ============ */
.commitment-dialog {
  .commitment-body {
    max-height: 64vh;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dialog-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      padding-bottom: 12px;
      margin-bottom: 16px;
      /* 区块分组锚点：细分隔线把六个同权重的区块划分成可辨认的分组 */
      border-bottom: 1px solid var(--el-border-color-lighter);
      letter-spacing: 0.02em;
    }

    .section-content {
      padding: 0;
    }
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;

    &.full {
      grid-column: 1 / -1;
    }

    .info-label {
      flex-shrink: 0;
      /* 四字标签统一宽度，保证值左边缘对齐 */
      width: 56px;
      font-size: 12px;
      text-align: left;
      /* 辅助文字用 secondary 满足 WCAG AA 对比度 */
      color: var(--el-text-color-secondary);
      line-height: 22px;
    }

    .info-value {
      flex: 1;
      min-width: 0;
      overflow-wrap: break-word;
      font-size: 14px;
      text-align: left;
      /* 正文值用 carbon，避免与标题级 navy 混淆 */
      color: var(--el-text-color-regular);
      line-height: 22px;
    }

    /* 仲裁庭成员手机号：紧随姓名，次要色区分，保持 14px 正文 */
    .member-phone {
      margin-left: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  /* 案件信息摘要：浅灰底面板 + 双列网格，一屏速览 */
  .case-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 24px;
    padding: 16px 20px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;

    .info-row {
      display: flex;
      align-items: flex-start;
      min-width: 0;
    }

    .info-row:last-child {
      grid-column: 1 / -1;
    }
  }

  .party-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    /* 当事人名称作为卡片标题，建立层级 */
    .party-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 22px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
    }
  }

  .declaration-hint {
    font-size: 12px;
    /* 辅助文字用 secondary 满足 WCAG AA 对比度 */
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }

  .declaration-group {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    /* 去掉 Element Plus 默认的 align-items: center，选项占满宽度、统一左对齐 */
    align-items: stretch;

    :deep(.el-radio) {
      display: flex;
      align-items: flex-start;
      height: auto;
      margin-right: 0;
      padding: 12px 0;

      .el-radio__input {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .el-radio__label {
        white-space: normal;
        line-height: 22px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        flex: 1;
      }
    }

    .declaration-option {
      // position: relative;
      // border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .radio-text {
        display: inline;
      }

      .inline-input {
        display: inline-flex;
        width: 60px;
        margin: 0 4px;
        vertical-align: middle;

        :deep(.el-input__wrapper) {
          border-radius: 0;
          border-bottom: 1px solid var(--el-border-color);
          box-shadow: none;
          padding: 0 4px;
        }
      }

      .recusal-link {
        /* 紧随选项文字，不换行 */
        margin-left: 8px;
        font-size: 14px;
        padding: 0;
        height: auto;
        vertical-align: middle;
      }

      .option-3-expand {
        margin-left: 22px;
        margin-top: 8px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .sub-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        /* 子选项也去掉默认居中，统一左对齐占满宽度 */
        align-items: stretch;

        :deep(.el-radio) {
          margin-right: 0;
          padding: 4px 0;

          .el-radio__input {
            margin-top: 2px;
          }

          .el-radio__label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            line-height: 22px;
          }
        }
      }
    }
  }

  .commitment-text {
    padding: 16px 20px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;

    p {
      font-size: 14px;
      line-height: 1.8;
      color: var(--el-text-color-regular);
      margin: 0 0 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .commitment-label {
        font-weight: 600;
        color: var(--el-text-color-regular);
      }
    }
  }

  .signature-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
    padding: 32px 0;
    /* 虚线容器提示签名操作区，强化最终步骤的可见性 */
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    background-color: var(--el-bg-color-page);
  }

  .signature-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .signature-image {
      max-width: 300px;
      max-height: 120px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
    }
  }
}

/* ============ 全屏签名弹窗 ============ */
.fullscreen-sign-dialog {
  .fullscreen-sign-body {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 120px);
    overflow: hidden;
  }
}

/* ============ 回避事由弹窗 ============ */
.recusal-content {
  max-height: 50vh;
  overflow-y: auto;

  .recusal-intro {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
  }

  .recusal-list {
    padding-left: 20px;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
    margin-bottom: 16px;

    li {
      margin-bottom: 4px;
    }
  }

  .recusal-sub-intro {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  .recusal-sub-list {
    padding-left: 20px;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-regular);

    li {
      margin-bottom: 4px;
    }
  }
}

/* ============ 笔录签名 ============ */
.record-sign {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .doc-info {
    display: flex;
    align-items: baseline;
    gap: 32px;
    margin-bottom: 8px;

    p {
      display: flex;
      align-items: baseline;
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-regular);

      .label {
        flex-shrink: 0;
        width: 70px;
        color: var(--el-text-color-secondary);
        text-align: left;
      }
    }
  }

  :deep(.signature-pad-wrapper) {
    flex: 1;
    min-height: 0;
  }
  :deep(.signature-canvas) {
    height: 100%;
    width: 100%;
  }
}

/* ============ 折叠动画 ============ */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  margin: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ============ 移动端适配 ============ */
@media (max-width: 768px) {
  .commitment-dialog .case-summary,
  .commitment-dialog .party-grid {
    grid-template-columns: 1fr;
  }

  .commitment-dialog .party-card {
    padding: 12px 16px;
  }
}
</style>

<!-- 非 scoped 样式块：el-dialog 通过 teleport 挂载到 body，scoped 的 data-v 属性不会传递到
     teleport 后的 .el-dialog 节点，故此处用非 scoped 块 + .record-sign-dialog 类名限定，
     确保笔录签名弹窗铺满浏览器高度。 -->
<style lang="scss">
.el-dialog.record-sign-dialog {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .el-dialog__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
  }
}
</style>
