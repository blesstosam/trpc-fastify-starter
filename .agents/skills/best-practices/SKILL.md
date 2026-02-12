---
name: best-practices
description: 使用本仓库开发的最佳实践汇总，前后端都包含，在开发任何任务（代码开发）之前都需要参考该文档，做产品设计不需要参考该文档。
metadata:
  author: blesstosam
  version: "2026.02.11"
---

## 当需要安装新的依赖包(pkgname指包名)

- 如果是前端依赖包，使用`pnpm --filter ./client add ${pkgname}`
- 如果是后端依赖包，使用`pnpm --filter ./server add ${pkgname}`
- 如果是前端后端都要使用依赖包，在client里和server里都安装一遍

## 一些常用库的选择

- 处理时间使用`dayjs`
- 生成雪花id使用`@sapphire/snowflake`
- 生成随机唯一字符串使用`nanoid`
- 文件压缩使用`archiver`
- 处理docx文件使用`docx`
- 处理excel文件使用`exceljs`
- 解析csv文件使用`csv-parse`


---

## References

| Topic | Description | Reference |
|-------|-------------|-----------|
| 安装依赖 | 安装依赖遵循的规范 | [install-dep](references/install-dep.md) |
| 图标选择 | 当前端仓库需要使用图标，包含图标库的选择、图标的选择、搜索 | [install-dep](references/icon-suggest.md) |
