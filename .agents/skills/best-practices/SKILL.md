---
name: best-practices
description: 使用本仓库开发的最佳实践汇总，前后端都包含，在开发任何任务（代码开发）之前都需要参考该文档，做产品设计不需要参考该文档。
metadata:
  author: blesstosam
  version: "2026.04.06"
---

## 一些常用库的选择
- 处理时间使用`dayjs`
- 生成雪花id使用`@sapphire/snowflake`
- 生成随机唯一字符串使用`nanoid`
- 文件压缩使用`archiver`
- 处理docx文件使用`docx`
- 处理excel文件使用`exceljs`
- 解析csv文件使用`csv-parse`
- 基础UI组件库使用`ant-design-vue`
- 动画库使用`motion-v`，文档地址在`https://motion.dev/docs/vue`


## 前端页面实现强约束（MUST）
- 页面样式实现遵循 Tailwind-first：优先使用 Tailwind utility class，仅在必要场景使用 `<style scoped>`（详见 `references/tailwind-first.md`）
- 如果要使用`ant-design-vue`里的组件，需要显示的引入，如`import { Avatar } from 'ant-design-vue'`
- 完成一个页面页面后，使用 `critique` skill 对刚实现的页面进行一次评估，如果有优化的地方根据优化点修复一版（只做一轮修复）
- 使用Vue3写前端逻辑的流程建议：先使用composables函数写数据逻辑，再写前端模板表达UI，最后组件引入composables函数把数据绑定到模板视图，组件里尽量不要处理业务逻辑

## 后端开发参考
- 开发后端的时候参考 `fastify-best-practices` skill
- 后端接口返回的报错或提示信息使用中文
- 查询数据时优先在数据库层完成筛选/聚合/分组/排序，避免在 JS 里做大规模数据组装和重计算

## 数据库模型设计
- 使用schema.prisma定义数据库模型
- 数据库字段使用下划线命名法，如`created_time`，映射到orm的字段要使用驼峰法，如`createdTime`

## 坚持代码开发的fail-first原则
- 遵循 fail-first（fail-fast）原则：在系统边界完成校验与归一化，在系统内部坚持类型/领域契约
- 输入边界（如 HTTP/tRPC 入参、第三方回调、用户输入）统一校验一次，避免内部层层重复兜底
- 当契约被破坏时要主动抛出异常，交由上层统一决策（返回错误、告警、回滚、降级）
- 禁止“吞错式健壮性”：不要用静默修复掩盖上游错误（例如“参数类型是数组还去判断是否是数组并将非数组处理成数组”）

---

## References

| Topic | Description | Reference |
|-------|-------------|-----------|
| 安装依赖 | 安装依赖遵循的规范 | [install-dep](references/install-dep.md) |
| 图标选择 | 当前端仓库需要使用图标，包含图标库的选择、图标的选择、搜索 | [icon-suggest](references/icon-suggest.md) |
| ant-design-vue 组件库使用 | ant-design-vue 组件库使用规范与决策指引 | [ant-design-vue](references/ant-design-vue.md) |
| 使用 Tailwind-first 原则 | 前端页面样式 Tailwind-first 约束与例外边界 | [tailwind-first](references/tailwind-first.md) |
| 前端组件和逻辑拆分原则 | Vue3 SFC(Single File Component)拆分最佳实践 | [vue-sfc-split](references/vue-sfc-split.md) |
| 后端事务与批量写入、性能优化 | 事务内避免耗时操作、批处理导入与连接池保护规范 | [backend-transaction-batch-write](references/backend-transaction-batch-write.md) |
