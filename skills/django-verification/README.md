# /ecc:django-verification

Django 项目验证循环：迁移检查、代码质量、测试覆盖率、安全扫描和部署就绪检查。

---

## 功能

- 12 阶段验证流水线：环境检查 -> 代码质量 -> 迁移 -> 测试+覆盖率 -> 安全扫描 -> Django 命令 -> 性能 -> 静态资源 -> 配置审查 -> 日志 -> API 文档 -> Diff 审查
- 代码质量：mypy 类型检查、ruff lint、black 格式化、isort 导入排序
- 安全扫描：pip-audit、safety、bandit、gitleaks secrets 检测
- 性能检查：N+1 查询检测、数据库索引审查
- CI 集成：GitHub Actions 完整流水线示例
- 结构化输出模板：每个阶段的通过/失败状态和详细报告

## 用法

- `/ecc:django-verification` - PR 前、重大更改后或部署前运行完整验证流水线

## 适用场景

- 打开 Django 项目 PR 之前
- 模型更改、迁移更新或依赖升级之后
- 部署到 staging 或生产环境之前的预检

> 源文件：[SKILL.md](SKILL.md)
