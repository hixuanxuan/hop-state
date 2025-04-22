import type {Config} from 'jest';

const config: Config = {
    displayName: 'hopstate',
    rootDir: '.',
    preset: 'ts-jest',
    globals: {'ts-jest': {tsconfig: '<rootDir>/tsconfig.test.json'}},
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@hopstate/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
};

export default config;
