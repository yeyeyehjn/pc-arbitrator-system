import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = path.join(__dirname, 'ux-report')
const SHOT_DIR = path.join(REPORT_DIR, 'screenshots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const BASE = 'http://localhost:5174/pc-arbitrator-system'

const ROUTES = [
  { name: '登录页', path: '/login', public: true },
  { name: '首页工作台', path: '/' },
  { name: '待办-签名', path: '/todos/signature' },
  { name: '待办-待办中心', path: '/todos/center' },
  { name: '待办-评审', path: '/todos/review' },
  { name: '待办-排期', path: '/todos/scheduling' },
  { name: '待办-咨询列表', path: '/todos/consult' },
  { name: '待办-咨询详情', path: '/todos/consult/ec1' },
  { name: '案件-列表', path: '/cases/list' },
  { name: '案件-统计', path: '/cases/statistics' },
  { name: '案件-咨询', path: '/cases/consult' },
  { name: '案件-详情', path: '/cases/case-0' },
  { name: '案件-材料阅读', path: '/cases/case-0/material-reader' },
  { name: '通知中心', path: '/notifications' },
  { name: '辅助工具', path: '/auxiliary' },
  { name: '个人-基本信息', path: '/profile/info' },
  { name: '个人-工作单位', path: '/profile/work' },
  { name: '个人-简历', path: '/profile/resume' },
  { name: '个人-报酬', path: '/profile/fee' },
  { name: '个人-银行账户', path: '/profile/bank' },
  { name: '个人-证书', path: '/profile/certificate' },
]

const PROFILES = [
  {
    key: 'pc',
    label: 'PC 端 (1440×900)',
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
  },
  {
    key: 'mobile',
    label: '移动端 (iPhone 390×844)',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
]

const MOCK_USER = { id: 'ux-audit', name: '走查仲裁员', role: '仲裁员' }

async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true })
    } catch (e) {
      console.log(`[launch] channel=${channel} 失败: ${e.message.split('\n')[0]}`)
    }
  }
  throw new Error('未找到可用的本机浏览器 (Edge/Chrome)')
}

