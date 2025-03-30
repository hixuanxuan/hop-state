---
id: store
title: Store API 详解
sidebar_label: Store
---

# Store 类 API

hopstate 的核心为 `Store` 类，提供了状态更新、订阅和 dispatch 等功能。

## 构造函数

```ts
constructor(
  initialState: S, 
  actions?: ActionsType<S>, 
  reducer?: (state: S, action: any) => S
)
```
* initialState：初始状态数据。
* actions：包含 action 函数对象，每个 action 的第一个参数自动绑定当前 store 实例。
* reducer：（可选）当希望使用 dispatch 进行 reducer 风格的状态更新时，可以传入该函数。


## 方法
### **getState()**
获取当前状态对象。
```ts
getState(): S;
```
### **setState()**
重载方法：
* 更新整个 state：
    **setState(newState | updater)**
* 针对深层路径更新部分 state：
    **setState(path, newValue | updater)**
```tsx
// 更新整个 state
store.setState(prev => ({ ...prev, count: prev.count + 1 }));

// 更新深层路径
store.setState("user.info", prev => ({ ...prev, name: 'Bob' }));
```

### **subscribe(callback)**
订阅整个 state 的变化，回调会在状态更新时触发。
```tsx
subscribe(callback: (state: S) => void): () => void;
```
### **subscribeSelector(selector, callback, isEqual?)**
订阅 state 中指定分支的变化。

* selector：可以为字符串路径或函数，获取 state 分支的值。
* callback：当订阅的值变化后触发。
* isEqual：自定义比较函数，默认使用严格相等。
```tsx
subscribeSelector<T>(
  selector: string | ((state: S) => T),
  callback: (newValue: T, oldValue: T) => void,
  isEqual?: (a: T, b: T) => boolean
): () => void;
```

### **useStore(selector?, isEqual?)**
React Hook 接口，在组件中使用，返回根据 selector 获取的 state 分支，当分支内容变化时组件自动重渲染。
```tsx
useStore<T = S>(
  selector?: string | ((state: S) => T),
  isEqual?: (a: T, b: T) => boolean
): T;
```
### **dispatch(action)**
支持两种 dispatch 方式：

* 如果 action 为函数，则视为 thunk，执行函数逻辑；
* 如果传入 reducer，则根据 reducer 更新 state；
* 未传入 reducer时，直接更新会提示警告。
```ts
dispatch(action: any): any;
```
### **addMiddleware(middleware)**
注册 middleware，并重建 dispatch 链。
```ts
addMiddleware(middleware: Middleware<S>): void;
```
middleware 的签名为：
```ts
({ getState, dispatch }) => (next: Dispatch) => (action: any) => any
```
