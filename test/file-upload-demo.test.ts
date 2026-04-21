import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'

test.setTimeout(60_000)

test('file upload demo flow works with file APIs', async ({ page }) => {
  const suffix = Date.now().toString()
  const filename = `e2e-upload-${suffix}.png`

  await page.goto('/login')
  await page.getByPlaceholder('请输入账号').fill('testadmin')
  await page.getByPlaceholder('请输入密码').fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/file-demo')
  await expect(page.getByRole('heading', { name: '图片上传 Demo' })).toBeVisible()

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: filename,
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7n9WcAAAAASUVORK5CYII=', 'base64'),
  })

  await page.getByRole('button', { name: '上传到服务端' }).click()
  await expect(page.getByText('上传成功')).toBeVisible()

  const createdCard = page.locator('.image-item').filter({ hasText: filename }).first()
  await expect(createdCard).toBeVisible()

  await createdCard.getByRole('button', { name: '获取签名链接' }).click()
  await expect(page.getByText('已获取签名链接')).toBeVisible()
  await expect(createdCard.locator('.signed-url')).toContainText('http')
})
