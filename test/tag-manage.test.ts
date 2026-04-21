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
  await expect(page.getByRole('heading', { name: '标签管理' })).toBeVisible()

  await page.getByRole('button', { name: '新建标签' }).click()
  const editorModal = page.getByRole('dialog', { name: '新建标签' })
  await expect(editorModal).toBeVisible()
  const nameInput = editorModal.getByPlaceholder('请输入标签名称')
  const descriptionInput = editorModal.getByPlaceholder('请输入标签描述（可选）')

  await editorModal.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText('标签名称不能为空')).toBeVisible()

  await nameInput.fill('x'.repeat(31))
  await expect(nameInput).toHaveValue('x'.repeat(30))

  await nameInput.fill(initialName)
  await descriptionInput.fill(initialDescription)
  await editorModal.getByRole('button', { name: /保\s*存/ }).click()

  await expect(page.getByText('标签创建成功')).toBeVisible()

  const searchInput = page.getByPlaceholder('搜索标签名称')
  await searchInput.fill(initialName)
  await page.getByRole('button', { name: /搜\s*索/ }).click()

  const createdRow = page.locator('.ant-table-tbody tr').filter({ hasText: initialName })
  await expect(createdRow).toHaveCount(1)
  await expect(createdRow).toContainText(initialDescription)

  await createdRow.getByRole('button', { name: '编辑' }).click()
  const editModal = page.getByRole('dialog', { name: '编辑标签' })
  await expect(editModal).toBeVisible()
  const editNameInput = editModal.getByPlaceholder('请输入标签名称')
  const editDescriptionInput = editModal.getByPlaceholder('请输入标签描述（可选）')

  await editNameInput.fill(updatedName)
  await editDescriptionInput.fill(updatedDescription)
  await editModal.getByRole('button', { name: /保\s*存/ }).click()

  await expect(page.getByText('标签更新成功')).toBeVisible()

  await searchInput.fill(updatedName)
  await page.getByRole('button', { name: /搜\s*索/ }).click()
  const updatedRow = page.locator('.ant-table-tbody tr').filter({ hasText: updatedName })
  await expect(updatedRow).toHaveCount(1)
  await expect(updatedRow).toContainText(updatedDescription)

  await updatedRow.getByRole('button', { name: '删除' }).click()
  const deleteModal = page.getByRole('dialog', { name: '确认删除' })
  await expect(deleteModal).toBeVisible()

  await deleteModal.getByRole('button', { name: /取\s*消/ }).click()
  await expect(page.getByRole('dialog', { name: '确认删除' })).toHaveCount(0)
  await expect(updatedRow).toHaveCount(1)

  await updatedRow.getByRole('button', { name: '删除' }).click()
  await page.getByRole('dialog', { name: '确认删除' }).getByRole('button', { name: /^删\s*除$/ }).click()

  await expect(page.getByText('标签删除成功')).toBeVisible()
  await expect(page.locator('.ant-table-tbody tr').filter({ hasText: updatedName })).toHaveCount(0)
})
