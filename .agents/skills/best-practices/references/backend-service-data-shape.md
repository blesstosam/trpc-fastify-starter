---
name: backend-service-data-shape
description: 当设计或重构后端 service 层的 Prisma 查询参数、serializer、create/update data 形状时遵循该规范。目标：消除字段清单的重复维护、把归一化交给边界层。
---

## 核心原则

字段清单只在一个地方维护：**Prisma schema 是单一事实源**，service 层不要再列字段。Zod schema 负责边界归一化（trim/min/enum），Prisma schema 负责 DB 层默认值与空安全语义，service 层只做编排。

## P1. Serializer 入参类型从 Prisma args 推导

禁止手写 `xxxSelect` 字段清单 + 手写 serializer 入参类型，二者必然漂移。

```ts
// 反面：字段清单维护三处（select、serializer 参数类型、serializer body）
const studentSelect = { id: true, name: true, /* 17 行 */ } as const
function serialize(s: { id: bigint, name: string, /* 17 行重复 */ }) { ... }

// 正面
const studentArgs = {
  include: {
    teacherStudentRelations: { /* 关系字段精挑 */ },
  },
} satisfies Prisma.StudentDefaultArgs

function serialize(s: Prisma.StudentGetPayload<typeof studentArgs>) { ... }
```

要点：
- 优先用 `include`（不写 `select`）让 scalar 字段自动全选；只有关系字段需要精挑时才嵌套 `select`
- `satisfies Prisma.XxxDefaultArgs` 保证形状正确同时保留字面量类型供 `GetPayload` 推导
- 仅当确实要剔除字段（如 FK `userId`）才加 `omit: { ... }`；若 tRPC `.output(schema)` 已经在出口层 strip 多余字段，则不必再加 `omit`

参考实现：`server/src/modules/student/student.service.ts`

## P2. Serializer body 用逐字段映射，显式收口

Response 是 API 出口边界，必须**显式白名单**。P1 用 `include` 把全表 scalar 拉下来便于 TS 推导入参类型，但 serializer 出口必须逐字段列举——避免 schema 后续加敏感字段（如 `password`、内部状态列）或大字段被 `...rest` 自动透传到 API。

```ts
// 反面：rest spread 透传，DB 查询范围一旦扩大，新字段会自动流到 API（默认开放，存在泄漏风险）
const { id, teacherStudentRelations, ...rest } = s
return {
  ...rest,
  id: id.toString(),
  counselors: teacherStudentRelations.map(/* 计算字段 */),
}

// 正面：逐字段映射，显式列举所有出口字段
return {
  id: s.id.toString(),
  name: s.name,
  /* 其他字段逐一列出 */
  counselors: s.teacherStudentRelations.map(/* 计算字段 */),
}
```

要点：
- **默认拒绝、显式放行**：DB 查询范围可能很宽（P1 的 `include` 会拉全表 scalar），serializer 是统一的收口点，schema 加字段不会意外暴露到 API
- 类型变形（`bigint → string`、Date 序列化等）在映射点统一处理
- 关系字段映射成业务对象（如 `counselors`）
- schema 加新字段需要 serializer 同步更新一次——这是合理的「边界」成本，换出口安全
- 配合 P1 的 `Prisma.XxxGetPayload` 入参类型：TS 提示哪些字段可用，是否写出去由 serializer 显式决定
- 与 P4 input spread 的方向相反：input 由 Prisma 的 `XxxCreateInput`/`XxxUpdateInput` type-check 把关（多字段 TS 报错），response 没有等价机制，必须由 serializer 白名单把关

## P3. 移除 service 层冗余清洗

边界归一化只做一次。如果 Zod / Prisma 已经做了，service 层就别重复。

| 写法 | 是否冗余 | 原因 |
|---|---|---|
| `input.name.trim()` | ✅ 删除 | `dto.ts` 的 `z.string().trim()` 已经在 tRPC 入口处 trim 过 |
| `input.academy ?? null` | ✅ 删除 | Prisma 对可空列接受 `undefined`，行为等价 null |
| `input.isInternational ?? false` | ✅ 删除 | Prisma schema 有 `@default(false)` 时由 DB 兜底 |
| `updatedAt: new Date()` | ✅ 删除 | Prisma schema 字段加 `@updatedAt` 后由 client 自动填 |

例外保留场景：
- 多个 update/create 操作需要**同一个时间戳**（批量审计语义）→ 显式 `const now = new Date()` 并传 `updatedAt: now`（`@updatedAt` 允许 override）
- update 操作只为「touch 更新时间」、`data` 没有其他字段 → 显式写 `updatedAt: new Date()` 避免 `data: {}` 退化

## P4. Create/Update data 用 rest spread 替代字段列举

利用 Prisma 的 `undefined` 语义：`create` 时走 schema 默认值，`update` 时不更新该字段——天然匹配 `.partial()` 派生的 update input。

