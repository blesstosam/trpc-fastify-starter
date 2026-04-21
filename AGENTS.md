# 仓库指南

## 项目结构与模块组织
- `client/`：Vue 3 + Vite 前端。主代码位于 `client/src`，按功能目录组织（如 `login/`、`tag-manage/`、`upload-demo/`），通用代码放在 `shared/`、`router/`、`stores/`。
- `server/`：Fastify + tRPC 后端。核心代码在 `server/src`，领域模块位于 `server/src/modules/*`，公共基础能力在 `server/src/lib` 与 `server/src/rpc`。
- `test/`：全栈 Playwright 端到端测试。
- `docs/`：产品与设计文档。
- 生成/构建产物（`server/dist`、`client/dist`、`server/src/generated`）禁止手动修改。

## 构建、测试与开发命令
- `pnpm install`：安装工作区依赖。
- `pnpm dev`：同时以 watch 模式启动前后端。
- `pnpm dev:client` / `pnpm dev:server`：仅启动单侧应用。
- `pnpm build`：构建后端与前端。
- `pnpm start`：运行构建后的服务端与前端预览。
- `pnpm lint`：对 `server/src`、`client/src`、`test` 执行 ESLint 并自动修复。
- `pnpm test:e2e`：运行 `test/` 下 Playwright 测试。
- `pnpm --filter ./server test:e2e`：运行 `server/test` 下 Vitest 集成测试。

## 代码风格与命名约定
- 使用 TypeScript + ESM，2 空格缩进，UTF-8 编码，LF 换行（见 `.editorconfig`）。
- JS/TS 优先使用单引号；JSON 使用双引号。
- 命名遵循现有模式：
  - Vue 组件/页面使用 PascalCase（如 `LoginView.vue`）。
  - 功能目录使用 kebab-case（如 `tag-manage`）。
  - 后端按领域分组，放在 `server/src/modules/<domain>/` 下。
- Lint 配置基于 `eslint.config.mjs` 中的 `@antfu/eslint-config`。

## 测试指南
- E2E：`test/*.test.ts`，使用 Playwright（`@playwright/test`）。
- 后端集成测试：`server/test/*.test.ts`，使用 Vitest。
- 测试名称应聚焦行为描述（如“未登录时跳转到登录页”）。
- 提交 PR 前请运行相关测试；当前仓库未强制覆盖率阈值。

- 前端单元测试：Vitest（`client/src/components/__tests__/*.spec.ts`）。
- 集成/端到端测试：Playwright（`test/*.test.ts`）。
- 建议单元测试使用 `*.spec.ts`，e2e 使用 `*.test.ts`。
- 变更行为时同步补充/调整测试；涉及 API 变更时，尽量同时覆盖服务端路由行为与前端交互流程。
- 运行单个后端 e2e 测试文件示例：`pnpm --filter ./server test:e2e test/auth.test.ts`（注意：`test:e2e` 后不要再加 `--`）。
- 运行单个前端 e2e 测试文件示例：`pnpm test:e2e test/auth.test.ts`。

## 提交与 Pull Request 规范
- 提交信息遵循历史中的 Conventional Commits：`feat:`、`fix:`、`refactor:`、`chore:`
- PR 至少应包含：变更目的、关联 issue/任务、测试证据（如 `pnpm lint` 与相关测试命令输出）、以及前端改动对应的截图或录屏。

## 安全与配置建议
- 敏感信息仅存放在本地环境文件（`server/.env`、`.env.test.local`、`.env.prod.local`），禁止提交凭据。

## 重要：环境与工作流说明
- 你在开发的时候，我已经手动把后端和前端服务起好了，后端服务地址为`http://localhost:2022/`，前端服务地址为`http://localhost:5173/`
- 当开发的功能同时包含前后端的时候，流程如下：
  - 开发好后端接口，并在`./server/test`里写好接口的e2e测试，写e2e测试脚本的时候要分模块，一个模块一个测试文件，要包含模块所有接口（接口即trpc的api router）
  - 根据给出的原型图实现前端功能，但是UI风格要使用现成的组件库来实现
  - 使用`trpc/client`调用后端接口
  - 在`./test`文件夹里写上该功能的完整e2e测试用例，保证功能是可用的
- 如果有后端代码开发和改动，需要在`./server/test`里添加完整的接口测试，并重新跑一次测试保证改动是正确的
- 如果有前端代码开发和改动，需要在`./test`里添加完整的e2e测试，并重新跑一次测试保证改动是正确的
- 每次修改完代码之后对修改的文件进行 `pnpm eslint --fix ${filepath}`，如果还有报错继续修复
- 每次修改完代码之后检查文件是否有typescript类型报错，如果有继续修复直到没有报错为止
- 涉及到数据库变更(schema.prisma变更)的时候，使用`pnpm --filter ./server db:migrate`生成迁移脚本并迁移到开发数据库

## ExecPlans

当编写复杂功能或进行重大重构时，请使用ExecPlan（如 docs/PLANS.md 中所述）从设计到实现全过程执行。
