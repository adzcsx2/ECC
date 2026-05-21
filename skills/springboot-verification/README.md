# /ecc:springboot-verification

Spring Boot 验证循环：构建、静态分析、测试、安全扫描、差异审查。

---

## 功能

- 六阶段验证：构建 -> 静态分析 -> 测试 -> 安全 -> 格式化 -> 差异审查
- Maven/Gradle 双构建系统支持
- SpotBugs/PMD/Checkstyle 静态分析
- OWASP 依赖检查 CVE 扫描
- 结构化验证报告输出

## 用法

- `/ecc:springboot-verification` - 发布前运行完整验证流水线

## 适用场景

- PR 前质量门禁
- 重大重构或依赖升级后的全面检查
- 预部署验证

> 源文件：[SKILL.md](SKILL.md)
