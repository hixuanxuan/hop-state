import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <h1 className="hero__title">{siteConfig.title || 'HopState'}</h1>
                <p className="hero__subtitle">
                    轻量级状态管理框架 — 原子化更新、精准订阅、灵活扩展
                </p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg ripple"
                        to="/docs/introduction"
                    >
                        快速开始
                    </Link>
                    <Link
                        className="button button--primary button--lg ripple"
                        to="https://github.com/your-gh-account/hopstate"
                    >
                        GitHub
                    </Link>
                </div>
            </div>
        </header>
    );
}

type FeatureProps = {
    title: string;
    description: string;
};

function Feature({ title, description }: FeatureProps) {
    return (
        <div className={clsx('col col--4', styles.feature)}>
            <div className="text--center">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}

function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    <Feature
                        title="深层数据更新"
                        description="支持通过字符串路径精确更新深层嵌套状态数据。"
                    />
                    <Feature
                        title="精准订阅"
                        description="仅订阅必需的数据变更，避免不必要的组件重渲染。"
                    />
                    <Feature
                        title="中间件扩展"
                        description="轻松扩展 dispatch 功能，实现日志、异步更新等高级特性。"
                    />
                </div>
            </div>
        </section>
    );
}

export default function Home(): React.ReactElement {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`欢迎使用 ${siteConfig.title}`}
            description="HopState：轻量级状态管理框架，专注于精准高效的状态更新"
        >
            <HomepageHeader />
            <main>
                <HomepageFeatures />
            </main>
        </Layout>
    );
}
