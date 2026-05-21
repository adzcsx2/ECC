# /ecc:opensource-pipeline

将私有项目安全开源：分叉、脱敏、打包三步流水线。

---

## 功能

- 三阶段流水线：Fork（剥离密钥） -> Sanitize（验证清洁） -> Package（生成文档）
- 自动检测并清除密钥、PII、内部引用
- 生成 CLAUDE.md、setup.sh、README、LICENSE 等开源配套文件
- 安全审查门禁：FAIL 则阻止发布

## 用法

- `/ecc:opensource fork PROJECT` - 完整开源流水线
- `/ecc:opensource verify PROJECT` - 单独运行安全审查
- `/ecc:opensource package PROJECT` - 单独生成打包文件

## 适用场景

- 将内部私有仓库准备为公开开源发布
- 发布前清除敏感信息和密钥
- 生成规范的开源项目配套文档

> 源文件：[SKILL.md](SKILL.md)
