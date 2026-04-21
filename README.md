# trpc-demo

一个基于 tRPC 的全栈 TypeScript 示例工程，包含 Vue 3 前端与 Fastify 后端，使用 Prisma 访问 MySQL/MariaDB，支持 OpenAPI 文档与 Playwright 端到端测试。

**技术栈**
- 前端: Vue 3, Vite, Pinia, Vue Router, Tailwind CSS
- 后端: Fastify, tRPC, Zod, Prisma
- 数据库: MySQL / MariaDB
- 测试: Playwright

**目录结构**
- `client/` 前端（Vue 3 + Vite）
- `server/` 后端（Fastify + tRPC）
- `server/src/modules/` 领域模块（`tag`、`user`、`sub`）
- `server/src/rpc/` tRPC 路由与上下文
- `server/prisma/` Prisma schema
- `test/` Playwright 端到端测试

**快速开始**
1. 安装依赖

```bash
pnpm install
```

2. 配置服务器环境变量

确保 `server/.env` 文件存在，如果没有需要 `cp server/.env.example server/.env`

3. 配置数据库

在 `server/.env` 中设置数据库连接：

```bash
DATABASE_URL="mysql://user:password@localhost:3306/trpc_demo"
```

4. 生成并迁移数据库

```bash
pnpm --filter ./server db:migrate
pnpm --filter ./server db:generate
```

5. 启动服务

```bash
pnpm dev
```

后端默认端口 `2022`，tRPC 入口为 `http://localhost:2022/rpc`，OpenAPI 文档为 `http://localhost:2022/doc`。前端访问入口为 `http://localhost:5173"`。


**常用脚本**
- `pnpm dev` 启动前后端
- `pnpm build` 构建前后端
- `pnpm start` 启动构建后的前后端
- `pnpm lint` 对 `server/src`、`client/src`、`test` 中 TS 文件做 lint
- `pnpm test:e2e` 运行 Playwright e2e
- `pnpm test-dev` 启动开发环境并运行 e2e

**接口说明**
- tRPC 入口: `http://localhost:2022/rpc`
- OpenAPI 文档: `http://localhost:2022/doc`
- tRPC Router: `server/src/rpc/router.ts`
- Tag 管理页面: `client/src/views/TagManageView.vue`

**认证与密码**
- 密码加密与校验方案见：`docs/auth-password.md`

**测试**
Playwright 默认使用 `PLAYWRIGHT_TEST_BASE_URL`，未设置时为 `http://localhost:5173`。
如需修改测试地址，设置环境变量：

```bash
PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173" pnpm test:e2e
```

**约定**
- 生成产物：`server/src/generated/prisma` 不手动修改
- 代码风格：2 空格缩进，ESM + TypeScript
