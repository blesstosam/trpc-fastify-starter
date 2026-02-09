import { expect, test } from '@playwright/test'

test.setTimeout(60_000)

test('tag manage common operations', async ({ page }) => {
  const suffix = Date.now().toString()
  const initialName = `e2e-tag-${suffix}`
  const updatedName = `${initialName}-updated`
  const initialDescription = 'created by playwright e2e'
  const updatedDescription = 'updated by playwright e2e'

  const nameInput = page.getByPlaceholder('请输入标签名称')
  const descriptionInput = page.getByPlaceholder('可选，最多 255 字符')
  const searchInput = page.getByPlaceholder('按名称或描述搜索')
  const searchButton = page.getByRole('button', { name: '搜索' })

  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'e2e-auth-token')
  })

  await page.goto('/tags')

  await expect(page.getByRole('heading', { name: '标签管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建标签' })).toBeVisible()

  await page.getByRole('button', { name: '新建标签' }).click()
  await expect(page.getByText('标签名称不能为空')).toBeVisible()

  await nameInput.fill(initialName)
  await descriptionInput.fill(initialDescription)
  await page.getByRole('button', { name: '新建标签' }).click()

  await searchInput.fill(initialName)
  await searchButton.click()

  const createdRow = page.locator('tbody tr').filter({ hasText: initialName })
  await expect(createdRow).toHaveCount(1)
  await expect(createdRow).toContainText(initialDescription)

  await createdRow.getByRole('button', { name: '编辑' }).click()
  await expect(page.getByRole('button', { name: '更新标签' })).toBeVisible()

  await nameInput.fill(updatedName)
  await descriptionInput.fill(updatedDescription)
  await page.getByRole('button', { name: '更新标签' }).click()

  await searchInput.fill(updatedName)
  await searchButton.click()

  const updatedRow = page.locator('tbody tr').filter({ hasText: updatedName })
  await expect(updatedRow).toHaveCount(1)
  await expect(updatedRow).toContainText(updatedDescription)

  await updatedRow.getByRole('button', { name: '编辑' }).click()
  await nameInput.fill(`${updatedName}-temp`)
  await descriptionInput.fill(`${updatedDescription}-temp`)
  await page.getByRole('button', { name: '取消' }).click()

  await expect(nameInput).toHaveValue('')
  await expect(descriptionInput).toHaveValue('')
  await expect(page.getByRole('button', { name: '新建标签' })).toBeVisible()

  await Promise.all([
    page.waitForEvent('dialog').then(dialog => dialog.dismiss()),
    updatedRow.getByRole('button', { name: '删除' }).click(),
  ])
  await expect(page.locator('tbody tr').filter({ hasText: updatedName })).toHaveCount(1)

  await Promise.all([
    page.waitForEvent('dialog').then(dialog => dialog.accept()),
    updatedRow.getByRole('button', { name: '删除' }).click(),
  ])
  await expect(page.locator('tbody tr').filter({ hasText: updatedName })).toHaveCount(0)
})
