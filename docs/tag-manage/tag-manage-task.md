# Tag 管理模块重写 ExecPlan

本 ExecPlan 是活文档。`Progress`、`Surprises & Discoveries`、`Decision Log`、`Outcomes & Retrospective` 四个章节必须随着工作推进持续更新。

本文件按仓库根目录 `docs/PLANS.md` 维护。

## Purpose / Big Picture

目标是把现有 Tag 管理模块按 `docs/tag-manage/design.md` 与 `docs/tag-manage/prototype/index.html` 重写，保证用户在 `/tags` 页面看到与原型一致的 UI，并能完整完成 Tag 的增删改查。完成后用户应能在一个页面中进行查询、新建、编辑、删除，且错误提示与交互状态符合设计文档。

## Progress

- [x] (2026-02-12 18:06) 完成现状扫描：已定位后端 tag 路由、服务、DTO、前端页面与现有 e2e 测试。
- [x] (2026-02-12 18:12) 重写后端 tag DTO/Service/Router，使其符合设计文档字段与错误语义。
- [x] (2026-02-12 18:16) 重写 `client/src/views/TagManageView.vue`，按原型 1:1 还原 UI 与交互。
- [x] (2026-02-12 18:20) 重写 `test/tag-manage.test.ts`，覆盖完整 CRUD 流程与关键失败场景。
- [x] (2026-02-12 18:23) 对改动文件执行 eslint 修复并做 TypeScript 类型检查。
- [x] (2026-02-12 18:25) 运行 e2e 测试验证功能可用。

## Surprises & Discoveries

- Observation: 现有 Tag 管理页面为“表单 + 表格 + 分页”布局，与原型视觉和交互差异很大。
  Evidence: `client/src/views/TagManageView.vue` 当前包含分页控件、内联编辑表单，不是弹窗式交互。
- Observation: Playwright 在 sandbox 环境无法启动 Chrome，需要提权后运行。
  Evidence: 首次 `pnpm test:e2e -- test/tag-manage.test.ts` 返回 crashpad 权限错误。
- Observation: 前端输入框 `maxlength=30` 会在浏览器侧截断输入，无法触发“超长名称”字段报错。
  Evidence: e2e 中填充 31 字符后实际值被截断为 30 字符。

## Decision Log

- Decision: 采用“重写”而非局部改造当前 `TagManageView.vue`。
  Rationale: 当前结构与原型差异过大，局部改造成本高且难保证 1:1 一致。
  Date/Author: 2026-02-12 / Codex
- Decision: 将 tag 路由统一切换为 `authedProcedure`。
  Rationale: 设计文档要求写操作需要登录，且 `/tags` 页面本身是鉴权页面，后端加鉴权可避免绕过前端直接调用。
  Date/Author: 2026-02-12 / Codex
- Decision: 列表接口去掉分页参数，改为关键字过滤 + 全量返回。
  Rationale: 原型无分页交互，页面展示总数和单表格列表，去分页可与原型一致并减少前端状态复杂度。
  Date/Author: 2026-02-12 / Codex

## Outcomes & Retrospective

已完成 Tag 模块后端、前端和 e2e 的重写，页面结构、文案、颜色和弹窗交互与 `docs/tag-manage/prototype/index.html` 对齐。后端新增了名称唯一性冲突处理与中文业务错误语义，前端新增了字段级校验与全局反馈提示。测试层验证了从登录到 CRUD 再到删除确认的完整路径，能够覆盖本轮改造的关键行为。

## Context and Orientation

Tag 模块位于 `server/src/modules/tag/`，由 `server/src/rpc/router.ts` 下的 `tags` 子路由对外提供接口。前端入口是 `client/src/views/TagManageView.vue`，通过 `client/src/utils/trpc.ts` 调用后端。端到端测试在 `test/tag-manage.test.ts`。当前模块已具备 CRUD 能力，但 DTO 字段约束、错误语义、页面结构和交互均与设计文档不一致。

## Plan of Work

先改后端：更新 `dto.ts` 字段长度规则与输入结构，重写 `tag.service.ts` 增加名称唯一性与不存在数据错误语义，调整 `tag.router.ts` 的过程映射。后改前端：完全按原型重排 DOM、样式变量、弹窗结构和按钮文案，并用 tRPC 完成列表加载、搜索过滤、新建、编辑、删除及提示。最后重写 e2e：按新页面控件和文本验证 CRUD 全流程，包含删除确认与错误/空态关键路径。

## Concrete Steps

在仓库根目录执行以下命令：

1. `pnpm eslint --fix <changed-files>`
2. `pnpm --filter ./client exec vue-tsc --noEmit`
3. `pnpm --filter ./server exec tsc --noEmit`
4. `pnpm test:e2e -- test/tag-manage.test.ts`

## Validation and Acceptance

验收方式：

1. 打开 `http://localhost:5173/tags`，页面应与 `docs/tag-manage/prototype/index.html` 在结构与文案一致。
2. 在页面完成新建、搜索、编辑、删除操作，均能成功并更新列表。
3. 输入非法名称（空、超长）能看到字段级错误提示。
4. 运行 `test/tag-manage.test.ts` 全部通过。

## Idempotence and Recovery

改动以增量重写为主，可重复执行 lint 与类型检查命令。若某一步失败，可修复后重复执行对应命令，不需要额外清理。未执行破坏性命令。

## Artifacts and Notes

关键命令执行摘要：

    pnpm eslint --fix server/src/modules/tag/dto.ts server/src/modules/tag/tag.service.ts server/src/modules/tag/tag.router.ts client/src/views/TagManageView.vue test/tag-manage.test.ts
    => 通过

    pnpm --filter ./client exec vue-tsc --noEmit
    => 通过

    pnpm --filter ./server exec tsc --noEmit
    => 通过

    pnpm test:e2e -- test/tag-manage.test.ts
    => 1 passed

## Interfaces and Dependencies

后端保持 `tags` 路由命名不变，接口包括：`tags.list`、`tags.create`、`tags.update`、`tags.remove`。前端继续使用 `trpc` 客户端，不新增第三方依赖。重写后应保留 TypeScript 类型推导链路（DTO -> Router -> Client）。

---

Revision Note (2026-02-12): 首次创建 ExecPlan，明确重写范围、执行顺序与验收标准。
Revision Note (2026-02-12): 根据实际实现进度更新 Progress/Decision/Outcome，并补充验证证据。
