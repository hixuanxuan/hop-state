import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
    // By default, Docusaurus generates a sidebar from the docs folder structure
    tutorialSidebar: [
        {
            type: 'doc',
            id: 'introduction', // 对应 docs/introduction.md 文件
        },
        {
            type: 'category',
            label: 'API 参考',
            items: [
                'api/store', // 对应 docs/api/store.md 文件
                'api/utils', // 对应 docs/api/utils.md 文件
            ],
        },
    ],
};

export default sidebars;
