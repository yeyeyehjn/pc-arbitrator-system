# 「证据和质证」模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在案件详情页「仲裁文书」前新增「证据和质证」Tab，以左侧竖向侧栏组织三种证据类型（申请人 / 被申请人 / 仲裁庭依职权调取），每类展示质证通知、证据目录、证据清单（含质证详情），并联动删除旧证据区块、适配材料阅览。

**Architecture:** 升级 `caseDetail` store 的 `evidence` 状态为三层结构（`{ applicant, respondent, tribunal }`，每类含 `notice/catalog/list`）；新增 `EvidenceTab.vue`（侧栏 + 三子块布局）与 `shared/EvidenceList.vue`（证据清单展开式表格）；`CaseDetailView.vue` 挂载新 Tab；删除 `InfoTab.vue` 旧证据区块；`MaterialReaderView.vue` 目录分组改为从新结构平铺附件。

**Tech Stack:** Vue 3 + Composition API（`<script setup>`）、Pinia、Element Plus（`el-table` expand、`el-check-tag`、`el-dialog`）、SCSS（scoped）。

## Global Constraints

- 字号仅允许 16/14/12/10px 四档，禁止 13px/15px；12px 辅助文字必须用 `var(--el-text-color-secondary)`（DESIGN.md §2、§1.2）。
- 表格仅行底分隔线，表头 `border-bottom: none !important` 由全局样式强制，组件内不得重复定义表头样式（DESIGN.md §4.3）。
- 卡片必须复用全局 `.section-card` 类，禁止组件内重定义 `.section-card` / `.filter-bar` / `.table-section` 等全局类样式（DESIGN.md §4、反模式 §3）。
- 侧栏选中态复用 `.todos-sidebar` 系统元素：`#f2f5fa` 背景 + 主题色文字 + 左侧 3px 主题色竖条（DESIGN.md §4.5、§4.6.1 登记的选中态例外）。
- 禁止使用 em dash「—」，文案用「暂无」「无」表达空态（DESIGN.md 反模式 §7.7）。
- 间距为 4 的倍数；区块间 `margin-bottom: 16px`；卡片内边距 20px（DESIGN.md §3.3）。
- 按钮文案为「动词 + 对象」，12px 字号；图标按钮必须带 `aria-label`。
- 移动端（≤768px）：左侧 200px 侧栏折叠为顶部横向分类 chips（DESIGN.md §3.2 待办事项模块的响应式惯例）。
- 文件预览交互沿用 `MaterialList.vue` 风格：`el-dialog` 预览占位（image/pdf/不支持），下载用 `ElMessage.success` mock。
- 项目无单元测试框架，每个任务以 `npm run build`（Vite 编译检查）+ 浏览器手动验证收尾。

---

### Task 1: 升级 caseDetail store 的 evidence 数据结构与 mock 数据

**Files:**
- Modify: `src/stores/caseDetail.js`（L193-203 mock 数据、L270 初始值）

**Interfaces:**
- Consumes: 无
- Produces: `store.evidence` 新结构 `{ applicant, respondent, tribunal }`，每类为 `{ notice: {name,uploadTime,uploader} | null, catalog: [{id,name,form,pages,submitDate}], list: [{id,name,content,files:[{id,name,fileType}],challenge:{challenger,reason,opinionFiles:[{id,name,fileType}]} | null}] }`。下游 `EvidenceTab.vue`（Task 3）、`EvidenceList.vue`（Task 2）、`MaterialReaderView.vue`（Task 6）全部依赖此结构。

- [ ] **Step 1: 替换 mock 数据中的 evidence 区块**

将 `buildMockCaseDetail` 内 `evidence: {...}`（现 L193-203）整体替换为三层结构：

