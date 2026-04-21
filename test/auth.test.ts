import { expect, test } from '@playwright/test'

test('redirect to login when not authenticated', async ({ page }) => {
  await page.goto('/tags')

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
})

test('login with account password', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('请输入账号').fill('testadmin')
  await page.getByPlaceholder('请输入密码').fill('123456')
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText('当前用户: testadmin')).toBeVisible()
})
