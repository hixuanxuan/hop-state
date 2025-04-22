import type {Config} from 'jest';

const config: Config = {
    projects: [
        '<rootDir>/packages/hopstate', // 1️⃣ 多包时再追加
    ],
};

export default config;