```js
    evidence: {
      applicant: {
        notice: { name: '质证通知（申请人）.pdf', uploadTime: '2026-06-10 15:00', uploader: '刘秘书' },
        catalog: [
          { id: 'ct-a1', name: '买卖合同', form: '合同', pages: 6, submitDate: '2026-03-15' },
          { id: 'ct-a2', name: '送货单（8 份）', form: '单据', pages: 16, submitDate: '2026-03-15' },
          { id: 'ct-a3', name: '对账单', form: '财务', pages: 4, submitDate: '2026-03-15' },
        ],
        list: [
          {
            id: 'ev-a1',
            name: '买卖合同',
            content: '双方于2025年3月10日签订《买卖合同》，约定申请人供货、被申请人付款，合同总金额350万元，分8批交付。',
            files: [
              { id: 'f-a1-1', name: '合同.pdf', fileType: 'pdf' },
              { id: 'f-a1-2', name: '签章页.jpg', fileType: 'image' },
              { id: 'f-a1-3', name: '补充协议.pdf', fileType: 'pdf' },
            ],
            challenge: {
              challenger: '李律师（被申请人代理人）',
              reason: '对真实性无异议，对关联性有异议，证据与本案货款争议关联不足。',
              opinionFiles: [{ id: 'of-a1-1', name: '质证意见书.pdf', fileType: 'pdf' }],
            },
          },
          {
            id: 'ev-a2',
            name: '送货单（8 份）',
            content: '申请人于2025年3月15日至4月20日分8批交付货物，每批均有被申请人签收的送货单，载明货物名称、数量、金额。',
            files: [
              { id: 'f-a2-1', name: '送货单01.pdf', fileType: 'pdf' },
              { id: 'f-a2-2', name: '送货单02.pdf', fileType: 'pdf' },
              { id: 'f-a2-3', name: '送货单03.pdf', fileType: 'pdf' },
              { id: 'f-a2-4', name: '送货单04.pdf', fileType: 'pdf' },
              { id: 'f-a2-5', name: '送货单05.pdf', fileType: 'pdf' },
              { id: 'f-a2-6', name: '送货单06.pdf', fileType: 'pdf' },
              { id: 'f-a2-7', name: '送货单07.pdf', fileType: 'pdf' },
              { id: 'f-a2-8', name: '送货单08.pdf', fileType: 'pdf' },
            ],
            challenge: null,
          },
          {
            id: 'ev-a3',
            name: '对账单',
            content: '双方于2025年5月10日对账确认，截至对账日被申请人累计欠付货款280万元，对账单经双方盖章确认。',
            files: [
              { id: 'f-a3-1', name: '对账单.pdf', fileType: 'pdf' },
              { id: 'f-a3-2', name: '往来明细.xlsx', fileType: 'excel' },
            ],
            challenge: {
              challenger: '李律师（被申请人代理人）',
              reason: '对账单金额有误，未包含退货抵扣部分，欠付金额应以实际退货核算为准。',
              opinionFiles: [{ id: 'of-a3-1', name: '质证意见（对账单）.pdf', fileType: 'pdf' }],
            },
          },
        ],
      },
      respondent: {
        notice: { name: '质证通知（被申请人）.pdf', uploadTime: '2026-06-10 15:00', uploader: '刘秘书' },
        catalog: [
          { id: 'ct-b1', name: '质量检测报告', form: '鉴定', pages: 10, submitDate: '2026-06-12' },
          { id: 'ct-b2', name: '维修费用清单', form: '财务', pages: 3, submitDate: '2026-06-12' },
        ],
        list: [
          {
            id: 'ev-b1',
            name: '质量检测报告',
            content: '被申请人委托检测机构对第5、6批次货物进行检测，报告载明两项性能指标偏差，与合同约定不符。',
            files: [{ id: 'f-b1-1', name: '质量检测报告.pdf', fileType: 'pdf' }],
            challenge: {
              challenger: '张律师（申请人代理人）',
              reason: '检测系单方委托，送检样品未经双方封样确认，检测标准与合同约定不一致。',
              opinionFiles: [{ id: 'of-b1-1', name: '质证意见（检测报告）.pdf', fileType: 'pdf' }],
            },
          },
          {
            id: 'ev-b2',
            name: '维修费用清单',
            content: '被申请人主张因货物质量问题产生维修费用，提交维修费用清单及相关票据。',
            files: [
              { id: 'f-b2-1', name: '维修费用清单.pdf', fileType: 'pdf' },
              { id: 'f-b2-2', name: '维修发票.pdf', fileType: 'pdf' },
            ],
            challenge: null,
          },
        ],
      },
      tribunal: {
        notice: null,
        catalog: [{ id: 'ct-t1', name: '往来账户交易明细', form: '财务', pages: 8, submitDate: '2026-07-02' }],
        list: [
          {
            id: 'ev-t1',
            name: '往来账户交易明细',
            content: '仲裁庭依职权向银行调取的双方往来账户交易明细，用于核实货款支付与退还款项情况。',
            files: [{ id: 'f-t1-1', name: '往来账户交易明细.pdf', fileType: 'pdf' }],
            challenge: null,
          },
        ],
      },
    },
```

