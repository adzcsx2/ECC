# /ecc:network-interface-health

网络接口健康诊断：错误计数器分析、CRC、丢包、双工不匹配、端口抖动和速率协商。

---

## 功能

- 接口计数器参考：CRC、input errors、runts、giants、drops、resets、collisions 的根因分析
- 诊断流程：CRC/输入错误（双向对照、线缆/光纤更换）、丢包（区分入出、对比利用率）、双工速率（禁止混合固定/自适应）
- 安全解析器：按接口块切片而非固定字符窗口，避免大接口块导致计数错位
- 趋势分析：采集基线、等待间隔、对比增量，而非仅看绝对值
- 支持 Cisco IOS 和 Linux 主机（ip link、ethtool）

## 用法

- `/ecc:network-interface-health` - 排查物理链路、交换机端口、线缆或收发器引起的网络症状

## 适用场景

- 主机/VLAN 出现丢包、延迟峰值或间歇性可达性问题
- 交换机/路由器接口出现 CRC、runts、giants、丢包或抖动
- 更换硬件前需对比链路两端计数
- 变更窗口需要前后接口计数器证据

> 源文件：[SKILL.md](SKILL.md)
