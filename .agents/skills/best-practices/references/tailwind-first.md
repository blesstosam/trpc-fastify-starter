---
name: tailwind-first
description: 前端开发新增页面与重构页面时遵循该规范。
---

# Tailwind-First 页面样式规范

## 目标
- 前端页面样式默认采用 Tailwind utility class 实现（Tailwind-first）。
- 只有在 Tailwind 不适合或会显著降低可维护性时，才使用 `<style scoped>`。

## MUST 规则
- 新增页面与重构页面时，布局、间距、尺寸、颜色、圆角、阴影、字体、响应式断点，优先写在模板 `class` 中。
- 禁止将可直接用 Tailwind 表达的静态样式批量写进 `<style scoped>`。
- 必须优先复用 Ant Design Vue / vben-components 的组件能力，不以自定义样式替代组件语义。

## 允许使用 `<style scoped>` 的场景
- 需要 `:deep(...)` 覆盖第三方组件内部结构（如 ant-design-vue 内部 DOM）。
- 复杂状态选择器难以通过模板类名清晰表达（如多层级联动状态、结构性选择器）。
- 关键帧动画、伪元素、或较复杂视觉效果不适合 utility class 时。
- 少量页面级兜底样式（需保持最小化，并写明原因）。

## 不推荐做法
- 使用大段 BEM/语义类承载纯静态视觉样式，而非直接使用 Tailwind。
- 在 `<style scoped>` 中重复声明颜色、间距、字号等可被 Tailwind token 覆盖的属性。
- 为了“看起来整洁”把大量 utility class 迁回 CSS，导致样式与结构割裂。

## 提交前自检
- 页面主要视觉是否已由 Tailwind class 驱动？
- `<style scoped>` 中是否仍存在可直接替换为 Tailwind 的静态样式？
- 是否存在必须 `:deep` 的覆盖，并且范围足够小？