- [ ] **Step 2: 更新 evidence ref 初始值**

将 `const evidence = ref({ applicant: [], respondent: [] })`（现 L270）替换为：

```js
  const evidence = ref({
    applicant: { notice: null, catalog: [], list: [] },
    respondent: { notice: null, catalog: [], list: [] },
    tribunal: { notice: null, catalog: [], list: [] },
  })
```

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: Vite 编译成功（当前无 UI 消费新字段，仅结构变化不报错）。

- [ ] **Step 4: Commit**

```bash
git add src/stores/caseDetail.js
git commit -m "feat: 升级 caseDetail store 证据数据为三层结构"
```

---

### Task 2: 新增 EvidenceList 组件（证据清单子块）

**Files:**
- Create: `src/views/cases/components/detail/shared/EvidenceList.vue`

**Interfaces:**
- Consumes: Task 1 的 `list` 条目结构 `{ id, name, content, files: [{id,name,fileType}], challenge: {challenger, reason, opinionFiles: [...]} | null }`。
- Produces: 组件 `<EvidenceList :list="[...]" />`，`EvidenceTab.vue`（Task 3）挂载。

- [ ] **Step 1: 编写组件模板与逻辑**

```vue
<template>
  <div class="evidence-list">
    <!-- 统计筛选条 -->
    <div class="list-toolbar">
      <span class="toolbar-count">共 <b>{{ list.length }}</b> 项</span>
      <span v-if="challengedCount" class="toolbar-challenged">{{ challengedCount }} 项有质证</span>
      <div class="toolbar-filters">
        <el-check-tag
          v-for="f in filters"
          :key="f.value"
          :checked="filter === f.value"
          @change="setFilter(f.value)"
        >{{ f.label }}</el-check-tag>
      </div>
    </div>

    <!-- 空状态 -->
    <CaseEmptyState v-if="!filteredList.length" text="暂无证据清单" />

    <!-- 展开式表格 -->
    <el-table v-else :data="filteredList" row-key="id" style="width: 100%">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-body">
            <div class="expand-content">
              <div class="content-label">证据内容</div>
              <div class="content-text">{{ row.content || '暂无证据内容' }}</div>
            </div>
            <div v-if="row.challenge" class="challenge-card">
              <span class="challenge-tag">质证</span>
              <div class="challenge-line">
                <span class="challenge-label">质证人：</span>
                <span>{{ row.challenge.challenger }}</span>
              </div>
              <div class="challenge-line">
                <span class="challenge-label">质证理由：</span>
                <span>{{ row.challenge.reason }}</span>
              </div>
              <div v-if="row.challenge.opinionFiles?.length" class="challenge-line">
                <span class="challenge-label">质证意见附件：</span>
                <span
                  v-for="f in row.challenge.opinionFiles"
                  :key="f.id"
                  class="attach-chip"
                  :title="f.name"
                  @click="previewFile(f)"
                >
                  <el-icon><Document /></el-icon>
                  <span class="chip-name">{{ f.name }}</span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="编号" width="64">
        <template #default="{ $index }">
          <span class="index-no" :class="{ has-challenge: filteredList[$index]?.challenge }">{{ $index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="证据名称" min-width="160" show-overflow-tooltip />

      <el-table-column label="证据附件" min-width="240">
        <template #default="{ row }">
          <div class="attach-wrap">
            <span
              v-for="f in row.files"
              :key="f.id"
              class="attach-chip"
              :title="f.name"
              @click="previewFile(f)"
            >
              <el-icon><Document /></el-icon>
              <span class="chip-name">{{ f.name }}</span>
              <el-icon class="chip-download" @click.stop="downloadFile(f)"><Download /></el-icon>
            </span>
            <span v-if="!row.files?.length" class="none-text">无</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="质证" width="90" align="center">
        <template #default="{ row }">
          <span v-if="row.challenge" class="challenge-badge">有质证</span>
          <span v-else class="none-text">无</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="currentFile?.name || '文件预览'" width="60%" top="8vh">
      <div class="preview-content">
        <div v-if="currentFile?.fileType === 'image'" class="preview-placeholder">[图片预览区] {{ currentFile?.name }}</div>
        <div v-else-if="currentFile?.fileType === 'pdf'" class="preview-placeholder">[PDF 预览区] {{ currentFile?.name }}</div>
        <div v-else class="preview-placeholder">该文件类型暂不支持在线预览</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Download } from '@element-plus/icons-vue'
import CaseEmptyState from '../../shared/CaseEmptyState.vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
})

const filter = ref('all')
const filters = [
  { value: 'all', label: '全部' },
  { value: 'challenged', label: '有质证' },
  { value: 'plain', label: '无质证' },
]

const challengedCount = computed(() => props.list.filter((i) => i.challenge).length)

const filteredList = computed(() => {
  if (filter.value === 'all') return props.list
  return props.list.filter((i) => (filter.value === 'challenged') === !!i.challenge)
})

const setFilter = (v) => {
  filter.value = v
}

const previewVisible = ref(false)
const currentFile = ref(null)

const previewFile = (file) => {
  currentFile.value = file
  previewVisible.value = true
}

const downloadFile = (file) => {
  ElMessage.success(`《${file.name}》下载已开始`)
}
</script>

<style scoped lang="scss">
.evidence-list {
  .list-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #fafafa;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;

    .toolbar-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);

      b {
        color: #00296b;
      }
    }

    .toolbar-challenged {
      font-size: 12px;
      color: #b45309;

      b {
        color: #b45309;
      }
    }

    .toolbar-filters {
      margin-left: auto;
      display: flex;
      gap: 6px;
    }
  }

  /* 附件 chips：浅蓝底 + 主题蓝字 */
  .attach-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .attach-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: #f2f5fa;
    border: 1px solid #d8ddf0;
    border-radius: 4px;
    padding: 2px 8px;
    color: var(--el-color-primary);
    font-size: 12px;
    cursor: pointer;
    max-width: 100%;

    .chip-name {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chip-download {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    &:hover {
      background-color: #e7e9f4;
      border-color: var(--el-color-primary-light-5);
    }
  }

  /* 展开行 */
  .expand-body {
    margin: 0 12px 8px 64px;
    border: 1px solid #f5d9a0;
    border-radius: 6px;
    background-color: #fffdf7;
    padding: 10px 12px;

    .expand-content {
      margin-bottom: 8px;

      .content-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 2px;
      }

      .content-text {
        font-size: 14px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
      }
    }

    .challenge-card {
      border-top: 1px dashed #f5d9a0;
      padding-top: 8px;

      .challenge-tag {
        display: inline-block;
        background-color: var(--app-color-accent);
        color: #ffffff;
        border-radius: 3px;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .challenge-line {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
        flex-wrap: wrap;

        .challenge-label {
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }
      }
    }
  }

  .index-no {
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &.has-challenge {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  .challenge-badge {
    display: inline-block;
    background-color: #fff7e6;
    color: #b45309;
    border: 1px solid #f5d9a0;
    border-radius: 3px;
    padding: 1px 6px;
    font-size: 10px;
    white-space: nowrap;
  }

  .none-text {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  .preview-content {
    min-height: 300px;

    .preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: Vite 编译成功。

- [ ] **Step 3: Commit**

```bash
git add src/views/cases/components/detail/shared/EvidenceList.vue
git commit -m "feat: 新增证据清单组件（展开式表格 + 质证详情）"
```

---

### Task 3: 新增 EvidenceTab 组件（侧栏 + 质证通知 + 证据目录）

**Files:**
- Create: `src/views/cases/components/detail/EvidenceTab.vue`

**Interfaces:**
- Consumes: Task 1 的 `store.evidence` 三层结构；Task 2 的 `<EvidenceList :list="..." />`。
- Produces: `<EvidenceTab :case-id="..."/>`，由 `CaseDetailView.vue`（Task 4）挂载到 `name="evidence"` 的 tab-pane。

- [ ] **Step 1: 编写组件模板与逻辑**

```vue
<template>
  <div class="evidence-tab">
    <div class="evidence-layout">
      <!-- 左侧竖向侧栏 -->
      <aside class="evidence-sidebar">
        <div
          v-for="type in types"
          :key="type.key"
          class="sidebar-item"
          :class="{ active: activeType === type.key }"
          @click="activeType = type.key"
        >
          <span class="item-label">{{ type.label }}</span>
          <span v-if="evidence[type.key]?.list?.length" class="item-badge">{{ evidence[type.key].list.length }}</span>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <div class="evidence-content">
        <div class="content-toolbar">
          <span class="content-title">{{ currentLabel }}</span>
          <el-button size="small" :icon="Reading" @click="openMaterialReader">材料阅览</el-button>
        </div>

        <!-- 质证通知 -->
        <div class="section-card">
          <div class="section-title">质证通知</div>
          <div v-if="current.notice" class="notice-file">
            <span class="file-chip"><el-icon><Document /></el-icon></span>
            <span class="file-name">{{ current.notice.name }}</span>
            <span class="file-divider" />
            <span class="file-meta">{{ current.notice.uploadTime }}</span>
            <span class="file-divider" />
            <span class="file-meta">上传人：{{ current.notice.uploader }}</span>
            <el-button class="file-action" link size="small" :icon="Download" @click="downloadFile(current.notice)">下载</el-button>
          </div>
          <div v-else class="empty-tip">暂无质证通知</div>
        </div>

        <!-- 证据目录 -->
        <div class="section-card">
          <div class="section-title-row">
            <span class="section-title">证据目录</span>
            <div class="section-actions">
              <el-button size="small" :icon="Download" @click="downloadCatalog">下载目录文件</el-button>
            </div>
          </div>
          <el-table v-if="current.catalog?.length" :data="current.catalog" style="width: 100%">
            <el-table-column label="序号" width="64">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="name" label="证据名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="form" label="证据形式" width="100" />
            <el-table-column prop="pages" label="页数" width="80" align="center" />
            <el-table-column prop="submitDate" label="提交日期" width="120" />
          </el-table>
          <div v-else class="empty-tip">暂无证据目录</div>
        </div>

        <!-- 证据清单 -->
        <div class="section-card">
          <div class="section-title">证据清单</div>
          <EvidenceList :list="current.list || []" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Download, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import EvidenceList from './shared/EvidenceList.vue'