async function auditPage(page, route, profile, shotName) {
  const issues = []
  const consoleErrors = []
  const consoleWarnings = []
  const pageErrors = []
  const badRequests = []

  const onConsole = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300))
    if (msg.type() === 'warning') consoleWarnings.push(msg.text().slice(0, 200))
  }
  const onPageError = (err) => pageErrors.push(String(err).slice(0, 300))
  const onResponse = (res) => {
    if (res.status() >= 400) badRequests.push(`${res.status()} ${res.url().slice(0, 120)}`)
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('response', onResponse)

  const started = Date.now()
  try {
    await page.goto(BASE + route.path, { waitUntil: 'load', timeout: 20000 })
    await page.waitForTimeout(1500)
  } catch (e) {
    issues.push({ severity: 'blocker', type: '页面加载失败', detail: e.message.split('\n')[0] })
  }
  const loadMs = Date.now() - started

  const metrics = await page.evaluate(() => {
    const vw = window.innerWidth
    const doc = document.documentElement
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
    }

    const bodyText = (document.body?.innerText || '').trim()
    const blankPage = bodyText.length < 10 && document.querySelectorAll('button, a, input, table').length === 0

    const hasHOverflow = doc.scrollWidth > vw + 1

    const overflowEls = []
    if (hasHOverflow) {
      for (const el of document.querySelectorAll('body *')) {
        if (!visible(el)) continue
        const r = el.getBoundingClientRect()
        if (r.right > vw + 2 || r.left < -2) {
          overflowEls.push({
            sel: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`,
            rect: { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) },
            text: (el.textContent || '').trim().slice(0, 30),
          })
        }
        if (overflowEls.length >= 8) break
      }
    }

    const smallFont = []
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length > 0 || !visible(el)) continue
      const t = (el.textContent || '').trim()
      if (!t) continue
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs < 12) smallFont.push({ sel: el.tagName.toLowerCase(), fs: Math.round(fs * 10) / 10, text: t.slice(0, 20) })
      if (smallFont.length >= 6) break
    }

    const smallTargets = []
    const clickableSel = 'button, a, [role="button"]'
    for (const el of document.querySelectorAll('button, a, [role="button"], input[type="checkbox"], input[type="radio"], .el-checkbox, .el-radio, [class*="toggle"], [class*="clickable"]')) {
      if (!visible(el)) continue
      // Element Plus 原生 input（el-radio__original 等）为视觉隐藏控件，
      // 实际可点击目标是外层 label（.el-radio/.el-checkbox），不单独计为触控目标
      if (el.classList.contains('el-radio__original') || el.classList.contains('el-checkbox__original')) continue
      // WCAG 2.5.8 以“有效触控目标”为准：若最近的按钮/链接祖先已达 24px，
      // 该元素只是祖先内部的视觉内容（如按钮内的小图标），不单独计为触控目标
      const anc = el.closest(clickableSel)
      if (anc && anc !== el) {
        const ar = anc.getBoundingClientRect()
        if (Math.min(ar.width, ar.height) >= 24) continue
      }
      const r = el.getBoundingClientRect()
      const min = Math.min(r.width, r.height)
      if (min > 0 && min < 24) {
        smallTargets.push({
          sel: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`,
          size: `${Math.round(r.width)}×${Math.round(r.height)}`,
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 16),
        })
      }
      if (smallTargets.length >= 8) break
    }

    return {
      vw,
      scrollW: doc.scrollWidth,
      title: document.title,
      bodyTextLen: bodyText.length,
      bodyTextHead: bodyText.replace(/\s+/g, ' ').slice(0, 120),
      blankPage,
      hasHOverflow,
      overflowEls,
      smallFont,
      smallTargets,
    }
  }).catch((e) => {
    issues.push({ severity: 'blocker', type: '页面脚本执行失败', detail: String(e).slice(0, 200) })
    return null
  })

  if (metrics) {
    if (metrics.blankPage) issues.push({ severity: 'blocker', type: '疑似白屏', detail: `正文文本长度 ${metrics.bodyTextLen}` })
    if (metrics.hasHOverflow) {
      issues.push({
        severity: 'critical',
        type: '横向溢出',
        detail: `scrollWidth=${metrics.scrollW} > 视口=${metrics.vw}`,
        elements: metrics.overflowEls,
      })
    }
    if (metrics.smallFont.length > 0) {
      issues.push({ severity: 'warning', type: '字号过小(<12px)', detail: `${metrics.smallFont.length}+ 处`, elements: metrics.smallFont })
    }
    if (profile.isMobile && metrics.smallTargets.length > 0) {
      issues.push({
        severity: 'warning',
        type: '点击目标过小(<24px, 违反 WCAG 2.5.8)',
        detail: `${metrics.smallTargets.length}+ 处`,
        elements: metrics.smallTargets,
      })
    }
  }
  if (consoleErrors.length) issues.push({ severity: 'error', type: '控制台错误', detail: `${consoleErrors.length} 条`, messages: consoleErrors.slice(0, 5) })
  if (pageErrors.length) issues.push({ severity: 'error', type: 'JS 未捕获异常', detail: `${pageErrors.length} 条`, messages: pageErrors.slice(0, 5) })
  if (badRequests.length) issues.push({ severity: 'error', type: '失败请求', detail: `${badRequests.length} 条`, messages: badRequests.slice(0, 5) })

  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  page.off('response', onResponse)

  return {
    route: route.name,
    path: route.path,
    url: page.url(),
    loadMs,
    redirected: !page.url().replace(/\/$/, '').endsWith((BASE + route.path).replace(/\/$/, '')) && page.url() !== BASE + route.path,
    title: metrics?.title || '',
    textHead: metrics?.bodyTextHead || '',
    issues,
    shot: shotName,
  }
}

