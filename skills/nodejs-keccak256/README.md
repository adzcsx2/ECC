# /ecc:nodejs-keccak256

防止 JS/TS 中以太坊哈希错误：Node 的 sha3-256 是 NIST SHA3，非以太坊 Keccak-256。

---

## 功能

- 核心警告：`crypto.createHash('sha3-256')` 输出与以太坊 Keccak-256 不一致，且 Node 不会报错
- 正确实现示例：使用 ethers v6、viem、web3.js 的 Keccak-256 辅助函数
- 常见模式：函数选择器、事件主题哈希、EIP-712 签名、Merkle 树、storage slot 计算
- 公钥到地址推导的正确 Keccak-256 用法
- 审计命令：grep 搜索项目中潜在的 `sha3-256` 误用

## 用法

- `/ecc:nodejs-keccak256` - 计算以太坊选择器、签名、存储槽或审查使用 Node crypto 直接哈希的代码

## 适用场景

- 在 JS/TS 中构建以太坊相关工具（函数选择器、事件主题、签名、Merkle 树）
- 审查任何使用 Node `crypto.createHash` 处理以太坊数据的代码
- 排查因哈希不匹配导致的选择器、签名或地址推导错误

> 源文件：[SKILL.md](SKILL.md)
