---
name: install-dep
description: 当需要安装一个新的依赖包的时候遵循该规范。
---

当需要安装新的依赖包(pkgname指包名)

1. 使用`pnpm view ${pkgname} version`命令获取包的最新版本
2. 如果是前端依赖包，使用`pnpm --filter ./client add ${pkgname}`，如果是后端依赖包，使用`pnpm --filter ./server add ${pkgname}`
