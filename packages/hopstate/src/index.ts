import {useSyncExternalStore} from 'react';
import {Middleware, Dispatch} from './types';

/**
 * Compose 函数：将多个函数按从右往左的顺序合成一个链条
 */
export function compose(...funcs: Function[]): Function {
    if (funcs.length === 0) return (arg: any) => arg;
    if (funcs.length === 1) return funcs[0];
    return funcs.reduce(
        (a, b) =>
            (...args: any[]) =>
                a(b(...args))
    );
}

/**
 * 简单实现的 get 函数（类似于 lodash.get）
 * 从对象中根据路径字符串（如 "data.user.info"）取出对应的值
 */
function get(object: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let result = object;
    for (const key of keys) {
        if (result == null) return defaultValue;
        result = result[key];
    }
    return result === undefined ? defaultValue : result;
}

/**
 * updateIn 函数：在不改变原对象的前提下，通过深拷贝更新对象中指定路径的数据
 *
 * @param object 原对象
 * @param path 如 "data.user.info" 的路径
 * @param updaterOrValue 可以是值或 updater 函数（prev => newValue）
 * @returns 更新后的新对象
 */
function updateIn(object: any, path: string, updaterOrValue: any): any {
    const keys = path.split('.');
    if (keys.length === 0) {
        return typeof updaterOrValue === 'function' ? updaterOrValue(object) : updaterOrValue;
    }
    const key = keys[0];
    // 单层路径
    if (keys.length === 1) {
        const oldValue = object ? object[key] : undefined;
        const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(oldValue) : updaterOrValue;
        if (object && newValue === oldValue) return object;
        return {...(object || {}), [key]: newValue};
    }
    // 多层路径，递归更新
    const oldChild = object ? object[key] : {};
    const newChild = updateIn(oldChild, keys.slice(1).join('.'), updaterOrValue);
    if (object && newChild === oldChild) return object;
    return {...(object || {}), [key]: newChild};
}

/**
 * 定义 actions 类型，每个 action 接收 store 实例及其他参数
 */
export type ActionCreator<S> = (store: Store<S>, ...args: any[]) => any;
export type ActionsType<S> = Record<string, ActionCreator<S>>;

/**
 * 内部订阅记录类型，每个订阅记录保存选择器、当前选中值、回调以及比较函数
 */
interface SubscriberRecord<S> {
    selector: (state: S) => any;
    callback: (newValue: any, oldValue: any) => void;
    currentSlice: any;
    isEqual: (a: any, b: any) => boolean;
}

/**
 * Store 类：
 *  - 支持 setState 时传入深层路径更新（如 store.setState("data.user.info", newInfo)）。
 *  - 支持在构造时传入 actions 对象，action 内均可以直接获取 store 并调用异步逻辑更新状态。
 *  - 内部支持 subscribe、useStore（React Hook）等方法实现精准更新订阅。
 *  - 提供 middleware 注册和 dispatch 链，dispatch 可用于 thunk 风格的 action。
 */
export class Store<S> {
    private state: S;
    private subscribers: Set<SubscriberRecord<S>> = new Set();
    private finalizer: FinalizationRegistry<SubscriberRecord<S>>;
    // 通过 actions 更新状态（无需 reducer）
    public actions: ActionsType<S>;

    // middleware 支持，及 dispatch 用于组合中间件执行 thunk、转换 action 等
    private middlewares: Middleware<S>[] = [];
    private dispatchFunc: Dispatch;
    private reducer?: (state: S, action: any) => S; // 如果传入 reducer，则支持 plain object action

    constructor(initialState: S, actions?: ActionsType<S>, reducer?: (state: S, action: any) => S) {
        this.state = initialState;
        this.actions = actions ? this.bindActions(actions) : ({} as ActionsType<S>);
        this.reducer = reducer;
        this.dispatchFunc = this.baseDispatch();
        this.finalizer = new FinalizationRegistry(sub => {
            this.subscribers.delete(sub);
        });
    }

    /**
     * 内部方法，将 actions 中的每个函数绑定当前 store 实例，
     * 使调用时第一个参数自动为 store。
     */
    private bindActions(actions: ActionsType<S>): ActionsType<S> {
        const boundActions: ActionsType<S> = {} as any;
        for (const key in actions) {
            const fn = actions[key];
            boundActions[key] = (...args: any[]) => {
                return fn(this, ...args);
            };
        }
        return boundActions;
    }

    /**
     * 获取当前 state
     */
    getState(): S {
        return this.state;
    }

