# /ecc:homelab-wireguard-vpn

WireGuard VPN 服务端搭建、客户端配置、密钥管理和远程访问家庭网络。

---

## 功能

- 服务端搭建：Linux 上安装 WireGuard、密钥对生成、接口配置和 IP 转发启用
- 客户端配置：每设备独立密钥对、分隧道 vs 全隧道路由选择及 DNS 设置
- 密钥管理与自动化：Python 脚本生成密钥对、构建客户端和服务端配置
- DDNS 支持：Cloudflare 和 DuckDNS 动态 DNS 配置，确保持续可达
- 完整故障排查：握手状态检查、端口可达性、密钥匹配、路由配置验证

## 用法

- `/ecc:homelab-wireguard-vpn` - 搭建 WireGuard VPN 实现移动设备和笔记本电脑远程访问家庭网络

## 适用场景

- 在树莓派、Linux 主机或路由器上设置 WireGuard 服务端
- 生成 WireGuard 密钥对和编写 peer 配置文件
- 配置手机或笔记本电脑远程访问家庭网络
- 选择分隧道（仅家庭流量）和全隧道（全部流量）模式
- 排查 WireGuard 连接问题

> 源文件：[SKILL.md](SKILL.md)
