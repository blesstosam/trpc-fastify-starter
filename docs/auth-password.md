# 认证密码加密与校验（Argon2id）

本文档说明当前后端密码存储与登录校验的实现方式（已从 `bcrypt` 切换到 `Argon2id`）。

## 当前方案

- 密码加密算法：`Argon2id`
- 依赖库：`@node-rs/argon2`
- 存储方式：数据库仅存储 `argon2` 哈希串，不存储明文，不使用 `sha256` 直哈

实现位置：
- 密码加密：`server/src/lib/auth.ts` 中 `hashPassword`
- 密码校验：`server/src/lib/auth.ts` 中 `verifyPassword`
- 登录校验：`server/src/modules/auth/auth.service.ts` 中 `loginByPassword`

## 关键实现细节

`server/src/lib/auth.ts` 中使用如下约定：

- `ARGON2ID_ALGORITHM = 2`（对应 Argon2id）
- `ARGON2_OPTIONS = { algorithm: ARGON2ID_ALGORITHM }`
- 加密：`hash(password, ARGON2_OPTIONS)`
- 校验：`verify(passwordHash, password, ARGON2_OPTIONS)`

> 说明：`@node-rs/argon2` 生成的是 PHC 格式字符串，前缀通常为 `$argon2id$v=19$...`。

## 默认参数（未额外覆盖）

除 `algorithm` 外，其余参数使用库默认值：

- `memoryCost = 4096`
- `timeCost = 3`
- `parallelism = 1`
- `outputLen = 32`
- `version = 19`

## 写入逻辑

- 新建用户（`createUser`）时先调用 `hashPassword`，再写入 `user.password`
- 更新用户密码（`updateUser`）时同样先加密再写入

对应代码：
- `server/src/modules/user/user.service.ts`

## 登录校验逻辑

1. 根据账号（`username` 或数字 `id`）查询用户
2. 使用 `verifyPassword(明文密码, 数据库hash)` 做比对
3. 校验成功返回用户信息并签发 JWT
4. 校验失败统一返回 `Invalid account or password`

对应代码：
- `server/src/modules/auth/auth.service.ts`
- `server/src/modules/auth/auth.router.ts`
