---
id: utils
title: 工具函数
sidebar_label: Utils
---

# 工具函数

hopstate 提供了几个辅助函数用于状态更新和函数组合。

## compose

将多个函数从右到左组合成一个链条。

```typescript
function compose(...funcs: Function[]): Function;
```
