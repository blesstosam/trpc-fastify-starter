# 仓库指南

## 项目结构与模块组织
这是一个 `pnpm` workspace，包含两个包：
- `client/`：Vue 3 + Vite 前端（`src/views`、`src/components`、`src/router`、`src/stores`、`src/utils`）。
- `server/`：Fastify + tRPC 后端（`src/modules/*` 为领域模块，`src/rpc/*` 为路由/上下文，`src/lib/*` 为共享基础设施）。

端到端测试位于 `test/`（Playwright）。Prisma schema 在 `server/prisma/schema.prisma`；生成的 Prisma 客户端代码在 `server/src/generated/prisma`（视为生成产物，不要手改）。

## 构建、测试与开发命令
在仓库根目录执行：
- `pnpm dev`：启动前端开发服务器。
- `pnpm start:dev`：以 watch 模式启动后端。
- `pnpm build`：同时构建 server 和 client。
- `pnpm start`：同时运行构建后的 server 与 client preview。
- `pnpm lint`：对 `server/src`、`client/src`、`test` 中 TS 文件进行 lint 并自动修复。
- `pnpm test:e2e`：运行 Playwright 测试。
- `pnpm test-dev`：启动开发环境并在 `http://localhost:3000` 上运行 e2e。

包级命令示例：`pnpm --filter ./client test:unit`、`pnpm --filter ./server prisma:generate`。

## 代码风格与命名规范
- 缩进：2 空格；行尾 LF（见 `.editorconfig`）。
- 使用 TypeScript 与 ESM 模块。
- 遵循 ESLint（`eslint.config.mjs`，Antfu 预设）；提交前运行 `pnpm lint`。
- 命名：Vue SFC 与组件文件使用 PascalCase（如 `HelloWorld.vue`）；工具/路由/store 模块使用简洁小写命名（如 `trpc.ts`、`index.ts`）。
- 后端按领域分组，放在 `server/src/modules/<domain>/` 下。

## 测试指南
- 前端单元测试：Vitest（`client/src/components/__tests__/*.spec.ts`）。
- 集成/端到端测试：Playwright（`test/*.test.ts`）。
- 建议单元测试使用 `*.spec.ts`，e2e 使用 `*.test.ts`。
- 变更行为时同步补充/调整测试；涉及 API 变更时，尽量同时覆盖服务端路由行为与前端交互流程。

## 提交与 Pull Request 指南
当前历史采用简洁的 Conventional Commit 风格前缀（如 `feat:`、`init`）。建议继续使用：
- `type: 简短祈使句摘要`（示例：`fix: handle empty posts response`）。

## 重要
- 每次修改完代码之后对修改的文件进行 `eslint --fix`，如果还有报错继续修复
- 每次修改完代码之后检查文件是否有typescript类型报错，如果有继续修复直到没有报错为止
- 涉及到数据库变更(schema.prisma变更)的时候，先使用`pnpm --filter ./server db:migrate`生成迁移脚本并迁移到开发数据库
- 当写完一个功能之后（前后端代码都已经写完），你可以在test文件夹里写上该功能的基础测试用例，保证功能是基本可用的
- 使用unplugin-icons渲染图标，安装了@iconify-json/lucide图标库，你可以选择里面的图标进行渲染。示例：`import IconBomb from '~icons/lucide/atom'`

## ExecPlans

当编写复杂功能或进行重大重构时，请使用ExecPlan（如 .agent-docs/PLANS.md 中所述）从设计到实现全过程执行。