async function interactionTests(browser) {
  const results = []
  for (const profile of PROFILES) {
    const ctx = await browser.newContext({
      viewport: profile.viewport,
      isMobile: profile.isMobile,
      hasTouch: profile.hasTouch,
      userAgent: profile.userAgent,
    })
    await ctx.addInitScript(([u]) => {
      localStorage.setItem('gzac_token', 'ux-audit-token')
      localStorage.setItem('gzac_user', JSON.stringify(u))
    }, [MOCK_USER])
    const page = await ctx.newPage()

    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 20000 })
      await page.waitForTimeout(1000)
      const loginBtn = page.locator('button:has-text("登"), button:has-text("login"), button[type="submit"]').first()
      if (await loginBtn.count()) {
        await loginBtn.click()
        await page.waitForTimeout(800)
        const validationVisible = await page
          .locator('.el-form-item__error, .el-message, [class*="error"], [class*="tip"]')
          .first()
          .isVisible()
          .catch(() => false)
        results.push({
          profile: profile.key,
          test: '登录页-空表单提交校验',
          pass: validationVisible,
          detail: validationVisible ? '出现了校验反馈' : '未检测到任何校验/提示反馈',
        })
      } else {
        results.push({ profile: profile.key, test: '登录页-空表单提交校验', pass: false, detail: '未找到登录按钮' })
      }
    } catch (e) {
      results.push({ profile: profile.key, test: '登录页-空表单提交校验', pass: false, detail: e.message.split('\n')[0] })
    }

    if (profile.isMobile) {
      try {
        await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 20000 })
        await page.waitForTimeout(1200)
        const toggle = page.locator('.mobile-menu-toggle')
        if (await toggle.count()) {
          const tgRect = await toggle.boundingBox()
          await toggle.click()
          await page.waitForTimeout(900)
          const drawerVisible = await page.locator('.mobile-drawer').isVisible().catch(() => false)
          const overlayVisible = await page
            .locator('.el-overlay, .v-modal, .el-drawer__open', { hasNot: page.locator('.nonexistent') })
            .first()
            .isVisible()
            .catch(() => false)
          results.push({
            profile: profile.key,
            test: '移动端-汉堡菜单展开抽屉',
            pass: drawerVisible,
            detail: `抽屉${drawerVisible ? '正常打开' : '未打开'}；菜单按钮尺寸 ${tgRect ? `${Math.round(tgRect.width)}×${Math.round(tgRect.height)}` : '未知'}；遮罩:${overlayVisible ? '有' : '未见'}`,
          })
          await page.keyboard.press('Escape').catch(() => {})
        } else {
          results.push({ profile: profile.key, test: '移动端-汉堡菜单展开抽屉', pass: false, detail: '视口 390px 下未找到 .mobile-menu-toggle（可能移动端适配未生效）' })
        }
      } catch (e) {
        results.push({ profile: profile.key, test: '移动端-汉堡菜单展开抽屉', pass: false, detail: e.message.split('\n')[0] })
      }
    }
    await ctx.close()
  }
  return results
}

;(async () => {
  const browser = await launchBrowser()
  console.log(`浏览器已启动，共 ${PROFILES.length} 个视口 × ${ROUTES.length} 个路由\n`)

  const report = { generatedAt: new Date().toISOString(), base: BASE, profiles: [], interactions: [] }

  for (const profile of PROFILES) {
    console.log(`===== ${profile.label} =====`)
    const ctx = await browser.newContext({
      viewport: profile.viewport,
      isMobile: profile.isMobile,
      hasTouch: profile.hasTouch,
      userAgent: profile.userAgent,
      deviceScaleFactor: profile.isMobile ? 2 : 1,
    })
    await ctx.addInitScript(([u]) => {
      localStorage.setItem('gzac_token', 'ux-audit-token')
      localStorage.setItem('gzac_user', JSON.stringify(u))
    }, [MOCK_USER])
    const page = await ctx.newPage()

    const pages = []
    for (const route of ROUTES) {
      const shotPath = path.join(SHOT_DIR, `${profile.key}-${route.path.replace(/\//g, '_') || '_root'}.png`)
      const result = await auditPage(page, route, profile, path.basename(shotPath))
      await page.screenshot({ path: shotPath }).catch(() => {})
      pages.push(result)
      const flag = result.issues.length === 0 ? '✓' : `⚠ ${result.issues.map((i) => i.type).join(' | ')}`
      console.log(`  ${result.issues.length === 0 ? '✓' : '⚠'} ${route.name.padEnd(10)} ${result.loadMs}ms  ${flag}`)
    }
    report.profiles.push({ key: profile.key, label: profile.label, pages })
    await ctx.close()
    console.log('')
  }

  report.interactions = await interactionTests(browser)
  for (const r of report.interactions) console.log(`  ${r.pass ? '✓' : '✗'} [${r.profile}] ${r.test}: ${r.detail}`)

  await browser.close()

  fs.writeFileSync(path.join(REPORT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf-8')

  const allIssues = report.profiles.flatMap((p) => p.pages.flatMap((pg) => pg.issues.map((i) => ({ ...i, profile: p.key, page: pg.route }))))
  const bySeverity = {}
  for (const i of allIssues) bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1
  console.log(`\n===== 汇总 =====`)
  console.log(`发现问题: ${allIssues.length} (blocker=${bySeverity.blocker || 0}, critical=${bySeverity.critical || 0}, error=${bySeverity.error || 0}, warning=${bySeverity.warning || 0})`)
  console.log(`报告: ${path.join(REPORT_DIR, 'report.json')}`)
  console.log(`截图: ${SHOT_DIR}`)
})().catch((e) => {
  console.error('走查失败:', e)
  process.exit(1)
})
