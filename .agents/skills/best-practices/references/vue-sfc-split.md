---
name: vue-sfc-split
description: Vue3 SFC(Single File Component)拆分最佳实践
---

# Vue3 SFC(Single File Component)拆分最佳实践

### 保持组件专注 (Single Responsibility)
> 共识：很多成熟的现代框架（如 Angular）在架构上严禁在组件（视图层）中直接书写复杂的业务逻辑，逻辑必须保存在独立的 Service 或 Hook 中。Vue 3 的 Composition API 正是为此而生，SFC 应该仅仅作为“状态与视图的粘合剂”。

### 拆分触发条件
当一个组件满足以下任意一个条件时，必须进行拆分：

- 职责过多：同时拥有复杂的状态编排逻辑和大量的 UI 渲染代码。
- UI 区域过多：包含 3 个以上的独立 UI 区块（如：表单区、过滤区、列表区、状态栏）。
- 可复用性：模板中出现了重复的结构（如列表项、卡片），或者未来可能被复用。

### 拆分策略

- UI 拆分：将独立的 UI 区块抽离为子组件（Props 进，Events 出）。
- 逻辑拆分：将复杂的状态和副作用抽离为纯 TS 的 Composables（useXxx()）。
