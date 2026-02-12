import { expect, test } from '@playwright/test'

test.setTimeout(60_000)

test('tag manage CRUD with prototype interaction', async ({ page }) => {
  const suffix = Date.now().toString()
  const initialName = `e2e-tag-${suffix}`
  const updatedName = `${initialName}-updated`
  const initialDescription = 'created by playwright e2e'
  const updatedDescription = 'updated by playwright e2e'

  await page.goto('/login')
  await page.getByPlaceholder('请输入账号').fill('testadmin')
  await page.getByPlaceholder('请输入密码').fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/tags')
  await expect(page.getByRole('heading', { name: 'Tag 管理' })).toBeVisible()

  await page.getByRole('button', { name: '新建 Tag' }).click()
  const editorModal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: '新建 Tag' }) })
  await expect(editorModal).toBeVisible()
  const nameInput = editorModal.getByRole('textbox').first()
  const descriptionInput = editorModal.getByRole('textbox').nth(1)

  await editorModal.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('Tag 名称不能为空')).toBeVisible()

  await nameInput.fill('x'.repeat(31))
  await expect(nameInput).toHaveValue('x'.repeat(30))

  await nameInput.fill(initialName)
  await descriptionInput.fill(initialDescription)
  await editorModal.getByRole('button', { name: '保存' }).click()

  await expect(page.getByText('Tag 创建成功')).toBeVisible()

  const searchInput = page.getByPlaceholder('搜索 Tag 名称...')
  await searchInput.fill(initialName)

  const createdRow = page.locator('tbody tr').filter({ hasText: initialName })
  await expect(createdRow).toHaveCount(1)
  await expect(createdRow).toContainText(initialDescription)

  await createdRow.getByRole('button', { name: '编辑' }).click()
  const editModal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: '编辑 Tag' }) })
  await expect(editModal).toBeVisible()
  const editNameInput = editModal.getByRole('textbox').first()
  const editDescriptionInput = editModal.getByRole('textbox').nth(1)

  await editNameInput.fill(updatedName)
  await editDescriptionInput.fill(updatedDescription)
  await editModal.getByRole('button', { name: '保存' }).click()

  await expect(page.getByText('Tag 更新成功')).toBeVisible()

  await searchInput.fill(updatedName)
  const updatedRow = page.locator('tbody tr').filter({ hasText: updatedName })
  await expect(updatedRow).toHaveCount(1)
  await expect(updatedRow).toContainText(updatedDescription)

  await updatedRow.getByRole('button', { name: '删除' }).click()
  await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible()

  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.getByRole('heading', { name: '确认删除' })).toHaveCount(0)
  await expect(updatedRow).toHaveCount(1)

  await updatedRow.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '确认删除' }).click()

  await expect(page.getByText('Tag 删除成功')).toBeVisible()
  await expect(page.locator('tbody tr').filter({ hasText: updatedName })).toHaveCount(0)
})
