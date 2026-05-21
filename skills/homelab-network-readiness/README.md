# /ecc:homelab-network-readiness

家庭实验室网络变更前的准备清单：VLAN 划分、DNS 过滤和 VPN 远程访问的就绪评估。

---

## 功能

- 变更前收集完整的网络清单（互联网边缘、网关、交换机、Wi-Fi、地址规划、DNS/DHCP）
- VLAN 与信任区域规划模板（可信、服务器、IoT、访客、管理、VPN 六大区域）
- DNS 过滤部署就绪检查：Pi-hole 依赖化而非单点故障
- VPN 远程访问就绪评估：分隧道/全隧道/覆盖 VPN 三种模式选型
- 分阶段变更顺序：快照 -> 预留地址 -> 建新区域 -> 单客户端验证 -> 逐组迁移

## 用法

- `/ecc:homelab-network-readiness` - 在修改路由器、防火墙、DHCP 或 VPN 配置前进行就绪评估和变更规划

## 适用场景

- 准备将平面网络拆分为 VLAN 分区
- 将 DHCP 客户端迁移至 Pi-hole 等本地 DNS 解析器
- 添加 WireGuard 等远程 VPN 访问
- 审查变更是否会导致网络管理员被锁定
- 将非正式的网络计划转化为分阶段迁移方案

> 源文件：[SKILL.md](SKILL.md)