    /**
     * 重载 setState 方法：
     *
     * 1. 可直接传入新的 state 或 updater 函数更新整个 state：
     *    store.setState(newState) 或 store.setState(prev => newState)
     *
     * 2. 或传入深层路径和对应更新内容更新部分 state：
     *    store.setState("data.user.info", newInfo) 或 store.setState("data.user.info", prev => newInfo)
     */
    setState(update: S | ((prev: S) => S)): void;
    setState<T>(path: string, update: T | ((prev: T) => T)): void;
    setState(arg1: any, arg2?: any): void {
        let newState: S;
        if (typeof arg1 === 'string' && arg2 !== undefined) {
            newState = updateIn(this.state, arg1, arg2);
        } else {
            newState = typeof arg1 === 'function' ? arg1(this.state) : arg1;
        }
        if (newState === this.state) return;
        this.state = newState;
        this.notifySubscribers();
    }

    /**
     * 内部方法：通知所有订阅者，仅当订阅的 state 分支值发生变化时才调用回调
     */
    private notifySubscribers(): void {
        this.subscribers.forEach(subscriber => {
            const nextSlice = subscriber.selector(this.state);
            if (!subscriber.isEqual(subscriber.currentSlice, nextSlice)) {
                const previous = subscriber.currentSlice;
                subscriber.currentSlice = nextSlice;
                subscriber.callback(nextSlice, previous);
            }
        });
    }

    /**
     * 将 selector 标准化：如果为字符串则返回一个利用 get 的函数，否则直接返回
     */
    static normalizeSelector<S>(selector: string | ((state: S) => any)): (state: S) => any {
        if (typeof selector === 'string') {
            return (state: S) => get(state, selector);
        }
        if (typeof selector !== 'function') {
            return (state: S) => state;
        }
        return selector;
    }

    /**
     * 订阅 state 中指定分支的变化（支持字符串路径或选择函数）
     * 当选中的值发生变化时，调用 callback(newValue, oldValue)
     */
    subscribeSelector<T>(
        selector: string | ((state: S) => T),
        callback: (newValue: T, oldValue: T) => void,
        isEqual: (a: T, b: T) => boolean = (a, b) => a === b
    ): () => void {
        const normSelector = Store.normalizeSelector<S>(selector);
        const currentSlice: T = normSelector(this.state);
        const subscriber: SubscriberRecord<S> = {
            selector: normSelector,
            callback,
            currentSlice,
            isEqual,
        };
        this.subscribers.add(subscriber);
        this.finalizer.register(callback, subscriber); // GC hook
        return () => {
            this.subscribers.delete(subscriber);
        };
    }

    /**
     * 订阅整个 state 的变化（内部实现就是 subscribeSelector(state => state, callback)）
     */
    subscribe(callback: (state: S) => void): () => void {
        return this.subscribeSelector(state => state, callback);
    }

    /**
     * React Hook 接口：直接在组件中使用，无需 Provider。
     * 传入 selector（字符串或函数）用于选取需要订阅的 state 分支，
     * 当该分支值发生变化时组件会自动重渲染。
     */
    useStore<T = S>(
        selector: string | ((state: S) => T) = (state: S) => state as unknown as T,
        isEqual: (a: T, b: T) => boolean = (a, b) => a === b
    ): T {
        const normSelector = Store.normalizeSelector(selector);

        return useSyncExternalStore(
            /* subscribe：把 React 传进来的 onStoreChange 交给内部订阅系统 */
            onStoreChange => this.subscribeSelector(normSelector, onStoreChange, isEqual),
            /* getSnapshot：返回当前 slice；只要引用不变就不会重渲 */
            () => normSelector(this.state),
            /* getServerSnapshot：SSR 首屏用；客户端 hydrate 后会被替换 */
            () => normSelector(this.state)
        );
    }

    /**
     * Base dispatch 函数：
     *  - 如果 action 为函数，则视为 thunk，直接调用。
     *  - 如果使用 reducer 模式，则根据 reducer 更新 state。
     *  - 否则（不使用 reducer）打印警告，提示直接使用 store.setState。
     */
    private baseDispatch(): Dispatch {
        return (action: any): any => {
            if (typeof action === 'function') {
                return action(this.dispatch.bind(this), this.getState.bind(this));
            }
            if (this.reducer) {
                const newState = this.reducer(this.state, action);
                this.setState(newState);
                return action;
            }
            console.warn('Dispatch plain object is not supported without a reducer. Use store.setState instead.');
            return action;
        };
    }

    /**
     * dispatch 方法：通过 middleware 链处理 action
     */
    dispatch(action: any): any {
        return this.dispatchFunc(action);
    }

    /**
     * 注册 middleware，并重建 dispatch 链。
     */
    addMiddleware(middleware: Middleware<S>): void {
        this.middlewares.push(middleware);
        this.rebuildDispatchChain();
    }

    /**
     * 重建 middleware chain，用 compose 组合各个 middleware。
     */
    private rebuildDispatchChain() {
        this.dispatchFunc = compose(
            ...this.middlewares.map(mw =>
                mw({
                    getState: this.getState.bind(this),
                    dispatch: this.dispatch.bind(this),
                })
            )
        )(this.baseDispatch());
    }
}