defineProps({
  caseId: {
    type: String,
    default: '',
  },
})

const store = useCaseDetailStore()
const route = useRoute()
const router = useRouter()

const types = [
  { key: 'applicant', label: '申请人证据' },
  { key: 'respondent', label: '被申请人证据' },
  { key: 'tribunal', label: '仲裁庭依职权调取证据' },
]
const activeType = ref('applicant')

const evidence = computed(() => store.evidence || {})
const current = computed(
  () => evidence.value[activeType.value] || { notice: null, catalog: [], list: [] },
)
const currentLabel = computed(
  () => types.find((t) => t.key === activeType.value)?.label || '',
)

const openMaterialReader = () => {
  const caseId = route.params.id
  const url = router.resolve(`/cases/${caseId}/material-reader`).href
  window.open(url, '_blank')
}

const downloadFile = (file) => {
  ElMessage.success(`《${file.name}》下载已开始`)
}

const downloadCatalog = () => {
  ElMessage.success(`《${currentLabel.value}·证据目录》下载已开始`)
}
</script>

<style scoped lang="scss">
.evidence-tab {
  .evidence-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  // ============ 左侧竖向侧栏（复用 .todos-sidebar 选中态系统元素） ============
  .evidence-sidebar {
    width: 200px;
    flex-shrink: 0;
    background-color: #ffffff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .sidebar-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      transition: background-color 0.2s;

      .item-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-badge {
        flex-shrink: 0;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        font-size: 10px;
        background-color: #f2f5fa;
        color: var(--el-text-color-secondary);
      }

      &:hover {
        background-color: #fafafa;

        .item-label {
          color: var(--el-color-primary-light-3);
        }
      }

      &.active {
        background-color: #f2f5fa;
        color: var(--el-color-primary);
        font-weight: 600;

        /* 选中态 3px 竖条：DESIGN.md §4.6.1 登记的选中态系统元素 */
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background-color: var(--el-color-primary);
        }

        .item-badge {
          background-color: #e6e9f4;
          color: var(--el-color-primary);
        }
      }
    }
  }

  // ============ 右侧内容区 ============
  .evidence-content {
    flex: 1;
    min-width: 0;

    .content-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .content-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-regular);
      }
    }
  }

  // 质证通知文件条（复用 DocsTab award-file-info 语言）
  .notice-file {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    .file-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 6px;
      background-color: var(--el-bg-color);
      color: var(--el-color-primary);
      font-size: 14px;
      flex-shrink: 0;
    }

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-color-primary);
      line-height: 28px;
    }

    .file-divider {
      width: 1px;
      height: 12px;
      background-color: var(--el-border-color);
      flex-shrink: 0;
    }

    .file-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 28px;
    }

    .file-action {
      padding: 0 2px;
      height: 28px;
      color: var(--el-text-color-regular);

      &:hover,
      &:focus {
        color: var(--el-color-primary);
      }
    }
  }

  .empty-tip {
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    padding: 24px 0;
  }
}

