# 登录与 JWT 认证实现计划

本 ExecPlan 是活文档。`Progress`、`Surprises & Discoveries`、`Decision Log`、`Outcomes & Retrospective` 四个章节会随实现持续更新。  
本文件按仓库根目录 `.agent-docs/PLANS.md` 约束维护。

## Purpose / Big Picture

目标是让系统支持基础账号密码登录，并通过 JWT 进行后续 token 校验。用户完成登录后可以拿到 token，在受保护页面访问时由前端携带 token，后端校验通过才返回用户信息。密码在后端统一按 SHA256 存储和比对，避免明文密码入库。

## Progress

- [x] (2026-02-08 19:28Z) 完成现状调研：确认 tRPC 路由、context、user 模块和前端路由结构。
- [x] (2026-02-08 19:46Z) 后端新增 auth 模块（login/me）、JWT 签发与校验、`authedProcedure`。
- [x] (2026-02-08 19:46Z) 用户创建/更新逻辑改为 SHA256 密码入库。
- [x] (2026-02-08 19:46Z) 前端新增登录页、token 持久化、路由守卫、请求头自动携带。
- [x] (2026-02-08 19:46Z) 补充基础 e2e 用例并完成 lint 与类型检查。
- [x] (2026-02-08 22:58Z) 已安装 `jsonwebtoken` 后将服务端 JWT 实现从 Node `crypto` 手写逻辑切换为库实现。

## Surprises & Discoveries

- Observation: 在代理沙箱里执行依赖安装会被网络策略拦截，但同一命令在本机终端可正常安装。
  Evidence: 沙箱执行 `pnpm --filter ./server add jsonwebtoken @types/jsonwebtoken` 返回 `ERR_PNPM_META_FETCH_FAIL` / `connect EPERM`；用户本机终端安装成功。

- Observation: 项目 ESLint 配置未覆盖 `.vue` 文件。
  Evidence: 运行 `pnpm exec eslint client/src/App.vue client/src/views/LoginView.vue --fix` 提示 `File ignored because no matching configuration was supplied`。

## Decision Log

- Decision: 新增独立 `auth` 模块而不是把登录逻辑塞进 `user` 模块。
  Rationale: 认证与用户 CRUD 职责分离，后续扩展刷新 token/登出更清晰。
  Date/Author: 2026-02-08 / Codex

- Decision: token 校验在 `createContext` 解析后由 `authedProcedure` 强制。
  Rationale: 允许公共接口在 token 缺失时继续可用，同时保护接口复用统一中间件。
  Date/Author: 2026-02-08 / Codex

- Decision: 在依赖可安装后，JWT 实现改为 `jsonwebtoken`，不再维护手写 HS256 逻辑。
  Rationale: 库实现更稳定且更易维护，减少安全细节出错风险；同时保留 Node `crypto` 仅用于密码 SHA256。
  Date/Author: 2026-02-08 / Codex

- Decision: 登录时兼容旧明文密码并在成功登录后自动迁移为 SHA256。
  Rationale: 避免历史数据因密码存储方式切换导致无法登录。
  Date/Author: 2026-02-08 / Codex

## Outcomes & Retrospective

已完成基础登录链路：后端支持账号密码登录、JWT 签发和 token 校验；前端支持登录页、token 存储、受保护路由跳转。  
额外完成密码存储升级：用户创建/更新写入 SHA256，历史明文账号会在首次成功登录后自动迁移。  
当前缺口是未执行完整 e2e 联调（需要同时拉起前后端与可用数据库）；已补充一个无需后端数据准备的基础路由守卫用例。

## Context and Orientation

后端入口在 `server/src/index.ts`，tRPC 核心在 `server/src/rpc/trpc.ts`、`server/src/rpc/context.ts`、`server/src/rpc/router.ts`。用户数据由 `server/src/modules/user/*` 管理，当前密码是明文写入。  
前端在 `client/src/router/index.ts`、`client/src/utils/trpc.ts`、`client/src/views/*`。目前没有登录页与 token 管理逻辑。  
本次会新增 `server/src/modules/auth/*`，并在前端新增 `client/src/views/LoginView.vue` 与 token 工具文件。JWT 具体签发与校验实现在 `server/src/lib/auth.ts`，由 `jsonwebtoken` 提供。

## Plan of Work

先在服务端引入 JWT 依赖和两个基础库：`SHA256` 哈希工具与 JWT 签发/校验工具。随后实现 `auth.login`（账号密码登录）和 `auth.me`（受保护的当前用户信息）两个接口。`auth.login` 按账号查询用户并比对 SHA256 密码，成功后签发 JWT。  
接着在 `createContext` 读取 `Authorization: Bearer <token>` 并尝试解析 payload，把解析结果放入上下文。在 `trpc.ts` 新增 `authedProcedure`，用于统一拒绝未认证请求。  
然后修改 `user.service.ts`，让 `create` 与 `update` 写入 SHA256 密文。  
前端部分新增 token 存取工具，给 tRPC 客户端加 `Authorization` 头，新增登录页并在路由守卫中对带 `requiresAuth` 的页面进行拦截。最后在导航里增加登录/退出入口并接入 `auth.me` 显示登录态。

## Concrete Steps

在仓库根目录执行：

1. 安装后端依赖：`pnpm --filter ./server add jsonwebtoken @types/jsonwebtoken`
2. 实现服务端认证代码与路由接入。
3. 实现前端登录页、守卫、token 注入。
4. 新增/调整测试。
5. 运行 `pnpm lint`（含 `--fix`）并修复问题。
6. 运行 TypeScript 检查并确保无报错（`pnpm build` 或包级 type-check/tsc）。

## Validation and Acceptance

验收时需满足：

1. 访问 `/login` 输入已有账号密码后可登录成功并跳转。
2. 前端后续请求自动带 `Authorization`。
3. 访问受保护路由时，无 token 会被重定向到登录页。
4. 后端 `auth.me` 在无效 token 时返回未授权，有效 token 时返回当前用户。
5. 新建/更新用户时数据库中的 `password` 为 SHA256 密文而非明文。
6. `pnpm lint` 与类型检查命令全部通过。

## Idempotence and Recovery

代码改动可重复执行；若中途失败，可继续在当前分支补丁修复并重复执行验证命令。  
若依赖安装失败，可重试 `pnpm --filter ./server add jsonwebtoken @types/jsonwebtoken`。  
本次不执行破坏性 git 命令，不回滚用户已有未提交改动。

## Artifacts and Notes

关键执行结果摘要：

1. `pnpm lint`：通过（已自动 `--fix`）。
2. `pnpm --filter ./server build`：通过（`tsc` 无类型错误）。
3. `pnpm --filter ./client build`：通过（`vue-tsc` 与 `vite build` 通过）。

## Interfaces and Dependencies

关键新增接口：

- `auth.login(input: { account: string; password: string }): { token: string; user: User }`
- `auth.me(): User`（需要 JWT）
- `authedProcedure`：tRPC 受保护过程包装器

关键依赖：

- `jsonwebtoken`：JWT HS256 签发与校验
- Node `crypto`：密码 SHA256 哈希

修订说明（2026-02-08）：将文档中“手写 JWT 实现”的上下文更新为“使用 `jsonwebtoken` 实现”，并修正依赖安装命令为 `pnpm --filter ./server add jsonwebtoken @types/jsonwebtoken`，原因是依赖已在本机终端安装成功且服务端逻辑已完成重构。
