import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { chromium } from '/Users/heesohee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { DEMO_APPLICATIONS } from '../app/admin-preview/demo-data'

const qaPort = 3015
const origin = `http://127.0.0.1:${qaPort}`
const token = randomBytes(32).toString('hex')
const apps = structuredClone(DEMO_APPLICATIONS).map((row, i) => ({ ...row, id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, reports: row.reports.map(rep => ({ ...rep, id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, application_id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}` })) }))
let failReads = false
let patches = 0
const db = createServer(async (req, res) => {
  const url = new URL(req.url!, 'http://localhost')
  res.setHeader('Content-Type', 'application/json')
  if (failReads) { res.statusCode = 503; res.end('{"code":"TEST_UNAVAILABLE"}'); return }
  const id = url.searchParams.get('id')?.replace(/^eq\./, '')
  if (url.pathname.endsWith('/applications')) {
    const rows = apps.filter(row => !id || row.id === id)
    if (req.method === 'PATCH') {
      let body = ''; for await (const chunk of req) body += chunk
      const patch = JSON.parse(body)
      console.log('QA mock update', JSON.stringify({ id, status: patch.review_status, matched: rows.map(row => row.id) }))
      assert.deepEqual(Object.keys(patch).sort(), ['internal_note', 'review_status', 'review_updated_at'])
      rows.forEach(row => Object.assign(row, patch)); patches++
    }
    res.end(JSON.stringify(rows)); return
  }
  if (url.pathname.endsWith('/reports')) {
    res.end(JSON.stringify(apps.flatMap(row => row.reports).filter(rep => !id || rep.id === id))); return
  }
  res.end('[]')
})
await new Promise<void>(resolve => db.listen(0, '127.0.0.1', resolve))
const address = db.address() as { port: number }
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(qaPort)], {
  env: { ...process.env, ADMIN_TOKEN: token, SUPABASE_URL: `http://127.0.0.1:${address.port}`, SUPABASE_SERVICE_ROLE_KEY: 'local-mock-only' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let serverLog = ''
server.stdout.on('data', value => { serverLog += value.toString() })
server.stderr.on('data', value => { serverLog += value.toString() })
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
const checks: string[] = []
try {
  for (let n = 0; n < 60; n++) {
    try { const response = await fetch(origin + '/admin/login'); if (response.ok) break } catch {}
    if (n === 59) throw new Error('QA_SERVER_START_FAILED')
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.setDefaultTimeout(10000)
  page.setDefaultNavigationTimeout(10000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:3014/admin-preview')
  await page.getByRole('heading', { name: '추가 확인 신청 관리' }).waitFor()
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 950 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true)
    await page.screenshot({ path: `output/admin-qa/list-${width}.png`, fullPage: true })
  }
  await page.getByRole('searchbox').fill('없는주소')
  await page.getByText('조건에 맞는 신청이 없어요.').waitFor()
  await page.getByRole('button', { name: '필터 초기화' }).click()
  await page.getByRole('searchbox').fill('철거')
  await page.getByRole('checkbox', { name: '사진 있는 신청만' }).check()
  assert.equal(await page.locator('li').count(), 2)
  await page.getByRole('button', { name: /예시 주택 A/ }).click()
  await page.getByRole('combobox', { name: /처리 상태/ }).selectOption('reviewing')
  await page.getByRole('textbox', { name: /내부 메모/ }).fill('검증용 내부 메모 · 실제 신청 아님')
  await page.getByRole('button', { name: '처리 기록 저장' }).click()
  await page.getByText('미리보기에 반영했어요.', { exact: false }).waitFor()
  await page.screenshot({ path: 'output/admin-qa/detail-375.png', fullPage: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true)
  await page.getByRole('button', { name: '신청 목록으로', exact: false }).click()
  await page.getByRole('button', { name: /검토 중.*2.*건/ }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: /검토 중.*1.*건/ }).waitFor()
  console.log('QA step completed')
  checks.push('demo search/filter/detail/workflow/reset; no overflow at 375/768/1440')
  await page.goto(origin + '/admin')
  await page.waitForURL('**/admin/login')
  console.log('QA login page reached')
  assert.equal((await fetch(origin + '/admin/' + apps[0]!.id + '/photos/30000000-0000-4000-8000-000000000001')).status, 404)
  await page.getByLabel('관리자 접근 키').fill('wrong-test-key')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.getByText('접근 키가 일치하지 않습니다.').waitFor()
  await page.getByLabel('관리자 접근 키').fill(token)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.waitForURL(origin + '/admin')
  await page.getByRole('heading', { name: '추가 확인 신청 관리' }).waitFor()
  console.log('QA authenticated dashboard reached')
  const session = (await page.context().cookies()).find(cookie => cookie.name === 'binzip_admin')!
  assert.equal(session.httpOnly, true)
  assert.equal(session.sameSite, 'Lax')
  assert.equal(session.path, '/admin')
  await page.getByRole('link', { name: /예시 주택 A/ }).click()
  await page.waitForURL(origin + '/admin/' + apps[0]!.id)
  await page.getByRole('heading', { name: apps[0]!.address, exact: true }).waitFor()
  console.log('QA authenticated detail reached')
  let captured: { body: string; headers: Record<string,string> } | undefined
  page.on('request', request => {
    if (request.method() === 'POST' && request.headers()['next-action']) captured = { body: request.postData() || '', headers: request.headers() }
  })
  await page.getByRole('combobox', { name: /처리 상태/ }).selectOption('completed')
  await page.getByRole('textbox', { name: /내부 메모/ }).fill('mock-db-private-note')
  assert.equal(await page.getByRole('combobox', { name: /처리 상태/ }).inputValue(), 'completed')
  await page.getByRole('button', { name: '처리 기록 저장' }).click()
  await page.getByText('처리 상태와 내부 메모를 저장했어요.', { exact: false }).waitFor()
  assert.equal(apps[0]!.review_status, 'completed')
  assert.equal(apps[0]!.reports[0]!.status, 'draft')
  await page.reload()
  assert.equal(await page.getByRole('textbox', { name: /내부 메모/ }).inputValue(), 'mock-db-private-note')
  assert.equal(patches, 1)
  assert.ok(captured)
  const unauth = await fetch(origin + '/admin/login', { method: 'POST', headers: { 'Content-Type': captured.headers['content-type']!, 'Next-Action': captured.headers['next-action']!, Origin: origin }, body: captured.body })
  const denied = await unauth.text()
  const protectedPost = await fetch(origin + '/admin/' + apps[0]!.id, { method: 'POST', headers: { 'Content-Type': captured.headers['content-type']!, 'Next-Action': captured.headers['next-action']!, Origin: origin }, body: captured.body })
  assert.equal(protectedPost.status, 404)
  assert.ok(!denied.includes('\"ok\":true'), 'Unauthenticated request must not report success')
  assert.ok(!denied.includes('mock-db-private-note'))
  assert.equal(patches, 1)
  console.log('QA step completed')
  checks.push('mock database login, private cookie, persisted workflow, no report publication, protected POST rejected and anonymous requests cannot mutate')
  await page.goto(origin + '/admin')
  failReads = true
  await page.reload()
  await page.getByRole('heading', { name: '신청 목록을 확인할 수 없어요' }).waitFor()
  failReads = false
  await page.getByRole('button', { name: '로그아웃' }).click()
  await page.waitForURL('**/admin/login')
  console.log('QA login page reached')
  await page.goto(origin + '/admin')
  await page.waitForURL('**/admin/login')
  console.log('QA login page reached')
  assert.equal(errors.length, 0, errors.join('\n'))
  console.log('QA step completed')
  checks.push('data error distinct from empty; logout blocks access; no browser runtime errors')
  await page.goto('http://127.0.0.1:3014/admin')
  await page.waitForURL('**/admin/login')
  console.log('QA login page reached')
  await page.getByText('관리자 접근 설정이 필요해요').waitFor()
  console.log('QA step completed')
  checks.push('unconfigured local admin shows setup instead of pretending there are zero requests')
  await writeFile('output/admin-qa/result.json', JSON.stringify({ passed: checks, realDatabaseTested: false, emailSent: false, errors }, null, 2))
  console.log(JSON.stringify({ passed: checks, realDatabaseTested: false, emailSent: false }, null, 2))
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  db.closeAllConnections()
  await new Promise<void>(resolve => db.close(() => resolve()))
}