// ============ 移动端（≤768px）：侧栏折叠为顶部横向分类 ============
@media (max-width: 768px) {
  .evidence-tab {
    .evidence-layout {
      flex-direction: column;
      gap: 12px;
    }

    .evidence-sidebar {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
      border: none;
      padding: 0;

      .sidebar-item {
        padding: 6px 14px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 999px;

        &.active::before {
          display: none;
        }
      }
    }
  }
}
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: Vite 编译成功。

- [ ] **Step 3: Commit**

```bash
git add src/views/cases/components/detail/EvidenceTab.vue
git commit -m "feat: 新增证据和质证 Tab 页面（侧栏 + 质证通知 + 证据目录 + 证据清单）"
```

---

### Task 4: CaseDetailView 挂载「证据和质证」Tab

**Files:**
- Modify: `src/views/cases/CaseDetailView.vue`（L20-22 前插入 tab-pane；L41-46 import）

**Interfaces:**
- Consumes: Task 3 的 `<EvidenceTab :case-id="..."/>`。
- Produces: 详情页顶层 Tab 顺序变为 办案 / 案情及当事人材料 / 证据和质证 / 仲裁文书 / 电子送达 / 讨论。

- [ ] **Step 1: 导入 EvidenceTab 并插入 tab-pane**

在 script 中新增 import（与现有组件 import 并列，L41-46）：

