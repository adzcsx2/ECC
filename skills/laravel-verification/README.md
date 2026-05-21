# /ecc:laravel-verification

Laravel 项目验证流水线：环境检查、静态分析、测试覆盖率、安全扫描和部署就绪检查。

---

## 功能

- 七阶段顺序验证（环境 -> Composer -> Lint/静态分析 -> 测试 -> 安全 -> 迁移 -> 部署就绪）
- Laravel Pint 代码格式检查和 PHPStan 静态分析
- 测试运行和覆盖率检查（80%+）
- Composer 安全审计（composer audit）
- 迁移审查、缓存预热、队列和调度器检查

## 用法

- `/ecc:laravel-verification` - PR 前、重构后或部署前运行完整的验证流水线

## 适用场景

- 提交 Laravel PR 前运行完整检查
- 重大重构或依赖升级后验证
- 部署到 staging 或生产环境前的就绪检查
- 运行 lint -> test -> security -> deploy 完整管道

> 源文件：[SKILL.md](SKILL.md)
