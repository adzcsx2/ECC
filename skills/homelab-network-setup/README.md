# /ecc:homelab-network-setup

家庭实验室网络规划设计：网关选型、IP 规划、DHCP 预留、DNS 和布线方案。

---

## 功能

- 设备角色分离：互联网边缘 -> 网关/路由器 -> 交换机 -> 接入点 -> 服务器/客户端
- 网关选型指南：ISP 路由器、UniFi、OPNsense/pfSense、MikroTik、Linux 路由器对比
- IP 地址规划：避免与 VPN 冲突的 192.168.1.0/24，预留基础设施地址段
- DHCP 与 DNS 设计：静态预留、Pi-hole 集成、home.arpa 本地域名
- 布线及 Wi-Fi 最佳实践：有线回传优于 Mesh、PoE 供电、端口标记

## 用法

- `/ecc:homelab-network-setup` - 规划家庭或小实验室网络，包括设备角色、IP 规划、DHCP 和布线方案

## 适用场景

- 规划新的家庭网络或重设计 ISP 路由器为主的现有网络
- 选择网关、交换机和接入点角色
- 设计 IP 范围、DHCP 作用域、静态预留和 DNS
- 为未来的 VLAN、Pi-hole、NAS、VPN 做准备
- 排查双 NAT、Wi-Fi 不稳定等问题

> 源文件：[SKILL.md](SKILL.md)
