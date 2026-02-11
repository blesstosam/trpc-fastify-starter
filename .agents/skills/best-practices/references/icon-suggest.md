---
name: icon-suggest
description: 从图标包中挑选出最相关的图标，以象征某种概念或适应特定的用户界面布局。我擅长跨文化、符号学、科学和设计领域的象征意义解读及心理联想。
---


## 优先尝试使用lucide图标库（因为我已经安装好了@iconify-json/lucide）

- 通过 https://lucide.dev/icons 来搜索合适的图标，搜索的时候提供多种相关的单词，要确保图标真实存在
- 使用unplugin-icons渲染图标，使用示例：`import IconBomb from '~icons/lucide/atom'`，其中`atom`为你搜索到的图标名称

## 如果在lucide图标库里没有找到你认为合适的图标

1. 尝试使用`https://icon-sets.iconify.design/?query=${xx}`来查找合适的图标
2. 找到图标名称，如`ph:file-zip-fill`，你要先检查一下是否安装了`@iconify-json/ph`，如果没有需要安装该依赖，然后使用unplugin-icons的方式引入图标
