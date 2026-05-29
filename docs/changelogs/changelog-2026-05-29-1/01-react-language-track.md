# 01 - React 语言轨道

## 提交

`04c68e48` — Add React language track with agents, skills, rules, and commands (#2024)

## 变更概要

| 维度 | 变化 |
|------|------|
| 新增文件 | 16 个（5 rules + 3 skills + 3 commands + 2 agents + 2 .kiro + 1 tests） |
| 修改文件 | 17 个（manifests、catalog、README、CLAUDE.md 等） |
| 总行数 | +3,642 / -68 |

## 变更前（Before）

- ECC 没有专门的 React 语言支持
- React 项目只能使用通用的 TypeScript rule（`rules/typescript/`）和 Web rule（`rules/web/`）
- 缺少 React 特定的 hooks 规则、JSX 规范、RSC 边界指导、Server Action 安全检查
- 没有 React 专用的 code review agent，所有 TSX/JSX 审查由 `typescript-reviewer` 负责
- 没有 React 专用的 build error resolver
- 没有 React TDD 测试命令

## 变更后（After）

新增完整的 React 语言轨道，包含 4 层：

### Rules（5 个文件）

| 文件 | 内容 |
|------|------|
| `rules/react/coding-style.md` | 文件扩展名规范、命名约定、JSX 语法、RSC 边界 |
| `rules/react/hooks.md` | hooks 使用规则、依赖数组、cleanup、memoization、React 19 新增 |
| `rules/react/patterns.md` | 容器/展示组件分离、状态位置决策树、Suspense + Error Boundary、表单、数据获取 |
| `rules/react/security.md` | dangerouslySetInnerHTML、不安全 URL scheme、Server Action 验证、环境变量泄漏、CSP |
| `rules/react/testing.md` | RTL 查询、userEvent、async、MSW、axe、反模式 |

所有 rule 文件继承 `rules/typescript/*` 和 `rules/common/*`。

### Skills（3 个）

| Skill | 内容 | 行数 |
|-------|------|------|
| `skills/react-patterns/SKILL.md` | React 18/19 惯用模式、hooks 纪律、状态位置决策树、Server/Client 组件边界、Suspense + Error Boundary、表单 action（React 19）、数据获取矩阵 | 341 行 |
| `skills/react-testing/SKILL.md` | React Testing Library + Vitest/Jest、查询优先级、userEvent、MSW 网络 mock、axe a11y 断言、RTL vs Playwright CT 边界、TDD 工作流 | 423 行 |
| `skills/react-performance/SKILL.md` | 70 条性能规则（源于 Vercel Labs react-best-practices MIT），覆盖 8 大类：waterfall、bundle size、server-side、client fetch、re-render、rendering、JS micro、advanced patterns | 574 行 |

### Agents（2 个）

| Agent | 职责 |
|-------|------|
| `agents/react-reviewer.md` | React 专属审查：hooks 规则、dangerouslySetInnerHTML、不安全 URL scheme、key prop、state mutation、derived-state-in-effect、Server/Client 组件边界、a11y、render 性能、Server Action 验证、环境变量泄漏。明确将泛型 TypeScript/async/Node 问题委托给 `typescript-reviewer`。两者应在 TSX/JSX PR 上同时调用 |
| `agents/react-build-resolver.md` | React build/bundler/runtime hydration 失败修复，跨 Vite、webpack、Next.js、CRA、Parcel、esbuild、Bun、Rsbuild。处理 JSX/TSX 编译错误、tsconfig 修复、Next.js App Router Server/Client 边界错误、hydration mismatch、React 副本重复、Tailwind/PostCSS pipeline |

### Commands（3 个）

| Command | 说明 |
|---------|------|
| `/react-review` | 调用 react-reviewer，列出 CRITICAL/HIGH/MEDIUM 规则分类和自动检查（eslint react-hooks + jsx-a11y、tsc --noEmit、npm audit） |
| `/react-build` | 调用 react-build-resolver，bundler 检测、常见失败模式、修复策略、停止条件 |
| `/react-test` | React TDD 工作流，RTL + Vitest/Jest，行为驱动查询，userEvent + MSW，axe a11y 断言，覆盖率目标 |

### 配套变更

- `agent.yaml`: 添加 3 个 skills 和 3 个 commands
- `config/project-stack-mappings.json`: `react` stack 从 `["common","typescript","web"]` 扩展为 `["common","typescript","web","react"]`，skills 数组增加 react-patterns/react-performance/react-testing/accessibility
- `docs/COMMAND-REGISTRY.json`: `totalCommands` 75 → 78，新增 3 个 command 条目
- `CLAUDE.md`: 新增 Skills 表格行 `*.tsx, *.jsx, components/** → react-patterns, react-testing`
- `AGENTS.md`、`README.md`、`docs/zh-CN/`: 项目结构概要更新
- `.kiro/`: 新增 `react-reviewer.json`、`react-reviewer.md`、`react-build-resolver.json`、`react-build-resolver.md`（Kiro IDE 格式）
- Catalog 计数同步：62 agents / 78 commands / 235 skills

### Review 反馈修复（PR 内）

| 级别 | 修复内容 |
|------|----------|
| CRITICAL | 移除误提交的 `.claude/session-aliases.json`（含 `__proto__` prototype-pollution fixture） |
| HIGH | `react-build-resolver.md` 中 bundler 检测从脆弱的 `test -o $(grep ...)` 改为显式 `{ ... \|\| grep -q ...; }` |
| HIGH | `react-build-resolver.md` 移除硬编码 `npm i react@^19`，改为版本无关的条件提示 |
| HIGH | `commands/react-review.md` 中 `tsc --noEmit` 增加 `[ -f tsconfig.json ] &&` 守卫 |
| MEDIUM | `rules/react/security.md` 修正 React 18 对 `javascript:` URL 的处理（仅是 dev 警告，非生产拦截） |
| MEDIUM | `rules/react/security.md` 修正 CRA 环境变量暴露描述（仅 `REACT_APP_*`、`NODE_ENV`、`PUBLIC_URL`） |
| MEDIUM | `skills/react-testing/SKILL.md` QueryClient 实例化提到 wrapper 闭包外（flaky test 修复） |
| MEDIUM | `skills/react-testing/SKILL.md` console.error spy 使用 `mockRestore()` + `try/finally` 防泄漏 |