```js
import EvidenceTab from './components/detail/EvidenceTab.vue'
```

在「仲裁文书」tab-pane 之前插入（现 L20）：

```vue
        <el-tab-pane label="证据和质证" name="evidence">
          <EvidenceTab :case-id="store.currentCaseId" />
        </el-tab-pane>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: Vite 编译成功。

- [ ] **Step 3: 手动验证**

Run: `npm run dev`，打开任一案件详情页，点击「证据和质证」Tab。
Expected:
- 左侧侧栏三项：申请人证据(3)、被申请人证据(2)、仲裁庭依职权调取证据(1)，徽标数字与 mock 一致；
- 点击「被申请人证据」侧栏项，右侧联动切换，选中项出现 3px 主题色竖条；
- 质证通知文件条、证据目录表格正常渲染；
- 证据清单：共 3 项、2 项有质证；点「有质证」筛选仅剩 2 行；展开「买卖合同」行显示证据内容与质证卡片（质证人/质证理由/质证意见附件）；
- 附件 chips 点击弹出预览弹窗（pdf 显示「[PDF 预览区]」）；
- 「材料阅览」按钮新窗口打开材料阅览页。

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/CaseDetailView.vue
git commit -m "feat: 案件详情页挂载证据和质证 Tab"
```

---

### Task 5: 删除 InfoTab 旧证据区块

