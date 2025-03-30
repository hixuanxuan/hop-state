/**
 * Action 的基础类型
 */
export type Action = { type: string; payload?: any };

/**
 * Dispatch 类型（支持普通 action、以及 thunk）
 */
export type Dispatch = (action: any) => any;

/**
 * Middleware API 类型，提供 getState 与 dispatch
 */
export type MiddlewareAPI<S> = {
  getState: () => S;
  dispatch: Dispatch;
};

/**
 * Middleware 类型
 */
export type Middleware<S> = (
  api: MiddlewareAPI<S>
) => (next: Dispatch) => Dispatch;