# /ecc:flox-environments

基于 Nix 的声明式跨平台可复现开发环境，无需 sudo 即可管理系统级依赖。

---

## 功能

- 通过单一 TOML 清单（manifest.toml）定义项目级可复现环境，支持 macOS 和 Linux
- 管理系统级包（编译器、数据库、CLI 工具）与语言特定依赖的统一环境
- 包版本锁定、语义化版本范围、平台特定包选择、包冲突优先级解决
- on-activate hooks 自动化环境初始化（创建 venv、初始化数据库、安装依赖）
- 跨项目环境共享：git 提交 `.flox/` 目录即人人可用；推送到 FloxHub 远程复用
- AI agent 友好：agent 可通过 `flox install` 在项目中安装工具，无需 sudo 或污染系统

## 用法

- `/ecc:flox-environments` - 在需要搭建可复现开发环境、管理系统级依赖或解决"在我机器上能跑"问题时激活

## 适用场景

- 项目需要系统级包（编译器、数据库）与语言特定依赖共存
- 团队成员需要完全相同的开发环境配置
- 跨 macOS 和 Linux 的开发环境一致性
- AI agent 需要在无 sudo、无沙箱限制的环境中安装工具
- 新开发者一键加入开发流程（`git clone && flox activate`）

> 源文件：[SKILL.md](SKILL.md)
