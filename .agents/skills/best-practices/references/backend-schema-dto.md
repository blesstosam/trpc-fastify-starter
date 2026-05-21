---
name: backend-schema-dto
description: 当设计或重构后端模块的 Schema / DTO、复用跨模块字段校验、或定义 list/create/update 输入输出契约时遵循该规范。
---

- 业务模块自己的 canonical schema 由该业务模块维护，其他模块只做复用，不要跨模块再手写一份相同字段的 `z.object(...)`
- 业务模块之间复用 DTO 时，优先 `import` 后使用 `pick / omit / extend`
- 真正无业务语义的基础 schema 放在 `server/src/lib/schemas.ts`，例如 `idSchema`、`countOutputSchema`、`createPaginatedListOutputSchema(...)`；有业务语义的 schema 继续放在所属模块
- 一个实体同时存在“轻量输出”和“完整输出”时，优先拆成 `simpleXxxSchema` 和 `xxxSchema` 两层。`simpleXxxSchema` 只保留稳定公共字段，`xxxSchema` 在其上扩展完整详情字段
- `xxxListOutputSchema` 默认使用 `createPaginatedListOutputSchema(itemSchema)` 生成，不再重复手写 `items / total / page / pageSize`
- `createXxxInputSchema` 默认直接手写，显式表达必填字段。不要为了“看起来抽象”额外引入中间 writable schema，除非确实有多个输入 schema 会共享它并能明显降低复杂度
- `updateXxxInputSchema` 默认以 `createXxxInputSchema` 为基底，通过 `omit(...)` 移除只允许创建时出现的字段，再 `partial()` 把剩余字段转为可选，最后 `extend({ id })` 补上更新目标标识
- `createXxxInputSchema` 到 `updateXxxInputSchema` 的派生过程中，要明确识别“只允许创建时写入”的字段，例如不可变业务标识、只在创建端支持的一次性关联字段，不要无脑把所有 create 字段都开放给 update
