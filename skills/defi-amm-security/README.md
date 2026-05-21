# /ecc:defi-amm-security

Solidity AMM 合约安全检查清单，覆盖重入攻击、捐赠攻击、预言机操纵等核心漏洞。

---

## 功能

- 重入攻击防护：CEI（检查-效果-交互）顺序 + ReentrancyGuard + SafeERC20
- 捐赠/通胀攻击防护：内部追踪总资产而非依赖 `balanceOf(address(this))`
- 预言机操纵防护：使用 TWAP 而非即时价格
- 滑点保护：每次 swap 必须包含 `amountOutMin` 和 `deadline`
- 安全储备计算：使用 FullMath.mulDiv 避免溢出
- 审计工具链：Slither 静态分析、Echidna 模糊测试、Foundry Fuzz

## 用法

- `/ecc:defi-amm-security` - 编写或审查 Solidity 流动性池合约时获得安全检查指导

## 适用场景

- 编写或审计 Solidity AMM 或流动性池合约
- 实现 swap、deposit、withdraw、mint、burn 等持有代币余额的流程
- 审查任何使用 `token.balanceOf(address(this))` 计算份额或储备的合约

> 源文件：[SKILL.md](SKILL.md)
