import type {Config} from 'jest';

const config: Config = {
    // 根层不跑测试，只负责转发
    projects: [
        '<rootDir>/packages/hopstate', // 1️⃣ 多包时再追加
    ],
};

export default config;
