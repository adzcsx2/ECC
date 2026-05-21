# /ecc:safety-guard

防止破坏性操作的安全生产保护机制，三种安全模式可选。

---

## 功能

- 谨慎模式：拦截 rm -rf、git push --force、DROP TABLE 等危险命令并警告
- 冻结模式：锁定文件编辑范围到指定目录，阻止对目标目录外的写入
- 守卫模式：结合谨慎+冻结，适用于自主代理，允许全盘读取但仅限特定目录写入
- 所有被阻止的操作记录到 ~/.claude/safety-guard.log

## 用法

- `/ecc:safety-guard` - 在生产系统作业或代理自主运行时激活
- `/ecc:safety-guard freeze <目录>` - 冻结编辑范围
- `/ecc:safety-guard guard --dir <目录>` - 开启最大安全保护
- `/ecc:safety-guard off` - 解锁所有保护

## 适用场景

- 在生产系统上进行操作时防止误操作
- 代理在自主模式（full-auto）下运行时
- 限制代理只能编辑特定目录，避免修改无关代码
- 迁移、部署、数据变更等敏感操作期间

> 源文件：[SKILL.md](SKILL.md)
