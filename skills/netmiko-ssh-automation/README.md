# /ecc:netmiko-ssh-automation

安全 Python Netmiko 网络自动化：只读信息采集、批量 SSH、TextFSM 解析和受保护的配置变更。

---

## 功能

- 只读连接模式：`send_command()` 采集 show 命令输出，设置连接超时和读取超时
- 批量并行采集：ThreadPoolExecutor 控制并发数，失败按设备报告不中断
- 结构化解析：通过 TextFSM/TTP/Genie 解析输出，保留原始数据作为验证证据
- 受保护的配置变更：需显式操作员标志（环境变量），变更前后抓取 running-config 证据
- 安全默认值：凭据通过环境变量或 getpass，不在源码中硬编码

## 用法

- `/ecc:netmiko-ssh-automation` - 编写或审查连接网络设备的 Python 自动化脚本

## 适用场景

- 批量采集路由器/交换机/防火墙的 show 命令输出
- 构建小型审计脚本用于接口、路由或配置证据收集
- 为网络 SSH 脚本添加超时和异常处理
- 在自动化触碰生产设备前进行安全审查

> 源文件：[SKILL.md](SKILL.md)
