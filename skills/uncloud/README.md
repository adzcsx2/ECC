# /ecc:uncloud

Uncloud 集群管理：部署服务、配置 Caddy 入口、管理机器与卷。

---

## 功能

- 去中心化集群：WireGuard 网状网络、无控制平面
- 服务部署：Compose 文件 + x-ports/x-caddy/x-machines 扩展
- Caddy 反向代理：自动 Let's Encrypt TLS 与外部设备路由
- 端口发布：HTTP/HTTPS/TCP/UDP 四种模式
- 零停机部署与滚动更新

## 用法

- `/ecc:uncloud` - 管理 Uncloud 自托管集群

## 适用场景

- 自托管 Docker 服务的集群管理
- 配置多域名 HTTPS 反向代理
- 将外部 LAN 设备通过集群代理暴露

> 源文件：[SKILL.md](SKILL.md)
