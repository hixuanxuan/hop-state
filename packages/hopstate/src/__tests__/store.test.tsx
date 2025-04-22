import React, {StrictMode} from 'react';
import {render, screen, act} from '@testing-library/react';
import {compose, Store} from '../index';

// ---------- helpers ----------
type CounterState = {count: number};

const reducer = (state: CounterState, action: any): CounterState =>
    action.type === 'inc' ? {count: state.count + 1} : state;

// ---------- unit tests ----------
describe('utils', () => {
    test('compose works right‑to‑left', () => {
        const add1 = (x: number) => x + 1;
        const mul2 = (x: number) => x * 2;
        expect(compose(add1, mul2)(3)).toBe(7); //  (3*2)+1
    });
});

describe('Store core', () => {
    test('setState whole vs path', () => {
        const store = new Store({a: {b: 1}});
        store.setState('a.b', 2);
        expect(store.getState()).toEqual({a: {b: 2}});

        const prev = store.getState();
        store.setState(s => ({...s, c: 3}));
        const next = store.getState();

        // 引用变化
        expect(next).not.toBe(prev);
        // 深层 a 没变引用
        expect(next.a).toBe(prev.a);
    });

    test('subscribeSelector only fires on real change', () => {
        const store = new Store<{x: number}>({x: 1});
        const spy = jest.fn();

        store.subscribeSelector('x', spy);
        store.setState('x', 1); // same value
        store.setState('x', 2); // different

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(2, 1);
    });

    test('dispatch with reducer & thunk', () => {
        const store = new Store<CounterState>({count: 0}, undefined, reducer);
        store.dispatch({type: 'inc'});
        expect(store.getState().count).toBe(1);

        store.dispatch((dispatch: any, getState: any) => {
            if (getState().count === 1) dispatch({ type: 'inc' });
        });
        expect(store.getState().count).toBe(2);
    });

    test('middleware intercepts action', () => {
        const calls: any[] = [];
        const logger =
            ({dispatch, getState}: any) =>
            (next: any) =>
            (action: any) => {
                calls.push(action);
                return next(action);
            };
        const store = new Store<CounterState>({count: 0}, undefined, reducer);
        store.addMiddleware(logger);
        store.dispatch({type: 'inc'});

        expect(calls).toEqual([{type: 'inc'}]);
        expect(store.getState().count).toBe(1);
    });
});

describe('useStore hook (React)', () => {
    test('component re-renders when slice changes', () => {
        const store = new Store<CounterState>({count: 0});

        function Counter() {
            const c = store.useStore<number>('count');
            return <span data-testid="out">{c}</span>;
        }

        render(
            <StrictMode>
                <Counter />
            </StrictMode>
        );

        // 初始
        expect(screen.getByTestId('out').textContent).toBe('0');

        // 更新
        act(() => store.setState('count', 5));
        expect(screen.getByTestId('out').textContent).toBe('5');
    });

    test('hydration snapshot matches (SSR simulation)', () => {
        const store = new Store<CounterState>({count: 42});
        function Counter() {
            const c = store.useStore<number>('count');
            return <span data-testid="hyd">{c}</span>;
        }

        const {container} = render(<Counter />);
        // 服务器快照字符串
        const ssrHTML = container.innerHTML;
        // 客户端再次 render（simulate hydrate）
        const {container: hydrated} = render(<Counter />);
        expect(hydrated.innerHTML).toBe(ssrHTML);
    });
});