**Files:**
- Modify: `src/views/cases/components/detail/InfoTab.vue`（模板 L53-70、anchors L157、script L98/L101/L121-125/L131-142、样式 L312-325）
- Modify: `src/views/cases/CaseDetailView.vue`（L18 移除 `:evidence` 传参）

**Interfaces:**
- Consumes: Task 1 已升级 store（旧 evidence 数组结构不再存在，InfoTab 不能再消费 `evidence.applicant` 数组）。
- Produces: 「案情及当事人材料」Tab 不再有证据区块，「其他附件」区块保留。

- [ ] **Step 1: 删除模板中的证据 section-card**

删除 InfoTab.vue 模板 L53-70（`<!-- 证据 -->` 的整个 `.section-card`，含 `section-title-row`、两个 `.evidence-group`）。

- [ ] **Step 2: 清理 script**

1. 将 `import { Download, Reading } from '@element-plus/icons-vue'`（L98）整行删除（证据区块移除后两图标均无使用）。
2. 删除 `useRoute, useRouter` 相关：`const route = useRoute()` 与 `const router = useRouter()`（L131-132）。
3. 删除 `handleDownloadAll` 与 `openMaterialReader` 函数（L134-142）。
4. 删除 props 定义中的 `evidence` 项（L121-125）：
   ```js
   evidence: {
     type: Object,
     default: () => ({}),
   },
   ```
5. 保留 `MaterialList` import（其他附件区块仍使用）与 `attachments` prop。
6. anchors 数组中删除 `{ id: 'section-evidence', label: '证据' }`（L157）。

- [ ] **Step 3: 删除样式**

删除 `<style>` 中 `.evidence-group` 相关规则（L312-325，含 `.group-label`），保留 `.section-card` 的 `scroll-margin-top` 与 `#section-base` 规则。

- [ ] **Step 4: 更新 CaseDetailView 传参**

在 `CaseDetailView.vue` 的「案情及当事人材料」tab-pane（L18）中移除 `:evidence="store.evidence"`：

```vue
<InfoTab :case-info="store.caseInfo" :parties="store.parties" :claims="store.claims" :counter-claims="store.counterClaims" :attachments="store.attachments" />
```

- [ ] **Step 5: 构建验证**

Run: `npm run build`
Expected: Vite 编译成功（确认无残留对 `evidence.applicant` 数组形态的引用报错）。

- [ ] **Step 6: 手动验证**

Run: `npm run dev`，打开案件详情页「案情及当事人材料」Tab。
Expected: 无「证据」区块与右侧「证据」锚点；「其他附件」区块仍展示 2 条附件（组庭通知书、延期申请表）且可预览/下载。

- [ ] **Step 7: Commit**

```bash
git add src/views/cases/components/detail/InfoTab.vue src/views/cases/CaseDetailView.vue
git commit -m "refactor: 移除案情 Tab 旧证据区块，由证据和质证 Tab 接管"
```

---

### Task 6: 适配 MaterialReaderView 目录分组

