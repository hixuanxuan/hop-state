import {Store} from 'hopstate';
import DispatchDemo from './components/DispatchDemo'

// 定义全局 state 类型
interface AppState {
    counter: number;
    user: {
        name: string;
        details: {
            age: number;
        };
    };
    theme: 'light' | 'dark';
}

// 初始 state
const initialState: AppState = {
    counter: 0,
    user: {
        name: 'John Doe',
        details: {age: 30},
    },
    theme: 'light',
};

// 定义 actions 对象
const actions = {
    increment: (store: Store<AppState>) => {
        store.setState(prev => ({...prev, counter: prev.counter + 1}));
    },
    reset: (store: Store<AppState>) => {
        store.setState(prev => ({...prev, counter: 0}));
    },
    updateUserName: (store: Store<AppState>, name: string) => {
        store.setState('user.name', name);
    },
    updateUserAge: (store: Store<AppState>, age: number) => {
        store.setState('user.details.age', age);
    },
    asyncIncrement: (store: Store<AppState>) => {
        setTimeout(() => {
            store.setState(prev => ({...prev, counter: prev.counter + 1}));
        }, 500);
    },
};

// 创建全局 store 实例
export const store = new Store<AppState>(initialState, actions);

// CounterPanel 组件，测试 counter 相关操作
function CounterPanel() {
    const counter = store.useStore('counter');
    return (
        <div className="panel">
            <h2>Counter Panel</h2>
            <div className="counter-display">{counter}</div>
            <button onClick={store.actions.increment}>Increment</button>
            <button onClick={store.actions.asyncIncrement}>Async Increment</button>
            <button onClick={store.actions.reset}>Reset</button>
        </div>
    );
}

const UserName = () => {
    const name = store.useStore('user.name');
    console.log('===>render userName', name);
    return (
        <div className="form-group">
            <label>Name: </label>
            <input
                type="text"
                value={name}
                onChange={e => {
                    store.actions.updateUserName(e.target.value);
                }}
            />
        </div>
    );
};
const UserAge = () => {
    const age = store.useStore('user.details.age');
    console.log('===>render userAge', age);
    return (
        <div className="form-group">
            <label>Age: </label>
            <input
                type="number"
                value={age}
                onChange={e => {
                    const newAge = Number(e.target.value);
                    store.actions.updateUserAge(newAge);
                }}
            />
        </div>
    );
};
// UserPanel 组件，测试深层路径更新（user.name 与 user.details.age）
function UserPanel() {
    return (
        <div className="panel">
            <h2>User Panel</h2>
            <UserName />
            <UserAge />
        </div>
    );
}

// ThemePanel 组件，切换 light/dark 主题
function ThemePanel() {
    const theme = store.useStore<string>('theme');
    return (
        <div className="panel">
            <h2>Theme Panel</h2>
            <p>
                Current Theme: <strong>{theme}</strong>
            </p>
            <button onClick={() => {
                 store.setState('theme', (prev: 'light' | 'dark') => (prev === 'light' ? 'dark' : 'light'));
            }}>Toggle Theme</button>
        </div>
    );
}

// DebugPanel 组件，展示完整 state
function DebugPanel() {
    const state = store.useStore();
    return (
        <div className="panel">
            <h2>Debug Panel</h2>
            <pre>{JSON.stringify(state, null, 2)}</pre>
        </div>
    );
}

// 主 App 组件，根据主题设置不同 class
function App() {
    const theme = store.useStore('theme');
    return (
        <div className={`app-container ${theme}`}>
            <header>
                <h1>Hopstate Demo</h1>
                <p>演示深层更新、精准订阅与 middleware 等功能</p>
            </header>
            <main>
                <CounterPanel />
                <UserPanel />
                <ThemePanel />
                <DebugPanel />
                <DispatchDemo />
            </main>
        </div>
    );
}

export default App;
