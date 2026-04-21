---
name: ant-design-vue
description: 前端开发使用ant-design-vue组件库的时候遵循的规范
---

# ant-design-vue 组件库使用规范

## S - Scope
- Target: `ant-design-vue`（Vue 3 + TypeScript）。
- Focus: 组件选型、主题配置、表单与表格场景、可访问性与性能决策。
- Source policy: 仅使用官方文档，不使用未文档化 API，不依赖内部 DOM 结构或样式类名。

### Default assumptions
- 前端框架：Vue 3 Composition API + `<script setup>`。
- 主题策略：优先 Design Token / ConfigProvider 配置，其次局部样式覆盖。
- 组件引入：按需引入优先，避免全量注册导致包体积膨胀。

### Mandatory rules
- 如果是组件相关的问题，先把组件名映射成官方文档的路由标识 {components}（全部小写、短横线分隔的 kebab-case，例如 TreeSelect -> tree-select，Button -> button），然后按以下顺序请求文档（先中文站点，若没有再用英文站点）：
  - https://antdv.com/components/{components}-cn
  - https://antdv.com/components/{components}
    - Examples: tree-select-cn -> tree-select, button-cn -> button.
- 只使用官方文档中明确提供的组件、属性、事件、插槽和 API。
- 不杜撰组件名、属性名、事件名、插槽名。
- 不依赖 `.ant-*` 内部实现细节；样式调整优先通过 token、组件 props、语义化 class 完成。

## P - Process
1) Classify
- 识别需求类型：基础展示、表单输入、数据展示、反馈、导航、布局。
- 确认场景约束：CSR/SSR、数据规模、是否需要虚拟滚动、是否需要国际化。

2) Request docs
- 先查 overview，再定位到对应组件文档页。
- 涉及多个组件联动（如 Form + Select + Table）时，逐个核对官方 API 后再组合方案。

3) Decide
- 输出最小可行组件组合，并给出替代方案（如果有）。
- 明确状态管理边界：组件内部状态 vs Pinia/页面状态。
- 给出风险与验证点：渲染性能、可访问性、交互一致性。

## O - Output
- 给出 1-3 句决策理由。
- 给出最小实现策略（组件组合、状态管理、主题方案）。
- 给出可执行检查点（a11y/perf/交互回归）。

## Regression checklist
- [ ] 仅使用官方文档存在的 API。
- [ ] 不使用内部 `.ant-*` 选择器耦合样式。
- [ ] 大数据量列表/表格验证渲染性能（分页、虚拟滚动或懒加载策略）。
- [ ] 表单包含校验、错误提示和提交流程的异常分支。
- [ ] 交互反馈完整（loading、empty、error、success）。
