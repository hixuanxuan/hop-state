import React, {useEffect, useState} from 'react';
import {Store} from 'hopstate';
import type {Middleware, Dispatch} from 'hopstate';
import './index.css';

interface AppState {
    counter: number;
    text: string;
    snapshots: Array<{time: string; counter: number; text: string}>;
}

const initialState: AppState = {
    counter: 1,
    text: '',
    snapshots: [],
};

const store = new Store<AppState>(
    initialState,
    {},
    (state, action: {type: string; payload: string | number | null}): AppState => {
        switch (action.type) {
            case 'INCREMENT':
                console.log('Incrementing counter by', action.payload);
                return {...state, counter: state.counter + (action.payload as number)};
            case 'DECREMENT':
                return {...state, counter: state.counter - (action.payload as number)};
            case 'RESET_COUNTER':
                return {...state, counter: 0};
            case 'UPDATE_TEXT':
                return {...state, text: action.payload as string};
            case 'GENERATE_SNAPSHOT':
                return {
                    ...state,
                    snapshots: [
                        ...state.snapshots,
                        {
                            time: new Date().toLocaleTimeString(),
                            counter: state.counter,
                            text: state.text,
                        },
                    ],
                };
            case 'CLEAR_SNAPSHOTS':
                return {...state, snapshots: []};
            default:
                return state;
        }
    }
);

// 添加一个 middleware 用于日志记录
const loggerMiddleware: Middleware<AppState> = api => (next: Dispatch<AppState>) => (action: any) => {
    console.log('Dispatching action:', action);
    const result = next(action);
    console.log('State after action:', api.getState());
    return result;
};

store.addMiddleware(loggerMiddleware);

// 定义 React 组件
export const DispatchDemo: React.FC = () => {
    // 使用 store.useStore 分别监听 counter、text 和 snapshots 分支的状态
    const counter = store.useStore('counter') as number;
    const text = store.useStore('text') as string;
    const snapshots = store.useStore('snapshots') as Array<{
        time: string;
        counter: number;
        text: string;
    }>;

    // 为文本输入提供局部 state
    const [localText, setLocalText] = useState(text);

    // 示例：组件挂载后 dispatch 一个 thunk action（模拟异步操作）
    useEffect(() => {
        store.dispatch((dispatch, getState) => {
            console.log('【Async Thunk Action】当前状态:', getState());
            // 模拟 500ms 后增加 2
            setTimeout(() => {
                dispatch({type: 'INCREMENT', payload: 2});
            }, 500);
        });
    }, []);

    // 各操作的 handler
    const handleIncrement = (amount: number) => {
        store.dispatch({type: 'INCREMENT', payload: amount});
    };

    const handleDecrement = (amount: number) => {
        store.dispatch({type: 'DECREMENT', payload: amount});
    };

    const handleReset = () => {
        store.dispatch({type: 'RESET_COUNTER', payload: 0});
    };

    const handleTextUpdate = () => {
        store.dispatch({type: 'UPDATE_TEXT', payload: localText});
    };

    const handleGenerateSnapshot = () => {
        store.dispatch({type: 'GENERATE_SNAPSHOT', payload: null});
    };

    const handleClearSnapshots = () => {
        store.dispatch({type: 'CLEAR_SNAPSHOTS', payload: null});
    };

    return (
        <div className="panel">
            <h1 className="header">Advanced Hopstate Dispatch Demo with Middleware</h1>

            {/* Counter 操作区域 */}
            <div className="section counter-section">
                <h2>Counter: {counter}</h2>
                <div>
                    <button className="button increment-button" onClick={() => handleIncrement(1)}>
                        +1
                    </button>
                    <button className="button increment-button" onClick={() => handleIncrement(10)}>
                        +10
                    </button>
                    <button className="button decrement-button" onClick={() => handleDecrement(1)}>
                        -1
                    </button>
                    <button className="button decrement-button" onClick={() => handleDecrement(5)}>
                        -5
                    </button>
                    <button className="button reset-button" onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </div>

            <div className="section text-section">
                <h2>Update Text</h2>
                <input
                    className="input"
                    type="text"
                    value={localText}
                    onChange={e => setLocalText(e.target.value)}
                    placeholder="Enter some text..."
                />
                <div>
                    <button className="button" onClick={handleTextUpdate}>
                        Update Text in Store
                    </button>
                </div>
                <p>
                    <strong>Current Text:</strong> {text}
                </p>
            </div>

            {/* 快照操作区域 */}
            <div className="section snapshot-section">
                <h2>Snapshot Operations</h2>
                <div>
                    <button className="button snapshot-button" onClick={handleGenerateSnapshot}>
                        Generate Snapshot
                    </button>
                    <button className="button clear-snapshot-button" onClick={handleClearSnapshots}>
                        Clear Snapshots
                    </button>
                </div>
                <div className="snapshot-container">
                    {snapshots.length === 0 ? (
                        <p>No snapshots created yet.</p>
                    ) : (
                        snapshots.map((snap, index) => (
                            <div key={index} className="snapshot-item">
                                <p>
                                    <strong>Snapshot {index + 1}</strong> - {snap.time}
                                </p>
                                <p>Counter: {snap.counter}</p>
                                <p>Text: {snap.text}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DispatchDemo;
