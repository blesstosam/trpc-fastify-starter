# 后端事务内避免耗时操作与批量写入规范

## 背景
- 数据库事务会长期占用连接与锁资源。
- 在事务中做耗时操作（解析文件、调用外部服务、逐条写库）非常容易造成连接池耗尽、超时与全局性能抖动。

## MUST 规则
- 事务内只做“已经准备好的数据写入”和必要一致性检查，不做重计算与外部 IO
- 批量导入必须先事务外准备数据：解析、校验、归一化、去重、主外键映射、冲突检测
- 写入时使用批量 API（如 `createMany`），并按批次（chunk）提交短事务
- 禁止在单个长事务中 `for` 循环逐条 `create/update`
- 批次默认串行提交；若并发提交，必须设置并发上限并与连接池容量匹配

## 推荐流程（两阶段）
1. **事务外准备阶段**
   - 解析原始输入（Excel/CSV/API 数据）
   - 进行 fail-fast 校验与标准化
   - 生成最终待写入 DTO，并按固定批次切块
2. **事务内写入阶段**
   - 逐批开启短事务
   - 执行批量写入（必要时附带少量一致性查询）
   - 记录批次级结果，失败可按批次重试

## 代码模板（示意）
```ts
const normalizedRows = await prepareRows(input) // 事务外：解析/校验/归一化
const chunks = chunkArray(normalizedRows, 500)

await prisma.$transaction(async (tx) => {
  for (const rows of chunks) {
    await tx.room.createMany({
      data: rows,
      skipDuplicates: true,
    })
  }
})
```

## 反例（禁止）
```ts
await prisma.$transaction(async (tx) => {
  for (const row of excelRows) {
    const parsed = await heavyNormalize(row) // 耗时逻辑在事务内（错误）
    await tx.room.create({ data: parsed }) // 逐条写入（错误）
  }
})
```
