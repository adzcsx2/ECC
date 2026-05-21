# /ecc:quarkus-verification

Quarkus 项目完整验证循环：构建、静态分析、测试覆盖率、安全扫描、原生编译和差异审查。

---

## 功能

- Phase 1-3：Maven 构建、静态分析（Checkstyle/PMD/SpotBugs）、测试 + JaCoCo 覆盖率（80%+）
- Phase 4：依赖 CVE 扫描、Quarkus 扩展审计、OWASP ZAP API 安全测试
- Phase 5：GraalVM 原生编译和镜像测试（启动时间 <100ms）
- Phase 6：K6 性能负载测试和指标监控
- Phase 7：健康检查验证（liveness、readiness、metrics）
- Phase 8：容器镜像构建和 Trivy/Grype 安全扫描
- Phase 9-10：配置验证和文档审查（OpenAPI/Swagger）
- 全套自动化脚本和 GitHub Actions CI/CD 集成模板

## 用法

- `/ecc:quarkus-verification` - 在 PR 前、重大变更后和预部署时运行完整验证

## 适用场景

- 为 Quarkus 服务开启 Pull Request 前
- 重大重构或依赖升级后
- Staging 或生产环境预部署验证
- 运行构建 -> lint -> 测试 -> 安全扫描 -> 原生编译全管线
- 验证测试覆盖率是否达标

> 源文件：[SKILL.md](SKILL.md)