```ts
// 反面：逐字段列举，每加字段三处同步
prisma.student.create({
  data: {
    id: nextSnowflakeId(),
    name: input.name,
    degree: input.degree,
    /* 17 行 */
  },
})

// 正面：rest 解构挑出非 DB 字段，剩余直接 spread
const { counselorIds, ...data } = input
prisma.student.create({
  data: {
    ...data,
    id: nextSnowflakeId(),
    teacherStudentRelations: counselorRelationsCreate(counselorIds),
  },
})

// update 同理
const { id, ...data } = input
prisma.student.update({ where: { id }, data })
```

要点：
- input schema 字段命名必须与 Prisma 模型列名一致（这是前提）
- 非 DB 字段（如建立关系用的 `counselorIds`、用于 `where` 的 `id`）通过解构挑出来单独处理
- 类型安全由 Prisma 的 `XxxCreateInput`/`XxxUpdateInput` 把关：input 多了字段会 TS 报错

## P5. 区分实体自有视图与嵌入引用投影

P1-P4 的 `include + GetPayload + serializer 白名单` 模式只适合**实体自有模块的 API**（如 `user.list/get` 返回 User）。当实体被**嵌入到其他聚合的响应**里时（如 `allocationResult.list` 每行的 `student` 摘要、`team.members`），应当反过来：用窄 `select` + 局部 serializer。

### 模式对比

|  | 自有视图（本模块 API） | 嵌入引用投影（被嵌入到其他聚合） |
|---|---|---|
| 例子 | `user.get` 返回完整 User | allocation result 里每行的 `student` 摘要 |
| 查询写法 | `include: { mainJob: true, ... }` 整行+关系 | `select: { id, studentNo, name }` 仅需字段 |
| 入参类型 | `Prisma.XxxGetPayload<typeof args>` | `Pick<...>` 或独立窄类型 |
| 字段收口位置 | Serializer 白名单（schema → API） | DB 层就已收窄 |
| 适合场景 | 低频端点、字段稳定 | 高频列表、分页 × 嵌套、字段最小化 |
| 字段泄漏风险 | 中（依赖 serializer 完整性） | 低（DB 没查就不存在） |

### 何时用哪种模式

适合用 `include` + serializer 收口：
- 核心域实体（User / Organization / Role），列数不多（≤20 列）
- 低频端点：详情页、登录返回、admin 后台
- 同实体多个视图层级（如 identity → withJob → detail）共享同一份底层数据

应改用窄 `select`：
- 高频列表 × 嵌套：如 allocation result 一次几百行嵌 student/dormitory/building，整行 include 让查询规模 N 倍放大
- 多层嵌套 `include: { a: { include: { b: ... } } }`，每层全拉叠起来开销可观
- 表带 BLOB / 大 JSON 列（`config: Json`、`payload: Bytes`），多一列字节数飙升
- 嵌入到其他聚合的引用投影（字段集应由消费聚合决定，不被"完整视图"绑架）

### 嵌入引用投影的抽象方式

同一 brief 形状在 **3+ 处**复用时，抽 select 常量 + serializer 函数对：

```ts
// student/dtos/student-identity.dto.ts
export const studentIdentitySelect = {
  id: true,
  studentNo: true,
  name: true,
} as const satisfies Prisma.StudentSelect

export type StudentIdentity = Prisma.StudentGetPayload<{ select: typeof studentIdentitySelect }>

export function serializeStudentIdentity(row: StudentIdentity) {
  return { id: row.id.toString(), studentNo: row.studentNo, name: row.name }
}
```

要点：
- 命名区分两类：自有视图叫 `xxxArgs`；引用投影叫 `xxxIdentitySelect` / `xxxBriefSelect`
- 引用投影**只放 scalar 字段**；嵌套关系（如 `building.campus`）让消费方在外层 select 里按需加，避免隐藏 join
- 字段差异小（1-3 列）按**最大集收敛**共用一个 brief；差异大（3 vs 11 字段）分两个 brief，不要硬合
- 同实体可以有多个层级的 brief（如 `studentIdentitySelect` 3 字段 + `accommodationStudentSelect` 11 字段），命名清晰即可

### 何时在外层 serializer 里复用内层实体的 serializer

如果想在外层 serializer 里调嵌套实体自己的 serializer（如 student 的 `counselors` 字段调 `serializeSimpleUser`），仅当**全部满足**才适合：
1. 嵌入位置真的需要那个完整视图，不只要 id+name
2. 外层 select 已包含内层 serializer 所需的**全部字段**，没有新增的隐藏 join 成本
3. 输出契约一致（id 语义相同、字段集相同、无场景特化的 fallback 逻辑）

多数"嵌入引用"是 brief 投影，**不**满足以上条件。例如 counselor 本质是 teacher 视图（`id` 用 `teacher.id`、有 fallback 到 `teacher.name / workId`），不是 user 视图，不应套用 `serializeSimpleUser`。

## 适用与不适用

**适用**：
- 标准 CRUD service（list/get/create/update/delete）
- input schema 字段与 DB 列基本 1:1 的模块

**不适用**：
- 输入/输出与 DB 模型差距大的模块（如 `dormitory-allocation/*`、`room-selection/*`，输出是状态机视图而非实体）
- 仓储层（`repository/*.ts`）通常已经在做这件事
- 跨多表聚合输出的接口（如 dashboard、统计类）


## 参考

- DTO 侧约定：[backend-schema-dto](./backend-schema-dto.md)
