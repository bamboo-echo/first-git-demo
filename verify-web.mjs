import { chromium } from '@playwright/test'

const URL = 'http://localhost:5174/'
const executablePath = 'C:\\Users\\slougo\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console error: ${msg.text()}`)
  })

  async function screenshot(name) {
    await page.screenshot({ path: `verify-${name}.png`, fullPage: false })
  }

  async function getBodyText() {
    return await page.locator('body').innerText()
  }

  function assertContains(text, needle, label) {
    if (!text.includes(needle)) {
      throw new Error(`断言失败 [${label}]: 页面文本不包含 "${needle}"`)
    }
  }

  console.log('1. 打开登录页')
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await screenshot('01-login')
  assertContains(await page.title(), '考点雷达', '页面标题')

  console.log('2. 切换到注册并填写表单')
  await page.click('text=/注册|Register/')
  const email = `demo-${Date.now()}@test.com`
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="text"]', 'DemoUser')
  await page.fill('input[type="password"]', '123456')
  await screenshot('02-register-form')

  console.log('3. 勾选协议并提交注册')
  await page.click('input[type="checkbox"]')
  await page.waitForTimeout(200)
  await page.click('button:has-text("注册并登录")')
  await page.waitForTimeout(1200)
  await screenshot('03-workspace-empty')
  let text = await getBodyText()
  assertContains(text, '还没有课程', '注册后进入工作台')
  assertContains(text, 'DemoUser', '显示当前用户')

  console.log('4. 创建第一个课程')
  await page.click('button:has-text("新建课程")')
  await page.waitForTimeout(1500)
  await screenshot('04-course-created')
  text = await getBodyText()
  console.log('   创建课程后文本:', text.slice(0, 300).replace(/\n/g, ' '))
  assertContains(text, '我的第一个课程', '课程创建成功')
  assertContains(text, '智能分析', '默认显示智能分析页')

  console.log('5. 进入资料管理并快速添加资料')
  await page.click('.nav-tab:has-text("资料")')
  await page.waitForTimeout(800)
  await screenshot('05-materials')
  text = await getBodyText()
  assertContains(text, '资料管理', '已进入资料管理页')
  await page.click('.secondary-button:has-text("历年真题")')
  await page.waitForTimeout(600)
  await screenshot('05b-materials-added')
  text = await getBodyText()
  assertContains(text, '扫描台', '资料列表已更新')

  console.log('6. 进入智能分析')
  await page.click('.nav-tab:has-text("分析结果")')
  await page.waitForTimeout(600)
  await screenshot('06-analysis-before')

  console.log('7. 点击重新分析')
  await page.click('button:has-text("重新分析")', { force: true })
  await page.waitForTimeout(2500)
  await screenshot('07-analysis-after')
  text = await getBodyText()
  assertContains(text, '考点', '分析结果包含考点')

  console.log('8. 进入复习计划并切换版本')
  await page.click('.nav-tab:has-text("复习计划")')
  await page.waitForTimeout(800)
  await screenshot('08-plan')
  text = await getBodyText()
  assertContains(text, '极速版', '计划包含极速版')
  assertContains(text, '标准版', '计划包含标准版')
  assertContains(text, '补充版', '计划包含补充版')

  // 尝试切换计划卡片（如果存在 tab 按钮）
  const stdTab = await page.$('text=/标准版/')
  if (stdTab) {
    await stdTab.click()
    await page.waitForTimeout(400)
    await screenshot('09-plan-standard')
  }

  console.log('9. 进入任务执行并勾选任务')
  await page.click('.nav-tab:has-text("执行")')
  await page.waitForTimeout(800)
  await screenshot('10-execution')
  text = await getBodyText()
  assertContains(text, '任务', '执行页包含任务')

  const firstTask = await page.$('.task-checkbox, input[type="checkbox"]')
  if (firstTask) {
    await firstTask.click()
    await page.waitForTimeout(400)
    await screenshot('11-execution-task-done')
  }

  console.log('10. 进入历史归档')
  await page.click('.nav-tab:has-text("历史")')
  await page.waitForTimeout(800)
  await screenshot('12-history')

  console.log('11. 返回课程设置')
  await page.click('.nav-tab:has-text("课程设置")')
  await page.waitForTimeout(800)
  await screenshot('13-course-settings')
  text = await getBodyText()
  assertContains(text, '考试', '课程设置包含考试信息')

  console.log('\n=== 验证结果 ===')
  console.log('页面标题:', await page.title())
  console.log('JS 错误数:', errors.length)
  errors.forEach((e) => console.log(' -', e))
  if (errors.length > 0) throw new Error('发现 JS 错误')
  console.log('全部核心流程通过 ✅')
  await browser.close()
}

run().catch((err) => {
  console.error('验证失败:', err)
  process.exit(1)
})
