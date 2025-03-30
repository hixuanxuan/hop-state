import {useMemo, useRef} from 'react';

type AnyFunction = (...args: any[]) => any;

function useEvent<TCallback extends AnyFunction>(callback: TCallback): TCallback {
    // 使用 useRef 保存最新的回调，确保在调用时总是能获取到最新的函数
    const latestCallbackRef = useRef<TCallback>(callback);
    latestCallbackRef.current = callback;

    const stableCallback = useMemo(() => {
        return function (this: any) {
            return latestCallbackRef.current.apply(this, arguments as any);
        } as TCallback;
    }, []
    ); // 确保函数地址稳定不变

    return stableCallback;
}

export default useEvent;