**Files:**
- Modify: `src/views/cases/MaterialReaderView.vue`（L304-309 catalogGroups；script 新增 flatten 辅助函数）

**Interfaces:**
- Consumes: Task 1 的 `store.evidence` 三层结构（`type.list` 内每条 `files` 附件数组、`type.catalog` 供提交日期回填）。
- Produces: `catalogGroups` 含 4 组：申请人证据 / 被申请人证据 / 仲裁庭依职权调取证据 / 其他附件；每组 items 为附件平铺的材料项 `{ id, name, fileType, type, submitDate, pages }`，与现有模板字段（name/fileType/pages/type/submitDate/summary）兼容。

- [ ] **Step 1: 替换 catalogGroups 计算属性并新增辅助函数**

将现 L304-309：

```js
// 目录分组：整合案件全部材料
const catalogGroups = computed(() => [
  { id: 'applicant', label: '申请人证据', items: evidence.value.applicant || [] },
  { id: 'respondent', label: '被申请人证据', items: evidence.value.respondent || [] },
  { id: 'attachment', label: '其他附件', items: attachments.value || [] },
])
```

替换为：

```js
// 目录分组：整合案件全部材料（证据按附件平铺为材料项）
const catalogGroups = computed(() => [
  { id: 'applicant', label: '申请人证据', items: flattenEvidence(evidence.value.applicant) },
  { id: 'respondent', label: '被申请人证据', items: flattenEvidence(evidence.value.respondent) },
  { id: 'tribunal', label: '仲裁庭依职权调取证据', items: flattenEvidence(evidence.value.tribunal) },
  { id: 'attachment', label: '其他附件', items: attachments.value || [] },
])

// 将证据类型数据平铺为材料项：每个证据的每个附件作为一项，type 回填所属证据名
const flattenEvidence = (type) => {
  const list = type?.list || []
  return list.flatMap((ev) =>
    (ev.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      fileType: f.fileType || 'pdf',
      type: ev.name,
      submitDate: findCatalogDate(type?.catalog, ev) || '暂无',
      pages: 1,
    })),
  )
}

// 从证据目录回填提交日期
const findCatalogDate = (catalog, ev) => {
  const item = (catalog || []).find((c) => c.name === ev.name)
  return item?.submitDate
}
```

注意：`submitDate` 回填为「暂无」而非「—」，符合 DESIGN.md 反模式 §7.7（禁 em dash）。

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: Vite 编译成功。

- [ ] **Step 3: 手动验证**

Run: `npm run dev`，在案件详情页「证据和质证」Tab 点「材料阅览」，或直接访问 `/cases/:id/material-reader`。
Expected:
- 左侧目录 4 组：申请人证据（3 条附件）、被申请人证据（3 条附件）、仲裁庭依职权调取证据（1 条附件）、其他附件（2 条）；
- 分组可展开/折叠，点击材料项右侧出现预览占位；
- 搜索按附件名过滤正常；
- 封面视图显示附件名、所属证据（type）、提交日期。

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat: 材料阅览目录分组适配三层证据结构并新增依职权调取分组"
```

---

### Task 7: 整体回归验证

**Files:**
- 无代码修改，纯验证。

- [ ] **Step 1: 构建检查**

Run: `npm run build`
Expected: 编译成功。

- [ ] **Step 2: 全流程手动回归**

Run: `npm run dev`，逐项检查：
1. 案件详情页 6 个 Tab 顺序：办案 / 案情及当事人材料 / 证据和质证 / 仲裁文书 / 电子送达 / 讨论；
2. 证据和质证 Tab：三类型切换、徽标、筛选、展开、预览、材料阅览入口；
3. 案情 Tab：无证据区块、其他附件正常；
4. 仲裁文书 / 电子送达 / 讨论 Tab 无回归；
5. 材料阅览页 4 组目录正常；
6. 浏览器窗口缩窄至 ≤768px：证据和质证侧栏变为顶部横向 chips，选中态无竖条，布局不塌陷。
