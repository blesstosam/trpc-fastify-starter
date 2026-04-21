---
name: product-design
description: 用于规范项目文档目录与指导具体文档的编写（包含需求文档、设计文档和原型等）。适用于创建或更新 docs/project.md、docs/modules/<module>/requirements.md、design.md、design-server.md、prototype/*.html、docs/execplans/<module>-task.md。
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
├─ reference-images/ (optional)
│  └─ *.{png,jpg,jpeg,webp,svg}
├─ execplans/
│  └─ <module-name>-task.md
└─ modules/
   └─ <module-name>/
      ├─ requirements.md
      ├─ design.md
      ├─ design-server.md
      ├─ prototype/
      │  ├─ index.html
      │  └─ *.html
```

规则：

1. 模块目录名使用短横线小写，如 `tag-manage`
2. `<module-name>-task.md` 统一放在 `docs/execplans/`，且 `<module-name>` 必须与模块目录名一致
3. 新建原型页面优先从 `docs/index-template.html` 复制后改造
4. `docs/reference-images/` 为可选目录，由用户手动放置参考图片；可先浏览这些图片提取可借鉴点（如信息层级、布局节奏、视觉风格），仅作为参考，最终方案仍以需求和设计判断为准

## 文件编写规范

### `docs/project.md`

- 由AI和用户手动共同协作完成
- 只写全局信息：项目目标、范围、里程碑、统一约束

### `requirements.md`

- 由AI和用户手动共同协作完成
- 记录原始需求，不提前替换成技术方案

### `design.md`

需求文档，必须按“用户故事 + EARS”编写，用户故事参考`user-story-writing` skill，EARS规范参考`doc-ears` skill

1. 用户故事：`作为<角色>，我希望<能力>，以便<价值>`
2. EARS 需求语句：
   - Ubiquitous: `系统应...`
   - Event-driven: `当<事件>发生时，系统应...`
   - State-driven: `当系统处于<状态>时，系统应...`
   - Optional: `若<条件>，系统应...`
   - Unwanted: `若发生<异常>，系统应...`

### `design-server.md`

- 只写后端总体方案设计
- 包含：数据模型、核心算法、数据流、接口职责、鉴权与错误处理策略
- 不细化到代码级实现（不写具体函数实现步骤）

### `index-template.html`

- 使用tailwindcss来写UI样式
- 使用lucide图标库来渲染图标，你可以搜索`https://icon-sets.iconify.design/?query=${xx}`来找到合适的图标
- 使用ant design样式风格，优先保证功能和交互的正确性和合理性，UI样式在编写前端代码的时候会优化


### `prototype/*.html`

- 放在 `prototype/` 目录中
- 使用 HTML 原型，便于 AI 直接读取结构与文案
- 默认基于 `docs/index-template.html` 复制
- 复杂功能禁止单页面堆叠，必须按“页面结构规划”拆分为多个页面（见下方“复杂功能页面拆分规则”）

## 复杂功能页面拆分规则

当模块满足以下任一条件时，禁止只做单页面原型，必须拆分为多个 `prototype/*.html` 页面：

1. 存在 2 条及以上核心任务流（如“列表浏览”和“配置管理”）
2. 单页面将包含 3 个及以上独立信息区块或复杂交互区域

### 先产出信息架构，再产出页面

在生成 HTML 前，必须先在 `design.md` 增加“页面结构规划”小节，包含：

- 页面清单（Page List）：页面名、目标用户、核心任务、入口、出口
- 页面关系（Flow Map）：页面跳转关系
- 页面职责：每页只承载一个主目标，不混放多个复杂功能

### 质量门禁（不满足则返工）

1. 是否存在“超级页面”（单页承担多个主任务）？若是，必须继续拆分？
2. 每个页面是否只有一个主目标与清晰 CTA？
3. 是否可从 `prototype/index.html` 到达所有页面？
4. 页面命名与文件名是否语义化且一致？

## 复杂模块细节交付规则

复杂模块的原型必须一次性交付到“可执行交互”粒度，不允许只做页面骨架。对于需求中出现的核心操作，必须在原型中完整体现对应交互细节（含触发入口、操作过程、结果反馈）。

### 必做细节（至少覆盖）

1. 新增/编辑流程必须实现完整弹窗或独立表单页（不可只放按钮无后续交互）
2. 表单项必须包含：字段标签、必填标记、占位提示、默认值/回填规则
3. 必须体现表单校验与错误提示（如必填、格式、长度、边界条件）
4. 必须体现提交中的状态（loading/禁用）与提交结果反馈（成功提示、失败提示）
5. 必须体现取消、关闭、二次确认（对高风险操作）与数据未保存提示（如适用）
6. 列表页必须体现与新增/编辑结果的联动（新增后可见、编辑后更新）
7. 删除、启停、发布等危险或状态切换操作必须体现确认流程与结果反馈

### 反模式（出现即返工）

1. 只有静态页面框架，没有新增/编辑弹窗或表单交
2. 只有“保存”按钮，没有校验、错误、成功反馈设计
3. 仅描述“此处后续实现”，未在原型中给出具体交互形态

## 执行流程

1. 每次设计新模块和对老模块进行重构的时候，先看一下 `project.md` 写的总体目标，注意不要偏离主体目标
2. 若存在 `docs/reference-images/` 且包含图片，可先浏览这些图片提取可借鉴点（如信息层级、布局节奏、视觉风格），仅作为参考，最终方案仍以需求和设计判断为准
3. 若模块不存在，创建 `docs/modules/<module-name>/` 及标准文件
4. 先在 `design.md` 中完成“页面结构规划”（页面清单、页面关系、页面职责），复杂功能按规则拆分页面
5. 写 `design.md` 与 `design-server.md`
6. 在 `design.md` 增加“关键交互清单”（新增、编辑、删除、状态变更、筛选、分页等）并标注每项对应页面/弹窗
7. 按 `index-template.html` 创建/更新 `prototype/*.html`，并确保可从 `prototype/index.html` 访问所有子页面
8. 逐项核对“关键交互清单”，确保原型已实现到可执行交互粒度，而非仅框架示意
9. 任何对`design.md`、`design-server.md`或HTML原型图的修改都要互相同步，保证3者的一致

## 输出质量检查清单

1. 模块目录是否完整包含 3 类资产（含 `prototype/`）?
2. `design.md` 是否包含用户故事和 EARS？
3. `design-server.md` 是否避免代码实现细节？
4. 原型 HTML 是否位于 `prototype/` 且可直接预览？
5. 对复杂模块，是否先完成“页面结构规划”，并拆分为多页面 HTML，而非单页堆叠？
6. `design.md` 是否包含“关键交互清单”，且每项都有对应页面或弹窗落地？
7. 新增/编辑/删除/状态变更等核心操作是否提供了完整交互（入口、表单、校验、反馈）而非仅按钮或占位？


## 前端设计规范

使用 `frontend-design` skill 来遵循设计原则并避免反模式。

---

## References

| Topic | Description | Reference |
|-------|-------------|-----------|
| EARS需求语法 | 在 design.md 中编写 EARS 需求语句时参考 | [doc-ears](references/doc-ears.md) |
| 用户故事写作 | 在 design.md 中编写用户故事与验收标准时参考 | [user-story-writing](references/user-story-writing.md) |
| TailwindCSS最佳实践 | 在原型或前端开发中编写 TailwindCSS 类名时的约束与建议 | [tailwindcss-best-practices](references/tailwindcss-best-practices.md) |
