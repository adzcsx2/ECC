# /ecc:homelab-pihole-dns

Pi-hole 安装、封锁列表管理、DNS-over-HTTPS 配置与家庭网络 DNS 故障排查。

---

## 功能

- Docker 和裸机两种安装方式，含静态 IP 配置和容器化部署完整步骤
- 封锁列表管理：推荐列表添加、误封白名单、实时查询日志监控
- DNS-over-HTTPS (DoH) 上游配置：通过 cloudflared 加密 DNS 查询
- 本地 DNS 记录：为 NAS、Grafana、Proxmox 等服务创建可解析域名
- 全面故障排查：状态检查、域名查询测试、封锁列表更新、实时日志监控

## 用法

- `/ecc:homelab-pihole-dns` - 安装和配置 Pi-hole 进行家庭网络范围的 DNS 广告拦截

## 适用场景

- 在树莓派或 Linux 主机上安装 Pi-hole
- 将 Pi-hole 配置为家庭网络的 DNS 服务器
- 添加或管理封锁列表
- 设置 DNS-over-HTTPS 上游解析器
- 创建本地 DNS 记录
- 排查安装 Pi-hole 后设备断网问题

> 源文件：[SKILL.md](SKILL.md)
