---
name: install-dep
description: 当需要安装一个新的依赖包的时候遵循该规范。
---

当需要安装新的依赖包(pkgname指包名)

- 如果是前端依赖包，使用`pnpm --filter ./client add ${pkgname}`
- 如果是后端依赖包，使用`pnpm --filter ./server add ${pkgname}`
- 如果是前端后端都要使用依赖包并且是运行时依赖，在client里和server里都安装一遍
- 如果是前端后端都要使用依赖包并且是开发时依赖，使用`pnpm add ${pkgname} -w`安装在根目录
