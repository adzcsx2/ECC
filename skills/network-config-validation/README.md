# /ecc:network-config-validation

网络配置部署前校验：危险命令检测、IP 重复和子网重叠、过期引用和安全管理面检查。

---

## 功能

- 危险命令检测：reload、erase、format、no router/interface、密钥变更等高风险操作
- IP 地址去重和子网重叠检测：遍历 interface 块提取 IP，比对重复和冲突
- 管理面安全：VTY 块 Telnet 检测、access-class 缺失、exec-timeout 检查
- 安全卫生：默认 SNMP community、SSH v1、明文密码、SNMPv3 authPriv 缺失
- 缺失最佳实践：NTP、日志时间戳、远程日志、登录横幅
- 可作为 Netmiko/Ansible 自动化推进前的阻断门禁

## 用法

- `/ecc:network-config-validation` - 部署变更前审查 Cisco IOS/IOS-XE 配置片段

## 适用场景

- 变更窗口前审查即将执行的配置命令
- 审计脚本或模板生成的网络配置
- 检查 ACL、route-map、prefix-list 是否有引用但未定义
- 构建网络自动化预检脚本，作为自动化推送前的安全门禁

> 源文件：[SKILL.md](SKILL.md)
