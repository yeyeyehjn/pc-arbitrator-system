// AI 助手 Mock 知识库
// 按能力分区：法律法规、司法案例、文书草拟模板、操作指引

// === 法律法规（按案由检索） ===
export const legalDb = {
  '买卖合同纠纷': [
    { name: '《民法典》第五百八十二条', snippet: '履行不符合约定的，应当按照当事人的约定承担违约责任。对违约责任没有约定或者约定不明确的，受损害方根据标的的性质以及损失的大小，可以合理选择请求对方承担修理、重作、更换、退货、减少价款或者报酬等违约责任。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第五百八十三条', snippet: '当事人一方不履行合同义务或者履行合同义务不符合约定的，在履行义务或者采取补救措施后，对方还有其他损失的，应当赔偿损失。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第六百一十五条', snippet: '当事人约定检验期间的，买受人应当在检验期间内将标的物的数量或者质量不符合约定的情形通知出卖人。买受人怠于通知的，视为标的物的数量或者质量符合约定。', relevance: '中', source: 'pkulaw' },
  ],
  '建设工程施工合同纠纷': [
    { name: '《民法典》第七百九十三条', snippet: '建设工程施工合同无效，但是建设工程经验收合格的，可以参照合同关于工程价款的约定折价补偿承包人。', relevance: '高', source: 'pkulaw' },
    { name: '《最高人民法院关于审理建设工程施工合同纠纷案件适用法律问题的解释（一）》第一条', snippet: '建设工程施工合同具有下列情形之一的，应当依据民法典第一百五十三条第一款的规定，认定无效：（一）承包人未取得建筑业企业资质或者超越资质等级的…', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第八百零六条', snippet: '承包人将建设工程转包、违法分包的，发包人可以解除合同。发包人提供的主要建筑材料、建筑构配件和设备不符合强制性标准或者不履行协助义务，致使承包人无法施工，经催告后在合理期限内仍未履行相应义务的，承包人可以解除合同。', relevance: '中', source: 'pkulaw' },
  ],
  '借款合同纠纷': [
    { name: '《民法典》第六百七十九条', snippet: '自然人之间的借款合同，自贷款人提供借款时成立。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第六百八十条', snippet: '禁止高利放贷，借款的利率不得违反国家有关规定。借款合同对支付利息没有约定的，视为没有利息。', relevance: '高', source: 'pkulaw' },
    { name: '《最高人民法院关于审理民间借贷案件适用法律若干问题的规定》第二十五条', snippet: '出借人请求借款人按照合同约定利率支付利息的，人民法院应予支持，但是双方约定的利率超过合同成立时一年期贷款市场报价利率四倍的除外。', relevance: '中', source: 'pkulaw' },
  ],
  '股权转让纠纷': [
    { name: '《公司法》第七十一条', snippet: '有限责任公司的股东之间可以相互转让其全部或者部分股权。股东向股东以外的人转让股权，应当经其他股东过半数同意。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第五百零二条', snippet: '依法成立的合同，自成立时生效，但是法律另有规定或者当事人另有约定的除外。', relevance: '中', source: 'pkulaw' },
  ],
  '房屋租赁合同纠纷': [
    { name: '《民法典》第七百零三条', snippet: '租赁合同是出租人将租赁物交付承租人使用、收益，承租人支付租金的合同。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第七百二十二条', snippet: '承租人无正当理由未支付或者迟延支付租金的，出租人可以请求承租人在合理期限内支付；承租人逾期不支付的，出租人可以解除合同。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第七百一十六条', snippet: '承租人经出租人同意，可以将租赁物转租给第三人。', relevance: '中', source: 'pkulaw' },
  ],
  _default: [
    { name: '《民法典》第四百六十五条', snippet: '依法成立的合同，受法律保护。依法成立的合同，仅对当事人具有法律约束力，但是法律另有规定的除外。', relevance: '中', source: 'pkulaw' },
    { name: '《民法典》第五百零九条', snippet: '当事人应当按照约定全面履行自己的义务。当事人应当遵循诚信原则，根据合同的性质、目的和交易习惯履行通知、协助、保密等义务。', relevance: '中', source: 'pkulaw' },
    { name: '《民法典》第五百七十七条', snippet: '当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。', relevance: '低', source: 'pkulaw' },
  ],
}

// === 司法案例（按案由检索） ===
export const caseDb = {
  '买卖合同纠纷': [
    { caseNo: '(2024)沪仲第558号', reason: '买卖合同纠纷', tag: '类案', amount: 280, hearingDate: '2024-08-12', focusLabel: '争议焦点', focus: '买受人收货后未在约定检验期内提出质量异议，是否丧失质量抗辩权', source: 'pkulaw' },
    { caseNo: '(2023)最高法民申1234号', reason: '买卖合同纠纷', tag: '指导', amount: 1500, hearingDate: '2023-06-20', focusLabel: '裁判要旨', focus: '单方委托检测报告不能单独作为认定质量问题成立的依据，需结合其他证据综合判断', source: 'pkulaw' },
  ],
  '建设工程施工合同纠纷': [
    { caseNo: '(2024)京仲第892号', reason: '建设工程施工合同纠纷', tag: '类案', amount: 3200, hearingDate: '2024-03-15', focusLabel: '争议焦点', focus: '建设工程验收合格后，发包人能否以承包人未取得资质为由主张合同无效', source: 'pkulaw' },
    { caseNo: '(2022)最高法民终456号', reason: '建设工程施工合同纠纷', tag: '指导', amount: 8600, hearingDate: '2022-11-08', focusLabel: '裁判要旨', focus: '工程价款利息从应付工程价款之日计付，当事人对欠付工程价款利息计付标准有约定的，按照约定处理', source: 'pkulaw' },
  ],
  '借款合同纠纷': [
    { caseNo: '(2024)粤仲第334号', reason: '借款合同纠纷', tag: '类案', amount: 500, hearingDate: '2024-05-10', focusLabel: '争议焦点', focus: '民间借贷利率超过LPR四倍部分的利息约定效力', source: 'pkulaw' },
    { caseNo: '(2023)最高法民申789号', reason: '借款合同纠纷', tag: '指导', amount: 1200, hearingDate: '2023-09-22', focusLabel: '裁判要旨', focus: '借款人主张出借人职业放贷的，需举证证明出借人以放贷为业且未经金融监管部门批准', source: 'pkulaw' },
  ],
  '股权转让纠纷': [
    { caseNo: '(2024)沪仲第667号', reason: '股权转让纠纷', tag: '类案', amount: 800, hearingDate: '2024-07-03', focusLabel: '争议焦点', focus: '股东向股东以外的人转让股权未经其他股东过半数同意的转让效力', source: 'pkulaw' },
  ],
  '房屋租赁合同纠纷': [
    { caseNo: '(2024)沪仲第445号', reason: '房屋租赁合同纠纷', tag: '类案', amount: 120, hearingDate: '2024-02-18', focusLabel: '争议焦点', focus: '承租人逾期支付租金达到解除合同条件的认定标准', source: 'pkulaw' },
  ],
  _default: [
    { caseNo: '(2024)沪仲第100号', reason: '合同纠纷', tag: '类案', amount: 300, hearingDate: '2024-04-10', focusLabel: '争议焦点', focus: '合同履行中违约责任的认定与赔偿范围', source: 'pkulaw' },
    { caseNo: '(2023)最高法民申567号', reason: '合同纠纷', tag: '指导', amount: 2000, hearingDate: '2023-12-05', focusLabel: '裁判要旨', focus: '合同解除后，守约方有权请求违约方赔偿可得利益损失', source: 'pkulaw' },
  ],
}

// === 文书草拟模板（函数形式，接收案件上下文动态拼装） ===
export const draftTemplates = {
  award: (ctx) => ({
    docType: '裁决书',
    title: '裁决书（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildAwardHtml(ctx),
    caseContext: ctx.id,
  }),
  record: (ctx) => ({
    docType: '庭审笔录',
    title: '庭审笔录（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildRecordHtml(ctx),
    caseContext: ctx.id,
  }),
  extension: (ctx) => ({
    docType: '延期申请书',
    title: '延期申请书（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildExtensionHtml(ctx),
    caseContext: ctx.id,
  }),
}

// === 操作指引（按 intent 命中） ===
export const guideDb = {
  extend: {
    intro: '「发起延期审批」的操作步骤：',
    steps: [
      '进入 **我的案件**，点击目标案件的案号进入**案件详情页**',
      '切换到 **「办案」Tab**，找到「案件待办」区块',
      '在待办列表中找到「延期审批」事项，点击进入',
      '填写延期原因、申请延期天数，上传相关附件',
      '点击 **提交审批**，等待审批结果',
    ],
    tip: '审限到期前 15 天系统会黄色高亮提醒，建议尽早提交延期申请',
  },
  review: {
    intro: '「裁决书核阅」的操作步骤：',
    steps: [
      '进入 **待办事项**，点击左侧菜单「裁决书核阅列表」',
      '在列表中找到待核阅的裁决书，点击进入核阅页面',
      '在线阅读裁决书全文，使用批注工具标注修改意见',
      '核阅完成后，选择 **通过** 或 **退回修改**',
      '填写核阅意见并提交',
    ],
    tip: '退回修改时请详细注明修改位置和理由，便于秘书快速定位',
  },
  sign: {
    intro: '「笔录签名」的操作步骤：',
    steps: [
      '进入 **待办事项**，点击左侧菜单「签名列表」',
      '在列表中找到待签名的笔录，点击进入签名页面',
      '在线预览笔录内容，确认无误后点击 **签名**',
      '在签名板上手写签名，或上传电子签名图片',
      '确认签名后提交，系统自动记录签名时间',
    ],
    tip: undefined,
  },
  _default: {
    intro: '我是 AI 办案助手，可以帮您：',
    steps: [
      '**智能法律检索** — 输入案由或法条关键词，检索相关法律法规和司法案例',
      '**辅助文书草拟** — 基于当前案件信息，一键生成裁决书、庭审笔录等文书初稿',
      '**操作流程指引** — 询问系统操作步骤，获取分步指引（如"如何发起延期审批"）',
      '**案件信息摘要** — 快速查看当前案件的关键信息概览',
    ],
    tip: '您也可以直接使用下方的快捷指令按钮快速发起对话',
  },
}

// === 辅助函数：构建文书 HTML ===

function buildAwardHtml(ctx) {
  const applicants = (ctx.parties?.applicants || []).map(p => p.name).join('、')
  const respondents = (ctx.parties?.respondents || []).map(p => p.name).join('、')
  const claims = (ctx.claims || []).map((c, i) => `<p>${i + 1}. ${c}</p>`).join('')
  return `<h4 style="text-align:center">上海仲裁委员会裁决书</h4>
<p style="text-align:center">${ctx.caseNo}</p>
<p><strong>申请人：</strong>${applicants}</p>
<p><strong>被申请人：</strong>${respondents}</p>
<p><strong>案由：</strong>${ctx.reason}</p>
<hr/>
<p>申请人${applicants}与被申请人${respondents}因${ctx.reason}一案，本会根据双方约定受理后，依法组成仲裁庭进行了审理。</p>
<p><strong>申请人的仲裁请求：</strong></p>
${claims}
<p>（此处为裁决书正文草稿，AI 根据案件信息自动生成，仲裁员可在此基础上修改完善。）</p>`
}

function buildRecordHtml(ctx) {
  const applicants = (ctx.parties?.applicants || []).map(p => p.name).join('、')
  const respondents = (ctx.parties?.respondents || []).map(p => p.name).join('、')
  return `<h4 style="text-align:center">庭审笔录</h4>
<p style="text-align:center">${ctx.caseNo}</p>
<p><strong>开庭时间：</strong>${ctx.hearingDate || '待定'}</p>
<p><strong>开庭地点：</strong>${ctx.hearingLocation || '待定'}</p>
<p><strong>申请人：</strong>${applicants}</p>
<p><strong>被申请人：</strong>${respondents}</p>
<hr/>
<p><strong>庭审记录：</strong></p>
<p>（庭审笔录正文，AI 根据案件信息自动生成框架，仲裁员可在此基础上补充记录。）</p>`
}

function buildExtensionHtml(ctx) {
  return `<h4 style="text-align:center">延期申请书</h4>
<p style="text-align:center">${ctx.caseNo}</p>
<hr/>
<p>上海仲裁委员会：</p>
<p>关于${ctx.caseNo}号${ctx.reason}一案，因案件审理需要，现申请延长审理期限。</p>
<p><strong>申请延长期限：</strong>____ 天</p>
<p><strong>延期理由：</strong></p>
<p>（请填写延期理由，AI 根据案件信息自动生成框架。）</p>
<p>此致</p>
<p>上海仲裁委员会</p>
<p>仲裁员：____________</p>
<p>日期：____________</p>`
}
