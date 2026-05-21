# /ecc:homelab-vlan-segmentation

家庭网络 VLAN 隔离：IoT、访客、可信和服务流量划分，含三大平台配置示例。

---

## 功能

- VLAN 设计模板：Trusted/IoT/Servers/Guest/Management 五区方案，含子网和网关规划
- 三大平台配置：UniFi（控制器创建网络和 SSID 映射）、pfSense/OPNsense（接口分配和防火墙规则）、MikroTik（桥接 VLAN 过滤）
- 防火墙规则模式：默认拒绝跨 VLAN、IoT 仅允许 DNS 和特定服务、访客仅互联网
- Trunk 端口与 Access 端口详解：交换机上联、AP 连接、终端设备连接的不同配置
- 反模式警示：创建 VLAN 不加防火墙规则、Pi-hole 位于 IoT 网络等常见错误

## 用法

- `/ecc:homelab-vlan-segmentation` - 在 UniFi/pfSense/MikroTik 上配置 VLAN 实现网络隔离

## 适用场景

- 首次在家庭网络上设置 VLAN
- 将 IoT 设备与可信设备隔离
- 创建无法访问家庭设备的访客 Wi-Fi
- 配置 Trunk 端口和 SSID 到 VLAN 的映射
- 排查跨 VLAN 路由或防火墙规则问题

> 源文件：[SKILL.md](SKILL.md)
