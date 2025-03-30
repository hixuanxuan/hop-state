---
id: introduction
title: hopstate 状态管理框架简介
sidebar_label: 简介
---

# hopstate 状态管理框架

## 简介

hopstate 是一个轻量级状态管理框架，支持深层更新、精准订阅以及中间件（Middleware）的扩展。其特点包括：

- **深层更新**：支持通过路径字符串（如 `"data.user.info"`）更新深层结构数据。
- **精准订阅**：可以订阅整个状态或单个分支变化，仅在所订阅数据发生改变时触发。
- **React Hook 集成**：提供 `useStore` Hook，在组件中使用时，当指定的 state 分支变化时自动重渲染组件。
- **Middleware 支持**：通过注册中间件扩展 dispatch 功能，支持 thunk 风格 action、日志记录、异步操作等。

## 安装

通过 npm 或 yarn 安装：

```bash
npm install hopstate
yarn add hopstate
pnpm add hopstate
```

## 快速上手
### 基础用法
创建一个全局状态管理的 store，并通过 actions 更新状态：
```tsx
// globalStore.ts
import { Store } from 'hopstate';

export type AppState = {
  count: number;
  user: {
    info: {
      name: string;
      age: number;
    }
  }
};

const initialState: AppState = {
  count: 0,
  user: {
    info: {
      name: '',
      age: 0,
    },
  },
};

// 定义 action（注意：action 内部第一个参数为 store 实例）
const actions = {
  increment: (store: Store<AppState>, amount: number) => {
    store.setState(prev => ({ ...prev, count: prev.count + amount }));
  },
  updateUserInfo: (store: Store<AppState>, newInfo: Partial<AppState['user']['info']>) => {
    // 直接更新 user.info 分支
    store.setState("user.info", prev => ({ ...prev, ...newInfo }));
  },
};

export const globalStore = new Store(initialState, actions);

// 调用 action 更新状态
globalStore.actions.increment(1);
globalStore.actions.updateUserInfo({ name: 'Alice', age: 25 });
```

### 在 React 组件中使用
直接在组件中利用 useStore Hook 订阅状态变化：
```tsx
// Counter.tsx
import React from 'react';
import { store } from './globalStore';

function Counter() {
  // 订阅 state 中 count 的变化
  const count = store.useStore(state => state.count);

  return (
    <div>
      <p>当前计数：{count}</p>
      <button onClick={() => store.actions.increment(1)}>增加</button>
    </div>
  );
}

export default Counter;
```
### 在非组件中使用
在普通 JavaScript 或 TypeScript 文件中，也可以通过订阅函数订阅 state 的变化：
```tsx
// nonComponentUsage.ts
import { store } from './store';

// 订阅 user.info 分支的变化，当改变时回调中会打印新旧值
const unsubscribe = store.subscribeSelector('user.info', (newInfo, oldInfo) => {
  console.log('用户信息更新：', oldInfo, '->', newInfo);
});

// 更新状态
store.setState("user.info", { name: 'Bob', age: 30 });

// 订阅整个状态的变化
const unsubscribeAll = store.subscribe(state => {
  console.log('全局状态变化：', state);
});

// 需要取消订阅时调用返回的取消函数
unsubscribe();
unsubscribeAll();
```

### 使用reducer
在复杂分支依旧是被推荐的解决方案，借助纯函数，定义了在不同 action 下如何演变状态，将相关的多个状态更新集中在一处处理，而不是在不同组件或副作用中零散地调用 set 导致逻辑分散。
```ts
export type AppAction =
  | { type: "INCREMENT"; payload: number }
  | { type: "DECREMENT"; payload: number }
  | { type: "SET_USER_NAME"; payload: string }
  | { type: "ASYNC_INCREMENT"; payload: number }
  | { type: "API_SET_TODOS"; payload: { id: number; text: string }[] };

// 定义 reducer 函数，根据 action 更新 state
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, counter: state.counter + action.payload };
    case "DECREMENT":
      return { ...state, counter: state.counter - action.payload };
    case "SET_USER_NAME":
      return { ...state, user: { ...state.user, name: action.payload } };
    case "ASYNC_INCREMENT":
      return { ...state, counter: state.counter + action.payload };
    case "API_SET_TODOS":
      return { ...state, todos: action.payload };
    default:
      return state;
  }
};

// 创建全局 store（无需 Provider），传入初始 state 及 reducer
export const store = new Store<AppState>(
  {
    counter: 0,
    user: { name: "Alice", age: 30 },
    todos: [],
  },
  appReducer
);

/**
 * 在普通函数中 dispatch 同步 action
 */
export function incrementCounter(amount: number) {
  store.dispatch({ type: "INCREMENT", payload: amount });
}

/**
 * 异步 Thunk 示例：dispatch 异步 action
 */
export function asyncIncrement(amount: number) {
  return (dispatch: Dispatch, getState: () => AppState) => {
    setTimeout(() => {
      dispatch({ type: "ASYNC_INCREMENT", payload: amount });
    }, 1000);
  };
}
// 调用 thunk：
store.dispatch(asyncIncrement(5));
```

### 注册middleware
通过注册 middleware，可以扩展 hopstate 的 dispatch 功能，实现日志记录、错误捕获、异步操作等功能。

## 示例

```typescript
// 定义 logger middleware，用于打印 action 和状态变化日志
const loggerMiddleware = ({ getState }) => next => action => {
  console.log('Action:', action);
  const result = next(action);
  console.log('更新后的状态:', getState());
  return result;
};

// 添加 middleware
store.addMiddleware(loggerMiddleware);

// 使用 thunk 风格 dispatch 异步操作
store.dispatch((dispatch, getState) => {
  setTimeout(() => {
    dispatch({ type: 'INCREMENT', payload: 5 });
  }, 1000);
});
```