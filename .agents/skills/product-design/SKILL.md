---
name: product-design
description: 用于规范项目文档目录与指导具体文档的编写（包含需求文档、设计文档和原型等）。适用于创建或更新 docs/project.md、docs/modules/<module>/requirements.md、design.md、design-server.md、prototype/*.html、<module>-task.md。
metadata:
  author: weilei
  version: "2026.02.12"
---

## 何时使用

当用户提出以下需求时使用本技能：

- 初始化或重构 `docs/` 文档结构
- 新增模块文档目录
- 编写或更新产品需求/设计文档
- 让 AI 在编码前先沉淀完整上下文与任务拆解

## 目标

在 `docs/` 下建立稳定、可追踪、对 AI 友好的文档资产，确保开发输入完整一致。

## 标准目录（必须遵守）

```txt
docs/
├─ project.md
├─ index-template.html
└─ modules/
   └─ <module-name>/
      ├─ requirements.md
      ├─ design.md
      ├─ design-server.md
      ├─ prototype/
      │  ├─ index.html
      │  └─ *.html
      └─ <module-name>-task.md
```

规则：

1. 模块目录名使用短横线小写，如 `tag-manage`。
2. `<module-name>-task.md` 的 `<module-name>` 必须与目录名一致。
3. 新建原型页面优先从 `docs/index-template.html` 复制后改造。

## 文件编写规范

### `docs/project.md`

- 由用户手动编写
- 只写全局信息：项目目标、范围、里程碑、统一约束。

### `requirements.md`

- 由用户手动编写
- 记录原始需求，不提前替换成技术方案。

### `design.md`

必须按“用户故事 + EARS”编写，用户故事参考`user-story-writing` skill，EARS规范参考`doc-ears` skill

1. 用户故事：`作为<角色>，我希望<能力>，以便<价值>`
2. EARS 需求语句：
   - Ubiquitous: `系统应...`
   - Event-driven: `当<事件>发生时，系统应...`
   - State-driven: `当系统处于<状态>时，系统应...`
   - Optional: `若<条件>，系统应...`
   - Unwanted: `若发生<异常>，系统应...`

### `design-server.md`

- 只写后端总体方案设计。
- 包含：边界、数据流、接口职责、鉴权与错误处理策略。
- 不细化到代码级实现（不写具体函数实现步骤）。

### `prototype/*.html`

- 放在 `prototype/` 目录中。
- 使用 HTML 原型，便于 AI 直接读取结构与文案。
- 默认基于 `docs/index-template.html` 复制。

## 执行流程

1. 若模块不存在，创建 `docs/modules/<module-name>/` 及标准文件。
2. 写 `design.md` 与 `design-server.md`。
3. 按 `index-template.html` 创建/更新 `prototype/*.html`。

## 输出质量检查清单

1. 模块目录是否完整包含 3 类资产（含 `prototype/`）?
2. `design.md` 是否包含用户故事和 EARS？
3. `design-server.md` 是否避免代码实现细节？
4. 原型 HTML 是否位于 `prototype/` 且可直接预览？
